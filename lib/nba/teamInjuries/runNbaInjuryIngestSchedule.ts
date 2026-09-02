/**
 * NBA injury 専用 ingest スケジューラ。
 * BDL → Firestore `nbaTeamInjuries/{season}`（1 doc を全ユーザー共有）。
 */
import type { Firestore } from "firebase-admin/firestore";
import { ingestNbaTeamInjuriesFromBdl } from "@/lib/nba/ingest/nbaTeamInjuriesIngest";
import { loadUpcomingNbaGames } from "@/lib/nba/games/loadUpcomingNbaGames";
import { hasNbaGamesScheduledJstToday } from "@/lib/nba/schedule/hasNbaGamesScheduledJstToday";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { loadTeamInjuriesSnapshot } from "./loadTeamInjuriesSnapshot";
import {
  INJURY_INGEST_MIN_INTERVAL_MS,
  INJURY_PREGAME_LOOKAHEAD_MS,
  injuryIngestUpdatedWithinMs,
  isAnyGameInInjuryPregameWindow,
} from "./injuryIngestSchedule";

export type NbaInjuryIngestTrigger = "baseline" | "pregame";

export type NbaInjuryIngestBaselineSlot = "16" | "23";

export type RunNbaInjuryIngestScheduleInput = {
  seasonKey?: string;
  trigger: NbaInjuryIngestTrigger;
  /** baseline: 16=ランキング日の朝枠, 23=今夜試合向け */
  baselineSlot?: NbaInjuryIngestBaselineSlot;
  nowMs?: number;
};

export type RunNbaInjuryIngestScheduleResult = {
  ok: true;
  trigger: NbaInjuryIngestTrigger;
  baselineSlot?: NbaInjuryIngestBaselineSlot;
  seasonKey: string;
  skipped: boolean;
  skipReason?:
    | "no_games_today"
    | "no_pregame_window"
    | "recent_fetch";
  teamCount?: number;
  injuryCount?: number;
};

export async function runNbaInjuryIngestSchedule(
  db: Firestore,
  input: RunNbaInjuryIngestScheduleInput
): Promise<RunNbaInjuryIngestScheduleResult> {
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const nowMs = input.nowMs ?? Date.now();
  const now = new Date(nowMs);

  if (input.trigger === "baseline" && input.baselineSlot === "16") {
    const hasGames = await hasNbaGamesScheduledJstToday(db, now);
    if (!hasGames) {
      return {
        ok: true,
        trigger: input.trigger,
        baselineSlot: input.baselineSlot,
        seasonKey,
        skipped: true,
        skipReason: "no_games_today",
      };
    }
  }

  if (input.trigger === "pregame") {
    const games = await loadUpcomingNbaGames(db, {
      fromMs: nowMs,
      toMs: nowMs + INJURY_PREGAME_LOOKAHEAD_MS,
      limit: 40,
    });
    if (!isAnyGameInInjuryPregameWindow(games, nowMs)) {
      return {
        ok: true,
        trigger: input.trigger,
        seasonKey,
        skipped: true,
        skipReason: "no_pregame_window",
      };
    }

    const snap = await loadTeamInjuriesSnapshot(db, seasonKey);
    if (
      injuryIngestUpdatedWithinMs(
        snap.updatedAt,
        nowMs,
        INJURY_INGEST_MIN_INTERVAL_MS
      )
    ) {
      return {
        ok: true,
        trigger: input.trigger,
        seasonKey,
        skipped: true,
        skipReason: "recent_fetch",
      };
    }
  }

  const ingested = await ingestNbaTeamInjuriesFromBdl(db, { seasonKey });
  return {
    ok: true,
    trigger: input.trigger,
    baselineSlot: input.baselineSlot,
    seasonKey,
    skipped: false,
    teamCount: ingested.teamCount,
    injuryCount: ingested.injuryCount,
  };
}
