/**
 * __DEV__ リザルト右上スタンプ見た目案。本番未接続。
 * サイバー HUD の押印。円なし。文字は HIT / MISS / PERFECT / UPSET のみ。
 */
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  MATCH_CARD_DISPLAY_FONT,
  MATCH_CARD_METRIC_FONT,
  MATCH_CARD_SCORE_FONT,
} from "../games/matchCardTypography";
import {
  OUTCOME_LABEL,
  OUTCOME_TONE,
  type OutcomeKind,
} from "./resultBadgeDesignPreviewPatterns";

export type StampPatternId =
  | "ink"
  | "clip"
  | "scan"
  | "bracket"
  | "skew"
  | "hazard"
  | "reticle"
  | "dogtag"
  | "killfeed"
  | "impact";

export type StampPatternMeta = {
  id: StampPatternId;
  code: string;
  nameJa: string;
  nameEn: string;
  noteJa: string;
  noteEn: string;
};

export const STAMP_PATTERN_GALLERY: StampPatternMeta[] = [
  {
    id: "ink",
    code: "01",
    nameJa: "INK",
    nameEn: "INK",
    noteJa: "二重枠の押印。HIT は実線、MISS は破線＋斜線。",
    noteEn: "Double-frame ink. HIT solid, MISS dashed + slash.",
  },
  {
    id: "clip",
    code: "02",
    nameJa: "CLIP",
    nameEn: "CLIP",
    noteJa: "角切りプレート。MISS は枠だけ。",
    noteEn: "Chamfered plate. MISS outline only.",
  },
  {
    id: "scan",
    code: "03",
    nameJa: "SCAN",
    nameEn: "SCAN",
    noteJa: "スキャン線の塗り。MISS は線だけ。",
    noteEn: "Scanline fill. MISS lines only.",
  },
  {
    id: "bracket",
    code: "04",
    nameJa: "BRACKET",
    nameEn: "BRACKET",
    noteJa: "四隅ブラケット。MISS は二隅だけ。",
    noteEn: "Corner brackets. MISS keeps two.",
  },
  {
    id: "skew",
    code: "05",
    nameJa: "SKEW",
    nameEn: "SKEW",
    noteJa: "斜め HUD タブ。MISS は中空。",
    noteEn: "Skewed HUD tab. MISS hollow.",
  },
  {
    id: "hazard",
    code: "06",
    nameJa: "HAZARD",
    nameEn: "HAZARD",
    noteJa: "斜めストライプ。MISS は薄く。",
    noteEn: "Hazard stripes. MISS faded.",
  },
  {
    id: "reticle",
    code: "07",
    nameJa: "RETICLE",
    nameEn: "RETICLE",
    noteJa: "ロックオン。MISS は外れた照準。",
    noteEn: "Lock-on ticks. MISS is off-target.",
  },
  {
    id: "dogtag",
    code: "08",
    nameJa: "DOGTAG",
    nameEn: "DOGTAG",
    noteJa: "認識票。MISS は穴なし＋斜線。",
    noteEn: "ID plate. MISS no hole + slash.",
  },
  {
    id: "killfeed",
    code: "09",
    nameJa: "KILLFEED",
    nameEn: "KILLFEED",
    noteJa: "キルログ。MISS は点なし。",
    noteEn: "Kill feed. MISS drops the pip.",
  },
  {
    id: "impact",
    code: "10",
    nameJa: "IMPACT",
    nameEn: "IMPACT",
    noteJa: "イタリック＋斜線。MISS は取り消し。",
    noteEn: "Italic + slash. MISS strike-through.",
  },
];

type StampProps = { kind: OutcomeKind };

function tilt(kind: OutcomeKind): `${number}deg` {
  if (kind === "hit") return "-7deg";
  if (kind === "perfect") return "-3deg";
  if (kind === "upset") return "-11deg";
  return "8deg";
}

function Word({
  kind,
  color,
  size = 13,
  font = "display",
}: {
  kind: OutcomeKind;
  color: string;
  size?: number;
  font?: "display" | "metric" | "score";
}) {
  const family =
    font === "score"
      ? MATCH_CARD_SCORE_FONT
      : font === "metric"
        ? MATCH_CARD_METRIC_FONT
        : MATCH_CARD_DISPLAY_FONT;
  return (
    <Text
      style={{
        fontFamily: family,
        fontSize: size,
        fontWeight: font === "metric" ? "800" : "400",
        letterSpacing: OUTCOME_LABEL[kind].length > 4 ? 1.1 : 1.8,
        color,
        includeFontPadding: false,
      }}
    >
      {OUTCOME_LABEL[kind]}
    </Text>
  );
}

