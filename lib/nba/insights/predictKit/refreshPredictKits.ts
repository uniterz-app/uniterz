/**
 * これから始まる NBA 試合（翌日分・プレシーズン除く）の「予想の材料」を計算して
 * `gameProInsights/{gameId}.predictKit` に書く。同じ試合でポゼッションシミュレーションも回し、
 * `simShadow` に書く。実力差の今季分は本番がガベージタイム抜き + 相手補正、平均得失点差のままの版を `predictKitRaw` に残す
 * （simShadow / predictKitRaw は公開 API に出さない。試合後に `runPredictAudits` で 3 つを採点して比べる）。
 * 本番には得点王の候補（`predictKitScorers`）と、採点済みの試合から作った今季の成績（20 試合以上）も載せる。
 * Firestore だけ（BDL・OpenAI なし）。開始後の試合は書き換えない＝試合前最後の値が残る。
 */
import { Timestamp, type Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { MATCHUP_DIFFICULTY_COEFFICIENTS as C } from "@/lib/nba/matchupDifficulty/fittedCoefficients";
import { restDaysBetweenGameDates } from "@/lib/nba/matchupDifficulty/features";
import { gameProInsightRef } from "@/lib/nba/insights/gameProInsightStore";
import { buildPredictKit, type PredictKitSeasonState } from "@/lib/nba/insights/predictKit/predictKit";
import {
  predictKitCombinedRecordOf,
  toProInsightPredictKit,
  type ProInsightPredictKit,
} from "@/lib/nba/insights/predictKit/predictKitTypes";
import { predictKitScorerOdds } from "@/lib/nba/insights/predictKit/predictKitScorers";
import {
  etDateOf,
  loadPredictKitInjuryContext,
  loadPredictKitScorerPlayers,
  loadPredictKitSeasonStates,
  predictKitAbsenceOf,
  predictKitInjuriesOf,
  predictKitInjuryKey,
  type PredictKitInjuryContext,
} from "@/lib/nba/insights/predictKit/predictKitSeason";
import { loadTeamInjuriesSnapshot } from "@/lib/nba/teamInjuries/loadTeamInjuriesSnapshot";
import { buildNbaSimTeamInput, loadNbaSimContext, type NbaSimContext } from "@/lib/nba/sim/buildNbaSimInputs";
import { fitSimMarginShock, simulateNbaPossessionGame, type SimOutPlayer } from "@/lib/nba/sim/nbaPossessionSim";

export const PREDICT_SHADOW_META_COLLECTION = "nbaPredictShadowMeta";
export const SIM_SHADOW_VERSION = 1;
export const SIM_SHADOW_RUNS = 5000;
/** 自前の残差がこれだけ溜まるまでは予想の材料と同じ σ で回す */
const SIM_SHOCK_FIT_MIN_GAMES = 30;

const KIT_PHASES = new Set(["regular", "playoffs", "play_in"]);
/** 20:00 JST の回で作る範囲（翌日の試合。36h だと連戦の 1 試合目より前に 2 試合目の予想ができてしまう） */
export const PREDICT_KIT_CREATE_HORIZON_HOURS = 24;
/** 毎時の回で、予想の無い試合を新しく作ってよい開始までの時間 */
const PREDICT_KIT_LATE_CREATE_HOURS = 12;
/** 今季の終了試合のうちガベージタイム抜きの点差がこの割合以上あれば、本番の実力差に使う */
const CLEAN_SOS_MIN_COVERAGE = 0.8;
/** 得点王の候補を何人まで載せるか */
const PREDICT_KIT_SCORERS_SHOWN = 3;

export type SimShadow = {
  v: number;
  runs: number;
  homeWinPct: number;
  marginP50: number;
  home: { p10: number; p50: number; p90: number };
  away: { p10: number; p50: number; p90: number };
  total: { p25: number; p50: number; p75: number };
  shockSd: number;
  /** 5 人組のデータがあったチーム数（0〜2。0 ならチーム平均だけで回っている） */
  lineupTeams: number;
};

export type PredictShadowMeta = {
  /** 試合後の採点で溜めるシミュのホーム視点の 予想点差 p と 実際の点差 a（直近 400 試合） */
  simResidualPairs?: Array<{ p: number; a: number }>;
  /** 採点のたびに残差から合わせ直したシミュのばらつき（30 試合未満は予想の材料と同じ σ） */
  simShockSd?: number;
  /** 前回計算したときの、対象チームの欠場状況の指紋 */
  predictKitInjuryKey?: string;
  /** 採点した試合ごとの本番の予想の材料の結果（p = 有利側の勝つ確率 %・h = 有利側が勝った・s = 得点王の 1 番手が当たった・t = 試合開始 ms） */
  kitResults?: Record<string, { p: number; h: 0 | 1; s?: 0 | 1; t?: number }>;
};

export type RefreshPredictKitsResult = {
  games: number;
  kitWritten: number;
  simWritten: number;
  skipped: number;
  /** 欠場が変わっておらず全試合に予想があるので計算しなかった */
  noChange?: boolean;
};

function stableJson(x: unknown): string {
  if (Array.isArray(x)) return `[${x.map(stableJson).join(",")}]`;
  if (x && typeof x === "object") {
    const o = x as Record<string, unknown>;
    return `{${Object.keys(o)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableJson(o[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(x ?? null);
}

function seedOf(gameId: string): number {
  let h = 2166136261;
  for (let i = 0; i < gameId.length; i++) h = Math.imul(h ^ gameId.charCodeAt(i), 16777619);
  return h >>> 0;
}

function predictShadowMetaRef(db: Firestore, seasonKey: string) {
  return db.collection(PREDICT_SHADOW_META_COLLECTION).doc(seasonKey);
}

export function simShockSdOf(meta: PredictShadowMeta): number {
  const pairs = meta.simResidualPairs ?? [];
  if (pairs.length < SIM_SHOCK_FIT_MIN_GAMES) return C.sigma;
  return fitSimMarginShock(pairs.map(({ p, a }) => ({ predictedMargin: p, actualMargin: a })));
}

function simOuts(ctx: PredictKitInjuryContext, side: "home" | "away", teamId: string): SimOutPlayer[] {
  const impact = new Map(predictKitInjuriesOf(ctx, teamId).map((i) => [i.playerId, i.netDelta]));
  const ids = new Set((ctx.teams[teamId] ?? []).filter((e) => e.status === "out").map((e) => e.playerId));
  return [...ids].map((playerId) => ({ side, playerId, impact: impact.get(playerId) ?? 0 }));
}

export function buildSimShadow(input: {
  sim: NbaSimContext;
  season: PredictKitSeasonState;
  injuries: PredictKitInjuryContext;
  gameId: string;
  homeTeamId: string;
  awayTeamId: string;
  gameDate: string;
  shockSd: number;
  homeCourt: number;
}): SimShadow | null {
  const rest = (teamId: string) =>
    restDaysBetweenGameDates(input.season.teams[teamId]?.lastDate ?? null, input.gameDate);
  const home = buildNbaSimTeamInput(input.sim, input.homeTeamId, rest(input.homeTeamId));
  const away = buildNbaSimTeamInput(input.sim, input.awayTeamId, rest(input.awayTeamId));
  if (!home || !away) return null;
  const r = simulateNbaPossessionGame({
    home,
    away,
    outs: [
      ...simOuts(input.injuries, "home", input.homeTeamId),
      ...simOuts(input.injuries, "away", input.awayTeamId),
    ],
    homeCourt: input.homeCourt,
    leagueOrtg: input.sim.leagueOrtg,
    marginShockSd: input.shockSd,
    runs: SIM_SHADOW_RUNS,
    seed: seedOf(input.gameId),
  });
  const r1 = (x: number) => Math.round(x * 10) / 10;
  return {
    v: SIM_SHADOW_VERSION,
    runs: r.runs,
    homeWinPct: r1(r.homeWinPct * 100),
    marginP50: r1(r.marginP50),
    home: r.home,
    away: r.away,
    total: r.total,
    shockSd: r1(input.shockSd),
    lineupTeams: [home, away].filter((t) => t.lineups.length > 0).length,
  };
}

export async function refreshPredictKits(
  db: Firestore,
  opts: {
    seasonKey?: string;
    /**
     * daily … 前日 20:00 JST の回。翌日（24h 以内）の試合を全部作り直す
     * hourly … 毎時。もうある予想だけを、対象チームの欠場が前回から変わったときに直す
     *   （20:00 に作れなかった試合は開始 12h 前から拾う。前の試合は必ず終わっている）
     */
    mode?: "daily" | "hourly";
    nowMs?: number;
    dryRun?: boolean;
  } = {}
): Promise<RefreshPredictKitsResult & { kits?: Record<string, { kit: ProInsightPredictKit; raw: ProInsightPredictKit; sim: SimShadow | null }> }> {
  const seasonKey = opts.seasonKey ?? CURRENT_NBA_SEASON_KEY;
  const nowMs = opts.nowMs ?? Date.now();
  const hourly = opts.mode === "hourly";
  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", seasonKey)
    .where("startAtJst", ">", Timestamp.fromMillis(nowMs))
    .where("startAtJst", "<=", Timestamp.fromMillis(nowMs + PREDICT_KIT_CREATE_HORIZON_HOURS * 3_600_000))
    .select("status", "seasonPhase", "homeTeamId", "awayTeamId", "startAtJst")
    .get();
  const candidates = snap.docs.filter((d) => {
    const g = d.data();
    return g.status !== "final" && KIT_PHASES.has(String(g.seasonPhase ?? "")) && g.homeTeamId && g.awayTeamId;
  });
  const empty = { games: 0, kitWritten: 0, simWritten: 0, skipped: 0 };
  if (!candidates.length) return empty;

  const metaRef = predictShadowMetaRef(db, seasonKey);
  const [injurySnap, metaSnap, candidateExisting] = await Promise.all([
    loadTeamInjuriesSnapshot(db, seasonKey),
    db.getAll(metaRef, { fieldMask: ["simShockSd", "predictKitInjuryKey"] }),
    db.getAll(...candidates.map((d) => gameProInsightRef(db, d.id)), {
      fieldMask: ["predictKit", "predictKitRaw", "simShadow"],
    }),
  ]);
  const lateCreateBeforeMs = nowMs + PREDICT_KIT_LATE_CREATE_HOURS * 3_600_000;
  const picked = candidates.flatMap((doc, i) => {
    const prev = candidateExisting[i]!;
    if (!hourly || prev.data()?.predictKit != null) return [{ doc, prev }];
    return (doc.data().startAtJst as Timestamp).toMillis() <= lateCreateBeforeMs ? [{ doc, prev }] : [];
  });
  if (!picked.length) return empty;
  const upcoming = picked.map((p) => p.doc);
  const existing = picked.map((p) => p.prev);

  const meta = (metaSnap[0]?.data() as PredictShadowMeta | undefined) ?? {};
  const injuryKey = predictKitInjuryKey(
    injurySnap.bundle.teams,
    upcoming.flatMap((d) => [String(d.data().homeTeamId), String(d.data().awayTeamId)])
  );
  if (
    hourly &&
    meta.predictKitInjuryKey === injuryKey &&
    existing.every((s) => s.data()?.predictKit != null)
  ) {
    return { games: upcoming.length, kitWritten: 0, simWritten: 0, skipped: upcoming.length, noChange: true };
  }

  const [seasons, injuries, sim, recordSnap] = await Promise.all([
    loadPredictKitSeasonStates(db, seasonKey, nowMs),
    loadPredictKitInjuryContext(db, seasonKey, injurySnap.bundle.teams),
    loadNbaSimContext(db, seasonKey),
    db.getAll(metaRef, { fieldMask: ["kitResults", "kitBacktest"] }),
  ]);
  const record = predictKitCombinedRecordOf(recordSnap[0]?.get("kitResults"), recordSnap[0]?.get("kitBacktest"));
  const scorerPlayers = await loadPredictKitScorerPlayers(
    db,
    seasonKey,
    upcoming.flatMap((d) => [String(d.data().homeTeamId), String(d.data().awayTeamId)]),
    sim.rosters,
    injurySnap.bundle.teams
  );
  const season = seasons.raw;
  // ガベージタイム抜きの点差が揃っていない間（取り込みの遅れ・欠け）は本番も平均得失点差のまま
  const useCleanSos = seasons.games > 0 && seasons.cleanGames / seasons.games >= CLEAN_SOS_MIN_COVERAGE;
  const shockSd = meta.simShockSd ?? C.sigma;
  const homeCourt = injuries.current?.homeCourt ?? C.homeCourt;

  let kitWritten = 0;
  let simWritten = 0;
  let skipped = 0;
  const kits: Record<string, { kit: ProInsightPredictKit; raw: ProInsightPredictKit; sim: SimShadow | null }> = {};
  for (let i = 0; i < upcoming.length; i++) {
    const doc = upcoming[i]!;
    const g = doc.data();
    const homeTeamId = String(g.homeTeamId);
    const awayTeamId = String(g.awayTeamId);
    const gameDate = etDateOf((g.startAtJst as Timestamp).toMillis());
    const kitInput = {
      homeTeamId,
      awayTeamId,
      gameDate,
      injuries: [...predictKitInjuriesOf(injuries, homeTeamId), ...predictKitInjuriesOf(injuries, awayTeamId)],
    };
    const absences = [predictKitAbsenceOf(injuries, homeTeamId), predictKitAbsenceOf(injuries, awayTeamId)];
    const rawKit = buildPredictKit({ season, ...kitInput });
    const predictKitRaw = toProInsightPredictKit({ kit: rawKit, homeTeamId, awayTeamId, absences });
    const scorers = predictKitScorerOdds(
      [...(scorerPlayers[homeTeamId] ?? []), ...(scorerPlayers[awayTeamId] ?? [])],
      seedOf(doc.id)
    )
      .slice(0, PREDICT_KIT_SCORERS_SHOWN)
      .map((s) => ({
        playerId: s.playerId,
        teamId: s.teamId,
        name: s.name,
        pct: Math.round(s.p * 100),
        ppg: Math.round(s.ppg * 10) / 10,
        ...(s.doubtful ? { doubtful: true } : {}),
      }));
    const kit = toProInsightPredictKit({
      // 成績の行（勝敗・平均得失点差）は実際の数字のまま
      kit: useCleanSos
        ? { ...buildPredictKit({ season: seasons.cleanSos, ...kitInput }), teams: rawKit.teams }
        : rawKit,
      homeTeamId,
      awayTeamId,
      absences,
      ...(useCleanSos ? { strengthBasis: "cleanSos" as const } : {}),
      scorers,
      record,
    });
    const simShadow = buildSimShadow({
      sim,
      season,
      injuries,
      gameId: doc.id,
      homeTeamId,
      awayTeamId,
      gameDate,
      shockSd,
      homeCourt,
    });
    kits[doc.id] = { kit, raw: predictKitRaw, sim: simShadow };

    const prev = existing[i]!.data() as
      | { predictKit?: unknown; predictKitRaw?: unknown; simShadow?: unknown }
      | undefined;
    const patch: Record<string, unknown> = {};
    if (stableJson(prev?.predictKit) !== stableJson(kit)) {
      patch.predictKit = kit;
      patch.predictKitAtMs = nowMs;
    }
    if (stableJson(prev?.predictKitRaw) !== stableJson(predictKitRaw)) {
      patch.predictKitRaw = predictKitRaw;
    }
    if (simShadow && stableJson(prev?.simShadow) !== stableJson(simShadow)) {
      patch.simShadow = simShadow;
      patch.simShadowAtMs = nowMs;
    }
    if (!Object.keys(patch).length) {
      skipped += 1;
      continue;
    }
    if ("predictKit" in patch) kitWritten += 1;
    if ("simShadow" in patch) simWritten += 1;
    if (!opts.dryRun) {
      await gameProInsightRef(db, doc.id).set(patch, { mergeFields: Object.keys(patch) });
    }
  }
  if (!opts.dryRun && meta.predictKitInjuryKey !== injuryKey) {
    await metaRef.set({ predictKitInjuryKey: injuryKey }, { merge: true });
  }
  return { games: upcoming.length, kitWritten, simWritten, skipped, ...(opts.dryRun ? { kits } : {}) };
}
