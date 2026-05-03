/**
 * 完了トースト（システム Alert の代替）。暗色ガラス＋細いシアンアクセントで抑えめに。
 */
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
  /** ボタン表記（既定 OK） */
  actionLabel?: string;
};

export default function CyberGlassToastModal({
  visible,
  title,
  message,
  onDismiss,
  actionLabel = "OK",
}: Props) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Pressable style={styles.root} onPress={onDismiss}>
        {(Platform.OS === "ios" || Platform.OS === "android") && (
          <BlurView
            pointerEvents="none"
            style={StyleSheet.absoluteFillObject}
            tint="dark"
            intensity={Platform.OS === "ios" ? 32 : 26}
            blurMethod={Platform.OS === "android" ? "dimezisBlurViewSdk31Plus" : undefined}
            blurReductionFactor={Platform.OS === "android" ? 4 : undefined}
          />
        )}
        <View style={styles.scrim} pointerEvents="none" />
        <Pressable style={styles.cardWrap} onPress={(e) => e.stopPropagation()}>
          <View style={styles.card}>
            {(Platform.OS === "ios" || Platform.OS === "android") && (
              <BlurView
                pointerEvents="none"
                style={styles.cardBlur}
                tint="dark"
                intensity={Platform.OS === "ios" ? 38 : 30}
                blurMethod={Platform.OS === "android" ? "dimezisBlurViewSdk31Plus" : undefined}
                blurReductionFactor={Platform.OS === "android" ? 4 : undefined}
              />
            )}
            <View style={styles.cardTintSolid} pointerEvents="none" />
            <LinearGradient
              colors={["rgba(255,255,255,0.06)", "rgba(255,255,255,0)", "rgba(0,0,0,0.12)"]}
              locations={[0, 0.45, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.cardSheen}
              pointerEvents="none"
            />
            <View style={styles.cardTopHairline} pointerEvents="none" />
            <View style={styles.cardBody}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={32}
                color="rgba(56,189,248,0.55)"
                style={styles.icon}
              />
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
              <Pressable
                style={({ pressed }) => [styles.okBtn, pressed && styles.okBtnPressed]}
                onPress={onDismiss}
                accessibilityRole="button"
              >
                <Text style={styles.okText}>{actionLabel}</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  cardWrap: {
    width: "100%",
    maxWidth: 300,
  },
  card: {
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(100,116,139,0.35)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.5,
        shadowRadius: 28,
      },
      android: { elevation: 12 },
      default: {},
    }),
  },
  cardBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  /** ガラス上の均す暗色（紫・マゼンは使わない） */
  cardTintSolid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,14,22,0.78)",
  },
  cardSheen: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.85,
  },
  /** 上端だけわずかにシアン（HUD の細ライン） */
  cardTopHairline: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    backgroundColor: "rgba(56,189,248,0.35)",
    zIndex: 2,
  },
  cardBody: {
    paddingTop: 22,
    paddingBottom: 20,
    paddingHorizontal: 22,
    alignItems: "center",
    zIndex: 3,
  },
  icon: {
    marginBottom: 12,
    opacity: 0.95,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "rgba(248,250,252,0.96)",
    letterSpacing: 0.8,
    fontFamily: Platform.select({
      ios: "Oxanium_700Bold",
      android: "Oxanium_700Bold",
      default: "sans-serif",
    }),
  },
  message: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    color: "rgba(148,163,184,0.92)",
    fontWeight: "400",
    letterSpacing: 0.2,
  },
  okBtn: {
    marginTop: 22,
    width: "100%",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.92)",
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.28)",
  },
  okBtnPressed: {
    backgroundColor: "rgba(15,23,42,0.88)",
    borderColor: "rgba(56,189,248,0.45)",
  },
  okText: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(226,232,240,0.96)",
    letterSpacing: 2,
    fontFamily: Platform.select({
      ios: "Oxanium_700Bold",
      android: "Oxanium_700Bold",
      default: "sans-serif",
    }),
  },
});
