import { StyleSheet, Text, View } from "react-native";
import { getWcMatchPreview } from "../../../../../../lib/wc/matchPreviews";
import type { GamesLanguage, GamesTexts } from "../gamesI18n";

type Props = {
  gameId: string;
  language: GamesLanguage;
  t: GamesTexts;
};

/** Web `WcMatchPreviewPanel` 相当 */
export default function WcMatchPreviewPanelNative({ gameId, language, t }: Props) {
  const paragraphs = getWcMatchPreview(gameId, language);

  if (!paragraphs?.length) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>{t.matchPreviewNotAvailable}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {paragraphs.map((paragraph: string, index: number) => (
        <Text
          key={index}
          style={[styles.paragraph, index === 0 ? styles.paragraphLead : null]}
        >
          {paragraph}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  emptyBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.02)",
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  emptyText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  paragraph: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    lineHeight: 21,
  },
  paragraphLead: {
    color: "rgba(255,255,255,0.9)",
  },
});
