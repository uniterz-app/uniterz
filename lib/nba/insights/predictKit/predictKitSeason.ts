/**
 * 予想の材料の入力（Firestore だけ・BDL なし）:
 * - 今季の開始済みレギュラー終了試合（`games` を 7 項目だけ select）+ 前季の締め（`nbaPredictKitPriorFinal`・1 回だけ作る）→ シーズン状態
 * - ガベージタイム抜きの点差（`nbaGameCleanRatings` を 6 項目だけ select）→ 実力差の今季分を相手補正込みで差し替え
 * - 欠場（`nbaTeamInjuries`）× 欠場の影響（`nbaPlayerOutImpact` 今季・前季）
 * - 得点王の候補: ロスター + 前季平均（`nbaPlayerSeasonMetrics` の pts だけ）+ 上位 6 人の今季試合ログ
 */
import { Timestamp, type Firestore } from "firebase-admin/firestore";
import { previousNbaSeasonKey } from "@/lib/rankings/nbaSeason";
import { loadTeamInjuriesSnapshot } from "@/lib/nba/teamInjuries/loadTeamInjuriesSnapshot";
import { loadPlayerOutImpactBundle } from "@/lib/nba/injuryImpact/ingestNbaPlayerOutImpact";
import { resolvePlayerOutImpact } from "@/lib/nba/injuryImpact/resolvePlayerOutImpact";
import type { NbaPlayerOutImpactBundle } from "@/lib/nba/injuryImpact/playerOutImpactTypes";
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import {
  emptyPredictKitSeason,
  finalizePredictKitSeason,
  recordPredictKitGame,
  withCleanSosStrength,
  type PredictKitFinalGame,
  type PredictKitInjury,
  type PredictKitSeasonFinal,
  type PredictKitSeasonState,
} from "@/lib/nba/insights/predictKit/predictKit";
import type { ProInsightPredictKitAbsence } from "@/lib/nba/insights/predictKit/predictKitTypes";
import {
  PREDICT_KIT_SCORER_PLAY_PROB,
  predictKitScorerSeasonMu,
  type PredictKitScorerPlayer,
} from "@/lib/nba/insights/predictKit/predictKitScorers";

export const PREDICT_KIT_GAME_FIELDS = [
  "status",
  "homeScore",
  "awayScore",
  "seasonPhase",
  "homeTeamId",
  "awayTeamId",
  "startAtJst",
] as const;

export const etDateOf = (ms: number) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date(ms));

function startMsOf(g: Record<string, unknown>): number | null {
  const ts = g.startAtJst as { toMillis?: () => number } | undefined;
  return ts && typeof ts.toMillis === "function" ? ts.toMillis() : null;
}

