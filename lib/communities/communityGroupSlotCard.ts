/** グループ一覧スロットカード — 背景画像＋暗幕 */

export const COMMUNITY_GROUP_SLOT_CARD_BG = "#040812";

/** 左テキスト帯を確保しつつ右側に画像が覗くグラデーション */
export const COMMUNITY_GROUP_SLOT_CARD_SCRIM_OWNER =
  "linear-gradient(90deg, rgba(4,8,18,0.96) 0%, rgba(4,8,18,0.9) 26%, rgba(4,8,18,0.62) 46%, rgba(4,8,18,0.28) 68%, rgba(4,8,18,0.1) 100%)";

export const COMMUNITY_GROUP_SLOT_CARD_SCRIM_MEMBER =
  "linear-gradient(90deg, rgba(4,8,18,0.94) 0%, rgba(4,8,18,0.86) 28%, rgba(4,8,18,0.58) 48%, rgba(4,8,18,0.26) 70%, rgba(4,8,18,0.08) 100%)";

/** 右上バッジ帯 — 明るい画像でもオーナー表示を読みやすく */
export const COMMUNITY_GROUP_SLOT_CARD_SCRIM_TOP =
  "linear-gradient(180deg, rgba(4,8,18,0.78) 0%, rgba(4,8,18,0.42) 42%, rgba(4,8,18,0) 72%)";

/** Native — 左→右の暗幕（locations は 0〜1） */
export const COMMUNITY_GROUP_SLOT_CARD_NATIVE_SCRIM = {
  owner: {
    colors: [
      "rgba(4,8,18,0.96)",
      "rgba(4,8,18,0.9)",
      "rgba(4,8,18,0.62)",
      "rgba(4,8,18,0.28)",
      "rgba(4,8,18,0.1)",
    ] as const,
    locations: [0, 0.26, 0.46, 0.68, 1] as const,
  },
  member: {
    colors: [
      "rgba(4,8,18,0.94)",
      "rgba(4,8,18,0.86)",
      "rgba(4,8,18,0.58)",
      "rgba(4,8,18,0.26)",
      "rgba(4,8,18,0.08)",
    ] as const,
    locations: [0, 0.28, 0.48, 0.7, 1] as const,
  },
} as const;

/** Native — 上端（バッジ帯） */
export const COMMUNITY_GROUP_SLOT_CARD_NATIVE_SCRIM_TOP = {
  colors: ["rgba(4,8,18,0.78)", "rgba(4,8,18,0.42)", "rgba(4,8,18,0)"] as const,
  locations: [0, 0.42, 0.72] as const,
};
