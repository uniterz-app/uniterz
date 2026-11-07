/**
 * NBA PRO LEAGUE（open / 無差別級）ボード用の色・タブテーマ。
 * Web / Native のランキング見出し・ロックパネル・タブで共有する。
 */
import { rawColor } from "../theme/rawColor";

/** Web `CyberSlantedTabTheme` と同形（DOM 依存を避けるためここに定義） */
export type ProLeagueTabTheme = {
  accent: string;
  inactiveText?: string;
  activeText?: string;
  activeShadow?: string;
  inactiveBorder?: string;
};

export const PRO_LEAGUE_ATMOSPHERE = {
  gold: "#F6C344",
  violet: "#C084FC",
  ink: "#0A0612",
  panelBorder: "rgba(246,195,68,0.48)",
  panelGlow:
    "0 0 22px rgba(192,132,252,0.32), 0 0 40px rgba(246,195,68,0.14)",
  panelBg: "rgba(192,132,252,0.10)",
  bgDeep: "#12081f",
  noData: "rgba(246,195,68,0.42)",
  chromeGradient:
    "linear-gradient(180deg, #FFF8E7 0%, #F6C344 26%, #E9D5FF 48%, #C084FC 62%, #A855F7 78%, #F6C344 100%)",
  chromeGlow:
    "0 0 6px rgba(246,195,68,0.48), 0 0 14px rgba(192,132,252,0.32), 0 1px 1px rgba(10,6,18,0.55)",
  chromeGlowFill: "#E9D5FF",
  titleNative: "#F5E6C8",
  titleNativeShadow: "rgba(192,132,252,0.45)",
} as const;

/**
 * CyberSlantedTab / Native タブに渡す PRO LEAGUE アクセント（Season 行など）。
 * 選択タブは焼き込み PNG を accent で引くため、ライトテーマでも色を写さない（rawColor）。
 */
export const PRO_LEAGUE_TAB_THEME: ProLeagueTabTheme = {
  accent: rawColor("#F6C344"),
  inactiveText: rawColor("#F6C344"),
  activeText: rawColor("#0A0612"),
  activeShadow:
    "0 0 10px rgba(246,195,68,0.55), 0 0 22px rgba(192,132,252,0.28)",
  inactiveBorder: rawColor("#F6C344"),
};

/** Pick Up / PRO LEAGUE のうち PRO LEAGUE タブ選択色（紫） */
export const PRO_LEAGUE_DIVISION_TAB_THEME: ProLeagueTabTheme = {
  accent: rawColor("#C084FC"),
  inactiveText: rawColor("#C084FC"),
  activeText: rawColor("#0A0612"),
  activeShadow:
    "0 0 10px rgba(192,132,252,0.55), 0 0 22px rgba(168,85,247,0.28)",
  inactiveBorder: rawColor("#C084FC"),
};
