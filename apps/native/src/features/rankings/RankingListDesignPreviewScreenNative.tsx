/**
 * __DEV__ ランキングリスト見た目確認。現行 CyberRankingListRow のみ。
 */
import { ScrollView, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "react-native-reanimated";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import { CyberRankingListRowNative } from "./CyberRankingListRowNative";
import { METRIC_FONT } from "./rankingsUiTheme";
import { RANKING_LIST_PREVIEW_ROWS } from "./rankingListDesignPreviewMocks";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

export default function RankingListDesignPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const isJa = language === "ja";
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion() ?? false;

  return (
    <MobilePageShell
      title="RANKING LIST"
      eyebrow="DEV PREVIEW"
      subtitle={
        isJa ? "本番リスト（現行）の確認。" : "Production ranking list."
      }
      appBackground
      onClose={onClose}
    >
      <Text style={styles.note}>
        {isJa
          ? "現行 CyberRankingListRow。1位は枠の光線、変動は順位の下。"
          : "Current CyberRankingListRow. Rank-1 edge ray; delta under rank."}
      </Text>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 28 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {RANKING_LIST_PREVIEW_ROWS.map((row) => (
          <CyberRankingListRowNative
            key={row.handle}
            rank={row.rank}
            displayName={row.displayName}
            metric="totalScore"
            counted={row.score}
            posts={row.posts}
            countryCode={row.countryCode}
            language="ja"
            isPro={row.plan === "pro"}
            rankDeltaPlaces={row.rankDelta}
            animateCrown={row.rank === 1}
            pageKey="ranking-list-design-preview"
            reduceMotion={reduce}
          />
        ))}
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  note: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(226,232,240,0.62)",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 12,
  },
});
