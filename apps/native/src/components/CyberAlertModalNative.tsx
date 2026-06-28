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
import {
  PREDICT_OVERLAY_CYBER_FORM_CUT,
  PREDICT_OVERLAY_SUBMIT_BTN_CUT,
} from "../features/games/matchListCyberClipPath";
import { nativeBlurViewExtraProps } from "../ui/nativeBlurProps";
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
        color="rgba(56,189,248,0.65)"
      />
    );
  }
  return (
    <MaterialCommunityIcons
      name="information-outline"
      size={28}
      color="rgba(56,189,248,0.55)"
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
  const gradient =
    tone === "primary"
      ? ["rgba(0,245,255,0.22)", "rgba(0,150,190,0.34)", "rgba(0,90,120,0.42)"]
      : tone === "danger"
        ? ["rgba(248,113,113,0.18)", "rgba(190,60,60,0.28)", "rgba(120,40,40,0.34)"]
        : ["rgba(15,23,42,0.92)", "rgba(10,16,28,0.94)", "rgba(8,12,20,0.96)"];
  const border =
    tone === "primary"
      ? "rgba(0,245,255,0.38)"
      : tone === "danger"
        ? "rgba(248,113,113,0.42)"
        : "rgba(100,116,139,0.35)";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionPressable, pressed && styles.actionPressed]}
    >
      <PredictOverlayChamferedFrameNative
        cut={PREDICT_OVERLAY_SUBMIT_BTN_CUT}
        gradientColors={gradient}
        gradientLocations={[0, 0.45, 1]}
        borderColor={border}
        shadowColor={tone === "primary" ? "#00f5ff" : "#000"}
        shadowOpacity={tone === "primary" ? 0.14 : 0.08}
        shadowRadius={tone === "primary" ? 16 : 6}
        style={styles.actionFrame}
        contentStyle={styles.actionContent}
      >
        <Text
          style={[
            styles.actionLabel,
            tone === "primary" && styles.actionLabelPrimary,
            tone === "danger" && styles.actionLabelDanger,
          ]}
        >
          {label}
        </Text>
      </PredictOverlayChamferedFrameNative>
    </Pressable>
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
            gradientColors={["rgba(8,12,20,0.96)", "rgba(5,8,14,0.98)"]}
            gradientLocations={[0, 1]}
            borderColor="rgba(0,245,255,0.22)"
            shadowColor="#00f5ff"
            shadowOpacity={0.08}
            shadowRadius={24}
            style={styles.card}
            contentStyle={styles.cardContent}
          >
            <View style={styles.headerBrandRow} pointerEvents="none">
              <View style={styles.headerBrandLine} />
              <Text style={styles.headerBrandLabel}>UNITERZ</Text>
              <View style={styles.headerBrandLine} />
            </View>
            <View style={styles.iconWrap}>{variantIcon(variant)}</View>
            <Text style={styles.title}>{displayTitle}</Text>
            {showMessage ? <Text style={styles.message}>{message}</Text> : null}
            <View
              style={[
                styles.actions,
                actionButtons.length > 1 && styles.actionsMulti,
              ]}
            >
              {actionButtons.map((btn, index) => {
                const tone =
                  btn.style === "destructive"
                    ? "danger"
                    : btn.style === "cancel"
                      ? "ghost"
                      : "primary";
                return (
                  <View
                    key={`${btn.text}-${index}`}
                    style={actionButtons.length > 1 ? styles.actionCol : styles.actionFull}
                  >
                    <AlertActionButton
                      label={btn.text}
                      tone={tone}
                      onPress={() => onButtonPress(index)}
                    />
                  </View>
                );
              })}
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
  headerBrandLabel: {
    fontFamily: Platform.select({
      ios: "Oxanium_800ExtraBold",
      android: "Oxanium_800ExtraBold",
      default: "sans-serif",
    }),
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 4.8,
    color: "rgba(0,245,255,0.88)",
    textAlign: "center",
    textShadowColor: "rgba(0,245,255,0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
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
