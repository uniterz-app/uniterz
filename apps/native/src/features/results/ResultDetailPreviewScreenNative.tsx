/**
 * __DEV__ リザルト詳細プレビュー（TOP SCORER / 得点上位 / 内訳）。
 * 本番と同じ `ResultDetailScreen` + design mock postId。
 */
import { View, StyleSheet } from "react-native";
import ResultDetailScreen from "./ResultDetailScreen";
import { RESULT_DETAIL_DESIGN_PREVIEW_POST_ID } from "../../../../../lib/tutorial/tutorialNbaUi";
import type { Language } from "../../../../../lib/i18n/language";

type Props = {
  language: Language;
  onClose: () => void;
};

export default function ResultDetailPreviewScreenNative({
  language,
  onClose,
}: Props) {
  return (
    <View style={styles.root}>
      <ResultDetailScreen
        visible
        postId={RESULT_DETAIL_DESIGN_PREVIEW_POST_ID}
        language={language}
        onClose={onClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050508",
  },
});
