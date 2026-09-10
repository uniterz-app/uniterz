import { useCallback, useEffect, useRef, useState } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import { StyleSheet, Text, View } from "react-native";
import type { MyRankMiniMetric } from "../../../../../app/component/rankings/MyRankCard";
import type { MobileMetric } from "../../../../../lib/rankings/rankingMetrics";
import type { RankTierGapHint } from "../../../../../lib/rankings/rankTierMilestone";
import type { EstimatedPeriodUnits } from "../../../../../lib/rankings/estimatePeriodRankingUnits";
import { periodRankingUnitMetricLabel } from "../../../../../lib/units/periodRankingUnitRewards";
import {
  resolveMyRankProgressSnapshotLimit,
  type MyRankProgressPoint,
} from "../../../../../lib/rankings/myRankRankingProgress";
import MyRankRankingProgressNative from "./MyRankRankingProgressNative";
import {
  deriveMyRankListAvgRow,
  type MyRankStatsSource,
} from "../../../../../lib/rankings/myRankCardFocus";
import { L, resolveLocalizedLang } from "../../../../../lib/i18n/localize";
import { rankingsTexts, type RankingsLanguage } from "./rankingsTexts";
import { CyberRankingListRowNative } from "./CyberRankingListRowNative";
import { MyRankCardFrameNative, resolveMyRankFrameTone } from "./MyRankCardFrameNative";
import { rankingsUiStyles as styles } from "./rankingsUiStyles";
import { shareMyRankCardNative } from "./shareRankCardNative";
import ShareLinkCaptureFooterNative from "../share/ShareLinkCaptureFooterNative";
import { buildRankingsShareUrl, getShareAppOrigin } from "../../../../../lib/share/shareAppUrls";

export type MyRankCardShareState = {
  canShare: boolean;
  sharing: boolean;
  share: () => void;
};