function InkStamp({ kind }: StampProps) {
  const tone = OUTCOME_TONE[kind];
  const miss = kind === "miss";
  return (
    <View style={{ transform: [{ rotate: tilt(kind) }] }}>
      <View
        style={[
          styles.inkOuter,
          {
            borderColor: tone.accent,
            borderStyle: miss ? "dashed" : "solid",
            borderWidth: kind === "perfect" ? 3 : 2,
          },
        ]}
      >
        <View
          style={[
            styles.inkInner,
            {
              borderColor: tone.accent,
              borderStyle: miss ? "solid" : "dashed",
            },
          ]}
        >
          <Word kind={kind} color={tone.accent} />
          {miss ? (
            <View
              pointerEvents="none"
              style={[styles.slash, { backgroundColor: tone.accent }]}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

function ClipStamp({ kind }: StampProps) {
  const tone = OUTCOME_TONE[kind];
  const miss = kind === "miss";
  const w = OUTCOME_LABEL[kind].length > 4 ? 92 : 64;
  const h = 26;
  const cut = 6;
  const d = `M${cut} 0 H${w - cut} L${w} ${cut} V${h - cut} L${w - cut} ${h} H${cut} L0 ${h - cut} V${cut} Z`;
  return (
    <View style={{ transform: [{ rotate: tilt(kind) }] }}>
      <Svg width={w} height={h}>
        <Path
          d={d}
          fill={miss ? "none" : tone.accent}
          stroke={tone.accent}
          strokeWidth={1.6}
        />
      </Svg>
      <View pointerEvents="none" style={[styles.clipLabel, { width: w, height: h }]}>
        <Word kind={kind} color={miss ? tone.accent : tone.fillText} size={12} />
      </View>
    </View>
  );
}

function ScanLines({ color, h }: { color: string; h: number }) {
  const n = Math.max(0, Math.floor((h - 4) / 3));
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: n }, (_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 2 + i * 3,
            height: 1,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}

function ScanStamp({ kind }: StampProps) {
  const tone = OUTCOME_TONE[kind];
  const miss = kind === "miss";
  return (
    <View
      style={[
        styles.scanShell,
        {
          backgroundColor: miss ? "transparent" : tone.accent,
          borderColor: tone.accent,
        },
      ]}
    >
      <ScanLines color={miss ? tone.accent : "rgba(0,0,0,0.18)"} h={24} />
      <Word kind={kind} color={miss ? tone.accent : tone.fillText} size={12} />
    </View>
  );
}

function BracketStamp({ kind }: StampProps) {
  const tone = OUTCOME_TONE[kind];
  const miss = kind === "miss";
  const tick = { borderColor: tone.accent };
  return (
    <View style={styles.bracketBox}>
      {miss ? null : <View style={[styles.tickTL, tick]} />}
      <View style={[styles.tickTR, tick]} />
      <View style={[styles.tickBL, tick]} />
      {miss ? null : <View style={[styles.tickBR, tick]} />}
      <Word kind={kind} color={tone.ink} size={11} font="metric" />
    </View>
  );
}

function SkewStamp({ kind }: StampProps) {
  const tone = OUTCOME_TONE[kind];
  const miss = kind === "miss";
  return (
    <View style={styles.skewOuter}>
      <View
        style={[
          styles.skewTab,
          {
            backgroundColor: miss ? "transparent" : tone.accent,
            borderWidth: miss ? 1.5 : 0,
            borderColor: tone.accent,
          },
        ]}
      >
        {!miss ? <ScanLines color="rgba(0,0,0,0.18)" h={26} /> : null}
        <Text
          style={[
            styles.skewText,
            { color: miss ? tone.accent : tone.fillText },
          ]}
        >
          {OUTCOME_LABEL[kind]}
        </Text>
      </View>
    </View>
  );
}

function HazardStamp({ kind }: StampProps) {
  const tone = OUTCOME_TONE[kind];
  const miss = kind === "miss";
  return (
    <View
      style={[
        styles.hazardShell,
        { backgroundColor: tone.fillText, opacity: miss ? 0.55 : 1 },
      ]}
    >
      {Array.from({ length: 12 }, (_, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={[
            styles.hazardBar,
            { left: i * 7 - 16, backgroundColor: tone.accent },
          ]}
        />
      ))}
      <Word kind={kind} color={tone.accent} size={11} font="metric" />
    </View>
  );
}

function ReticleStamp({ kind }: StampProps) {
  const tone = OUTCOME_TONE[kind];
  const miss = kind === "miss";
  const arm = { backgroundColor: tone.accent };
  return (
    <View style={[styles.reticleBox, miss && { transform: [{ rotate: "12deg" }] }]}>
      <View style={[styles.retH, styles.retTLH, arm]} />
      <View style={[styles.retV, styles.retTLV, arm]} />
      {miss ? null : <View style={[styles.retH, styles.retTRH, arm]} />}
      {miss ? null : <View style={[styles.retV, styles.retTRV, arm]} />}
      {miss ? null : <View style={[styles.retH, styles.retBLH, arm]} />}
      {miss ? null : <View style={[styles.retV, styles.retBLV, arm]} />}
      <View style={[styles.retH, styles.retBRH, arm]} />
      <View style={[styles.retV, styles.retBRV, arm]} />
      <Word kind={kind} color={tone.accent} size={11} font="metric" />
    </View>
  );
}

function DogtagStamp({ kind }: StampProps) {
  const tone = OUTCOME_TONE[kind];
  const miss = kind === "miss";
  return (
    <View style={[styles.dogTag, { borderColor: tone.accent }]}>
      {miss ? null : (
        <View style={[styles.dogHoleRing, { borderColor: tone.accent }]}>
          <View style={styles.dogHole} />
        </View>
      )}
      <Word kind={kind} color={tone.ink} size={11} font="metric" />
      {miss ? (
        <View
          pointerEvents="none"
          style={[styles.slash, { backgroundColor: tone.accent }]}
        />
      ) : null}
    </View>
  );
}

function KillfeedStamp({ kind }: StampProps) {
  const tone = OUTCOME_TONE[kind];
  const miss = kind === "miss";
  return (
    <View style={styles.killRow}>
      {miss ? null : (
        <View style={[styles.killPip, { backgroundColor: tone.accent }]} />
      )}
      <Word kind={kind} color={tone.accent} size={12} font="metric" />
    </View>
  );
}

function ImpactStamp({ kind }: StampProps) {
  const tone = OUTCOME_TONE[kind];
  const miss = kind === "miss";
  return (
    <View style={styles.impactWrap}>
      <Word kind={kind} color={tone.accent} size={15} font="score" />
      <View
        style={[
          styles.impactSlash,
          {
            backgroundColor: tone.accent,
            transform: [{ rotate: miss ? "-8deg" : "-8deg" }],
            opacity: miss ? 1 : 1,
            top: miss ? 10 : undefined,
          },
        ]}
      />
    </View>
  );
}

export function ResultStampPattern({
  id,
  kind,
}: {
  id: StampPatternId;
  kind: OutcomeKind;
}) {
  switch (id) {
    case "ink":
      return <InkStamp kind={kind} />;
    case "clip":
      return <ClipStamp kind={kind} />;
    case "scan":
      return <ScanStamp kind={kind} />;
    case "bracket":
      return <BracketStamp kind={kind} />;
    case "skew":
      return <SkewStamp kind={kind} />;
    case "hazard":
      return <HazardStamp kind={kind} />;
    case "reticle":
      return <ReticleStamp kind={kind} />;
    case "dogtag":
      return <DogtagStamp kind={kind} />;
    case "killfeed":
      return <KillfeedStamp kind={kind} />;
    case "impact":
      return <ImpactStamp kind={kind} />;
    default:
      return null;
  }
}

const TICK = 8;
const TICK_W = 2;

const styles = StyleSheet.create({
  inkOuter: {
    padding: 2,
  },
  inkInner: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  slash: {
    position: "absolute",
    left: 2,
    right: 2,
    top: "48%",
    height: 2,
    transform: [{ rotate: "-16deg" }],
  },
  clipLabel: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  scanShell: {
    overflow: "hidden",
    borderWidth: 1.5,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  bracketBox: {
    position: "relative",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tickTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: TICK,
    height: TICK,
    borderTopWidth: TICK_W,
    borderLeftWidth: TICK_W,
  },
  tickTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: TICK,
    height: TICK,
    borderTopWidth: TICK_W,
    borderRightWidth: TICK_W,
  },
  tickBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: TICK,
    height: TICK,
    borderBottomWidth: TICK_W,
    borderLeftWidth: TICK_W,
  },
  tickBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: TICK,
    height: TICK,
    borderBottomWidth: TICK_W,
    borderRightWidth: TICK_W,
  },
  skewOuter: {
    transform: [{ skewX: "-14deg" }],
  },
  skewTab: {
    overflow: "hidden",
    height: 26,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  skewText: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
    includeFontPadding: false,
    transform: [{ skewX: "14deg" }],
  },
  hazardShell: {
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  hazardBar: {
    position: "absolute",
    top: -10,
    width: 4,
    height: 48,
    opacity: 0.55,
    transform: [{ rotate: "28deg" }],
  },
  reticleBox: {
    position: "relative",
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  retH: {
    position: "absolute",
    width: 9,
    height: 2,
  },
  retV: {
    position: "absolute",
    width: 2,
    height: 9,
  },
  retTLH: { top: 0, left: 0 },
  retTLV: { top: 0, left: 0 },
  retTRH: { top: 0, right: 0 },
  retTRV: { top: 0, right: 0 },
  retBLH: { bottom: 0, left: 0 },
  retBLV: { bottom: 0, left: 0 },
  retBRH: { bottom: 0, right: 0 },
  retBRV: { bottom: 0, right: 0 },
  dogTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1.5,
    backgroundColor: "rgba(12,16,24,0.92)",
    paddingVertical: 4,
    paddingLeft: 6,
    paddingRight: 9,
  },
  dogHoleRing: {
    width: 10,
    height: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  dogHole: {
    width: 4,
    height: 4,
    backgroundColor: "#05070c",
  },
  killRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  killPip: {
    width: 7,
    height: 7,
    transform: [{ rotate: "45deg" }],
  },
  impactWrap: {
    alignItems: "flex-start",
  },
  impactSlash: {
    height: 2,
    alignSelf: "stretch",
    marginTop: 1,
  },
});
