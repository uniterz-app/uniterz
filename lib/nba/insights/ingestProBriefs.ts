/**
 * Pro Insight を games/{id}.proBrief に書き込む。
 * mode full: 対象窓の試合をフル生成（前日 19:00 JST）
 * mode patch: tip まで 1h 以内の試合にケガ情報を反映
 */
import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore";
import {
  CURRENT_NBA_SEASON_KEY,
  previousNbaSeasonKey,
} from "@/lib/rankings/nbaSeason";
import { loadLeagueTeamStatsSnapshot } from "@/lib/nba/leagueTeamStats/loadLeagueTeamStatsSnapshot";
import { loadTeamInjuriesSnapshot } from "@/lib/nba/teamInjuries/loadTeamInjuriesSnapshot";
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import type { PredictProBrief } from "@/lib/predict/predictProBrief";
import { sanitizeProBriefForDisplay } from "@/lib/predict/validateProBrief";
import {
  generateMatchupInsight,
  patchMatchupInsightInjuriesAndSchedule,
} from "@/lib/nba/insights/generateMatchupInsight";
import { isWithinProBriefPatchWindow } from "@/lib/nba/insights/proInsightPhases";
import type { TeamScheduleInput } from "@/lib/nba/insights/buildScheduleLines";
import { loadOrBuildTeamSeasonRecords } from "@/lib/nba/insights/loadPriorSeasonTeamRecords";
import { loadAceOutRecordsBundle } from "@/lib/nba/insights/ingestNbaTeamAceOutRecords";

export type NbaProBriefIngestMode = "full" | "patch";

