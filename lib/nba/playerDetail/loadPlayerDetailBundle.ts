/**
 * プレイヤー詳細の寄せ読み（Firestore のみ）。
 * 公開 API /api/nba/player-detail が使う。
 */
import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { loadPlayerRosterHit } from "@/lib/nba/teamRosters/loadTeamRostersSnapshot";
import { loadTeamInjury } from "@/lib/nba/teamInjuries/loadTeamInjuriesSnapshot";
import { loadPlayerContract } from "@/lib/nba/playerDetail/loadPlayerContract";
import { loadPlayerCareerSeasons } from "@/lib/nba/playerDetail/loadPlayerCareerSeasons";
import { loadPlayerGameLogs } from "@/lib/nba/playerDetail/loadPlayerGameLogs";
import { loadPlayerShotZones } from "@/lib/nba/playerDetail/loadPlayerShotZones";
import { loadPlayerSeasonMetricsSnapshot } from "@/lib/nba/playerSeasonMetrics/loadPlayerSeasonMetricsSnapshot";
import type { NbaPlayerRosterHitApiPayload } from "@/lib/nba/teamRosters/teamRosterTypes";
import type { NbaTeamInjuryApiPayload } from "@/lib/nba/teamInjuries/teamInjuryTypes";
import type { NbaPlayerContractApiPayload } from "@/lib/nba/playerContract/playerContractTypes";
import type { NbaPlayerCareerSeasonsApiPayload } from "@/lib/nba/playerCareerSeasons/playerCareerSeasonsTypes";
import type { NbaPlayerGameLogsApiPayload } from "@/lib/nba/playerGameLogs/playerGameLogsTypes";
import type { NbaPlayerShotZonesApiPayload } from "@/lib/nba/playerShotZones/playerShotZonesTypes";
import type { NbaPlayerSeasonMetricsApiPayload } from "@/lib/nba/playerSeasonMetrics/playerSeasonMetricsTypes";
import type { NbaStatsSnapshotSource } from "@/lib/nba/nbaStatsSnapshotCacheControl";

export type NbaPlayerDetailApiPayload = {
  ok: true;
  season: string;
  playerId: string;
  roster: NbaPlayerRosterHitApiPayload;
  injury: NbaTeamInjuryApiPayload | null;
  contract: NbaPlayerContractApiPayload;
  careerSeasons: NbaPlayerCareerSeasonsApiPayload;
  gameLogs: NbaPlayerGameLogsApiPayload;
  shotZones: NbaPlayerShotZonesApiPayload;
  seasonMetrics: NbaPlayerSeasonMetricsApiPayload;
  source: NbaStatsSnapshotSource;
  updatedAt: string | null;
};

function newestIso(...vals: Array<string | null | undefined>): string | null {
  let best: string | null = null;
  let bestMs = -1;
  for (const v of vals) {
    if (!v) continue;
    const ms = Date.parse(v);
    if (!Number.isFinite(ms)) continue;
    if (ms > bestMs) {
      bestMs = ms;
      best = v;
    }
  }
  return best;
}

export async function loadPlayerDetailBundle(
  db: Firestore,
  opts: { playerId: string; seasonKey?: string }
): Promise<NbaPlayerDetailApiPayload> {
  const playerId = String(opts.playerId ?? "").trim();
  const season = (opts.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();

  const roster = await loadPlayerRosterHit(db, season, playerId);
  const teamId = roster.hit?.teamId ?? "";

  const [injury, contract, careerSeasons, gameLogs, shotZones, seasonMetrics] =
    await Promise.all([
      teamId
        ? loadTeamInjury(db, season, teamId)
        : Promise.resolve(null as NbaTeamInjuryApiPayload | null),
      loadPlayerContract(db, { playerId, seasonKey: season }),
      loadPlayerCareerSeasons(db, {
        playerId,
        seasonKey: season,
      }),
      loadPlayerGameLogs(db, { playerId, seasonKey: season }),
      loadPlayerShotZones(db, { playerId, seasonKey: season }),
      loadPlayerSeasonMetricsSnapshot(db, season, playerId),
    ]);

  const sources = [
    roster.source,
    injury?.source,
    contract.source,
    careerSeasons.source,
    gameLogs.source,
    shotZones.source,
    seasonMetrics.source,
  ];
  const source: NbaStatsSnapshotSource = sources.some((s) => s === "firestore")
    ? "firestore"
    : "empty";

  return {
    ok: true,
    season,
    playerId,
    roster,
    injury,
    contract,
    careerSeasons,
    gameLogs,
    shotZones,
    seasonMetrics,
    source,
    updatedAt: newestIso(
      roster.updatedAt,
      injury?.updatedAt,
      contract.updatedAt,
      careerSeasons.updatedAt,
      gameLogs.updatedAt,
      shotZones.updatedAt,
      seasonMetrics.updatedAt
    ),
  };
}
