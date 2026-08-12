/**
 * Web `ProfileMonthlyReportPanel` 相当。
 * ゲート面＋見た目確認用の強制切替（Pro でも Free / ロックを表示可）。
 */
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type {
  MainTabParamList,
  ProfileStackParamList,
} from "../../navigation/types";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../rankings/CyberSlantedTabNative";
import WeeklyReportViewNative from "./reports/WeeklyReportViewNative";
import MonthlyReportViewNative from "./reports/MonthlyReportViewNative";
import ReportGateSurfaceNative from "./reports/ReportGateSurfaceNative";
import { useUserReportsArchiveNative } from "./reports/useProReportDeliveryOverlayNative";
import { formatReportPeriodLabel } from "../../../../../lib/reports/reportDelivery";
import {
  REPORT_GATE_PREVIEW_MODES,
  type ReportGateKind,
  type ReportGatePreviewMode,
} from "../../../../../lib/reports/reportGateTypes";
import { weeklyReportPreviewClimbed } from "../../../../../lib/reports/weeklyReportPreviewMocks";
import { monthlyReportPreviewTop10 } from "../../../../../lib/reports/monthlyReportPreviewMocks";
import { colors, spacing, typography } from "../../theme/tokens";
import { OXANIUM_700 } from "./reports/reportThemeNative";

type Props = {
  uid: string | undefined;
  language: "ja" | "en";
  isProView: boolean;
  myPlan: string | null;
  isMe: boolean;
  isMyPro: boolean;
  isTargetPro: boolean;
};

type Tab = "weekly" | "monthly";

const GATE_CHIP: Record<ReportGatePreviewMode, { ja: string; en: string }> = {
  live: { ja: "ライブ", en: "Live" },
  free: { ja: "Free", en: "Free" },
  waitingMonday: { ja: "月曜待ち", en: "Monday" },
  waitingMonth: { ja: "月初待ち", en: "Month wait" },
  insufficientPicks: { ja: "予想不足", en: "No picks" },
  monthlyLocked: { ja: "月次ロック", en: "Monthly lock" },
};

