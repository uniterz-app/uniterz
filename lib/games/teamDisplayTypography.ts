import type { CSSProperties } from "react";
import { nameOxanium } from "@/lib/fonts";

/** ブラケットマーケットのチーム短名と揃える（リーグタブ・Bracket ボタン・マッチカードのチーム名等）
 * Injury 選手名と同じ Oxanium Bold（700 face）
 */
export function bracketMarketTeamTypography(isMobile: boolean): CSSProperties {
  return isMobile
    ? {
        fontFamily: nameOxanium.style.fontFamily,
        fontWeight: 700,
        letterSpacing: "0.08em",
      }
    : {
        fontFamily: nameOxanium.style.fontFamily,
        fontWeight: 700,
        letterSpacing: "0.06em",
      };
}

/** 試合カードのチーム名：Oxanium + 右斜め */
export function matchCardTeamNameStyle(isMobile: boolean): CSSProperties {
  return {
    ...bracketMarketTeamTypography(isMobile),
    transform: "skewX(-6deg)",
  };
}

/** letter-spacing 末尾余白による中央揃えの見た目ずれ補正（WC 国名・MatchCard と同一） */
export function wcBracketMarketTeamTypography(isMobile: boolean): CSSProperties {
  const base = bracketMarketTeamTypography(isMobile);
  return {
    ...base,
    paddingRight: base.letterSpacing,
  };
}
