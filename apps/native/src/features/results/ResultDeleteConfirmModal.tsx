/**
 * Web `ResultListWithOverlay` の削除確認ポータル（ガラス＋シアン Cancel／赤 Delete）に相当。
 */
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const CYBER_CANCEL = "#38bdf8";
const DELETE_LABEL = "#ff6363";

const DISPLAY_FONT = Platform.select({
  ios: "BebasNeue_400Regular",
  android: "BebasNeue_400Regular",
  default: "BebasNeue_400Regular",
});

type Props = {
  visible: boolean;
  /** 英語 UI なら true（文言・ボタンラベル切替） */
  isEn: boolean;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ResultDeleteConfirmModal({
  visible,
  isEn,
  loading,
  onCancel,
  onConfirm,
}: Props) {
  const title = isEn ? "Delete this post?" : "本当に削除しますか";
  /** Web と同じボタン英字（サイバー見出し系） */
  const cancelLabel = "Cancel";
  const deleteLabel = "Delete";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (!loading) onCancel();
      }}
    >
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={loading ? undefined : onCancel}
          accessibilityRole="button"
          accessibilityLabel={isEn ? "Close dialog" : "ダイアログを閉じる"}
        >
          {Platform.OS === "ios" ? (
            <BlurView intensity={22} tint="dark" style={StyleSheet.absoluteFillObject} />
          ) : Platform.OS === "android" ? (
            <BlurView
              intensity={18}
              tint="dark"
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFillObject}
            />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, styles.backdropFallback]} />
          )}
          <View style={[StyleSheet.absoluteFillObject, styles.backdropTint]} />
        </Pressable>

        <View style={styles.centerWrap} pointerEvents="box-none">
          <View style={styles.dialogOuter} accessibilityRole="none">
            <LinearGradient
              colors={[
                "rgba(255,255,255,0.14)",
                "rgba(6,78,94,0.28)",
                "rgba(9,9,11,0.52)",
              ]}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.dialogRing} pointerEvents="none" />
            <View style={styles.dialogInner}>
              <Text style={styles.title}>{title}</Text>

              <View style={styles.btnRow}>
                <Pressable
                  disabled={loading}
                  onPress={onCancel}
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnCancel,
                    pressed && !loading && styles.btnCancelPressed,
                    loading && styles.btnDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={isEn ? cancelLabel : "キャンセル"}
                >
                  <MaterialCommunityIcons name="chevron-left" size={22} color="rgba(165,243,252,0.95)" />
                  <Text style={[styles.btnLabelCancel, { fontFamily: DISPLAY_FONT }]}>{cancelLabel}</Text>
                </Pressable>

                <Pressable
                  disabled={loading}
                  onPress={onConfirm}
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnDelete,
                    pressed && !loading && styles.btnDeletePressed,
                    loading && styles.btnDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={isEn ? deleteLabel : "削除"}
                >
                  <Text style={[styles.btnLabelDelete, { fontFamily: DISPLAY_FONT }]}>{deleteLabel}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(248,113,113,0.95)" />
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdropFallback: {
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  backdropTint: {
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  centerWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  dialogOuter: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 28 },
    shadowOpacity: 0.55,
    shadowRadius: 48,
    elevation: 24,
  },
  /** Web `ring-cyan-400/25` に相当 */
  dialogRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.25)",
  },
  dialogInner: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    textAlign: "center",
    color: "rgba(248,250,252,0.96)",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  btnRow: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  btn: {
    flex: 1,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 11,
    borderWidth: 2,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  btnCancel: {
    borderColor: "rgba(34,211,238,0.55)",
    justifyContent: "flex-start",
    paddingLeft: 10,
  },
  btnCancelPressed: {
    borderColor: "rgba(103,232,249,0.85)",
    backgroundColor: "rgba(6,182,212,0.22)",
  },
  btnDelete: {
    borderColor: "rgba(220,38,38,0.95)",
    justifyContent: "flex-end",
    paddingRight: 10,
    shadowColor: "rgba(220,38,38,0.45)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 8,
  },
  btnDeletePressed: {
    borderColor: "rgba(248,113,113,0.95)",
    backgroundColor: "rgba(185,28,28,0.45)",
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnLabelCancel: {
    fontSize: 17,
    letterSpacing: 2.2,
    color: CYBER_CANCEL,
    textShadowColor: "rgba(56,189,248,0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  /** Web `deleteConfirmDeleteLabelStyle` に近い発光 */
  btnLabelDelete: {
    fontSize: 17,
    letterSpacing: 2.2,
    color: DELETE_LABEL,
    textShadowColor: "rgba(255,90,90,0.9)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
