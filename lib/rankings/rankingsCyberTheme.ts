import type { CSSProperties } from "react";

/** MyRankCard とランキング一覧で共有するサイバー HUD トークン */
export const RANKINGS_CYAN = "#22d3ee";
export const RANKINGS_HAIRLINE = "rgba(34,211,238,0.16)";
export const RANKINGS_BORDER = "rgba(34,211,238,0.5)";
export const RANKINGS_BORDER_LIST = "rgba(34,211,238,0.38)";

export const RANKINGS_PANEL_BG =
  "linear-gradient(170deg, rgba(22,34,54,0.98) 0%, rgba(7,12,24,1) 60%)";

export const RANKINGS_NOISE_TEXTURE_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/** Top3 表彰台 — 金銀銅アクセント（特別感は維持） */
export function podiumMedalAccent(rank: 1 | 2 | 3) {
  if (rank === 1) {
    return {
      ring: "rgba(255,215,90,0.32)",
      glow: "rgba(255,215,90,0.14)",
      tint: "rgba(255,215,90,0.06)",
      bracket: "rgba(255,214,90,0.82)",
      bracketGlow: "rgba(255,214,90,0.28)",
    };
  }
  if (rank === 2) {
    return {
      ring: "rgba(233,237,246,0.28)",
      glow: "rgba(230,235,245,0.12)",
      tint: "rgba(230,235,245,0.05)",
      bracket: "rgba(233,237,246,0.78)",
      bracketGlow: "rgba(226,232,240,0.22)",
    };
  }
  return {
    ring: "rgba(213,154,90,0.28)",
    glow: "rgba(205,127,50,0.12)",
    tint: "rgba(205,127,50,0.05)",
    bracket: "rgba(213,154,90,0.78)",
    bracketGlow: "rgba(213,154,90,0.22)",
  };
}

/** 一覧行 — 4位以下はシアン、Top3 はメダル色 */
export function listRankMedal(rank: number) {
  if (rank === 1) {
    return {
      text: "#FFD65A",
      glow: "rgba(255,215,90,0.10)",
      tint: "rgba(255,215,90,0.05)",
    };
  }
  if (rank === 2) {
    return {
      text: "#E9EDF6",
      glow: "rgba(230,235,245,0.08)",
      tint: "rgba(230,235,245,0.04)",
    };
  }
  if (rank === 3) {
    return {
      text: "#D59A5A",
      glow: "rgba(205,127,50,0.08)",
      tint: "rgba(205,127,50,0.04)",
    };
  }
  return {
    text: "rgba(140,240,255,0.88)",
    glow: "rgba(34,211,238,0.08)",
    tint: "rgba(34,211,238,0.04)",
  };
}

export function podiumCardShellStyle(rank: 1 | 2 | 3): CSSProperties {
  const m = podiumMedalAccent(rank);
  const depth =
    rank === 1 ? "0 14px 32px rgba(0,0,0,0.42)" : rank === 2 ? "0 12px 28px rgba(0,0,0,0.38)" : "0 10px 24px rgba(0,0,0,0.34)";
  return {
    borderColor: RANKINGS_BORDER,
    background: RANKINGS_PANEL_BG,
    boxShadow: [
      depth,
      "inset 0 0 0 1px rgba(8,14,26,0.9)",
      "inset 0 0 24px rgba(34,211,238,0.05)",
      `inset 0 0 0 1px ${m.ring}`,
      `0 0 20px ${m.glow}`,
      `0 0 36px rgba(34,211,238,0.06)`,
    ].join(", "),
  };
}

export function listCardShellStyle(rank: number): CSSProperties {
  const m = listRankMedal(rank);
  const isTop3 = rank <= 3;
  return {
    borderColor: isTop3 ? RANKINGS_BORDER : RANKINGS_BORDER_LIST,
    background: RANKINGS_PANEL_BG,
    boxShadow: [
      isTop3 ? "0 12px 28px rgba(0,0,0,0.38)" : "0 8px 18px rgba(0,0,0,0.32)",
      "inset 0 0 0 1px rgba(8,14,26,0.9)",
      "inset 0 0 20px rgba(34,211,238,0.04)",
      isTop3 ? `0 0 16px ${m.glow}` : `0 0 12px rgba(34,211,238,0.05)`,
    ].join(", "),
  };
}

/** Top3 カード内の控えめメダルティント（白ガラス overlay の代わり） */
export function podiumMedalTintOverlay(rank: 1 | 2 | 3): CSSProperties {
  const m = podiumMedalAccent(rank);
  return {
    background: `
      radial-gradient(90% 70% at 100% 100%, ${m.tint} 0%, transparent 52%),
      radial-gradient(70% 50% at 0% 0%, rgba(34,211,238,0.04) 0%, transparent 48%)
    `,
  };
}
