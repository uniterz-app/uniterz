/**
 * __DEV__ リザルト右上バッジ見た目案。本番コンポーネントは未接続。
 * HIT / PERFECT / UPSET / MISS の 4 種を、案ごとに同じ語彙・配色で並べる。
 */
import { StyleSheet, Text, View } from "react-native";
import ResultCyberBadgeNative from "./ResultCyberBadgeNative";
import {
  MATCH_CARD_DISPLAY_FONT,
  MATCH_CARD_METRIC_FONT,
  MATCH_CARD_SCORE_FONT,
} from "../games/matchCardTypography";

export type OutcomeKind = "hit" | "perfect" | "upset" | "miss";

export const OUTCOME_KINDS: OutcomeKind[] = [
  "hit",
  "perfect",
  "upset",
  "miss",
];

export const OUTCOME_LABEL: Record<OutcomeKind, string> = {
  hit: "HIT",
  perfect: "PERFECT",
  upset: "UPSET",
  miss: "MISS",
};

export const OUTCOME_MARK: Record<OutcomeKind, string> = {
  hit: "H",
  perfect: "P",
  upset: "U",
  miss: "M",
};

/** 放送風キッカー。本体の HIT 等とは別レイヤーで意味を補強 */
export const OUTCOME_KICKER: Record<OutcomeKind, string> = {
  hit: "WIN",
  perfect: "EXACT",
  upset: "DOG",
  miss: "OUT",
};

export type OutcomeTone = {
  accent: string;
  fillText: string;
  ink: string;
  glow: string;
  wash: string;
};

export const OUTCOME_TONE: Record<OutcomeKind, OutcomeTone> = {
  hit: {
    accent: "#FCD34D",
    fillText: "#1A1200",
    ink: "#FFFBEB",
    glow: "rgba(252,211,77,0.45)",
    wash: "rgba(251,191,36,0.16)",
  },
  perfect: {
    accent: "#3B82F6",
    fillText: "#06101F",
    ink: "#EFF6FF",
    glow: "rgba(59,130,246,0.5)",
    wash: "rgba(37,99,235,0.2)",
  },
  upset: {
    accent: "#DC2626",
    fillText: "#1A0505",
    ink: "#FEF2F2",
    glow: "rgba(220,38,38,0.5)",
    wash: "rgba(185,28,28,0.2)",
  },
  miss: {
    accent: "#94A3B8",
    fillText: "#0B1018",
    ink: "#E2E8F0",
    glow: "rgba(148,163,184,0.28)",
    wash: "rgba(148,163,184,0.12)",
  },
};

export type PatternId =
  | "current"
  | "legend"
  | "stamp"
  | "dogtag"
  | "killfeed"
  | "bracket"
  | "chevron"
  | "scorebug"
  | "hexmark"
  | "hazard"
  | "impact"
  | "reticle";

export type PatternMeta = {
  id: PatternId;
  code: string;
  nameJa: string;
  nameEn: string;
  noteJa: string;
  noteEn: string;
};

