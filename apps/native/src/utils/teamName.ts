const TEAM_ALIASES: Record<string, string> = {
  "Manchester United": "Man United",
  "Manchester City": "Man City",
  "Tottenham Hotspur": "Tottenham",
  "Newcastle United": "Newcastle",
  "Nottingham Forest": "Nott'm Forest",
  "Brighton & Hove Albion": "Brighton",
  "Wolverhampton Wanderers": "Wolves",
  "Sheffield United": "Sheffield",
  "Crystal Palace": "Palace",
  "West Ham United": "West Ham",
  "Aston Villa": "Aston Villa",
  "Leicester City": "Leicester",
  "ファイティングイーグルス名古屋": "FE名古屋",
};

export function getTeamAlias(name: string): string | null {
  return TEAM_ALIASES[name] ?? null;
}

export function splitTeamNameByLeague(
  _league: "bj" | "j1" | "nba" | "pl",
  rawName: string
): [string, string] {
  const name = rawName.replace(/\s+/g, " ").trim();
  const m = name.match(/^(.*?)[\s・·･\-–—]+(.*)$/u);
  if (m) return [m[1], m[2]];
  return [name, ""];
}
