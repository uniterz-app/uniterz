/**
 * CAREER 情報の「載せ場所」案プレビュー（裏面フリップ以外）。
 * Web `CareerPlacementPreviewPage` 相当。
 */
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RAJDHANI = "Rajdhani_600SemiBold";
const OXANIUM = "Oxanium_700Bold";
const ACCENT = "#00F5FF";

type VariantId =
  | "flipBack"
  | "stackBelow"
  | "overviewBlock"
  | "fullPage"
  | "bottomSheet"
  | "inlineExpand"
  | "twinTabs";

type Variant = {
  id: VariantId;
  name: string;
  blurb: string;
};

const VARIANTS: readonly Variant[] = [
  {
    id: "flipBack",
    name: "A · Flip Back",
    blurb: "いまの案。表の裏に履歴書。同じ枠・同じ高さ。",
  },
  {
    id: "stackBelow",
    name: "B · Stack Below",
    blurb: "プロフィールカードの下に CAREER カードを積む。スクロールで読む。",
  },
  {
    id: "overviewBlock",
    name: "C · Overview Block",
    blurb: "概要セクションの一塊として置く。他チャートと同列。",
  },
  {
    id: "fullPage",
    name: "D · Full Page",
    blurb: "耳タップで専用画面へ遷移。履歴書を広く見せる。",
  },
  {
    id: "bottomSheet",
    name: "E · Bottom Sheet",
    blurb: "下からドロワーで被せる。表は残したまま覗く。",
  },
  {
    id: "inlineExpand",
    name: "F · Inline Expand",
    blurb: "カード内で下に展開。フリップせず伸ばす。",
  },
  {
    id: "twinTabs",
    name: "G · Twin Tabs",
    blurb: "PROFILE / CAREER を同枠内タブ切替。3D なし。",
  },
] as const;

const CAREER_ROWS: readonly { label: string; value: string }[] = [
  { label: "PREDICTIONS", value: "0" },
  { label: "SINCE", value: "2025" },
  { label: "SEASON RANK", value: "—" },
  { label: "BEST MONTHLY", value: "—" },
  { label: "TOP 10", value: "—" },
  { label: "UNITS EARNED", value: "—" },
  { label: "WIN RATE", value: "0.0%" },
  { label: "BEST SPORT", value: "—" },
];

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

function MockAvatar() {
  return <View style={styles.avatar} />;
}

