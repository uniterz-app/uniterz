/**
 * システム Alert 代替 — 角切り octagon + シアン HUD（予想オーバーレイ系と同系統）。
 */
import { type ReactNode, useMemo } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import PredictOverlayChamferedFrameNative from "../features/games/PredictOverlayChamferedFrameNative";
import UniterzLogoNative from "../features/profile/UniterzLogoNative";
import { PREDICT_OVERLAY_CYBER_FORM_CUT } from "../features/games/matchListCyberClipPath";
import { nativeBlurViewExtraProps } from "../ui/nativeBlurProps";
import {
  ModalActionButtonNative,
  ModalActionRowNative,
} from "../ui/ModalActionButtonNative";
import type { CyberAlertButton, CyberAlertVariant } from "./cyberAlertTypes";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  buttons: CyberAlertButton[];
  variant: CyberAlertVariant;
  onDismiss: () => void;
  onButtonPress: (index: number) => void;
};

function variantIcon(variant: CyberAlertVariant): ReactNode {
  if (variant === "success") {
    return (
      <MaterialCommunityIcons
        name="check-decagram-outline"
        size={28}
        color="rgba(0,245,255,0.72)"
      />
    );
  }
  if (variant === "error") {
    return (
      <MaterialCommunityIcons
        name="alert-octagon-outline"
        size={28}
        color="rgba(248,113,113,0.82)"
      />
    );
  }
  if (variant === "confirm") {
    return (
      <MaterialCommunityIcons
        name="help-rhombus-outline"
        size={28}
        color="rgba(251,191,36,0.9)"
      />
    );
  }
  return (
    <MaterialCommunityIcons
      name="information-outline"
      size={28}
      color="rgba(0,245,255,0.72)"
    />
  );
}

function AlertActionButton({
  label,
  tone,
  onPress,
}: {
  label: string;
  tone: "primary" | "ghost" | "danger";
  onPress: () => void;
}) {
  return (
    <ModalActionButtonNative label={label} tone={tone} onPress={onPress} />
  );
}

export default function CyberAlertModalNative({
  visible,
  title,
  message,
  buttons,
  variant,
  onDismiss,
  onButtonPress,
}: Props) {
  const displayTitle = title.trim() || (variant === "error" ? "ERROR" : "NOTICE");
  const showMessage = message.trim().length > 0;
  const isConfirm = variant === "confirm";
  const frameBorder = isConfirm
    ? "rgba(251,191,36,0.42)"
    : variant === "error"
      ? "rgba(248,113,113,0.35)"
      : "rgba(0,245,255,0.22)";
  const frameShadow = isConfirm
    ? "#fbbf24"
    : variant === "error"
      ? "#f87171"
      : "#00f5ff";
  const actionButtons = useMemo(() => {
    if (buttons.length === 0) {
      return [{ text: "OK", style: "default" as const, onPress: undefined }];
    }
    return buttons;
  }, [buttons]);

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
            intensity={Platform.OS === "ios" ? 28 : 22}
            {...nativeBlurViewExtraProps()}
          />
        )}
        <View style={styles.scrim} pointerEvents="none" />
        <Pressable style={styles.cardWrap} onPress={(e) => e.stopPropagation()}>
          <PredictOverlayChamferedFrameNative
            cut={PREDICT_OVERLAY_CYBER_FORM_CUT}
            gradientColors={["#000000", "#000000"]}
            gradientLocations={[0, 1]}
            borderColor={frameBorder}
            shadowColor={frameShadow}
            shadowOpacity={isConfirm ? 0.16 : 0.08}
            shadowRadius={24}
            style={styles.card}
            contentStyle={styles.cardContent}
          >
            <View style={styles.headerBrandRow} pointerEvents="none">
              <View style={styles.headerBrandLine} />
              <UniterzLogoNative width={112} />
              <View style={styles.headerBrandLine} />
            </View>
            <View style={styles.iconWrap}>{variantIcon(variant)}</View>
            <Text style={styles.title}>{displayTitle}</Text>
            {showMessage ? <Text style={styles.message}>{message}</Text> : null}
            <View style={styles.actions}>
              <ModalActionRowNative>
                {actionButtons.map((btn, index) => {
                  const tone =
                    btn.style === "destructive"
                      ? "danger"
                      : btn.style === "cancel"
                        ? "ghost"
                        : "primary";
                  return (
                    <AlertActionButton
                      key={`${btn.text}-${index}`}
                      label={btn.text}
                      tone={tone}
                      onPress={() => onButtonPress(index)}
                    />
                  );
                })}
              </ModalActionRowNative>
            </View>
          </PredictOverlayChamferedFrameNative>
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
    paddingHorizontal: 24,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.62)",
  },
  cardWrap: {
    width: "100%",
    maxWidth: 320,
  },
  card: {
    width: "100%",
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
    alignItems: "stretch",
  },
  headerBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 14,
    width: "100%",
  },
  headerBrandLine: {
    flex: 1,
    maxWidth: 52,
    height: 1,
    backgroundColor: "rgba(0,245,255,0.55)",
    shadowColor: "#00f5ff",
    shadowOpacity: 0.65,
    shadowRadius: 8,
  },
  iconWrap: {
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontFamily: Platform.select({
      ios: "Oxanium_700Bold",
      android: "Oxanium_700Bold",
      default: "sans-serif",
    }),
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(248,250,252,0.96)",
    textAlign: "center",
  },
  message: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    color: "rgba(148,163,184,0.94)",
    letterSpacing: 0.15,
  },
  actions: {
    marginTop: 20,
    width: "100%",
  },
  actionsMulti: {
    flexDirection: "row",
    gap: 8,
  },
  actionFull: {
    width: "100%",
  },
  actionCol: {
    flex: 1,
    minWidth: 0,
  },
  actionPressable: {
    width: "100%",
  },
  actionPressed: {
    opacity: 0.78,
  },
  actionFrame: {
    width: "100%",
  },
  actionContent: {
    paddingVertical: 11,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontFamily: Platform.select({
      ios: "Oxanium_700Bold",
      android: "Oxanium_700Bold",
      default: "sans-serif",
    }),
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.8,
    color: "rgba(226,232,240,0.88)",
    textAlign: "center",
  },
  actionLabelPrimary: {
    color: "rgba(224,254,255,0.96)",
  },
  actionLabelDanger: {
    color: "rgba(254,202,202,0.96)",
  },
});
