/**
 * NBA スタッツ日次 ingest オーケストレータ。
 * 公開 API は触らず、BDL → Firestore だけ回す。
 *
 * daily（既定）: 試合・リーグ表・injury・チームログ・ゾーン・ロスター
 * heavy: 上記 + プレイヤー試合ログ（全ロスターは重いので任意）
 */
import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { ingestNbaGamesFromBdl } from "@/lib/nba/ingest/nbaGamesIngest";
import { ingestNbaLeagueStatsFromProvider } from "@/lib/nba/ingest/nbaLeagueStatsIngest";
import { ingestNbaTeamInjuriesFromBdl } from "@/lib/nba/ingest/nbaTeamInjuriesIngest";
import { ingestNbaTeamGameLogsFromGames } from "@/lib/nba/ingest/nbaTeamGameLogsIngest";
import { ingestNbaPlayerShotZonesFromBdl } from "@/lib/nba/ingest/nbaPlayerShotZonesIngest";
import { ingestNbaTeamRostersFromBdl } from "@/lib/nba/ingest/nbaTeamRostersIngest";
import { ingestNbaPlayerGameLogsFromBdl } from "@/lib/nba/ingest/nbaPlayerGameLogsIngest";

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

export async function runNbaStatsDailyIngest(
  db: Firestore,
  input: NbaStatsDailyIngestInput = {}
): Promise<NbaStatsDailyIngestResult> {
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const mode: NbaStatsDailyIngestMode =
    input.mode === "heavy" ? "heavy" : "daily";
  const startedAt = new Date().toISOString();
  const steps: NbaStatsDailyIngestStepResult[] = [];

  // 1) 試合（チームログ・last10 の土台）
  steps.push(
    await runStep("team-rosters", () =>
      ingestNbaTeamRostersFromBdl(db, { seasonKey })
    )
  );
  steps.push(
    await runStep("games", () =>
      ingestNbaGamesFromBdl(db, {
        seasonKey,
        // 直後の team-game-logs ステップで再構築する
        rebuildTeamGameLogs: false,
      })
    )
  );
  steps.push(
    await runStep("league-stats", () =>
      ingestNbaLeagueStatsFromProvider(db, { seasonKey })
    )
  );
  steps.push(
    await runStep("team-injuries", () =>
      ingestNbaTeamInjuriesFromBdl(db, { seasonKey })
    )
  );
  steps.push(
    await runStep("team-game-logs", () =>
      ingestNbaTeamGameLogsFromGames(db, { seasonKey })
    )
  );
  steps.push(
    await runStep("player-shot-zones", () =>
      ingestNbaPlayerShotZonesFromBdl(db, { seasonKey })
    )
  );

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
  }

  const finishedAt = new Date().toISOString();
  const ok = steps.every((s) => s.ok);
  return { ok, seasonKey, mode, startedAt, finishedAt, steps };
}
