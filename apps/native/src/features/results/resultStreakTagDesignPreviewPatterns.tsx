/**
 * __DEV__ リザルトカード左上・連勝タグ見た目案。本番は未接続。
 * ラベルは常に `W{n}`。色は `lib/result/streakTagTone`（3 鋼 / 5 シアン / 7 金 / 10 紅）。
 */
import { StyleSheet, Text, View } from "react-native";
import {
  MATCH_CARD_DISPLAY_FONT,
  MATCH_CARD_METRIC_FONT,
  MATCH_CARD_SCORE_FONT,
} from "../games/matchCardTypography";
import {
  streakTagLabel,
  streakTagTone,
} from "@/lib/result/streakTagTone";

export const STREAK_SAMPLES = [3, 5, 7, 10] as const;
export type StreakSample = (typeof STREAK_SAMPLES)[number];
export { streakTagTone } from "@/lib/result/streakTagTone";

export function streakLabel(n: number) {
  return streakTagLabel(n);
}

export type StreakPatternId =
  | "current"
  | "impact"
  | "ghost"
  | "solid"
  | "chip"
  | "flag"
  | "stack"
  | "bracket"
  | "scorebug"
  | "tape"
  | "corner"
  | "pip"
  | "hex"
  | "ticks"
  | "killfeed"
  | "hotbar";

export type StreakPatternMeta = {
  id: StreakPatternId;
  code: string;
  nameJa: string;
  nameEn: string;
  noteJa: string;
  noteEn: string;
};

export const STREAK_PATTERN_GALLERY: StreakPatternMeta[] = [
  {
    id: "current",
    code: "00",
    nameJa: "現行 IMPACT",
    nameEn: "Current IMPACT",
    noteJa: "新カード左上。斜め文字 + アンダー。いまは常に黄。",
    noteEn: "New card top-left. Italic + slash. Gold only today.",
  },
  {
    id: "impact",
    code: "01",
    nameJa: "IMPACT 階調",
    nameEn: "IMPACT ramp",
    noteJa: "現行と同じ形。連勝で色だけ変える最小差分。",
    noteEn: "Same form as production. Color ramps with streak.",
  },
  {
    id: "ghost",
    code: "02",
    nameJa: "ゴースト枠",
    nameEn: "Ghost frame",
    noteJa: "塗りなし。1px 枠だけ。カード面を汚さない。",
    noteEn: "No fill. 1px frame only. Quiet on the card face.",
  },
  {
    id: "solid",
    code: "03",
    nameJa: "塗りピル",
    nameEn: "Solid pill",
    noteJa: "アクセント全塗り。数字はインク色。最も読める。",
    noteEn: "Full accent fill. Ink-colored type. Highest contrast.",
  },
  {
    id: "chip",
    code: "04",
    nameJa: "HUD チップ",
    nameEn: "HUD chip",
    noteJa: "薄いウォッシュ + 枠。試合カード CTA に近い密度。",
    noteEn: "Wash + border. Same density as match-card CTAs.",
  },
  {
    id: "flag",
    code: "05",
    nameJa: "ペナント",
    nameEn: "Pennant",
    noteJa: "左上から右へ飛び出す旗。カード角の錨になる。",
    noteEn: "Flag flying off the top-left. Anchors the corner.",
  },
  {
    id: "stack",
    code: "06",
    nameJa: "W / 数 縦積み",
    nameEn: "Stacked W / n",
    noteJa: "W を小さく、数字を大きく。視線は数字へ。",
    noteEn: "Tiny W, large number. Eye lands on the count.",
  },
  {
    id: "bracket",
    code: "07",
    nameJa: "ブラケット",
    nameEn: "Bracket",
    noteJa: "[ W3 ] キルログ風。文字以外は線だけ。",
    noteEn: "[ W3 ] kill-log. Type plus rails only.",
  },
  {
    id: "scorebug",
    code: "08",
    nameJa: "スコアバグ",
    nameEn: "Scorebug",
    noteJa: "放送テロップ。上辺の光点 + 等幅。",
    noteEn: "Broadcast bug. Top pip + tabular type.",
  },
  {
    id: "tape",
    code: "09",
    nameJa: "ハザード",
    nameEn: "Hazard tape",
    noteJa: "斜めストライプ。連勝が危険水域に入った感じ。",
    noteEn: "Diagonal stripes. Reads as a heat warning.",
  },
  {
    id: "corner",
    code: "10",
    nameJa: "L コーナー",
    nameEn: "L corner",
    noteJa: "カード角そのものをタグにする。枠の延長。",
    noteEn: "The card corner IS the tag. Frame extension.",
  },
  {
    id: "pip",
    code: "11",
    nameJa: "ピップ",
    nameEn: "Pip + type",
    noteJa: "色点 + W3。最小面積。バッジと喧嘩しない。",
    noteEn: "Color pip + W3. Smallest footprint.",
  },
  {
    id: "hex",
    code: "12",
    nameJa: "ダイヤ数字",
    nameEn: "Diamond numeral",
    noteJa: "W を捨てて数字だけ。3 / 5 / 7 / 10。",
    noteEn: "Drop the W. Number in a diamond only.",
  },
  {
    id: "ticks",
    code: "13",
    nameJa: "ハッシュ",
    nameEn: "Hash ticks",
    noteJa: "W3 の下に連勝本数の線。数そのものが模様。",
    noteEn: "Tick marks under W3. Count becomes texture.",
  },
  {
    id: "killfeed",
    code: "14",
    nameJa: "キルフィード",
    nameEn: "Killfeed",
    noteJa: "» W3。速報1行。炎アイコンなし。",
    noteEn: "» W3. One-line feed. No flame icon.",
  },
  {
    id: "hotbar",
    code: "15",
    nameJa: "ヒートバー",
    nameEn: "Heat bar",
    noteJa: "文字は W3。下のバー長が連勝。色も連動。",
    noteEn: "Type stays W3. Bar length + color track streak.",
  },
];

