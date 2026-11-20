/** トレードバレット採点ルール — はてなチップ + モーダル */
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import CyberHelpMarkNative from "../../../../ui/CyberHelpMarkNative";
import PredictOverlaySubmitButtonNative from "../../PredictOverlaySubmitButtonNative";
import {
  MATCH_CARD_DISPLAY_FONT,
  MATCH_CARD_METRIC_FONT,
} from "../../matchCardTypography";
import {
  tradeBallotRulesSections,
  type TradeBallotRulesLang,
} from "../../../../../../../lib/predict/tradeBallotRulesCopy";

type Props = {
  language?: TradeBallotRulesLang;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showChip?: boolean;
};

export default function TradeBallotRulesChipNative({
  language = "ja",
  open: openProp,
  onOpenChange,
  showChip = true,
}: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? Boolean(openProp) : uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (!controlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const ja = language !== "en";
  const sections = tradeBallotRulesSections(language);

  return (
    <>
      {showChip ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ja ? "採点ルール" : "Scoring rules"}
          onPress={() => setOpen(true)}
          style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
          hitSlop={6}
        >
          <CyberHelpMarkNative />
        </Pressable>
      ) : null}

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
            accessibilityLabel={ja ? "閉じる" : "Close"}
          />
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>SCORING RULES</Text>
              <Text style={styles.headerHint}>
                {ja ? "採点・報酬・日程" : "Score · prizes · schedule"}
              </Text>
            </View>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {sections.map((section) => (
                <View key={section.title} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  {section.body.split("\n").map((line) => (
                    <Text key={line} style={styles.bullet}>
                      {line}
                    </Text>
                  ))}
                </View>
              ))}
            </ScrollView>
            <View style={styles.footer}>
              <PredictOverlaySubmitButtonNative
                label={ja ? "閉じる" : "Close"}
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
  chip: { padding: 2 },
  chipPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 24,
  },
  sheet: {
    maxHeight: "88%",
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
  scroll: { flexGrow: 0 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 8, gap: 14 },
  section: { gap: 4 },
  sectionTitle: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "rgba(0,245,255,0.85)",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  bullet: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.72)",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
});
