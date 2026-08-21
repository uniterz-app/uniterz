/**
 * __DEV__ MARK / MARKED チップ見た目案。本番チップは未差し替え。
 */
import { useState, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Polygon } from "react-native-svg";
import MobilePageShell from "./MobilePageShell";

type ChipProps = { on: boolean };

const CYAN = "#00F5FF";
const INK = "#050508";
const OX = "Oxanium_700Bold";
const OX_X = "Oxanium_800ExtraBold";
const BEBAS = "BebasNeue_400Regular";

function ChipCurrent({ on }: ChipProps) {
  return (
    <View style={[chip.base, on ? chip.fill : chip.ghost]}>
      <Text style={[chip.ox, on ? chip.ink : chip.cyan]}>{on ? "MARKED" : "MARK"}</Text>
    </View>
  );
}

function ChipOutline({ on }: ChipProps) {
  return (
    <View style={[chip.base, { borderColor: CYAN, backgroundColor: on ? CYAN : "transparent" }]}>
      <Text style={[chip.ox, { color: on ? INK : CYAN }]}>{on ? "MARKED" : "MARK"}</Text>
    </View>
  );
}

function ChipInvert({ on }: ChipProps) {
  return (
    <View
      style={[
        chip.base,
        { borderColor: CYAN, backgroundColor: on ? INK : "transparent" },
      ]}
    >
      <Text style={[chip.ox, { color: CYAN }]}>{on ? "MARKED" : "MARK"}</Text>
    </View>
  );
}

function ChipScan({ on }: ChipProps) {
  return (
    <View style={[chip.base, on ? chip.fill : chip.ghost, { overflow: "hidden" }]}>
      {on ? <View style={chip.scan} /> : null}
      <Text style={[chip.ox, on ? chip.ink : chip.cyan]}>{on ? "MARKED" : "MARK"}</Text>
    </View>
  );
}

function ChipSlant({ on }: ChipProps) {
  return (
    <View style={{ transform: [{ skewX: "-10deg" }] }}>
      <View style={[chip.base, on ? chip.fill : chip.ghost]}>
        <Text
          style={[chip.ox, on ? chip.ink : chip.cyan, { transform: [{ skewX: "10deg" }] }]}
        >
          {on ? "MARKED" : "MARK"}
        </Text>
      </View>
    </View>
  );
}

function ChipPill({ on }: ChipProps) {
  return (
    <View style={[chip.base, chip.pill, on ? chip.fill : chip.ghost]}>
      <Text style={[chip.ox, on ? chip.ink : chip.cyan]}>{on ? "MARKED" : "MARK"}</Text>
    </View>
  );
}

function ChipChamfer({ on }: ChipProps) {
  const label = on ? "MARKED" : "MARK";
  const w = on ? 78 : 52;
  const h = 22;
  const cut = 5;
  const fill = on ? CYAN : "transparent";
  const stroke = CYAN;
  return (
    <View style={{ width: w, height: h }}>
      <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
        <Polygon
          points={`${cut},0 ${w},0 ${w},${h - cut} ${w - cut},${h} 0,${h} 0,${cut}`}
          fill={fill}
          stroke={stroke}
          strokeWidth={1}
        />
      </Svg>
      <View style={chip.svgCenter}>
        <Text style={[chip.ox, { color: on ? INK : CYAN, fontSize: 10 }]}>{label}</Text>
      </View>
    </View>
  );
}

function ChipBookmark({ on }: ChipProps) {
  return (
    <View style={[chip.base, chip.row, on ? chip.fill : chip.ghost]}>
      <MaterialCommunityIcons
        name={on ? "bookmark" : "bookmark-outline"}
        size={12}
        color={on ? INK : CYAN}
      />
      <Text style={[chip.ox, on ? chip.ink : chip.cyan]}>{on ? "MARKED" : "MARK"}</Text>
    </View>
  );
}

function ChipTick({ on }: ChipProps) {
  return (
    <View style={[chip.base, chip.row, on ? chip.fill : chip.ghost]}>
      {on ? (
        <MaterialCommunityIcons name="check-bold" size={11} color={INK} />
      ) : (
        <View style={chip.tickEmpty} />
      )}
      <Text style={[chip.ox, on ? chip.ink : chip.cyan]}>{on ? "MARKED" : "MARK"}</Text>
    </View>
  );
}

