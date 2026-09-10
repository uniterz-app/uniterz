import { splitTeamNameByLeague } from "@/lib/team-name-split";
import { TEAM_SHORT } from "@/lib/team-short";

export const NBA_TEAM_NAME_BY_ID: Record<string, string> = {
  "nba-hawks": "Atlanta Hawks",
  "nba-celtics": "Boston Celtics",
  "nba-nets": "Brooklyn Nets",
  "nba-hornets": "Charlotte Hornets",
  "nba-bulls": "Chicago Bulls",
  "nba-cavaliers": "Cleveland Cavaliers",
  "nba-mavericks": "Dallas Mavericks",
  "nba-nuggets": "Denver Nuggets",
  "nba-pistons": "Detroit Pistons",
  "nba-warriors": "Golden State Warriors",
  "nba-rockets": "Houston Rockets",
  "nba-pacers": "Indiana Pacers",
  "nba-clippers": "Los Angeles Clippers",
  "nba-lakers": "Los Angeles Lakers",
  "nba-grizzlies": "Memphis Grizzlies",
  "nba-heat": "Miami Heat",
  "nba-bucks": "Milwaukee Bucks",
  "nba-timberwolves": "Minnesota Timberwolves",
  "nba-pelicans": "New Orleans Pelicans",
  "nba-knicks": "New York Knicks",
  "nba-thunder": "Oklahoma City Thunder",
  "nba-magic": "Orlando Magic",
  "nba-76ers": "Philadelphia 76ers",
  "nba-suns": "Phoenix Suns",
  "nba-blazers": "Portland Trail Blazers",
  "nba-kings": "Sacramento Kings",
  "nba-spurs": "San Antonio Spurs",
  "nba-raptors": "Toronto Raptors",
  "nba-jazz": "Utah Jazz",
  "nba-wizards": "Washington Wizards",
};

/** マッチカード等 — 長い nickname の短縮（表示は uppercase 側で揃える） */
const NBA_CARD_NICK_BY_ID: Record<string, string> = {
  "nba-timberwolves": "T-Wolves",
  "nba-blazers": "Blazers",
};

const NBA_CARD_NICK_BY_NICK: Record<string, string> = {
  timberwolves: "T-Wolves",
  "trail blazers": "Blazers",
};

/** 地名なしニックネーム（例: Hawks, Lakers, 76ers） */
export function getNbaTeamNicknameById(teamId: string): string {
  const full = NBA_TEAM_NAME_BY_ID[teamId];
  if (!full) return TEAM_SHORT[teamId] ?? teamId;
  const [, nick] = splitTeamNameByLeague("nba", full);
  const cleaned = nick.replace(/\u00A0/g, " ").trim();
  return cleaned || full;
}

/**
 * マッチカード / dense HUD 用の短いニックネーム。
 * 例: Timberwolves → T-Wolves、Trail Blazers → Blazers
 */
export function compactNbaCardNickname(
  nicknameOrFull: string,
  teamId?: string | null
): string {
  const id = typeof teamId === "string" ? teamId : "";
  if (id && NBA_CARD_NICK_BY_ID[id]) return NBA_CARD_NICK_BY_ID[id];

  const raw = nicknameOrFull.replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();
  if (!raw) return raw;

  const lowerFull = raw.toLowerCase();
  if (NBA_CARD_NICK_BY_NICK[lowerFull]) return NBA_CARD_NICK_BY_NICK[lowerFull];

  const looksFull =
    /\s/.test(raw) &&
    /^(atlanta|boston|brooklyn|charlotte|chicago|cleveland|dallas|denver|detroit|golden state|houston|indiana|la |los angeles|memphis|miami|milwaukee|minnesota|new orleans|new york|oklahoma city|orlando|philadelphia|phoenix|portland|sacramento|san antonio|toronto|utah|washington)\b/i.test(
      raw
    );
  const nick = looksFull
    ? splitTeamNameByLeague("nba", raw)[1] || raw
    : raw;
  const key = nick.replace(/\s+/g, " ").trim().toLowerCase();
  return NBA_CARD_NICK_BY_NICK[key] ?? nick;
}
