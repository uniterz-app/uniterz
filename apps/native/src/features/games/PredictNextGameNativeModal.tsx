import { useEffect, useRef, useState } from "react";
import { Image, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { nativeBlurViewExtraProps } from "../../ui/nativeBlurProps";
import MatchTeamMarkNative from "./MatchTeamMarkNative";
import MatchListLineFrameNative from "./MatchListLineFrameNative";
import MatchCardTeamNameNative from "./MatchCardTeamNameNative";
import { PlayoffSeriesScoreInline } from "./PlayoffSeriesScoreInline";
import { gameCardListStyles as card } from "./gameCardListStyles";
import { UNITERZ_LOGO_FLAT_ASSET } from "../../../../../lib/units/uniterzLogoFlat";

const LOGO_FLAT = require("../../../assets/brand/uniterz-logo-flat.png");

const OXANIUM = Platform.select({
  ios: "Oxanium_700Bold",
  android: "Oxanium_700Bold",
  default: "sans-serif",
});

const JERSEY_SIZE_NEXT_MODAL = 50;
const LOGO_W = 108;
const LOGO_H = (LOGO_W * UNITERZ_LOGO_FLAT_ASSET.height) / UNITERZ_LOGO_FLAT_ASSET.width;
/** ロゴ左右で上辺の枠線を切る幅 */
const LOGO_GAP_PAD = 10;
const FRAME_BORDER = "rgba(165,243,252,0.34)";
const SEG_CYAN = "#00F5FF";
/** 選択の点灯を見せてから閉じる */
const CHOICE_COMMIT_DELAY_MS = 160;

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
  leagueRaw: unknown;
  homeSide: unknown;
  awaySide: unknown;
  homeRecordLine: string | null;
  awayRecordLine: string | null;
  showSeriesRow: boolean;
  seriesHomeWins: number | null;
  seriesAwayWins: number | null;
  onYes: (dontShowAgain: boolean) => void;
  onNo: (dontShowAgain: boolean) => void;
};

/** 選択セル内の黒スキャン横線 */
function SegScanLines() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: 13 }, (_, i) => (
        <View key={i} style={[s.segScanLine, { top: i * 3 + 1 }]} />
      ))}
    </View>
  );
}

