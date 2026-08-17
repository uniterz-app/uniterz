/**
 * Web `RankingsPeriodLabelNav` 相当 — Weekly / Monthly の過去期間切り替え（‹ ラベル ›）
 */

import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { RankingPeriod } from "../../../../../lib/rankings/rankingPeriod";
import type { RankingsLanguage } from "./rankingsTexts";
import { METRIC_FONT } from "./rankingsUiTheme";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function weekEndLabel(startKey: string): string {
  const [y, m, d] = startKey.split("-").map(Number);
  const end = new Date(Date.UTC(y, m - 1, d + 6));
  return `${end.getUTCFullYear()}-${pad2(end.getUTCMonth() + 1)}-${pad2(
    end.getUTCDate()
  )}`;
}

function formatLabel(
  period: Exclude<RankingPeriod, "season">,
  label: string,
  language: RankingsLanguage
): string {
  if (period === "weekly") {
    const [, m1, d1] = label.split("-");
    const [, m2, d2] = weekEndLabel(label).split("-");
    return `${Number(m1)}/${Number(d1)} – ${Number(m2)}/${Number(d2)}`;
  }
  const [y, m] = label.split("-").map(Number);
  if (language === "en") {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[m - 1]} ${y}`;
  }
  return `${y}年${m}月`;
}

export function RankingsPeriodLabelNavNative({
  period,
  activeLabel,
  availableLabels,
  onChange,
  language = "ja",
}: {
  period: Exclude<RankingPeriod, "season">;
  activeLabel: string | null;
  availableLabels: string[];
  onChange: (label: string | null) => void;
  language?: RankingsLanguage;
}) {
  const { prevLabel, nextLabel, display } = useMemo(() => {
    if (!activeLabel || availableLabels.length === 0) {
      return { prevLabel: null, nextLabel: null, display: null };
    }
    const idx = availableLabels.indexOf(activeLabel);
    // availableLabels は新しい順: prev = より古い / next = より新しい
    const prev =
      idx >= 0 && idx + 1 < availableLabels.length
        ? availableLabels[idx + 1]
        : null;
    const next = idx > 0 ? availableLabels[idx - 1] : null;
    return {
      prevLabel: prev,
      nextLabel: next,
      display: formatLabel(period, activeLabel, language),
    };
  }, [activeLabel, availableLabels, period, language]);

  if (!display) return null;

  const isCurrent = activeLabel === availableLabels[0];

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="previous period"
        disabled={!prevLabel}
        onPress={() => prevLabel && onChange(prevLabel)}
        hitSlop={8}
        style={({ pressed }) => [
          styles.chevronBtn,
          !prevLabel ? styles.chevronDisabled : null,
          pressed && prevLabel ? styles.chevronPressed : null,
        ]}
      >
        <Text style={styles.chevron}>‹</Text>
      </Pressable>

      <Text style={styles.label} numberOfLines={1}>
        {display}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="next period"
        disabled={!nextLabel}
        onPress={() =>
          nextLabel &&
          onChange(nextLabel === availableLabels[0] ? null : nextLabel)
        }
        hitSlop={8}
        style={({ pressed }) => [
          styles.chevronBtn,
          !nextLabel ? styles.chevronDisabled : null,
          pressed && nextLabel ? styles.chevronPressed : null,
        ]}
      >
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      {!isCurrent ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onChange(null)}
          hitSlop={6}
          style={({ pressed }) => [
            styles.nowBtn,
            pressed ? styles.nowBtnPressed : null,
          ]}
        >
          <Text style={styles.nowText}>{language === "en" ? "Now" : "今"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 4,
  },
  chevronBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chevronPressed: {
    opacity: 0.7,
  },
  chevronDisabled: {
    opacity: 0.25,
  },
  chevron: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,
  },
  label: {
    minWidth: 112,
    textAlign: "center",
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    letterSpacing: 0.4,
    fontVariant: ["tabular-nums"],
    fontFamily: METRIC_FONT,
  },
  nowBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  nowBtnPressed: {
    opacity: 0.75,
  },
  nowText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: METRIC_FONT,
  },
});
