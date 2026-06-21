import { useEffect } from "react";
import { View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import type { MobileMetric } from "../../../../../app/component/rankings/_data/mockRows";
import type { RankingRowWithCountry } from "../../../../../app/component/rankings/_data/mockRows";
import { getCountryCode } from "../../../../../lib/rankings/country";
import { metricNum } from "../../../../../lib/rankings/metric";
import { type RankingsLanguage } from "./rankingsTexts";
import { CyberRankingListRowNative } from "./CyberRankingListRowNative";
import { rankingsUiStyles as styles } from "./rankingsUiStyles";
import {
  RANKINGS_REST_UNLOCK_AFTER_RANK1_MS,
  rankingsPodiumCardDelayMs,
} from "./rankingsMotion";
import { useRankingsPodiumCardEntrance } from "./useRankingsPodiumCardEntrance";
import {
  useRankingsRestContainerEntrance,
  useRankingsRestRowEntrance,
} from "./useRankingsRestRowEntrance";

function RankingRowCard({
  row,
  rank,
  metric,
  language,
  onPress,
  counted,
  animateCrown = false,
  pageKey = "",
  reduceMotion = false,
}: {
  row: RankingRowWithCountry;
  rank: number;
  metric: MobileMetric;
  language: RankingsLanguage;
  onPress?: () => void;
  counted: number;
  animateCrown?: boolean;
  pageKey?: string;
  reduceMotion?: boolean;
}) {
  const countryCode = getCountryCode(row);

  return (
    <CyberRankingListRowNative
      rank={rank}
      displayName={row.displayName || row.handle || "Unknown"}
      photoURL={row.photoURL}
      metric={metric}
      counted={counted}
      posts={row.posts ?? 0}
      countryCode={countryCode}
      metricValueDelta={row.metricValueDelta}
      avgRow={{
        avgTotalScore: row.avgTotalScore,
        avgMarginPrecision: row.avgMarginPrecision,
        avgUpsetScore: row.avgUpsetScore,
      }}
      language={language}
      isPro={row.plan === "pro"}
      rankDeltaPlaces={row.rankDeltaPlaces}
      onPress={onPress}
      animateCrown={animateCrown}
      pageKey={pageKey}
      reduceMotion={reduceMotion}
    />
  );
}

function RankingsPodiumCardNative({
  row,
  rank,
  metric,
  language,
  onPress,
  pageKey,
  reduceMotion,
  onTopCountDone,
}: {
  row: RankingRowWithCountry;
  rank: 1 | 2 | 3;
  metric: MobileMetric;
  language: RankingsLanguage;
  onPress?: () => void;
  pageKey: string;
  reduceMotion: boolean;
  onTopCountDone?: () => void;
}) {
  const { n } = metricNum(row, metric);
  const { cardStyle } = useRankingsPodiumCardEntrance(rank - 1, pageKey, reduceMotion);

  useEffect(() => {
    if (rank !== 1 || !onTopCountDone) return;
    if (reduceMotion) {
      onTopCountDone();
      return;
    }
    const delayMs = rankingsPodiumCardDelayMs(0) + RANKINGS_REST_UNLOCK_AFTER_RANK1_MS;
    const id = setTimeout(onTopCountDone, delayMs);
    return () => clearTimeout(id);
  }, [rank, onTopCountDone, reduceMotion, pageKey]);

  return (
    <Animated.View style={cardStyle}>
      <RankingRowCard
        row={row}
        rank={rank}
        metric={metric}
        language={language}
        onPress={onPress}
        counted={n}
        animateCrown={rank === 1}
        pageKey={pageKey}
        reduceMotion={reduceMotion}
      />
    </Animated.View>
  );
}

function RankingsRestRowNative({
  row,
  rank,
  metric,
  language,
  onPress,
  rowIndex,
  pageKey,
  topDone,
  reduceMotion,
}: {
  row: RankingRowWithCountry;
  rank: number;
  metric: MobileMetric;
  language: RankingsLanguage;
  onPress?: () => void;
  rowIndex: number;
  pageKey: string;
  topDone: boolean;
  reduceMotion: boolean;
}) {
  const { n } = metricNum(row, metric);
  const { rowStyle } = useRankingsRestRowEntrance(
    rowIndex,
    pageKey,
    topDone,
    reduceMotion
  );

  return (
    <Animated.View style={rowStyle} pointerEvents={topDone || reduceMotion ? "auto" : "none"}>
      <RankingRowCard
        row={row}
        rank={rank}
        metric={metric}
        language={language}
        onPress={onPress}
        counted={n}
        pageKey={pageKey}
        reduceMotion={reduceMotion}
      />
    </Animated.View>
  );
}

export function RankingsTopPodiumNative({
  rows,
  metric,
  language,
  onPressProfile,
  pageKey = "",
  onTopCountDone,
}: {
  rows: RankingRowWithCountry[];
  metric: MobileMetric;
  language: RankingsLanguage;
  onPressProfile?: (row: RankingRowWithCountry) => void;
  pageKey?: string;
  onTopCountDone?: () => void;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  if (rows.length === 0) return null;

  const topRows = rows.slice(0, 3);

  return (
    <View style={styles.podiumWrap}>
      {topRows.map((row, index) => (
        <RankingsPodiumCardNative
          key={row.uid}
          row={row}
          rank={(index + 1) as 1 | 2 | 3}
          metric={metric}
          language={language}
          onPress={onPressProfile ? () => onPressProfile(row) : undefined}
          pageKey={pageKey}
          reduceMotion={reduceMotion}
          onTopCountDone={index === 0 ? onTopCountDone : undefined}
        />
      ))}
    </View>
  );
}

export function RankingsRestListNative({
  rows,
  metric,
  language,
  onPressProfile,
  pageKey,
  topDone,
}: {
  rows: RankingRowWithCountry[];
  metric: MobileMetric;
  language: RankingsLanguage;
  onPressProfile?: (row: RankingRowWithCountry) => void;
  pageKey: string;
  topDone: boolean;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const { containerStyle } = useRankingsRestContainerEntrance(
    pageKey,
    topDone,
    reduceMotion
  );

  if (rows.length === 0) return null;

  return (
    <Animated.View style={containerStyle}>
      {rows.map((row, index) => (
        <RankingsRestRowNative
          key={`${metric}-${row.uid}`}
          row={row}
          rank={index + 4}
          metric={metric}
          language={language}
          onPress={onPressProfile ? () => onPressProfile(row) : undefined}
          rowIndex={index}
          pageKey={pageKey}
          topDone={topDone}
          reduceMotion={reduceMotion}
        />
      ))}
    </Animated.View>
  );
}

export function RankingListCardNative({
  row,
  rank,
  metric,
  language,
  onPress,
}: {
  row: RankingRowWithCountry;
  rank: number;
  metric: MobileMetric;
  language: RankingsLanguage;
  onPress?: () => void;
}) {
  const { n } = metricNum(row, metric);

  return (
    <RankingRowCard
      row={row}
      rank={rank}
      metric={metric}
      language={language}
      onPress={onPress}
      counted={n}
    />
  );
}