function SegCell({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        s.segCell,
        active && s.segCellOn,
        pressed && !active && s.segCellPressed,
      ]}
    >
      {active ? <SegScanLines /> : null}
      <Text style={[s.segLabel, active && s.segLabelOn]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/** モバイル Web `PredictNextGameModal` 相当（四角ガラス枠＋一覧の線枠カード） */
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
  leagueRaw,
  homeSide,
  awaySide,
  homeRecordLine,
  awayRecordLine,
  showSeriesRow,
  seriesHomeWins,
  seriesAwayWins,
  onYes,
  onNo,
}: PredictNextGameNativeModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [choice, setChoice] = useState<"yes" | "no">("yes");
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      setDontShowAgain(false);
      setChoice("yes");
    }
    return () => {
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    };
  }, [visible]);

  const commitChoice = (next: "yes" | "no") => {
    if (commitTimerRef.current) return;
    setChoice(next);
    commitTimerRef.current = setTimeout(() => {
      commitTimerRef.current = null;
      if (next === "yes") onYes(dontShowAgain);
      else onNo(dontShowAgain);
    }, CHOICE_COMMIT_DELAY_MS);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => onNo(dontShowAgain)}
      statusBarTranslucent
    >
      <Pressable
        style={s.root}
        onPress={() => onNo(dontShowAgain)}
        accessibilityRole="button"
        accessibilityLabel="閉じる"
      >
        {(Platform.OS === "ios" || Platform.OS === "android") && (
          <BlurView
            pointerEvents="none"
            style={StyleSheet.absoluteFillObject}
            tint="dark"
            intensity={Platform.OS === "ios" ? 28 : 22}
            {...nativeBlurViewExtraProps()}
          />
        )}
        <View style={s.scrim} pointerEvents="none" />

        <Pressable style={s.cardWrap} onPress={(e) => e.stopPropagation()}>
          <View style={s.glass}>
            {(Platform.OS === "ios" || Platform.OS === "android") && (
              <BlurView
                pointerEvents="none"
                style={StyleSheet.absoluteFillObject}
                tint="dark"
                intensity={Platform.OS === "ios" ? 46 : 32}
                {...nativeBlurViewExtraProps()}
              />
            )}
            <View pointerEvents="none" style={s.glassTint} />

            <View style={s.content}>
              <Text style={s.title}>{title}</Text>
              <Text style={s.body}>{sub}</Text>

              <MatchListLineFrameNative topLabel={deckLabel || undefined} style={s.matchFrame}>
                <View style={s.matchInterior}>
                  <View style={card.matchupGrid}>
                    <View style={card.lineFrameTeamColumn}>
                      <View style={card.teamTopGroup}>
                        <Text style={card.sideLabel}>HOME</Text>
                        <View style={s.teamMark}>
                          <MatchTeamMarkNative
                            leagueRaw={leagueRaw}
                            side={homeSide}
                            palette={homePalette}
                            jerseySize={JERSEY_SIZE_NEXT_MODAL}
                            flagVariant="nextModal"
                          />
                        </View>
                      </View>
                      <View style={card.teamBottomGroup}>
                        <MatchCardTeamNameNative textStyle={card.lineFrameTeamName}>
                          {homeTitle}
                        </MatchCardTeamNameNative>
                        {homeRecordLine ? (
                          <Text style={card.teamRecordText} numberOfLines={1}>
                            {homeRecordLine}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    <View style={card.centerColumn}>
                      <View style={card.centerScoreWrap}>
                        <Text style={card.centerText} numberOfLines={1}>
                          {kickoff}
                        </Text>
                        {showSeriesRow && seriesHomeWins != null && seriesAwayWins != null ? (
                          <PlayoffSeriesScoreInline
                            homeWins={seriesHomeWins}
                            awayWins={seriesAwayWins}
                            variant="card"
                          />
                        ) : null}
                      </View>
                    </View>

                    <View style={card.lineFrameTeamColumn}>
                      <View style={card.teamTopGroup}>
                        <Text style={card.sideLabel}>AWAY</Text>
                        <View style={s.teamMark}>
                          <MatchTeamMarkNative
                            leagueRaw={leagueRaw}
                            side={awaySide}
                            palette={awayPalette}
                            jerseySize={JERSEY_SIZE_NEXT_MODAL}
                            flagVariant="nextModal"
                          />
                        </View>
                      </View>
                      <View style={card.teamBottomGroup}>
                        <MatchCardTeamNameNative textStyle={card.lineFrameTeamName}>
                          {awayTitle}
                        </MatchCardTeamNameNative>
                        {awayRecordLine ? (
                          <Text style={card.teamRecordText} numberOfLines={1}>
                            {awayRecordLine}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                </View>
              </MatchListLineFrameNative>

              <Pressable
                style={s.checkRow}
                onPress={() => setDontShowAgain((v) => !v)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: dontShowAgain }}
                hitSlop={6}
              >
                <View style={[s.checkBox, dontShowAgain && s.checkBoxOn]}>
                  {dontShowAgain ? <Text style={s.checkMark}>✓</Text> : null}
                </View>
                <Text style={s.checkLabel}>{skipLabel}</Text>
              </Pressable>

              <View style={s.segTrack}>
                <SegCell
                  label={secondaryButtonLabel.replace(/\n/g, "")}
                  active={choice === "no"}
                  onPress={() => commitChoice("no")}
                />
                <SegCell
                  label={primaryButtonLabel}
                  active={choice === "yes"}
                  onPress={() => commitChoice("yes")}
                />
              </View>
            </View>
          </View>

          {/* 枠線：左右・下は通し、上辺はロゴの左右で切る */}
          <View pointerEvents="none" style={s.frameSidesBottom} />
          <View pointerEvents="none" style={s.frameTopRow}>
            <View style={s.frameTopLine} />
            <View style={{ width: LOGO_W + LOGO_GAP_PAD * 2 }} />
            <View style={s.frameTopLine} />
          </View>
          <View pointerEvents="none" style={s.logoOnLine}>
            <Image
              source={LOGO_FLAT}
              style={{ width: LOGO_W, height: LOGO_H }}
              resizeMode="contain"
              accessibilityLabel="UNITERZ"
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  cardWrap: {
    position: "relative",
    width: "100%",
    maxWidth: 360,
  },
  glass: {
    width: "100%",
    overflow: "hidden",
    borderRadius: 0,
  },
  glassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,14,0.7)",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: LOGO_H / 2 + 14,
    paddingBottom: 18,
    alignItems: "stretch",
  },
  frameSidesBottom: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: FRAME_BORDER,
  },
  frameTopRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    flexDirection: "row",
  },
  frameTopLine: {
    flex: 1,
    height: 1,
    backgroundColor: FRAME_BORDER,
  },
  logoOnLine: {
    position: "absolute",
    top: -LOGO_H / 2,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  title: {
    fontFamily: OXANIUM,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: "rgba(248,250,252,0.96)",
    textAlign: "center",
  },
  body: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    color: "rgba(148,163,184,0.94)",
  },
  /** 上辺ラベルの分だけ余白を確保（一覧カードと同じ marginTop） */
  matchFrame: {
    marginTop: 22,
    marginBottom: 0,
  },
  matchInterior: {
    paddingHorizontal: 4,
    paddingTop: 18,
    paddingBottom: 14,
  },
  teamMark: {
    width: JERSEY_SIZE_NEXT_MODAL,
    height: JERSEY_SIZE_NEXT_MODAL,
    alignItems: "center",
    justifyContent: "center",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  checkBox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: "rgba(165,243,252,0.55)",
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkBoxOn: {
    backgroundColor: SEG_CYAN,
    borderColor: SEG_CYAN,
  },
  checkMark: {
    color: "#050508",
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 12,
  },
  checkLabel: {
    flex: 1,
    color: "rgba(226,232,240,0.9)",
    fontSize: 12,
    lineHeight: 16,
  },
  segTrack: {
    flexDirection: "row",
    marginTop: 18,
    gap: 10,
  },
  segCell: {
    flex: 1,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: SEG_CYAN,
  },
  segCellOn: {
    backgroundColor: SEG_CYAN,
    shadowColor: SEG_CYAN,
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  segCellPressed: {
    backgroundColor: "rgba(0,245,255,0.08)",
  },
  segScanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(5,5,8,0.22)",
  },
  segLabel: {
    color: SEG_CYAN,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  segLabelOn: {
    color: "#050508",
  },
});
