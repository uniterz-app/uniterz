import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { GamesLanguage } from "./gamesI18n";
import PredictionScoringRulesBodyNative from "./PredictionScoringRulesBodyNative";
import {
  MATCH_CARD_DISPLAY_FONT,
  MATCH_CARD_METRIC_FONT,
} from "./matchCardTypography";
import PredictOverlaySubmitButtonNative from "./PredictOverlaySubmitButtonNative";

type Props = {
  language: GamesLanguage;
  league: "nba" | "wc";
  accessibilityLabel: string;
  closeLabel: string;
  rulesFootNote?: string;
};

/** Web `PredictionScoringRulesChip` + `PredictionScoringRulesModal` 相当 */
export default function PredictionScoringRulesChipNative({
  language,
  league,
  accessibilityLabel,
  closeLabel,
  rulesFootNote,
}: Props) {
  const [open, setOpen] = useState(false);
  const ja = language !== "en";

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
        hitSlop={6}
      >
        <Text style={styles.chipIcon}>?</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
          />
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>SCORING RULES</Text>
              <Text style={styles.headerHint}>
                {ja ? "採点ルール" : "How points are scored"}
              </Text>
            </View>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <PredictionScoringRulesBodyNative
                language={language}
                league={league}
              />
              {rulesFootNote ? (
                <Text style={styles.footnote}>{rulesFootNote}</Text>
              ) : null}
            </ScrollView>
            <View style={styles.footer}>
              <PredictOverlaySubmitButtonNative
                label={closeLabel}
                enabled
                onPress={() => setOpen(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    position: "absolute",
    right: 4,
    top: 4,
    zIndex: 10,
    width: 28,
    height: 28,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.45)",
    backgroundColor: "rgba(0,245,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  chipPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  chipIcon: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    color: "rgba(224,255,255,0.95)",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 16,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 24,
  },
  sheet: {
    maxHeight: "88%",
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.22)",
    backgroundColor: "#05080c",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 22,
    lineHeight: 24,
    fontWeight: "400",
    letterSpacing: 1.4,
    color: "#fff",
    textTransform: "uppercase",
    includeFontPadding: false,
    transform: [{ skewX: "-6deg" }],
  },
  headerHint: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  footnote: {
    marginTop: 8,
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
});
