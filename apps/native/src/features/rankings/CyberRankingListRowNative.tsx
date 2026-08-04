import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";
import Animated from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { MobileMetric } from "../../../../../lib/rankings/rankingMetrics";
import type { ProfilePlanProBgVariant } from "../../../../../lib/profile/profilePlanProBgVariants";
import { formatMetricDecimals } from "../../../../../lib/format/metricDecimals";
import { cyberScoreGlowLayers } from "../../../../../lib/rankings/cyberGlyphGlowLayers";
import {
  cyberMetricTag,
  cyberRankPalette,
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
  const t = Math.min(1, (rank - 4) / 14);
  return `rgba(255, 43, 214, ${0.92 - t * 0.35})`;
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
  );
}

function ListRowMeta({
  countryCode,
  posts,
  metric,
  avgRow,
}: {
  countryCode?: string | null;
  posts: number;
  metric: MobileMetric;
  avgRow: {
    avgTotalScore?: number;
    avgMarginPrecision?: number;
    avgUpsetScore?: number;
  };
}) {
  const flagUri = countryCode ? rankingFlagImageUri(countryCode) : null;
  const avgText = listRowAvgText(metric, avgRow);

  return (
    <View style={styles.metaRow}>
      {flagUri ? (
        <Image source={{ uri: flagUri }} style={styles.flag} resizeMode="cover" />
      ) : null}
      <Text style={styles.volText}>VOL:{posts}</Text>
      {avgText ? <Text style={styles.avgText} numberOfLines={1}>{avgText}</Text> : null}
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
  hideAccentBar = false,
  rankOverline = null,
  plainWhiteScore = false,
  proSkinVariant = null,
  proSkinIntensity = "medium",
  /** プレビュー等 — スコアを任意スロットに差し替え */
  scoreSlot = null,
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
  /** My Rank Free — 左アクセントバー非表示 */
  hideAccentBar?: boolean;
  /** 順位数字の上に置くラベル（例: YOUR RANK） */
  rankOverline?: string | null;
  /** My Rank Free — スタッツ数字を白に */
  plainWhiteScore?: boolean;
  /** Pro Skin（Web `proSkinVariant`） */
  proSkinVariant?: ProfilePlanProBgVariant | null;
  proSkinIntensity?: RankingListProSkinIntensity;
  scoreSlot?: ReactNode;
}) {
  const palette = cyberRankPalette(rank);
  const firstFrame = palette.firstPlaceFrame;
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
    <View style={styles.article}>
      {proSkinVariant ? (
        <RankingListProSkinFxNative
          variant={proSkinVariant}
          intensity={proSkinIntensity}
        />
      ) : (
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
      {!hideAccentBar ? (
        <View
          style={[
            styles.accentBar,
            elevateContent ? styles.contentAboveFx : null,
            {
              backgroundColor: palette.accent,
              shadowColor: palette.accentGlow,
            },
          ]}
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
          <CyberRankNumberNative rank={rank} />
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
          <View
            style={[
              styles.avatarSquare,
              firstFrame
                ? { borderColor: "rgba(184,255,60,0.55)", shadowColor: "rgba(184,255,60,0.2)" }
                : { borderColor: "rgba(255,255,255,0.12)" },
            ]}
          >
            <RankingsAvatarNative photoURL={photoURL} label={displayName} size={44} square />
          </View>
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
            <RankDeltaBadgeNative delta={rankDeltaPlaces} />
            {isPro ? <ProCyberBadgeNative compact /> : null}
          </View>
          <ListRowMeta
            countryCode={countryCode}
            posts={posts}
            metric={metric}
            avgRow={avgRow ?? {}}
          />
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
      <View style={[styles.bottomBorder, elevateContent ? styles.contentAboveFx : null]} />
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
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
  },
  contentAboveFx: {
    zIndex: 10,
  },
  rowPressed: {
    opacity: 0.88,
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    zIndex: 2,
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
    height: 44,
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
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 12 },
      default: {},
    }),
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
