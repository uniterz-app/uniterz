/**
 * Pro Insight ナラティブ — OpenAI Batch 投入 / ポーリング完了書き込み。
 * データは Firestore のみ（このパスでは BDL を叩かない → BDL 追加コスト $0）。
 * プレシーズン試合は生成しない（regular / play_in / playoffs のみ）。
 *
 * OPENAI_API_KEY 未設定時: dry_run（fact フォールバックを即書き）。
 */
import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore";
import {
  CURRENT_NBA_SEASON_KEY,
  previousNbaSeasonKey,
} from "@/lib/rankings/nbaSeason";
import { loadLeagueTeamStatsSnapshot } from "@/lib/nba/leagueTeamStats/loadLeagueTeamStatsSnapshot";
import { enrichLast10RatingsFromGameDocs } from "@/lib/nba/leagueTeamStats/buildLast10RowsFromGames";
import { loadTeamInjuriesSnapshot } from "@/lib/nba/teamInjuries/loadTeamInjuriesSnapshot";
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import { loadOrBuildTeamSeasonRecords } from "@/lib/nba/insights/loadPriorSeasonTeamRecords";
import { loadAceOutRecordsBundle } from "@/lib/nba/insights/ingestNbaTeamAceOutRecords";
import { loadPlayerStatLeadersSnapshot } from "@/lib/nba/playerStatLeaders/loadPlayerStatLeadersSnapshot";
import { loadNbaConferenceStandings } from "@/lib/nba/standings/loadNbaConferenceStandings";
import { loadTeamRostersSnapshot } from "@/lib/nba/teamRosters/loadTeamRostersSnapshot";
import { assembleProInsightFactPack } from "@/lib/nba/insights/proInsightFacts";
import type { ProInsightFactPack } from "@/lib/nba/insights/proInsightFacts/types";
import { fingerprintInjuryStatus } from "@/lib/nba/insights/proInsightFacts/fingerprint";
import { highMinutePlayersFromRecentGames } from "@/lib/nba/insights/proInsightFacts/highMinutePlayersFromLiveStats";
import { resolveProBriefPhase, isWithinProBriefPatchWindow, isProInsightEligibleNbaGame } from "@/lib/nba/insights/proInsightPhases";
import type { ProBriefPhase } from "@/lib/predict/predictProBrief";
import { teamGamesPlayed, findTeamRow } from "@/lib/nba/insights/rankTeamMetrics";
import {
  buildBatchJsonl,
  createOpenAiBatch,
  downloadOpenAiFileText,
  getOpenAiBatch,
  isOpenAiConfigured,
  openAiChatCompletionJson,
  uploadOpenAiBatchJsonl,
  type OpenAiBatchJsonlLine,
} from "@/lib/openai/openaiBatch";
import {
  getOpenAiProInsightModel,
} from "@/lib/openai/openaiEnv";
import {
  PRO_INSIGHT_LLM_SYSTEM,
  buildProInsightLlmUserPayload,
} from "@/lib/nba/insights/proInsightLlm/prompt";
import { parseProInsightLlmJson } from "@/lib/nba/insights/proInsightLlm/parseLlmJson";
import { fallbackNarrativeFromFactPack } from "@/lib/nba/insights/proInsightLlm/fallbackFromFacts";
import {
  listPendingProInsightBatchJobs,
  saveProInsightBatchJob,
} from "@/lib/nba/insights/proInsightLlm/batchJobStore";
import type { ProInsightNarrativeBrief } from "@/lib/predict/proInsightNarrativeTypes";
import type {
  SchedulePriorGame,
  ScheduleNextGame,
} from "@/lib/nba/insights/proInsightFacts/buildScheduleFacts";

export type ProInsightNarrativeBatchSubmitResult = {
  ok: boolean;
  mode: "batch_submit";
  seasonKey: string;
  openaiConfigured: boolean;
  jobId: string | null;
  openaiBatchId: string | null;
  gamesPrepared: number;
  writtenFallback: number;
  skipped: number;
  errors: Array<{ gameId?: string; error: string }>;
};

export type ProInsightNarrativeBatchPollResult = {
  ok: boolean;
  mode: "batch_poll";
  polled: number;
  completed: number;
  stillRunning: number;
  written: number;
  errors: Array<{ jobId?: string; gameId?: string; error: string }>;
};

export type ProInsightNarrativePatchResult = {
  ok: boolean;
  mode: "narrative_patch";
  seasonKey: string;
  scanned: number;
  written: number;
  skippedUnchanged: number;
  skippedOther: number;
  errors: Array<{ gameId?: string; error: string }>;
};

function toMs(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value instanceof Timestamp) return value.toMillis();
  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis: () => number }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === "string") {
    const t = Date.parse(value);
    return Number.isFinite(t) ? t : null;
  }
  return null;
}

function teamIdFromSide(raw: unknown, fallback?: unknown): string {
  if (raw && typeof raw === "object" && "teamId" in raw) {
    const id = String((raw as { teamId?: unknown }).teamId ?? "").trim();
    if (id) return id;
  }
  return String(fallback ?? "").trim();
}

function confRankByTeamIdFromStandings(payload: {
  board: { east: Array<{ teamId: string; rank: number }>; west: Array<{ teamId: string; rank: number }> };
} | null | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  if (!payload?.board) return out;
  for (const row of [...payload.board.east, ...payload.board.west]) {
    const id = String(row.teamId ?? "").trim();
    if (!id || !Number.isFinite(row.rank)) continue;
    out[id] = row.rank;
  }
  return out;
}

