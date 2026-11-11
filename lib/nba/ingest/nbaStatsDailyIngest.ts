/**
 * NBA スタッツ日次 ingest オーケストレータ。
 * 公開 API は触らず、BDL → Firestore だけ回す。
 *
 * daily（既定）: 試合・リーグ表・チームログ・ゾーン・ロスター
 *   + 直近試合出場者のプレイヤー試合ログ（incremental → Last 10 更新）
 * heavy: 上記 + プレイヤー試合ログ全ロスター（任意）
 */
import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { ingestNbaGamesFromBdl } from "@/lib/nba/ingest/nbaGamesIngest";
import { ingestNbaLeagueStatsFromProvider } from "@/lib/nba/ingest/nbaLeagueStatsIngest";
import { ingestNbaTeamGameLogsFromGames } from "@/lib/nba/ingest/nbaTeamGameLogsIngest";
import { ingestNbaStandingsFromBdl } from "@/lib/nba/ingest/nbaStandingsIngest";
import { ingestNbaPlayerShotZonesFromBdl } from "@/lib/nba/ingest/nbaPlayerShotZonesIngest";
import { ingestNbaTeamRostersFromBdl } from "@/lib/nba/ingest/nbaTeamRostersIngest";
import { ingestNbaPlayerGameLogsFromBdl } from "@/lib/nba/ingest/nbaPlayerGameLogsIngest";
import { listPlayerIdsFromRecentBoxScores } from "@/lib/nba/ingest/listPlayerIdsFromRecentBoxScores";
import { loadOrBuildTeamSeasonRecords } from "@/lib/nba/insights/loadPriorSeasonTeamRecords";
import { ingestNbaTeamShapesFromGames } from "@/lib/nba/ingest/nbaTeamShapesIngest";
import { ingestNbaTeamOffseasonMoves } from "@/lib/nba/ingest/nbaTeamOffseasonMovesIngest";
import { ingestNbaDisciplineFromBdl } from "@/lib/nba/ingest/nbaDisciplineIngest";
import { ingestNbaLeagueHub } from "@/lib/nba/leagueHub/nbaLeagueHubIngest";
import { ingestNbaShotChartsFromBdl } from "@/lib/nba/ingest/nbaShotChartsIngest";
import { ingestNbaMatchupsFromBdl } from "@/lib/nba/ingest/nbaMatchupIngest";
import {
  loadNbaSeasonGameRows,
  type NbaSeasonGameRow,
} from "@/lib/nba/ingest/nbaSeasonGameRows";

export type NbaStatsDailyIngestMode = "daily" | "heavy";

export type NbaStatsDailyIngestInput = {
  seasonKey?: string;
  mode?: NbaStatsDailyIngestMode;
  /** heavy 時のみ。未指定ならロスター全件（時間がかかる） */
  playerGameLogMaxPlayers?: number;
};

export type NbaStatsDailyIngestStepResult = {
  id: string;
  ok: boolean;
  ms: number;
  result?: unknown;
  error?: string;
};

export type NbaStatsDailyIngestResult = {
  ok: boolean;
  seasonKey: string;
  mode: NbaStatsDailyIngestMode;
  startedAt: string;
  finishedAt: string;
  steps: NbaStatsDailyIngestStepResult[];
};

async function runStep(
  id: string,
  fn: () => Promise<unknown>
): Promise<NbaStatsDailyIngestStepResult> {
  const t0 = Date.now();
  try {
    const result = await fn();
    return { id, ok: true, ms: Date.now() - t0, result };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error(`[nba-stats-daily-ingest] step=${id}`, e);
    return { id, ok: false, ms: Date.now() - t0, error };
  }
}

