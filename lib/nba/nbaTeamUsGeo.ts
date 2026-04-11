/**
 * NBA チーム（teamId）→ 米国州コード（USPS）・ディビジョン。
 * トロント等 US 外は stateCode null（州ベース集計には使わない。マップ座標は nbaTeamMapCoords）。
 */

export type NbaDivisionId =
  | "atlantic"
  | "central"
  | "southeast"
  | "northwest"
  | "pacific"
  | "southwest";

export const NBA_DIVISION_ORDER: NbaDivisionId[] = [
  "atlantic",
  "central",
  "southeast",
  "northwest",
  "pacific",
  "southwest",
];

export const NBA_DIVISION_LABEL: Record<
  NbaDivisionId,
  { ja: string; en: string }
> = {
  atlantic: { ja: "アトランティック", en: "Atlantic" },
  central: { ja: "セントラル", en: "Central" },
  southeast: { ja: "サウスイースト", en: "Southeast" },
  northwest: { ja: "ノースウェスト", en: "Northwest" },
  pacific: { ja: "パシフィック", en: "Pacific" },
  southwest: { ja: "サウスウェスト", en: "Southwest" },
};

/**
 * ディビジョンに含まれる州コード（地図のネオン強調用）。
 * ウィザーズは DC 本拠だが州境が極小のため、周辺の MD / VA も含めて DMV が光るようにする。
 */
export const NBA_DIVISION_STATE_CODES: Record<NbaDivisionId, string[]> = {
  atlantic: ["MA", "NY", "PA"],
  central: ["IL", "OH", "IN", "MI", "WI"],
  southeast: ["GA", "NC", "FL", "DC", "MD", "VA"],
  northwest: ["CO", "MN", "OK", "OR", "UT"],
  pacific: ["CA", "AZ"],
  southwest: ["TX", "TN", "LA"],
};

/** 全米表示用：重複除いた全州 + DC */
export const NBA_US_STATE_CODES_ALL: string[] = Array.from(
  new Set(Object.values(NBA_DIVISION_STATE_CODES).flat())
).sort();

type TeamGeo = {
  stateCode: string | null;
  division: NbaDivisionId;
};

/** teamId（例 nba-lakers） */
export const NBA_TEAM_US_GEO: Record<string, TeamGeo> = {
  "nba-hawks": { stateCode: "GA", division: "southeast" },
  "nba-celtics": { stateCode: "MA", division: "atlantic" },
  "nba-nets": { stateCode: "NY", division: "atlantic" },
  "nba-hornets": { stateCode: "NC", division: "southeast" },
  "nba-bulls": { stateCode: "IL", division: "central" },
  "nba-cavaliers": { stateCode: "OH", division: "central" },
  "nba-mavericks": { stateCode: "TX", division: "southwest" },
  "nba-nuggets": { stateCode: "CO", division: "northwest" },
  "nba-pistons": { stateCode: "MI", division: "central" },
  "nba-warriors": { stateCode: "CA", division: "pacific" },
  "nba-rockets": { stateCode: "TX", division: "southwest" },
  "nba-pacers": { stateCode: "IN", division: "central" },
  "nba-clippers": { stateCode: "CA", division: "pacific" },
  "nba-lakers": { stateCode: "CA", division: "pacific" },
  "nba-grizzlies": { stateCode: "TN", division: "southwest" },
  "nba-heat": { stateCode: "FL", division: "southeast" },
  "nba-bucks": { stateCode: "WI", division: "central" },
  "nba-timberwolves": { stateCode: "MN", division: "northwest" },
  "nba-pelicans": { stateCode: "LA", division: "southwest" },
  "nba-knicks": { stateCode: "NY", division: "atlantic" },
  "nba-thunder": { stateCode: "OK", division: "northwest" },
  "nba-magic": { stateCode: "FL", division: "southeast" },
  "nba-76ers": { stateCode: "PA", division: "atlantic" },
  "nba-suns": { stateCode: "AZ", division: "pacific" },
  "nba-blazers": { stateCode: "OR", division: "northwest" },
  "nba-kings": { stateCode: "CA", division: "pacific" },
  "nba-spurs": { stateCode: "TX", division: "southwest" },
  "nba-raptors": { stateCode: null, division: "atlantic" },
  "nba-jazz": { stateCode: "UT", division: "northwest" },
  "nba-wizards": { stateCode: "DC", division: "southeast" },
};

export function getNbaTeamGeo(teamId: string): TeamGeo | null {
  const g = NBA_TEAM_US_GEO[teamId];
  return g ?? null;
}

export function winnerTeamIdFromPost(
  prediction: { winner?: string } | null | undefined,
  homeTeamId: string,
  awayTeamId: string
): string | null {
  if (!prediction?.winner) return null;
  if (prediction.winner === "home") return homeTeamId || null;
  if (prediction.winner === "away") return awayTeamId || null;
  return null;
}
