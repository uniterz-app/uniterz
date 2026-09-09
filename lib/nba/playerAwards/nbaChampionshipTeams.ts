/**
 * NBA 優勝チーム（シーズンキー → チーム）。
 * キャリア表 Playoffs 行の黄色／トロフィー判定用。
 * 過去約20年 + カタログ上の最新シーズンまで。
 */
export type NbaChampionshipTeamSeason = {
  seasonKey: string;
  teamId: string;
  teamAbbr: string;
};

/** seasonKey 例: "2019-20" */
export const NBA_CHAMPIONSHIP_TEAMS: readonly NbaChampionshipTeamSeason[] = [
  { seasonKey: "2005-06", teamId: "nba-heat", teamAbbr: "MIA" },
  { seasonKey: "2006-07", teamId: "nba-spurs", teamAbbr: "SAS" },
  { seasonKey: "2007-08", teamId: "nba-celtics", teamAbbr: "BOS" },
  { seasonKey: "2008-09", teamId: "nba-lakers", teamAbbr: "LAL" },
  { seasonKey: "2009-10", teamId: "nba-lakers", teamAbbr: "LAL" },
  { seasonKey: "2010-11", teamId: "nba-mavericks", teamAbbr: "DAL" },
  { seasonKey: "2011-12", teamId: "nba-heat", teamAbbr: "MIA" },
  { seasonKey: "2012-13", teamId: "nba-heat", teamAbbr: "MIA" },
  { seasonKey: "2013-14", teamId: "nba-spurs", teamAbbr: "SAS" },
  { seasonKey: "2014-15", teamId: "nba-warriors", teamAbbr: "GSW" },
  { seasonKey: "2015-16", teamId: "nba-cavaliers", teamAbbr: "CLE" },
  { seasonKey: "2016-17", teamId: "nba-warriors", teamAbbr: "GSW" },
  { seasonKey: "2017-18", teamId: "nba-warriors", teamAbbr: "GSW" },
  { seasonKey: "2018-19", teamId: "nba-raptors", teamAbbr: "TOR" },
  { seasonKey: "2019-20", teamId: "nba-lakers", teamAbbr: "LAL" },
  { seasonKey: "2020-21", teamId: "nba-bucks", teamAbbr: "MIL" },
  { seasonKey: "2021-22", teamId: "nba-warriors", teamAbbr: "GSW" },
  { seasonKey: "2022-23", teamId: "nba-nuggets", teamAbbr: "DEN" },
  { seasonKey: "2023-24", teamId: "nba-celtics", teamAbbr: "BOS" },
  { seasonKey: "2024-25", teamId: "nba-thunder", teamAbbr: "OKC" },
  { seasonKey: "2025-26", teamId: "nba-knicks", teamAbbr: "NYK" },
] as const;

const BY_SEASON_KEY: ReadonlyMap<string, NbaChampionshipTeamSeason> = new Map(
  NBA_CHAMPIONSHIP_TEAMS.map((row) => [row.seasonKey, row])
);

export function championshipTeamForSeasonKey(
  seasonKey: string
): NbaChampionshipTeamSeason | null {
  return BY_SEASON_KEY.get(seasonKey) ?? null;
}