type TagProps = { n: number };

function CurrentTag({ n }: TagProps) {
  const t = streakTagTone(n);
  return (
    <View style={styles.impactWrap}>
      <Text style={[styles.impactText, { color: t.accent }]}>{streakLabel(n)}</Text>
      <View style={[styles.impactSlash, { backgroundColor: t.accent }]} />
    </View>
  );
}

function ImpactTag({ n }: TagProps) {
  const t = streakTagTone(n);
  return (
    <View style={styles.impactWrap}>
      <Text style={[styles.impactText, { color: t.accent }]}>{streakLabel(n)}</Text>
      <View style={[styles.impactSlash, { backgroundColor: t.accent }]} />
    </View>
  );
}

function GhostTag({ n }: TagProps) {
  const t = streakTagTone(n);
  return (
    <View style={[styles.ghostBox, { borderColor: t.accent }]}>
      <Text style={[styles.chipText, { color: t.accent }]}>{streakLabel(n)}</Text>
    </View>
  );
}

function SolidTag({ n }: TagProps) {
  const t = streakTagTone(n);
  return (
    <View
      style={[
        styles.solidBox,
        { backgroundColor: t.accent, shadowColor: t.accent, shadowOpacity: 0.45, shadowRadius: 8 },
      ]}
    >
      <Text style={[styles.solidText, { color: t.ink }]}>{streakLabel(n)}</Text>
    </View>
  );
}

function ChipTag({ n }: TagProps) {
  const t = streakTagTone(n);
  return (
    <View style={[styles.chipBox, { borderColor: t.accent, backgroundColor: t.wash }]}>
      <Text style={[styles.chipText, { color: t.accent }]}>{streakLabel(n)}</Text>
    </View>
  );
}

function FlagTag({ n }: TagProps) {
  const t = streakTagTone(n);
  return (
    <View style={styles.flagRow}>
      <View style={[styles.flagBody, { backgroundColor: t.accent }]}>
        <Text style={[styles.solidText, { color: t.ink }]}>{streakLabel(n)}</Text>
      </View>
      <View
        style={[
          styles.flagTail,
          {
            borderTopColor: "transparent",
            borderBottomColor: "transparent",
            borderLeftColor: t.accent,
          },
        ]}
      />
    </View>
  );
}

