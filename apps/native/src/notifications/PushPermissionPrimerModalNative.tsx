/**
 * OS 通知許可の前説明 — CyberAlert と同系統の角切り HUD。
 */
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
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
import { pushPermissionPrimerCopy } from "../../../../lib/notifications/pushPermissionPrimerCopy";

type Props = {
  open: boolean;
  language: string;
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
  const t = pushPermissionPrimerCopy(language);

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onLater}
      statusBarTranslucent
    >
      <Pressable style={styles.root} onPress={onLater}>
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
            borderColor="rgba(0,245,255,0.28)"
            shadowColor="#00f5ff"
            shadowOpacity={0.1}
            shadowRadius={24}
            style={styles.card}
            contentStyle={styles.cardContent}
          >
            <View style={styles.headerBrandRow} pointerEvents="none">
              <View style={styles.headerBrandLine} />
              <UniterzLogoNative width={112} />
              <View style={styles.headerBrandLine} />
            </View>

            <View style={styles.iconWrap}>
              <MaterialCommunityIcons
                name="bell-ring-outline"
                size={26}
                color="rgba(0,245,255,0.78)"
              />
            </View>

            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.body}>{t.body}</Text>

            <View style={styles.signalPanel}>
              {t.signals.map((s) => (
                <View key={s.label} style={styles.signalRow}>
                  <View style={styles.signalIcon}>
                    <MaterialCommunityIcons
                      name={s.icon}
                      size={14}
                      color="rgba(103,232,249,0.95)"
                    />
                  </View>
                  <Text style={styles.signalLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.actions}>
              <ModalActionRowNative>
                <ModalActionButtonNative
                  label={t.later}
                  tone="ghost"
                  onPress={onLater}
                />
                <ModalActionButtonNative
                  label={t.allow}
                  tone="primary"
                  onPress={onAllow}
                />
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
    marginBottom: 12,
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
    marginBottom: 8,
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
  body: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    color: "rgba(148,163,184,0.94)",
    letterSpacing: 0.15,
  },
  signalPanel: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.18)",
    backgroundColor: "rgba(0,245,255,0.04)",
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 6,
  },
  signalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 28,
  },
  signalIcon: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.28)",
    backgroundColor: "rgba(0,245,255,0.08)",
  },
  signalLabel: {
    flex: 1,
    fontFamily: Platform.select({
      ios: "Oxanium_700Bold",
      android: "Oxanium_700Bold",
      default: "sans-serif",
    }),
    fontSize: 12,
    letterSpacing: 0.4,
    color: "rgba(226,232,240,0.92)",
  },
  actions: {
    marginTop: 18,
    width: "100%",
  },
});
