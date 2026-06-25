import { Modal, Platform, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { nativeBlurViewExtraProps } from "../ui/nativeBlurProps";
import { GlowingRimFrame } from "./GlowingRimFrame";

export default function MaintenanceOverlayNative() {
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
          <Text style={styles.title}>メンテナンス中</Text>
          <Text style={styles.body}>
            現在、サービスを一時停止してメンテナンスを行っています。{"\n"}
            復旧までしばらくお待ちください。{"\n"}
            ご不便をおかけして申し訳ありません。
          </Text>
          <Text style={styles.bodyEn}>
            The app is temporarily unavailable for maintenance.{"\n"}
            Please check back later.
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
  bodyEn: {
    marginTop: 16,
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
