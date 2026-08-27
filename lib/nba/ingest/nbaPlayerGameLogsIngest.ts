/**
 * BDL → Firestore `nbaPlayerGameLogs/{season}/players/{playerId}`。
 * 公開 API は Firestore のみ読む。
 * 書き込み後、追加 BDL なしで leaders last10 を再集計する。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import {
  requireBdlNbaApiKey,
  bdlSeasonYearFromSeasonKey,
} from "@/lib/nba/bdl/bdlNbaEnv";
import { fetchBdlPlayerGameLogs } from "@/lib/nba/bdl/fetchBdlPlayerGameLogs";
import { mapBdlRowsToPlayerGameLogs } from "@/lib/nba/playerDetail/mapBdlToPlayerGameLogs";
import { writePlayerGameLogsSnapshot } from "@/lib/nba/playerGameLogs/loadPlayerGameLogsSnapshot";
import { rebuildPlayerLast10FromGameLogs } from "@/lib/nba/playerStatLeaders/loadPlayerStatLeadersSnapshot";
import { listActiveRosterPlayerRefs } from "@/lib/nba/ingest/listActiveRosterPlayerRefs";
import {
  forEachWithConcurrency,
  NBA_INGEST_CONCURRENCY,
} from "@/lib/async/forEachWithConcurrency";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

export const NBA_PLAYER_GAME_LOGS_INGEST_READY = true;

export type NbaPlayerGameLogsIngestInput = {
  seasonKey?: string;
  playerIds?: string[];
  maxPlayers?: number;
};

export type NbaPlayerGameLogsIngestResult = {
  ok: true;
  seasonKey: string;
  attempted: number;
  written: number;
  skipped: number;
  failed: number;
  last10Merged: boolean;
  last10PlayerCount: number;
};

export async function ingestNbaPlayerGameLogsFromBdl(
  db: Firestore,
  input: NbaPlayerGameLogsIngestInput = {}
): Promise<NbaPlayerGameLogsIngestResult> {
  requireBdlNbaApiKey();
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const seasonYear = bdlSeasonYearFromSeasonKey(seasonKey);

  let targets = await listActiveRosterPlayerRefs(db, seasonKey);
  const filterIds = (input.playerIds ?? [])
    .map((id) => String(id).trim())
    .filter(Boolean);
  if (filterIds.length > 0) {
    const want = new Set(filterIds);
    targets = targets.filter((t) => want.has(t.playerId));
    for (const id of filterIds) {
      if (!targets.some((t) => t.playerId === id)) {
        targets.push({ playerId: id, teamId: "", position: "—" });
      }
    }
  }
  if (
    typeof input.maxPlayers === "number" &&
    Number.isFinite(input.maxPlayers) &&
    input.maxPlayers > 0
  ) {
    targets = targets.slice(0, Math.trunc(input.maxPlayers));
  }

  let written = 0;
  let skipped = 0;
  let failed = 0;

  await forEachWithConcurrency(
    targets,
    NBA_INGEST_CONCURRENCY,
    async (target, i) => {
      try {
        if (i === 0 || (i + 1) % 25 === 0 || i + 1 === targets.length) {
          console.log(
            `[nba-player-game-logs-ingest] ${i + 1}/${targets.length} player=${target.playerId} written=${written} skipped=${skipped} failed=${failed}`
          );
        }
        const bdlId = Number.parseInt(target.playerId, 10);
        if (!Number.isFinite(bdlId) || bdlId <= 0) {
          skipped += 1;
          return;
        }
        const rows = await fetchBdlPlayerGameLogs({
          bdlPlayerId: bdlId,
          seasonYear,
          seasonType: "regular",
        });
        const gameLogs = await mapBdlRowsToPlayerGameLogs(rows);
        if (gameLogs.length === 0) {
          skipped += 1;
          return;
        }
        await writePlayerGameLogsSnapshot(db, {
          seasonKey,
          playerId: target.playerId,
          teamId: target.teamId || null,
          gameLogs,
        });
        written += 1;
      } catch (e) {
        failed += 1;
        console.error(
          `[nba-player-game-logs-ingest] player=${target.playerId}`,
          e
        );
      }
    }
  );

  const last10 = await rebuildPlayerLast10FromGameLogs(
    db,
    seasonKey,
    FieldValue.serverTimestamp()
  );

  return {
    ok: true,
    seasonKey,
    attempted: targets.length,
    written,
    skipped,
    failed,
    last10Merged: last10.merged,
    last10PlayerCount: last10.playerCount,
  };
}
