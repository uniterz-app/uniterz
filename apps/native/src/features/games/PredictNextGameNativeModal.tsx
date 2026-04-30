import { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing } from "../../theme/tokens";
import JerseyMarkAdaptive from "./JerseyMarkAdaptive";

type Palette = { primary: string; secondary: string };

type PredictNextGameNativeModalProps = {
  visible: boolean;
  title: string;
  sub: string;
  /** 中継カード上段（例: NEXT GAME / 次の試合） */
  deckLabel: string;
  skipLabel: string;
  /** はい ボタン */
  primaryButtonLabel: string;
  /** いいえ ボタン */
  secondaryButtonLabel: string;
  homeTitle: string;
  awayTitle: string;
  /** 例 19:00 */
  kickoff: string;
  homePalette: Palette;
  awayPalette: Palette;
  onYes: (dontShowAgain: boolean) => void;
  onNo: (dontShowAgain: boolean) => void;
};

/** モバイル Web `PredictNextGameModal` 相当：投稿直後の「次の試合も予想」 */
export default function PredictNextGameNativeModal({
  visible,
  title,
  sub,
  deckLabel,
  skipLabel,
  primaryButtonLabel,
  secondaryButtonLabel,
  onYes,
  onNo,
  homeTitle,
  awayTitle,
  kickoff,
  homePalette,
  awayPalette,
}: PredictNextGameNativeModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (visible) setDontShowAgain(false);
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => onNo(dontShowAgain)}
    >
      <View style={s.root}>
        {(Platform.OS === "ios" || Platform.OS === "android") && (
          <BlurView
            intensity={Platform.OS === "ios" ? 28 : 22}
            tint="dark"
            {...(Platform.OS === "android"
              ? {
                  blurMethod: "dimezisBlurViewSdk31Plus" as const,
                  blurReductionFactor: 4,
                }
              : {})}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        <View style={s.backdropDim} pointerEvents="none" />
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => onNo(dontShowAgain)}
          accessibilityRole="button"
          accessibilityLabel="閉じる"
        />
        <View style={s.sheetWrap} pointerEvents="box-none">
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={s.card}>
              <View style={s.cyanHairline} pointerEvents="none" />
              <Text style={s.title}>{title}</Text>
              <View style={s.titleDivider} pointerEvents="none" />
              <LinearGradient
                colors={["rgba(34,211,238,0.45)", "rgba(255,255,255,0.12)", "rgba(37,99,235,0.35)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.previewRing}
              >
                <View style={s.previewInner}>
                  <LinearGradient
                    pointerEvents="none"
                    colors={["rgba(255,255,255,0.06)", "transparent", "rgba(0,0,0,0.2)"]}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Text style={s.deckKicker}>{deckLabel}</Text>
                  <View style={s.broadRow}>
                    <View style={s.broadCol}>
                      <Text style={s.colTag}>HOME</Text>
                      <View style={s.jerseyWrap}>
                        <JerseyMarkAdaptive
                          accent={homePalette.primary}
                          accentEnd={homePalette.secondary}
                          size={50}
                        />
                      </View>
                      <Text style={s.teamLine} numberOfLines={2}>
                        {homeTitle}
                      </Text>
                    </View>
                    <View style={s.broadColCenter}>
                      <Text style={s.kickoffText}>{kickoff}</Text>
                      <Text style={s.vsHint}>vs</Text>
                    </View>
                    <View style={s.broadCol}>
                      <Text style={s.colTag}>AWAY</Text>
                      <View style={s.jerseyWrap}>
                        <JerseyMarkAdaptive
                          accent={awayPalette.primary}
                          accentEnd={awayPalette.secondary}
                          size={50}
                        />
                      </View>
                      <Text style={s.teamLine} numberOfLines={2}>
                        {awayTitle}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={s.subBar}>
                  <Text style={s.subText}>{sub}</Text>
                </View>
                <Pressable
                  style={s.checkRow}
                  onPress={() => setDontShowAgain((v) => !v)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: dontShowAgain }}
                >
                  <View
                    style={[s.checkBox, dontShowAgain && s.checkBoxOn]}
                    accessibilityElementsHidden
                  />
                  <Text style={s.checkLabel}>{skipLabel}</Text>
                </Pressable>
              </LinearGradient>

              <View style={s.actions}>
                <Pressable
                  style={({ pressed }) => [s.btnGhost, pressed && s.btnPressed]}
                  onPress={() => onNo(dontShowAgain)}
                >
                  <View style={s.btnGhostHaze} />
                  <Text style={s.btnGhostText}>{secondaryButtonLabel}</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [s.btnCyan, pressed && s.btnPressed]}
                  onPress={() => onYes(dontShowAgain)}
                >
                  <LinearGradient
                    colors={["#ecfeff", "#67e8f9", "#22d3ee", "#0ea5e9", "#0369a1"]}
                    locations={[0, 0.2, 0.45, 0.75, 1]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={s.btnCyanFill}
                  >
                    <View style={s.btnCyanSheen} />
                    <Text style={s.btnCyanText}>{primaryButtonLabel}</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: "center" },
  backdropDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheetWrap: {
    width: "100%",
    paddingHorizontal: spacing.md,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    backgroundColor: "rgba(6,10,20,0.85)",
    paddingVertical: 12,
    paddingHorizontal: 10,
    overflow: "hidden",
    // iOS: Web の shadow 相当
    ...Platform.select({
      ios: {
        shadowColor: "rgba(34, 211, 238, 0.18)",
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.45,
        shadowRadius: 28,
      },
      android: { elevation: 20 },
      default: {},
    }),
  },
  cyanHairline: {
    position: "absolute",
    left: 20,
    right: 20,
    top: 0,
    height: 1,
    backgroundColor: "rgba(34, 211, 238, 0.45)",
  },
  title: {
    textAlign: "center",
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  titleDivider: {
    height: 1,
    marginBottom: 10,
    backgroundColor: "rgba(34, 211, 238, 0.18)",
  },
  previewRing: {
    borderRadius: 14,
    padding: 1,
    overflow: "hidden",
  },
  previewInner: {
    borderRadius: 13,
    backgroundColor: "#080c12",
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 4,
  },
  deckKicker: {
    textAlign: "center",
    color: "rgba(255,255,255,0.85)",
    fontSize: 8.5,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  broadRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 2,
  },
  broadCol: { flex: 1, minWidth: 0, alignItems: "center" },
  broadColCenter: { width: 64, paddingTop: 20, alignItems: "center" },
  colTag: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 8.5,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  jerseyWrap: { marginTop: 2 },
  teamLine: {
    color: "#fff",
    fontSize: 10.5,
    fontWeight: "800",
    lineHeight: 12,
    textAlign: "center",
    marginTop: 4,
  },
  kickoffText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 24,
  },
  vsHint: {
    color: "rgba(255,255,255,0.28)",
    fontSize: 7.5,
    fontWeight: "800",
    marginTop: 2,
  },
  subBar: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  subText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.5)",
    fontSize: 9.5,
    lineHeight: 14,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.28)",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  checkBox: {
    width: 12,
    height: 12,
    marginTop: 2,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  checkBoxOn: {
    backgroundColor: "rgba(34, 211, 238, 0.55)",
    borderColor: "rgba(34, 211, 238, 0.75)",
  },
  checkLabel: { flex: 1, color: "rgba(255,255,255,0.78)", fontSize: 9.5, lineHeight: 13.5 },
  actions: { flexDirection: "row", gap: 7, marginTop: 9 },
  btnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  btnGhost: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  btnGhostHaze: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  btnGhostText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.92)",
    fontSize: 10.5,
    fontWeight: "700",
    lineHeight: 12,
  },
  btnCyan: { flex: 1, minHeight: 40, borderRadius: 12, overflow: "hidden" },
  btnCyanFill: { flex: 1, minHeight: 40, alignItems: "center", justifyContent: "center" },
  btnCyanSheen: {
    position: "absolute",
    top: 3,
    left: 20,
    right: 20,
    height: "32%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  btnCyanText: { color: "#0f172a", fontSize: 11, fontWeight: "900" },
});
