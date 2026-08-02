import { useCallback, useEffect, useRef, useState } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { MyRankMiniMetric } from "../../../../../app/component/rankings/MyRankCard";
import type { MobileMetric } from "../../../../../lib/rankings/rankingMetrics";
import { formatMetricDecimals } from "../../../../../lib/format/metricDecimals";
import {
  formatRankTierGapForHud,
  type RankTierGapHint,
} from "../../../../../lib/rankings/rankTierMilestone";
import {
  resolveMyRankProgressSnapshotLimit,
  type MyRankProgressPoint,
} from "../../../../../lib/rankings/myRankRankingProgress";
import MyRankRankingProgressNative from "./MyRankRankingProgressNative";
import {
  computeMyRankTopPercent,
  deriveMyRankListAvgRow,
  myRankMetricUnitSuffix,
  type MyRankStatsSource,
} from "../../../../../lib/rankings/myRankCardFocus";
import { listRowAvgText } from "../../../../../lib/rankings/listRowMetricMeta";
import { rankingMetricAccent } from "../../../../../lib/rankings/rankingMetricAccent";
import { rankingsTexts, type RankingsLanguage } from "./rankingsTexts";
import { RankingsAvatarNative } from "./RankingsAvatarAndTabs";
import { CyberRankNumberNative } from "./CyberRankNumberNative";
import { CyberRankingListRowNative } from "./CyberRankingListRowNative";
import { MyRankCardFrameNative, resolveMyRankFrameTone } from "./MyRankCardFrameNative";
import { RankDeltaBadgeNative } from "./RankingsRankDeltaBadge";
import ProCyberBadgeNative from "../profile/kinetik/ProCyberBadgeNative";
import { rankingsUiStyles as styles } from "./rankingsUiStyles";
import { rankingNameFont } from "./rankingsUiTheme";
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
  cardResetKey: _cardResetKey,
  onShareStateChange,
  rankTierGap = null,
  rankProgress,
  rankProgressLoading = false,
  hideRankProgress = false,
}: {
  rank: number | null;
  metric: MobileMetric;
  value: number;
  displayName: string;
  photoURL?: string | null;
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
}) {
  void _cardResetKey;
  const t = rankingsTexts(language);
  const freeTier = displayTier === "free";
  const proTier = displayTier === "pro";
  const showProBadge = Boolean(isPro) && !freeTier;
  // Web: displayTier 指定時は順位デルタで枠色を変えない（Free/Pro は基準トーン）
  const frameTone = resolveMyRankFrameTone(
    displayTier != null ? null : rankDeltaPlaces
  );
  const displayRankDelta = displayTier != null ? null : rankDeltaPlaces;
  const metricAccent = rankingMetricAccent(metric);
  const statsPending = !!statsScramble;
  const rankVisualMuted = loading || statsPending || rank == null;

  const selectedMini =
    miniMetrics?.find((m) => m.key === metric) ?? miniMetrics?.[0] ?? null;

  const entriesDisplay =
    !loading &&
    !statsPending &&
    typeof totalEntries === "number" &&
    totalEntries > 0
      ? totalEntries.toLocaleString(language === "ja" ? "ja-JP" : "en-US")
      : null;

  const topPercent =
    !loading &&
    !freeTier &&
    rank != null &&
    typeof totalEntries === "number" &&
    totalEntries > 0
      ? computeMyRankTopPercent(rank, totalEntries, {
          showMax: proTier ? null : undefined,
        })
      : null;
  const topPercentLabel =
    topPercent != null ? t.topPercent.replace("{n}", topPercent) : null;

  const posts =
    typeof totalPosts === "number" ? totalPosts : (statsSource?.totalPosts ?? 0);
  const avgRow = deriveMyRankListAvgRow(statsSource);
  const avgText = listRowAvgText(metric, avgRow ?? {});
  const showVolAvg = posts > 0 || avgText != null;

  const rankTierGapHud =
    metric === "totalScore" && rankTierGap
      ? formatRankTierGapForHud(rankTierGap, language === "en" ? "en" : "ja")
      : null;
  const showRankTierGapHud = proTier && rankTierGapHud != null;

  const showRankingProgress =
    !freeTier &&
    !hideRankProgress &&
    metric === "totalScore" &&
    (displayTier != null || rankProgress !== undefined);
  const progressSnapshotLimit = resolveMyRankProgressSnapshotLimit({
    displayTier,
    isPro,
  });
  const progressPoints = rankProgress ?? [];

  const metricValueDisplay = (() => {
    if (loading || statsPending) return "···";
    if (selectedMini?.value) {
      const raw = selectedMini.value;
      return metric === "winRate" ? raw.replace(/%$/, "") : raw;
    }
    if (metric === "winRate") return `${Math.round(value)}`;
    if (metric === "streak" || metric === "goalScorerHits") return `${Math.round(value)}`;
    if (metric === "totalScore") return Math.round(value).toLocaleString("en-US");
    return formatMetricDecimals(value, 1);
  })();
  const metricUnit = myRankMetricUnitSuffix(metric);

  const [sharing, setSharing] = useState(false);
  const captureRef = useRef<View>(null);

  const canShare = !loading && !statsPending && rank != null && !sharing;
  const shareLinkUrl = buildRankingsShareUrl();

  const handleShare = useCallback(async () => {
    if (!canShare) return;
    setSharing(true);
    try {
      const result = await shareMyRankCardNative(captureRef, {
        language: language === "en" ? "en" : "ja",
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
  }, [canShare, language, leagueLabel, rank, t.shareRankCardFailed, totalEntries]);

  useEffect(() => {
    onShareStateChange?.({
      canShare: freeTier ? false : canShare,
      sharing,
      share: () => void handleShare(),
    });
  }, [canShare, sharing, handleShare, onShareStateChange, freeTier]);

  if (freeTier) {
    const listRank = rank != null && rank >= 1 ? rank : 99;
    return (
      <View style={[styles.myRankOuter, mobileWide ? styles.myRankOuterWide : null]}>
        <MyRankCardFrameNative tone="neutral" hideLeftEdge>
          <View style={styles.myRankFreeBody}>
            {loading || statsPending || rank == null ? (
              <View style={styles.myRankFreeLoading}>
                <Text style={styles.myRankFreeLoadingText}>···</Text>
              </View>
            ) : (
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
            )}
          </View>
        </MyRankCardFrameNative>
      </View>
    );
  }

  return (
    <View style={[styles.myRankOuter, mobileWide ? styles.myRankOuterWide : null]}>
      <View style={styles.myRankCaptureWrap}>
        <View ref={captureRef} collapsable={false}>
          <MyRankCardFrameNative tone={frameTone} proSpec={proTier}>
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.02)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFillObject, { zIndex: 1 }]}
            />

            {/* 上段2列: ユーザー | 順位+スタッツ / 下段: Progress */}
            <View style={styles.myRankProStack}>
              <View style={styles.myRankProThreeCol}>
                <View style={styles.myRankProUserCol}>
                  <View
                    style={[
                      styles.myRankProAvatarFrame,
                      {
                        borderColor: "rgba(245,215,142,0.4)",
                        backgroundColor: "rgba(0,0,0,0.4)",
                      },
                    ]}
                  >
                    <RankingsAvatarNative
                      photoURL={photoURL}
                      label={displayName.trim() || "?"}
                      size={44}
                      square
                    />
                  </View>
                  <View style={styles.myRankProUserNameBlock}>
                    {displayName.trim().length > 0 ? (
                      <Text
                        style={[
                          styles.myRankProHeroName,
                          {
                            fontFamily: rankingNameFont(displayName.trim()),
                            fontSize: 13,
                            lineHeight: 15,
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {displayName.trim()}
                      </Text>
                    ) : null}
                    {showProBadge ? (
                      <View style={styles.myRankProUserBadgeWrap}>
                        <ProCyberBadgeNative compact />
                      </View>
                    ) : null}
                  </View>
                </View>

                <View style={[styles.myRankProMidCol, styles.myRankProMidColWide]}>
                  <View style={styles.myRankProRankHalf}>
                    <View style={styles.myRankProRankCluster}>
                      <View style={styles.myRankProHashRankRow}>
                        <Text style={styles.myRankProHash}>#</Text>
                        <CyberRankNumberNative
                          rank={rankVisualMuted ? 4 : rank ?? 4}
                          variant="tower"
                          compact
                          muted={rankVisualMuted}
                          displayValue={
                            rankVisualMuted
                              ? loading
                                ? "--"
                                : statsPending
                                  ? "···"
                                  : "--"
                              : undefined
                          }
                        />
                      </View>
                      {entriesDisplay ? (
                        <Text style={styles.myRankProEntriesTight} numberOfLines={1}>
                          / {entriesDisplay}
                        </Text>
                      ) : null}
                    </View>
                    {topPercentLabel ? (
                      <Text style={styles.myRankProMetaGold} numberOfLines={1}>
                        {topPercentLabel}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.myRankProStatsHalf}>
                    <View style={styles.myRankHudValueCluster}>
                      {selectedMini?.dayDelta ? (
                        <Text
                          style={[
                            styles.myRankHudDeltaAbove,
                            styles.myRankHudDeltaRight,
                            { color: metricAccent.label },
                          ]}
                        >
                          {selectedMini.dayDelta}
                        </Text>
                      ) : null}
                      <View style={styles.myRankHudValueRow}>
                        <Text
                          style={[
                            styles.myRankHudValueLarge,
                            {
                              fontSize: 26,
                              lineHeight: 28,
                              color:
                                loading || statsPending
                                  ? "rgba(255,255,255,0.92)"
                                  : metricAccent.value,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {metricValueDisplay}
                        </Text>
                        {metricUnit ? (
                          <Text style={styles.myRankHudUnitLarge}>{metricUnit}</Text>
                        ) : null}
                      </View>
                    </View>
                    {showVolAvg ? (
                      <View style={styles.myRankProVolAvgRow}>
                        {posts > 0 ? (
                          <Text style={styles.myRankProVolText}>VOL:{posts}</Text>
                        ) : null}
                        {avgText ? (
                          <Text style={styles.myRankProAvgText} numberOfLines={1}>
                            {avgText}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                    {showRankTierGapHud && rankTierGapHud ? (
                      <Text style={myRankLocalStyles.tierGapText} numberOfLines={2}>
                        {rankTierGapHud.segments.map((seg, i) => (
                          <Text
                            key={i}
                            style={
                              seg.tone === "tier" ? myRankLocalStyles.tierGapGold : null
                            }
                          >
                            {seg.text}
                          </Text>
                        ))}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>

              {showRankingProgress ? (
                <View style={styles.myRankProProgressBand}>
                  <MyRankRankingProgressNative
                    points={progressPoints}
                    maxSnapshots={progressSnapshotLimit}
                    loading={loading || rankProgressLoading}
                    language={language === "en" ? "en" : "ja"}
                    emptyHint={t.rankingProgressNoData}
                    numbersOnly
                    dense
                  />
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
  tierGapText: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(140,240,255,0.88)",
    fontVariant: ["tabular-nums"],
    fontFamily: "Oxanium_700Bold",
    textAlign: "right",
  },
  tierGapGold: {
    color: "#FFD65A",
  },
});