/** ロスター players[].mpg → playerId マップ（push の buildMpgByPlayerId と同型） */
function mpgByPlayerIdFromRosterTeams(
  teams:
    | Record<string, { players?: Array<{ id?: string | number; mpg?: number }> }>
    | null
    | undefined
): Record<string, number> {
  const out: Record<string, number> = {};
  if (!teams) return out;
  for (const team of Object.values(teams)) {
    for (const p of team.players ?? []) {
      const id = String(p.id ?? "").trim();
      if (!id) continue;
      const mpg = typeof p.mpg === "number" && Number.isFinite(p.mpg) ? p.mpg : 0;
      out[id] = mpg;
    }
  }
  return out;
}

/** opening は前季ロスター mpg を優先（今季未出場でもゲートできる） */
function mpgByPlayerIdForPhase(
  phase: ProBriefPhase,
  seasonMpg: Record<string, number>,
  priorMpg: Record<string, number>
): Record<string, number> {
  if (phase === "opening") {
    return Object.keys(priorMpg).length > 0 ? priorMpg : seasonMpg;
  }
  return Object.keys(seasonMpg).length > 0 ? seasonMpg : priorMpg;
}

function parseGameScores(data: Record<string, unknown>): {
  homeScore: number | null;
  awayScore: number | null;
} {
  const num = (v: unknown): number | null => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) {
      return Number(v);
    }
    return null;
  };
  let homeScore = num(data.homeScore);
  let awayScore = num(data.awayScore);
  const score = data.score;
  if (
    (homeScore == null || awayScore == null) &&
    score &&
    typeof score === "object"
  ) {
    const s = score as Record<string, unknown>;
    homeScore = homeScore ?? num(s.home);
    awayScore = awayScore ?? num(s.away);
  }
  return { homeScore, awayScore };
}

function parsePriorGamesForTeam(
  docs: Array<{ id: string; data: Record<string, unknown> }>,
  teamId: string,
  beforeMs: number
): SchedulePriorGame[] {
  const out: SchedulePriorGame[] = [];
  for (const doc of docs) {
    const tip = toMs(doc.data.startAtJst);
    if (tip == null || tip >= beforeMs) continue;
    const homeId = teamIdFromSide(doc.data.home, doc.data.homeTeamId);
    const awayId = teamIdFromSide(doc.data.away, doc.data.awayTeamId);
    if (homeId !== teamId && awayId !== teamId) continue;
    const { homeScore, awayScore } = parseGameScores(doc.data);
    out.push({
      startAtMs: tip,
      venueTeamId: homeId,
      isHome: homeId === teamId,
      overtime: Boolean(doc.data.overtime ?? doc.data.wentOvertime),
      finalAtMs: toMs(doc.data.finalAt),
      gameId: doc.id,
      homeScore,
      awayScore,
    });
  }
  return out.sort((a, b) => a.startAtMs - b.startAtMs);
}

function parseNextGameForTeam(
  docs: Array<{ id: string; data: Record<string, unknown> }>,
  teamId: string,
  afterMs: number
): ScheduleNextGame | null {
  let best: ScheduleNextGame | null = null;
  for (const doc of docs) {
    const tip = toMs(doc.data.startAtJst);
    if (tip == null || tip <= afterMs) continue;
    const homeId = teamIdFromSide(doc.data.home, doc.data.homeTeamId);
    const awayId = teamIdFromSide(doc.data.away, doc.data.awayTeamId);
    if (homeId !== teamId && awayId !== teamId) continue;
    const row: ScheduleNextGame = {
      startAtMs: tip,
      venueTeamId: homeId,
      isHome: homeId === teamId,
    };
    if (!best || tip < best.startAtMs) best = row;
  }
  return best;
}

async function loadUpcomingNbaGames(
  db: Firestore,
  opts: { fromMs: number; toMs: number; limit: number }
): Promise<Array<{ id: string; data: Record<string, unknown> }>> {
  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("startAtJst", ">=", Timestamp.fromMillis(opts.fromMs))
    .where("startAtJst", "<=", Timestamp.fromMillis(opts.toMs))
    .orderBy("startAtJst", "asc")
    .limit(opts.limit)
    .get();
  return snap.docs.map((d) => ({
    id: d.id,
    data: d.data() as Record<string, unknown>,
  }));
}

async function loadRecentNbaGamesAroundTeams(
  db: Firestore,
  teamIds: string[],
  beforeMs: number,
  lookbackMs: number
): Promise<Array<{ id: string; data: Record<string, unknown> }>> {
  const fromMs = beforeMs - lookbackMs;
  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("startAtJst", ">=", Timestamp.fromMillis(fromMs))
    .where("startAtJst", "<", Timestamp.fromMillis(beforeMs))
    .orderBy("startAtJst", "asc")
    .limit(200)
    .get();
  const want = new Set(teamIds);
  return snap.docs
    .map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }))
    .filter((d) => {
      const homeId = teamIdFromSide(d.data.home, d.data.homeTeamId);
      const awayId = teamIdFromSide(d.data.away, d.data.awayTeamId);
      return want.has(homeId) || want.has(awayId);
    });
}

function injuriesForTeam(
  teams: Record<string, NbaTeamInjuryEntry[]>,
  teamId: string
): NbaTeamInjuryEntry[] {
  return teams[teamId] ?? [];
}

function winPctByTeam(rows: NbaLeagueTeamStatRow[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) m.set(r.teamId, r.winPct);
  return m;
}

function recentOppWinPcts(input: {
  priorGames: SchedulePriorGame[];
  teamId: string;
  winPct: Map<string, number>;
  allDocs: Array<{ id: string; data: Record<string, unknown> }>;
  limit: number;
}): number[] {
  const recent = [...input.priorGames]
    .sort((a, b) => b.startAtMs - a.startAtMs)
    .slice(0, input.limit);
  const out: number[] = [];
  for (const g of recent) {
    const doc =
      (g.gameId
        ? input.allDocs.find((d) => d.id === g.gameId)
        : undefined) ??
      input.allDocs.find((d) => toMs(d.data.startAtJst) === g.startAtMs);
    if (!doc) continue;
    const homeId = teamIdFromSide(doc.data.home, doc.data.homeTeamId);
    const awayId = teamIdFromSide(doc.data.away, doc.data.awayTeamId);
    const oppId = homeId === input.teamId ? awayId : homeId;
    const pct = input.winPct.get(oppId);
    if (pct != null) out.push(pct);
  }
  return out.reverse();
}

