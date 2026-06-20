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
import WcScoringRulesNative from "./wc/WcScoringRulesNative";

type Props = {
  language: GamesLanguage;
  /** WC 予想フォームでは `wc` */
  league: "wc" | "nba";
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
          <View style={styles.card}>
            <Text style={styles.title}>{accessibilityLabel}</Text>
            <View style={styles.divider} />
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {league === "wc" ? (
                <WcScoringRulesNative language={language} variant="modal" />
              ) : (
                <Text style={styles.fallback}>
                  {language === "en"
                    ? "Full scoring rules are available on the Uniterz web app."
                    : "得点の詳細は Web 版を参照してください。"}
                </Text>
              )}
              {rulesFootNote ? (
                <Text style={styles.footnote}>{rulesFootNote}</Text>
              ) : null}
            </ScrollView>
            <Pressable
              onPress={() => setOpen(false)}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
              accessibilityRole="button"
            >
              <Text style={styles.closeBtnText}>{closeLabel}</Text>
            </Pressable>
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
    backgroundColor: "rgba(34,211,238,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  chipPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  chipIcon: {
    color: "rgba(207,250,254,0.95)",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 17,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 24,
  },
  card: {
    maxHeight: "88%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "#0c1419",
    overflow: "hidden",
  },
  title: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
    backgroundColor: "rgba(34,211,238,0.25)",
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  fallback: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    lineHeight: 19,
  },
  footnote: {
    marginTop: 4,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(34,211,238,0.3)",
    paddingLeft: 10,
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    lineHeight: 17,
  },
  closeBtn: {
    marginHorizontal: 16,
    marginBottom: 14,
    marginTop: 4,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.28)",
    backgroundColor: "rgba(34,211,238,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnPressed: {
    opacity: 0.88,
  },
  closeBtnText: {
    color: "rgba(207,250,254,0.95)",
    fontSize: 14,
    fontWeight: "700",
  },
});
