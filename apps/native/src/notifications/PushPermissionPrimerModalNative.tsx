import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { nativeBlurViewExtraProps } from "../ui/nativeBlurProps";

type Props = {
  open: boolean;
  language: "ja" | "en";
  onAllow: () => void;
  onLater: () => void;
};

/** OS 通知許可ダイアログの前に表示する説明モーダル */
export default function PushPermissionPrimerModalNative({
  open,
  language,
  onAllow,
  onLater,
}: Props) {
  const isJa = language === "ja";
  const title = isJa ? "試合・結果・ランキングをお知らせ" : "Stay in the loop";
  const body = isJa
    ? "予想した試合の開始前、結果確定、本日のランキング更新をプッシュでお知らせします。通知の種類はあとから設定で変更できます。"
    : "Get notified before your predicted matches start, when results are confirmed, and when today's rankings update. You can change notification types anytime in Settings.";
  const allowLabel = isJa ? "通知を許可" : "Allow notifications";
  const laterLabel = isJa ? "あとで" : "Not now";

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onLater}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onLater}>
          {(Platform.OS === "ios" || Platform.OS === "android") && (
            <BlurView
              intensity={Platform.OS === "ios" ? 12 : 8}
              tint="dark"
              {...nativeBlurViewExtraProps()}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          <View style={styles.backdropDim} />
        </Pressable>

        <View style={styles.card}>
          <LinearGradient
            colors={[
              "rgba(255,255,255,0.08)",
              "rgba(255,255,255,0.03)",
              "rgba(5,8,20,0.88)",
            ]}
            locations={[0, 0.42, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="bell-ring-outline"
              size={22}
              color="rgba(103,232,249,0.95)"
            />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
            onPress={onAllow}
            accessibilityRole="button"
          >
            <Text style={styles.primaryBtnText}>{allowLabel}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
            onPress={onLater}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryBtnText}>{laterLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  backdropDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,6,23,0.55)",
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.28)",
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 16,
    overflow: "hidden",
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.35)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(6,182,212,0.08)",
  },
  title: {
    color: "rgba(248,250,252,0.96)",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  body: {
    color: "rgba(203,213,225,0.88)",
    fontSize: 13,
    lineHeight: 20,
  },
  primaryBtn: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.55)",
    backgroundColor: "rgba(6,182,212,0.18)",
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "rgba(236,254,255,0.96)",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  secondaryBtn: {
    paddingVertical: 8,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "rgba(148,163,184,0.9)",
    fontSize: 13,
    fontWeight: "600",
  },
});