function StackTag({ n }: TagProps) {
  const t = streakTagTone(n);
  return (
    <View style={styles.stackCol}>
      <Text style={[styles.stackW, { color: t.accent }]}>W</Text>
      <Text style={[styles.stackN, { color: t.accent }]}>{n}</Text>
    </View>
  );
}

function BracketTag({ n }: TagProps) {
  const t = streakTagTone(n);
  return (
    <View style={styles.bracketRow}>
      <View style={[styles.bracketRail, { backgroundColor: t.accent }]} />
      <Text style={[styles.chipText, { color: t.accent }]}>{streakLabel(n)}</Text>
      <View style={[styles.bracketRail, { backgroundColor: t.accent }]} />
    </View>
  );
}

function ScorebugTag({ n }: TagProps) {
  const t = streakTagTone(n);
  return (
    <View style={[styles.scorebug, { borderColor: t.accent, backgroundColor: t.wash }]}>
      <View style={[styles.scorebugPip, { backgroundColor: t.accent }]} />
      <Text style={[styles.scorebugText, { color: t.accent }]}>{streakLabel(n)}</Text>
    </View>
  );
}

function TapeTag({ n }: TagProps) {
  const t = streakTagTone(n);
  return (
    <View style={[styles.tapeShell, { borderColor: t.accent }]}>
      {Array.from({ length: 7 }, (_, i) => (
        <View
          key={i}
          style={[
            styles.tapeBar,
            {
              left: i * 7 - 8,
              backgroundColor: t.accent,
            },
          ]}
        />
      ))}
      <Text style={[styles.tapeText, { color: t.accent }]}>{streakLabel(n)}</Text>
    </View>
  );
}

function CornerTag({ n }: TagProps) {
  const t = streakTagTone(n);
  return (
    <View style={styles.cornerBox}>
      <View style={[styles.cornerH, { backgroundColor: t.accent }]} />
      <View style={[styles.cornerV, { backgroundColor: t.accent }]} />
      <Text style={[styles.chipText, { color: t.accent, marginLeft: 6, marginTop: 4 }]}>
        {streakLabel(n)}
      </Text>
    </View>
  );
}

function PipTag({ n }: TagProps) {
  const t = streakTagTone(n);
  return (
    <View style={styles.pipRow}>
      <View style={[styles.pipDot, { backgroundColor: t.accent, shadowColor: t.accent }]} />
      <Text style={[styles.chipText, { color: t.accent }]}>{streakLabel(n)}</Text>
    </View>
  );
}

function HexTag({ n }: TagProps) {
  const t = streakTagTone(n);
  return (
    <View style={[styles.hexOuter, { borderColor: t.accent, backgroundColor: t.wash }]}>
      <Text style={[styles.hexText, { color: t.accent }]}>{n}</Text>
    </View>
  );
}

function TicksTag({ n }: TagProps) {
  const t = streakTagTone(n);
  const ticks = Math.min(n, 8);
  return (
    <View style={styles.ticksWrap}>
      <Text style={[styles.chipText, { color: t.accent }]}>{streakLabel(n)}</Text>
      <View style={styles.ticksRow}>
        {Array.from({ length: ticks }, (_, i) => (
          <View key={i} style={[styles.tick, { backgroundColor: t.accent }]} />
        ))}
      </View>
    </View>
  );
}

function KillfeedTag({ n }: TagProps) {
  const t = streakTagTone(n);
  return (
    <View style={styles.killRow}>
      <Text style={[styles.killArrow, { color: t.accent }]}>»</Text>
      <Text style={[styles.killText, { color: t.accent }]}>{streakLabel(n)}</Text>
    </View>
  );
}

