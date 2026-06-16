/**
 * Web `HomeAwayWinRateBar` / `MarketBiasSemiDonut` のネイティブ簡易版。
 */
import { StyleSheet, Text, View } from "react-native";
import ResultMarketDonutSvg, { type DonutSegment } from "../results/ResultMarketDonutSvg";
import { colors, radius } from "../../theme/tokens";

const COLOR_HOME = "#22d3ee";
const COLOR_AWAY = "#e879f9";
const COLOR_CONTRARIAN = "#22d3ee";
const COLOR_FAVORABLE = "#e879f9";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

type HomeAwayProps = {
  homeRate: number;
  awayRate: number;
  homeShare: number;
  awayShare: number;
  language: "ja" | "en";
};

export function ProfileHomeAwayCardNative({
  homeRate,
  awayRate,
  homeShare,
  awayShare,
  language,
}: HomeAwayProps) {
  const isJa = language === "ja";
  const homePct = Math.round(clamp01(homeRate) * 100);
  const awayPct = Math.round(clamp01(awayRate) * 100);
  const homeWinHigher = homePct > awayPct;
  const awayWinHigher = awayPct > homePct;

  const hS = clamp01(homeShare);
  const aS = clamp01(awayShare);
  const shareSum = hS + aS;
  const homeSeg = shareSum > 0 ? hS / shareSum : 0.5;
  const awaySeg = shareSum > 0 ? aS / shareSum : 0.5;
  const homeSharePct = Math.round(homeSeg * 100);
  const awaySharePct = Math.round(awaySeg * 100);

  const segments: DonutSegment[] = [
    { label: "Home", value: homeSeg, color: COLOR_HOME },
    { label: "Away", value: awaySeg, color: COLOR_AWAY },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{isJa ? "Home / Away 分析" : "Home / Away"}</Text>
      <View style={styles.metricRow}>
        <View style={styles.metricBox}>
          <Text style={[styles.metricLabel, styles.metricLabelHome]}>
            {isJa ? "Home勝率" : "Home win rate"}
          </Text>
          <Text style={[styles.metricValue, homeWinHigher && styles.metricValueHighlight]}>
            {homePct}
            <Text style={styles.metricUnit}>%</Text>
          </Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={[styles.metricLabel, styles.metricLabelAway]}>
            {isJa ? "Away勝率" : "Away win rate"}
          </Text>
          <Text style={[styles.metricValue, awayWinHigher && styles.metricValueHighlight]}>
            {awayPct}
            <Text style={styles.metricUnit}>%</Text>
          </Text>
        </View>
      </View>

      <Text style={styles.subTitle}>{isJa ? "Home / Away 比率" : "Home / Away share"}</Text>
      <View style={styles.donutRow}>
        <ResultMarketDonutSvg segments={segments} size={120} thickness={28} drawDelayMs={0} />
        <View style={styles.legend}>
          <LegendRow color={COLOR_HOME} label={isJa ? "Home 投稿比" : "Home picks"} pct={homeSharePct} />
          <LegendRow color={COLOR_AWAY} label={isJa ? "Away 投稿比" : "Away picks"} pct={awaySharePct} />
        </View>
      </View>
      <Text style={styles.footnote}>
        {isJa
          ? "※ 勝率はホーム／アウェーそれぞれの的中率。比率は投稿の内訳です。"
          : "Win rate is hit rate per side; share is pick distribution."}
      </Text>
    </View>
  );
}

type MarketBiasProps = {
  favorableWinRate: number;
  contrarianWinRate: number;
  favorableShare: number;
  contrarianShare: number;
  language: "ja" | "en";
};

export function ProfileMarketBiasCardNative({
  favorableWinRate,
  contrarianWinRate,
  favorableShare,
  contrarianShare,
  language,
}: MarketBiasProps) {
  const isJa = language === "ja";
  const favWinPct = Math.round(clamp01(favorableWinRate) * 100);
  const conWinPct = Math.round(clamp01(contrarianWinRate) * 100);
  const favorableWinHigher = favWinPct > conWinPct;
  const contrarianWinHigher = conWinPct > favWinPct;

  const fS = clamp01(favorableShare);
  const cS = clamp01(contrarianShare);
  const shareSum = fS + cS;
  const favSeg = shareSum > 0 ? fS / shareSum : 0.5;
  const conSeg = shareSum > 0 ? cS / shareSum : 0.5;
  const favSharePct = Math.round(favSeg * 100);
  const conSharePct = Math.round(conSeg * 100);

  const segments: DonutSegment[] = [
    { label: "Contrarian", value: conSeg, color: COLOR_CONTRARIAN },
    { label: "Favorable", value: favSeg, color: COLOR_FAVORABLE },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{isJa ? "マーケットバイアス" : "Market bias"}</Text>
      <View style={styles.metricRow}>
        <View style={styles.metricBox}>
          <Text style={[styles.metricLabel, styles.metricLabelHome]}>
            {isJa ? "順当勝率" : "Favorite win rate"}
          </Text>
          <Text style={[styles.metricValue, favorableWinHigher && styles.metricValueHighlight]}>
            {favWinPct}
            <Text style={styles.metricUnit}>%</Text>
          </Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={[styles.metricLabel, styles.metricLabelAway]}>
            {isJa ? "逆張り勝率" : "Underdog win rate"}
          </Text>
          <Text style={[styles.metricValue, contrarianWinHigher && styles.metricValueHighlight]}>
            {conWinPct}
            <Text style={styles.metricUnit}>%</Text>
          </Text>
        </View>
      </View>

      <Text style={styles.subTitle}>{isJa ? "順当 / 逆張り 比率" : "Favorite / underdog share"}</Text>
      <View style={styles.donutRow}>
        <ResultMarketDonutSvg segments={segments} size={120} thickness={28} drawDelayMs={0} />
        <View style={styles.legend}>
          <LegendRow
            color={COLOR_CONTRARIAN}
            label={isJa ? "逆張り投稿比" : "Underdog picks"}
            pct={conSharePct}
          />
          <LegendRow
            color={COLOR_FAVORABLE}
            label={isJa ? "順当投稿比" : "Favorite picks"}
            pct={favSharePct}
          />
        </View>
      </View>
    </View>
  );
}

function LegendRow({ color, label, pct }: { color: string; label: string; pct: number }) {
  return (
    <View style={styles.legendRow}>
      <View style={styles.legendLeft}>
        <View style={[styles.legendDot, { backgroundColor: color }]} />
        <Text style={styles.legendLabel}>{label}</Text>
      </View>
      <Text style={styles.legendPct}>{pct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    padding: 14,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.2)",
    backgroundColor: "rgba(5,8,20,0.85)",
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  subTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 10,
  },
  metricRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  metricLabelHome: { color: "rgba(34,211,238,0.9)" },
  metricLabelAway: { color: "rgba(232,121,249,0.9)" },
  metricValue: {
    marginTop: 4,
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  metricValueHighlight: { color: "#fde047" },
  metricUnit: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
  },
  donutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  legend: {
    minWidth: 140,
    gap: 10,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  legendLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    flexShrink: 1,
  },
  legendPct: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  footnote: {
    marginTop: 10,
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    lineHeight: 16,
  },
});
