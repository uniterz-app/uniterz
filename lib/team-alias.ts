// lib/team-alias.ts

/**
 * モバイル表示用の略称マップ
 * key = 正式名称
 * value = モバイルで使う1行名
 */
export const TEAM_ALIASES: Record<string, string> = {
  // Premier League
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
  "Aston Villa": "Aston Villa", // 文字数短いが明示的に
  "Leicester City": "Leicester",

  // Bリーグ（既存）
  "ファイティングイーグルス名古屋": "FE名古屋",
};

export function getTeamAlias(name: string): string | null {
  return TEAM_ALIASES[name] ?? null;
}
