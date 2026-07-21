import { Modal, Platform, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { nativeBlurViewExtraProps } from "../ui/nativeBlurProps";
import { GlowingRimFrame } from "./GlowingRimFrame";

/** Web `NbaSeasonRestartMaintenanceOverlay` 相当 */
export default function NbaSeasonRestartMaintenanceOverlayNative() {
  return (
    <Modal
      transparent
      animationType="fade"
      visible
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={styles.root}>
        {(Platform.OS === "ios" || Platform.OS === "android") && (
          <BlurView
            pointerEvents="none"
            style={StyleSheet.absoluteFillObject}
            tint="dark"
            intensity={Platform.OS === "ios" ? 36 : 28}
            {...nativeBlurViewExtraProps()}
          />
        )}
        <View style={styles.scrim} pointerEvents="none" />
        <GlowingRimFrame style={styles.card} radius={16}>
          <Text style={styles.title}>再開のお知らせ</Text>
          <Text style={styles.body}>
            遊んでくれてありがとうございます。{"\n\n"}
            NBA 26-27シーズンの開幕に向けて、もっといいユーザー体験を提供できるよう開発を進めています。
            {"\n\n"}
            再開の時期はまた動画やXで告知します。
          </Text>
        </GlowingRimFrame>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  card: {
    width: "100%",
    maxWidth: 360,
    paddingHorizontal: 22,
    paddingVertical: 24,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 14,
  },
  body: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
});
