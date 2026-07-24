import { StyleSheet, View } from "react-native";
import type { MobileMetric } from "../../../../../lib/rankings/rankingMetrics";
import type { Language } from "../../../../../lib/i18n/language";
import {
  metricLabel as webMetricLabel,
  upsetShortLabel,
} from "../../../../../lib/i18n/rankings";
import { type RankingsLanguage } from "./rankingsTexts";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "./CyberSlantedTabNative";

/** Web `RankingsMetricRow` の `formatLabel` と同じ短縮ルール */
function pillMetricLabel(m: MobileMetric, lang: RankingsLanguage): string {
  const l = (lang === "en" ? "en" : "ja") as Language;
  if (m === "upsetScore") return upsetShortLabel(l);
  return webMetricLabel(m, l);
}

/** Web `RankingsMetricRow` と同様のサイバータブ行 */
export function RankingsMetricRowNative({
  metrics,
  metric,
  onChange,
  language,
  gridColumns,
}: {
  metrics: MobileMetric[];
  metric: MobileMetric;
  onChange: (metric: MobileMetric) => void;
  language: RankingsLanguage;
  /** Web と同様。WC は 3×2 グリッド */
  gridColumns?: 3;
}) {
  if (metrics.length === 0) {
    return null;
  }

  function renderTab(item: MobileMetric) {
    return (
      <CyberSlantedTabNative
        key={item}
        label={pillMetricLabel(item, language)}
        active={metric === item}
        fill
        compact
        accessibilityRole="tab"
        accessibilityState={{ selected: metric === item }}
        onPress={() => onChange(item)}
      />
    );
  }

  /**
   * Web `grid-cols-3 gap-y-2`。
   * バー側の paddingVertical を重ねると行間が開きすぎるので 0 にし、gap だけにする。
   */
  if (gridColumns === 3) {
    const row1 = metrics.slice(0, 3);
    const row2 = metrics.slice(3);
    return (
      <View style={styles.metricGrid}>
        <CyberSlantedTabBarNative fill style={styles.metricGridRow}>
          {row1.map(renderTab)}
        </CyberSlantedTabBarNative>
        {row2.length > 0 ? (
          <CyberSlantedTabBarNative fill style={styles.metricGridRow}>
            {row2.map(renderTab)}
          </CyberSlantedTabBarNative>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <CyberSlantedTabBarNative fill>{metrics.map(renderTab)}</CyberSlantedTabBarNative>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    overflow: "visible",
  },
  /** Web `gap-y-2` 相当（行間のみ） */
  metricGrid: {
    width: "100%",
    gap: 6,
    overflow: "visible",
    paddingVertical: 2,
  },
  metricGridRow: {
    paddingVertical: 0,
  },
});