function MockFrontMini() {
  return (
    <View style={styles.frontCard}>
      <View style={styles.headerRow}>
        <MockAvatar />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>MPJ</Text>
          <Text style={styles.winNow}>Win now</Text>
        </View>
        <Text style={styles.units}>1,000</Text>
      </View>
      <Text style={styles.season}>NBA // 26-27 SEASON</Text>
      <View style={styles.metricGrid}>
        {["勝率", "総合得点", "UPSET", "最多得点者"].map((l) => (
          <View key={l} style={styles.metricCell}>
            <Text style={styles.metricLabel}>{l}</Text>
            <Text style={styles.metricValue}>—</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function CareerGrid({ compact }: { compact?: boolean }) {
  return (
    <View style={[styles.careerGrid, compact ? styles.careerGridCompact : null]}>
      {CAREER_ROWS.map((row) => (
        <View key={row.label} style={styles.careerCell}>
          <Text style={styles.careerLabel}>{row.label}</Text>
          <Text style={styles.careerValue}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

function CareerBody({ title = "CAREER // SHEET" }: { title?: string }) {
  return (
    <View>
      <Text style={styles.sheetTitle}>{title}</Text>
      <Text style={styles.season}>NBA // 26-27 SEASON</Text>
      <CareerGrid />
      <Text style={[styles.careerLabel, { marginTop: 10 }]}>AWARDS</Text>
      <Text style={styles.awardDash}>—</Text>
    </View>
  );
}

function MockStage({ id }: { id: VariantId }) {
  if (id === "flipBack") {
    return (
      <View style={styles.stage}>
        <View style={styles.earRow}>
          <View style={styles.ear}>
            <Text style={styles.earText}>PROFILE</Text>
          </View>
        </View>
        <View style={styles.careerCard}>
          <CareerBody />
        </View>
        <Text style={styles.caption}>表を裏返した同じ枠の中</Text>
      </View>
    );
  }

  if (id === "stackBelow") {
    return (
      <View style={styles.stage}>
        <MockFrontMini />
        <View style={styles.stackGap}>
          <Text style={styles.stackHint}>↓ 同じ幅で続く</Text>
        </View>
        <View style={styles.careerCard}>
          <CareerBody />
        </View>
      </View>
    );
  }

  if (id === "overviewBlock") {
    return (
      <View style={styles.stage}>
        <MockFrontMini />
        <Text style={styles.sectionEyebrow}>OVERVIEW</Text>
        <View style={styles.overviewFake}>
          <Text style={styles.overviewFakeTitle}>FORM / STREAK</Text>
          <View style={styles.overviewFakeBar} />
        </View>
        <View style={[styles.careerCard, styles.overviewCareer]}>
          <Text style={styles.sectionEyebrowInline}>CAREER</Text>
          <CareerGrid compact />
        </View>
        <View style={styles.overviewFake}>
          <Text style={styles.overviewFakeTitle}>BADGES</Text>
          <View style={styles.overviewFakeBar} />
        </View>
      </View>
    );
  }

  if (id === "fullPage") {
    return (
      <View style={styles.stage}>
        <View style={styles.navChrome}>
          <Text style={styles.navBack}>← PROFILE</Text>
          <Text style={styles.navTitle}>CAREER</Text>
          <View style={{ width: 56 }} />
        </View>
        <View style={[styles.careerCard, styles.fullPageCard]}>
          <CareerBody title="PREDICTOR DOSSIER" />
        </View>
        <Text style={styles.caption}>耳 → push。表カードは残らない</Text>
      </View>
    );
  }

  if (id === "bottomSheet") {
    return (
      <View style={styles.stage}>
        <View style={styles.dimmedFront}>
          <MockFrontMini />
        </View>
        <View style={styles.sheetScrim} />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>CAREER // SHEET</Text>
          <CareerGrid compact />
        </View>
      </View>
    );
  }

  if (id === "inlineExpand") {
    return (
      <View style={styles.stage}>
        <View style={styles.frontCard}>
          <View style={styles.headerRow}>
            <MockAvatar />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>MPJ</Text>
              <Text style={styles.winNow}>Win now</Text>
            </View>
            <Text style={styles.units}>1,000</Text>
          </View>
          <Text style={styles.season}>NBA // 26-27 SEASON</Text>
          <View style={styles.metricGrid}>
            {["勝率", "総合得点", "UPSET", "最多得点者"].map((l) => (
              <View key={l} style={styles.metricCell}>
                <Text style={styles.metricLabel}>{l}</Text>
                <Text style={styles.metricValue}>—</Text>
              </View>
            ))}
          </View>
          <View style={styles.expandDivider}>
            <Text style={styles.expandLabel}>CAREER ▾</Text>
          </View>
          <CareerGrid compact />
        </View>
      </View>
    );
  }

  // twinTabs
  return (
    <View style={styles.stage}>
      <View style={styles.frontCard}>
        <View style={styles.twinTabRow}>
          <View style={styles.twinTab}>
            <Text style={styles.twinTabText}>PROFILE</Text>
          </View>
          <View style={[styles.twinTab, styles.twinTabActive]}>
            <Text style={[styles.twinTabText, styles.twinTabTextActive]}>
              CAREER
            </Text>
          </View>
        </View>
        <CareerBody />
      </View>
      <Text style={styles.caption}>同じ枠・中身だけ差し替え</Text>
    </View>
  );
}

export default function CareerPlacementPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const isJa = language === "ja";
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [id, setId] = useState<VariantId>("stackBelow");
  const active = VARIANTS.find((v) => v.id === id) ?? VARIANTS[1];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.h1}>
            {isJa ? "CAREER 載せ場所案" : "CAREER placement"}
          </Text>
          <Text style={styles.sub}>
            {isJa
              ? "裏面以外に載せる候補。本番はまだ Flip Back。"
              : "Alternatives to the flip back. Production stays Flip Back."}
          </Text>
        </View>
        <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
          <Text style={styles.closeText}>{isJa ? "閉じる" : "Close"}</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.chipScroll}
      >
        {VARIANTS.map((v) => {
          const on = v.id === id;
          return (
            <Pressable
              key={v.id}
              onPress={() => setId(v.id)}
              style={[styles.chip, on ? styles.chipOn : null]}
            >
              <Text style={[styles.chipText, on ? styles.chipTextOn : null]}>
                {v.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.blurbBox}>
        <Text style={styles.blurbName}>{active.name}</Text>
        <Text style={styles.blurb}>{active.blurb}</Text>
      </View>

      <ScrollView
        style={styles.previewScroll}
        contentContainerStyle={[
          styles.previewInner,
          { paddingBottom: insets.bottom + 24, maxWidth: Math.min(420, width) },
        ]}
      >
        <MockStage id={id} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#05070a",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  h1: {
    fontFamily: OXANIUM,
    fontSize: 16,
    color: "#fff",
    letterSpacing: 0.5,
  },
  sub: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(255,255,255,0.45)",
  },
  closeBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  closeText: {
    fontFamily: RAJDHANI,
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 1,
  },
  chipScroll: { flexGrow: 0, maxHeight: 44 },
  chips: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
  chip: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipOn: {
    borderColor: ACCENT,
    backgroundColor: "rgba(0,245,255,0.12)",
  },
  chipText: {
    fontFamily: RAJDHANI,
    fontSize: 10,
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.55)",
  },
  chipTextOn: { color: ACCENT },
  blurbBox: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  blurbName: {
    fontFamily: RAJDHANI,
    fontSize: 12,
    letterSpacing: 1,
    color: ACCENT,
    marginBottom: 4,
  },
  blurb: {
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.65)",
  },
  previewScroll: { flex: 1 },
  previewInner: {
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 16,
  },
  stage: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#070b10",
    padding: 12,
  },
  caption: {
    marginTop: 10,
    fontFamily: RAJDHANI,
    fontSize: 10,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.45)",
    backgroundColor: "#1a2330",
  },
  frontCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    padding: 12,
    backgroundColor: "rgba(6,12,18,0.9)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  name: {
    fontFamily: OXANIUM,
    fontSize: 18,
    color: "#fff",
  },
  winNow: {
    marginTop: 2,
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
  },
  units: {
    fontFamily: OXANIUM,
    fontSize: 14,
    color: "#E8C36A",
  },
  season: {
    marginTop: 12,
    marginBottom: 8,
    fontFamily: OXANIUM,
    fontSize: 10,
    letterSpacing: 1.4,
    textAlign: "center",
    color: "rgba(255,255,255,0.4)",
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    opacity: 0.5,
  },
  metricCell: {
    width: "48%",
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 8,
  },
  metricLabel: {
    fontFamily: RAJDHANI,
    fontSize: 8,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.4)",
  },
  metricValue: {
    fontFamily: OXANIUM,
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
  careerCard: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
    padding: 12,
    backgroundColor: "rgba(3,8,13,0.85)",
  },
  sheetTitle: {
    fontFamily: OXANIUM,
    fontSize: 11,
    letterSpacing: 1.6,
    textAlign: "center",
    color: "rgba(255,255,255,0.85)",
    marginBottom: 4,
  },
  careerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  careerGridCompact: { gap: 6 },
  careerCell: { width: "47%", flexGrow: 1 },
  careerLabel: {
    fontFamily: RAJDHANI,
    fontSize: 8,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.35)",
  },
  careerValue: {
    fontFamily: OXANIUM,
    fontSize: 14,
    color: "#fff",
    marginTop: 2,
  },
  awardDash: {
    marginTop: 4,
    color: "rgba(255,255,255,0.35)",
    fontSize: 16,
  },
  earRow: {
    alignItems: "flex-end",
    paddingRight: 12,
    marginBottom: -1,
  },
  ear: {
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(0,245,255,0.72)",
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  earText: {
    fontFamily: RAJDHANI,
    fontSize: 10,
    letterSpacing: 2,
    color: ACCENT,
  },
  stackGap: { alignItems: "center", paddingVertical: 8 },
  stackHint: {
    fontFamily: RAJDHANI,
    fontSize: 10,
    letterSpacing: 1,
    color: "rgba(0,245,255,0.55)",
  },
  sectionEyebrow: {
    marginTop: 14,
    marginBottom: 6,
    fontFamily: RAJDHANI,
    fontSize: 9,
    letterSpacing: 1.6,
    color: "rgba(255,255,255,0.35)",
  },
  sectionEyebrowInline: {
    fontFamily: RAJDHANI,
    fontSize: 9,
    letterSpacing: 1.6,
    color: ACCENT,
    marginBottom: 8,
  },
  overviewFake: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 10,
    marginBottom: 8,
    opacity: 0.55,
  },
  overviewFakeTitle: {
    fontFamily: RAJDHANI,
    fontSize: 10,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.5)",
  },
  overviewFakeBar: {
    marginTop: 10,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  overviewCareer: { marginBottom: 8 },
  navChrome: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  navBack: {
    fontFamily: RAJDHANI,
    fontSize: 10,
    letterSpacing: 1,
    color: ACCENT,
    width: 72,
  },
  navTitle: {
    fontFamily: OXANIUM,
    fontSize: 12,
    letterSpacing: 2,
    color: "#fff",
  },
  fullPageCard: { minHeight: 280 },
  dimmedFront: { opacity: 0.35 },
  sheetScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    top: 40,
  },
  bottomSheet: {
    marginTop: -40,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.4)",
    borderBottomWidth: 0,
    backgroundColor: "#0a1218",
    padding: 14,
    paddingBottom: 20,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 36,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginBottom: 10,
  },
  expandDivider: {
    marginTop: 12,
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,245,255,0.35)",
    paddingTop: 8,
    alignItems: "center",
  },
  expandLabel: {
    fontFamily: RAJDHANI,
    fontSize: 10,
    letterSpacing: 2,
    color: ACCENT,
  },
  twinTabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  twinTab: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.3)",
    paddingVertical: 7,
    alignItems: "center",
  },
  twinTabActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  twinTabText: {
    fontFamily: RAJDHANI,
    fontSize: 10,
    letterSpacing: 1.6,
    color: ACCENT,
  },
  twinTabTextActive: {
    color: "#050508",
  },
});
