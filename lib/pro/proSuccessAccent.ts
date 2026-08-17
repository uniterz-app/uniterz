/**
 * Pro 成功カードのアクセント色（レイアウト共通・色のみ分岐）
 * - trial: シアン（Trial ON）
 * - billing: グリーン（本番課金成功）
 * - planChange: アンバー（プラン変更完了）
 * - cancel: レッド（解約手続き・解約完了）
 */
export const PRO_SUCCESS_ACCENT = {
  trial: {
    main: "#00F5FF",
    mainRgb: "0,245,255",
    ink: "#050508",
    title: "#ecfeff",
    muted: "rgba(207,250,254,0.7)",
    soft: "rgba(207,250,254,0.45)",
    borderSoft: "rgba(34,211,238,0.35)",
    metaLabel: "rgba(165,243,252,0.4)",
    gridDot: "rgba(0,245,255,0.45)",
  },
  billing: {
    main: "#22C55E",
    mainRgb: "34,197,94",
    ink: "#050508",
    title: "#dcfce7",
    muted: "rgba(187,247,208,0.75)",
    soft: "rgba(187,247,208,0.5)",
    borderSoft: "rgba(34,197,94,0.4)",
    metaLabel: "rgba(134,239,172,0.45)",
    gridDot: "rgba(34,197,94,0.45)",
  },
  planChange: {
    main: "#FBBF24",
    mainRgb: "251,191,36",
    ink: "#120e08",
    title: "#fff7ed",
    muted: "rgba(254,243,199,0.75)",
    soft: "rgba(254,243,199,0.45)",
    borderSoft: "rgba(251,191,36,0.4)",
    metaLabel: "rgba(253,230,138,0.45)",
    gridDot: "rgba(251,191,36,0.45)",
  },
  cancel: {
    main: "#EF4444",
    mainRgb: "239,68,68",
    ink: "#ffffff",
    title: "#fecaca",
    muted: "rgba(254,202,202,0.75)",
    soft: "rgba(254,202,202,0.45)",
    borderSoft: "rgba(239,68,68,0.4)",
    metaLabel: "rgba(252,165,165,0.45)",
    gridDot: "rgba(239,68,68,0.45)",
  },
} as const;

export type ProSuccessAccentKey = keyof typeof PRO_SUCCESS_ACCENT;
