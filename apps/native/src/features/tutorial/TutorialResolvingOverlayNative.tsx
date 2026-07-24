/**
 * Web `TutorialResolvingOverlay` 相当 — 試合終了シミュレーション中
 */
import { Modal, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "../../theme/tokens";
import { TUTORIAL_CYAN } from "../../../../../lib/tutorial/tutorialMotion";

type Props = {
  open: boolean;
  title: string;
  body: string;
  spinLabel: string;
};

export default function TutorialResolvingOverlayNative({
  open,
  title,
  body,
  spinLabel,
}: Props) {
  const insets = useSafeAreaInsets();
  if (!open) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View
        style={[
          styles.root,
          {
            paddingTop: Math.max(24, insets.top),
            paddingBottom: Math.max(24, insets.bottom),
          },
        ]}
      >
        <View style={styles.card}>
          <Text style={styles.spin}>{spinLabel}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.27)",
    backgroundColor: "rgba(7,16,24,0.96)",
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: "center",
  },
  spin: {
    fontFamily: fonts.metricExtra,
    fontSize: 13,
    letterSpacing: 3.5,
    color: TUTORIAL_CYAN,
    marginBottom: 16,
    textTransform: "uppercase",
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  body: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
});
