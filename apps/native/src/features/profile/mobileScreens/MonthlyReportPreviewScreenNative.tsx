/**
 * Monthly Report UI 调整用の Native プレビュー（mock）。
 * Web: /mobile/monthly-report-preview と同様にケースを切り替えて確認。
 */
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { MonthlyReport } from "../../../../../../lib/reports/monthlyReportTypes";
import MonthlyReportViewNative from "../reports/MonthlyReportViewNative";
import WeeklyReportViewNative from "../reports/WeeklyReportViewNative";
import {
  monthlyReportPreviewAboveTop10,
  monthlyReportPreviewBelowMedian,
  monthlyReportPreviewClimbed,
  monthlyReportPreviewDropped,
  monthlyReportPreviewField,
  monthlyReportPreviewFirstMonth,
  monthlyReportPreviewTop100,
  monthlyReportPreviewTop10,
  monthlyReportPreviewTop20,
} from "../../../../../../lib/reports/monthlyReportPreviewMocks";
import type { WeeklyReport } from "../../../../../../lib/reports/weeklyReportTypes";
import {
  weeklyReportPreviewBigClimb,
  weeklyReportPreviewClimbed,
  weeklyReportPreviewDropped,
  weeklyReportPreviewFirstWeek,
  weeklyReportPreviewLive,
} from "../../../../../../lib/reports/weeklyReportPreviewMocks";
import { OXANIUM_700 } from "../reports/reportThemeNative";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../../rankings/CyberSlantedTabNative";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";

type TabKey = "weekly" | "monthly";

type WeeklyCaseKey =
  | "live"
  | "climbed"
  | "bigclimb"
  | "dropped"
  | "first";

type MonthlyCaseKey =
  | "top10"
  | "above"
  | "top20"
  | "climbed"
  | "dropped"
  | "top100"
  | "field"
  | "first"
  | "below";

const WEEKLY_CASES: Array<{ key: WeeklyCaseKey; labelJa: string }> = [
  { key: "live", labelJa: "進行中" },
  { key: "climbed", labelJa: "上昇した週" },
  { key: "bigclimb", labelJa: "28人抜き" },
  { key: "dropped", labelJa: "下降した週" },
  { key: "first", labelJa: "初参戦" },
];

const MONTHLY_CASES: Array<{ key: MonthlyCaseKey; labelJa: string }> = [
  { key: "top10", labelJa: "TOP10↑" },
  { key: "above", labelJa: "上位10%超え" },
  { key: "top20", labelJa: "TOP20" },
  { key: "climbed", labelJa: "大きく上昇" },
  { key: "dropped", labelJa: "下降" },
  { key: "top100", labelJa: "TOP100" },
  { key: "field", labelJa: "圏外" },
  { key: "first", labelJa: "初月" },
  { key: "below", labelJa: "中央値割れ" },
];

function buildWeeklyMock(caseKey: WeeklyCaseKey): WeeklyReport {
  switch (caseKey) {
    case "live":
      return weeklyReportPreviewLive();
    case "climbed":
      return weeklyReportPreviewClimbed();
    case "bigclimb":
      return weeklyReportPreviewBigClimb();
    case "dropped":
      return weeklyReportPreviewDropped();
    case "first":
      return weeklyReportPreviewFirstWeek();
  }
}

function buildMonthlyMock(caseKey: MonthlyCaseKey): MonthlyReport {
  switch (caseKey) {
    case "top10":
      return monthlyReportPreviewTop10();
    case "above":
      return monthlyReportPreviewAboveTop10();
    case "top20":
      return monthlyReportPreviewTop20();
    case "climbed":
      return monthlyReportPreviewClimbed();
    case "dropped":
      return monthlyReportPreviewDropped();
    case "top100":
      return monthlyReportPreviewTop100();
    case "field":
      return monthlyReportPreviewField();
    case "first":
      return monthlyReportPreviewFirstMonth();
    case "below":
      return monthlyReportPreviewBelowMedian();
  }
}

