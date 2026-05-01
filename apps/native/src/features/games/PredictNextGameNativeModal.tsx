import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { spacing } from "../../theme/tokens";
import JerseyMarkAdaptive from "./JerseyMarkAdaptive";
import { MatchCardFineInnerPlate } from "./MatchCardFineInterior";

/** 一覧 `GameCardList` のチーム名と同系（Bebas・大文字） */
const DISPLAY_FONT = Platform.select({
  ios: "BebasNeue_400Regular",
  android: "BebasNeue_400Regular",
  default: "BebasNeue_400Regular",
});
const NUMERIC_FONT = Platform.select({
  ios: "Oxanium_700Bold",
  android: "Oxanium_700Bold",
  default: "Oxanium_700Bold",
});

const JERSEY_SIZE_NEXT_MODAL = 48;

type Palette = { primary: string; secondary: string };

type PredictNextGameNativeModalProps = {
  visible: boolean;
  title: string;
  sub: string;
  /** Web `broadcastDeckTitle` 相当 */
  deckLabel: string;
  skipLabel: string;
  primaryButtonLabel: string;
  secondaryButtonLabel: string;
  homeTitle: string;
  awayTitle: string;
  kickoff: string;
  homePalette: Palette;
  awayPalette: Palette;
  homeRecordLine: string | null;
  awayRecordLine: string | null;
  showSeriesRow: boolean;
  seriesHomeWins: number | null;
  seriesAwayWins: number | null;
  onYes: (dontShowAgain: boolean) => void;
  onNo: (dontShowAgain: boolean) => void;
};