function HotbarTag({ n }: TagProps) {
  const t = streakTagTone(n);
  const pct = n >= 10 ? 1 : n >= 7 ? 0.78 : n >= 5 ? 0.52 : 0.32;
  return (
    <View style={styles.hotWrap}>
      <Text style={[styles.chipText, { color: t.accent }]}>{streakLabel(n)}</Text>
      <View style={styles.hotTrack}>
        <View
          style={[
            styles.hotFill,
            {
              width: `${Math.round(pct * 100)}%`,
              backgroundColor: t.accent,
            },
          ]}
        />
      </View>
    </View>
  );
}

export function ResultStreakTagPattern({
  id,
  n,
}: {
  id: StreakPatternId;
  n: number;
}) {
  switch (id) {
    case "current":
      return <CurrentTag n={n} />;
    case "impact":
      return <ImpactTag n={n} />;
    case "ghost":
      return <GhostTag n={n} />;
    case "solid":
      return <SolidTag n={n} />;
    case "chip":
      return <ChipTag n={n} />;
    case "flag":
      return <FlagTag n={n} />;
    case "stack":
      return <StackTag n={n} />;
    case "bracket":
      return <BracketTag n={n} />;
    case "scorebug":
      return <ScorebugTag n={n} />;
    case "tape":
      return <TapeTag n={n} />;
    case "corner":
      return <CornerTag n={n} />;
    case "pip":
      return <PipTag n={n} />;
    case "hex":
      return <HexTag n={n} />;
    case "ticks":
      return <TicksTag n={n} />;
    case "killfeed":
      return <KillfeedTag n={n} />;
    case "hotbar":
      return <HotbarTag n={n} />;
    default:
      return <ImpactTag n={n} />;
  }
}

const styles = StyleSheet.create({
  impactWrap: { alignItems: "flex-start" },
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

  ghostBox: {
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  chipBox: {
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  chipText: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    includeFontPadding: false,
  },

  solidBox: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  solidText: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.9,
    includeFontPadding: false,
  },

  flagRow: { flexDirection: "row", alignItems: "stretch" },
  flagBody: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: "center",
  },
  flagTail: {
    width: 0,
    height: 0,
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderLeftWidth: 8,
  },

  stackCol: { alignItems: "center" },
  stackW: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.6,
    includeFontPadding: false,
  },
  stackN: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 22,
    letterSpacing: 0.4,
    marginTop: -4,
    includeFontPadding: false,
  },

  bracketRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  bracketRail: { width: 2, height: 14 },

  scorebug: {
    position: "relative",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 3,
  },
  scorebugPip: {
    position: "absolute",
    top: 0,
    left: 8,
    right: 8,
    height: 2,
  },
  scorebugText: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    includeFontPadding: false,
  },

  tapeShell: {
    overflow: "hidden",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tapeBar: {
    position: "absolute",
    top: -8,
    width: 3,
    height: 36,
    opacity: 0.38,
    transform: [{ rotate: "28deg" }],
  },
  tapeText: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    includeFontPadding: false,
    zIndex: 1,
  },

  cornerBox: {
    position: "relative",
    paddingRight: 4,
    paddingBottom: 2,
    minWidth: 36,
  },
  cornerH: { position: "absolute", left: 0, top: 0, width: 16, height: 2 },
  cornerV: { position: "absolute", left: 0, top: 0, width: 2, height: 16 },

  pipRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  pipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
  },

  hexOuter: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    transform: [{ rotate: "45deg" }],
  },
  hexText: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    includeFontPadding: false,
    transform: [{ rotate: "-45deg" }],
  },

  ticksWrap: { alignItems: "flex-start", gap: 3 },
  ticksRow: { flexDirection: "row", gap: 2 },
  tick: { width: 3, height: 7 },

  killRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  killArrow: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 13,
    fontWeight: "800",
    includeFontPadding: false,
  },
  killText: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.3,
    includeFontPadding: false,
  },

  hotWrap: { width: 44, gap: 3 },
  hotTrack: {
    height: 3,
    backgroundColor: "rgba(148,163,184,0.18)",
    overflow: "hidden",
  },
  hotFill: { height: 3 },
});
