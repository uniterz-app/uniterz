import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, type ReactNode } from "react";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { MobileMetric } from "../../../../../lib/rankings/rankingMetrics";
import type { ProfilePlanProBgVariant } from "../../../../../lib/profile/profilePlanProBgVariants";
import { formatMetricDecimals } from "../../../../../lib/format/metricDecimals";
import { cyberScoreGlowLayers } from "../../../../../lib/rankings/cyberGlyphGlowLayers";
import {
  cyberMetricTag,
  cyberRankPalette,
  cyberRankQuietFrameColor,
  CYBER_LIST_CYAN,
  CYBER_LIST_MAGENTA,
} from "../../../../../lib/rankings/cyberRankVisual";
import { CyberGlyphGlowTextNative } from "./CyberGlyphGlowTextNative";
import {
  formatListMetricDayDelta,
  listRowAvgText,
} from "../../../../../lib/rankings/listRowMetricMeta";
import {
  hasJaScript,
  rankingFontSizePx,
} from "../../../../../lib/rankings/rankingJaTextSize";
import type { RankingsLanguage } from "./rankingsTexts";
import { RankingsAvatarNative } from "./RankingsAvatarAndTabs";
import { CyberRankNumberNative } from "./CyberRankNumberNative";
import { RankDeltaBadgeNative } from "./RankingsRankDeltaBadge";
import { RankFirstBorderEdgeScanNative } from "./RankFirstBorderEdgeScanNative";
import RankingListProSkinFxNative, {
  type RankingListProSkinIntensity,
} from "./RankingListProSkinFxNative";
import { rankingFlagImageUri } from "./rankingFlagUri";
import { METRIC_FONT, RANKING_SCORE_FONT, rankingNameFont, rankingTagFont } from "./rankingsUiTheme";
import { useRankingsCrownEntrance } from "./useRankingsCrownEntrance";
import ProCyberBadgeNative from "../profile/kinetik/ProCyberBadgeNative";

function cyberScoreColor(rank: number): string {
  if (rank === 1) return "#FFD65A";
  if (rank === 2) return "#FCD34D";
  if (rank === 3) return "#FB923C";
  return "rgba(255,255,255,0.96)";
}

function scoreFontSize(rank: number): number {
  return rank <= 3 ? 23 : 19;
}

function scoreLineHeight(fontSize: number): number {
  /** Alfa Slab One は ascender が大きい — lineHeight 不足で上が見切れる */
  return Math.ceil(fontSize * 1.28);
}

function CyberRankingScoreNative({
  rank,
  metric,
  counted,
  plainWhite = false,
}: {
  rank: number;
  metric: MobileMetric;
  counted: number;
  /** My Rank Free — 順位色ではなく白 */
  plainWhite?: boolean;
}) {
  const color = plainWhite ? "rgba(255,255,255,0.96)" : cyberScoreColor(rank);
  const fontSize = scoreFontSize(rank);
  const displayValue =
    metric === "winRate" || metric === "streak" || metric === "goalScorerHits"
      ? String(Math.round(counted))
      : formatMetricDecimals(counted, 1);

  return (
    <View style={styles.scoreMainSkew}>
      <CyberGlyphGlowTextNative
        style={[
          styles.scoreMain,
          {
            color,
            fontSize,
            lineHeight: scoreLineHeight(fontSize),
            fontFamily: RANKING_SCORE_FONT,
          },
        ]}
        layers={plainWhite ? [] : cyberScoreGlowLayers(rank)}
      >
        {displayValue}
      </CyberGlyphGlowTextNative>
    </View>
  );
}

/** Web `.cyber-rank-avatar-first-glow` — 4s 一定周期 */
const AVATAR_GLOW_PULSE_MS = 2000;

