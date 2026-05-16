import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { MobileMetric } from "../../../../../app/component/rankings/_data/mockRows";
import { formatMetricDecimals } from "../../../../../lib/format/metricDecimals";
import { rankingsTexts, type RankingsLanguage } from "./rankingsTexts";
import { RankingsAvatarNative } from "./RankingsAvatarAndTabs";
import { RankingsShellGridOverlay } from "./rankingsUiDecorations";
import { RankDeltaBadgeNative } from "./RankingsRankDeltaBadge";
import { rankingsUiStyles as styles } from "./rankingsUiStyles";

export function MyRankCardNative({
  rank,
  metric,
  value,
  displayName,
  photoURL,
  totalPosts,
  loading,
  statsScramble,
  isPro,
  rankDeltaPlaces,
  language,
}: {
  rank: number | null;
  metric: MobileMetric;
  value: number;
  displayName: string;
  photoURL?: string | null;
  /** Web `MyRankCard` と同様、勝率時の投稿数表示用 */
  totalPosts?: number;
  loading?: boolean;
  statsScramble?: boolean;
  isPro?: boolean;
  rankDeltaPlaces?: number | null;
  language: RankingsLanguage;
}) {
  const t = rankingsTexts(language);
  const rankStyleColor =
    loading || statsScramble || rank == null
      ? "rgba(255,255,255,0.9)"
      : rank <= 10
        ? "#FFD65A"
        : rank <= 20
          ? "#F4E47A"
          : "rgba(248,250,252,0.95)";

  const rankDisplay = (() => {
    if (loading) return "--";
    if (rank == null) return "--";
    if (statsScramble) return "···";
    return `#${rank}`;
  })();

  const valueMain = (() => {
    if (loading) return "--";
    if (statsScramble) return "···";
    if (metric === "winRate") return `${Math.round(value)}%`;
    if (metric === "streak") return `${Math.round(value)}`;
    return `${formatMetricDecimals(value, 1)} ${t.pts}`;
  })();

  return (
    <View style={styles.myRankOuter}>
      <LinearGradient
        colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.02)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.myRankCard}
      >
        <View style={[StyleSheet.absoluteFillObject, { borderRadius: 18, overflow: "hidden" }]}>
          <RankingsShellGridOverlay borderRadius={18} />
        </View>
        <View style={styles.myRankForeground}>
          <View style={styles.myRankRow}>
            <View style={styles.myRankLeft}>
              <RankingsAvatarNative
                photoURL={photoURL}
                label={displayName.trim() || "?"}
                size={44}
              />
              <View style={styles.myRankNameCol}>
                <View style={styles.myRankNameRow}>
                  {displayName.trim().length > 0 ? (
                    <Text style={styles.myRankNameWeb} numberOfLines={1}>
                      {displayName.trim()}
                    </Text>
                  ) : null}
                  {isPro ? (
                    <View style={styles.proBadgeWrap}>
                      <Text style={styles.proBadgeInner}>PRO</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            <View style={styles.myRankCenter}>
              <Text style={styles.myRankYourRankLabel} maxFontSizeMultiplier={1.15}>
                {t.yourRank}
              </Text>
              <View style={styles.myRankCenterNums}>
                <Text
                  style={[styles.myRankHash, { color: rankStyleColor }]}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.2}
                >
                  {rankDisplay}
                </Text>
                <RankDeltaBadgeNative delta={rankDeltaPlaces} size="md" />
              </View>
            </View>

            <View style={styles.myRankRightCol}>
              {metric === "streak" && !loading && !statsScramble ? (
                <View style={styles.myRankStreakRow}>
                  <Text style={styles.myRankMetricValueLarge} maxFontSizeMultiplier={1.2}>
                    {Math.round(value)}
                  </Text>
                  <Text style={styles.myRankStreakSuffix} maxFontSizeMultiplier={1.15}>
                    {t.streakShort}
                  </Text>
                </View>
              ) : (
                <Text style={styles.myRankMetricValueLarge} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                  {valueMain}
                </Text>
              )}
              {!loading && !statsScramble && metric === "winRate" && totalPosts !== undefined ? (
                <Text style={styles.myRankWinPosts} numberOfLines={1}>
                  {t.posts} {totalPosts}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
