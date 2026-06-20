/**
 * Web `WebProfileViewV2` の Stats タブ分岐 + ProAnalysis 相当（ネイティブ UI）。
 */
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNativeProfileStats } from "./useNativeProfileStats";
import { useNativeStreakTracker } from "./useNativeStreakTracker";
import {
  currentMonthKey,
  previousMonthKey,
  useNativeProfileMonthlyStats,
} from "./useNativeProfileMonthlyStats";
import {
  extractPointsSumBenchmarks,
  useNativeMonthlyGlobalStats,
} from "./useNativeMonthlyGlobalStats";
import ProfileSummaryGridNative from "./ProfileSummaryGridNative";
import ProfileDailyTrendChartNative from "./ProfileDailyTrendChartNative";
import ProfileRankTrendChartNative from "./ProfileRankTrendChartNative";
import ProfileStreakTrackerNative from "./ProfileStreakTrackerNative";
import ProfileRadarChartNative from "./ProfileRadarChartNative";
import { useNativeProfileMonthlyList } from "./useNativeProfileMonthlyList";
import {
  ProfileHomeAwayCardNative,
  ProfileMarketBiasCardNative,
} from "./ProfileProMonthlyCardsNative";
import ProfileTeamAffinityCardNative from "./ProfileTeamAffinityCardNative";
import ProfileAnalysisStyleMapNative from "./ProfileAnalysisStyleMapNative";
import ProfilePrevMonthSummaryNative from "./ProfilePrevMonthSummaryNative";
import {
  buildStyleMapPoint,
  normalizeTeamAffinityRows,
} from "./profileAnalysisUtils";
import { BlocksPulseLoader } from "../../components/BlocksPulseLoader";
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
  const isJa = language === "ja";
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  const mode: "analysis" | "preview" | "locked" = useMemo(() => {
    if (isProView) return "analysis";
    if (isMe) return myPlan === "pro" ? "analysis" : "preview";
    if (isMyPro && isTargetPro) return "analysis";
    return "locked";
  }, [isProView, isMe, myPlan, isMyPro, isTargetPro]);

  const statsEnabled = mode !== "locked" && !!uid;
  const statsBundle = useNativeProfileStats(uid, statsEnabled);
  const streakBundle = useNativeStreakTracker(uid, statsEnabled);

  const { months: monthlyMonths, loading: monthsLoading } = useNativeProfileMonthlyList(
    statsEnabled ? uid : undefined
  );
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const activeMonth = useMemo(() => {
    if (selectedMonth) return selectedMonth;
    if (monthlyMonths.length > 0) return monthlyMonths[monthlyMonths.length - 1]!;
    return currentMonthKey();
  }, [selectedMonth, monthlyMonths]);
  const prevMonth = previousMonthKey(activeMonth);
  const prevPrevMonth = prevMonth ? previousMonthKey(prevMonth) : undefined;
  const monthly = useNativeProfileMonthlyStats(
    uid,
    statsEnabled ? activeMonth : undefined,
    prevMonth,
    prevPrevMonth
  );

  const [proSummaryGridLayout] = useState(isProView || myPlan === "pro");

  const maxStreak = useMemo(() => {
    const st = statsBundle.stats as Record<string, unknown> | null;
    if (st != null) {
      const raw = st.maxWinStreak;
      const legacy = st.maxStreak;
      const v = Number(raw ?? legacy);
      if (Number.isFinite(v)) return Math.max(0, Math.floor(v));
    }
    return 0;
  }, [statsBundle.stats]);

  const homeAwayPayload = useMemo(() => {
    const homeAway = monthly.stats?.homeAway as
      | {
          home?: { winRate?: number; posts?: number };
          away?: { winRate?: number; posts?: number };
        }
      | undefined;
    if (!homeAway) return null;
    const hPosts = homeAway.home?.posts ?? 0;
    const aPosts = homeAway.away?.posts ?? 0;
    const pickTot = hPosts + aPosts;
    return {
      homeRate: Number(homeAway.home?.winRate ?? 0),
      awayRate: Number(homeAway.away?.winRate ?? 0),
      homeShare: pickTot > 0 ? hPosts / pickTot : 0.5,
      awayShare: pickTot > 0 ? aPosts / pickTot : 0.5,
    };
  }, [monthly.stats]);

  const marketBiasPayload = useMemo(() => {
    const marketBiasRaw = monthly.stats?.marketBias as
      | {
          favoriteWinRate?: number;
          underdogWinRate?: number;
          favoritePickCount?: number;
          underdogPickCount?: number;
        }
      | undefined;
    if (!marketBiasRaw) return null;
    const favCt = marketBiasRaw.favoritePickCount ?? 0;
    const undCt = marketBiasRaw.underdogPickCount ?? 0;
    const mTot = favCt + undCt;
    return {
      favorableWinRate: Number(marketBiasRaw.favoriteWinRate ?? 0),
      contrarianWinRate: Number(marketBiasRaw.underdogWinRate ?? 0),
      favorableShare: mTot > 0 ? favCt / mTot : 0.5,
      contrarianShare: mTot > 0 ? undCt / mTot : 0.5,
    };
  }, [monthly.stats]);

  const teamAffinity = useMemo(() => {
    const teamStats = monthly.stats?.teamStats as
      | { strong?: unknown; weak?: unknown }
      | undefined;
    if (!teamStats) return null;
    return {
      strong: normalizeTeamAffinityRows(teamStats.strong),
      weak: normalizeTeamAffinityRows(teamStats.weak),
    };
  }, [monthly.stats]);

  const styleMapPoint = useMemo(
    () => buildStyleMapPoint(monthly.stats, activeMonth),
    [monthly.stats, activeMonth]
  );

  const prevMonthSummary = useMemo(() => {
    if (prevMonth && monthly.prevStats) {
      return {
        monthKey: prevMonth,
        stats: monthly.prevStats,
        olderStats: monthly.prevPrevStats ?? null,
      };
    }
    if (monthly.stats) {
      return {
        monthKey: activeMonth,
        stats: monthly.stats,
        olderStats: monthly.prevStats ?? null,
      };
    }
    return null;
  }, [prevMonth, monthly.prevStats, monthly.prevPrevStats, monthly.stats, activeMonth]);

  const summaryBenchmarkMonth = prevMonthSummary?.monthKey;
  const globalMonthly = useNativeMonthlyGlobalStats(
    statsEnabled ? summaryBenchmarkMonth : undefined
  );
  const summaryBenchmarks = useMemo(
    () => extractPointsSumBenchmarks(globalMonthly.data),
    [globalMonthly.data]
  );

  const monthlyRadar = monthly.stats?.radar10 as Record<string, unknown> | undefined;
  const monthlyPosts =
    typeof monthly.stats?.posts === "number" ? monthly.stats.posts : null;

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
        <Pressable style={styles.cta} onPress={() => navigation.navigate("ProSubscribe")}>
          <Text style={styles.ctaText}>
            {isJa ? "Proで全データを見る" : "View all Pro data"}
          </Text>
        </Pressable>
        {statsBundle.summary ? (
          <View style={styles.gridWrap}>
            <ProfileSummaryGridNative
              summary={statsBundle.summary}
              ranks={statsBundle.summaryRanks}
              maxStreak={maxStreak}
              language={language}
              proOverviewLayout={false}
            />
          </View>
        ) : null}
      </ScrollView>
    );
  }

  if ((statsBundle.loading && !statsBundle.summary) || !statsBundle.summary) {
    return (
      <View style={styles.inlineLoading}>
        <BlocksPulseLoader />
      </View>
    );
  }

  if (statsBundle.error) {
    return <Text style={styles.error}>{statsBundle.error}</Text>;
  }

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{isJa ? "Pro 分析" : "Pro analysis"}</Text>

      <Text style={styles.sectionLabel}>{isJa ? "プレーオフ総合" : "Playoffs overall"}</Text>
      <View style={styles.gridWrap}>
        <ProfileSummaryGridNative
          summary={statsBundle.summary}
          ranks={statsBundle.summaryRanks}
          maxStreak={maxStreak}
          language={language}
          proOverviewLayout={proSummaryGridLayout}
        />
      </View>

      <View style={styles.chartGap} />
      <ProfileDailyTrendChartNative
        data={statsBundle.dailyTrend}
        language={language}
        allowAll
      />

      <View style={styles.chartGap} />
      <ProfileRankTrendChartNative
        data={statsBundle.rankTrend}
        loading={false}
        language={language}
      />

      <View style={styles.chartGap} />
      <ProfileStreakTrackerNative
        points={streakBundle.points}
        loading={streakBundle.loading}
        language={language}
      />

      <View style={styles.chartGap} />
      <Text style={styles.sectionLabel}>{isJa ? "月次分析" : "Monthly analysis"}</Text>
      {monthsLoading ? (
        <View style={styles.inlineLoading}>
          <BlocksPulseLoader pixelScale={0.85} />
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthStrip}>
          {(monthlyMonths.length > 0 ? monthlyMonths : [activeMonth]).map((m) => (
            <Pressable
              key={m}
              style={[styles.monthChip, m === activeMonth && styles.monthChipActive]}
              onPress={() => setSelectedMonth(m)}
            >
              <Text style={[styles.monthChipText, m === activeMonth && styles.monthChipTextActive]}>
                {m}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {monthly.loading ? (
        <View style={styles.inlineLoading}>
          <BlocksPulseLoader pixelScale={0.85} />
        </View>
      ) : monthly.stats ? (
        <View style={styles.monthlyCard}>
          {prevMonthSummary ? (
            <ProfilePrevMonthSummaryNative
              language={language}
              monthKey={prevMonthSummary.monthKey}
              stats={prevMonthSummary.stats}
              olderStats={prevMonthSummary.olderStats}
              pointsSumBenchmarks={summaryBenchmarks}
            />
          ) : null}
          {monthlyPosts != null ? (
            <StatRow label={isJa ? "投稿" : "Posts"} value={String(monthlyPosts)} />
          ) : null}
          {monthlyRadar ? (
            <>
              <ProfileRadarChartNative
                language={language}
                values={{
                  winRate: Number(monthlyRadar.winRate ?? 0),
                  precision: Number(monthlyRadar.precision ?? 0),
                  upset: Number(monthlyRadar.upset ?? 0),
                  volume: Number(monthlyRadar.volume ?? 0),
                  streak: Number(monthlyRadar.streak ?? 0),
                }}
              />
              {styleMapPoint ? (
                <ProfileAnalysisStyleMapNative points={[styleMapPoint]} language={language} />
              ) : null}
              {homeAwayPayload ? (
                <ProfileHomeAwayCardNative language={language} {...homeAwayPayload} />
              ) : null}
              {marketBiasPayload ? (
                <ProfileMarketBiasCardNative language={language} {...marketBiasPayload} />
              ) : null}
              {teamAffinity ? (
                <ProfileTeamAffinityCardNative
                  language={language}
                  strong={teamAffinity.strong}
                  weak={teamAffinity.weak}
                />
              ) : null}
            </>
          ) : (
            <Text style={styles.mutedSmall}>
              {isJa ? "月次データがありません" : "No monthly data"}
            </Text>
          )}
        </View>
      ) : (
        <Text style={styles.mutedSmall}>
          {isJa ? "月次データがありません" : "No monthly data"}
        </Text>
      )}
    </ScrollView>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 720 },
  inlineLoading: { marginVertical: 16, alignItems: "center" },
  muted: {
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: 12,
  },
  mutedSmall: {
    color: "rgba(148,163,184,0.85)",
    fontSize: 12,
    marginTop: 8,
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
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  gridWrap: { marginBottom: 4 },
  chartGap: { height: 16 },
  monthlyCard: {
    padding: 12,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(5,8,20,0.45)",
    gap: 8,
  },
  monthStrip: { marginBottom: 8, maxHeight: 40 },
  monthChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginRight: 8,
  },
  monthChipActive: {
    borderColor: "rgba(103,232,249,0.45)",
    backgroundColor: "rgba(103,232,249,0.12)",
  },
  monthChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: "600" },
  monthChipTextActive: { color: colors.textPrimary },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: { color: colors.textSecondary, fontSize: 13 },
  statValue: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  error: { color: "#fca5a5", fontSize: 13 },
});
