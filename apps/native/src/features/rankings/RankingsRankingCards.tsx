import { View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import type { MobileMetric } from "../../../../../app/component/rankings/_data/mockRows";
import type { RankingRowWithCountry } from "../../../../../app/component/rankings/_data/mockRows";
import { getCountryCode } from "../../../../../lib/rankings/country";
import { metricNum } from "../../../../../lib/rankings/metric";
import { type RankingsLanguage } from "./rankingsTexts";
import { CyberRankingListRowNative } from "./CyberRankingListRowNative";
import RankingsPodiumEntranceRowNative from "./RankingsPodiumEntranceRowNative";
import { rankingsUiStyles as styles } from "./rankingsUiStyles";

function RankingRowCard({
  row,
  rank,
  metric,
  language,
  onPress,
  animateCrown = false,
  pageKey = "",
  reduceMotion = false,
}: {
  row: RankingRowWithCountry;
  rank: number;
  metric: MobileMetric;
  language: RankingsLanguage;
  onPress?: () => void;
  animateCrown?: boolean;
  pageKey?: string;
  reduceMotion?: boolean;
}) {
  const countryCode = getCountryCode(row);
  const { n } = metricNum(row, metric);

  return (
    <CyberRankingListRowNative
      rank={rank}
      displayName={row.displayName || row.handle || "Unknown"}
      photoURL={row.photoURL}
      metric={metric}
      counted={n}
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

export function RankingsTopPodiumNative({
  rows,
  metric,
  language,
  onPressProfile,
  entranceKey,
}: {
  rows: RankingRowWithCountry[];
  metric: MobileMetric;
  language: RankingsLanguage;
  onPressProfile?: (row: RankingRowWithCountry) => void;
  entranceKey: string | number;
}) {
  const reduced = useReducedMotion() ?? false;
  if (rows.length === 0) return null;
  const pageKey = String(entranceKey);
  return (
    <View style={styles.podiumWrap}>
      {rows.slice(0, 3).map((row, index) => {
        const rank = (index + 1) as 1 | 2 | 3;
        return (
          <RankingsPodiumEntranceRowNative
            key={row.uid}
            rank={rank}
            entranceKey={entranceKey}
          >
            <RankingRowCard
              row={row}
              rank={rank}
              metric={metric}
              language={language}
              onPress={onPressProfile ? () => onPressProfile(row) : undefined}
              animateCrown={rank === 1}
              pageKey={pageKey}
              reduceMotion={reduced}
            />
          </RankingsPodiumEntranceRowNative>
        );
      })}
    </View>
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
  return (
    <RankingRowCard
      row={row}
      rank={rank}
      metric={metric}
      language={language}
      onPress={onPress}
    />
  );
}
