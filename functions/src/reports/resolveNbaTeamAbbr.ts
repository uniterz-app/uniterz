/** Functions-only display fallback retained outside synced pure builders. */
const NBA_ABBR: Record<string, string> = {
  "nba-hawks": "ATL",
  "nba-celtics": "BOS",
  "nba-nets": "BKN",
  "nba-hornets": "CHA",
  "nba-bulls": "CHI",
  "nba-cavaliers": "CLE",
  "nba-mavericks": "DAL",
  "nba-nuggets": "DEN",
  "nba-pistons": "DET",
  "nba-warriors": "GSW",
  "nba-rockets": "HOU",
  "nba-pacers": "IND",
  "nba-clippers": "LAC",
  "nba-lakers": "LAL",
  "nba-grizzlies": "MEM",
  "nba-heat": "MIA",
  "nba-bucks": "MIL",
  "nba-timberwolves": "MIN",
  "nba-pelicans": "NOP",
  "nba-knicks": "NYK",
  "nba-thunder": "OKC",
  "nba-magic": "ORL",
  "nba-76ers": "PHI",
  "nba-suns": "PHX",
  "nba-blazers": "POR",
  "nba-kings": "SAC",
  "nba-spurs": "SAS",
  "nba-raptors": "TOR",
  "nba-jazz": "UTA",
  "nba-wizards": "WAS",
};

export function resolveNbaTeamAbbr(teamId: string): string {
  if (NBA_ABBR[teamId]) return NBA_ABBR[teamId]!;
  const stripped = teamId.replace(/^nba-/i, "").slice(0, 3).toUpperCase();
  return stripped || teamId;
}
