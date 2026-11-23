/** グループ詳細ヒーロー — 画像＋オーバーレイパネル寸法 */

/** 画像表示エリアの高さ（Native） */
export const COMMUNITY_GROUP_HERO_IMAGE_HEIGHT = 272;

/** Web — ヒーロー画像の表示高さ（より広い画角） */
export const COMMUNITY_GROUP_HERO_WEB_IMAGE_HEIGHT = 340;

/** パネルが画像に重なる量（下フェード帯に名前・メタを載せる） */
export const COMMUNITY_GROUP_HERO_PANEL_OVERLAP = 148;

/** Web — パネルが画像に重なる量 */
export const COMMUNITY_GROUP_HERO_WEB_PANEL_OVERLAP = 168;

/** 一覧へ戻るヘッダーの高さ */
export const COMMUNITY_GROUP_LIST_BACK_HEADER_HEIGHT = 44;

/** 一覧へヘッダーを画像上に載せるときの画像エリア高さ（Web） */
export const COMMUNITY_GROUP_HERO_WEB_IMAGE_HEIGHT_WITH_BACK =
  COMMUNITY_GROUP_HERO_WEB_IMAGE_HEIGHT + COMMUNITY_GROUP_LIST_BACK_HEADER_HEIGHT;

/** ヒーロー／詳細カードの背景色 */
export const COMMUNITY_GROUP_HERO_BG = "#000000";

/** Web — 縦方向（上端は見出しへ・下端は黒へ溶かして切れ目を消す） */
export const COMMUNITY_GROUP_HERO_SCRIM_VERTICAL =
  "linear-gradient(180deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 10%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 36%, rgba(0,0,0,0.35) 58%, rgba(0,0,0,0.75) 80%, rgba(0,0,0,0.96) 100%)";

/** Web — 横方向（左テキスト帯を確保し右下は画像が見える） */
export const COMMUNITY_GROUP_HERO_SCRIM_HORIZONTAL =
  "linear-gradient(90deg, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.24) 42%, rgba(0,0,0,0.08) 66%, rgba(0,0,0,0) 82%)";

/** Native — 横方向（左テキスト帯を確保し右下は画像が見える） */
export const COMMUNITY_GROUP_HERO_NATIVE_SCRIM_HORIZONTAL = {
  colors: [
    "rgba(0,0,0,0.68)",
    "rgba(0,0,0,0.24)",
    "rgba(0,0,0,0.08)",
    "rgba(0,0,0,0)",
  ] as const,
  locations: [0, 0.42, 0.66, 0.82] as const,
};

/**
 * Native — 画像上の縦フェード。
 * 上端は見出し帯へ溶かし、下端はアプリ背景を透かす。
 */
export const COMMUNITY_GROUP_HERO_NATIVE_SCRIM = {
  colors: [
    "rgba(0,0,0,0.92)",
    "rgba(0,0,0,0.4)",
    "rgba(0,0,0,0)",
    "rgba(0,0,0,0)",
    "rgba(0,0,0,0.35)",
    "rgba(0,0,0,0.75)",
    "rgba(0,0,0,0.96)",
  ] as const,
  locations: [0, 0.1, 0.22, 0.36, 0.58, 0.8, 1] as const,
};

/** Native — 写真上端だけを見出しへ溶かす短い帯 */
export const COMMUNITY_GROUP_HERO_NATIVE_SCRIM_TOP = {
  colors: ["rgba(0,0,0,0.9)", "rgba(0,0,0,0.4)", "rgba(0,0,0,0)"] as const,
  locations: [0, 0.5, 1] as const,
  heightRatio: 0.28,
};

/** Native — 写真下端の切れ目を溶かす帯 */
export const COMMUNITY_GROUP_HERO_NATIVE_SCRIM_BOTTOM = {
  colors: ["rgba(0,0,0,0)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.97)"] as const,
  locations: [0, 0.5, 1] as const,
  heightRatio: 0.45,
};
