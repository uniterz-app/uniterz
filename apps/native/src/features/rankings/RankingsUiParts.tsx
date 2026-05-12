import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { MobileMetric } from "../../../../../app/component/rankings/_data/mockRows";
import type { RankingRowWithCountry } from "../../../../../app/component/rankings/_data/mockRows";
import type { PlayoffRoundKey } from "../../../../../lib/rankings/playoffRound";
import { metricNum, getMetricSubText } from "../../../../../lib/rankings/metric";
import { formatMetricDecimals } from "../../../../../lib/format/metricDecimals";
import { metricLabel, rankingsTexts, type RankingsLanguage } from "./rankingsTexts";

const METRIC_FONT = Platform.select({
  ios: "Oxanium_700Bold",
  android: "Oxanium_700Bold",
  default: "sans-serif",
});

export function RankingsAvatarNative({
  photoURL,
  label,
  size = 40,
}: {
  photoURL?: string | null;
  label: string;
  size?: number;
}) {
  const initial = (label.trim().charAt(0) || "?").toUpperCase();
  return (
    <View style={[styles.avatarWrap, { width: size, height: size, borderRadius: size / 2 }]}>
      {photoURL ? (
        <Image
          source={{ uri: photoURL }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <Text style={[styles.avatarInitial, { fontSize: size * 0.38 }]}>{initial}</Text>
      )}
    </View>
  );
}

export function RankingsCategoryTabsNative({
  category,
  onChange,
  language,
}: {
  category: "playoffs" | "bracket";
  onChange: (value: "playoffs" | "bracket") => void;
  language: RankingsLanguage;
}) {
  const t = rankingsTexts(language);
  const items = [
    { key: "playoffs" as const, label: t.playoffs },
    { key: "bracket" as const, label: t.bracket },
  ];
  return (
    <View style={styles.tabGrid2}>
      {items.map((item) => {
        const active = category === item.key;
        return (
          <Pressable
            key={item.key}
            style={[styles.tabChip, active && styles.tabChipActive]}
            onPress={() => onChange(item.key)}
          >
            <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PlayoffRoundTabsNative({
  round,
  onChange,
  language,
}: {
  round: PlayoffRoundKey;
  onChange: (round: PlayoffRoundKey) => void;
  language: RankingsLanguage;
}) {
  const t = rankingsTexts(language);
  const items: Array<{ key: PlayoffRoundKey; label: string }> = [
    { key: "overall", label: t.roundTotal },
    { key: "r1", label: t.roundFirst },
    { key: "r2", label: t.roundSecond },
    { key: "cf", label: t.roundCF },
    { key: "finals", label: t.roundFinals },
  ];
  return (
    <View style={styles.tabGrid5}>
      {items.map((item) => {
        const active = round === item.key;
        return (
          <Pressable
            key={item.key}
            style={[styles.roundChip, active && styles.tabChipActive]}
            onPress={() => onChange(item.key)}
          >
            <Text style={[styles.roundChipText, active && styles.tabChipTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function RankingsMetricRowNative({
  metrics,
  metric,
  onChange,
  language,
}: {
  metrics: MobileMetric[];
  metric: MobileMetric;
  onChange: (metric: MobileMetric) => void;
  language: RankingsLanguage;
}) {
  const currentIndex = Math.max(0, metrics.indexOf(metric));
  const prev = metrics[(currentIndex - 1 + metrics.length) % metrics.length]!;
  const next = metrics[(currentIndex + 1) % metrics.length]!;

  return (
    <View style={styles.metricRow}>
      <Pressable style={styles.metricSide} onPress={() => onChange(prev)}>
        <Text style={styles.metricSideText} numberOfLines={1}>
          {metricLabel(prev, language)}
        </Text>
      </Pressable>
      <View style={styles.metricCenter}>
        <Text style={styles.metricCenterText} numberOfLines={1}>
          {metricLabel(metric, language)}
        </Text>
      </View>
      <Pressable style={styles.metricSide} onPress={() => onChange(next)}>
        <Text style={styles.metricSideText} numberOfLines={1}>
          {metricLabel(next, language)}
        </Text>
      </Pressable>
    </View>
  );
}

export function MyRankCardNative({
  rank,
  metric,
  value,
  displayName,
  photoURL,
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
  loading?: boolean;
  statsScramble?: boolean;
  isPro?: boolean;
  rankDeltaPlaces?: number | null;
  language: RankingsLanguage;
}) {
  const t = rankingsTexts(language);
  const rankColor =
    rank != null && rank <= 10
      ? "#FFD65A"
      : rank != null && rank <= 20
        ? "#F4E47A"
        : "rgba(248,250,252,0.95)";

  const valueText = (() => {
    if (loading || statsScramble) return "···";
    if (metric === "winRate") return `${Math.round(value)}%`;
    if (metric === "streak") return `${Math.round(value)}`;
    return `${formatMetricDecimals(value, 1)} ${t.pts}`;
  })();

  return (
    <LinearGradient
      colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.02)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.myRankCard}
    >
      <View style={styles.myRankTop}>
        <Text style={styles.myRankLabel}>{t.yourRank}</Text>
        {rankDeltaPlaces != null && rankDeltaPlaces !== 0 ? (
          <Text
            style={[
              styles.rankDelta,
              rankDeltaPlaces > 0 ? styles.rankDeltaUp : styles.rankDeltaDown,
            ]}
          >
            {rankDeltaPlaces > 0 ? `+${rankDeltaPlaces}` : `${rankDeltaPlaces}`}
          </Text>
        ) : null}
      </View>
      <View style={styles.myRankBody}>
        <RankingsAvatarNative photoURL={photoURL} label={displayName} size={44} />
        <View style={styles.myRankMain}>
          <View style={styles.myRankNameRow}>
            <Text style={styles.myRankName} numberOfLines={1}>
              {displayName || (language === "ja" ? "あなた" : "You")}
            </Text>
            {isPro ? <Text style={styles.proBadge}>PRO</Text> : null}
          </View>
          <Text style={[styles.myRankValue, { color: rankColor }]} numberOfLines={1}>
            {loading ? "—" : rank ?? "—"}
          </Text>
        </View>
        <Text style={styles.myRankMetricValue} numberOfLines={1}>
          {valueText}
        </Text>
      </View>
    </LinearGradient>
  );
}

function formatMetricValue(metric: MobileMetric, row: RankingRowWithCountry, language: RankingsLanguage) {
  const { n } = metricNum(row, metric);
  if (metric === "winRate") return `${n}%`;
  if (metric === "streak") return `${n}`;
  return formatMetricDecimals(n, 1);
}

function RankingRowCard({
  row,
  rank,
  metric,
  language,
  podium = false,
}: {
  row: RankingRowWithCountry;
  rank: number;
  metric: MobileMetric;
  language: RankingsLanguage;
  podium?: boolean;
}) {
  const tone =
    rank === 1
      ? { border: "rgba(255,215,90,0.35)", rank: "#FFD65A" }
      : rank === 2
        ? { border: "rgba(230,235,245,0.28)", rank: "#E9EDF6" }
        : rank === 3
          ? { border: "rgba(205,127,50,0.28)", rank: "#D59A5A" }
          : { border: "rgba(255,255,255,0.14)", rank: "rgba(248,250,252,0.95)" };

  return (
    <View style={[styles.listCard, { borderColor: tone.border }, podium && styles.podiumCard]}>
      <Text style={[styles.listRank, { color: tone.rank }]}>{rank}</Text>
      <RankingsAvatarNative
        photoURL={row.photoURL}
        label={row.displayName || row.handle}
        size={podium ? 42 : 36}
      />
      <View style={styles.listMain}>
        <View style={styles.listNameRow}>
          <Text style={styles.listName} numberOfLines={1}>
            {row.displayName || row.handle || "Unknown"}
          </Text>
          {row.plan === "pro" ? <Text style={styles.proBadge}>PRO</Text> : null}
        </View>
        <Text style={styles.listSub} numberOfLines={1}>
          {getMetricSubText(row, metric, language)}
        </Text>
      </View>
      <View style={styles.listScoreCol}>
        <Text style={styles.listScore}>{formatMetricValue(metric, row, language)}</Text>
      </View>
    </View>
  );
}

export function RankingsTopPodiumNative({
  rows,
  metric,
  language,
}: {
  rows: RankingRowWithCountry[];
  metric: MobileMetric;
  language: RankingsLanguage;
}) {
  if (rows.length === 0) return null;
  return (
    <View style={styles.podiumWrap}>
      {rows.slice(0, 3).map((row, index) => (
        <RankingRowCard
          key={row.uid}
          row={row}
          rank={index + 1}
          metric={metric}
          language={language}
          podium
        />
      ))}
    </View>
  );
}

export function RankingListCardNative({
  row,
  rank,
  metric,
  language,
}: {
  row: RankingRowWithCountry;
  rank: number;
  metric: MobileMetric;
  language: RankingsLanguage;
}) {
  return <RankingRowCard row={row} rank={rank} metric={metric} language={language} />;
}

const styles = StyleSheet.create({
  avatarWrap: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    overflow: "hidden",
  },
  avatarInitial: {
    color: "rgba(248,250,252,0.92)",
    fontWeight: "700",
    fontFamily: METRIC_FONT,
  },
  tabGrid2: {
    flexDirection: "row",
    gap: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 4,
  },
  tabGrid5: {
    flexDirection: "row",
    gap: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 4,
  },
  tabChip: {
    flex: 1,
    minHeight: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  roundChip: {
    flex: 1,
    minHeight: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  tabChipActive: {
    borderColor: "rgba(103,232,249,0.4)",
    backgroundColor: "rgba(103,232,249,0.2)",
  },
  tabChipText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "600",
    fontFamily: METRIC_FONT,
  },
  roundChipText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "600",
    fontFamily: METRIC_FONT,
  },
  tabChipTextActive: {
    color: "rgba(207,250,254,0.96)",
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 8,
  },
  metricSide: {
    flex: 1,
    alignItems: "center",
    opacity: 0.55,
    paddingHorizontal: 4,
  },
  metricCenter: {
    flex: 1.2,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(103,232,249,0.45)",
    paddingBottom: 4,
  },
  metricSideText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    fontFamily: METRIC_FONT,
  },
  metricCenterText: {
    color: "rgba(248,250,252,0.96)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    fontFamily: METRIC_FONT,
  },
  myRankCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  myRankTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  myRankLabel: {
    color: "rgba(207,250,254,0.72)",
    fontSize: 10,
    letterSpacing: 1.2,
    fontFamily: METRIC_FONT,
  },
  rankDelta: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: METRIC_FONT,
  },
  rankDeltaUp: { color: "rgba(110,231,183,0.95)" },
  rankDeltaDown: { color: "rgba(251,113,133,0.95)" },
  myRankBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  myRankMain: {
    flex: 1,
    minWidth: 0,
  },
  myRankNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  myRankName: {
    flexShrink: 1,
    color: "rgba(248,250,252,0.94)",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: METRIC_FONT,
  },
  proBadge: {
    color: "rgba(252,211,77,0.95)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    fontFamily: METRIC_FONT,
  },
  myRankValue: {
    marginTop: 2,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "700",
    fontFamily: METRIC_FONT,
  },
  myRankMetricValue: {
    color: "rgba(207,250,254,0.9)",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: METRIC_FONT,
  },
  podiumWrap: {
    gap: 10,
    paddingTop: 8,
  },
  podiumCard: {
    minHeight: 72,
  },
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  listRank: {
    width: 28,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: METRIC_FONT,
  },
  listMain: {
    flex: 1,
    minWidth: 0,
  },
  listNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  listName: {
    flexShrink: 1,
    color: "rgba(248,250,252,0.94)",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: METRIC_FONT,
  },
  listSub: {
    marginTop: 2,
    color: "rgba(148,163,184,0.85)",
    fontSize: 10,
    fontFamily: METRIC_FONT,
  },
  listScoreCol: {
    minWidth: 56,
    alignItems: "flex-end",
  },
  listScore: {
    color: "rgba(207,250,254,0.95)",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: METRIC_FONT,
  },
});