export type NbaProBriefIngestResult = {
  ok: boolean;
  mode: NbaProBriefIngestMode;
  seasonKey: string;
  scanned: number;
  written: number;
  skipped: number;
  errors: Array<{ gameId: string; error: string }>;
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

function parsePriorGamesForTeam(
  docs: Array<{ id: string; data: Record<string, unknown> }>,
  teamId: string,
  beforeMs: number
): TeamScheduleInput["priorGames"] {
  const out: TeamScheduleInput["priorGames"] = [];
  for (const doc of docs) {
    const tip = toMs(doc.data.startAtJst);
    if (tip == null || tip >= beforeMs) continue;
    const homeId = teamIdFromSide(doc.data.home, doc.data.homeTeamId);
    const awayId = teamIdFromSide(doc.data.away, doc.data.awayTeamId);
    if (homeId !== teamId && awayId !== teamId) continue;
    const isHome = homeId === teamId;
    const venueTeamId = homeId;
    const status = String(doc.data.status ?? "").toLowerCase();
    const final = doc.data.final === true || status === "final" || status === "ended";
    if (!final && tip > Date.now() - 6 * 60 * 60 * 1000) continue;
    out.push({
      startAtMs: tip,
      venueTeamId,
      isHome,
      overtime: Boolean(doc.data.overtime ?? doc.data.wentOvertime),
    });
  }
  return out.sort((a, b) => a.startAtMs - b.startAtMs);
}

function winPctByTeam(rows: NbaLeagueTeamStatRow[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) m.set(r.teamId, r.winPct);
  return m;
}

function recentOppWinPcts(input: {
  priorGames: TeamScheduleInput["priorGames"];
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
    const doc = input.allDocs.find((d) => {
      const tip = toMs(d.data.startAtJst);
      return tip === g.startAtMs;
    });
    if (!doc) continue;
    const homeId = teamIdFromSide(doc.data.home, doc.data.homeTeamId);
    const awayId = teamIdFromSide(doc.data.away, doc.data.awayTeamId);
    const oppId = homeId === input.teamId ? awayId : homeId;
    const pct = input.winPct.get(oppId);
    if (pct != null) out.push(pct);
  }
  return out.reverse();
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

export async function ingestNbaProBriefs(
  db: Firestore,
  input: {
    seasonKey?: string;
    mode?: NbaProBriefIngestMode;
    /** full: これから何時間先まで（既定 36h = 翌日分） */
    fullHorizonHours?: number;
    nowMs?: number;
    gameIds?: string[];
    /** 前季 games 集計を強制再構築 */
    rebuildPriorRecords?: boolean;
  } = {}
): Promise<NbaProBriefIngestResult> {
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const mode: NbaProBriefIngestMode = input.mode === "patch" ? "patch" : "full";
  const nowMs = input.nowMs ?? Date.now();
  const errors: NbaProBriefIngestResult["errors"] = [];
  let written = 0;
  let skipped = 0;

  const seasonSnap = await loadLeagueTeamStatsSnapshot(db, seasonKey);
  const seasonRows = seasonSnap.bundle.season as NbaLeagueTeamStatRow[];
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
      forceRebuild: input.rebuildPriorRecords === true,
      fetchFromBdlIfSparse: true,
      seasonInProgress: false,
    });
  } catch (e) {
    console.warn(
      "[ingestNbaProBriefs] prior season records unavailable",
      e instanceof Error ? e.message : e
    );
  }
  try {
    // 今季未開幕なら空のまま（BDL 全件取得はしない）
    seasonRecords = await loadOrBuildTeamSeasonRecords(db, seasonKey, {
      forceRebuild: input.rebuildPriorRecords === true,
      fetchFromBdlIfSparse: false,
      seasonInProgress: true,
    });
    if (seasonRecords.gameCount === 0) {
      seasonRecords = null;
    }
  } catch (e) {
    console.warn(
      "[ingestNbaProBriefs] current season records unavailable",
      e instanceof Error ? e.message : e
    );
  }

  let priorAceOutRecords = null as Awaited<
    ReturnType<typeof loadAceOutRecordsBundle>
  >;
  let seasonAceOutRecords = null as Awaited<
    ReturnType<typeof loadAceOutRecordsBundle>
  >;
  try {
    priorAceOutRecords = await loadAceOutRecordsBundle(db, priorKey);
  } catch (e) {
    console.warn(
      "[ingestNbaProBriefs] prior ace-out records unavailable",
      e instanceof Error ? e.message : e
    );
  }
  try {
    seasonAceOutRecords = await loadAceOutRecordsBundle(db, seasonKey);
    if (seasonAceOutRecords && seasonAceOutRecords.gameCount === 0) {
      seasonAceOutRecords = null;
    }
  } catch (e) {
    console.warn(
      "[ingestNbaProBriefs] season ace-out records unavailable",
      e instanceof Error ? e.message : e
    );
  }

  let injurySnap = await loadTeamInjuriesSnapshot(db, seasonKey);
  if (mode === "patch") {
    // tip 1h 前: BDL から最新ケガを取り直してから完全版を書く
    try {
      const { ingestNbaTeamInjuriesFromBdl } = await import(
        "@/lib/nba/ingest/nbaTeamInjuriesIngest"
      );
      await ingestNbaTeamInjuriesFromBdl(db, { seasonKey });
      injurySnap = await loadTeamInjuriesSnapshot(db, seasonKey);
    } catch (e) {
      console.warn(
        "[ingestNbaProBriefs] injury refresh before patch failed; using last snapshot",
        e instanceof Error ? e.message : e
      );
    }
  }
  const injuryTeams = injurySnap.bundle.teams;

  let games: Array<{ id: string; data: Record<string, unknown> }>;
  if (input.gameIds?.length) {
    const docs = await Promise.all(
      input.gameIds.map((id) => db.collection("games").doc(id).get())
    );
    games = docs
      .filter((d) => d.exists)
      .map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }));
  } else if (mode === "patch") {
    // tip まで最大 1h + 少し余裕（毎時 cron が窓を拾う）
    games = await loadUpcomingNbaGames(db, {
      fromMs: nowMs,
      toMs: nowMs + 1.5 * 60 * 60 * 1000,
      limit: 40,
    });
  } else {
    const horizonH = input.fullHorizonHours ?? 36;
    games = await loadUpcomingNbaGames(db, {
      fromMs: nowMs,
      toMs: nowMs + horizonH * 60 * 60 * 1000,
      limit: 80,
    });
  }

  const winPct = winPctByTeam(seasonRows);

  for (const game of games) {
    try {
      const tipAtMs = toMs(game.data.startAtJst);
      if (tipAtMs == null) {
        skipped += 1;
        continue;
      }
      if (mode === "patch" && !isWithinProBriefPatchWindow(tipAtMs, nowMs)) {
        skipped += 1;
        continue;
      }
      const status = String(game.data.status ?? "").toLowerCase();
      if (
        game.data.final === true ||
        status === "final" ||
        status === "ended" ||
        status === "live"
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

      const recentDocs = await loadRecentNbaGamesAroundTeams(
        db,
        [homeTeamId, awayTeamId],
        tipAtMs,
        21 * 24 * 60 * 60 * 1000
      );
      const homePrior = parsePriorGamesForTeam(recentDocs, homeTeamId, tipAtMs);
      const awayPrior = parsePriorGamesForTeam(recentDocs, awayTeamId, tipAtMs);

      const genInput = {
        homeTeamId,
        awayTeamId,
        tipAtMs,
        seasonRows,
        priorSeasonRows: priorRows,
        priorRecords,
        seasonRecords,
        priorAceOutRecords,
        seasonAceOutRecords,
        homeInjuries: injuriesForTeam(injuryTeams, homeTeamId),
        awayInjuries: injuriesForTeam(injuryTeams, awayTeamId),
        homePriorGames: homePrior,
        awayPriorGames: awayPrior,
        homeRecentOppWinPcts: recentOppWinPcts({
          priorGames: homePrior,
          teamId: homeTeamId,
          winPct,
          allDocs: recentDocs,
          limit: 5,
        }),
        awayRecentOppWinPcts: recentOppWinPcts({
          priorGames: awayPrior,
          teamId: awayTeamId,
          winPct,
          allDocs: recentDocs,
          limit: 5,
        }),
        nowMs,
      };

      let brief: PredictProBrief;
      if (mode === "patch") {
        const existing = game.data.proBrief as PredictProBrief | undefined;
        if (existing && existing.home && existing.away) {
          brief = patchMatchupInsightInjuriesAndSchedule(existing, genInput);
        } else {
          brief = generateMatchupInsight(genInput);
        }
      } else {
        brief = generateMatchupInsight(genInput);
      }

      const safe = sanitizeProBriefForDisplay(brief);
      if (!safe) {
        skipped += 1;
        continue;
      }

      const toStore: PredictProBrief = {
        ...safe,
        phase: brief.phase,
        sampleNoteJa: brief.sampleNoteJa,
        sampleNoteEn: brief.sampleNoteEn,
        gamesPlayed: brief.gamesPlayed,
        generatedAtMs: brief.generatedAtMs,
        patchedAtMs: brief.patchedAtMs,
      };

      await db.collection("games").doc(game.id).set(
        {
          proBrief: toStore,
          proBriefUpdatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
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
    mode,
    seasonKey,
    scanned: games.length,
    written,
    skipped,
    errors,
  };
}
