/** Web `RedemptionApplyFlowModal` 相当 */
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { redemptionApplyFlowCopy } from "../../../../../../lib/redemption/redemptionApplyFlowCopy";
import PredictOverlaySubmitButtonNative from "../../games/PredictOverlaySubmitButtonNative";

type Props = {
  open: boolean;
  language: string;
  onClose: () => void;
};

export default function RedemptionApplyFlowModalNative({
  open,
  language,
  onClose,
}: Props) {
  const copy = redemptionApplyFlowCopy(language);

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.flowLabel}>FLOW</Text>
            <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          </View>
          <Text style={styles.title}>{copy.title}</Text>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollInner}
            showsVerticalScrollIndicator={false}
          >
            {copy.sections.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.bullets.map((line) => (
                  <Text key={line} style={styles.bullet}>
                    · {line}
                  </Text>
                ))}
              </View>
            ))}
          </ScrollView>
          <View style={styles.footer}>
            <PredictOverlaySubmitButtonNative
              label={copy.close}
              enabled
              onPress={onClose}
            />
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    paddingBottom: 4,
  },
  flowLabel: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 22,
    color: "#fff",
    letterSpacing: 1.4,
  },
  eyebrow: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  scroll: { flexGrow: 0 },
  scrollInner: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 14,
  },
  section: { gap: 6 },
  sectionTitle: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(165,243,252,0.85)",
  },
  bullet: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.75)",
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
});
