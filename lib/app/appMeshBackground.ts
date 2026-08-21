/**
 * アプリ全体の背景タイル。Web `public/bg/app-mesh.png` と
 * Native `apps/native/assets/bg/app-mesh.png` は同一ソース（リング格子）。
 *
 * 表示は 128×128 でタイル。暗幕・グレースケールはかけない。
 */
export const APP_MESH_BG_FALLBACK = "#070708";
export const APP_MESH_BG_PUBLIC_PATH = "/bg/app-mesh.png";
export const APP_MESH_BG_TILE_WIDTH_PX = 128;
export const APP_MESH_BG_TILE_HEIGHT_PX = 128;
export const APP_MESH_BG_TILE_SCALE = 1;

/** 互換のため残すが、本番リング格子では使わない（透明） */
export const APP_MESH_BG_WASH = "rgba(0,0,0,0)";
export const APP_MESH_BG_VIGNETTE_COLORS = [
  "rgba(0,0,0,0)",
  "rgba(0,0,0,0)",
  "rgba(0,0,0,0)",
  "rgba(0,0,0,0)",
] as const;
export const APP_MESH_BG_VIGNETTE_LOCATIONS = [0, 0.18, 0.72, 1] as const;
export const APP_MESH_BG_VIGNETTE_CSS = `linear-gradient(180deg, ${APP_MESH_BG_VIGNETTE_COLORS[0]} 0%, ${APP_MESH_BG_VIGNETTE_COLORS[1]} 18%, ${APP_MESH_BG_VIGNETTE_COLORS[2]} 72%, ${APP_MESH_BG_VIGNETTE_COLORS[3]} 100%)`;
/** ドット格子用。中央は透かし、端で黒へ溶かす */
export const APP_MESH_BG_RADIAL_VIGNETTE_CSS =
  "radial-gradient(ellipse 80% 70% at 50% 42%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.78) 100%)";
/** 旧メッシュ用。リング格子では不要 */
export const APP_MESH_BG_TILE_FILTER = "none";
/** Native Skia。identity（色変換なし） */
export const APP_MESH_BG_GRAYSCALE_MATRIX = [
  1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0,
] as const;
