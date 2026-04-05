import type { CSSProperties } from "react";

/** ブラケットマーケットのチーム短名と揃える（リーグタブ・Bracket ボタン・マッチカードのチーム名等） */
export function bracketMarketTeamTypography(isMobile: boolean): CSSProperties {
  return isMobile
    ? {
        fontFamily: '"Bebas Neue", sans-serif',
        letterSpacing: "0.08em",
      }
    : {
        fontFamily: "Oswald, Bebas Neue, sans-serif",
        letterSpacing: "0.06em",
      };
}