export const PATTERN_GALLERY: PatternMeta[] = [
  {
    id: "current",
    code: "00",
    nameJa: "現行クリップ",
    nameEn: "Production clip",
    noteJa: "本番一覧。角切りグラデ。比較用。",
    noteEn: "Live list badge. Chamfered clip. Reference only.",
  },
  {
    id: "legend",
    code: "01",
    nameJa: "LEGEND 塗り",
    nameEn: "LEGEND fill",
    noteJa: "カード案の斜め塗りタブ。スキャン線あり。",
    noteEn: "Card preview slant tab. Scan lines.",
  },
  {
    id: "stamp",
    code: "02",
    nameJa: "STAMP",
    nameEn: "STAMP",
    noteJa: "軍用スタンプ。二重枠・わずかに傾ける。",
    noteEn: "Military ink stamp. Double frame, slight tilt.",
  },
  {
    id: "dogtag",
    code: "03",
    nameJa: "DOG TAG",
    nameEn: "DOG TAG",
    noteJa: "認識票。穴と刻印。金属板。",
    noteEn: "ID plate. Punch hole, engraved type.",
  },
  {
    id: "killfeed",
    code: "04",
    nameJa: "KILLFEED",
    nameEn: "KILLFEED",
    noteJa: "FPS キルログ。ダイヤ点 + 字だけ。",
    noteEn: "FPS kill feed. Diamond pip + type.",
  },
  {
    id: "bracket",
    code: "05",
    nameJa: "BRACKET",
    nameEn: "BRACKET",
    noteJa: "照準ブラケット。四隅の L で囲む。",
    noteEn: "Targeting brackets. Corner ticks only.",
  },
  {
    id: "chevron",
    code: "06",
    nameJa: "CHEVRON",
    nameEn: "CHEVRON",
    noteJa: "階級章。シェブロン + 語。",
    noteEn: "Rank insignia. Chevrons + word.",
  },
  {
    id: "scorebug",
    code: "07",
    nameJa: "SCOREBUG",
    nameEn: "SCOREBUG",
    noteJa: "放送スコアバグ。キッカー + 大文字。",
    noteEn: "Broadcast bug. Kicker + display word.",
  },
  {
    id: "hexmark",
    code: "08",
    nameJa: "HEX MARK",
    nameEn: "HEX MARK",
    noteJa: "菱形マーク 1 字 + ラベル。遠くでも判別。",
    noteEn: "Diamond letter mark + label. Reads at a glance.",
  },
  {
    id: "hazard",
    code: "09",
    nameJa: "HAZARD",
    nameEn: "HAZARD",
    noteJa: "警戒テープ。斜めストライプ塗り。",
    noteEn: "Hazard tape. Diagonal stripe fill.",
  },
  {
    id: "impact",
    code: "10",
    nameJa: "IMPACT",
    nameEn: "IMPACT",
    noteJa: "KO バナー。イタリック + 斜めアンダー。",
    noteEn: "KO banner. Italic word + slash underline.",
  },
  {
    id: "reticle",
    code: "11",
    nameJa: "RETICLE",
    nameEn: "RETICLE",
    noteJa: "レティクル。塗りなし、照準だけ。",
    noteEn: "Reticle. No fill, lock-on corners.",
  },
];

type BadgeProps = { kind: OutcomeKind };

const LEGEND_H = 26;
const LEGEND_SKEW = "-14deg";
const LEGEND_SKEW_INV = "14deg";

function LegendScan() {
  const count = Math.max(0, Math.floor((LEGEND_H - 3) / 3) + 1);
  return (
    <View style={styles.legendScan} pointerEvents="none">
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.legendScanLine, { top: 2 + i * 3 }]} />
      ))}
    </View>
  );
}

function CurrentBadge({ kind }: BadgeProps) {
  return (
    <ResultCyberBadgeNative
      kind={kind}
      label={OUTCOME_LABEL[kind]}
      compact
    />
  );
}

function LegendBadge({ kind }: BadgeProps) {
  const tone = OUTCOME_TONE[kind];
  return (
    <View
      style={[
        styles.legendOuter,
        { shadowColor: tone.glow, shadowOpacity: kind === "hit" ? 0.7 : 1 },
      ]}
    >
      <View style={[styles.legendTab, { backgroundColor: tone.accent }]}>
        <LegendScan />
        <Text style={[styles.legendText, { color: tone.fillText }]}>
          {OUTCOME_LABEL[kind]}
        </Text>
      </View>
    </View>
  );
}

function StampBadge({ kind }: BadgeProps) {
  const tone = OUTCOME_TONE[kind];
  return (
    <View style={styles.stampTilt}>
      <View style={[styles.stampOuter, { borderColor: tone.accent }]}>
        <View style={[styles.stampInner, { borderColor: tone.accent }]}>
          <Text style={[styles.stampText, { color: tone.accent }]}>
            {OUTCOME_LABEL[kind]}
          </Text>
        </View>
      </View>
    </View>
  );
}

function DogTagBadge({ kind }: BadgeProps) {
  const tone = OUTCOME_TONE[kind];
  return (
    <View style={[styles.dogTag, { borderColor: tone.accent }]}>
      <View style={[styles.dogHoleRing, { borderColor: tone.accent }]}>
        <View style={styles.dogHole} />
      </View>
      <Text style={[styles.dogText, { color: tone.ink }]}>
        {OUTCOME_LABEL[kind]}
      </Text>
    </View>
  );
}

function KillfeedBadge({ kind }: BadgeProps) {
  const tone = OUTCOME_TONE[kind];
  return (
    <View style={styles.killRow}>
      <View style={[styles.killPip, { backgroundColor: tone.accent }]} />
      <Text style={[styles.killText, { color: tone.accent }]}>
        {OUTCOME_LABEL[kind]}
      </Text>
    </View>
  );
}

