/**
 * プレイヤー詳細 AWARDS の確定カタログ。
 * 表示順はこの配列順。データは後から playerId → counts で載せる。
 */

export const NBA_PLAYER_AWARD_CATALOG = [
  { id: "mvp", label: "MVP" },
  { id: "fmvp", label: "Finals MVP" },
  { id: "dpoy", label: "DPOY" },
  { id: "roy", label: "ROY" },
  { id: "mip", label: "MIP" },
  { id: "smoy", label: "Sixth Man" },
  { id: "clutch", label: "Clutch Player of the Year" },
  { id: "scoring_champ", label: "Scoring Champ" },
  { id: "ast_champ", label: "Assist Champ" },
  { id: "reb_champ", label: "Rebound Champ" },
  { id: "stl_champ", label: "Steal Champ" },
  { id: "blk_champ", label: "Block Champ" },
  { id: "all_star", label: "All-Star" },
  { id: "all_nba_1st", label: "All-NBA First Team" },
  { id: "all_nba_2nd", label: "All-NBA Second Team" },
  { id: "all_nba_3rd", label: "All-NBA Third Team" },
  { id: "all_def_1st", label: "All-Defensive First Team" },
  { id: "all_def_2nd", label: "All-Defensive Second Team" },
  { id: "all_rookie_1st", label: "All-Rookie First Team" },
  { id: "all_rookie_2nd", label: "All-Rookie Second Team" },
  { id: "nba_cup_mvp", label: "NBA Cup MVP" },
  { id: "conf_finals_mvp", label: "Conference Finals MVP" },
] as const;

export type NbaPlayerAwardId = (typeof NBA_PLAYER_AWARD_CATALOG)[number]["id"];

export type NbaPlayerAwardCatalogEntry = (typeof NBA_PLAYER_AWARD_CATALOG)[number];

export const NBA_PLAYER_AWARD_LABEL_BY_ID: Record<NbaPlayerAwardId, string> =
  Object.fromEntries(
    NBA_PLAYER_AWARD_CATALOG.map((e) => [e.id, e.label])
  ) as Record<NbaPlayerAwardId, string>;
