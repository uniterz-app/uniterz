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
}: {
  metrics: MobileMetric[];
  metric: MobileMetric;
  onChange: (metric: MobileMetric) => void;
  language: RankingsLanguage;
}) {
  if (metrics.length === 0) {
    return null;
  }

  const useGrid = metrics.length >= 6;

  return (
    <CyberSlantedTabBarNative fill gridColumns={useGrid ? 3 : undefined}>
      {metrics.map((item) => {
        const active = metric === item;
        return (
          <CyberSlantedTabGridItemNative key={item} columns={useGrid ? 3 : undefined}>
            <CyberSlantedTabNative
              label={pillMetricLabel(item, language)}
              active={active}
              fill
              compact
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(item)}
            />
          </CyberSlantedTabGridItemNative>
        );
      })}
    </CyberSlantedTabBarNative>
  );
}