function BracketBadge({ kind }: BadgeProps) {
  const tone = OUTCOME_TONE[kind];
  const tick = { borderColor: tone.accent };
  return (
    <View style={styles.bracketBox}>
      <View style={[styles.tickTL, tick]} />
      <View style={[styles.tickTR, tick]} />
      <View style={[styles.tickBL, tick]} />
      <View style={[styles.tickBR, tick]} />
      <Text style={[styles.bracketText, { color: tone.ink }]}>
        {OUTCOME_LABEL[kind]}
      </Text>
    </View>
  );
}

function ChevronV({ color }: { color: string }) {
  return (
    <View style={styles.chevV}>
      <View style={[styles.chevBar, styles.chevBarL, { backgroundColor: color }]} />
      <View style={[styles.chevBar, styles.chevBarR, { backgroundColor: color }]} />
    </View>
  );
}

function ChevronPair({ color }: { color: string }) {
  return (
    <View style={styles.chevStack}>
      <ChevronV color={color} />
      <ChevronV color={color} />
    </View>
  );
}

function ChevronBadge({ kind }: BadgeProps) {
  const tone = OUTCOME_TONE[kind];
  return (
    <View style={styles.chevRow}>
      <ChevronPair color={tone.accent} />
      <Text style={[styles.chevText, { color: tone.accent }]}>
        {OUTCOME_LABEL[kind]}
      </Text>
    </View>
  );
}

function ScorebugBadge({ kind }: BadgeProps) {
  const tone = OUTCOME_TONE[kind];
  return (
    <View style={[styles.scorebug, { backgroundColor: tone.accent }]}>
      <Text style={[styles.scorebugKicker, { color: tone.fillText }]}>
        {OUTCOME_KICKER[kind]}
      </Text>
      <Text style={[styles.scorebugWord, { color: tone.fillText }]}>
        {OUTCOME_LABEL[kind]}
      </Text>
    </View>
  );
}

function HexMarkBadge({ kind }: BadgeProps) {
  const tone = OUTCOME_TONE[kind];
  return (
    <View style={styles.hexRow}>
      <View style={styles.hexWrap}>
        <View style={[styles.hexDiamond, { backgroundColor: tone.accent }]}>
          <Text style={[styles.hexLetter, { color: tone.fillText }]}>
            {OUTCOME_MARK[kind]}
          </Text>
        </View>
      </View>
      <Text style={[styles.hexLabel, { color: tone.accent }]}>
        {OUTCOME_LABEL[kind]}
      </Text>
    </View>
  );
}

function HazardStripes({ color }: { color: string }) {
  return (
    <View style={styles.hazardStripes} pointerEvents="none">
      {Array.from({ length: 14 }, (_, i) => (
        <View
          key={i}
          style={[
            styles.hazardBar,
            { left: i * 7 - 18, backgroundColor: color },
          ]}
        />
      ))}
    </View>
  );
}

function HazardBadge({ kind }: BadgeProps) {
  const tone = OUTCOME_TONE[kind];
  return (
    <View style={[styles.hazardShell, { backgroundColor: tone.fillText }]}>
      <HazardStripes color={tone.accent} />
      <Text style={[styles.hazardText, { color: tone.accent }]}>
        {OUTCOME_LABEL[kind]}
      </Text>
    </View>
  );
}

export function ImpactTag({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <View style={styles.impactWrap}>
      <Text style={[styles.impactText, { color }]}>{label}</Text>
      <View style={[styles.impactSlash, { backgroundColor: color }]} />
    </View>
  );
}

function ImpactBadge({ kind }: BadgeProps) {
  const tone = OUTCOME_TONE[kind];
  return <ImpactTag label={OUTCOME_LABEL[kind]} color={tone.accent} />;
}

function ReticleBadge({ kind }: BadgeProps) {
  const tone = OUTCOME_TONE[kind];
  const arm = { backgroundColor: tone.accent };
  return (
    <View style={styles.reticleBox}>
      <View style={[styles.retH, styles.retTLH, arm]} />
      <View style={[styles.retV, styles.retTLV, arm]} />
      <View style={[styles.retH, styles.retTRH, arm]} />
      <View style={[styles.retV, styles.retTRV, arm]} />
      <View style={[styles.retH, styles.retBLH, arm]} />
      <View style={[styles.retV, styles.retBLV, arm]} />
      <View style={[styles.retH, styles.retBRH, arm]} />
      <View style={[styles.retV, styles.retBRV, arm]} />
      <Text style={[styles.reticleText, { color: tone.accent }]}>
        {OUTCOME_LABEL[kind]}
      </Text>
    </View>
  );
}

