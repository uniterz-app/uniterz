/**
 * Web `OfficialLpRankingScreen` / `/mobile/lp-ranking-preview` 相当。
 * 総合スコアのみ。アバター写真は出さない（グリフ）。
 */
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  LP_RANKING_METRIC,
  LP_RANKING_MY_MINI_METRICS,
  LP_RANKING_MY_PROGRESS,
  LP_RANKING_MY_RANK,
  LP_RANKING_MY_ROW,
  LP_RANKING_MY_STATS,
  LP_RANKING_MY_UID,
  LP_RANKING_MY_VALUE,
  LP_RANKING_ROWS,
  LP_RANKING_TOTAL_ENTRIES,
} from "../../../../../lib/lp/lpRankingPreviewMocks";
import type { RankingRowWithCountry } from "../../../../../lib/rankings/rankingMetrics";
import CyberMenuButton from "../../ui/CyberMenuButton";
import { useBottomTabBarInsets } from "../../navigation/useBottomTabBarInsets";
import { CyberRankingListRowNative } from "./CyberRankingListRowNative";
import { RankingsPageTitleCyberNative } from "./RankingsPageTitleCyberNative";
import { MyRankCardNative } from "./RankingsMyRankCardNative";
import { METRIC_FONT, RANKING_NAME_FONT_JA } from "./rankingsUiTheme";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

function LpRankingRowNative({
  row,
  rank,
  language,
}: {
  row: RankingRowWithCountry;
  rank: number;
  language: "ja" | "en";
}) {
  const isYou = row.uid === LP_RANKING_MY_UID;
  return (
    <View style={isYou ? styles.youRow : undefined}>
      <CyberRankingListRowNative
        rank={rank}
        displayName={row.displayName}
        photoURL={null}
        metric={LP_RANKING_METRIC}
        counted={row.totalScore ?? 0}
        posts={row.posts ?? 0}
        countryCode={row.countryCode}
        metricValueDelta={row.metricValueDelta}
        avgRow={{ avgTotalScore: row.avgTotalScore }}
        language={language}
        isPro={row.plan === "pro"}
        rankDeltaPlaces={row.rankDeltaPlaces ?? null}
      />
    </View>
  );
}

export default function LpRankingPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const { topContentPadY, bottomContentReserveY } = useBottomTabBarInsets();
  const rows = LP_RANKING_ROWS.slice(0, 10);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: topContentPadY,
            paddingBottom: bottomContentReserveY + 16,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <CyberMenuButton
            size="sm"
            accessibilityLabel={language === "ja" ? "戻る" : "Back"}
            onPress={onClose}
          />
          <View style={styles.titleCenter}>
            <RankingsPageTitleCyberNative title="Regular Season" size="sm" />
          </View>
          <View style={styles.titleSide} />
        </View>

        <MyRankCardNative
          rank={LP_RANKING_MY_RANK}
          metric={LP_RANKING_METRIC}
          value={LP_RANKING_MY_VALUE}
          displayName={LP_RANKING_MY_ROW.displayName}
          photoURL={null}
          totalPosts={LP_RANKING_MY_ROW.posts}
          language={language}
          isPro
          displayTier="pro"
          mobileWide
          rankDeltaPlaces={LP_RANKING_MY_ROW.rankDeltaPlaces ?? 0}
          totalEntries={LP_RANKING_TOTAL_ENTRIES}
          miniMetrics={LP_RANKING_MY_MINI_METRICS}
          leagueLabel="NBA"
          rankProgress={LP_RANKING_MY_PROGRESS}
          statsSource={LP_RANKING_MY_STATS}
        />

        <View style={styles.metricLabelRow}>
          <Text style={styles.metricEn}>TOTAL PTS</Text>
          <Text style={styles.metricJa}>
            {language === "ja" ? "総合スコア" : "Overall"}
          </Text>
        </View>

        <View style={styles.listPanel}>
          {rows.map((row, i) => (
            <LpRankingRowNative
              key={row.uid}
              row={row}
              rank={i + 1}
              language={language}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#05070c",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  titleCenter: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  titleSide: {
    width: 40,
    height: 40,
  },
  metricLabelRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    paddingHorizontal: 4,
    paddingTop: 10,
    paddingBottom: 6,
  },
  metricEn: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.2,
    color: "#00F5FF",
  },
  metricJa: {
    fontFamily: RANKING_NAME_FONT_JA,
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
  listPanel: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  youRow: {
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.38)",
  },
});
