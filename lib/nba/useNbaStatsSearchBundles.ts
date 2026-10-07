"use client";

/**
 * STATS 検索バーの索引用 bundle。今季が空（オフ／開幕前）なら前季で引く。
 * 検索は詳細へ飛ぶためのものなので、リーグ表の ◀▶ 選択季とは独立。
 */
import { useMemo } from "react";
import {
  CURRENT_NBA_SEASON_KEY,
  previousNbaSeasonKey,
} from "@/lib/rankings/nbaSeason";
import type { NbaStatsSearchBundles, NbaStatsSearchKind } from "@/lib/nba/nbaStatsSearch";
import { useLeagueTeamStatsBundle } from "@/lib/nba/useLeagueTeamStatsBundle";
import { usePlayerStatLeadersBundle } from "@/lib/nba/usePlayerStatLeadersBundle";

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

  const teamBundle = teamEmpty ? teamPrior.bundle : team.bundle;
  const playerBundle = playerEmpty ? playerPrior.bundle : player.bundle;
  return useMemo(
    () => ({ team: teamBundle, player: playerBundle }),
    [teamBundle, playerBundle]
  );
}
