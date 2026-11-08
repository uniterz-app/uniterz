/**
 * BDL shot_charts の保存形と、エリア（NBA の shot_zone_basic × shot_zone_area）への寄せ方。
 * 1 試合 = `nbaGameShotCharts/{bdlGameId}`、シーズン合計 = `nbaPlayerShotAreas/{seasonKey}`。
 */

export const NBA_GAME_SHOT_CHARTS_COLLECTION = "nbaGameShotCharts";
export const NBA_PLAYER_SHOT_AREAS_COLLECTION = "nbaPlayerShotAreas";

export const NBA_SHOT_AREA_IDS = [
  "restricted",
  "paint",
  "mid",
  "left_corner_3",
  "right_corner_3",
  "left_wing_3",
  "top_3",
  "right_wing_3",
] as const;
export type NbaShotAreaId = (typeof NBA_SHOT_AREA_IDS)[number];

/** [成功, 試投] */
export type NbaShotAreaCount = [number, number];
export type NbaShotAreaCounts = Partial<Record<NbaShotAreaId, NbaShotAreaCount>>;

/** 1 本。座標は ft（ゴール = x 25, y 0。x が小さいほど左コーナー側） */
export type NbaGameShot = {
  p: string;
  m: 0 | 1;
  v: 2 | 3;
  x: number | null;
  y: number | null;
  d: number | null;
  z: NbaShotAreaId | null;
};

export type NbaGameShotChartsDoc = {
  seasonKey: string;
  /** BDL season_type（regular / ist / playin / playoffs） */
  seasonType: string;
  date: string;
  shots: NbaGameShot[];
  /** 選手 → エリア別 [成功, 試投]（シーズン合計の作り直し用） */
  agg: Record<string, NbaShotAreaCounts>;
  /** プレシーズン等で BDL が返さなかった試合。取り直さない */
  empty?: boolean;
  builtAtMs: number;
};

export type NbaPlayerShotAreasDoc = {
  seasonKey: string;
  /** レギュラー（カップ戦のグループ含む）だけ */
  games: number;
  players: Record<string, NbaShotAreaCounts>;
  builtAtMs: number;
};

/** レギュラーシーズンの成績に入る BDL season_type */
export function isNbaRegularShotSeasonType(t: string | null | undefined): boolean {
  return t === "regular" || t === "ist";
}

export function nbaShotAreaIdOf(
  basic: string | null | undefined,
  area: string | null | undefined
): NbaShotAreaId | null {
  const b = String(basic ?? "").toLowerCase();
  const a = String(area ?? "").toLowerCase();
  if (b.startsWith("restricted")) return "restricted";
  if (b.startsWith("in the paint")) return "paint";
  if (b.startsWith("mid")) return "mid";
  if (b.startsWith("left corner")) return "left_corner_3";
  if (b.startsWith("right corner")) return "right_corner_3";
  if (b.startsWith("above the break")) {
    if (a.startsWith("center")) return "top_3";
    if (a.startsWith("left")) return "left_wing_3";
    if (a.startsWith("right")) return "right_wing_3";
  }
  return null;
}