/** 試合確定後のスタッツ一式（リーグ表〜ショットゾーン）。日次と試合後監視で共通 */
export async function runNbaStatsSnapshotSteps(
  db: Firestore,
  seasonKey: string
): Promise<NbaStatsDailyIngestStepResult[]> {
  const steps: NbaStatsDailyIngestStepResult[] = [];
  steps.push(
    await runStep("league-stats", () =>
      ingestNbaLeagueStatsFromProvider(db, { seasonKey })
    )
  );
  // games を読む 4 ステップで共有（失敗時は各ステップが自分で読む）
  let seasonGames: NbaSeasonGameRow[] | undefined;
  try {
    seasonGames = await loadNbaSeasonGameRows(db, seasonKey);
  } catch (e) {
    console.error("[nba-stats-daily-ingest] season games load failed", e);
  }
  steps.push(
    await runStep("team-game-logs", () =>
      ingestNbaTeamGameLogsFromGames(db, { seasonKey, seasonGames })
    )
  );
  steps.push(
    await runStep("standings", () =>
      ingestNbaStandingsFromBdl(db, { seasonKey, seasonGames })
    )
  );
  steps.push(
    await runStep("team-season-records", () =>
      loadOrBuildTeamSeasonRecords(db, seasonKey, {
        fetchFromBdlIfSparse: true,
        seasonInProgress: seasonKey === CURRENT_NBA_SEASON_KEY,
        seasonGames,
      })
    )
  );
  steps.push(
    await runStep("team-shape-records", () =>
      ingestNbaTeamShapesFromGames(db, { seasonKey, seasonGames })
    )
  );
  steps.push(
    await runStep("discipline", () =>
      ingestNbaDisciplineFromBdl(db, { seasonKey, maxGames: 60 })
    )
  );
  steps.push(
    await runStep("player-shot-zones", () =>
      ingestNbaPlayerShotZonesFromBdl(db, { seasonKey })
    )
  );
  steps.push(
    await runStep("shot-charts", () =>
      ingestNbaShotChartsFromBdl(db, { seasonKey, maxGames: 40 })
    )
  );
  steps.push(
    await runStep("matchups", () =>
      ingestNbaMatchupsFromBdl(db, { seasonKey, maxGames: 20 })
    )
  );
  return steps;
}

/** 順位ページ LEAGUE タブ。試合ログ更新の後に回す（Firestore のみ） */
export function runNbaLeagueHubStep(
  db: Firestore,
  seasonKey: string
): Promise<NbaStatsDailyIngestStepResult> {
  return runStep("league-hub", () => ingestNbaLeagueHub(db, { seasonKey }));
}

/** 直近 box 出場者だけプレイヤー試合ログを取り直す */
export function runNbaRecentPlayerGameLogsStep(
  db: Firestore,
  seasonKey: string
): Promise<NbaStatsDailyIngestStepResult> {
  return runStep("player-game-logs-incremental", async () => {
    const { dates, playerIds } = await listPlayerIdsFromRecentBoxScores();
    if (playerIds.length === 0) {
      return { ok: true, dates, playerIds: [], skipped: true };
    }
    const result = await ingestNbaPlayerGameLogsFromBdl(db, {
      seasonKey,
      playerIds,
    });
    return { ...result, dates, incremental: true };
  });
}

export async function runNbaStatsDailyIngest(
  db: Firestore,
  input: NbaStatsDailyIngestInput = {}
): Promise<NbaStatsDailyIngestResult> {
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const mode: NbaStatsDailyIngestMode =
    input.mode === "heavy" ? "heavy" : "daily";
  const startedAt = new Date().toISOString();
  const steps: NbaStatsDailyIngestStepResult[] = [];

  steps.push(
    await runStep("team-rosters", () =>
      ingestNbaTeamRostersFromBdl(db, { seasonKey })
    )
  );
  steps.push(
    await runStep("team-offseason-moves", () =>
      ingestNbaTeamOffseasonMoves(db, { seasonKey })
    )
  );
  steps.push(
    await runStep("games", () =>
      ingestNbaGamesFromBdl(db, {
        seasonKey,
        rebuildTeamGameLogs: false,
      })
    )
  );
  steps.push(...(await runNbaStatsSnapshotSteps(db, seasonKey)));

  if (mode === "heavy") {
    steps.push(
      await runStep("player-game-logs", () =>
        ingestNbaPlayerGameLogsFromBdl(db, {
          seasonKey,
          maxPlayers:
            typeof input.playerGameLogMaxPlayers === "number" &&
            Number.isFinite(input.playerGameLogMaxPlayers) &&
            input.playerGameLogMaxPlayers > 0
              ? Math.trunc(input.playerGameLogMaxPlayers)
              : undefined,
        })
      )
    );
  } else {
    steps.push(await runNbaRecentPlayerGameLogsStep(db, seasonKey));
  }
  steps.push(await runNbaLeagueHubStep(db, seasonKey));

  // Pro Insight フル生成は前日 19:00 JST の runNbaProBriefFullCron に分離

  const finishedAt = new Date().toISOString();
  const ok = steps.every((s) => s.ok);
  return { ok, seasonKey, mode, startedAt, finishedAt, steps };
}
