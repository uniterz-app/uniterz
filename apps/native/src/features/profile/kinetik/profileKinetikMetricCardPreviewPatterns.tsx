/**
 * __DEV__ プロフィール 2x2 メトリクスカード見た目案。本番コンポーネントは未接続。
 */
import { StyleSheet, Text, View } from "react-native";
import { MATCH_CARD_METRIC_FONT } from "../../games/matchCardTypography";
import {
  KINETIK_METRIC_ACCENT,
  type KinetikMetricAccent,
} from "./profileKinetikNativeTheme";

export type MetricPreviewPatternId =
  | "current"
  | "frame"
  | "corners"
  | "top-hair"
  | "value-first"
  | "gold-steel"
  | "grid-slab";

export type PatternMeta = {
  id: MetricPreviewPatternId;
  code: string;
  nameJa: string;
  nameEn: string;
  noteJa: string;
  noteEn: string;
};

export const PATTERN_GALLERY: PatternMeta[] = [
  {
    id: "current",
    code: "A",
    nameJa: "現行 · 左レール",
    nameEn: "Current · left rail",
    noteJa: "今の本番。黒塗り。Free は白レール、Pro は色レール＋数値色。",
    noteEn: "Production. Black fill. Free white rail, Pro colored rail + value.",
  },
  {
    id: "frame",
    code: "B",
    nameJa: "枠だけ",
    nameEn: "Frame only",
    noteJa: "左バーなし。外周 1px。Pro だけ上辺に色のヘアライン。",
    noteEn: "No left bar. 1px frame. Pro gets a colored top hairline.",
  },
  {
    id: "corners",
    code: "C",
    nameJa: "四隅 HUD",
    nameEn: "Corner HUD",
    noteJa: "試合カード寄りの L 字コーナー。Pro はコーナーが指標色。",
    noteEn: "Match-card L corners. Pro corners take the metric color.",
  },
  {
    id: "top-hair",
    code: "D",
    nameJa: "上辺スキャン",
    nameEn: "Top scan",
    noteJa: "上辺 1px が主役。順位チップは右上。バーは出さない。",
    noteEn: "Top 1px is the accent. Rank chip top-right. No left bar.",
  },
  {
    id: "value-first",
    code: "E",
    nameJa: "数値ファースト",
    nameEn: "Value first",
    noteJa: "数字を大きく、ラベルは下。セグメントは底辺のトラック。",
    noteEn: "Big number, label under. Segments as a bottom track.",
  },
  {
    id: "gold-steel",
    code: "F",
    nameJa: "金 / 鋼",
    nameEn: "Gold / steel",
    noteJa: "プラン差を材質で。Free 鋼白、Pro 金枠・金数値。セグメントなし。",
    noteEn: "Plan via material. Free steel, Pro gold. No segment bars.",
  },
  {
    id: "grid-slab",
    code: "G",
    nameJa: "方眼スラブ",
    nameEn: "Grid slab",
    noteJa: "ランキングシェルと同じ薄い方眼。Pro は方眼が指標色。",
    noteEn: "Rankings-style faint grid. Pro grid tints to the metric.",
  },
];

type MetricItem = {
  key: string;
  label: string;
  hint: string;
  value: string;
  unit?: string;
  footnote?: string;
  rank?: string;
  accent: KinetikMetricAccent;
  segs: number;
};

const ITEMS: MetricItem[] = [
  {
    key: "win",
    label: "勝率",
    hint: "%",
    value: "63.4%",
    footnote: "投稿 71 · 的中 45",
    accent: "green",
    segs: 3,
  },
  {
    key: "pts",
    label: "総合得点",
    hint: "累計",
    value: "350",
    unit: "PTS",
    rank: "14位",
    accent: "magenta",
    segs: 4,
  },
  {
    key: "upset",
    label: "UPSET",
    hint: "累計",
    value: "96.5",
    unit: "PTS",
    accent: "red",
    segs: 2,
  },
  {
    key: "scorer",
    label: "最多得点者",
    hint: "累計",
    value: "12",
    unit: "試合",
    accent: "cyan",
    segs: 3,
  },
];

