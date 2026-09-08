/** Web `SeasonPredictRulesChip` + `SeasonPredictRulesModal` 相当 */
import { useEffect, useState } from "react";
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
  seasonPredictRulesFootNote,
  seasonPredictRulesSections,
  type SeasonPredictRulesKind,
  type SeasonPredictRulesLang,
} from "../../../../../../../lib/predict/seasonPredictRulesCopy";

type Props = {
  kind: SeasonPredictRulesKind;
  language?: SeasonPredictRulesLang;
  accessibilityLabel?: string;
  closeLabel?: string;
  /** 制御オープン（ページのはてな / 自動表示用） */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** false のときチップを出さずモーダルのみ */
  showChip?: boolean;
};

export default function SeasonPredictRulesChipNative({
  kind,
  language = "ja",
  accessibilityLabel,
  closeLabel,
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
  const sections = seasonPredictRulesSections(kind, language);

  useEffect(() => {
    if (!controlled) return;
  }, [controlled]);

  return (
    <>
      {showChip ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            accessibilityLabel ?? (ja ? "採点ルール" : "Scoring rules")
          }
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
            accessibilityLabel={closeLabel ?? (ja ? "閉じる" : "Close")}
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
              {sections.map((section) => (
                <View key={section.title} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  {section.bullets.map((line) => (
                    <Text key={line} style={styles.bullet}>
                      · {line}
                    </Text>
                  ))}
                </View>
              ))}
              <Text style={styles.footnote}>
                {seasonPredictRulesFootNote(language)}
              </Text>
            </ScrollView>
            <View style={styles.footer}>
              <PredictOverlaySubmitButtonNative
                label={closeLabel ?? (ja ? "閉じる" : "Close")}
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
    padding: 2,
  },
  chipPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
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
    gap: 14,
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(165,243,252,0.85)",
  },
  bullet: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.75)",
  },
  footnote: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.45)",
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
});
