/**
 * Web `RankingsDivisionTabs` 相当 — Pick Up / PRO LEAGUE
 * Season / Weekly と同じ CyberSlantedTabNative。
 * PRO LEAGUE 選択色のみ紫。
 */

import type { RankingDivision } from "../../../../../lib/rankings/rankingDivision";
import { PRO_LEAGUE_DIVISION_TAB_THEME } from "../../../../../lib/rankings/proLeagueAtmosphere";
import { rankingsTexts, type RankingsLanguage } from "./rankingsTexts";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "./CyberSlantedTabNative";

export function RankingsDivisionTabsNative({
  division,
  onChange,
  language,
}: {
  division: RankingDivision;
  onChange: (next: RankingDivision) => void;
  language: RankingsLanguage;
}) {
  const t = rankingsTexts(language);

  return (
    <CyberSlantedTabBarNative fill>
      <CyberSlantedTabNative
        label={t.divisionStandard}
        active={division === "standard"}
        fill
        compact
        onPress={() => onChange("standard")}
      />
      <CyberSlantedTabNative
        label={t.divisionOpen}
        active={division === "open"}
        fill
        compact
        theme={PRO_LEAGUE_DIVISION_TAB_THEME}
        onPress={() => onChange("open")}
      />
    </CyberSlantedTabBarNative>
  );
}