function ChipDiamond({ on }: ChipProps) {
  return (
    <View style={[chip.row, { paddingVertical: 3, paddingHorizontal: 2, gap: 6 }]}>
      <View style={[chip.diamond, { backgroundColor: on ? CYAN : "transparent", borderColor: CYAN }]} />
      <Text style={[chip.ox, { color: on ? CYAN : "rgba(165,243,252,0.7)" }]}>
        {on ? "MARKED" : "MARK"}
      </Text>
    </View>
  );
}

function ChipBrackets({ on }: ChipProps) {
  return (
    <View style={[chip.row, { gap: 3, paddingVertical: 3 }]}>
      <Text style={[chip.ox, chip.cyan, { fontSize: 12 }]}>[</Text>
      <Text style={[chip.ox, { color: on ? CYAN : "rgba(165,243,252,0.55)" }]}>
        {on ? "MARKED" : "MARK"}
      </Text>
      <Text style={[chip.ox, chip.cyan, { fontSize: 12 }]}>]</Text>
    </View>
  );
}

function ChipHairline({ on }: ChipProps) {
  return (
    <View style={[chip.base, chip.hair, on ? { backgroundColor: "rgba(0,245,255,0.12)" } : null]}>
      <View style={[chip.corner, chip.tl]} />
      <View style={[chip.corner, chip.tr]} />
      <View style={[chip.corner, chip.bl]} />
      <View style={[chip.corner, chip.br]} />
      <Text style={[chip.ox, { color: on ? CYAN : "rgba(165,243,252,0.7)" }]}>
        {on ? "MARKED" : "MARK"}
      </Text>
    </View>
  );
}

function ChipStencil({ on }: ChipProps) {
  return (
    <View style={{ paddingVertical: 2, alignItems: "center" }}>
      <Text
        style={[
          chip.ox,
          {
            color: on ? CYAN : "rgba(165,243,252,0.55)",
            letterSpacing: 2.4,
            fontSize: 10,
          },
        ]}
      >
        {on ? "MARKED" : "MARK"}
      </Text>
      <View style={[chip.rule, { backgroundColor: on ? CYAN : "rgba(0,245,255,0.28)" }]} />
    </View>
  );
}

function ChipMkSquare({ on }: ChipProps) {
  return (
    <View
      style={[
        chip.square,
        on ? chip.fill : chip.ghost,
      ]}
    >
      <Text style={[chip.ox, { fontSize: 9, letterSpacing: 0.4 }, on ? chip.ink : chip.cyan]}>
        {on ? "MK" : "M"}
      </Text>
    </View>
  );
}

function ChipSplit({ on }: ChipProps) {
  return (
    <View style={[chip.base, chip.row, { paddingHorizontal: 0, overflow: "hidden" }, on ? chip.fill : chip.ghost]}>
      <Text style={[chip.ox, { paddingHorizontal: 7 }, on ? chip.ink : chip.cyan]}>MARK</Text>
      <View style={[chip.vbar, { backgroundColor: on ? INK : CYAN }]} />
      <Text
        style={[
          chip.ox,
          { paddingHorizontal: 7 },
          on ? chip.ink : { color: "rgba(165,243,252,0.45)" },
        ]}
      >
        ED
      </Text>
    </View>
  );
}

function ChipRibbon({ on }: ChipProps) {
  const label = on ? "MARKED" : "MARK";
  const w = on ? 86 : 62;
  const h = 22;
  const tip = 9;
  const pts = `0,0 ${w - tip},0 ${w},${h / 2} ${w - tip},${h} 0,${h}`;
  return (
    <View style={{ width: w, height: h }}>
      <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
        <Polygon
          points={pts}
          fill={on ? CYAN : "transparent"}
          stroke={CYAN}
          strokeWidth={1}
        />
      </Svg>
      <View style={[chip.svgCenter, { paddingRight: tip / 2 }]}>
        <Text style={[chip.ox, { fontSize: 10 }, on ? chip.ink : chip.cyan]}>{label}</Text>
      </View>
    </View>
  );
}

