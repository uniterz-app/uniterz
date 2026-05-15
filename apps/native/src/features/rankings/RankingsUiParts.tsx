import { useId } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, Path, Pattern, Rect } from "react-native-svg";
import type { MobileMetric } from "../../../../../app/component/rankings/_data/mockRows";
import type { RankingRowWithCountry } from "../../../../../app/component/rankings/_data/mockRows";
import type { PlayoffRoundKey } from "../../../../../lib/rankings/playoffRound";
import { FLAG_SRC, getCountryCode } from "../../../../../lib/rankings/country";
import { metricNum, getMetricSubText } from "../../../../../lib/rankings/metric";
import { formatMetricDecimals } from "../../../../../lib/format/metricDecimals";
import { metricLabel, rankingsTexts, type RankingsLanguage } from "./rankingsTexts";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";

const METRIC_FONT = Platform.select({
  ios: "Oxanium_700Bold",
  android: "Oxanium_700Bold",
  default: "sans-serif",
});

/** Web `ShellGridOverlay` / `PROFILE_SHELL_GRID_STYLE` に相当（22px 方眼） */
function RankingsShellGridOverlay({ borderRadius = 0 }: { borderRadius?: number }) {
  const raw = useId();
  const pid = `sg${raw.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        { borderRadius, overflow: "hidden", opacity: 0.32 },
      ]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern
            id={pid}
            x="0"
            y="0"
            width="22"
            height="22"
            patternUnits="userSpaceOnUse"
          >
            <Path
              d="M 22 0 L 0 0 0 22"
              stroke="rgba(148,163,184,0.14)"
              strokeWidth={1}
              fill="none"
            />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${pid})`} />
      </Svg>
    </View>
  );
}