export default function ProfileStatsTabNative({
  uid,
  language,
  isProView,
  myPlan,
  isMe,
  isMyPro,
  isTargetPro,
}: Props) {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const canViewReport =
    isProView || (isMe ? myPlan === "pro" : isMyPro && isTargetPro);
  const [tab, setTab] = useState<Tab>("weekly");
  const [forceGate, setForceGate] = useState<ReportGatePreviewMode>("live");
  const isJa = language === "ja";

  const { loading, weeklies, monthlies } = useUserReportsArchiveNative({
    uid,
    enabled: canViewReport && Boolean(uid),
  });

  const [selectedWeeklyId, setSelectedWeeklyId] = useState<string | null>(null);
  const [selectedMonthlyId, setSelectedMonthlyId] = useState<string | null>(
    null
  );

  const mockWeekly = useMemo(() => weeklyReportPreviewClimbed(), []);
  const mockMonthly = useMemo(() => monthlyReportPreviewTop10(), []);

  const selectedWeekly = useMemo(() => {
    if (!weeklies.length) return null;
    return (
      weeklies.find((x) => x.id === selectedWeeklyId) ?? weeklies[0] ?? null
    );
  }, [weeklies, selectedWeeklyId]);

  const selectedMonthly = useMemo(() => {
    if (!monthlies.length) return null;
    return (
      monthlies.find((x) => x.id === selectedMonthlyId) ?? monthlies[0] ?? null
    );
  }, [monthlies, selectedMonthlyId]);

  const effectiveGate: ReportGateKind | null = useMemo(() => {
    if (forceGate !== "live") return forceGate;
    if (!canViewReport) return "free";
    return null;
  }, [forceGate, canViewReport]);

  const handleGateCta = (kind: ReportGateKind) => {
    switch (kind) {
      case "free":
        navigation.navigate("ProSubscribe");
        break;
      case "monthlyLocked":
        navigation.navigate("PlanChange");
        break;
      case "insufficientPicks": {
        const tabNav =
          navigation.getParent<BottomTabNavigationProp<MainTabParamList>>();
        tabNav?.navigate("GamesTab", { screen: "GamesHome" });
        break;
      }
      default:
        break;
    }
  };

  const renderGate = (kind: ReportGateKind) => {
    const showCta =
      kind === "free"
        ? isMe || forceGate === "free"
        : kind === "monthlyLocked" || kind === "insufficientPicks";

    if (kind === "free") {
      return (
        <ReportGateSurfaceNative
          kind="free"
          language={language}
          showCta={showCta}
          onPressCta={() => handleGateCta("free")}
          preview={
            <WeeklyReportViewNative report={mockWeekly} language={language} />
          }
        />
      );
    }
    if (kind === "monthlyLocked") {
      return (
        <ReportGateSurfaceNative
          kind="monthlyLocked"
          language={language}
          showCta={showCta}
          onPressCta={() => handleGateCta("monthlyLocked")}
          preview={
            <MonthlyReportViewNative
              report={mockMonthly}
              language={language}
            />
          }
        />
      );
    }
    return (
      <ReportGateSurfaceNative
        kind={kind}
        language={language}
        showCta={showCta}
        onPressCta={
          kind === "insufficientPicks"
            ? () => handleGateCta("insufficientPicks")
            : undefined
        }
      />
    );
  };

  const gateSwitcher = (
    <View style={styles.gateBlock}>
      <View style={styles.gateTopRow}>
        <Text style={styles.gateLabel}>GATE PREVIEW</Text>
        {__DEV__ ? (
          <Pressable
            onPress={() => navigation.navigate("MonthlyReportPreview")}
            style={styles.devPreviewBtn}
            accessibilityRole="button"
          >
            <Text style={styles.devPreviewBtnText}>WEEKLY / MONTHLY</Text>
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.gateChipRow}
      >
        {REPORT_GATE_PREVIEW_MODES.map((key) => {
          const on = forceGate === key;
          return (
            <Pressable
              key={key}
              onPress={() => setForceGate(key)}
              style={[styles.gateChip, on && styles.gateChipOn]}
            >
              <Text style={[styles.gateChipText, on && styles.gateChipTextOn]}>
                {GATE_CHIP[key][language]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  if (!uid) {
    return (
      <Text style={styles.muted}>
        {isJa ? "ログインが必要です" : "Sign in required"}
      </Text>
    );
  }

  if (effectiveGate) {
    return (
      <View style={styles.root}>
        {gateSwitcher}
        {renderGate(effectiveGate)}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.root}>
        {gateSwitcher}
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#67e8f9" />
        </View>
      </View>
    );
  }

  const list = tab === "weekly" ? weeklies : monthlies;

  return (
    <View style={styles.root}>
      {gateSwitcher}

      <Text style={styles.archiveLabel}>REPORT ARCHIVE</Text>
      <Text style={styles.archiveHint}>
        {isJa
          ? "週次は競争の実況、月次は自分の分析。毎月1日朝に月次が届きます。"
          : "Weekly = competition pulse. Monthly = self analysis. Drops on the 1st morning."}
      </Text>

      <View style={styles.tabShell}>
        <CyberSlantedTabBarNative fill>
          <CyberSlantedTabNative
            label="WEEKLY"
            active={tab === "weekly"}
            onPress={() => setTab("weekly")}
            compact
            fontWeight="700"
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === "weekly" }}
          />
          <CyberSlantedTabNative
            label="MONTHLY"
            active={tab === "monthly"}
            onPress={() => setTab("monthly")}
            compact
            fontWeight="700"
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === "monthly" }}
          />
        </CyberSlantedTabBarNative>
      </View>

      {tab === "monthly" && list.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodRow}
        >
          {list.map((item) => {
            const selected = item.id === selectedMonthly?.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setSelectedMonthlyId(item.id)}
                style={[styles.periodChip, selected && styles.periodChipOn]}
              >
                <Text
                  style={[
                    styles.periodChipText,
                    selected && styles.periodChipTextOn,
                  ]}
                >
                  {formatReportPeriodLabel(item.kind, item.periodKey, language)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {tab === "weekly" ? (
        selectedWeekly && selectedWeekly.kind === "weekly" ? (
          <WeeklyReportViewNative
            report={selectedWeekly.report}
            language={language}
            periods={weeklies.map((w) => ({
              id: w.id,
              label: formatReportPeriodLabel("weekly", w.periodKey, language),
            }))}
            selectedPeriodId={selectedWeekly.id}
            onSelectPeriod={setSelectedWeeklyId}
          />
        ) : (
          renderGate("waitingMonday")
        )
      ) : selectedMonthly && selectedMonthly.kind === "monthly" ? (
        <MonthlyReportViewNative
          report={selectedMonthly.report}
          language={language}
        />
      ) : (
        renderGate("waitingMonth")
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: spacing.sm,
    gap: 12,
    paddingBottom: spacing.lg,
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: "center",
  },
  gateBlock: {
    gap: 6,
  },
  gateTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  gateLabel: {
    fontFamily: OXANIUM_700,
    fontSize: 9,
    letterSpacing: 1.6,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  devPreviewBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.55)",
    backgroundColor: "rgba(34,211,238,0.14)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  devPreviewBtnText: {
    fontFamily: OXANIUM_700,
    color: "rgba(165,243,252,0.95)",
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  archiveLabel: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  archiveHint: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.5)",
    marginTop: -4,
  },
  gateChipRow: {
    gap: 4,
    paddingVertical: 2,
  },
  gateChip: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  gateChipOn: {
    borderColor: "rgba(34,211,238,0.55)",
    backgroundColor: "rgba(34,211,238,0.14)",
  },
  gateChipText: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
  gateChipTextOn: {
    color: "#a5f3fc",
  },
  tabShell: {
    minHeight: 36,
  },
  periodRow: {
    gap: 6,
    paddingVertical: 2,
  },
  periodChip: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  periodChipOn: {
    borderColor: "rgba(34,211,238,0.55)",
    backgroundColor: "rgba(34,211,238,0.14)",
  },
  periodChipText: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
  },
  periodChipTextOn: {
    color: "#a5f3fc",
  },
  muted: {
    color: colors.textSecondary,
    fontSize: typography.body,
    paddingVertical: spacing.md,
  },
});
