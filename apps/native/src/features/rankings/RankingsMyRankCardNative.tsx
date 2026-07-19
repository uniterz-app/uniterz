import { useCallback, useEffect, useRef, useState } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
  MY_RANK_METRIC_HUD_LABEL,
  myRankCardAccent,
  type MyRankStatsSource,
} from "../../../../../lib/rankings/myRankCardFocus";
import { dateKeyJST } from "../../../../../lib/rankings/rankSnapshotDate";
import { rankingMetricAccent } from "../../../../../lib/rankings/rankingMetricAccent";
import { rankingsTexts, type RankingsLanguage } from "./rankingsTexts";
import { RankingsAvatarNative } from "./RankingsAvatarAndTabs";
import { CyberRankNumberNative } from "./CyberRankNumberNative";
import { CyberSlantedSegBarNative } from "./CyberSlantedSegBarNative";
import { MyRankCardFrameNative, resolveMyRankFrameTone } from "./MyRankCardFrameNative";
import { RankDeltaBadgeNative } from "./RankingsRankDeltaBadge";
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

function RankMetaStripNative({
  topPercentLabel,
  posts,
  metric,
  avgRow,
}: {
  topPercentLabel?: string | null;
  posts: number;
  metric: MobileMetric;
  avgRow?: ReturnType<typeof deriveMyRankListAvgRow>;
}) {
  const avgText = avgRow
    ? metric === "totalScore"
      ? `AVG ${formatMetricDecimals(avgRow.avgTotalScore ?? 0, 1)}`
      : metric === "marginPrecision"
        ? avgRow.avgMarginPrecision && avgRow.avgMarginPrecision > 0
          ? `AVG ${formatMetricDecimals(avgRow.avgMarginPrecision, 1)}`
          : null
        : null
    : null;

  if (!topPercentLabel && posts === 0 && !avgText) return null;

  return (
    <View style={styles.myRankMetaStrip}>
      {topPercentLabel ? (
        <View style={styles.myRankTopPercentBadge}>
          <Text style={styles.myRankTopPercentText}>{topPercentLabel}</Text>
        </View>
      ) : null}
      <Text style={styles.myRankMetaVol}>VOL:{posts}</Text>
      {avgText ? <Text style={styles.myRankMetaAvg} numberOfLines={1}>{avgText}</Text> : null}
    </View>
  );
}

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
  barsReady = true,
  leagueLabel,
  mobileWide = false,
  cardResetKey,
  onShareStateChange,
  rankTierGap = null,
  gapHref = null,
  onOpenGap,
  rankProgress,
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
  barsReady?: boolean;
  leagueLabel?: string | null;
  /** Web `cardResetKey` — 指標タブ切替でセグメントバーを再点灯 */
  cardResetKey?: string;
  /** Web `mobileWide` — 親 padding 内でカード幅をリストと揃える */
  mobileWide?: boolean;
  onShareStateChange?: (state: MyRankCardShareState) => void;
  /** Pro のみ — 次順位帯までの総合得点差（totalScore タブ時） */
  rankTierGap?: RankTierGapHint | null;
  /** Pro — Gap 画面リンクの有無（href の代わりに存在判定に使用） */
  gapHref?: string | null;
  /** Pro — Gap 画面への遷移コールバック */
  onOpenGap?: () => void;
  /** Ranking Progress 用スナップショット（未蓄積時は NO DATA） */
  rankProgress?: MyRankProgressPoint[] | null;
}) {
  const t = rankingsTexts(language);
  const freeTier = displayTier === "free";
  const proTier = displayTier === "pro";
  const showProBadge = Boolean(isPro) && !freeTier;
  // Web: displayTier 指定時は順位デルタで枠色を変えない（Free/Pro は基準トーン）
  const frameTone = resolveMyRankFrameTone(
    displayTier != null ? null : rankDeltaPlaces
  );
  const displayRankDelta = displayTier != null ? null : rankDeltaPlaces;
  const accent = myRankCardAccent(frameTone);
  const metricAccent = rankingMetricAccent(metric);
  const segAccent = {
    border: accent.primary,
    glow: accent.glow,
    bg: accent.dim,
  };
  const statsPending = !!statsScramble;
  const rankVisualMuted = loading || statsPending || rank == null;

  const selectedMini =
    miniMetrics?.find((m) => m.key === metric) ?? miniMetrics?.[0] ?? null;
  const segPct = selectedMini?.pct ?? 0;

  const leagueDisplay =
    leagueLabel && leagueLabel.toUpperCase() !== "NBA" ? leagueLabel : null;
  const serialDateKey = dateKeyJST();

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

  const rankTierGapHud =
    metric === "totalScore" && rankTierGap
      ? formatRankTierGapForHud(rankTierGap, language === "en" ? "en" : "ja")
      : null;
  const showRankTierGapHud = proTier && rankTierGapHud != null;
  const showGapLink =
    proTier &&
    metric === "totalScore" &&
    typeof gapHref === "string" &&
    gapHref.length > 0;

  const showRankMetaInline = freeTier && displayTier != null;
  const showRankingProgress = displayTier != null || rankProgress !== undefined;
  const progressSnapshotLimit = resolveMyRankProgressSnapshotLimit({
    displayTier,
    isPro,
  });
  const progressPoints = rankProgress ?? [];

  const metricValueDisplay = (() => {
    if (loading || statsPending) return "···";
    if (selectedMini?.value) return selectedMini.value;
    if (metric === "winRate") return `${Math.round(value)}%`;
    if (metric === "streak" || metric === "goalScorerHits") return `${Math.round(value)}`;
    if (metric === "totalScore") return Math.round(value).toLocaleString("en-US");
    return formatMetricDecimals(value, 1);
  })();

  const [segEnter, setSegEnter] = useState(false);
  const [sharing, setSharing] = useState(false);
  const captureRef = useRef<View>(null);

  useEffect(() => {
    if (loading || !barsReady) {
      setSegEnter(false);
      return;
    }
    setSegEnter(false);
    const id = setTimeout(() => setSegEnter(true), 16);
    return () => clearTimeout(id);
  }, [loading, barsReady, cardResetKey]);

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
      canShare,
      sharing,
      share: () => void handleShare(),
    });
  }, [canShare, sharing, handleShare, onShareStateChange]);

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
        <View style={styles.myRankTowerGrid}>
          <View style={[styles.myRankTowerLeft, { borderRightColor: accent.hairline, backgroundColor: "rgba(0,0,0,0.15)" }]}>
            <Text style={styles.myRankYourRankLabel}>{t.yourRank}</Text>
            <View style={styles.myRankTowerRankBlock}>
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
              {entriesDisplay ? (
                <Text style={styles.myRankEntries}>/ {entriesDisplay}</Text>
              ) : null}
              {!loading && !statsPending && rank != null ? (
                <RankDeltaBadgeNative delta={displayRankDelta} size="md" />
              ) : null}
            </View>
          </View>

          <View style={styles.myRankTowerRight}>
            <View style={styles.myRankHeaderRow}>
              <View style={[styles.myRankAvatarSquare, { borderColor: accent.hairline, backgroundColor: accent.avatarBg }]}>
                <RankingsAvatarNative
                  photoURL={photoURL}
                  label={displayName.trim() || "?"}
                  size={36}
                  square
                />
              </View>
              <View style={styles.myRankNameCol}>
                <View style={styles.myRankNameRow}>
                  {displayName.trim().length > 0 ? (
                    <Text
                      style={[styles.myRankNameWeb, { fontFamily: rankingNameFont(displayName.trim()) }]}
                      numberOfLines={1}
                    >
                      {displayName.trim()}
                    </Text>
                  ) : null}
                  {showProBadge ? (
                    <View style={styles.proBadgeWrap}>
                      <Text style={styles.proBadgeInner}>PRO</Text>
                    </View>
                  ) : null}
                </View>
                {showRankTierGapHud && rankTierGapHud ? (
                  <Text style={myRankLocalStyles.tierGapText} numberOfLines={1}>
                    {rankTierGapHud.segments.map((seg, i) => (
                      <Text
                        key={i}
                        style={seg.tone === "tier" ? myRankLocalStyles.tierGapGold : null}
                      >
                        {seg.text}
                      </Text>
                    ))}
                  </Text>
                ) : showRankMetaInline ? (
                  <RankMetaStripNative
                    posts={posts}
                    metric={metric}
                    avgRow={avgRow}
                  />
                ) : null}
              </View>
              <View style={styles.myRankHudCol}>
                <Text style={[styles.myRankHudLabel, { color: metricAccent.labelDim }]}>
                  {MY_RANK_METRIC_HUD_LABEL[metric]}
                </Text>
                <Text
                  style={[
                    styles.myRankHudValue,
                    { color: loading || statsPending ? "rgba(255,255,255,0.92)" : metricAccent.value },
                  ]}
                  numberOfLines={1}
                >
                  {metricValueDisplay}
                </Text>
                {selectedMini?.dayDelta ? (
                  <Text style={[styles.myRankHudDelta, { color: metricAccent.label }]}>
                    {selectedMini.dayDelta}
                  </Text>
                ) : null}
              </View>
            </View>

            {showRankMetaInline ? null : (
              <RankMetaStripNative
                topPercentLabel={topPercentLabel}
                posts={posts}
                metric={metric}
                avgRow={avgRow}
              />
            )}

            <View style={styles.myRankSegWrap}>
              <CyberSlantedSegBarNative
                pct={segPct}
                segments={12}
                compact
                accent={segAccent}
                enter={segEnter && !statsPending}
                replayKey={cardResetKey ?? metric}
              />
            </View>
          </View>
        </View>

        {showRankingProgress ? (
          <MyRankRankingProgressNative
            points={progressPoints}
            maxSnapshots={progressSnapshotLimit}
            loading={loading}
            language={language === "en" ? "en" : "ja"}
            emptyHint={t.rankingProgressNoData}
          />
        ) : null}

        {showGapLink ? (
          <View style={myRankLocalStyles.gapLinkWrap}>
            <Pressable
              onPress={onOpenGap}
              accessibilityRole="button"
              style={myRankLocalStyles.gapLink}
            >
              <Text style={myRankLocalStyles.gapLinkText} numberOfLines={1}>
                ◈ {t.rankGapViewGap}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.myRankFooter}>
          <Text style={styles.myRankFooterText} numberOfLines={1}>
            {proTier || (isPro && !freeTier) ? "UNITERZ/PRO" : "UNITERZ"}
            {leagueDisplay ? ` · ${leagueDisplay}` : ""}
            {` · ${MY_RANK_METRIC_HUD_LABEL[metric]}`}
            {` // ${serialDateKey}`}
          </Text>
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
    marginTop: 3,
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(140,240,255,0.88)",
    fontVariant: ["tabular-nums"],
    fontFamily: "Oxanium_700Bold",
  },
  tierGapGold: {
    color: "#FFD65A",
  },
  gapLinkWrap: {
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  gapLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.25)",
    backgroundColor: "rgba(251,191,36,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  gapLinkText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(254,243,199,0.9)",
    fontFamily: "Oxanium_700Bold",
  },
});