function ink(isPro: boolean, accent: KinetikMetricAccent, gold: boolean) {
  if (gold && isPro) return "#E8C66A";
  if (isPro) return KINETIK_METRIC_ACCENT[accent].line;
  return "#FFFFFF";
}

function muted(isPro: boolean, accent: KinetikMetricAccent, gold: boolean) {
  if (gold && isPro) return "rgba(232,198,106,0.62)";
  if (isPro) return KINETIK_METRIC_ACCENT[accent].line;
  return "rgba(255,255,255,0.58)";
}

function Segs({
  filled,
  color,
}: {
  filled: number;
  color: string;
}) {
  return (
    <View style={styles.segRow}>
      {Array.from({ length: 5 }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.seg,
            { backgroundColor: i < filled ? color : "rgba(255,255,255,0.12)" },
          ]}
        />
      ))}
    </View>
  );
}

function CornerTicks({ color }: { color: string }) {
  return (
    <>
      <View style={[styles.tick, styles.tickTL, { borderColor: color }]} />
      <View style={[styles.tick, styles.tickTR, { borderColor: color }]} />
      <View style={[styles.tick, styles.tickBL, { borderColor: color }]} />
      <View style={[styles.tick, styles.tickBR, { borderColor: color }]} />
    </>
  );
}

function GridOverlay({ color }: { color: string }) {
  return (
    <View pointerEvents="none" style={styles.gridOverlay}>
      {Array.from({ length: 8 }).map((_, i) => (
        <View
          key={`v${i}`}
          style={[
            styles.gridLineV,
            { left: i * 22, backgroundColor: color },
          ]}
        />
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <View
          key={`h${i}`}
          style={[
            styles.gridLineH,
            { top: i * 22, backgroundColor: color },
          ]}
        />
      ))}
    </View>
  );
}

