import { TEAM_SHORT } from "@/lib/team-short";

/** BDL abbreviation（ATL）→ アプリ teamId（nba-hawks） */
const APP_TEAM_ID_BY_ABBR: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const [teamId, abbr] of Object.entries(TEAM_SHORT)) {
    if (!teamId.startsWith("nba-")) continue;
    out[String(abbr).toUpperCase()] = teamId;
  }
  return out;
})();

/**
 * BDL 数値 team.id（contracts 等で abbreviation が無いとき用）。
 * `/nba/v1/teams` 由来。Wizards のみ 42。
 */
export const BDL_TEAM_ID_BY_APP_ID: Readonly<Record<string, number>> = {
  "nba-hawks": 1,
  "nba-celtics": 2,
  "nba-nets": 3,
  "nba-hornets": 4,
  "nba-bulls": 5,
  "nba-cavaliers": 6,
  "nba-mavericks": 7,
  "nba-nuggets": 8,
  "nba-pistons": 9,
  "nba-warriors": 10,
  "nba-rockets": 11,
  "nba-pacers": 12,
  "nba-clippers": 13,
  "nba-lakers": 14,
  "nba-grizzlies": 15,
  "nba-heat": 16,
  "nba-bucks": 17,
  "nba-timberwolves": 18,
  "nba-pelicans": 19,
  "nba-knicks": 20,
  "nba-thunder": 21,
  "nba-magic": 22,
  "nba-76ers": 23,
  "nba-suns": 24,
  "nba-blazers": 25,
  "nba-kings": 26,
  "nba-spurs": 27,
  "nba-raptors": 28,
  "nba-jazz": 29,
  "nba-wizards": 42,
};

export function appTeamIdFromBdlAbbreviation(
  abbreviation: string | null | undefined
): string | null {
  const abbr = String(abbreviation ?? "")
    .trim()
    .toUpperCase();
  if (!abbr) return null;
  return APP_TEAM_ID_BY_ABBR[abbr] ?? null;
}

export function bdlTeamIdFromAppTeamId(
  appTeamId: string | null | undefined
): number | null {
  const id = String(appTeamId ?? "").trim();
  if (!id) return null;
  return BDL_TEAM_ID_BY_APP_ID[id] ?? null;
}

/** 実行中に BDL team.id → app id を覚える */
const numericCache = new Map<number, string>(
  Object.entries(BDL_TEAM_ID_BY_APP_ID).map(([appId, bdlId]) => [bdlId, appId])
);

export function rememberBdlTeamId(
  bdlTeamId: number,
  abbreviation: string | null | undefined
): string | null {
  const appId = appTeamIdFromBdlAbbreviation(abbreviation);
  if (appId) numericCache.set(bdlTeamId, appId);
  return appId ?? numericCache.get(bdlTeamId) ?? null;
}

export function appTeamIdFromBdlTeamId(bdlTeamId: number): string | null {
  return numericCache.get(bdlTeamId) ?? null;
}