async function writeNarrative(
  db: Firestore,
  gameId: string,
  brief: ProInsightNarrativeBrief,
  meta: {
    fingerprint: string;
    injuryFingerprint: string;
    model: string;
    source: "openai_batch" | "openai_chat" | "fallback";
    factPack: ProInsightFactPack;
  }
): Promise<void> {
  await db
    .collection("games")
    .doc(gameId)
    .set(
      {
        proInsightNarrative: {
          ...brief,
          factsFingerprint: meta.fingerprint,
          injuryFingerprint: meta.injuryFingerprint,
          model: meta.model,
          source: meta.source,
          generatedAtMs: Date.now(),
        },
        proInsightFacts: {
          fingerprint: meta.fingerprint,
          injuryFingerprint: meta.injuryFingerprint,
          phase: meta.factPack.phase,
          sections: meta.factPack.sections,
          packedAtMs: Date.now(),
          pendingBatch: false,
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

export async function submitProInsightNarrativeBatch(
  db: Firestore,
  input: {
    seasonKey?: string;
    fullHorizonHours?: number;
    nowMs?: number;
    gameIds?: string[];
    /** admin スモーク用。通常 cron は付けない */
    includePreseason?: boolean;
    /**
     * true なら Batch ではなく Chat Completions で即書き（スモーク向け）。
     * includePreseason / gameIds と併用想定。
     */
    syncChat?: boolean;
  } = {}
): Promise<ProInsightNarrativeBatchSubmitResult> {
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const nowMs = input.nowMs ?? Date.now();
  const errors: ProInsightNarrativeBatchSubmitResult["errors"] = [];
  let skipped = 0;
  let writtenFallback = 0;
  const model = getOpenAiProInsightModel();
  const openaiConfigured = isOpenAiConfigured();

  const seasonSnap = await loadLeagueTeamStatsSnapshot(db, seasonKey);
  const seasonRows = seasonSnap.bundle.season as NbaLeagueTeamStatRow[];
  const last10Rows = (seasonSnap.bundle.last10 ??
    []) as NbaLeagueTeamStatRow[];
  const priorKey = previousNbaSeasonKey(seasonKey);
  const priorSnap = await loadLeagueTeamStatsSnapshot(db, priorKey);
  const priorRows =
    priorSnap.source === "firestore" && priorSnap.bundle.season.length > 0
      ? (priorSnap.bundle.season as NbaLeagueTeamStatRow[])
      : null;

  // BDL 追加取得なし（コスト $0）
  let priorRecords = null as Awaited<
    ReturnType<typeof loadOrBuildTeamSeasonRecords>
  > | null;
  let seasonRecords = null as Awaited<
    ReturnType<typeof loadOrBuildTeamSeasonRecords>
  > | null;
  try {
    priorRecords = await loadOrBuildTeamSeasonRecords(db, priorKey, {
      fetchFromBdlIfSparse: false,
      seasonInProgress: false,
    });
  } catch {
    /* optional */
  }
  try {
    seasonRecords = await loadOrBuildTeamSeasonRecords(db, seasonKey, {
      fetchFromBdlIfSparse: false,
      seasonInProgress: true,
    });
    if (seasonRecords.gameCount === 0) seasonRecords = null;
  } catch {
    /* optional */
  }

  let priorAceOut = null as Awaited<ReturnType<typeof loadAceOutRecordsBundle>>;
  let seasonAceOut = null as Awaited<ReturnType<typeof loadAceOutRecordsBundle>>;
  try {
    priorAceOut = await loadAceOutRecordsBundle(db, priorKey);
  } catch {
    /* optional */
  }
  try {
    seasonAceOut = await loadAceOutRecordsBundle(db, seasonKey);
    if (seasonAceOut?.gameCount === 0) seasonAceOut = null;
  } catch {
    /* optional */
  }

  let playerLeaders = null as Awaited<
    ReturnType<typeof loadPlayerStatLeadersSnapshot>
  >["bundle"] | null;
  let priorPlayerLeaders = null as typeof playerLeaders;
  try {
    const leadersSnap = await loadPlayerStatLeadersSnapshot(db, seasonKey);
    if (leadersSnap.ok) playerLeaders = leadersSnap.bundle;
  } catch {
    /* optional */
  }
  try {
    const priorLeadersSnap = await loadPlayerStatLeadersSnapshot(db, priorKey);
    if (priorLeadersSnap.ok) priorPlayerLeaders = priorLeadersSnap.bundle;
  } catch {
    /* optional */
  }

  let priorConfRanks: Record<string, number> = {};
  let seasonConfRanks: Record<string, number> = {};
  try {
    priorConfRanks = confRankByTeamIdFromStandings(
      await loadNbaConferenceStandings(db, priorKey)
    );
  } catch {
    /* optional */
  }
  try {
    seasonConfRanks = confRankByTeamIdFromStandings(
      await loadNbaConferenceStandings(db, seasonKey)
    );
  } catch {
    /* optional */
  }

  let seasonMpgByPlayerId: Record<string, number> = {};
  let priorMpgByPlayerId: Record<string, number> = {};
  try {
    const rosterSnap = await loadTeamRostersSnapshot(db, seasonKey);
    seasonMpgByPlayerId = mpgByPlayerIdFromRosterTeams(rosterSnap.bundle.teams);
  } catch {
    /* optional */
  }
  try {
    const priorRosterSnap = await loadTeamRostersSnapshot(db, priorKey);
    priorMpgByPlayerId = mpgByPlayerIdFromRosterTeams(priorRosterSnap.bundle.teams);
  } catch {
    /* optional */
  }

  const injurySnap = await loadTeamInjuriesSnapshot(db, seasonKey);
  const injuryTeams = injurySnap.bundle.teams;
  const winPct = winPctByTeam(seasonRows);

  let games: Array<{ id: string; data: Record<string, unknown> }>;
  if (input.gameIds?.length) {
    const docs = await Promise.all(
      input.gameIds.map((id) => db.collection("games").doc(id).get())
    );
    games = docs
      .filter((d) => d.exists)
      .map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }));
  } else {
    const horizonH = input.fullHorizonHours ?? 36;
    games = await loadUpcomingNbaGames(db, {
      fromMs: nowMs,
      toMs: nowMs + horizonH * 60 * 60 * 1000,
      limit: 80,
    });
  }

  type Prepared = {
    gameId: string;
    pack: ProInsightFactPack;
    injuryFingerprint: string;
  };
  const prepared: Prepared[] = [];

  for (const game of games) {
    try {
      const tipAtMs = toMs(game.data.startAtJst);
      if (tipAtMs == null) {
        skipped += 1;
        continue;
      }
      if (
        !input.includePreseason &&
        !isProInsightEligibleNbaGame(game.data)
      ) {
        skipped += 1;
        continue;
      }
      const status = String(game.data.status ?? "").toLowerCase();
      // 明示 gameIds + syncChat スモークでは final も許可（閲覧確認用）
      const allowEnded = Boolean(
        input.syncChat && input.gameIds?.length && input.includePreseason
      );
      if (
        !allowEnded &&
        (game.data.final === true ||
          status === "final" ||
          status === "ended" ||
          status === "live")
      ) {
        skipped += 1;
        continue;
      }
      const homeTeamId = teamIdFromSide(game.data.home, game.data.homeTeamId);
      const awayTeamId = teamIdFromSide(game.data.away, game.data.awayTeamId);
      if (!homeTeamId || !awayTeamId) {
        skipped += 1;
        continue;
      }

      const homeGp = teamGamesPlayed(findTeamRow(seasonRows, homeTeamId));
      const awayGp = teamGamesPlayed(findTeamRow(seasonRows, awayTeamId));
      const phase = resolveProBriefPhase(Math.min(homeGp, awayGp));

      const recentDocs = await loadRecentNbaGamesAroundTeams(
        db,
        [homeTeamId, awayTeamId],
        tipAtMs,
        21 * 24 * 60 * 60 * 1000
      );
      const homePrior = parsePriorGamesForTeam(recentDocs, homeTeamId, tipAtMs);
      const awayPrior = parsePriorGamesForTeam(recentDocs, awayTeamId, tipAtMs);

      const highMinutePlayers = highMinutePlayersFromRecentGames({
        docs: recentDocs,
        teamIds: [homeTeamId, awayTeamId],
        beforeMs: tipAtMs,
      });

      const last10ForPack =
        last10Rows.length > 0
          ? enrichLast10RatingsFromGameDocs({
              last10Rows,
              seasonRows,
              gameDocs: recentDocs,
            })
          : last10Rows;

      const upcomingDocs = await loadUpcomingNbaGames(db, {
        fromMs: tipAtMs + 1,
        toMs: tipAtMs + 21 * 24 * 60 * 60 * 1000,
        limit: 80,
      });
      const homeNextGame = parseNextGameForTeam(
        upcomingDocs,
        homeTeamId,
        tipAtMs
      );
      const awayNextGame = parseNextGameForTeam(
        upcomingDocs,
        awayTeamId,
        tipAtMs
      );

      // opening=前季のみ。early/full=今季 + 選手単位で prior フォールバック（移籍で teamId 不一致なら shape のみ）
      const aceOut = phase === "opening" ? priorAceOut : seasonAceOut;
      const priorAceOutForPack = phase === "opening" ? null : priorAceOut;

      const homeInjuries = injuriesForTeam(injuryTeams, homeTeamId);
      const awayInjuries = injuriesForTeam(injuryTeams, awayTeamId);
      const injuryFingerprint = fingerprintInjuryStatus({
        homeTeamId,
        awayTeamId,
        homeInjuries,
        awayInjuries,
      });

      const pack = assembleProInsightFactPack({
        phase,
        homeTeamId,
        awayTeamId,
        tipAtMs,
        tonightVenueTeamId: homeTeamId,
        seasonRows,
        priorRows,
        last10Rows: last10ForPack.length ? last10ForPack : null,
        homeInjuries,
        awayInjuries,
        homePriorGames: homePrior,
        awayPriorGames: awayPrior,
        homeNextGame,
        awayNextGame,
        highMinutePlayers,
        homeRecentOppWinPcts: recentOppWinPcts({
          priorGames: homePrior,
          teamId: homeTeamId,
          winPct,
          allDocs: recentDocs,
          limit: 10,
        }),
        awayRecentOppWinPcts: recentOppWinPcts({
          priorGames: awayPrior,
          teamId: awayTeamId,
          winPct,
          allDocs: recentDocs,
          limit: 10,
        }),
        seasonRecords,
        priorRecords,
        aceOutRecords: aceOut,
        priorAceOutRecords: priorAceOutForPack,
        playerLeaders:
          phase === "opening"
            ? priorPlayerLeaders ?? playerLeaders
            : playerLeaders ?? priorPlayerLeaders,
        confRankByTeamId:
          phase === "opening"
            ? priorConfRanks
            : Object.keys(seasonConfRanks).length
              ? seasonConfRanks
              : priorConfRanks,
        mpgByPlayerId: mpgByPlayerIdForPhase(
          phase,
          seasonMpgByPlayerId,
          priorMpgByPlayerId
        ),
      });

      prepared.push({ gameId: game.id, pack, injuryFingerprint });
    } catch (e) {
      errors.push({
        gameId: game.id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  if (prepared.length === 0) {
    return {
      ok: errors.length === 0,
      mode: "batch_submit",
      seasonKey,
      openaiConfigured,
      jobId: null,
      openaiBatchId: null,
      gamesPrepared: 0,
      writtenFallback,
      skipped,
      errors,
    };
  }

  // キー無し / dry: フォールバック即書き
  if (!openaiConfigured) {
    for (const p of prepared) {
      const brief = fallbackNarrativeFromFactPack(p.pack);
      await writeNarrative(db, p.gameId, brief, {
        fingerprint: p.pack.fingerprint,
        injuryFingerprint: p.injuryFingerprint,
        model: "fallback",
        source: "fallback",
        factPack: p.pack,
      });
      writtenFallback += 1;
    }
    const jobId = `dry_${nowMs}`;
    await saveProInsightBatchJob(db, jobId, {
      openaiBatchId: null,
      status: "dry_run",
      pending: false,
      model: "fallback",
      seasonKey,
      gameIds: prepared.map((p) => p.gameId),
      customIds: prepared.map((p) => p.gameId),
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
      completedAtMs: nowMs,
      writtenGameIds: prepared.map((p) => p.gameId),
    });
    return {
      ok: true,
      mode: "batch_submit",
      seasonKey,
      openaiConfigured: false,
      jobId,
      openaiBatchId: null,
      gamesPrepared: prepared.length,
      writtenFallback,
      skipped,
      errors,
    };
  }

  // スモーク: Chat 即書き（Batch 待ちなし）
  if (input.syncChat) {
    const writtenIds: string[] = [];
    for (const p of prepared) {
      try {
        const brief = await generateProInsightNarrativeForGameChat(p.pack);
        await writeNarrative(db, p.gameId, brief, {
          fingerprint: p.pack.fingerprint,
          injuryFingerprint: p.injuryFingerprint,
          model,
          source: "openai_chat",
          factPack: p.pack,
        });
        writtenIds.push(p.gameId);
      } catch (e) {
        const brief = fallbackNarrativeFromFactPack(p.pack);
        await writeNarrative(db, p.gameId, brief, {
          fingerprint: p.pack.fingerprint,
          injuryFingerprint: p.injuryFingerprint,
          model: "fallback",
          source: "fallback",
          factPack: p.pack,
        });
        writtenFallback += 1;
        errors.push({
          gameId: p.gameId,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
    const jobId = `sync_${nowMs}`;
    await saveProInsightBatchJob(db, jobId, {
      openaiBatchId: null,
      status: "completed",
      pending: false,
      model,
      seasonKey,
      gameIds: prepared.map((p) => p.gameId),
      customIds: prepared.map((p) => p.gameId),
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
      completedAtMs: Date.now(),
      writtenGameIds: writtenIds,
    });
    return {
      ok: errors.length === 0,
      mode: "batch_submit",
      seasonKey,
      openaiConfigured: true,
      jobId,
      openaiBatchId: null,
      gamesPrepared: prepared.length,
      writtenFallback,
      skipped,
      errors,
    };
  }

  const lines: OpenAiBatchJsonlLine[] = prepared.map((p) => ({
    custom_id: p.gameId,
    method: "POST",
    url: "/v1/chat/completions",
    body: {
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: PRO_INSIGHT_LLM_SYSTEM },
        { role: "user", content: buildProInsightLlmUserPayload(p.pack) },
      ],
    },
  }));

  // facts を試合に先置き（poll 時に照合）
  for (const p of prepared) {
    await db
      .collection("games")
      .doc(p.gameId)
      .set(
        {
          proInsightFacts: {
            fingerprint: p.pack.fingerprint,
            injuryFingerprint: p.injuryFingerprint,
            phase: p.pack.phase,
            sections: p.pack.sections,
            packedAtMs: nowMs,
            pendingBatch: true,
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
  }

  try {
    const jsonl = buildBatchJsonl(lines);
    const inputFileId = await uploadOpenAiBatchJsonl(jsonl);
    const batch = await createOpenAiBatch({
      inputFileId,
      metadata: {
        seasonKey,
        purpose: "pro_insight_narrative",
      },
    });
    const jobId = batch.id;
    await saveProInsightBatchJob(db, jobId, {
      openaiBatchId: batch.id,
      status: "submitted",
      pending: true,
      model,
      seasonKey,
      gameIds: prepared.map((p) => p.gameId),
      customIds: prepared.map((p) => p.gameId),
      inputFileId,
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
    });
    return {
      ok: true,
      mode: "batch_submit",
      seasonKey,
      openaiConfigured: true,
      jobId,
      openaiBatchId: batch.id,
      gamesPrepared: prepared.length,
      writtenFallback: 0,
      skipped,
      errors,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push({ error: msg });
    // 失敗時フォールバック
    for (const p of prepared) {
      const brief = fallbackNarrativeFromFactPack(p.pack);
      await writeNarrative(db, p.gameId, brief, {
        fingerprint: p.pack.fingerprint,
        injuryFingerprint: p.injuryFingerprint,
        model: "fallback",
        source: "fallback",
        factPack: p.pack,
      });
      writtenFallback += 1;
    }
    return {
      ok: false,
      mode: "batch_submit",
      seasonKey,
      openaiConfigured: true,
      jobId: null,
      openaiBatchId: null,
      gamesPrepared: prepared.length,
      writtenFallback,
      skipped,
      errors,
    };
  }
}

export async function pollProInsightNarrativeBatches(
  db: Firestore
): Promise<ProInsightNarrativeBatchPollResult> {
  const errors: ProInsightNarrativeBatchPollResult["errors"] = [];
  let completed = 0;
  let stillRunning = 0;
  let written = 0;

  if (!isOpenAiConfigured()) {
    return {
      ok: true,
      mode: "batch_poll",
      polled: 0,
      completed: 0,
      stillRunning: 0,
      written: 0,
      errors: [{ error: "OPENAI_API_KEY not set — nothing to poll" }],
    };
  }

  const pending = await listPendingProInsightBatchJobs(db);
  for (const job of pending) {
    try {
      const batchId = job.data.openaiBatchId ?? job.id;
      const remote = await getOpenAiBatch(batchId);
      const status = remote.status;
      const mappedStatus =
        status === "completed"
          ? "completed"
          : status === "failed" ||
              status === "expired" ||
              status === "cancelled"
            ? status
            : status === "validating" ||
                status === "in_progress" ||
                status === "finalizing"
              ? status
              : "in_progress";
      const stillPending =
        mappedStatus === "validating" ||
        mappedStatus === "in_progress" ||
        mappedStatus === "finalizing";

      await saveProInsightBatchJob(db, job.id, {
        ...job.data,
        status: mappedStatus,
        pending: stillPending,
        outputFileId: remote.output_file_id ?? job.data.outputFileId,
        updatedAtMs: Date.now(),
      });

      if (stillPending) {
        stillRunning += 1;
        continue;
      }

      if (status !== "completed" || !remote.output_file_id) {
        completed += 1;
        await saveProInsightBatchJob(db, job.id, {
          ...job.data,
          status: mappedStatus,
          pending: false,
          outputFileId: remote.output_file_id ?? job.data.outputFileId,
          updatedAtMs: Date.now(),
          completedAtMs: Date.now(),
          error: `batch ended with status=${status}`,
        });
        // 失敗分フォールバック
        for (const gameId of job.data.gameIds) {
          const g = await db.collection("games").doc(gameId).get();
          const facts = g.data()?.proInsightFacts as
            | {
                fingerprint?: string;
                injuryFingerprint?: string;
                sections?: ProInsightFactPack["sections"];
                phase?: ProInsightFactPack["phase"];
              }
            | undefined;
          if (!facts?.sections || !facts.fingerprint) continue;
          const pack: ProInsightFactPack = {
            homeTeamId: String(g.data()?.homeTeamId ?? ""),
            awayTeamId: String(g.data()?.awayTeamId ?? ""),
            tipAtMs: toMs(g.data()?.startAtJst) ?? Date.now(),
            phase: (facts.phase as ProInsightFactPack["phase"]) ?? "full",
            sections: facts.sections,
            candidates: [],
            fingerprint: facts.fingerprint,
          };
          const homeId = teamIdFromSide(g.data()?.home, g.data()?.homeTeamId);
          const awayId = teamIdFromSide(g.data()?.away, g.data()?.awayTeamId);
          pack.homeTeamId = homeId;
          pack.awayTeamId = awayId;
          const brief = fallbackNarrativeFromFactPack(pack);
          await writeNarrative(db, gameId, brief, {
            fingerprint: pack.fingerprint,
            injuryFingerprint: facts.injuryFingerprint ?? "unknown",
            model: "fallback",
            source: "fallback",
            factPack: pack,
          });
          written += 1;
        }
        continue;
      }

      completed += 1;
      const outText = await downloadOpenAiFileText(remote.output_file_id);
      const writtenIds: string[] = [];
      for (const line of outText.split("\n")) {
        if (!line.trim()) continue;
        let row: {
          custom_id?: string;
          response?: {
            body?: {
              choices?: Array<{ message?: { content?: string } }>;
            };
          };
          error?: unknown;
        };
        try {
          row = JSON.parse(line) as typeof row;
        } catch {
          continue;
        }
        const gameId = String(row.custom_id ?? "").trim();
        if (!gameId) continue;
        const content = row.response?.body?.choices?.[0]?.message?.content;
        const g = await db.collection("games").doc(gameId).get();
        if (!g.exists) continue;
        const homeId = teamIdFromSide(g.data()?.home, g.data()?.homeTeamId);
        const awayId = teamIdFromSide(g.data()?.away, g.data()?.awayTeamId);
        const facts = g.data()?.proInsightFacts as
          | {
              fingerprint?: string;
              injuryFingerprint?: string;
              sections?: ProInsightFactPack["sections"];
              phase?: ProInsightFactPack["phase"];
            }
          | undefined;

        const pack: ProInsightFactPack = {
          homeTeamId: homeId,
          awayTeamId: awayId,
          tipAtMs: toMs(g.data()?.startAtJst) ?? Date.now(),
          phase: (facts?.phase as ProInsightFactPack["phase"]) ?? "full",
          sections: facts?.sections ?? {
            MATCHUP: [],
            SCHEDULE: [],
            CONTEXT: [],
            "INJURY IMPACT": [],
          },
          candidates: [],
          fingerprint: facts?.fingerprint ?? "unknown",
        };

        let brief =
          (content &&
            parseProInsightLlmJson(content, {
              homeTeamId: homeId,
              awayTeamId: awayId,
            })) ||
          null;
        const source = brief ? "openai_batch" : "fallback";
        if (!brief) brief = fallbackNarrativeFromFactPack(pack);

        await writeNarrative(db, gameId, brief, {
          fingerprint: pack.fingerprint,
          injuryFingerprint: facts?.injuryFingerprint ?? "unknown",
          model: job.data.model,
          source,
          factPack: pack,
        });
        written += 1;
        writtenIds.push(gameId);
      }

      await saveProInsightBatchJob(db, job.id, {
        ...job.data,
        status: "completed",
        pending: false,
        outputFileId: remote.output_file_id,
        updatedAtMs: Date.now(),
        completedAtMs: Date.now(),
        writtenGameIds: writtenIds,
      });
    } catch (e) {
      errors.push({
        jobId: job.id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return {
    ok: errors.length === 0,
    mode: "batch_poll",
    polled: pending.length,
    completed,
    stillRunning,
    written,
    errors,
  };
}

/** patch 用: 単試合を通常 Chat Completions で即生成 */
export async function generateProInsightNarrativeForGameChat(
  pack: ProInsightFactPack
): Promise<ProInsightNarrativeBrief> {
  if (!isOpenAiConfigured()) {
    return fallbackNarrativeFromFactPack(pack);
  }
  try {
    const content = await openAiChatCompletionJson({
      model: getOpenAiProInsightModel(),
      system: PRO_INSIGHT_LLM_SYSTEM,
      user: buildProInsightLlmUserPayload(pack),
    });
    return (
      parseProInsightLlmJson(content, {
        homeTeamId: pack.homeTeamId,
        awayTeamId: pack.awayTeamId,
      }) ?? fallbackNarrativeFromFactPack(pack)
    );
  } catch {
    return fallbackNarrativeFromFactPack(pack);
  }
}

/**
 * tip 1h 前 — injury ステータス指紋が変わった試合だけ Chat で再生成。
 * 変更なしは skip（コスト $0）。
 */
export async function patchProInsightNarrativesIfInjuryChanged(
  db: Firestore,
  input: {
    seasonKey?: string;
    nowMs?: number;
    gameIds?: string[];
  } = {}
): Promise<ProInsightNarrativePatchResult> {
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const nowMs = input.nowMs ?? Date.now();
  const errors: ProInsightNarrativePatchResult["errors"] = [];
  let scanned = 0;
  let written = 0;
  let skippedUnchanged = 0;
  let skippedOther = 0;
  const model = getOpenAiProInsightModel();

  const seasonSnap = await loadLeagueTeamStatsSnapshot(db, seasonKey);
  const seasonRows = seasonSnap.bundle.season as NbaLeagueTeamStatRow[];
  const last10Rows = (seasonSnap.bundle.last10 ??
    []) as NbaLeagueTeamStatRow[];
  const priorKey = previousNbaSeasonKey(seasonKey);
  const priorSnap = await loadLeagueTeamStatsSnapshot(db, priorKey);
  const priorRows =
    priorSnap.source === "firestore" && priorSnap.bundle.season.length > 0
      ? (priorSnap.bundle.season as NbaLeagueTeamStatRow[])
      : null;

  let priorRecords = null as Awaited<
    ReturnType<typeof loadOrBuildTeamSeasonRecords>
  > | null;
  let seasonRecords = null as Awaited<
    ReturnType<typeof loadOrBuildTeamSeasonRecords>
  > | null;
  try {
    priorRecords = await loadOrBuildTeamSeasonRecords(db, priorKey, {
      fetchFromBdlIfSparse: false,
      seasonInProgress: false,
    });
  } catch {
    /* optional */
  }
  try {
    seasonRecords = await loadOrBuildTeamSeasonRecords(db, seasonKey, {
      fetchFromBdlIfSparse: false,
      seasonInProgress: true,
    });
    if (seasonRecords.gameCount === 0) seasonRecords = null;
  } catch {
    /* optional */
  }

  let priorAceOut = null as Awaited<ReturnType<typeof loadAceOutRecordsBundle>>;
  let seasonAceOut = null as Awaited<ReturnType<typeof loadAceOutRecordsBundle>>;
  try {
    priorAceOut = await loadAceOutRecordsBundle(db, priorKey);
  } catch {
    /* optional */
  }
  try {
    seasonAceOut = await loadAceOutRecordsBundle(db, seasonKey);
    if (seasonAceOut?.gameCount === 0) seasonAceOut = null;
  } catch {
    /* optional */
  }

  let playerLeaders = null as Awaited<
    ReturnType<typeof loadPlayerStatLeadersSnapshot>
  >["bundle"] | null;
  let priorPlayerLeaders = null as typeof playerLeaders;
  try {
    const leadersSnap = await loadPlayerStatLeadersSnapshot(db, seasonKey);
    if (leadersSnap.ok) playerLeaders = leadersSnap.bundle;
  } catch {
    /* optional */
  }
  try {
    const priorLeadersSnap = await loadPlayerStatLeadersSnapshot(db, priorKey);
    if (priorLeadersSnap.ok) priorPlayerLeaders = priorLeadersSnap.bundle;
  } catch {
    /* optional */
  }

  let priorConfRanks: Record<string, number> = {};
  let seasonConfRanks: Record<string, number> = {};
  try {
    priorConfRanks = confRankByTeamIdFromStandings(
      await loadNbaConferenceStandings(db, priorKey)
    );
  } catch {
    /* optional */
  }
  try {
    seasonConfRanks = confRankByTeamIdFromStandings(
      await loadNbaConferenceStandings(db, seasonKey)
    );
  } catch {
    /* optional */
  }

  let seasonMpgByPlayerId: Record<string, number> = {};
  let priorMpgByPlayerId: Record<string, number> = {};
  try {
    const rosterSnap = await loadTeamRostersSnapshot(db, seasonKey);
    seasonMpgByPlayerId = mpgByPlayerIdFromRosterTeams(rosterSnap.bundle.teams);
  } catch {
    /* optional */
  }
  try {
    const priorRosterSnap = await loadTeamRostersSnapshot(db, priorKey);
    priorMpgByPlayerId = mpgByPlayerIdFromRosterTeams(priorRosterSnap.bundle.teams);
  } catch {
    /* optional */
  }

  const injurySnap = await loadTeamInjuriesSnapshot(db, seasonKey);
  const injuryTeams = injurySnap.bundle.teams;
  const winPct = winPctByTeam(seasonRows);

  let games: Array<{ id: string; data: Record<string, unknown> }>;
  if (input.gameIds?.length) {
    const docs = await Promise.all(
      input.gameIds.map((id) => db.collection("games").doc(id).get())
    );
    games = docs
      .filter((d) => d.exists)
      .map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }));
  } else {
    games = await loadUpcomingNbaGames(db, {
      fromMs: nowMs,
      toMs: nowMs + 1.5 * 60 * 60 * 1000,
      limit: 40,
    });
  }

  for (const game of games) {
    scanned += 1;
    try {
      const tipAtMs = toMs(game.data.startAtJst);
      if (tipAtMs == null || !isWithinProBriefPatchWindow(tipAtMs, nowMs)) {
        skippedOther += 1;
        continue;
      }
      if (!isProInsightEligibleNbaGame(game.data)) {
        skippedOther += 1;
        continue;
      }
      const status = String(game.data.status ?? "").toLowerCase();
      if (
        game.data.final === true ||
        status === "final" ||
        status === "ended" ||
        status === "live"
      ) {
        skippedOther += 1;
        continue;
      }
      const homeTeamId = teamIdFromSide(game.data.home, game.data.homeTeamId);
      const awayTeamId = teamIdFromSide(game.data.away, game.data.awayTeamId);
      if (!homeTeamId || !awayTeamId) {
        skippedOther += 1;
        continue;
      }

      const homeInjuries = injuriesForTeam(injuryTeams, homeTeamId);
      const awayInjuries = injuriesForTeam(injuryTeams, awayTeamId);
      const injuryFingerprint = fingerprintInjuryStatus({
        homeTeamId,
        awayTeamId,
        homeInjuries,
        awayInjuries,
      });

      const prevInjuryFp = String(
        (game.data.proInsightFacts as { injuryFingerprint?: string } | undefined)
          ?.injuryFingerprint ??
          (game.data.proInsightNarrative as
            | { injuryFingerprint?: string }
            | undefined)?.injuryFingerprint ??
          ""
      );
      const hasNarrative = Boolean(game.data.proInsightNarrative);
      if (hasNarrative && prevInjuryFp && prevInjuryFp === injuryFingerprint) {
        skippedUnchanged += 1;
        continue;
      }

      const homeGp = teamGamesPlayed(findTeamRow(seasonRows, homeTeamId));
      const awayGp = teamGamesPlayed(findTeamRow(seasonRows, awayTeamId));
      const phase = resolveProBriefPhase(Math.min(homeGp, awayGp));
      const recentDocs = await loadRecentNbaGamesAroundTeams(
        db,
        [homeTeamId, awayTeamId],
        tipAtMs,
        21 * 24 * 60 * 60 * 1000
      );
      const homePrior = parsePriorGamesForTeam(recentDocs, homeTeamId, tipAtMs);
      const awayPrior = parsePriorGamesForTeam(recentDocs, awayTeamId, tipAtMs);
      const highMinutePlayers = highMinutePlayersFromRecentGames({
        docs: recentDocs,
        teamIds: [homeTeamId, awayTeamId],
        beforeMs: tipAtMs,
      });

      const last10ForPack =
        last10Rows.length > 0
          ? enrichLast10RatingsFromGameDocs({
              last10Rows,
              seasonRows,
              gameDocs: recentDocs,
            })
          : last10Rows;
      const upcomingDocs = await loadUpcomingNbaGames(db, {
        fromMs: tipAtMs + 1,
        toMs: tipAtMs + 21 * 24 * 60 * 60 * 1000,
        limit: 80,
      });
      const homeNextGame = parseNextGameForTeam(
        upcomingDocs,
        homeTeamId,
        tipAtMs
      );
      const awayNextGame = parseNextGameForTeam(
        upcomingDocs,
        awayTeamId,
        tipAtMs
      );
      // opening=前季のみ。early/full=今季 + 選手単位で prior フォールバック
      const aceOut = phase === "opening" ? priorAceOut : seasonAceOut;
      const priorAceOutForPack = phase === "opening" ? null : priorAceOut;

      const pack = assembleProInsightFactPack({
        phase,
        homeTeamId,
        awayTeamId,
        tipAtMs,
        tonightVenueTeamId: homeTeamId,
        seasonRows,
        priorRows,
        last10Rows: last10ForPack.length ? last10ForPack : null,
        homeInjuries,
        awayInjuries,
        homePriorGames: homePrior,
        awayPriorGames: awayPrior,
        homeNextGame,
        awayNextGame,
        highMinutePlayers,
        homeRecentOppWinPcts: recentOppWinPcts({
          priorGames: homePrior,
          teamId: homeTeamId,
          winPct,
          allDocs: recentDocs,
          limit: 10,
        }),
        awayRecentOppWinPcts: recentOppWinPcts({
          priorGames: awayPrior,
          teamId: awayTeamId,
          winPct,
          allDocs: recentDocs,
          limit: 10,
        }),
        seasonRecords,
        priorRecords,
        aceOutRecords: aceOut,
        priorAceOutRecords: priorAceOutForPack,
        playerLeaders:
          phase === "opening"
            ? priorPlayerLeaders ?? playerLeaders
            : playerLeaders ?? priorPlayerLeaders,
        confRankByTeamId:
          phase === "opening"
            ? priorConfRanks
            : Object.keys(seasonConfRanks).length
              ? seasonConfRanks
              : priorConfRanks,
        mpgByPlayerId: mpgByPlayerIdForPhase(
          phase,
          seasonMpgByPlayerId,
          priorMpgByPlayerId
        ),
      });

      const brief = await generateProInsightNarrativeForGameChat(pack);
      const source = isOpenAiConfigured() ? "openai_chat" : "fallback";
      await writeNarrative(db, game.id, brief, {
        fingerprint: pack.fingerprint,
        injuryFingerprint,
        model: source === "fallback" ? "fallback" : model,
        source,
        factPack: pack,
      });
      written += 1;
    } catch (e) {
      errors.push({
        gameId: game.id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return {
    ok: errors.length === 0,
    mode: "narrative_patch",
    seasonKey,
    scanned,
    written,
    skippedUnchanged,
    skippedOther,
    errors,
  };
}
