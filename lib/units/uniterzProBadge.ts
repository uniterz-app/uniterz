/**
 * 選んだ生成画像を正とした PRO タグ。
 * 白塗り PNG（黒抜き）。gold は本番バッジと同じ金をマスクで載せる。
 */

export const UNITERZ_PRO_BADGE_ASSET = {
  webPngPath: "/brand/uniterz-pro-badge.png",
  webPngBlackPath: "/brand/uniterz-pro-badge-black.png",
  width: 2048,
  height: 1055,
  aspectRatio: 2048 / 1055,
} as const;

/** 本番 ProCyberBadge と同じゴールド */
export const UNITERZ_PRO_BADGE_GOLD = {
  bright: "#f4df9a",
  mid: "#d4af5a",
  deep: "#a67c28",
  wordCss:
    "linear-gradient(180deg, #f4df9a 0%, #d4af5a 48%, #a67c28 100%)",
} as const;