function MetricPreviewCard({
  pattern,
  isPro,
  item,
}: {
  pattern: MetricPreviewPatternId;
  isPro: boolean;
  item: MetricItem;
}) {
  const gold = pattern === "gold-steel";
  const accent = ink(isPro, item.accent, gold);
  const quiet = muted(isPro, item.accent, gold);
  const frame =
    gold && isPro
      ? "#E8C66A"
      : pattern === "frame" && isPro
        ? `${accent}55`
        : "rgba(255,255,255,0.22)";

  const showLeftRail = pattern === "current";
  const showTopHair = pattern === "top-hair" || pattern === "frame";
  const showCorners = pattern === "corners";
  const showGrid = pattern === "grid-slab";
  const valueFirst = pattern === "value-first";
  const doubleGold = gold && isPro;
  const doubleSteel = gold && !isPro;
  const showSegs = !gold;
  const railPad = showLeftRail ? styles.railPad : undefined;

  return (
    <View
      style={[
        styles.card,
        valueFirst && styles.cardValueFirst,
        { borderColor: frame },
        (doubleGold || doubleSteel) && styles.cardGoldInner,
      ]}
    >
      {doubleGold ? <View pointerEvents="none" style={styles.goldInner} /> : null}
      {doubleSteel ? <View pointerEvents="none" style={styles.steelInner} /> : null}
      {showGrid ? (
        <GridOverlay color={isPro ? `${accent}28` : "rgba(255,255,255,0.08)"} />
      ) : null}
      {showCorners ? <CornerTicks color={accent} /> : null}
      {showLeftRail ? (
        <View
          style={[
            styles.leftRail,
            isPro ? styles.leftRailPro : styles.leftRailFree,
            { backgroundColor: accent },
          ]}
        />
      ) : null}
      {showTopHair ? (
        <View style={[styles.topHair, { backgroundColor: isPro ? accent : "#FFFFFF" }]} />
      ) : null}

      {valueFirst ? (
        <View style={[railPad, styles.body]}>
          <View style={styles.valueFirstRow}>
            <Text style={[styles.valueLg, { color: isPro ? accent : "#FFFFFF" }]}>
              {item.value}
            </Text>
            {item.unit ? (
              <Text style={[styles.unit, { color: quiet }]}>{item.unit}</Text>
            ) : null}
            {item.rank ? (
              <Text style={[styles.rankChip, { color: quiet, borderColor: `${quiet}55` }]}>
                {item.rank}
              </Text>
            ) : null}
          </View>
          <Text style={[styles.labelUnder, { color: quiet }]}>
            {item.label}
            {item.hint ? `  ${item.hint}` : ""}
          </Text>
          {showSegs ? (
            <Segs filled={item.segs} color={isPro ? accent : "#FFFFFF"} />
          ) : null}
          {item.footnote ? (
            <Text style={styles.footnote}>{item.footnote}</Text>
          ) : null}
        </View>
      ) : (
        <View style={[railPad, styles.body]}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: quiet }]} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={[styles.hint, { color: "rgba(255,255,255,0.45)" }]}>
              {item.hint}
            </Text>
            {item.rank && pattern === "top-hair" ? (
              <Text style={[styles.rankChip, { color: quiet, borderColor: `${quiet}55` }]}>
                {item.rank}
              </Text>
            ) : null}
          </View>
          <View style={styles.valueRow}>
            <Text style={[styles.value, { color: isPro ? accent : "#FFFFFF" }]}>
              {item.value}
            </Text>
            {item.unit ? (
              <Text style={[styles.unit, { color: quiet }]}>{item.unit}</Text>
            ) : null}
            {item.rank && pattern !== "top-hair" ? (
              <Text style={[styles.rankChip, { color: quiet, borderColor: `${quiet}55` }]}>
                {item.rank}
              </Text>
            ) : null}
          </View>
          {showSegs && pattern !== "top-hair" ? (
            <Segs filled={item.segs} color={isPro ? accent : "#FFFFFF"} />
          ) : null}
          {item.footnote ? (
            <Text style={styles.footnote}>{item.footnote}</Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

export function MetricPatternGrid({
  pattern,
  isPro,
}: {
  pattern: MetricPreviewPatternId;
  isPro: boolean;
}) {
  return (
    <View style={styles.grid}>
      {ITEMS.map((item) => (
        <MetricPreviewCard
          key={item.key}
          pattern={pattern}
          isPro={isPro}
          item={item}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  railPad: {
    paddingLeft: 8,
  },
  body: {
    zIndex: 1,
  },
  card: {
    width: "47%",
    flexGrow: 1,
    minHeight: 104,
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 12,
    overflow: "hidden",
    position: "relative",
  },
  cardValueFirst: {
    minHeight: 118,
    paddingTop: 14,
  },
  cardGoldInner: {
    borderWidth: 1,
  },
  goldInner: {
    ...StyleSheet.absoluteFillObject,
    margin: 3,
    borderWidth: 1,
    borderColor: "rgba(232,198,106,0.45)",
  },
  steelInner: {
    ...StyleSheet.absoluteFillObject,
    margin: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  leftRail: {
    position: "absolute",
    left: 0,
    top: 14,
    bottom: 14,
  },
  leftRailFree: {
    width: 2,
  },
  leftRailPro: {
    width: 4,
    borderRadius: 2,
  },
  topHair: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  tick: {
    position: "absolute",
    width: 10,
    height: 10,
  },
  tickTL: {
    top: 0,
    left: 0,
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  tickTR: {
    top: 0,
    right: 0,
    borderTopWidth: 1,
    borderRightWidth: 1,
  },
  tickBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
  },
  tickBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
  },
  gridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
  },
  gridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 0,
  },
  label: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    flexShrink: 1,
  },
  hint: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 6,
  },
  value: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 19,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-12deg" }],
  },
  valueLg: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 26,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.4,
    transform: [{ skewX: "-12deg" }],
  },
  unit: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 10,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  rankChip: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 9,
    letterSpacing: 0.8,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginBottom: 2,
    marginLeft: "auto",
  },
  valueFirstRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  labelUnder: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 10,
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: 8,
  },
  segRow: {
    flexDirection: "row",
    gap: 3,
    marginTop: 8,
  },
  seg: {
    flex: 1,
    height: 4,
  },
  footnote: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 9,
    color: "rgba(255,255,255,0.48)",
    marginTop: 8,
  },
});
