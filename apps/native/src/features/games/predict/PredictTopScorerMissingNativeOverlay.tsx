/** Web `PredictTopScorerMissingModal` 相当 */
import { useEffect, useRef, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { nativeBlurViewExtraProps } from "../../../ui/nativeBlurProps";
import { UNITERZ_LOGO_FLAT_ASSET } from "../../../../../../lib/units/uniterzLogoFlat";
import { NBA_TOP_SCORER_BONUS_POINTS } from "../../../../../../lib/nba/topScorer";
import { MATCH_CARD_DISPLAY_FONT, MATCH_CARD_METRIC_FONT } from "../matchCardTypography";

/** 選手ピッカー見出しと同じ書体で描く語 */
const TOP_SCORER_TOKEN = "TOP SCORER";

const LOGO_FLAT = require("../../../../assets/brand/uniterz-logo-flat.png");

const OXANIUM = Platform.select({
  ios: "Oxanium_700Bold",
  android: "Oxanium_700Bold",
  default: "sans-serif",
});

const LOGO_W = 108;
const LOGO_H = (LOGO_W * UNITERZ_LOGO_FLAT_ASSET.height) / UNITERZ_LOGO_FLAT_ASSET.width;
const LOGO_GAP_PAD = 10;
const FRAME_BORDER = "rgba(165,243,252,0.34)";
const SEG_CYAN = "#00F5FF";
const CHOICE_COMMIT_DELAY_MS = 160;

type Props = {
  title: string;
  bonusText: string;
  editableText: string;
  confirmText: string;
  pickLabel: string;
  sendLabel: string;
  onPick: () => void;
  onSend: () => void;
};

function SegScanLines() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: 13 }, (_, i) => (
        <View key={i} style={[s.segScanLine, { top: i * 3 + 1 }]} />
      ))}
    </View>
  );
}

function SegCell({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [s.segCell, active && s.segCellOn, pressed && !active && s.segCellPressed]}
    >
      {active ? <SegScanLines /> : null}
      <Text style={[s.segLabel, active && s.segLabelOn]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/** 予想シートの上に重ねる（Modal の入れ子を避ける） */
export default function PredictTopScorerMissingNativeOverlay({
  title,
  bonusText,
  editableText,
  confirmText,
  pickLabel,
  sendLabel,
  onPick,
  onSend,
}: Props) {
  const [choice, setChoice] = useState<"pick" | "send">("pick");
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    },
    []
  );

  const commitChoice = (next: "pick" | "send") => {
    if (commitTimerRef.current) return;
    setChoice(next);
    commitTimerRef.current = setTimeout(() => {
      commitTimerRef.current = null;
      if (next === "send") onSend();
      else onPick();
    }, CHOICE_COMMIT_DELAY_MS);
  };

  return (
    <Pressable style={s.root} onPress={onPick} accessibilityRole="button" accessibilityLabel={pickLabel}>
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
          <View pointerEvents="none" style={s.glassTint} />
          <View style={s.content}>
            <Text style={s.title}>{title}</Text>

            <View style={s.infoBox}>
              <View style={s.infoRow}>
                <Text style={s.bonusBadge}>+{NBA_TOP_SCORER_BONUS_POINTS}</Text>
                <View style={s.bonusLine}>
                  {bonusText
                    .replace("{n}", String(NBA_TOP_SCORER_BONUS_POINTS))
                    .split(TOP_SCORER_TOKEN)
                    .map((part, i) => (
                      <View key={i} style={s.bonusPart}>
                        {i > 0 ? <Text style={s.topScorerToken}>{TOP_SCORER_TOKEN}</Text> : null}
                        {part ? <Text style={s.infoTextInline}>{part}</Text> : null}
                      </View>
                    ))}
                </View>
              </View>
              <View style={[s.infoRow, s.infoRowGap]}>
                <Text style={s.editBadge}>EDIT</Text>
                <Text style={s.infoText}>{editableText}</Text>
              </View>
            </View>

            <Text style={s.confirm}>{confirmText}</Text>

            <View style={s.segTrack}>
              <SegCell label={sendLabel} active={choice === "send"} onPress={() => commitChoice("send")} />
              <SegCell label={pickLabel} active={choice === "pick"} onPress={() => commitChoice("pick")} />
            </View>
          </View>
        </View>

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
  );
}

const s = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    elevation: 50,
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
    backgroundColor: "rgba(5,8,14,0.92)",
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
  infoBox: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoRowGap: {
    marginTop: 8,
  },
  bonusBadge: {
    width: 36,
    textAlign: "center",
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 17,
    lineHeight: 20,
    color: "#facc15",
  },
  editBadge: {
    width: 36,
    textAlign: "center",
    fontFamily: OXANIUM,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#67e8f9",
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(226,232,240,0.9)",
  },
  bonusLine: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  bonusPart: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoTextInline: {
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(226,232,240,0.9)",
  },
  topScorerToken: {
    color: "#fff",
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 15,
    lineHeight: 17,
    fontWeight: "400",
    letterSpacing: 1,
    textTransform: "uppercase",
    includeFontPadding: false,
    transform: [{ skewX: "-6deg" }],
  },
  confirm: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    color: "rgba(203,213,225,0.95)",
  },
  segTrack: {
    flexDirection: "row",
    marginTop: 12,
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
