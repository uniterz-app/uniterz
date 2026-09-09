/**
 * __DEV__ — Free が PRO LEAGUE タブを開いたときのゲート UI プレビュー。
 * 本番は RankingsHomeScreen の `openProLocked` で同じコンポーネントを表示。
 */
import { ScrollView, StyleSheet } from "react-native";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import { RankingsProLeagueTeaserNative } from "./RankingsProLeagueTeaserNative";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
  onPressSubscribe?: () => void;
};

export default function ProLeagueTeaserPreviewScreenNative({
  language,
  onClose,
  onPressSubscribe,
}: Props) {
  const isJa = language === "ja";

  return (
    <MobilePageShell
      title={isJa ? "PRO LEAGUE ゲート" : "PRO LEAGUE Gate"}
      eyebrow="DEV"
      subtitle={
        isJa
          ? "Free ユーザーが PRO LEAGUE タブを押したときの表示（モーダルではなく画面内ティーザー）"
          : "What Free users see when opening the PRO LEAGUE tab (in-page teaser, not a modal)"
      }
      onClose={onClose}
      appBackground
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <RankingsProLeagueTeaserNative
          language={language}
          onPressSubscribe={
            onPressSubscribe ??
            (() => {
              /* preview */
            })
          }
          onBackToPickUp={onClose}
        />
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 8,
    paddingBottom: 48,
    paddingTop: 8,
    flexGrow: 1,
  },
});
