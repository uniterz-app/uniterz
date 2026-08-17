"use client";

import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import { PLAYOFF_ROUND_KEYS } from "@/lib/rankings/playoffRound";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";

type Props = {
  round: PlayoffRoundKey;
  onChange: (round: PlayoffRoundKey) => void;
  isMobile?: boolean;
  language?: Language;
};

function roundLabel(language: Language, key: PlayoffRoundKey): string {
  const m = t(language).rankings;
  switch (key) {
    case "overall":
      return m.roundTotal;
    case "r1":
      return m.roundFirst;
    case "r2":
      return m.roundSecond;
    case "cf":
      return m.roundCF;
    case "finals":
      return m.roundFinals;
  }
}

/** NBA Playoffs のラウンド切替（Native `PlayoffRoundTabsNative` 相当） */
export default function PlayoffRoundTabs({
  round,
  onChange,
  isMobile = false,
  language = "ja",
}: Props) {
  return (
    <CyberSlantedTabBar fill aria-label="Playoff rounds">
      {PLAYOFF_ROUND_KEYS.map((key) => (
        <CyberSlantedTab
          key={key}
          role="tab"
          label={roundLabel(language, key)}
          active={round === key}
          onClick={() => onChange(key)}
          compact={isMobile}
        />
      ))}
    </CyberSlantedTabBar>
  );
}
