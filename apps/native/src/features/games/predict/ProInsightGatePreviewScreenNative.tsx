/**
 * __DEV__ — Free が PRO INSIGHT を開いたときのゲート UI プレビュー。
 * 本番は NbaPredictToolsTabsNative の Free 時 `PredictProBriefPanelNative locked`。
 * ゲート下に実際の Insight 画面例を出す。
 */
import { ScrollView, StyleSheet, View } from "react-native";
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import PredictProBriefPanelNative from "./PredictProBriefPanelNative";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
  onPressSubscribe?: () => void;
};

export default function ProInsightGatePreviewScreenNative({
  language,
  onClose,
  onPressSubscribe,
}: Props) {
  const isJa = language === "ja";
  const { bottomContentReserveY } = useBottomTabBarInsets();

  return (
    <MobilePageShell
      title={isJa ? "PRO INSIGHT ゲート" : "PRO INSIGHT Gate"}
      eyebrow="DEV"
      subtitle={
        isJa
          ? "Free 向けゲート。下に Insight の表示イメージ（例）"
          : "Free gate with an example Insight preview below"
      }
      onClose={onClose}
      appBackground
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: bottomContentReserveY + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <PredictProBriefPanelNative
            brief={null}
            language={language}
            homeTeamId="nba-lakers"
            awayTeamId="nba-celtics"
            homeTeamName={isJa ? "レイカーズ" : "Lakers"}
            awayTeamName={isJa ? "セルティックス" : "Celtics"}
            locked
            onPressUpgrade={
              onPressSubscribe ??
              (() => {
                /* preview */
              })
            }
          />
        </View>
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 8,
    paddingTop: 8,
    flexGrow: 1,
  },
  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
});
