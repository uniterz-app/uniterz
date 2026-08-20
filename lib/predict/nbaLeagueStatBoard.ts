/**
 * リーグ表（Team / Player）共通: Season·L10 の中の Basic / Advanced。
 * 選択タブ本体は触らない。並びとチップ分割だけここで持つ。
 */

export type NbaLeagueStatBoardMode = "basic" | "advanced";

export type NbaLeagueAdvancedCategory =
  | "ratings"
  | "fourFactors"
  | "scoring"
  | "shooting"
  | "clutch"
  | "playtype"
  | "defense"
  | "tracking"
  | "hustle";

export type NbaLeagueAdvancedCategoryDef = {
  id: NbaLeagueAdvancedCategory;
  short: string;
  label: string;
  hintJa: string;
  hintEn: string;
};

export const NBA_LEAGUE_ADVANCED_CATEGORIES: readonly NbaLeagueAdvancedCategoryDef[] =
  [
    {
      id: "ratings",
      short: "RATINGS",
      label: "Ratings",
      hintJa: "レーティング。総合の効率。",
      hintEn: "On-court ratings and efficiency.",
    },
    {
      id: "fourFactors",
      short: "4FCT",
      label: "Four Factors",
      hintJa: "Four Factors。シュート・TO・FT・OREB。",
      hintEn: "Four Factors: shooting, TOs, free throws, OREB.",
    },
    {
      id: "scoring",
      short: "SCORING",
      label: "Scoring mix",
      hintJa: "どこから何点取っているか（1試合平均）。",
      hintEn: "Points per game from each source.",
    },
    {
      id: "shooting",
      short: "SHOT",
      label: "Shot spots",
      hintJa: "restricted とコーナー3。精度と、そこからの得点。",
      hintEn: "Restricted area and corner 3s — accuracy and points.",
    },
    {
      id: "clutch",
      short: "CLUTCH",
      label: "Clutch",
      hintJa: "残り5分・僅差の数字。",
      hintEn: "Last 5 minutes, close games.",
    },
    {
      id: "playtype",
      short: "PLAYTYPE",
      label: "Playtype",
      hintJa: "どう点を取っているか（1試合あたりの得点）。",
      hintEn: "How points are created (points per game).",
    },
    {
      id: "defense",
      short: "DEFENSE",
      label: "Defense",
      hintJa: "相手に許している数字 / マッチアップ。",
      hintEn: "What opponents get / matchup defense.",
    },
    {
      id: "tracking",
      short: "TRACK",
      label: "Tracking",
      hintJa: "ドライブ回数と得点。C&S / プルアップは精度と得点。",
      hintEn: "Drive volume and points. Catch-and-shoot / pull-up FG% plus points.",
    },
    {
      id: "hustle",
      short: "HUSTLE",
      label: "Hustle",
      hintJa: "ディフレクション、チャージ、ルーズボール。",
      hintEn: "Deflections, charges, loose balls.",
    },
  ] as const;

export const NBA_LEAGUE_STAT_CHIP_COLS = 6;
export const NBA_LEAGUE_ADV_CATEGORY_COLS = 4;

export function chunkForChipGrid<T>(
  items: readonly T[],
  cols: number
): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += cols) {
    rows.push([...items.slice(i, i + cols)]);
  }
  return rows;
}

export const NBA_LEAGUE_ADVANCED_CATEGORY_ROWS = chunkForChipGrid(
  NBA_LEAGUE_ADVANCED_CATEGORIES,
  NBA_LEAGUE_ADV_CATEGORY_COLS
);

/** チーム表: Ratings は Basic、SHOT は選手のみ */
export const NBA_LEAGUE_TEAM_ADVANCED_CATEGORIES =
  NBA_LEAGUE_ADVANCED_CATEGORIES.filter(
    (c) => c.id !== "ratings" && c.id !== "shooting"
  );

export const NBA_LEAGUE_TEAM_ADVANCED_CATEGORY_ROWS = chunkForChipGrid(
  NBA_LEAGUE_TEAM_ADVANCED_CATEGORIES,
  NBA_LEAGUE_ADV_CATEGORY_COLS
);

export function leagueAdvancedCategoryDef(
  id: NbaLeagueAdvancedCategory
): NbaLeagueAdvancedCategoryDef {
  const found = NBA_LEAGUE_ADVANCED_CATEGORIES.find((c) => c.id === id);
  if (!found) throw new Error(`unknown advanced category ${id}`);
  return found;
}
