/**
 * Web `ProfileCareerPanel` 相当 — 予想者の履歴書（公開）。
 * face + Pro のときは表カードと同じ Pro スキン背景を載せる。
 */
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useReducedMotion } from "react-native-reanimated";
import {
  buildProfileCareerStats,
  formatCareerCount,
  formatCareerRank,
  formatCareerUnitsEarned,
  formatCareerWinRate,
  type ProfileCareerBadgeLike,
  type ProfileCareerStats,
} from "../../../../../lib/profile/profileCareerStats";
import type { ProfilePlanProBgVariant } from "../../../../../lib/profile/profilePlanProBgVariants";
import { PROFILE_PLAN_PRO_BG_DEFAULT } from "../../../../../lib/profile/profilePlanProBgVariants";
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
import CyberNumberNative from "../../ui/CyberNumberNative";

const RAJDHANI = "Rajdhani_600SemiBold";
const OXANIUM = "Oxanium_700Bold";

type CareerRow = { key: string; label: string; value: string };

/** CAREER グリッドの数値 — CyberNumber で角張ったシアン表示 */
function CareerStatValueNative({
  rowKey,
  fallback,
  stats,
}: {
  rowKey: string;
  fallback: string;
  stats: ProfileCareerStats;
}) {
  if (fallback === "—") {
    return <Text style={styles.valueEmpty}>—</Text>;
  }

  if (rowKey === "bestSport") {
    return (
      <Text style={styles.valueSport} numberOfLines={1}>
        {fallback}
      </Text>
    );
  }

  if (rowKey === "predictions" && stats.predictions != null) {
    return (
      <CyberNumberNative value={stats.predictions} size={18} glowIntensity={0.5} />
    );
  }
  if (rowKey === "since" && stats.sinceDate != null) {
    return (
      <CyberNumberNative
        value={stats.sinceDate}
        size={15}
        format={false}
        glowIntensity={0.5}
      />
    );
  }
  if (rowKey === "allTimeRank" && stats.allTimeRank != null) {
    return (
      <CyberNumberNative
        value={stats.allTimeRank}
        prefix="#"
        size={18}
        glowIntensity={0.5}
      />
    );
  }
  if (rowKey === "bestMonthlyRank" && stats.bestMonthlyRank != null) {
    return (
      <CyberNumberNative
        value={stats.bestMonthlyRank}
        prefix="#"
        size={18}
        glowIntensity={0.5}
      />
    );
  }
  if (rowKey === "top10" && stats.top10Finishes != null) {
    return (
      <CyberNumberNative
        value={stats.top10Finishes}
        size={18}
        glowIntensity={0.5}
      />
    );
  }
  if (rowKey === "units" && stats.totalUnitsEarned != null) {
    const n = stats.totalUnitsEarned;
    return (
      <CyberNumberNative
        value={Math.abs(n)}
        cornerSign={n > 0 ? "+" : n < 0 ? "−" : ""}
        size={18}
        glowIntensity={0.5}
      />
    );
  }
  if (rowKey === "winRate" && stats.winRatePct != null) {
    return (
      <CyberNumberNative
        value={stats.winRatePct.toFixed(1)}
        format={false}
        suffix="%"
        size={18}
        glowIntensity={0.5}
      />
    );
  }

  return (
    <Text style={styles.value} numberOfLines={1}>
      {fallback}
    </Text>
  );
}

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
};

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
}: Props) {
  const isJa = language === "ja";
  const isFace = variant === "face";
  const showProSkin = isPro && isFace;
  /** CAREER は通算（ALL）固定。SEASON/PLAYOFF 切替は表側のみ */
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
            allTimeScope: "ALL // TIME",
            desc: "予想者としての履歴書。長期成績は信頼の証明になる。",
            predictions: "Predictions",
            since: "Since",
            allTimeRank: "All-Time Rank",
            bestMonthlyRank: "Best Monthly Rank",
            top10Finishes: "Top 10 Finishes",
            totalUnitsEarned: "Total Units Earned",
            winRate: "Win Rate",
            bestSport: "Best Sport",
            awards: "Awards",
            dossier: "PREDICTOR DOSSIER",
          }
        : {
            title: "CAREER",
            sheetTitle: "CAREER // SHEET",
            allTimeScope: "ALL // TIME",
            desc: "Your résumé as a predictor. Long-term records build trust.",
            predictions: "Predictions",
            since: "Since",
            allTimeRank: "All-Time Rank",
            bestMonthlyRank: "Best Monthly Rank",
            top10Finishes: "Top 10 Finishes",
            totalUnitsEarned: "Total Units Earned",
            winRate: "Win Rate",
            bestSport: "Best Sport",
            awards: "Awards",
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

  const rankLabel = copy.allTimeRank;

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
        value: stats.sinceDate ?? "—",
      },
      {
        key: "allTimeRank",
        label: rankLabel,
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
    [copy, stats, rankLabel]
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
      {isFace ? (
        <View style={styles.scopeHeader}>
          <View style={styles.scopeTitlePress}>
            <Text
              style={[
                styles.scopeTitleText,
                showProSkin ? styles.titlePro : null,
                styles.scopeTitle,
              ]}
              numberOfLines={1}
            >
              {copy.allTimeScope}
            </Text>
          </View>
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
                <View style={styles.valueWrap}>
                  <CareerStatValueNative
                    rowKey={row.key}
                    fallback={row.value}
                    stats={stats}
                  />
                </View>
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
    alignItems: "center",
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
    textAlign: "center",
  },
  value: {
    marginTop: 4,
    fontFamily: OXANIUM,
    fontSize: 16,
    letterSpacing: 0.4,
    color: "rgba(200,247,255,0.95)",
    textAlign: "center",
  },
  valueWrap: {
    marginTop: 4,
    minHeight: 24,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  valueEmpty: {
    fontFamily: OXANIUM,
    fontSize: 17,
    letterSpacing: 1,
    color: "rgba(34,211,238,0.32)",
    textAlign: "center",
  },
  valueSport: {
    fontFamily: OXANIUM,
    fontSize: 16,
    letterSpacing: 1.2,
    color: "rgba(200,247,255,0.95)",
    textAlign: "center",
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
});