export function MyRankCardNative({
  rank,
  metric,
  value,
  displayName,
  photoURL,
  uid = null,
  handle = null,
  totalPosts,
  totalEntries,
  loading,
  statsScramble,
  isPro,
  displayTier,
  rankDeltaPlaces,
  language,
  miniMetrics,
  statsSource,
  leagueLabel,
  mobileWide = false,
  cardResetKey,
  onShareStateChange,
  rankTierGap = null,
  rankProgress,
  rankProgressLoading = false,
  hideRankProgress = false,
  estimatedUnits = null,
}: {
  rank: number | null;
  metric: MobileMetric;
  value: number;
  displayName: string;
  photoURL?: string | null;
  uid?: string | null;
  handle?: string | null;
  totalPosts?: number;
  totalEntries?: number | null;
  loading?: boolean;
  statsScramble?: boolean;
  isPro?: boolean;
  /** Web `displayTier` — Free / Pro UI ゲート */
  displayTier?: "free" | "pro";
  rankDeltaPlaces?: number | null;
  language: RankingsLanguage;
  miniMetrics?: MyRankMiniMetric[];
  statsSource?: MyRankStatsSource | null;
  leagueLabel?: string | null;
  /** Web `cardResetKey` — 互換のため残す（未使用） */
  cardResetKey?: string;
  /** Web `mobileWide` — 親 padding 内でカード幅をリストと揃える */
  mobileWide?: boolean;
  onShareStateChange?: (state: MyRankCardShareState) => void;
  /** Pro のみ — 次順位帯までの総合得点差（totalScore タブ時） */
  rankTierGap?: RankTierGapHint | null;
  rankProgress?: MyRankProgressPoint[] | null;
  rankProgressLoading?: boolean;
  hideRankProgress?: boolean;
  estimatedUnits?: EstimatedPeriodUnits | null;
}) {
  const t = rankingsTexts(language);
  const freeTier = displayTier === "free";
  const proTier = displayTier === "pro";
  const showProBadge = Boolean(isPro) && !freeTier;
  const frameTone = resolveMyRankFrameTone(
    displayTier != null ? null : rankDeltaPlaces
  );
  const statsPending = !!statsScramble;
  void miniMetrics;
  void rankTierGap;
  void uid;
  void handle;

  const posts =
    typeof totalPosts === "number" ? totalPosts : (statsSource?.totalPosts ?? 0);
  const avgRow = deriveMyRankListAvgRow(statsSource);

  const showRankingProgress =
    !freeTier &&
    !hideRankProgress &&
    metric === "totalScore" &&
    (displayTier != null || rankProgress !== undefined);
  const showEstimatedUnits =
    proTier && estimatedUnits != null && !loading && !statsPending;
  const progressSnapshotLimit = resolveMyRankProgressSnapshotLimit({
    displayTier,
    isPro,
  });
  const progressPoints = rankProgress ?? [];
  const loc = resolveLocalizedLang(language);
  const estimatedUnitsLabel = L(loc, {
    ja: "推定獲得 UNIT",
    en: "EST. UNITS",
    ko: "예상 UNIT",
    zh: "预计 UNIT",
    es: "UNIT EST.",
    pt: "UNIT EST.",
    fr: "UNIT EST.",
  });
  const estimatedUnitsHint =
    estimatedUnits?.period === "monthly"
      ? L(loc, {
          ja: "4指標合計（総合・勝率・Upset・得点者）· 現順位ベース",
          en: "Sum of 4 metrics · current ranks · final after period ends",
          ko: "4지표 합계 · 현재 순위 기준 · 기간 종료 후 확정",
          zh: "四项合计 · 按当前排名 · 周期结束后结算",
          es: "Suma de 4 métricas · rangos actuales · final al cerrar el periodo",
          pt: "Soma de 4 métricas · ranks atuais · final após o período",
          fr: "Somme de 4 métriques · rangs actuels · final en fin de période",
        })
      : L(loc, {
          ja: "現順位ベース · 期間確定後に付与",
          en: "Based on current ranks · final after period ends",
          ko: "현재 순위 기준 · 기간 종료 후 지급",
          zh: "按当前排名 · 周期结束后发放",
          es: "Según rangos actuales · final al cerrar el periodo",
          pt: "Com base nos ranks atuais · final após o período",
          fr: "Selon les rangs actuels · final en fin de période",
        });
  const estimatedBreakdown =
    estimatedUnits && estimatedUnits.lines.length > 0
      ? estimatedUnits.lines
          .map((line) => {
            const label = periodRankingUnitMetricLabel(
              line.metric,
              loc === "ja" ? "ja" : "en"
            );
            return `${label} #${line.rank} +${line.units}`;
          })
          .join(" · ")
      : estimatedUnits?.period === "monthly"
        ? L(loc, {
            ja: "総合 + 勝率 + Upset + 得点者",
            en: "Overall + Win% + Upset + Scorer",
            ko: "종합 + 승률 + Upset + 득점자",
            zh: "总分 + 胜率 + Upset + 得分手",
            es: "General + Win% + Upset + Scorer",
            pt: "Geral + Win% + Upset + Scorer",
            fr: "Global + Win% + Upset + Scorer",
          })
        : null;

  const [sharing, setSharing] = useState(false);
  const captureRef = useRef<View>(null);

  const canShare = !loading && !statsPending && rank != null && !sharing;
  const shareLinkUrl = buildRankingsShareUrl();

  const handleShare = useCallback(async () => {
    if (!canShare) return;
    setSharing(true);
    try {
      const result = await shareMyRankCardNative(captureRef, {
        language: loc === "ja" ? "ja" : "en",
        rank,
        leagueLabel,
        totalEntries,
        appBaseUrl: getShareAppOrigin(),
      });
      if (result === "failed") {
        cyberAlert("", t.shareRankCardFailed);
      }
    } finally {
      setSharing(false);
    }
  }, [canShare, loc, leagueLabel, rank, t.shareRankCardFailed, totalEntries]);

  useEffect(() => {
    onShareStateChange?.({
      canShare: freeTier ? false : canShare,
      sharing,
      share: () => void handleShare(),
    });
  }, [canShare, sharing, handleShare, onShareStateChange, freeTier]);

  if (loading || statsPending) {
    return null;
  }

  if (freeTier) {
    const listRank = rank != null && rank >= 1 ? rank : 99;
    return (
      <View style={[styles.myRankOuter, mobileWide ? styles.myRankOuterWide : null]}>
        <MyRankCardFrameNative
          tone="neutral"
          hideLeftEdge
          animateDraw
          drawKey={cardResetKey}
        >
          <View style={styles.myRankFreeBody}>
            <CyberRankingListRowNative
              rank={listRank}
              displayName={displayName.trim() || "?"}
              photoURL={photoURL}
              metric={metric}
              counted={value}
              posts={posts}
              avgRow={avgRow}
              language={language}
              isPro={false}
              rankDeltaPlaces={null}
              hideAccentBar
              rankOverline={t.yourRank}
              plainWhiteScore
            />
          </View>
        </MyRankCardFrameNative>
      </View>
    );
  }

  return (
    <View style={[styles.myRankOuter, mobileWide ? styles.myRankOuterWide : null]}>
      <View style={styles.myRankCaptureWrap}>
        <View ref={captureRef} collapsable={false}>
          <MyRankCardFrameNative
            tone={frameTone}
            proSpec={proTier}
            animateDraw
            drawKey={cardResetKey}
          >
            {/* 上段: リスト行と同じ配置 / 下段: Pro 専用 */}
            <View style={styles.myRankProStack}>
                <CyberRankingListRowNative
                  rank={rank != null && rank >= 1 ? rank : 99}
                  displayName={displayName.trim() || "?"}
                  photoURL={photoURL}
                  metric={metric}
                  counted={value}
                  posts={posts}
                  avgRow={avgRow}
                  language={language}
                  isPro={showProBadge}
                  rankDeltaPlaces={
                    typeof rankDeltaPlaces === "number" &&
                    Number.isFinite(rankDeltaPlaces)
                      ? rankDeltaPlaces
                      : 0
                  }
                  hideAccentBar
                  bare
                  rankDisplayValue={
                    rank != null && rank >= 1 ? undefined : "--"
                  }
                  rankMuted={!(rank != null && rank >= 1)}
                  plainWhiteScore={!(rank != null && rank >= 1)}
                />

              {showRankingProgress ? (
                <View style={styles.myRankProProgressBand}>
                  <MyRankRankingProgressNative
                    points={progressPoints}
                    maxSnapshots={progressSnapshotLimit}
                    loading={rankProgressLoading}
                    language={language === "ja" ? "ja" : "en"}
                    emptyHint={t.rankingProgressNoData}
                    numbersOnly
                    dense
                  />
                </View>
              ) : null}

              {showEstimatedUnits && estimatedUnits ? (
                <View style={myRankLocalStyles.estUnitsBand}>
                  <View style={myRankLocalStyles.estUnitsRow}>
                    <View style={myRankLocalStyles.estUnitsLeft}>
                      <Text style={myRankLocalStyles.estUnitsLabel}>
                        {estimatedUnitsLabel}
                      </Text>
                      {estimatedBreakdown ? (
                        <Text style={myRankLocalStyles.estUnitsBreakdown} numberOfLines={2}>
                          {estimatedBreakdown}
                        </Text>
                      ) : null}
                      <Text style={myRankLocalStyles.estUnitsHint}>{estimatedUnitsHint}</Text>
                    </View>
                    <View style={myRankLocalStyles.estUnitsValueRow}>
                      <Text style={myRankLocalStyles.estUnitsValue}>
                        +{estimatedUnits.total.toLocaleString("en-US")}
                      </Text>
                      <Text style={myRankLocalStyles.estUnitsUnit}>Unit</Text>
                    </View>
                  </View>
                </View>
              ) : null}
            </View>

            <ShareLinkCaptureFooterNative url={shareLinkUrl} visible={sharing} />
          </MyRankCardFrameNative>
        </View>
      </View>
    </View>
  );
}

const myRankLocalStyles = StyleSheet.create({
  estUnitsBand: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  estUnitsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  estUnitsLeft: {
    flex: 1,
    minWidth: 0,
  },
  estUnitsLabel: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: "rgba(253,230,138,0.78)",
  },
  estUnitsBreakdown: {
    marginTop: 2,
    fontFamily: "Oxanium_700Bold",
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
  },
  estUnitsValue: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 20,
    fontWeight: "900",
    color: "#FFD65A",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-12deg" }],
  },
  estUnitsValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
    flexShrink: 0,
  },
  estUnitsUnit: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,214,90,0.78)",
    transform: [{ skewX: "-12deg" }],
  },
  estUnitsHint: {
    marginTop: 2,
    fontFamily: "Oxanium_700Bold",
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.38)",
  },
});