function ChipIconOnly({ on }: ChipProps) {
  return (
    <View
      style={[
        chip.square,
        on ? chip.fill : chip.ghost,
      ]}
    >
      <MaterialCommunityIcons
        name={on ? "bookmark-check" : "bookmark-plus-outline"}
        size={14}
        color={on ? INK : CYAN}
      />
    </View>
  );
}

function ChipBebas({ on }: ChipProps) {
  return (
    <View style={[chip.base, { paddingVertical: 2, paddingHorizontal: 8 }, on ? chip.fill : chip.ghost]}>
      <Text
        style={{
          fontFamily: BEBAS,
          fontSize: 15,
          lineHeight: 18,
          letterSpacing: 0.8,
          color: on ? INK : CYAN,
          includeFontPadding: false,
        }}
      >
        {on ? "MARKED" : "MARK"}
      </Text>
    </View>
  );
}

function ChipJa({ on }: ChipProps) {
  return (
    <View style={[chip.base, on ? chip.fill : chip.ghost]}>
      <Text style={[chip.ox, { fontSize: 10, letterSpacing: 1.6 }, on ? chip.ink : chip.cyan]}>
        {on ? "マーク中" : "マーク"}
      </Text>
    </View>
  );
}

function ChipNotch({ on }: ChipProps) {
  const label = on ? "MARKED" : "MARK";
  const w = on ? 80 : 54;
  const h = 22;
  return (
    <View style={{ width: w, height: h }}>
      <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
        <Polygon
          points={`0,0 ${w - 7},0 ${w},7 ${w},${h} 7,${h} 0,${h - 7}`}
          fill={on ? CYAN : "transparent"}
          stroke={CYAN}
          strokeWidth={1}
        />
      </Svg>
      <View style={chip.svgCenter}>
        <Text style={[chip.ox, { fontSize: 10 }, on ? chip.ink : chip.cyan]}>{label}</Text>
      </View>
    </View>
  );
}

const VARIANTS: {
  id: string;
  name: string;
  note: string;
  Chip: (p: ChipProps) => ReactNode;
}[] = [
  { id: "01", name: "CURRENT", note: "本番。シアン塗り / 黒文字", Chip: ChipCurrent },
  { id: "02", name: "OUTLINE", note: "オフは枠だけ。オンで塗り", Chip: ChipOutline },
  { id: "03", name: "INVERT", note: "黒プレート + シアン文字", Chip: ChipInvert },
  { id: "04", name: "SCAN", note: "塗りに黒スキャン横線", Chip: ChipScan },
  { id: "05", name: "SLANT", note: "HUD 斜めプレート −10°", Chip: ChipSlant },
  { id: "06", name: "PILL", note: "完全ラウンド", Chip: ChipPill },
  { id: "07", name: "CHAMFER", note: "角切り平行四辺に近い板", Chip: ChipChamfer },
  { id: "08", name: "BOOKMARK", note: "しおりアイコン + 語", Chip: ChipBookmark },
  { id: "09", name: "TICK", note: "オンだけチェック", Chip: ChipTick },
  { id: "10", name: "DIAMOND", note: "先頭ダイヤ。塗りなし文字", Chip: ChipDiamond },
  { id: "11", name: "BRACKETS", note: "HUD 括弧。面を持たない", Chip: ChipBrackets },
  { id: "12", name: "HAIRLINE", note: "四隅ティックの細枠", Chip: ChipHairline },
  { id: "13", name: "STENCIL", note: "トラッキング + 下線", Chip: ChipStencil },
  { id: "14", name: "MK SQUARE", note: "正方形。MK / M", Chip: ChipMkSquare },
  { id: "15", name: "SPLIT", note: "MARK | ED 分割", Chip: ChipSplit },
  { id: "16", name: "RIBBON", note: "右矢印リボン", Chip: ChipRibbon },
  { id: "17", name: "ICON", note: "語なし。しおりだけ", Chip: ChipIconOnly },
  { id: "18", name: "BEBAS", note: "Bebas スラブ。背が高い", Chip: ChipBebas },
  { id: "19", name: "JA", note: "マーク / マーク中", Chip: ChipJa },
  { id: "20", name: "NOTCH", note: "対角ノッチのサイバー板", Chip: ChipNotch },
];

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