/** Web `RankingCard` の `FadedFlagBg` に近い右側フラグ装飾 */
function FadedFlagRanking({
  rank,
  countryCode,
}: {
  rank: number;
  countryCode?: string;
}) {
  const apiBase = getUniterzApiBaseUrl();
  const src =
    countryCode && apiBase ? `${apiBase}${FLAG_SRC[countryCode]}` : undefined;
  if (!src) return null;
  const listRow = rank > 3;
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: listRow ? "38%" : "34%",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          flex: 1,
          width: "92%",
          marginVertical: "2%",
          opacity: listRow ? 0.62 : 0.42,
          justifyContent: "center",
          alignItems: "flex-end",
        }}
      >
        <Image
          source={{ uri: src }}
          resizeMode="contain"
          style={{
            width: "100%",
            height: "100%",
            opacity: 0.95,
          }}
        />
      </View>
    </View>
  );
}

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
      <View style={[StyleSheet.absoluteFillObject, { borderRadius: 14, overflow: "hidden" }]}>
        <RankingsShellGridOverlay borderRadius={14} />
      </View>
      <View style={styles.myRankForeground}>
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
        <Text style={[styles.myRankMetricValue, styles.myRankMetricRight]} numberOfLines={1}>
          {valueText}
        </Text>
      </View>
      </View>
    </LinearGradient>
  );
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
  const t = rankingsTexts(language);
  const tone =
    rank === 1
      ? { border: "rgba(255,215,90,0.35)", rank: "#FFD65A" }
      : rank === 2
        ? { border: "rgba(230,235,245,0.28)", rank: "#E9EDF6" }
        : rank === 3
          ? { border: "rgba(205,127,50,0.28)", rank: "#D59A5A" }
          : { border: "rgba(255,255,255,0.14)", rank: "rgba(248,250,252,0.95)" };

  const countryCode = getCountryCode(row);
  const isTop3 = podium;
  const { n } = metricNum(row, metric);
  const mainDisplay =
    metric === "winRate"
      ? `${Math.round(n)}`
      : metric === "streak"
        ? `${Math.round(n)}`
        : formatMetricDecimals(n, 1);
  const subLine = getMetricSubText(row, metric, language);

  const scoreColor =
    rank === 1 ? "#FFD65A" : rank === 2 ? "#E9EDF6" : rank === 3 ? "#D59A5A" : "rgba(255,255,255,0.92)";

  const rankNumSize = rank === 1 ? 32 : isTop3 ? 28 : 20;
  const scoreMainSize = rank === 1 ? 30 : isTop3 ? 26 : 20;
  const scoreSuffixSize = rank === 1 ? 14 : isTop3 ? 12 : 10;

  return (
    <LinearGradient
      colors={["rgba(255,255,255,0.095)", "rgba(255,255,255,0.04)", "rgba(8,13,24,0.88)"]}
      locations={[0, 0.44, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[
        styles.listCardOuter,
        { borderColor: tone.border },
        isTop3 ? styles.podiumCardDims : styles.listCardDims,
      ]}
    >
      <RankingsShellGridOverlay borderRadius={0} />
      <FadedFlagRanking rank={rank} countryCode={countryCode} />
      <View
        style={[
          styles.listCardForeground,
          { paddingVertical: isTop3 ? 12 : 10 },
        ]}
      >
        <Text style={[styles.listRank, { color: tone.rank, fontSize: rankNumSize }]}>{rank}</Text>
        <RankingsAvatarNative
          photoURL={row.photoURL}
          label={row.displayName || row.handle}
          size={isTop3 ? 42 : 36}
        />
        <View style={styles.listMain}>
          <View style={styles.listNameRow}>
            <Text
              style={[styles.listName, isTop3 ? styles.listNamePodium : null]}
              numberOfLines={1}
            >
              {row.displayName || row.handle || "Unknown"}
            </Text>
            {row.plan === "pro" ? <Text style={styles.proBadge}>PRO</Text> : null}
          </View>
        </View>
        <View style={[styles.listValueOuter, isTop3 ? styles.listValueOuterPodium : null]}>
          <View style={[styles.listValueCol, isTop3 ? styles.listValueColPodium : null]}>
            <View style={[styles.listScoreRow, isTop3 ? styles.listScoreRowPodium : null]}>
              <Text
                style={[
                  styles.listScoreMain,
                  { fontSize: scoreMainSize, color: scoreColor },
                ]}
              >
                {mainDisplay}
              </Text>
              {metric === "winRate" ? (
                <Text style={[styles.listScoreSuffix, { fontSize: scoreSuffixSize, color: scoreColor }]}>
                  %
                </Text>
              ) : metric === "streak" ? (
                <Text style={[styles.listScoreSuffix, { fontSize: scoreSuffixSize, color: scoreColor }]}>
                  {t.streakShort}
                </Text>
              ) : (
                <Text style={[styles.listScoreSuffix, { fontSize: scoreSuffixSize, color: scoreColor }]}>
                  {t.pts}
                </Text>
              )}
            </View>
            <Text style={styles.listSubRight} numberOfLines={1}>
              {subLine}
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
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
    overflow: "hidden",
  },
  myRankForeground: {
    zIndex: 1,
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
  myRankMetricRight: {
    marginLeft: "auto",
    textAlign: "right",
    flexShrink: 0,
  },
  podiumWrap: {
    gap: 10,
    paddingTop: 8,
  },
  listCardOuter: {
    borderRadius: 0,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  listCardDims: {
    minHeight: 52,
  },
  podiumCardDims: {
    minHeight: 76,
  },
  listCardForeground: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    zIndex: 2,
  },
  listRank: {
    width: 32,
    textAlign: "center",
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
  listNamePodium: {
    fontSize: 16,
  },
  listValueOuter: {
    flexShrink: 0,
    minWidth: 104,
    maxWidth: "48%",
    paddingLeft: 4,
    justifyContent: "center",
  },
  listValueOuterPodium: {
    minWidth: 84,
    maxWidth: "40%",
    alignItems: "center",
  },
  listValueCol: {
    alignItems: "flex-end",
    gap: 3,
    width: "100%",
  },
  listValueColPodium: {
    alignItems: "center",
  },
  listScoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "nowrap",
    justifyContent: "flex-end",
    gap: 2,
  },
  listScoreRowPodium: {
    justifyContent: "center",
  },
  listScoreMain: {
    fontWeight: "700",
    fontFamily: METRIC_FONT,
  },
  listScoreSuffix: {
    fontWeight: "700",
    fontFamily: METRIC_FONT,
    marginLeft: 1,
  },
  listSubRight: {
    fontSize: 10,
    lineHeight: 13,
    color: "rgba(148,163,184,0.9)",
    fontFamily: METRIC_FONT,
    textAlign: "right",
    maxWidth: "100%",
  },
});
