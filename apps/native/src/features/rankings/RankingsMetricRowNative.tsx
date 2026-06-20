import { StyleSheet, View } from "react-native";
import type { MobileMetric } from "../../../../../app/component/rankings/_data/mockRows";
import type { Language } from "../../../../../lib/i18n/language";
import {
  metricLabel as webMetricLabel,
  upsetShortLabel,
} from "../../../../../lib/i18n/rankings";
import { type RankingsLanguage } from "./rankingsTexts";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabGridItemNative,
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

  const useGrid = gridColumns === 3;

  function renderTab(item: MobileMetric) {
    const active = metric === item;
    return (
      <CyberSlantedTabNative
        label={pillMetricLabel(item, language)}
        active={active}
        fill
        compact
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        onPress={() => onChange(item)}
      />
    );
  }

  if (useGrid) {
    const row1 = metrics.slice(0, 3);
    const row2 = metrics.slice(3);
    return (
      <View style={styles.metricGrid}>
        <CyberSlantedTabBarNative fill style={styles.metricGridRow}>
          {row1.map((item) => (
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
          ))}
        </CyberSlantedTabBarNative>
        {row2.length > 0 ? (
          <CyberSlantedTabBarNative fill style={styles.metricGridRow}>
            {row2.map((item) => (
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
            ))}
          </CyberSlantedTabBarNative>
        ) : null}
      </View>
    );
  }

  return (
    <CyberSlantedTabBarNative fill>
      {metrics.map((item) => (
        <CyberSlantedTabGridItemNative key={item}>
          {renderTab(item)}
        </CyberSlantedTabGridItemNative>
      ))}
    </CyberSlantedTabBarNative>
  );
}

const styles = StyleSheet.create({
  metricGrid: {
    width: "100%",
    gap: 4,
  },
  metricGridRow: {
    paddingBottom: 0,
  },
});
