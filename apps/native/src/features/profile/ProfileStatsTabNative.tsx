/**
 * Web `WebProfileViewV2` の Stats タブ分岐（ProAnalysis / ProPreview / ロック）に相当。
 * フル ProAnalysisView は Web 依存のため、ネイティブでは要約 + Web への導線で補完する。
 */
import { useMemo } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNativeProfileStats } from "./useNativeProfileStats";
import { BlocksPulseLoader } from "../../components/BlocksPulseLoader";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type Props = {
  uid: string | undefined;
  language: "ja" | "en";
  /** 閲覧中プロフィールの Pro 表示（Web の currentIsProView） */
  isProView: boolean;
  myPlan: string | null;
  isMe: boolean;
  isMyPro: boolean;
  isTargetPro: boolean;
  apiBase: string | null;
  handle: string;
};

export default function ProfileStatsTabNative({
  uid,
  language,
  isProView,
  myPlan,
  isMe,
  isMyPro,
  isTargetPro,
  apiBase,
  handle,
}: Props) {
  const isJa = language === "ja";

  // Web と同じ: currentIsProView → 分析; isMe → plan で分岐; 他人は isMyPro && isTargetPro
  const mode: "analysis" | "preview" | "locked" = useMemo(() => {
    if (isProView) return "analysis";
    if (isMe) return myPlan === "pro" ? "analysis" : "preview";
    if (isMyPro && isTargetPro) return "analysis";
    return "locked";
  }, [isProView, isMe, myPlan, isMyPro, isTargetPro]);

  const statsEnabled = mode !== "locked" && !!uid;
  const { loading, summary, error } = useNativeProfileStats(uid, statsEnabled);

  if (!uid) {
    return <Text style={styles.muted}>{isJa ? "ログインが必要です" : "Sign in required"}</Text>;
  }

  if (mode === "locked") {
    return (
      <View style={styles.card}>
        <Text style={styles.body}>
          {isJa ? "対象ユーザーはPro未加入です。" : "This user isn't on the Pro plan."}
        </Text>
      </View>
    );
  }

  if (mode === "preview") {
    return (
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.note}>
          {isJa
            ? "※ この分析は有料プラン限定です"
            : "This analysis is available for paid plans only."}
        </Text>
        {apiBase ? (
          <Pressable
            style={styles.cta}
            onPress={() =>
              void Linking.openURL(`${apiBase}/mobile/pro/subscribe`).catch(() => {})
            }
          >
            <Text style={styles.ctaText}>
              {isJa ? "Proで全データを見る" : "View all Pro data"}
            </Text>
          </Pressable>
        ) : null}
        <Text style={styles.mutedSmall}>
          {isJa
            ? "月次レーダーや詳細は Web のプロフィール「Pro 分析」タブでもご利用いただけます。"
            : "Monthly radar and details are also available in the web app profile tab."}
        </Text>
      </ScrollView>
    );
  }

  // mode === "analysis"
  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>
        {isJa ? "Pro 分析（要約）" : "Pro analysis (summary)"}
      </Text>
      {loading ? (
        <View style={{ marginVertical: 16, alignItems: "center" }}>
          <BlocksPulseLoader />
        </View>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : summary ? (
        <View style={styles.grid}>
          <StatCell label={isJa ? "投稿" : "Posts"} value={String(summary.posts)} />
          <StatCell label={isJa ? "的中" : "Wins"} value={String(summary.wins)} />
          <StatCell
            label={isJa ? "勝率" : "Win rate"}
            value={`${(summary.winRate * 100).toFixed(1)}%`}
          />
          <StatCell
            label={isJa ? "得点計(v3)" : "Points (v3)"}
            value={summary.pointsSumV3.toFixed(1)}
          />
        </View>
      ) : (
        <Text style={styles.muted}>{isJa ? "データがありません" : "No data"}</Text>
      )}
      <Text style={styles.mutedSmall}>
        {isJa
          ? "月次推移・レーダー・スタイル分析などのフル機能は Web 版プロフィールの「Pro 分析」に準じます。"
          : "Full monthly charts, radar, and style analysis match the web profile Pro Stats tab."}
      </Text>
      {apiBase && handle.trim().length > 0 ? (
        <Pressable
          style={styles.linkBtn}
          onPress={() =>
            void Linking.openURL(
              `${apiBase}/mobile/u/${encodeURIComponent(handle.trim())}`
            ).catch(() => {})
          }
        >
          <Text style={styles.linkBtnText}>
            {isJa ? "Web でプロフィールを開く" : "Open profile on web"}
          </Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 520 },
  muted: {
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: 12,
  },
  mutedSmall: {
    color: "rgba(148,163,184,0.85)",
    fontSize: 12,
    marginTop: 14,
    lineHeight: 18,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(5,8,20,0.55)",
  },
  body: {
    color: colors.textPrimary,
    fontSize: typography.body,
    textAlign: "center",
  },
  note: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 10,
  },
  cta: {
    alignSelf: "center",
    backgroundColor: "#f97316",
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginBottom: 16,
  },
  ctaText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
    textAlign: "center",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCell: {
    width: "47%",
    padding: 12,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(5,8,20,0.45)",
  },
  statLabel: { color: colors.textSecondary, fontSize: 11, marginBottom: 4 },
  statValue: { color: colors.textPrimary, fontSize: 18, fontWeight: "700" },
  error: { color: "#fca5a5", fontSize: 13 },
  linkBtn: {
    marginTop: 16,
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.35)",
  },
  linkBtnText: { color: "rgba(103,232,249,0.95)", fontSize: 13, fontWeight: "600" },
});
