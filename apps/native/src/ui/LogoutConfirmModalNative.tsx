import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ModalActionButtonNative,
  ModalActionRowNative,
} from "./ModalActionButtonNative";
import { nativeBlurViewExtraProps } from "./nativeBlurProps";
import {
  PROFILE_SHELL_GRID_NATIVE,
  profileShellGridPathD,
} from "../features/profile/profileShellGridNative";
import Svg, { Defs, Pattern, Rect, Path as SvgPath } from "react-native-svg";
import { useId } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  language?: "ja" | "en";
  /** 親 Modal 内に重ねる（RN の二重 Modal 回避） */
  embedded?: boolean;
};

function LogoutConfirmBody({
  onClose,
  onConfirm,
  title,
  cancelLabel,
  confirmLabel,
  gridPatternId,
}: {
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  cancelLabel: string;
  confirmLabel: string;
  gridPatternId: string;
}) {
  return (
    <>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose}>
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

      <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
        <Svg
          width="100%"
          height="100%"
          style={[StyleSheet.absoluteFillObject, { opacity: PROFILE_SHELL_GRID_NATIVE.layerOpacity * 0.32 }]}
          pointerEvents="none"
        >
          <Defs>
            <Pattern
              id={`logout_grid_${gridPatternId}`}
              width={PROFILE_SHELL_GRID_NATIVE.cellPx}
              height={PROFILE_SHELL_GRID_NATIVE.cellPx}
              patternUnits="userSpaceOnUse"
            >
              <SvgPath
                d={profileShellGridPathD(PROFILE_SHELL_GRID_NATIVE.cellPx)}
                fill="none"
                stroke={PROFILE_SHELL_GRID_NATIVE.stroke}
                strokeWidth={PROFILE_SHELL_GRID_NATIVE.strokeWidth}
              />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#logout_grid_${gridPatternId})`} />
        </Svg>

        <View style={styles.iconWrap}>
          <View style={styles.iconSlot}>
            <MaterialCommunityIcons name="logout" size={18} color="rgba(248,113,113,0.95)" />
          </View>
        </View>

        <Text style={styles.title}>{title}</Text>

        <ModalActionRowNative>
          <ModalActionButtonNative label={cancelLabel} tone="ghost" onPress={onClose} />
          <ModalActionButtonNative label={confirmLabel} tone="danger" onPress={onConfirm} />
        </ModalActionRowNative>
      </Pressable>
    </>
  );
}

/** Web `LogoutConfirmModal` 相当 */
export default function LogoutConfirmModalNative({
  open,
  onClose,
  onConfirm,
  language = "ja",
  embedded = false,
}: Props) {
  const isJa = language === "ja";
  const gridPatternId = useId().replace(/[^a-zA-Z0-9_]/g, "_");

  const title = isJa ? "ログアウトしますか？" : "Are you sure you want to log out?";
  const cancelLabel = isJa ? "キャンセル" : "Cancel";
  const confirmLabel = isJa ? "ログアウト" : "Log out";

  if (!open) return null;

  const body = (
    <LogoutConfirmBody
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      cancelLabel={cancelLabel}
      confirmLabel={confirmLabel}
      gridPatternId={gridPatternId}
    />
  );

  if (embedded) {
    return <View style={styles.embeddedOverlay}>{body}</View>;
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>{body}</View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  embeddedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 20,
    elevation: 20,
  },
  backdropDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  card: {
    width: "90%",
    maxWidth: 384,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    padding: 24,
    backgroundColor: "#000000",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.55,
        shadowRadius: 44,
      },
      android: { elevation: 24 },
      default: {},
    }),
  },
  iconWrap: {
    alignItems: "center",
    marginBottom: 16,
  },
  iconSlot: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
  },
  btnCancelText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "600",
  },
  btnConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#dc2626",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(252,165,165,0.35)",
  },
  btnConfirmText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
