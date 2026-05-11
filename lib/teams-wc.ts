// teams-wc.ts

import type { TeamColorMap } from "./teams-pl";

/**
 * FIFA World Cup 出場国カラーマップ（teamId は "wc-{ISO3 lower}"）
 *
 * primary / secondary は国旗の代表色（カードのアクセント・統計バーなどに使う）。
 * UI 上は国旗 SVG を出すので、色は背景・縁取り・チャート用のフォールバック扱い。
 */
export const teamColorsWC: TeamColorMap = {
  // === Group A ===
  "wc-mex": { primary: "#006847", secondary: "#CE1126" },
  "wc-zaf": { primary: "#007749", secondary: "#FFB81C" },
  "wc-kor": { primary: "#003478", secondary: "#C60C30" },
  "wc-cze": { primary: "#11457E", secondary: "#D7141A" },

  // === Group B ===
  "wc-can": { primary: "#FF0000", secondary: "#FFFFFF" },
  "wc-bih": { primary: "#002F6C", secondary: "#FECB00" },
  "wc-qat": { primary: "#8D1B3D", secondary: "#FFFFFF" },
  "wc-che": { primary: "#FF0000", secondary: "#FFFFFF" },

  // === Group C ===
  "wc-bra": { primary: "#009C3B", secondary: "#FEDF00" },
  "wc-mar": { primary: "#C1272D", secondary: "#006233" },
  "wc-hti": { primary: "#00209F", secondary: "#D21034" },
  "wc-sct": { primary: "#005EB8", secondary: "#FFFFFF" },

  // === Group D ===
  "wc-usa": { primary: "#002868", secondary: "#BF0A30" },
  "wc-pry": { primary: "#D52B1E", secondary: "#0038A8" },
  "wc-aus": { primary: "#00843D", secondary: "#FFCD00" },
  "wc-tur": { primary: "#E30A17", secondary: "#FFFFFF" },

  // === Group E ===
  "wc-deu": { primary: "#000000", secondary: "#DD0000" },
  "wc-civ": { primary: "#F77F00", secondary: "#009E60" },
  "wc-ecu": { primary: "#FFD700", secondary: "#034EA2" },
  "wc-cuw": { primary: "#002B7F", secondary: "#F9E300" },

  // === Group F ===
  "wc-nld": { primary: "#FF6B00", secondary: "#21468B" },
  "wc-jpn": { primary: "#BC002D", secondary: "#FFFFFF" },
  "wc-swe": { primary: "#006AA7", secondary: "#FECC00" },
  "wc-tun": { primary: "#E70013", secondary: "#FFFFFF" },

  // === Group G ===
  "wc-bel": { primary: "#ED2939", secondary: "#FAE042" },
  "wc-egy": { primary: "#CE1126", secondary: "#000000" },
  "wc-irn": { primary: "#239F40", secondary: "#DA0000" },
  "wc-nzl": { primary: "#000000", secondary: "#FFFFFF" },

  // === Group H ===
  "wc-esp": { primary: "#AA151B", secondary: "#F1BF00" },
  "wc-cpv": { primary: "#003893", secondary: "#F7D116" },
  "wc-sau": { primary: "#006C35", secondary: "#FFFFFF" },
  "wc-ury": { primary: "#0038A8", secondary: "#FCD116" },

  // === Group I ===
  "wc-fra": { primary: "#002654", secondary: "#ED2939" },
  "wc-sen": { primary: "#00853F", secondary: "#FDEF42" },
  "wc-irq": { primary: "#CE1126", secondary: "#000000" },
  "wc-nor": { primary: "#BA0C2F", secondary: "#00205B" },

  // === Group J ===
  "wc-arg": { primary: "#74ACDF", secondary: "#FFFFFF" },
  "wc-dza": { primary: "#006233", secondary: "#FFFFFF" },
  "wc-aut": { primary: "#ED2939", secondary: "#FFFFFF" },
  "wc-jor": { primary: "#CE1126", secondary: "#007A3D" },

  // === Group K ===
  "wc-prt": { primary: "#006600", secondary: "#FF0000" },
  "wc-cod": { primary: "#007FFF", secondary: "#FFD200" },
  "wc-uzb": { primary: "#0099B5", secondary: "#1EB53A" },
  "wc-col": { primary: "#FCD116", secondary: "#003893" },

  // === Group L ===
  "wc-eng": { primary: "#CE1124", secondary: "#FFFFFF" },
  "wc-hrv": { primary: "#FF0000", secondary: "#171796" },
  "wc-gha": { primary: "#006B3F", secondary: "#FCD116" },
  "wc-pan": { primary: "#005AA7", secondary: "#DA121A" },
};
