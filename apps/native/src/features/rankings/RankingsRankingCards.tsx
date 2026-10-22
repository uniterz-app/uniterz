import { View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import type { MobileMetric } from "../../../../../lib/rankings/rankingMetrics";
import type { RankingRowWithCountry } from "../../../../../lib/rankings/rankingMetrics";
import { getCountryCode } from "../../../../../lib/rankings/country";
import { metricNum } from "../../../../../lib/rankings/metric";
import { rankingRowProSkinVariant } from "../../../../../lib/rankings/rankingRowProSkinVariant";
import { type RankingsLanguage } from "./rankingsTexts";
import { CyberRankingListRowNative } from "./CyberRankingListRowNative";
import RankingRowCommentNative from "./RankingRowCommentNative";
import RankingsPodiumEntranceRowNative from "./RankingsPodiumEntranceRowNative";
import { rankingDisplayRank } from "../../../../../lib/rankings/rankingDisplayRank";
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
  const isPro = row.plan === "pro";
  const proSkinVariant = rankingRowProSkinVariant(
    row.plan,
    row.planProBgVariant
  );

  return (
    <>
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
      isPro={isPro}
      rankDeltaPlaces={row.rankDeltaPlaces}
      onPress={onPress}
      animateCrown={animateCrown}
      pageKey={pageKey}
      reduceMotion={reduceMotion}
      proSkinVariant={proSkinVariant}
      proSkinIntensity="subtle"
    />
    <RankingRowCommentNative comment={row.rankingComment} align="list" />
    </>
  );
}

export function RankingsTopPodiumNative({
  rows,
  metric,
  language,
  onPressProfile,
  entranceKey,
  entranceActive = true,
}: {
  rows: RankingRowWithCountry[];
  metric: MobileMetric;
  language: RankingsLanguage;
  onPressProfile?: (row: RankingRowWithCountry) => void;
  entranceKey: string | number;
  /** false のあいだ入場を始めない（常時マウントのタブ用） */
  entranceActive?: boolean;
}) {
  const reduced = useReducedMotion() ?? false;
  if (rows.length === 0) return null;
  /** 王冠は表示中だけ入場を判断する（非表示中はカードごと隠れている） */
  const pageKey = entranceActive ? String(entranceKey) : "";
  return (
    <View style={styles.podiumWrap}>
      {rows.slice(0, 3).map((row, index) => {
        const rank = rankingDisplayRank(row, index);
        const entranceRank = (rank <= 1 ? 1 : rank === 2 ? 2 : 3) as 1 | 2 | 3;
        return (
          <RankingsPodiumEntranceRowNative
            key={row.uid}
            rank={entranceRank}
            entranceKey={entranceKey}
            active={entranceActive}
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
  return (
    <RankingRowCard
      row={row}
      rank={rank}
      metric={metric}
      language={language}
      onPress={onPress}
      animateCrown={animateCrown}
      pageKey={pageKey}
      reduceMotion={reduceMotion}
    />
  );
}
