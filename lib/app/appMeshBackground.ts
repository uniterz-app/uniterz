/**
 * アプリ全体のメッシュ背景。Web `public/bg/app-mesh.png` と
 * Native `apps/native/assets/bg/app-mesh.png` は同一ソース。
 *
 * 元画像は 698×402。表示は 8%（約 56×32）でタイルし、
 * よく見ると模様がある程度の密度にする。
 */
export const APP_MESH_BG_FALLBACK = "#050508";
export const APP_MESH_BG_PUBLIC_PATH = "/bg/app-mesh.png";
export const APP_MESH_BG_TILE_WIDTH_PX = 56;
export const APP_MESH_BG_TILE_HEIGHT_PX = 32;
export const APP_MESH_BG_TILE_SCALE = 0.08;
