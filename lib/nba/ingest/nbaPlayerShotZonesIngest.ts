/**
 * BDL → Firestore `nbaPlayerShotZones/{season}/players/{playerId}`。
 * リーグ一括 by_zone を 1 回取得し、ロスター交差分だけ書き込む。
 */
import type { Firestore } from "firebase-admin/firestore";
import {
  requireBdlNbaApiKey,
  bdlSeasonYearFromSeasonKey,
} from "@/lib/nba/bdl/bdlNbaEnv";
import { fetchBdlPlayerSeasonAverages } from "@/lib/nba/bdl/fetchBdlPlayerSeasonAverages";
import { indexBdlShotZoneRowsByPlayerId } from "@/lib/nba/playerDetail/mapBdlToPlayerShotZones";
import { writePlayerShotZonesSnapshot } from "@/lib/nba/playerShotZones/loadPlayerShotZonesSnapshot";
import { listActiveRosterPlayerRefs } from "@/lib/nba/ingest/listActiveRosterPlayerRefs";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

export const NBA_PLAYER_SHOT_ZONES_INGEST_READY = true;

export type NbaPlayerShotZonesIngestInput = {
  seasonKey?: string;
  playerIds?: string[];
  maxPlayers?: number;
};

export type NbaPlayerShotZonesIngestResult = {
  ok: true;
  seasonKey: string;
  leagueRows: number;
  attempted: number;
  written: number;
  skipped: number;
  failed: number;
};

export async function ingestNbaPlayerShotZonesFromBdl(
  db: Firestore,
  input: NbaPlayerShotZonesIngestInput = {}
): Promise<NbaPlayerShotZonesIngestResult> {
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

  console.log(
    `[nba-player-shot-zones-ingest] fetch league by_zone seasonYear=${seasonYear}`
  );
  const leagueRows = await fetchBdlPlayerSeasonAverages({
    seasonYear,
    category: "shooting",
    type: "by_zone",
  });
  const zonesByPlayer = indexBdlShotZoneRowsByPlayerId(leagueRows);

  let written = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i += 1) {
    const target = targets[i]!;
    try {
      const shotZones = zonesByPlayer.get(target.playerId) ?? [];
      if (shotZones.length === 0) {
        skipped += 1;
        continue;
      }
      await writePlayerShotZonesSnapshot(db, {
        seasonKey,
        playerId: target.playerId,
        teamId: target.teamId || null,
        shotZones,
      });
      written += 1;
    } catch (e) {
      failed += 1;
      console.error(
        `[nba-player-shot-zones-ingest] player=${target.playerId}`,
        e
      );
    }
  }

  return {
    ok: true,
    seasonKey,
    leagueRows: leagueRows.length,
    attempted: targets.length,
    written,
    skipped,
    failed,
  };
}
