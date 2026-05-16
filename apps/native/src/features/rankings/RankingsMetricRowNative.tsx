import { useRef } from "react";
import { Pressable, Text, View } from "react-native";
import type { MobileMetric } from "../../../../../app/component/rankings/_data/mockRows";
import type { Language } from "../../../../../lib/i18n/language";
import {
  metricLabel as webMetricLabel,
  upsetShortLabel,
} from "../../../../../lib/i18n/rankings";
import { type RankingsLanguage } from "./rankingsTexts";
import { rankingsUiStyles as styles } from "./rankingsUiStyles";

function wrapMetricIndex(index: number, length: number) {
  return (index + length) % length;
}

/** Web `RankingsMetricRow` の `formatLabel` と同じ短縮ルール */
function pillMetricLabel(m: MobileMetric, lang: RankingsLanguage): string {
  const l = (lang === "en" ? "en" : "ja") as Language;
  if (m === "upsetScore") return upsetShortLabel(l);
  return webMetricLabel(m, l);
}

/**
 * Web `RankingsMetricRow.tsx` の `RankingsMetricRowMobile`（compactMobile）と同様、
 * 常に3スロット（前・選択・次）だけ表示し、タップ／スワイプで項目を切り替える。
 */
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
  const touchStartXRef = useRef<number | null>(null);
  const SWIPE_THRESHOLD_PX = 36;

  const currentIndex = Math.max(0, metrics.indexOf(metric));
  const len = metrics.length;
  if (len === 0) {
    return null;
  }

  const moveMetricBy = (delta: number) => {
    if (len <= 1) return;
    const target = wrapMetricIndex(currentIndex + delta, len);
    onChange(metrics[target]);
  };

  const prevIndex = wrapMetricIndex(currentIndex - 1, len);
  const nextIndex = wrapMetricIndex(currentIndex + 1, len);
  const prevKey = metrics[prevIndex];
  const currentKey = metrics[currentIndex];
  const nextKey = metrics[nextIndex];

  return (
    <View style={styles.metricCarouselWrap}>
      <View
        style={styles.metricCarouselInner}
        onTouchStart={(e) => {
          touchStartXRef.current = e.nativeEvent.pageX;
        }}
        onTouchEnd={(e) => {
          const startX = touchStartXRef.current;
          touchStartXRef.current = null;
          if (startX == null || len <= 1) return;
          const endX = e.nativeEvent.pageX;
          const dx = endX - startX;
          if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
          if (dx < 0) {
            moveMetricBy(1);
            return;
          }
          moveMetricBy(-1);
        }}
      >
        {len > 1 && prevKey != null ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={pillMetricLabel(prevKey, language)}
            onPress={() => onChange(prevKey)}
            style={({ pressed }) => [
              styles.metricCarouselSideAbs,
              styles.metricCarouselSideAbsLeft,
              pressed && styles.metricCarouselSidePressed,
            ]}
          >
            <Text style={styles.metricCarouselSideText} numberOfLines={2} maxFontSizeMultiplier={1.15}>
              {pillMetricLabel(prevKey, language)}
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: true }}
          accessibilityLabel={pillMetricLabel(currentKey!, language)}
          onPress={() => {}}
          style={styles.metricCarouselCenter}
        >
          <Text
            style={styles.metricCarouselCenterText}
            numberOfLines={2}
            maxFontSizeMultiplier={1.15}
          >
            {pillMetricLabel(currentKey!, language)}
          </Text>
        </Pressable>

        {len > 1 && nextKey != null ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={pillMetricLabel(nextKey, language)}
            onPress={() => onChange(nextKey)}
            style={({ pressed }) => [
              styles.metricCarouselSideAbs,
              styles.metricCarouselSideAbsRight,
              pressed && styles.metricCarouselSidePressed,
            ]}
          >
            <Text style={styles.metricCarouselSideText} numberOfLines={2} maxFontSizeMultiplier={1.15}>
              {pillMetricLabel(nextKey, language)}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
