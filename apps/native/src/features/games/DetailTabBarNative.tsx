/** Web `DetailTabBar` 相当 — チーム詳細 / プレイヤー詳細のタブ（OVERVIEW / GAMES / …） */
import { useMemo } from "react";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../rankings/CyberSlantedTabNative";
import {
  nbaDetailTabLabel,
  type NbaPlayerDetailTab,
  type NbaTeamDetailTab,
} from "../../../../../lib/nba/detailTabs";

export default function DetailTabBarNative<T extends string>({
  tabs,
  active,
  onChange,
  accent,
  labelOf,
}: {
  tabs: readonly T[];
  active: T;
  onChange: (tab: T) => void;
  /** チームカラー（タブの塗り・枠） */
  accent: string;
  labelOf?: (tab: T) => string;
}) {
  const theme = useMemo(() => ({ accent }), [accent]);
  return (
    <CyberSlantedTabBarNative fill>
      {tabs.map((tab) => (
        <CyberSlantedTabNative
          key={tab}
          label={labelOf ? labelOf(tab) : nbaDetailTabLabel(tab as NbaTeamDetailTab | NbaPlayerDetailTab)}
          active={tab === active}
          onPress={() => {
            if (tab !== active) onChange(tab);
          }}
          compact
          theme={theme}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === active }}
        />
      ))}
    </CyberSlantedTabBarNative>
  );
}