/** レギュラーの終了試合（同じ 2 チーム・同じ東部暦日の重複 doc は 1 試合）を日付順に。`beforeMs` で開始前の試合を読まない */
export async function loadPredictKitFinalGames(
  db: Firestore,
  seasonKey: string,
  beforeMs?: number
): Promise<PredictKitFinalGame[]> {
  let q = db.collection("games").where("league", "==", "nba").where("season", "==", seasonKey);
  if (beforeMs != null) q = q.where("startAtJst", "<", Timestamp.fromMillis(beforeMs));
  const snap = await q.select(...PREDICT_KIT_GAME_FIELDS).get();
  const seen = new Set<string>();
  const out: PredictKitFinalGame[] = [];
  for (const d of snap.docs) {
    const g = d.data() as Record<string, unknown>;
    if (g.status !== "final" || g.seasonPhase !== "regular") continue;
    const homeScore = Number(g.homeScore);
    const awayScore = Number(g.awayScore);
    const ms = startMsOf(g);
    if (!(homeScore > 0 && awayScore > 0) || ms == null) continue;
    const date = etDateOf(ms);
    const key = `${g.homeTeamId}|${g.awayTeamId}|${date}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ date, homeTeamId: String(g.homeTeamId), awayTeamId: String(g.awayTeamId), homeScore, awayScore });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/** 前季の締め（チームごとの平均得失点差など）。終わった季は変わらないので 1 回だけ作って保存する */
export const PREDICT_KIT_PRIOR_FINAL_COLLECTION = "nbaPredictKitPriorFinal";
/** これ以上レギュラーの終了試合がある季だけ保存する（1,230 試合。途中の季は毎回作り直す） */
const PRIOR_FINAL_CACHE_MIN_GAMES = 1200;

export async function loadPredictKitPriorFinal(
  db: Firestore,
  priorKey: string
): Promise<PredictKitSeasonFinal | null> {
  const ref = db.collection(PREDICT_KIT_PRIOR_FINAL_COLLECTION).doc(priorKey);
  const cached = (await ref.get()).data() as { final?: PredictKitSeasonFinal } | undefined;
  if (cached?.final) return cached.final;
  const games = await loadPredictKitFinalGames(db, priorKey);
  if (!games.length) return null;
  const prior = emptyPredictKitSeason(priorKey, null);
  for (const g of games) recordPredictKitGame(prior, g);
  const final = finalizePredictKitSeason(prior);
  if (games.length >= PRIOR_FINAL_CACHE_MIN_GAMES) {
    await ref.set({ final, games: games.length, builtAtMs: Date.now() });
  }
  return final;
}

/** `nbaGameCleanRatings` のホーム視点のガベージタイム抜き点差（`date|home|away` → 点）。集計外（incomplete）は除く */
export async function loadPredictKitCleanMargins(db: Firestore, seasonKey: string): Promise<Map<string, number>> {
  const snap = await db
    .collection("nbaGameCleanRatings")
    .where("seasonKey", "==", seasonKey)
    .select("date", "homeTeamId", "awayTeamId", "status", "home.clean.pts", "away.clean.pts")
    .get();
  const out = new Map<string, number>();
  for (const d of snap.docs) {
    const g = d.data() as {
      date?: string;
      homeTeamId?: string;
      awayTeamId?: string;
      status?: string;
      home?: { clean?: { pts?: number } };
      away?: { clean?: { pts?: number } };
    };
    const h = g.home?.clean?.pts;
    const a = g.away?.clean?.pts;
    if (g.status === "incomplete" || typeof h !== "number" || typeof a !== "number") continue;
    out.set(`${g.date}|${g.homeTeamId}|${g.awayTeamId}`, h - a);
  }
  return out;
}

export type PredictKitSeasonStates = {
  /** 平均得失点差そのまま（裏の比較用） */
  raw: PredictKitSeasonState;
  /** 実力差の今季分をガベージタイム抜き + 相手補正に差し替えた本番用 */
  cleanSos: PredictKitSeasonState;
  /** ガベージタイム抜きの点差があった試合 / 今季の終了試合 */
  cleanGames: number;
  games: number;
};

/** 前季の締めを prior に、今季を今日まで再生した状態（本番用と比較用） */
export async function loadPredictKitSeasonStates(
  db: Firestore,
  seasonKey: string,
  nowMs = Date.now()
): Promise<PredictKitSeasonStates> {
  const [prior, games, clean] = await Promise.all([
    loadPredictKitPriorFinal(db, previousNbaSeasonKey(seasonKey)),
    loadPredictKitFinalGames(db, seasonKey, nowMs),
    loadPredictKitCleanMargins(db, seasonKey),
  ]);
  const raw = emptyPredictKitSeason(seasonKey, prior);
  for (const g of games) recordPredictKitGame(raw, g);
  let cleanGames = 0;
  const strength = games.map((g) => {
    const c = clean.get(`${g.date}|${g.homeTeamId}|${g.awayTeamId}`);
    if (c != null) cleanGames += 1;
    return { homeTeamId: g.homeTeamId, awayTeamId: g.awayTeamId, cleanMargin: c ?? g.homeScore - g.awayScore };
  });
  return { raw, cleanSos: withCleanSosStrength(raw, strength), cleanGames, games: games.length };
}

export type PredictKitInjuryContext = {
  teams: Record<string, NbaTeamInjuryEntry[]>;
  current: NbaPlayerOutImpactBundle | null;
  prior: NbaPlayerOutImpactBundle | null;
};

export async function loadPredictKitInjuryContext(
  db: Firestore,
  seasonKey: string,
  injuryTeams?: Record<string, NbaTeamInjuryEntry[]>
): Promise<PredictKitInjuryContext> {
  const [teams, current, prior] = await Promise.all([
    injuryTeams ?? loadTeamInjuriesSnapshot(db, seasonKey).then((inj) => inj.bundle.teams),
    loadPlayerOutImpactBundle(db, seasonKey),
    loadPlayerOutImpactBundle(db, previousNbaSeasonKey(seasonKey)),
  ]);
  return { teams, current, prior };
}

/** 対象チームの欠場状況の指紋（変わっていなければ毎時の計算を飛ばす） */
export function predictKitInjuryKey(teams: Record<string, NbaTeamInjuryEntry[]>, teamIds: string[]): string {
  const rows = [...new Set(teamIds)]
    .sort()
    .flatMap((t) => (teams[t] ?? []).map((e) => `${t}:${e.playerId}:${e.status}`).sort());
  let h = 2166136261;
  for (const ch of rows.join("|")) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return `${rows.length}-${(h >>> 0).toString(16)}`;
}

/** OUT のローテ選手の今夜効く分（負だけ） */
export function predictKitInjuriesOf(ctx: PredictKitInjuryContext, teamId: string): Array<PredictKitInjury & { playerId: string }> {
  const seen = new Set<string>();
  return (ctx.teams[teamId] ?? []).flatMap((e) => {
    if (e.status !== "out" || seen.has(e.playerId)) return [];
    seen.add(e.playerId);
    const r = resolvePlayerOutImpact({ phase: "full", teamId, playerId: e.playerId, current: ctx.current, prior: ctx.prior });
    return r && r.impact < 0 ? [{ teamId, playerId: e.playerId, playerName: e.name, netDelta: r.impact }] : [];
  });
}

/** 得点王の候補を読むのは各チームこの人数まで（前季込みの平均得点の上位） */
const SCORER_LOG_PLAYERS_PER_TEAM = 6;

/**
 * 得点王の候補（チームごと）。ロスターの今季平均 + 前季平均（`nbaPlayerSeasonMetrics/{前季}` の pts だけ）で
 * 上位 6 人に絞り、その選手だけ今季の試合ログ（`nbaPlayerGameLogs/{season}`）を読む。
 */
export async function loadPredictKitScorerPlayers(
  db: Firestore,
  seasonKey: string,
  teamIds: string[],
  rosters: Record<string, Array<{ id: string; name: string; gp: number; ppg: number; priorPpg: number | null }>>,
  injuryTeams: Record<string, NbaTeamInjuryEntry[]>
): Promise<Record<string, PredictKitScorerPlayer[]>> {
  const teams = [...new Set(teamIds)];
  const roster = teams.flatMap((teamId) => (rosters[teamId] ?? []).filter((p) => p.id).map((p) => ({ ...p, teamId })));
  if (!roster.length) return {};
  const priorKey = previousNbaSeasonKey(seasonKey);
  const priorSnaps = await db.getAll(
    ...roster.map((p) => db.collection("nbaPlayerSeasonMetrics").doc(priorKey).collection("players").doc(p.id)),
    { fieldMask: ["metrics.pts"] }
  );
  const status = new Map<string, string>();
  for (const teamId of teams) for (const e of injuryTeams[teamId] ?? []) status.set(`${teamId}:${e.playerId}`, e.status);

  const players: PredictKitScorerPlayer[] = roster.map((p, i) => {
    const priorPts = Number(priorSnaps[i]?.get("metrics.pts.value"));
    const st = status.get(`${p.teamId}:${p.id}`);
    return {
      playerId: p.id,
      teamId: p.teamId,
      name: p.name,
      gp: p.gp,
      ppg: p.ppg,
      priorPpg: Number.isFinite(priorPts) ? priorPts : p.priorPpg,
      recentPts: [],
      playProb: st ? (PREDICT_KIT_SCORER_PLAY_PROB[st] ?? 1) : 1,
    };
  });
  const picked = teams.flatMap((teamId) =>
    players
      .filter((p) => p.teamId === teamId && p.playProb > 0)
      .sort((a, b) => predictKitScorerSeasonMu(b) - predictKitScorerSeasonMu(a))
      .slice(0, SCORER_LOG_PLAYERS_PER_TEAM)
  );
  const logSnaps = picked.length
    ? await db.getAll(
        ...picked.map((p) => db.collection("nbaPlayerGameLogs").doc(seasonKey).collection("players").doc(p.playerId)),
        { fieldMask: ["gameLogs"] }
      )
    : [];
  picked.forEach((p, i) => {
    const logs = (logSnaps[i]?.get("gameLogs") ?? []) as Array<{ gameId?: unknown; pts?: unknown; min?: unknown }>;
    p.recentPts = logs
      .filter((l) => Number(l.min) > 0)
      .sort((a, b) => Number(b.gameId) - Number(a.gameId))
      .map((l) => Number(l.pts) || 0);
  });
  const out: Record<string, PredictKitScorerPlayer[]> = {};
  for (const p of picked) (out[p.teamId] ??= []).push(p);
  return out;
}

/** ローテ選手（影響値の行がある）の OUT と questionable */
export function predictKitAbsenceOf(ctx: PredictKitInjuryContext, teamId: string): ProInsightPredictKitAbsence {
  const list = ctx.teams[teamId] ?? [];
  const isRotation = (playerId: string) =>
    resolvePlayerOutImpact({ phase: "full", teamId, playerId, current: ctx.current, prior: ctx.prior }) != null;
  const names = (statuses: NbaTeamInjuryEntry["status"][]) => [
    ...new Set(list.filter((e) => statuses.includes(e.status) && isRotation(e.playerId)).map((e) => e.name)),
  ];
  return { teamId, out: names(["out"]), questionable: names(["doubtful", "questionable"]) };
}
