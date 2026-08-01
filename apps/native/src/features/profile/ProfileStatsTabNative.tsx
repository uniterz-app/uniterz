/**
 * Web `ProfileMonthlyReportPanel` 相当。旧 Pro Stats / user_stats_v2_monthly は読まない。
 */
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { MonthlyReport } from "../../../../../lib/reports/monthlyReportTypes";
import type { ProfileStackParamList } from "../../navigation/types";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type Props = {
  uid: string | undefined;
  language: "ja" | "en";
  isProView: boolean;
  myPlan: string | null;
  isMe: boolean;
  isMyPro: boolean;
  isTargetPro: boolean;
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
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const canViewReport =
    isProView || (isMe ? myPlan === "pro" : isMyPro && isTargetPro);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(canViewReport && Boolean(uid));
  const isJa = language === "ja";

  useEffect(() => {
    if (!canViewReport || !uid) {
      setReport(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const snapshot = await getDocs(
          query(collection(db, "user_reports"), where("uid", "==", uid))
        );
        if (cancelled) return;
        const latest = snapshot.docs
          .map((entry) => entry.data())
          .filter(
            (entry): entry is MonthlyReport =>
              entry?.league === "nba" && typeof entry?.monthKey === "string"
          )
          .sort((a, b) => b.monthKey.localeCompare(a.monthKey))[0];
        setReport(latest ?? null);
      } catch {
        if (!cancelled) setReport(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canViewReport, uid]);

  const winRate = useMemo(() => {
    const metric = report?.metrics.find((item) => item.key === "winRate");
    return metric ? `${metric.value.toFixed(1)}%` : "—";
  }, [report]);

  if (!uid) {
    return <Text style={styles.muted}>{isJa ? "ログインが必要です" : "Sign in required"}</Text>;
  }

  if (!canViewReport) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{isJa ? "月次レポート" : "Monthly Report"}</Text>
        <Text style={styles.body}>
          {isMe
            ? isJa
              ? "毎月の成績・強み・ハイライトを振り返れます。"
              : "Review each month with your results, strengths, and highlights."
            : isJa
              ? "この月次レポートは Pro メンバー向けです。"
              : "This monthly report is available to Pro members."}
        </Text>
        {isMe ? (
          <Pressable style={styles.cta} onPress={() => navigation.navigate("ProSubscribe")}>
            <Text style={styles.ctaText}>{isJa ? "Pro を見る" : "Explore Pro"}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (loading) {
    return <Text style={styles.muted}>{isJa ? "レポートを読み込み中…" : "Loading report…"}</Text>;
  }

  if (!report) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{isJa ? "月次レポート" : "Monthly Report"}</Text>
        <Text style={styles.body}>
          {isJa
            ? "最初のレポートは毎月1日に作成されます。"
            : "Your first report is built on the 1st of each month."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>MONTHLY REPORT · {report.monthKey}</Text>
      <Text style={styles.title}>{isJa ? "今月の結果" : "This month"}</Text>
      <View style={styles.metrics}>
        <Metric label={isJa ? "順位" : "Rank"} value={`#${report.rank}`} />
        <Metric label={isJa ? "予想" : "Picks"} value={String(report.totalPosts)} />
        <Metric label={isJa ? "勝率" : "Win %"} value={winRate} />
      </View>
      <Text style={styles.body}>
        {isJa
          ? "詳細な月次レポートは Web 版で確認できます。"
          : "View the complete monthly report on the web."}
      </Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.24)",
    backgroundColor: "rgba(5,8,20,0.62)",
    gap: 10,
  },
  eyebrow: {
    color: "rgba(103,232,249,0.78)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "800",
  },
  body: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 21,
  },
  muted: {
    color: colors.textSecondary,
    fontSize: typography.body,
    paddingVertical: spacing.md,
  },
  metrics: {
    flexDirection: "row",
    gap: 8,
  },
  metric: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    padding: 10,
    gap: 3,
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
  },
  cta: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(34,211,238,0.18)",
    borderColor: "rgba(103,232,249,0.4)",
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
  },
  ctaText: {
    color: "rgba(207,250,254,0.98)",
    fontSize: 14,
    fontWeight: "800",
  },
});
