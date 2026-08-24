/**
 * 詳細ページはリーグ表スナップショットから切る。試合 doc に 30 チーム分は保存しない。
 */
import { TEAM_SHORT } from "@/lib/team-short";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { nbaConferenceForTeam } from "@/lib/nba/nbaConferenceTeams";
import type {
  NbaPlayerDetailPreview,
  NbaPlayerSeasonMetricId,
} from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import type {
  NbaPlayerLeaderMetricId,
  NbaPlayerStatLeaderRow,
  NbaPlayerStatLeadersBundle,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";
import {
  formatPlayerLeaderValue,
  isPlayerAdvancedLeaderMetric,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";

const SEASON_TO_LEADER: Partial<
  Record<NbaPlayerSeasonMetricId, NbaPlayerLeaderMetricId>
> = {
  pts: "pts",
  reb: "reb",
  ast: "ast",
  stl: "stl",
  blk: "blk",
  tov: "tov",
  min: "min",
  fg_pct: "fg_pct",
  fga: "fga",
  fg3_pct: "fg3_pct",
  fg3m: "fg3m",
  fg3a: "fg3a",
  ft_pct: "ft_pct",
};

const RANK_HIDDEN = 999;

export function rankInPlayerLeaders(
  bundle: NbaPlayerStatLeadersBundle,
  metric: NbaPlayerLeaderMetricId,
  playerId: string,
  window: "season" | "last10" = "season"
): number | null {
  const rows = bundle[window][metric] ?? [];
  const idx = rows.findIndex((r) => r.playerId === playerId);
  return idx >= 0 ? idx + 1 : null;
}

export function findPlayerInLeaders(
  bundle: NbaPlayerStatLeadersBundle,
  playerId: string
): NbaPlayerStatLeaderRow | null {
  for (const window of [bundle.season, bundle.last10] as const) {
    for (const rows of Object.values(window)) {
      const hit = rows.find((r) => r.playerId === playerId);
      if (hit) return hit;
    }
  }
  return null;
}

function splitPlayerName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "Player", lastName: playerIdFallback() };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}

function playerIdFallback(): string {
  return "";
}

function leaderValue(
  bundle: NbaPlayerStatLeadersBundle,
  metric: NbaPlayerLeaderMetricId,
  playerId: string
): number | null {
  const rows = bundle.season[metric] ?? [];
  const hit = rows.find((r) => r.playerId === playerId);
  return hit ? hit.value : null;
}

/** 詳細の氏名・所属・順位・値をリーダー表から上書き。 */
export function overlayPlayerDetailWithLeaders(
  detail: NbaPlayerDetailPreview,
  leaders: NbaPlayerStatLeadersBundle
): NbaPlayerDetailPreview {
  const fromLeaders = findPlayerInLeaders(leaders, detail.playerId);
  const nameParts = fromLeaders
    ? splitPlayerName(fromLeaders.playerName)
    : { firstName: detail.firstName, lastName: detail.lastName };
  const teamId = fromLeaders?.teamId ?? detail.teamId;
  const conference =
    fromLeaders?.conference ??
    nbaConferenceForTeam(teamId) ??
    detail.conference;

  const season = { ...detail.season };
  const gp = fromLeaders?.gamesPlayed;
  if (gp != null && gp > 0) season.gamesPlayed = gp;

  const patchSeason = (
    key: keyof typeof season,
    metric: NbaPlayerLeaderMetricId
  ) => {
    const v = leaderValue(leaders, metric, detail.playerId);
    if (v != null) (season as Record<string, number>)[key] = v;
  };
  patchSeason("pts", "pts");
  patchSeason("reb", "reb");
  patchSeason("ast", "ast");
  patchSeason("stl", "stl");
  patchSeason("blk", "blk");
  patchSeason("tov", "tov");
  patchSeason("min", "min");
  patchSeason("fgPct", "fg_pct");
  patchSeason("fg3Pct", "fg3_pct");
  patchSeason("ftPct", "ft_pct");
  patchSeason("fga", "fga");
  patchSeason("fg3m", "fg3m");
  patchSeason("fg3a", "fg3a");

  const seasonMetrics = detail.seasonMetrics.map((m) => {
    const leaderId = SEASON_TO_LEADER[m.id];
    if (!leaderId) return { ...m, leagueRank: RANK_HIDDEN };
    const rows = leaders.season[leaderId] ?? [];
    const idx = rows.findIndex((r) => r.playerId === detail.playerId);
    if (idx < 0) return { ...m, leagueRank: RANK_HIDDEN };
    const value = rows[idx]!.value;
    return {
      ...m,
      value,
      display: formatPlayerLeaderValue(leaderId, value),
      leagueRank: idx + 1,
    };
  });

  const headlineMetrics = detail.headlineMetrics.map((m) => {
    const hit = seasonMetrics.find((x) => x.id === m.id);
    return hit ?? { ...m, leagueRank: RANK_HIDDEN };
  });

  const advancedMetrics = detail.advancedMetrics.map((m) => {
    if (!isPlayerAdvancedLeaderMetric(m.id)) {
      return { ...m, leagueRank: RANK_HIDDEN };
    }
    const rows = leaders.season[m.id] ?? [];
    const idx = rows.findIndex((r) => r.playerId === detail.playerId);
    if (idx < 0) return { ...m, leagueRank: RANK_HIDDEN };
    const value = rows[idx]!.value;
    return {
      ...m,
      value,
      display: formatPlayerLeaderValue(m.id, value),
      leagueRank: idx + 1,
    };
  });

  return {
    ...detail,
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    teamId,
    teamAbbr: TEAM_SHORT[teamId] ?? detail.teamAbbr,
    teamName: NBA_TEAM_NAME_BY_ID[teamId] ?? detail.teamName,
    conference,
    season,
    asOfLabel: leaders.asOfLabel || detail.asOfLabel,
    seasonMetrics,
    headlineMetrics,
    advancedMetrics,
  };
}
