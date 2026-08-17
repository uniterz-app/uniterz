/**
 * Web `/dev/unit-earn-modal-preview` 相当 — Cyan Panel 基準の派生案
 */
import { useMemo, useState, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { CYBER_TAB_CYAN } from "../../../ui/cyberSideMenuNative";
import UniterzLogoNative from "../UniterzLogoNative";

type VariantId = "base" | "wide" | "ghost" | "split" | "mark" | "bar";

type Sample = {
  rank: number;
  title: string;
  subtitle: string;
  amount: number;
};

const SAMPLE: Sample = {
  rank: 1,
  title: "月間ランキング",
  subtitle: "2026年1月 · NBA",
  amount: 200,
};

const VARIANTS: Array<{ id: VariantId; name: string; note: string }> = [
  {
    id: "base",
    name: "基準 · Cyan Panel",
    note: "採用候補のベース。シアン枠 + 大順位 + 金金額。",
  },
  {
    id: "wide",
    name: "Wide CTA",
    note: "基準と同じ構成。ボタンだけ全幅にして押しやすく。",
  },
  {
    id: "ghost",
    name: "Ghost Edge",
    note: "塗りを薄く。枠と順位のシアンだけ残す。",
  },
  {
    id: "split",
    name: "Split Focus",
    note: "順位と金額を横並び。視線移動を短く。",
  },
  {
    id: "mark",
    name: "Rank Mark",
    note: "巨大な順位を透かしに。金額を前面へ。",
  },
  {
    id: "bar",
    name: "Top Bar",
    note: "四辺枠の代わりに上のアクセントバーだけ。",
  },
];

const UNIT_GOLD = "#f6c344";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

function Coin({ size = 40 }: { size?: number }) {
  return (
    <LinearGradient
      colors={["#f9d576", "#b8860b", "#f6c344", "#8a6410"]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[
        styles.coinOuter,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <LinearGradient
        colors={["#ffedb0", "#d9a125"]}
        start={{ x: 0.35, y: 0.2 }}
        end={{ x: 0.8, y: 1 }}
        style={[
          styles.coinInner,
          {
            width: size * 0.72,
            height: size * 0.72,
            borderRadius: (size * 0.72) / 2,
          },
        ]}
      >
        <Text style={[styles.coinU, { fontSize: size * 0.32 }]}>U</Text>
      </LinearGradient>
    </LinearGradient>
  );
}

function ClaimBtn({ label, full = false }: { label: string; full?: boolean }) {
  return (
    <View style={[styles.claimBtn, full && styles.claimFull]}>
      <Text style={styles.claimText}>{label}</Text>
    </View>
  );
}

function PanelShell({
  children,
  tone = "solid",
}: {
  children: ReactNode;
  tone?: "solid" | "ghost" | "bare";
}) {
  return (
    <View
      style={[
        styles.panel,
        tone === "ghost" && styles.panelGhost,
        tone === "bare" && styles.panelBare,
      ]}
    >
      {tone !== "bare" ? <View style={styles.panelTopLine} /> : null}
      {tone === "bare" ? <View style={styles.topBar} /> : null}
      {children}
    </View>
  );
}

/** SVG サイバーロゴ（共有パス） */
function BrandMark() {
  return (
    <View style={styles.brandWrap}>
      <UniterzLogoNative width={300} />
    </View>
  );
}


/** 順位の「理由」は主役にしない — 上は薄く、下はメタだけ */
function ContextAbove({ sample }: { sample: Sample }) {
  return <Text style={styles.contextAbove}>{sample.title}</Text>;
}

function MetaBelow({ sample }: { sample: Sample }) {
  return <Text style={styles.sub}>{sample.subtitle}</Text>;
}

function AmountRow({
  sample,
  size = "lg",
}: {
  sample: Sample;
  size?: "lg" | "md";
}) {
  return (
    <View style={styles.amountRow}>
      <Coin size={size === "lg" ? 36 : 30} />
      <Text style={[styles.amount, size === "md" && styles.amountMd]}>
        +{sample.amount.toLocaleString("en-US")}
      </Text>
    </View>
  );
}

function RankBig({
  rank,
  bright = false,
}: {
  rank: number;
  bright?: boolean;
}) {
  return (
    <Text style={[styles.rank, bright && styles.rankBright]}>#{rank}</Text>
  );
}

function VariantBase({ sample }: { sample: Sample }) {
  return (
    <PanelShell>
      <BrandMark />
      <ContextAbove sample={sample} />
      <RankBig rank={sample.rank} />
      <MetaBelow sample={sample} />
      <AmountRow sample={sample} />
      <View style={styles.claimWrap}>
        <ClaimBtn label="獲得する" />
      </View>
    </PanelShell>
  );
}

function VariantWide({ sample }: { sample: Sample }) {
  return (
    <PanelShell>
      <BrandMark />
      <ContextAbove sample={sample} />
      <RankBig rank={sample.rank} />
      <MetaBelow sample={sample} />
      <AmountRow sample={sample} />
      <ClaimBtn label="獲得する" full />
    </PanelShell>
  );
}

function VariantGhost({ sample }: { sample: Sample }) {
  return (
    <PanelShell tone="ghost">
      <BrandMark />
      <ContextAbove sample={sample} />
      <RankBig rank={sample.rank} bright />
      <MetaBelow sample={sample} />
      <AmountRow sample={sample} />
      <View style={styles.claimWrap}>
        <ClaimBtn label="獲得する" />
      </View>
    </PanelShell>
  );
}

function VariantSplit({ sample }: { sample: Sample }) {
  return (
    <PanelShell>
      <BrandMark />
      <View style={styles.splitRow}>
        <View style={styles.splitLeft}>
          <Text style={styles.rankSplit}>#{sample.rank}</Text>
          <Text style={[styles.title, styles.alignLeft]}>{sample.title}</Text>
          <Text style={[styles.sub, styles.alignLeft]}>{sample.subtitle}</Text>
        </View>
        <View style={styles.splitRight}>
          <Coin size={28} />
          <Text style={styles.amountSplit}>
            +{sample.amount.toLocaleString("en-US")}
          </Text>
        </View>
      </View>
      <View style={styles.claimWrap}>
        <ClaimBtn label="獲得する" />
      </View>
    </PanelShell>
  );
}

function VariantMark({ sample }: { sample: Sample }) {
  return (
    <PanelShell>
      <View style={styles.markWrap}>
        <Text style={styles.markGhost} pointerEvents="none">
          #{sample.rank}
        </Text>
        <BrandMark />
        <Text style={[styles.contextAbove, { marginTop: 16 }]}>
          {sample.title}
        </Text>
        <Text style={styles.sub}>{sample.subtitle}</Text>
        <Text style={styles.rankTiny}>Rank #{sample.rank}</Text>
        <AmountRow sample={sample} />
        <View style={styles.claimWrap}>
          <ClaimBtn label="獲得する" />
        </View>
      </View>
    </PanelShell>
  );
}

function VariantBar({ sample }: { sample: Sample }) {
  return (
    <PanelShell tone="bare">
      <BrandMark />
      <ContextAbove sample={sample} />
      <RankBig rank={sample.rank} />
      <MetaBelow sample={sample} />
      <AmountRow sample={sample} />
      <View style={styles.claimWrap}>
        <ClaimBtn label="獲得する" />
      </View>
    </PanelShell>
  );
}

export default function UnitEarnModalDesignPreviewScreenNative({
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<VariantId>("base");
  const meta = useMemo(
    () => VARIANTS.find((v) => v.id === active) ?? VARIANTS[0]!,
    [active]
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="戻る"
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Unit 獲得モーダル案</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 28 },
        ]}
      >
        <Text style={styles.devLabel}>Design preview</Text>
        <Text style={styles.lead}>
          SVG サイバーロゴ + Cyan Panel 派生案。
        </Text>
        <View style={styles.tabGrid}>
          {VARIANTS.map((v) => {
            const on = v.id === active;
            return (
              <Pressable
                key={v.id}
                onPress={() => setActive(v.id)}
                style={[styles.tab, on && styles.tabOn]}
              >
                <Text style={[styles.tabText, on && styles.tabTextOn]}>
                  {v.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.note}>{meta.note}</Text>

        <View style={styles.stage}>
          <View style={styles.stageChrome}>
            <Text style={styles.stageChromeLabel}>Profile</Text>
            <View style={styles.stageVault}>
              <Coin size={14} />
              <Text style={styles.stageVaultText}>1,330</Text>
            </View>
          </View>

          <View style={styles.stageBody}>
            {active === "base" ? <VariantBase sample={SAMPLE} /> : null}
            {active === "wide" ? <VariantWide sample={SAMPLE} /> : null}
            {active === "ghost" ? <VariantGhost sample={SAMPLE} /> : null}
            {active === "split" ? <VariantSplit sample={SAMPLE} /> : null}
            {active === "mark" ? <VariantMark sample={SAMPLE} /> : null}
            {active === "bar" ? <VariantBar sample={SAMPLE} /> : null}
          </View>

          <Text style={styles.stageCaption}>{meta.name}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#03070b",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  devLabel: {
    color: "rgba(103,232,249,0.7)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2.2,
    textTransform: "uppercase",
  },
  lead: {
    marginTop: 8,
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    lineHeight: 19,
  },
  tabGrid: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tab: {
    width: "48%",
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.02)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tabOn: {
    borderColor: "rgba(103,232,249,0.5)",
    backgroundColor: "rgba(103,232,249,0.1)",
  },
  tabText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  tabTextOn: {
    color: "#cffafe",
  },
  note: {
    marginTop: 12,
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
  },
  stage: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#05080c",
    minHeight: 420,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 20,
  },
  stageChrome: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    opacity: 0.35,
    marginBottom: 28,
  },
  stageChromeLabel: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  stageVault: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stageVaultText: {
    color: UNIT_GOLD,
    fontSize: 12,
    fontWeight: "700",
  },
  stageBody: {
    alignItems: "center",
  },
  stageCaption: {
    marginTop: 28,
    textAlign: "center",
    color: "rgba(255,255,255,0.25)",
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  panel: {
    width: "100%",
    maxWidth: 300,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.25)",
    backgroundColor: "rgba(4,10,16,0.92)",
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 18,
    overflow: "hidden",
  },
  panelGhost: {
    backgroundColor: "transparent",
    borderColor: "rgba(103,232,249,0.35)",
  },
  panelBare: {
    borderWidth: 0,
    backgroundColor: "rgba(4,10,16,0.72)",
  },
  panelTopLine: {
    position: "absolute",
    top: 0,
    left: 24,
    right: 24,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(165,243,252,0.5)",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: CYBER_TAB_CYAN,
    opacity: 0.85,
  },
  brandWrap: {
    alignItems: "center",
    width: "100%",
  },
  contextAbove: {
    marginTop: 12,
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  rank: {
    marginTop: 8,
    color: "#cffafe",
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: -1,
    textAlign: "center",
  },
  rankBright: {
    color: "#a5f3fc",
    fontSize: 52,
  },
  rankSplit: {
    color: "#cffafe",
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -1,
  },
  rankTiny: {
    marginTop: 10,
    color: "rgba(165,243,252,0.7)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    textAlign: "center",
  },
  title: {
    marginTop: 8,
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  sub: {
    marginTop: 6,
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  alignLeft: {
    textAlign: "left",
  },
  amountRow: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  amount: {
    color: "#ffe9a8",
    fontSize: 40,
    fontWeight: "800",
    fontStyle: "italic",
  },
  amountMd: {
    fontSize: 32,
  },
  amountSplit: {
    color: "#ffe9a8",
    fontSize: 34,
    fontWeight: "800",
    fontStyle: "italic",
  },
  splitRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  splitLeft: {
    flex: 1,
    minWidth: 0,
  },
  splitRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  markWrap: {
    position: "relative",
    overflow: "hidden",
  },
  markGhost: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 18,
    textAlign: "center",
    color: "rgba(103,232,249,0.08)",
    fontSize: 110,
    fontWeight: "800",
    letterSpacing: -4,
  },
  claimWrap: {
    alignItems: "center",
  },
  claimBtn: {
    marginTop: 22,
    minWidth: 168,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.7)",
    backgroundColor: CYBER_TAB_CYAN,
  },
  claimFull: {
    alignSelf: "stretch",
    minWidth: 0,
  },
  claimText: {
    color: "#041018",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  coinOuter: {
    alignItems: "center",
    justifyContent: "center",
  },
  coinInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  coinU: {
    color: "#241902",
    fontWeight: "800",
  },
});
