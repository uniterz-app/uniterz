/** グループ詳細ヒーロー — 画像＋オーバーレイパネル寸法 */

/** 画像表示エリアの高さ（Native） */
export const COMMUNITY_GROUP_HERO_IMAGE_HEIGHT = 272;

/** Web — ヒーロー画像の表示高さ（より広い画角） */
export const COMMUNITY_GROUP_HERO_WEB_IMAGE_HEIGHT = 340;

/** パネルが画像に重なる量（TITLE を画像上に載せる） */
export const COMMUNITY_GROUP_HERO_PANEL_OVERLAP = 148;

/** Web — パネルが画像に重なる量 */
export const COMMUNITY_GROUP_HERO_WEB_PANEL_OVERLAP = 168;

/** 一覧へ戻るヘッダーの高さ */
export const COMMUNITY_GROUP_LIST_BACK_HEADER_HEIGHT = 44;

/** 一覧へヘッダーを画像上に載せるときの画像エリア高さ（Web） */
export const COMMUNITY_GROUP_HERO_WEB_IMAGE_HEIGHT_WITH_BACK =
  COMMUNITY_GROUP_HERO_WEB_IMAGE_HEIGHT + COMMUNITY_GROUP_LIST_BACK_HEADER_HEIGHT;

/** ヒーロー／詳細カードの背景色 */
export const COMMUNITY_GROUP_HERO_BG = "#040812";

/** Web — 縦方向（下端で背景色へ溶解） */
export const COMMUNITY_GROUP_HERO_SCRIM_VERTICAL =
  "linear-gradient(180deg, rgba(4,8,18,0.32) 0%, rgba(4,8,18,0) 12%, rgba(4,8,18,0) 30%, rgba(4,8,18,0.22) 50%, rgba(4,8,18,0.48) 72%, rgba(4,8,18,0.72) 88%, rgba(4,8,18,0.82) 100%)";

/** Web — 横方向（左テキスト帯を確保し右下は画像が見える） */
export const COMMUNITY_GROUP_HERO_SCRIM_HORIZONTAL =
  "linear-gradient(90deg, rgba(4,8,18,0.68) 0%, rgba(4,8,18,0.24) 42%, rgba(4,8,18,0.08) 66%, rgba(4,8,18,0) 82%)";

/** Native — 横方向（左テキスト帯を確保し右下は画像が見える） */
export const COMMUNITY_GROUP_HERO_NATIVE_SCRIM_HORIZONTAL = {
  colors: [
    "rgba(4,8,18,0.68)",
    "rgba(4,8,18,0.24)",
    "rgba(4,8,18,0.08)",
    "rgba(4,8,18,0)",
  ] as const,
  locations: [0, 0.42, 0.66, 0.82] as const,
};

/** Native — 画像上のフェード（下端で背景色へ溶解、右下は縦だけだと暗くなりすぎるので控えめ） */
export const COMMUNITY_GROUP_HERO_NATIVE_SCRIM = {
  colors: [
    "rgba(4,8,18,0.32)",
    "rgba(4,8,18,0)",
    "rgba(4,8,18,0)",
    "rgba(4,8,18,0.22)",
    "rgba(4,8,18,0.48)",
    "rgba(4,8,18,0.72)",
    "rgba(4,8,18,0.82)",
  ] as const,
  locations: [0, 0.12, 0.3, 0.5, 0.72, 0.88, 1] as const,
};
