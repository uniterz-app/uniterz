/**
 * 週次 / 月次レポート共通 — 黒背景・金枠。
 * 中身のアクセント色（cyan / emerald 等）は各ビュー側のまま。
 */
export const REPORT_CHROME = {
  /** パネル塗り */
  bg: "#050508",
  bgGrad: "linear-gradient(170deg, #0c0c10 0%, #050508 72%)",
  /** 枠のみ（Pro My Rank と同系） */
  gold: "#E8C66A",
  goldBorder: "rgba(232,198,106,0.55)",
  goldBorderSoft: "rgba(232,198,106,0.32)",
  /** 薄い外光（枠の補助。中身の色には使わない） */
  goldGlow: "rgba(232,198,106,0.12)",
  /** リスト区切り */
  divider: "rgba(255,255,255,0.10)",
  hairline: "rgba(255,255,255,0.08)",
} as const;

/** @deprecated 互換エイリアス — `REPORT_CHROME` を使う */
export const REPORT_KUROKIN = REPORT_CHROME;