/** モバイル Web `PredictNextGameModal` 相当 */
export default function PredictNextGameNativeModal({
  visible,
  title,
  sub,
  deckLabel,
  skipLabel,
  primaryButtonLabel,
  secondaryButtonLabel,
  homeTitle,
  awayTitle,
  kickoff,
  homePalette,
  awayPalette,
  homeRecordLine,
  awayRecordLine,
  showSeriesRow,
  seriesHomeWins,
  seriesAwayWins,
  onYes,
  onNo,
}: PredictNextGameNativeModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (visible) setDontShowAgain(false);
  }, [visible]);

  const centerFoot = showSeriesRow &&
    seriesHomeWins != null &&
    seriesAwayWins != null ? (
    <View style={s.seriesRow}>
      <Text style={s.seriesParen}>( </Text>
      <Text style={s.seriesHome}>{seriesHomeWins}</Text>
      <Text style={s.seriesDash}> — </Text>
      <Text style={s.seriesAway}>{seriesAwayWins}</Text>
      <Text style={s.seriesParen}> )</Text>
    </View>
  ) : (
    <Text style={s.vsHint}>vs</Text>
  );

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
            intensity={Platform.OS === "ios" ? 18 : 14}
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
            <LinearGradient
              colors={[
                "rgba(255,255,255,0.07)",
                "rgba(255,255,255,0.025)",
                "rgba(6,11,18,0.96)",
                "rgba(3,7,12,0.99)",
              ]}
              locations={[0, 0.18, 0.45, 1]}
              start={{ x: 0.35, y: 0 }}
              end={{ x: 0.65, y: 1 }}
              style={s.card}
            >
              <View style={s.cyanHairline} pointerEvents="none" />
              <Text style={s.title}>{title}</Text>
              <View style={s.titleDivider} pointerEvents="none" />
              <View style={s.previewShell}>
                <MatchCardFineInnerPlate
                  borderRadius={12}
                  plateStyle={{ minHeight: 100 }}
                  contentStyle={s.previewContent}
                >
                    <Text style={s.deckKicker}>{deckLabel}</Text>
                    <View style={s.broadRow}>
                      <View style={s.broadCol}>
                        <Text style={s.colTag}>HOME</Text>
                        <View style={s.jerseyWrap}>
                          <JerseyMarkAdaptive
                            accent={homePalette.primary}
                            accentEnd={homePalette.secondary}
                            size={JERSEY_SIZE_NEXT_MODAL}
                          />
                        </View>
                        {/* 一覧 `teamBottomGroup` と同様：中央寄せ＋幅上限のみ。adjustsFontSizeToFit は先頭クリップの原因になり得る */}
                        <View style={s.teamTextBlock}>
                          <Text
                            style={s.teamLine}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {homeTitle}
                          </Text>
                          {homeRecordLine ? (
                            <Text
                              style={s.recordLine}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {homeRecordLine}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      <View style={s.broadColCenter}>
                        <Text style={s.kickoffText}>{kickoff}</Text>
                        {centerFoot}
                      </View>
                      <View style={s.broadCol}>
                        <Text style={s.colTag}>AWAY</Text>
                        <View style={s.jerseyWrap}>
                          <JerseyMarkAdaptive
                            accent={awayPalette.primary}
                            accentEnd={awayPalette.secondary}
                            size={JERSEY_SIZE_NEXT_MODAL}
                          />
                        </View>
                        <View style={s.teamTextBlock}>
                          <Text
                            style={s.teamLine}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {awayTitle}
                          </Text>
                          {awayRecordLine ? (
                            <Text
                              style={s.recordLine}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {awayRecordLine}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    </View>
                </MatchCardFineInnerPlate>
                <View style={s.subBar}>
                  <Text style={s.subText}>{sub}</Text>
                </View>
                <Pressable
                  style={s.checkRow}
                  onPress={() => setDontShowAgain((v) => !v)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: dontShowAgain }}
                >
                  <View style={[s.checkBox, dontShowAgain && s.checkBoxOn]}>
                    {dontShowAgain ? <Text style={s.checkMark}>✓</Text> : null}
                  </View>
                  <Text style={s.checkLabel}>{skipLabel}</Text>
                </Pressable>
              </View>

              <View style={s.actions}>
                <Pressable
                  style={({ pressed }) => [s.btnGhostOuter, pressed && s.btnPressed]}
                  onPress={() => onNo(dontShowAgain)}
                >
                  <LinearGradient
                    colors={[
                      "rgba(255,255,255,0.11)",
                      "rgba(255,255,255,0.045)",
                      "rgba(255,255,255,0.02)",
                    ]}
                    locations={[0, 0.42, 1]}
                    start={{ x: 0.35, y: 0 }}
                    end={{ x: 0.65, y: 1 }}
                    style={s.btnGhostFill}
                  >
                    <View style={s.btnGhostHaze} />
                    <Text style={s.btnGhostText}>{secondaryButtonLabel}</Text>
                  </LinearGradient>
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
            </LinearGradient>
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
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  /** 一覧に近い横長だがモーダルはやや狭め */
  sheetWrap: {
    width: "86%",
    maxWidth: 392,
    alignSelf: "center",
    alignItems: "stretch",
  },
  card: {
    position: "relative",
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    paddingVertical: 12,
    paddingHorizontal: 10,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 28 },
        shadowOpacity: 0.72,
        shadowRadius: 36,
      },
      android: { elevation: 24 },
      default: {},
    }),
  },
  cyanHairline: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 0,
    height: 1,
    backgroundColor: "rgba(34, 211, 238, 0.45)",
    zIndex: 4,
  },
  title: {
    textAlign: "center",
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  titleDivider: {
    height: 1,
    marginBottom: 10,
    backgroundColor: "rgba(34, 211, 238, 0.22)",
  },
  /** 中継＋ subBar をまとめる角丸（シアンリングは付けない） */
  previewShell: {
    borderRadius: 12,
    overflow: "hidden",
  },
  previewContent: {
    position: "relative",
    zIndex: 3,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 8,
  },
  deckKicker: {
    textAlign: "center",
    color: "rgba(255,255,255,0.85)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  /** 一覧 `matchupGrid`：HOME | 中央 | AWAY を横並び・縦中央 */
  broadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    minHeight: 88,
  },
  broadCol: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  broadColCenter: {
    width: 88,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  colTag: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.85,
    textTransform: "uppercase",
    marginBottom: 3,
    fontFamily: DISPLAY_FONT,
  },
  jerseyWrap: { marginTop: 0 },
  /** 一覧と同様に列いっぱいの幅を確保（親が `alignItems: center` のため stretch が必要） */
  teamTextBlock: {
    alignSelf: "stretch",
    alignItems: "center",
    marginTop: 4,
  },
  teamLine: {
    width: "100%",
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 14,
    textAlign: "center",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontFamily: DISPLAY_FONT,
    includeFontPadding: false,
  },
  recordLine: {
    width: "100%",
    marginTop: 2,
    fontSize: 10,
    fontVariant: ["tabular-nums"],
    color: "rgba(226,232,240,0.82)",
    lineHeight: 11,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
    fontFamily: NUMERIC_FONT,
    includeFontPadding: false,
  },
  kickoffText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 24,
    fontVariant: ["tabular-nums"],
  },
  vsHint: {
    color: "rgba(255,255,255,0.32)",
    fontSize: 8,
    fontWeight: "800",
    marginTop: 4,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  seriesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  seriesParen: { fontSize: 9, fontWeight: "600", color: "rgba(255,255,255,0.55)" },
  seriesHome: { fontSize: 10, fontWeight: "800", color: "#facc15" },
  seriesDash: { fontSize: 9, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
  seriesAway: { fontSize: 10, fontWeight: "800", color: "#22d3ee" },
  subBar: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  subText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.52)",
    fontSize: 9.5,
    lineHeight: 14,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  checkBox: {
    width: 12,
    height: 12,
    marginTop: 2,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkBoxOn: {
    backgroundColor: "rgba(34, 211, 238, 0.45)",
    borderColor: "rgba(34, 211, 238, 0.75)",
  },
  checkMark: {
    color: "#0f172a",
    fontSize: 9,
    fontWeight: "900",
    lineHeight: 10,
  },
  checkLabel: { flex: 1, color: "rgba(255,255,255,0.82)", fontSize: 9.5, lineHeight: 13.5 },
  actions: { flexDirection: "row", gap: 8, marginTop: 10 },
  btnPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  btnGhostOuter: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },
  btnGhostFill: {
    flex: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  btnGhostHaze: {
    position: "absolute",
    top: 0,
    left: 10,
    right: 10,
    height: 1,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.35)",
    opacity: 0.65,
  },
  btnGhostText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.92)",
    fontSize: 10.5,
    fontWeight: "700",
    lineHeight: 13,
  },
  btnCyan: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(165,243,252,0.5)",
  },
  btnCyanFill: { flex: 1, minHeight: 38, alignItems: "center", justifyContent: "center" },
  btnCyanSheen: {
    position: "absolute",
    top: 2,
    left: 18,
    right: 18,
    height: "36%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.35)",
    opacity: 0.5,
  },
  btnCyanText: { color: "#0f172a", fontSize: 11, fontWeight: "900" },
});