export default function MarkedChipDesignPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const isJa = language === "ja";
  const insets = useSafeAreaInsets();
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <MobilePageShell
      title="MARKED"
      eyebrow="DEV PREVIEW"
      subtitle={
        isJa
          ? "プロフィールの MARK / MARKED。本番は未変更。タップで選択。"
          : "Profile MARK / MARKED. Production unchanged. Tap to pin."
      }
      appBackground
      onClose={onClose}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 36 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lead}>
          {isJa
            ? "名前横の実寸。左がオフ、右がオン。選んだ案は下で等倍確認。"
            : "Real size next to a name. Off left, on right."}
        </Text>

        {VARIANTS.map((v) => (
          <Pressable
            key={v.id}
            onPress={() => setPicked((cur) => (cur === v.id ? null : v.id))}
            style={[styles.card, picked === v.id ? styles.cardOn : null]}
            accessibilityRole="button"
            accessibilityLabel={`${v.id} ${v.name}`}
          >
            <View style={styles.meta}>
              <Text style={styles.id}>{v.id}</Text>
              <Text style={styles.name}>{v.name}</Text>
              <Text style={styles.note}>{v.note}</Text>
            </View>
            <View style={styles.pair}>
              <NameRow Chip={v.Chip} on={false} />
              <NameRow Chip={v.Chip} on />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </MobilePageShell>
  );
}

function NameRow({ Chip, on }: { Chip: (p: ChipProps) => ReactNode; on: boolean }) {
  return (
    <View style={styles.nameRow}>
      <Text style={styles.who}>KAMIYA</Text>
      <Chip on={on} />
    </View>
  );
}

const chip = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  fill: {
    borderColor: CYAN,
    backgroundColor: CYAN,
  },
  ghost: {
    borderColor: "rgba(165,243,252,0.7)",
    backgroundColor: "rgba(0,245,255,0.08)",
  },
  ox: {
    fontFamily: OX,
    fontSize: 11,
    letterSpacing: 1.2,
    lineHeight: 14,
    includeFontPadding: false,
  },
  ink: { color: INK },
  cyan: { color: "#a5f3fc" },
  scan: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "46%",
    height: 1.5,
    backgroundColor: INK,
  },
  pill: { borderRadius: 999 },
  svgCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  tickEmpty: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: CYAN,
  },
  diamond: {
    width: 7,
    height: 7,
    borderWidth: 1,
    transform: [{ rotate: "45deg" }],
  },
  hair: {
    borderColor: "rgba(0,245,255,0.35)",
    backgroundColor: "transparent",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 6,
    height: 6,
    borderColor: CYAN,
  },
  tl: { top: -1, left: -1, borderTopWidth: 1.5, borderLeftWidth: 1.5 },
  tr: { top: -1, right: -1, borderTopWidth: 1.5, borderRightWidth: 1.5 },
  bl: { bottom: -1, left: -1, borderBottomWidth: 1.5, borderLeftWidth: 1.5 },
  br: { bottom: -1, right: -1, borderBottomWidth: 1.5, borderRightWidth: 1.5 },
  rule: { marginTop: 2, height: 1, alignSelf: "stretch" },
  square: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  vbar: { width: StyleSheet.hairlineWidth, alignSelf: "stretch", opacity: 0.55 },
});

const styles = StyleSheet.create({
  scroll: { flex: 1, paddingHorizontal: 12 },
  lead: {
    fontFamily: OX,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(226,232,240,0.62)",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  card: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#000",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  cardOn: {
    borderColor: CYAN,
  },
  meta: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 8,
  },
  id: {
    fontFamily: OX,
    fontSize: 10,
    letterSpacing: 1.4,
    color: CYAN,
  },
  name: {
    fontFamily: OX,
    fontSize: 11,
    letterSpacing: 1.2,
    color: "#f8fafc",
  },
  note: {
    fontFamily: OX,
    fontSize: 10,
    color: "rgba(226,232,240,0.45)",
    flexShrink: 1,
  },
  pair: { gap: 8 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  who: {
    fontFamily: OX_X,
    fontSize: 16,
    lineHeight: 18,
    fontStyle: "italic",
    color: "#f8fafc",
    letterSpacing: -0.3,
    includeFontPadding: false,
  },
});