export function ResultBadgePattern({
  id,
  kind,
}: {
  id: PatternId;
  kind: OutcomeKind;
}) {
  switch (id) {
    case "current":
      return <CurrentBadge kind={kind} />;
    case "legend":
      return <LegendBadge kind={kind} />;
    case "stamp":
      return <StampBadge kind={kind} />;
    case "dogtag":
      return <DogTagBadge kind={kind} />;
    case "killfeed":
      return <KillfeedBadge kind={kind} />;
    case "bracket":
      return <BracketBadge kind={kind} />;
    case "chevron":
      return <ChevronBadge kind={kind} />;
    case "scorebug":
      return <ScorebugBadge kind={kind} />;
    case "hexmark":
      return <HexMarkBadge kind={kind} />;
    case "hazard":
      return <HazardBadge kind={kind} />;
    case "impact":
      return <ImpactBadge kind={kind} />;
    case "reticle":
      return <ReticleBadge kind={kind} />;
    default:
      return null;
  }
}

const TICK = 8;
const TICK_W = 2;

const styles = StyleSheet.create({
  legendOuter: {
    flexShrink: 0,
    overflow: "visible",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
  },
  legendTab: {
    position: "relative",
    overflow: "hidden",
    height: LEGEND_H,
    minHeight: LEGEND_H,
    justifyContent: "center",
    paddingHorizontal: 10,
    transform: [{ skewX: LEGEND_SKEW }],
  },
  legendScan: {
    ...StyleSheet.absoluteFillObject,
  },
  legendScanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  legendText: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
    includeFontPadding: false,
    transform: [{ skewX: LEGEND_SKEW_INV }],
  },

  stampTilt: {
    transform: [{ rotate: "-4deg" }],
  },
  stampOuter: {
    borderWidth: 2,
    padding: 2,
  },
  stampInner: {
    borderWidth: 1,
    borderStyle: "dashed",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  stampText: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 13,
    letterSpacing: 1.6,
    includeFontPadding: false,
  },

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
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  dogHole: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#05070c",
  },
  dogText: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    includeFontPadding: false,
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
  killText: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    includeFontPadding: false,
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
  bracketText: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    includeFontPadding: false,
  },

  chevRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chevStack: {
    gap: 2,
    justifyContent: "center",
  },
  chevV: {
    width: 12,
    height: 7,
  },
  chevBar: {
    position: "absolute",
    top: 2,
    width: 8,
    height: 2,
  },
  chevBarL: {
    left: 0,
    transform: [{ rotate: "-38deg" }],
  },
  chevBarR: {
    right: 0,
    transform: [{ rotate: "38deg" }],
  },
  chevText: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 15,
    letterSpacing: 1.2,
    includeFontPadding: false,
  },

  scorebug: {
    paddingHorizontal: 8,
    paddingTop: 2,
    paddingBottom: 3,
    minWidth: 52,
  },
  scorebugKicker: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 1.6,
    includeFontPadding: false,
    opacity: 0.72,
  },
  scorebugWord: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 16,
    letterSpacing: 0.8,
    lineHeight: 18,
    includeFontPadding: false,
    marginTop: -1,
  },

  hexRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  hexWrap: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  hexDiamond: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
  },
  hexLetter: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 9,
    fontWeight: "800",
    includeFontPadding: false,
    transform: [{ rotate: "-45deg" }],
  },
  hexLabel: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
    includeFontPadding: false,
  },

  hazardShell: {
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  hazardStripes: {
    ...StyleSheet.absoluteFillObject,
  },
  hazardBar: {
    position: "absolute",
    top: -10,
    width: 4,
    height: 48,
    opacity: 0.55,
    transform: [{ rotate: "28deg" }],
  },
  hazardText: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    includeFontPadding: false,
    zIndex: 1,
  },

  impactWrap: {
    alignItems: "flex-start",
  },
  impactText: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.4,
    includeFontPadding: false,
  },
  impactSlash: {
    height: 2,
    alignSelf: "stretch",
    marginTop: 1,
    transform: [{ rotate: "-8deg" }],
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
  reticleText: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    includeFontPadding: false,
  },
});