export default function MonthlyReportPreviewScreenNative({
  language,
  initialCaseKey,
  initialTab,
  onClose,
}: {
  language: "ja" | "en";
  initialCaseKey?: string | null;
  initialTab?: TabKey | null;
  onClose: () => void;
}) {
  const initialTabResolved: TabKey = useMemo(() => {
    if (initialTab === "weekly" || initialTab === "monthly") return initialTab;
    return "monthly";
  }, [initialTab]);

  const initialMonthlyCaseKey: MonthlyCaseKey = useMemo(() => {
    const raw = (initialCaseKey ?? "").trim();
    const found = MONTHLY_CASES.some((c) => c.key === raw);
    return (found ? (raw as MonthlyCaseKey) : "top10") ?? "top10";
  }, [initialCaseKey]);

  const initialWeeklyCaseKey: WeeklyCaseKey = "climbed";

  const [tab, setTab] = useState<TabKey>(initialTabResolved);
  const [weeklyCaseKey, setWeeklyCaseKey] = useState<WeeklyCaseKey>(initialWeeklyCaseKey);
  const [monthlyCaseKey, setMonthlyCaseKey] = useState<MonthlyCaseKey>(initialMonthlyCaseKey);
  const { bottomContentReserveY } = useBottomTabBarInsets();

  const weeklyReport = useMemo(
    () => buildWeeklyMock(weeklyCaseKey),
    [weeklyCaseKey]
  );
  const monthlyReport = useMemo(
    () => buildMonthlyMock(monthlyCaseKey),
    [monthlyCaseKey]
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Report Preview</Text>
        <Pressable onPress={onClose} accessibilityRole="button">
          <Text style={styles.close}>{language === "ja" ? "閉じる" : "Close"}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.bodyContent, { paddingBottom: bottomContentReserveY + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <CyberSlantedTabBarNative fill style={styles.tabBar}>
          <CyberSlantedTabNative
            label={language === "ja" ? "週間" : "Weekly"}
            active={tab === "weekly"}
            onPress={() => setTab("weekly")}
            compact
          />
          <CyberSlantedTabNative
            label={language === "ja" ? "月間" : "Monthly"}
            active={tab === "monthly"}
            onPress={() => setTab("monthly")}
            compact
          />
        </CyberSlantedTabBarNative>

        <View style={styles.caseRow}>
          {(tab === "weekly" ? WEEKLY_CASES : MONTHLY_CASES).map((c) => {
            const active = tab === "weekly" ? (c.key as WeeklyCaseKey) === weeklyCaseKey : (c.key as MonthlyCaseKey) === monthlyCaseKey;
            return (
              <Pressable
                key={c.key}
                onPress={() => {
                  if (tab === "weekly") setWeeklyCaseKey(c.key as WeeklyCaseKey);
                  else setMonthlyCaseKey(c.key as MonthlyCaseKey);
                }}
                style={[styles.caseChip, active && styles.caseChipOn]}
              >
                <Text style={[styles.caseChipText, active && styles.caseChipTextOn]}>
                  {c.labelJa}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.previewWrap}>
          {tab === "weekly" ? (
            <WeeklyReportViewNative report={weeklyReport} language={language} />
          ) : (
            <MonthlyReportViewNative report={monthlyReport} language={language} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: OXANIUM_700,
    color: "#fff",
    fontSize: 14,
    letterSpacing: 1.2,
  },
  close: {
    color: "rgba(165,243,252,0.95)",
    fontFamily: OXANIUM_700,
    fontSize: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  tabBar: {
    marginTop: 6,
  },
  caseRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  caseChip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  caseChipOn: {
    borderColor: "rgba(34,211,238,0.55)",
    backgroundColor: "rgba(34,211,238,0.14)",
  },
  caseChipText: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    color: "rgba(255,255,255,0.55)",
  },
  caseChipTextOn: {
    color: "rgba(165,243,252,0.95)",
  },
  previewWrap: {
    marginTop: 6,
  },
});

