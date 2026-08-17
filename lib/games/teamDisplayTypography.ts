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

/** 試合カードのチーム名：Bebas + 右斜め */
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
