/**
 * 試合後スタッツ監視 — BDL のシーズン集計に終了済み試合が入ったら、日次 18:00 を待たずに取り込む。
 *
 * 対象: 直近 10 時間に開始して final になったレギュラー / プレーオフ（プレシーズン・プレーインは日次のみ）。
 * 2 段階:
 *   team   … 順位（レギュラーのみ）とチーム平均の試合数が Firestore の終了試合数に追いついた
 *   player … 両チームの最長出場選手のシーズン平均がその試合を含んだ（`/stats` の出場数と一致）
 * どちらかが新しく揃ったら `runNbaStatsSnapshotSteps` + 直近試合ログを 1 回だけ回す。
 * 進捗は `nbaPostGameStatsRefresh/{bdlGameId}`（games doc には書かない — onGameFinalV2 を起こさない）。
 * final から 6 時間で諦める（日次 18:00 が拾う）。
 */
import type { Firestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { bdlNbaGetJson } from "@/lib/nba/bdl/bdlNbaFetch";
import { bdlSeasonYearFromSeasonKey } from "@/lib/nba/bdl/bdlNbaEnv";
import { fetchBdlStandings } from "@/lib/nba/bdl/fetchBdlStandings";
import { fetchBdlTeamSeasonAverages } from "@/lib/nba/bdl/fetchBdlTeamSeasonAverages";
import {
  fetchBdlPlayerGameLogs,
  parseBdlStatMinutes,
} from "@/lib/nba/bdl/fetchBdlPlayerGameLogs";
import { rememberBdlTeamId } from "@/lib/nba/bdl/bdlNbaTeamIdMap";
import {
  runNbaRecentPlayerGameLogsStep,
  runNbaStatsSnapshotSteps,
  type NbaStatsDailyIngestStepResult,
} from "@/lib/nba/ingest/nbaStatsDailyIngest";

export const NBA_POST_GAME_STATS_REFRESH_COLLECTION = "nbaPostGameStatsRefresh";

const WATCH_WINDOW_MS = 10 * 60 * 60 * 1000;
const GIVE_UP_AFTER_FINAL_MS = 6 * 60 * 60 * 1000;
/** finalAt が無い古い doc 用（tip から概ねこのくらいで終わる） */
const ASSUMED_GAME_LENGTH_MS = 2.5 * 60 * 60 * 1000;
/** これが通れば反映済みとみなす（ショットゾーン等の失敗で 10 分ごとに全ステップを回し続けない） */
const CORE_STEP_IDS = new Set(["league-stats", "standings", "team-game-logs"]);

type Phase = "regular" | "playoffs";

type Candidate = {
  bdlGameId: number;
  seasonKey: string;
  phase: Phase;
  homeTeamId: string;
  awayTeamId: string;
  finalAtMs: number;
  /** 各チームでこの試合の出場時間が最長の選手 */
  topPlayerIds: string[];
};

type RefreshState = {
  bdlGameId: number;
  seasonKey: string;
  phase: Phase;
  homeTeamId: string;
  awayTeamId: string;
  finalAtMs: number;
  checks: number;
  lastCheckedAtMs: number;
  teamReadyAtMs?: number;
  playerReadyAtMs?: number;
  teamRefreshedAtMs?: number;
  playerRefreshedAtMs?: number;
  done: boolean;
  gaveUp?: boolean;
};

export type NbaPostGameStatsRefreshResult = {
  ok: boolean;
  pending: number;
  ran: boolean;
  games: Array<{
    bdlGameId: number;
    teamReady: boolean;
    playerReady: boolean;
    done: boolean;
    gaveUp?: boolean;
  }>;
  steps?: NbaStatsDailyIngestStepResult[];
};

function num(raw: unknown): number {
  const n = typeof raw === "string" ? Number(raw) : raw;
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

function topPlayerId(rows: unknown): string | null {
  if (!Array.isArray(rows)) return null;
  let best: { id: string; min: number } | null = null;
  for (const r of rows as Array<Record<string, unknown>>) {
    const id = String(r.playerId ?? "").trim();
    const min = num(r.min);
    if (id && min > 0 && (!best || min > best.min)) best = { id, min };
  }
  return best?.id ?? null;
}

async function loadCandidates(db: Firestore, nowMs: number): Promise<Candidate[]> {
  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("startAtJst", ">=", Timestamp.fromMillis(nowMs - WATCH_WINDOW_MS))
    .where("startAtJst", "<=", Timestamp.fromMillis(nowMs))
    .get();
  const out: Candidate[] = [];
  for (const doc of snap.docs) {
    const g = doc.data();
    if (g.final !== true) continue;
    const phase = g.seasonPhase === "regular" || g.seasonPhase === "playoffs" ? g.seasonPhase : null;
    const bdlGameId = num(g.bdlGameId);
    const seasonKey = typeof g.season === "string" ? g.season : "";
    if (!phase || !bdlGameId || !seasonKey || !g.homeTeamId || !g.awayTeamId) continue;
    const startMs = g.startAtJst instanceof Timestamp ? g.startAtJst.toMillis() : 0;
    const finalAtMs =
      g.finalAt instanceof Timestamp ? g.finalAt.toMillis() : startMs + ASSUMED_GAME_LENGTH_MS;
    const box = g.liveStats?.box ?? {};
    const topPlayerIds = [topPlayerId(box.home), topPlayerId(box.away)].filter(
      (id): id is string => Boolean(id)
    );
    out.push({
      bdlGameId,
      seasonKey,
      phase,
      homeTeamId: String(g.homeTeamId),
      awayTeamId: String(g.awayTeamId),
      finalAtMs,
      topPlayerIds,
    });
  }
  return out;
}

/** Firestore 上の終了済み試合数（この試合を含む）= BDL が追いつくべき試合数 */
async function finalGameCount(
  db: Firestore,
  seasonKey: string,
  phase: Phase,
  teamId: string
): Promise<number> {
  const base = db
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", seasonKey)
    .where("seasonPhase", "==", phase)
    .where("final", "==", true);
  const [home, away] = await Promise.all([
    base.where("homeTeamId", "==", teamId).count().get(),
    base.where("awayTeamId", "==", teamId).count().get(),
  ]);
  return home.data().count + away.data().count;
}

type SeasonPhaseKey = `${string}|${Phase}`;

type BdlSnapshot = {
  /** app teamId → W+L（レギュラーのみ） */
  standingsGames: Map<string, number>;
  /** app teamId → gp */
  teamGp: Map<string, number>;
  /** playerId → gp */
  playerGp: Map<string, number>;
};

async function loadBdlSnapshot(
  seasonKey: string,
  phase: Phase,
  playerIds: string[]
): Promise<BdlSnapshot> {
  const seasonYear = bdlSeasonYearFromSeasonKey(seasonKey);
  const standingsGames = new Map<string, number>();
  if (phase === "regular") {
    for (const row of await fetchBdlStandings({ seasonYear })) {
      const id = row.team?.id;
      const appId = id != null ? rememberBdlTeamId(id, row.team?.abbreviation) : null;
      if (appId) standingsGames.set(appId, num(row.wins) + num(row.losses));
    }
  }
  const teamGp = new Map<string, number>();
  for (const row of await fetchBdlTeamSeasonAverages({
    seasonYear,
    type: "base",
    seasonType: phase,
  })) {
    const appId = rememberBdlTeamId(row.team.id, row.team.abbreviation);
    if (appId) teamGp.set(appId, num(row.stats?.gp));
  }
  const playerGp = new Map<string, number>();
  if (playerIds.length > 0) {
    const res = await bdlNbaGetJson<{
      data?: Array<{ player?: { id?: number }; stats?: Record<string, unknown> }>;
    }>("/nba/v1/season_averages/general", {
      "player_ids[]": playerIds.map(Number),
      season: seasonYear,
      season_type: phase,
      type: "base",
      per_page: 100,
    });
    for (const row of res.data ?? []) {
      if (row.player?.id != null) playerGp.set(String(row.player.id), num(row.stats?.gp));
    }
  }
  return { standingsGames, teamGp, playerGp };
}

async function isTeamReady(
  db: Firestore,
  c: Candidate,
  bdl: BdlSnapshot
): Promise<boolean> {
  for (const teamId of [c.homeTeamId, c.awayTeamId]) {
    const expected = await finalGameCount(db, c.seasonKey, c.phase, teamId);
    if ((bdl.teamGp.get(teamId) ?? 0) < expected) return false;
    if (c.phase === "regular" && (bdl.standingsGames.get(teamId) ?? 0) < expected) {
      return false;
    }
  }
  return true;
}

async function isPlayerReady(c: Candidate, bdl: BdlSnapshot): Promise<boolean> {
  if (c.topPlayerIds.length === 0) return false;
  const seasonYear = bdlSeasonYearFromSeasonKey(c.seasonKey);
  for (const playerId of c.topPlayerIds) {
    const rows = await fetchBdlPlayerGameLogs({
      bdlPlayerId: Number(playerId),
      seasonYear,
      seasonType: c.phase,
    });
    const played = rows.filter((r) => parseBdlStatMinutes(r.min) > 0);
    if (!played.some((r) => r.game?.id === c.bdlGameId)) return false;
    if ((bdl.playerGp.get(playerId) ?? 0) < played.length) return false;
  }
  return true;
}

export async function runNbaPostGameStatsRefresh(
  db: Firestore,
  nowMs = Date.now()
): Promise<NbaPostGameStatsRefreshResult> {
  const candidates = await loadCandidates(db, nowMs);
  const col = db.collection(NBA_POST_GAME_STATS_REFRESH_COLLECTION);
  const stateSnaps = candidates.length
    ? await db.getAll(...candidates.map((c) => col.doc(String(c.bdlGameId))))
    : [];
  const states = new Map<number, RefreshState>();
  for (const s of stateSnaps) {
    if (s.exists) states.set(Number(s.id), s.data() as RefreshState);
  }
  const pending = candidates.filter((c) => states.get(c.bdlGameId)?.done !== true);
  if (pending.length === 0) return { ok: true, pending: 0, ran: false, games: [] };

  const bdlByKey = new Map<SeasonPhaseKey, BdlSnapshot>();
  for (const c of pending) {
    const key: SeasonPhaseKey = `${c.seasonKey}|${c.phase}`;
    if (bdlByKey.has(key)) continue;
    const players = pending
      .filter((p) => p.seasonKey === c.seasonKey && p.phase === c.phase)
      .flatMap((p) => p.topPlayerIds);
    bdlByKey.set(key, await loadBdlSnapshot(c.seasonKey, c.phase, [...new Set(players)]));
  }

  const evaluated: Array<{ c: Candidate; prev?: RefreshState; teamReady: boolean; playerReady: boolean }> = [];
  for (const c of pending) {
    const bdl = bdlByKey.get(`${c.seasonKey}|${c.phase}`)!;
    const prev = states.get(c.bdlGameId);
    const teamReady = await isTeamReady(db, c, bdl);
    const playerReady = teamReady && (await isPlayerReady(c, bdl));
    evaluated.push({ c, prev, teamReady, playerReady });
  }

  const needRun = evaluated.some(
    (e) =>
      (e.teamReady && !e.prev?.teamRefreshedAtMs) ||
      (e.playerReady && !e.prev?.playerRefreshedAtMs)
  );

  let steps: NbaStatsDailyIngestStepResult[] | undefined;
  let refreshedOk = false;
  if (needRun) {
    const seasonKeys = [...new Set(evaluated.map((e) => e.c.seasonKey))];
    steps = [];
    for (const seasonKey of seasonKeys) {
      steps.push(...(await runNbaStatsSnapshotSteps(db, seasonKey)));
      steps.push(await runNbaRecentPlayerGameLogsStep(db, seasonKey));
    }
    refreshedOk = steps
      .filter((s) => CORE_STEP_IDS.has(s.id))
      .every((s) => s.ok);
  }

  const games: NbaPostGameStatsRefreshResult["games"] = [];
  const batch = db.batch();
  for (const { c, prev, teamReady, playerReady } of evaluated) {
    const next: RefreshState = {
      bdlGameId: c.bdlGameId,
      seasonKey: c.seasonKey,
      phase: c.phase,
      homeTeamId: c.homeTeamId,
      awayTeamId: c.awayTeamId,
      finalAtMs: c.finalAtMs,
      checks: (prev?.checks ?? 0) + 1,
      lastCheckedAtMs: nowMs,
      done: false,
    };
    const teamReadyAtMs = prev?.teamReadyAtMs ?? (teamReady ? nowMs : undefined);
    const playerReadyAtMs = prev?.playerReadyAtMs ?? (playerReady ? nowMs : undefined);
    const teamRefreshedAtMs =
      prev?.teamRefreshedAtMs ?? (teamReady && refreshedOk ? nowMs : undefined);
    const playerRefreshedAtMs =
      prev?.playerRefreshedAtMs ?? (playerReady && refreshedOk ? nowMs : undefined);
    if (teamReadyAtMs) next.teamReadyAtMs = teamReadyAtMs;
    if (playerReadyAtMs) next.playerReadyAtMs = playerReadyAtMs;
    if (teamRefreshedAtMs) next.teamRefreshedAtMs = teamRefreshedAtMs;
    if (playerRefreshedAtMs) next.playerRefreshedAtMs = playerRefreshedAtMs;
    if (playerRefreshedAtMs) {
      next.done = true;
    } else if (nowMs - c.finalAtMs > GIVE_UP_AFTER_FINAL_MS) {
      next.done = true;
      next.gaveUp = true;
    }
    batch.set(col.doc(String(c.bdlGameId)), next);
    games.push({
      bdlGameId: c.bdlGameId,
      teamReady,
      playerReady,
      done: next.done,
      ...(next.gaveUp ? { gaveUp: true } : {}),
    });
  }
  await batch.commit();

  return {
    ok: !needRun || refreshedOk,
    pending: pending.length,
    ran: needRun,
    games,
    ...(steps ? { steps } : {}),
  };
}
