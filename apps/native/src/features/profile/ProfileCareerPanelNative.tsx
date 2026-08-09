/**
 * Web `ProfileCareerPanel` 相当 — 予想者の履歴書（公開）。
 * face + Pro のときは表カードと同じ Pro スキン背景を載せる。
 */
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useReducedMotion } from "react-native-reanimated";
import {
  buildProfileCareerStats,
  formatCareerCount,
  formatCareerRank,
  formatCareerUnitsEarned,
  formatCareerWinRate,
  type ProfileCareerBadgeLike,
} from "../../../../../lib/profile/profileCareerStats";
import type { ProfilePlanProBgVariant } from "../../../../../lib/profile/profilePlanProBgVariants";
import { PROFILE_PLAN_PRO_BG_DEFAULT } from "../../../../../lib/profile/profilePlanProBgVariants";
import {
  getNbaKinetikScopeTitle,
  type ProfileKinetikMetricsPeriod,
} from "../../../../../lib/profile/useNbaKinetikMonthlyStats";
import ProfilePlanProBackgroundNative from "./kinetik/ProfilePlanProBackgroundNative";
import {
  KINETIK_FLIP_EAR,
  ProfileKinetikFlipEarNative,
  ProfileKinetikFlipEarTopEdgesNative,
  useProfileKinetikFlipEar,
} from "./kinetik/ProfileKinetikFlipEarNative";
import ProfileOverviewChartCardNative from "./ProfileOverviewChartCardNative";
import {
  profileOverviewChartSubtitleStyle,
  profileOverviewChartTitleStyle,
} from "./profileOverviewChartShell";

const RAJDHANI = "Rajdhani_600SemiBold";
const OXANIUM = "Oxanium_700Bold";

type Props = {
  language: "ja" | "en";
  posts?: number | null;
  winRate?: number | null;
  totalPointsRank?: number | null;
  totalPointsRankDenominator?: number | null;
  memberSinceMs?: number | null;
  badges?: readonly ProfileCareerBadgeLike[];
  loading?: boolean;
  /** section: overview / face: カード裏面 */
  variant?: "section" | "face";
  isPro?: boolean;
  planProBgVariant?: ProfilePlanProBgVariant;
  metricsPeriod?: ProfileKinetikMetricsPeriod;
  onMetricsPeriodChange?: (period: ProfileKinetikMetricsPeriod) => void;
  seasonKey?: string | null;
};

type CareerRow = { key: string; label: string; value: string };

