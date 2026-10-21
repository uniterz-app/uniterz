"use client";

/**
 * STATS 検索バーの索引用 bundle。今季が空（オフ／開幕前）なら前季で引く。
 * 検索は詳細へ飛ぶためのものなので、リーグ表の ◀▶ 選択季とは独立。
 * 選手は今季ロスター全員 + リーダー表（ロスター外の前季出場者）。
 */
import { useEffect, useMemo, useState } from "react";
import {
  CURRENT_NBA_SEASON_KEY,
  previousNbaSeasonKey,
} from "@/lib/rankings/nbaSeason";
import type { NbaStatsSearchBundles, NbaStatsSearchKind } from "@/lib/nba/nbaStatsSearch";
import { useLeagueTeamStatsBundle } from "@/lib/nba/useLeagueTeamStatsBundle";
import { usePlayerStatLeadersBundle } from "@/lib/nba/usePlayerStatLeadersBundle";
import {
  createSnapshotFetchCache,
  nbaSnapshotCacheKey,
  NBA_SNAPSHOT_CACHE_TTL_MS,
} from "@/lib/nba/snapshotFetchCache";
import { fetchTeamRostersSnapshot } from "@/lib/nba/teamRosters/fetchTeamRostersClient";
import type { NbaTeamRosterDocTeam } from "@/lib/nba/teamRosters/teamRosterTypes";

type RosterTeams = Record<string, NbaTeamRosterDocTeam>;

const rosterCache = createSnapshotFetchCache<RosterTeams>(NBA_SNAPSHOT_CACHE_TTL_MS);

function useSearchRosterTeams(
  apiBaseUrl: string | null | undefined,
  enabled: boolean
): RosterTeams | undefined {
  const key = nbaSnapshotCacheKey(apiBaseUrl, CURRENT_NBA_SEASON_KEY);
  const [teams, setTeams] = useState<RosterTeams | undefined>(() =>
    enabled ? rosterCache.peek(key) ?? undefined : undefined
  );

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    rosterCache
      .load(key, async () => {
        const data = await fetchTeamRostersSnapshot({
          apiBaseUrl,
          season: CURRENT_NBA_SEASON_KEY,
        });
        return data.bundle.teams ?? {};
      })
      .then((next) => {
        if (!cancelled) setTeams(next);
      })
      .catch(() => {
        // リーダー表だけで検索を続ける（undefined のままだと「読み込み中」に見える）
        if (!cancelled) setTeams({});
      });
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, enabled, key]);

  return teams;
}

export function useNbaStatsSearchBundles(options: {
  kind: NbaStatsSearchKind;
  apiBaseUrl?: string | null;
}): NbaStatsSearchBundles {
  const { kind, apiBaseUrl } = options;
  const priorSeason = previousNbaSeasonKey(CURRENT_NBA_SEASON_KEY);

  const team = useLeagueTeamStatsBundle({
    apiBaseUrl,
    enabled: kind === "team",
  });
  const teamEmpty =
    kind === "team" && !team.loading && team.bundle.season.length === 0;
  const teamPrior = useLeagueTeamStatsBundle({
    apiBaseUrl,
    season: priorSeason,
    enabled: teamEmpty,
  });

  const player = usePlayerStatLeadersBundle({
    apiBaseUrl,
    enabled: kind === "player",
  });
  const playerEmpty =
    kind === "player" &&
    !player.loading &&
    Object.values(player.bundle.season).every((rows) => rows.length === 0);
  const playerPrior = usePlayerStatLeadersBundle({
    apiBaseUrl,
    season: priorSeason,
    enabled: playerEmpty,
  });
  const rosters = useSearchRosterTeams(apiBaseUrl, kind === "player");

  const teamBundle = teamEmpty ? teamPrior.bundle : team.bundle;
  const playerBundle = playerEmpty ? playerPrior.bundle : player.bundle;
  return useMemo(
    () => ({ team: teamBundle, player: playerBundle, rosters }),
    [teamBundle, playerBundle, rosters]
  );
}