/** Web `.cyber-rank-avatar-first-glow` — 1位アバター枠の脈動 */
function RankFirstAvatarGlowNative({
  children,
  reduceMotion,
}: {
  children: ReactNode;
  reduceMotion: boolean;
}) {
  const pulse = useSharedValue(reduceMotion ? 0.55 : 0);

  useEffect(() => {
    if (reduceMotion) {
      pulse.value = 0.55;
      return;
    }
    pulse.value = 0;
    pulse.value = withRepeat(
      withTiming(1, {
        duration: AVATAR_GLOW_PULSE_MS,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
    return () => cancelAnimation(pulse);
  }, [pulse, reduceMotion]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowColor: "#B8FF3C",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.32 + pulse.value * 0.5,
    shadowRadius: 5 + pulse.value * 7,
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.22 + pulse.value * 0.58,
  }));

  return (
    <Animated.View style={[styles.avatarSquare, styles.avatarFirstGlow, glowStyle]}>
      <Animated.View pointerEvents="none" style={[styles.avatarFirstHalo, haloStyle]} />
      {children}
    </Animated.View>
  );
}

function ListRowMeta({
  countryCode,
  posts,
  metric,
  avgRow,
  flagOnly = false,
}: {
  countryCode?: string | null;
  posts: number;
  metric: MobileMetric;
  avgRow: {
    avgTotalScore?: number;
    avgMarginPrecision?: number;
    avgUpsetScore?: number;
  };
  flagOnly?: boolean;
}) {
  const flagUri = countryCode ? rankingFlagImageUri(countryCode) : null;
  const avgText = listRowAvgText(metric, avgRow);

  return (
    <View style={styles.metaRow}>
      {flagUri ? (
        <Image source={{ uri: flagUri }} style={styles.flag} resizeMode="cover" />
      ) : null}
      {flagOnly ? null : (
        <>
          <Text style={styles.volText}>VOL:{posts}</Text>
          {avgText ? <Text style={styles.avgText} numberOfLines={1}>{avgText}</Text> : null}
        </>
      )}
    </View>
  );
}

/** Web `CyberRankingListRow` のネイティブ版 */
export function CyberRankingListRowNative({
  rank,
  displayName,
  photoURL,
  metric,
  counted,
  posts = 0,
  countryCode,
  metricValueDelta,
  avgRow,
  language,
  isPro,
  rankDeltaPlaces,
  onPress,
  animateCrown = false,
  pageKey = "",
  reduceMotion = false,
  rankOverline = null,
  plainWhiteScore = false,
  proSkinVariant = null,
  proSkinIntensity = "medium",
  /** プレビュー等 — スコアを任意スロットに差し替え */
  scoreSlot = null,
  hideListMeta = false,
  bare = false,
  rankDisplayValue,
  rankMuted = false,
}: {
  rank: number;
  displayName: string;
  photoURL?: string | null;
  metric: MobileMetric;
  counted: number;
  posts?: number;
  countryCode?: string | null;
  metricValueDelta?: number | null;
  avgRow?: {
    avgTotalScore?: number;
    avgMarginPrecision?: number;
    avgUpsetScore?: number;
  };
  language: RankingsLanguage;
  isPro?: boolean;
  rankDeltaPlaces?: number | null;
  onPress?: () => void;
  /** Web TopPodium 1位 Crown 入場 */
  animateCrown?: boolean;
  pageKey?: string;
  reduceMotion?: boolean;
  /** 廃止（左アクセントバーは出さない）。呼び出し互換のため残す */
  hideAccentBar?: boolean;
  /** 順位数字の上に置くラベル（例: YOUR RANK） */
  rankOverline?: string | null;
  /** My Rank Free — スタッツ数字を白に */
  plainWhiteScore?: boolean;
  /** Pro Skin（Web `proSkinVariant`） */
  proSkinVariant?: ProfilePlanProBgVariant | null;
  proSkinIntensity?: RankingListProSkinIntensity;
  scoreSlot?: ReactNode;
  /** Web `hideListMeta` — VOL / 平均は出さず、国旗だけ出す */
  hideListMeta?: boolean;
  /** My Rank カード内 — リスト行の背景・下線・1位枠なし。配置だけ揃える */
  bare?: boolean;
  rankDisplayValue?: string;
  rankMuted?: boolean;
}) {
  const palette = cyberRankPalette(rank);
  const firstFrame = !bare && palette.firstPlaceFrame;
  const quietFrame = bare ? null : cyberRankQuietFrameColor(rank);
  const metricTag = cyberMetricTag(metric, language === "ja" ? "ja" : "en");
  const nameJa = hasJaScript(displayName);
  const nameFontSize = rankingFontSizePx(15, displayName);
  const tagFontSize = rankingFontSizePx(8, metricTag);
  const dayDeltaText = formatListMetricDayDelta(metric, metricValueDelta);
  const dayDeltaFontSize = rankingFontSizePx(10, dayDeltaText ?? "+0");
  const { crownStyle } = useRankingsCrownEntrance(
    animateCrown && rank === 1,
    pageKey,
    reduceMotion
  );
  const elevateContent = Boolean(firstFrame || proSkinVariant);

  const body = (
    <View style={[styles.article, bare ? styles.articleBare : null]}>
      {bare || proSkinVariant ? (
        proSkinVariant && !bare ? (
          <RankingListProSkinFxNative
            variant={proSkinVariant}
            intensity={proSkinIntensity}
          />
        ) : null
      ) : hideListMeta ? null : (
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(255,255,255,0.03)",
            "rgba(255,255,255,0.01)",
            "rgba(0,0,0,0.12)",
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      {firstFrame ? <RankFirstBorderEdgeScanNative /> : null}
      {quietFrame ? (
        <View
          pointerEvents="none"
          style={[styles.quietFrame, { borderColor: quietFrame }]}
        />
      ) : null}
      <View
        style={[
          styles.rowInner,
          firstFrame && styles.rowInnerFirst,
          elevateContent ? styles.contentAboveFx : null,
        ]}
      >
        <View style={[styles.rankCol, rankOverline ? styles.rankColWithOverline : null]}>
          {rankOverline ? (
            <Text style={styles.rankOverline} numberOfLines={1}>
              {rankOverline}
            </Text>
          ) : null}
          <CyberRankNumberNative
            rank={rank}
            displayValue={rankDisplayValue}
            muted={rankMuted}
          />
          <RankDeltaBadgeNative delta={rankDeltaPlaces} />
        </View>

        <View style={styles.avatarCol}>
          {rank === 1 ? (
            <Animated.View
              style={[
                styles.crownRow,
                styles.crownOverlay,
                animateCrown ? crownStyle : null,
              ]}
            >
              <MaterialCommunityIcons name="crown" size={14} color="#F4C542" />
              <Text style={styles.plusLabel}>+++</Text>
            </Animated.View>
          ) : null}
          {firstFrame ? (
            <RankFirstAvatarGlowNative reduceMotion={reduceMotion}>
              <View style={styles.avatarCrop}>
                <RankingsAvatarNative photoURL={photoURL} label={displayName} size={44} square />
              </View>
            </RankFirstAvatarGlowNative>
          ) : (
            <View style={[styles.avatarSquare, styles.avatarRestBorder]}>
              <View style={styles.avatarCrop}>
                <RankingsAvatarNative photoURL={photoURL} label={displayName} size={44} square />
              </View>
            </View>
          )}
        </View>

        <View style={styles.mainCol}>
          <View style={styles.nameRow}>
            <Text
              style={[
                styles.name,
                {
                  fontSize: nameFontSize,
                  letterSpacing: nameJa ? 0.4 : 0.6,
                  fontFamily: rankingNameFont(displayName),
                  textTransform: nameJa ? "none" : "uppercase",
                },
              ]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            {isPro ? (
              <ProCyberBadgeNative compact={!bare} emphasized={bare} />
            ) : null}
          </View>
          {hideListMeta ? (
            countryCode ? (
              <ListRowMeta countryCode={countryCode} posts={0} metric={metric} avgRow={{}} flagOnly />
            ) : null
          ) : (
            <ListRowMeta
              countryCode={countryCode}
              posts={posts}
              metric={metric}
              avgRow={avgRow ?? {}}
            />
          )}
        </View>

        <View style={styles.scoreCol}>
          {scoreSlot ?? (
            <CyberRankingScoreNative
              rank={rank}
              metric={metric}
              counted={counted}
              plainWhite={plainWhiteScore}
            />
          )}
          <Text
            style={[styles.metricTag, { fontSize: tagFontSize, fontFamily: rankingTagFont(metricTag) }]}
            numberOfLines={1}
          >
            {metricTag}
          </Text>
          {dayDeltaText ? (
            <Text style={[styles.dayDelta, { fontSize: dayDeltaFontSize }]}>
              {dayDeltaText}
            </Text>
          ) : null}
        </View>
      </View>
      {bare ? null : (
        <View style={[styles.bottomBorder, elevateContent ? styles.contentAboveFx : null]} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        delayPressIn={0}
        accessibilityRole="button"
        style={({ pressed }) => [pressed ? styles.rowPressed : null]}
      >
        {body}
      </Pressable>
    );
  }
  return body;
}

const styles = StyleSheet.create({
  article: {
    position: "relative",
    minHeight: 72,
    overflow: "hidden",
    marginBottom: 3,
  },
  articleBare: {
    marginBottom: 0,
    overflow: "visible",
  },
  contentAboveFx: {
    zIndex: 10,
  },
  quietFrame: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
    borderWidth: 1,
    opacity: 0.92,
  },
  rowPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  rowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 1,
  },
  rowInnerFirst: {
    zIndex: 10,
    /** 王冠を absolute にした分の上余白 — 順位とアバター中心を揃えたまま確保 */
    paddingTop: 22,
  },
  rankCol: {
    width: 52,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  rankColWithOverline: {
    height: undefined,
    minHeight: 44,
    gap: 6,
  },
  rankOverline: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 6.5,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: METRIC_FONT,
    textAlign: "center",
    marginBottom: 2,
  },
  avatarCol: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  crownRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 2,
  },
  crownOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "100%",
    marginBottom: 2,
    zIndex: 3,
  },
  plusLabel: {
    color: "#B8FF3C",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1.2,
    fontFamily: METRIC_FONT,
    textShadowColor: "rgba(184,255,60,0.55)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  avatarSquare: {
    width: 44,
    height: 44,
    borderRadius: 4,
    borderWidth: 1,
    overflow: "visible",
  },
  avatarCrop: {
    width: "100%",
    height: "100%",
    borderRadius: 3,
    overflow: "hidden",
  },
  avatarRestBorder: {
    borderColor: "rgba(255,255,255,0.12)",
  },
  avatarFirstGlow: {
    borderColor: "rgba(184,255,60,0.78)",
  },
  avatarFirstHalo: {
    ...StyleSheet.absoluteFillObject,
    margin: -4,
    borderRadius: 7,
    backgroundColor: "rgba(184,255,60,0.28)",
  },
  mainCol: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 0,
  },
  name: {
    flexShrink: 1,
    color: CYBER_LIST_CYAN,
    fontWeight: "700",
    textShadowColor: "rgba(0,245,255,0.35)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    minWidth: 0,
  },
  flag: {
    width: 21,
    height: 14,
    borderRadius: 1,
    opacity: 0.8,
  },
  volText: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    fontFamily: METRIC_FONT,
  },
  avgText: {
    flexShrink: 1,
    color: "rgba(0,245,255,0.55)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    fontFamily: METRIC_FONT,
  },
  scoreCol: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 72,
    paddingLeft: 4,
    paddingTop: 1,
    overflow: "visible",
  },
  scoreMainSkew: {
    transform: [{ skewX: "-12deg" }],
  },
  scoreMain: {
    fontWeight: "700",
    includeFontPadding: false,
  },
  metricTag: {
    marginTop: 4,
    color: CYBER_LIST_MAGENTA,
    fontWeight: "700",
    letterSpacing: 2,
    lineHeight: 14,
    includeFontPadding: false,
    textTransform: "uppercase",
  },
  dayDelta: {
    marginTop: 2,
    color: "#FFD65A",
    fontWeight: "800",
    lineHeight: 14,
    includeFontPadding: false,
    fontFamily: METRIC_FONT,
    textShadowColor: "rgba(255,214,90,0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  bottomBorder: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
});