export default function ProfileCareerPanelNative({
  language,
  posts = null,
  winRate = null,
  totalPointsRank = null,
  totalPointsRankDenominator = null,
  memberSinceMs = null,
  badges = [],
  loading = false,
  variant = "section",
  isPro = false,
  planProBgVariant = PROFILE_PLAN_PRO_BG_DEFAULT,
  metricsPeriod = "season",
  onMetricsPeriodChange,
  seasonKey = null,
}: Props) {
  const isJa = language === "ja";
  const isFace = variant === "face";
  const showProSkin = isPro && isFace;
  const showPeriodSwitcher = isFace && !!onMetricsPeriodChange;
  const reduceMotion = useReducedMotion() === true;
  const flipEar = useProfileKinetikFlipEar();
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const faceBorder = showProSkin
    ? "rgba(34,211,238,0.35)"
    : "rgba(103,232,249,0.2)";

  const copy = useMemo(
    () =>
      isJa
        ? {
            title: "CAREER",
            sheetTitle: "CAREER // SHEET",
            desc: "予想者としての履歴書。長期成績は信頼の証明になる。",
            predictions: "Predictions",
            since: "Since",
            seasonRank: "Season Rank",
            playoffRank: "Playoff Rank",
            bestMonthlyRank: "Best Monthly Rank",
            top10Finishes: "Top 10 Finishes",
            totalUnitsEarned: "Total Units Earned",
            winRate: "Win Rate",
            bestSport: "Best Sport",
            awards: "Awards",
            seasonAllTime: "All-Time",
            seasonSoon: "シーズン切替は準備中",
            dossier: "PREDICTOR DOSSIER",
          }
        : {
            title: "CAREER",
            sheetTitle: "CAREER // SHEET",
            desc: "Your résumé as a predictor. Long-term records build trust.",
            predictions: "Predictions",
            since: "Since",
            seasonRank: "Season Rank",
            playoffRank: "Playoff Rank",
            bestMonthlyRank: "Best Monthly Rank",
            top10Finishes: "Top 10 Finishes",
            totalUnitsEarned: "Total Units Earned",
            winRate: "Win Rate",
            bestSport: "Best Sport",
            awards: "Awards",
            seasonAllTime: "All-Time",
            seasonSoon: "Season switch coming soon",
            dossier: "PREDICTOR DOSSIER",
          },
    [isJa]
  );

  const stats = useMemo(
    () =>
      buildProfileCareerStats({
        language,
        posts,
        winRate,
        totalPointsRank,
        totalPointsRankDenominator,
        memberSinceMs,
        badges,
      }),
    [
      language,
      posts,
      winRate,
      totalPointsRank,
      totalPointsRankDenominator,
      memberSinceMs,
      badges,
    ]
  );

  const scopeTitle = getNbaKinetikScopeTitle(
    metricsPeriod,
    seasonKey ?? undefined
  );
  const rankLabel =
    metricsPeriod === "playoffs" ? copy.playoffRank : copy.seasonRank;

  const togglePeriod = () => {
    onMetricsPeriodChange?.(
      metricsPeriod === "season" ? "playoffs" : "season"
    );
  };

  const rows: CareerRow[] = useMemo(
    () => [
      {
        key: "predictions",
        label: copy.predictions,
        value: formatCareerCount(stats.predictions),
      },
      {
        key: "since",
        label: copy.since,
        value: stats.sinceYear != null ? String(stats.sinceYear) : "—",
      },
      {
        key: "allTimeRank",
        label: showPeriodSwitcher ? rankLabel : copy.seasonRank,
        value: formatCareerRank(stats.allTimeRank),
      },
      {
        key: "bestMonthlyRank",
        label: copy.bestMonthlyRank,
        value: formatCareerRank(stats.bestMonthlyRank),
      },
      {
        key: "top10",
        label: copy.top10Finishes,
        value: formatCareerCount(stats.top10Finishes),
      },
      {
        key: "units",
        label: copy.totalUnitsEarned,
        value: formatCareerUnitsEarned(stats.totalUnitsEarned),
      },
      {
        key: "winRate",
        label: copy.winRate,
        value: formatCareerWinRate(stats.winRatePct),
      },
      {
        key: "bestSport",
        label: copy.bestSport,
        value: stats.bestSport ?? "—",
      },
    ],
    [copy, stats, showPeriodSwitcher, rankLabel]
  );

  const content = (
    <>
      {isFace ? (
        <View style={styles.sheetTitleWrap}>
          <Text style={styles.sheetTitle} numberOfLines={1}>
            {copy.sheetTitle}
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.dossier}>{copy.dossier}</Text>
          <Text
            style={[
              profileOverviewChartTitleStyle,
              showProSkin ? styles.titlePro : null,
            ]}
          >
            {copy.title}
          </Text>
          <View
            style={[styles.titleRule, showProSkin ? styles.titleRulePro : null]}
          />
        </>
      )}
      {showPeriodSwitcher ? (
        <View style={styles.scopeHeader}>
          <Pressable
            style={[styles.scopeNavBtn, styles.scopeNavBtnLeft]}
            onPress={togglePeriod}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isJa ? "前の統計ボード" : "Previous stats board"}
          >
            <View
              style={[
                styles.scopeArrow,
                styles.scopeArrowLeft,
                showProSkin ? styles.scopeArrowPro : null,
              ]}
            />
          </Pressable>
          <Pressable
            style={styles.scopeTitlePress}
            onPress={togglePeriod}
            accessibilityRole="button"
            accessibilityLabel={
              isJa ? "SEASON / PLAYOFF を切り替え" : "Switch Season / Playoff"
            }
          >
            <Text
              style={[
                styles.scopeTitleText,
                showProSkin ? styles.titlePro : null,
                styles.scopeTitle,
              ]}
              numberOfLines={1}
            >
              {scopeTitle}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.scopeNavBtn, styles.scopeNavBtnRight]}
            onPress={togglePeriod}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isJa ? "次の統計ボード" : "Next stats board"}
          >
            <View
              style={[
                styles.scopeArrow,
                styles.scopeArrowRight,
                showProSkin ? styles.scopeArrowPro : null,
              ]}
            />
          </Pressable>
        </View>
      ) : null}
      {!isFace ? (
        <>
          <View
            style={[styles.titleRule, showProSkin ? styles.titleRulePro : null]}
          />
          <Text style={[profileOverviewChartSubtitleStyle, styles.desc]}>
            {copy.desc}
          </Text>
        </>
      ) : null}

      {loading ? (
        <View style={styles.skeleton} />
      ) : (
        <>
          <View style={styles.grid}>
            {rows.map((row) => (
              <View
                key={row.key}
                style={[styles.cell, showProSkin ? styles.cellPro : null]}
              >
                <Text style={styles.label}>{row.label}</Text>
                <Text
                  style={[styles.value, showProSkin ? styles.valuePro : null]}
                  numberOfLines={1}
                >
                  {row.value}
                </Text>
              </View>
            ))}
          </View>

          <Text style={[styles.label, styles.awardsLabel]}>{copy.awards}</Text>
          {stats.awards.length === 0 ? (
            <Text style={styles.emptyAward}>—</Text>
          ) : (
            <View style={styles.awardRow}>
              {stats.awards.map((award) => (
                <View
                  key={award.key}
                  style={[
                    styles.awardChip,
                    showProSkin ? styles.awardChipPro : null,
                  ]}
                >
                  <Text style={styles.awardChipText}>
                    {award.label}
                    {award.count > 1 ? ` ×${award.count}` : ""}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {!isFace ? (
            <View style={styles.seasonRow}>
              {stats.seasonOptions.map((opt) => {
                const active = stats.seasonKey === opt;
                const label = opt === "all-time" ? copy.seasonAllTime : opt;
                return (
                  <View
                    key={opt}
                    style={[
                      styles.seasonPill,
                      active ? styles.seasonPillActive : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.seasonPillText,
                        active ? styles.seasonPillTextActive : null,
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                );
              })}
              <Text style={styles.seasonSoon}>{copy.seasonSoon}</Text>
            </View>
          ) : null}
        </>
      )}
    </>
  );

  if (isFace) {
    return (
      <View
        style={[
          styles.faceShell,
          flipEar ? { paddingTop: KINETIK_FLIP_EAR.lip } : null,
        ]}
      >
        {flipEar ? <ProfileKinetikFlipEarNative /> : null}
        <View
          style={[
            styles.faceRoot,
            showProSkin ? styles.faceRootPro : styles.faceRootFree,
            flipEar ? styles.faceRootNotched : null,
          ]}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setFrameSize({ width, height });
          }}
        >
          {flipEar ? (
            <ProfileKinetikFlipEarTopEdgesNative borderColor={faceBorder} />
          ) : null}
          {showProSkin && frameSize.width > 0 && frameSize.height > 0 ? (
            <ProfilePlanProBackgroundNative
              width={frameSize.width}
              height={frameSize.height}
              animate={!reduceMotion}
              variant={planProBgVariant}
              accentReady
            />
          ) : null}
          {showProSkin ? (
            <LinearGradient
              colors={[
                "rgba(34,211,238,0.1)",
                "rgba(34,211,238,0.02)",
                "transparent",
                "rgba(167,139,250,0.05)",
              ]}
              locations={[0, 0.28, 0.62, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.proAmbient}
              pointerEvents="none"
            />
          ) : null}
          <View style={styles.faceContent}>{content}</View>
        </View>
      </View>
    );
  }

  return (
    <ProfileOverviewChartCardNative>{content}</ProfileOverviewChartCardNative>
  );
}

const styles = StyleSheet.create({
  faceShell: {
    flex: 1,
    alignSelf: "stretch",
    position: "relative",
  },
  faceRoot: {
    flex: 1,
    alignSelf: "stretch",
    overflow: "hidden",
    borderRadius: 4,
    borderWidth: 1,
    padding: 12,
  },
  faceRootNotched: {
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  faceRootFree: {
    borderColor: "rgba(103,232,249,0.2)",
    backgroundColor: "rgba(6,16,24,0.96)",
  },
  faceRootPro: {
    borderColor: "rgba(34,211,238,0.35)",
    backgroundColor: "rgba(3,8,13,0.2)",
    shadowColor: "#22d3ee",
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  proAmbient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  faceContent: {
    position: "relative",
    zIndex: 3,
    flex: 1,
  },
  scopeHeader: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  scopeNavBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  scopeNavBtnLeft: {
    marginRight: 2,
  },
  scopeNavBtnRight: {
    marginLeft: 2,
  },
  scopeTitlePress: {
    flexShrink: 1,
    minWidth: 0,
    paddingHorizontal: 4,
  },
  scopeTitle: {
    textAlign: "center",
  },
  scopeArrow: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  scopeArrowLeft: {
    borderRightWidth: 8,
    borderRightColor: "#00f5ff",
  },
  scopeArrowRight: {
    borderLeftWidth: 8,
    borderLeftColor: "#00f5ff",
  },
  scopeArrowPro: {
    borderRightColor: "#67e8f9",
    borderLeftColor: "#67e8f9",
  },
  dossier: {
    fontFamily: RAJDHANI,
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: "rgba(165,243,252,0.7)",
  },
  sheetTitleWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    marginBottom: 2,
  },
  sheetTitle: {
    width: "100%",
    fontFamily: OXANIUM,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    textAlign: "center",
    color: "rgba(255,255,255,0.78)",
  },
  scopeTitleText: {
    fontFamily: RAJDHANI,
    fontSize: 16,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    fontWeight: "600",
    color: "rgba(255,255,255,0.95)",
  },
  titlePro: {
    textShadowColor: "rgba(34,211,238,0.35)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  titleRule: {
    marginTop: 6,
    width: 56,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  titleRulePro: {
    backgroundColor: "rgba(103,232,249,0.75)",
  },
  desc: {
    marginTop: 8,
    color: "rgba(203,213,225,0.8)",
  },
  skeleton: {
    marginTop: 14,
    height: 140,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  grid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 8,
    rowGap: 8,
  },
  cell: {
    width: "48%",
    minWidth: "47%",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 0,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cellPro: {
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  label: {
    fontFamily: RAJDHANI,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
  },
  value: {
    marginTop: 4,
    fontFamily: OXANIUM,
    fontSize: 16,
    letterSpacing: 0.4,
    color: "rgba(255,255,255,0.9)",
  },
  valuePro: {
    textShadowRadius: 0,
    textShadowColor: "transparent",
  },
  awardsLabel: {
    marginTop: 18,
    color: "rgba(255,255,255,0.4)",
  },
  emptyAward: {
    marginTop: 6,
    fontSize: 14,
    color: "rgba(255,255,255,0.35)",
  },
  awardRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  awardChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  awardChipPro: {
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  awardChipText: {
    fontFamily: RAJDHANI,
    fontSize: 11,
    letterSpacing: 0.4,
    color: "rgba(255,255,255,0.8)",
  },
  seasonRow: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  seasonPill: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  seasonPillActive: {
    borderColor: "rgba(103,232,249,0.45)",
    backgroundColor: "rgba(34,211,238,0.15)",
  },
  seasonPillText: {
    fontFamily: RAJDHANI,
    fontSize: 11,
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.35)",
  },
  seasonPillTextActive: {
    color: "rgba(236,254,255,0.95)",
  },
  seasonSoon: {
    marginLeft: 4,
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
  },
});
