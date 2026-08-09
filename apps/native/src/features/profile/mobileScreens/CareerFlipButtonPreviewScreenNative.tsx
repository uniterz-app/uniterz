/**
 * Web `/dev/career-flip-button-preview` 相当 — フリップ導線の配置・構造案。
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

const RAJDHANI = "Rajdhani_600SemiBold";
const OXANIUM = "Oxanium_700Bold";
const CYAN = "#67e8f9";

type VariantId =
  | "current"
  | "avatarMast"
  | "cardEar"
  | "spine"
  | "crown"
  | "orbit"
  | "curl";

type Variant = {
  id: VariantId;
  name: string;
  blurbJa: string;
  blurbEn: string;
};

const VARIANTS: readonly Variant[] = [
  {
    id: "current",
    name: "A · Current",
    blurbJa: "カード下の小さなボタン。基準。",
    blurbEn: "Small button under the card. Baseline.",
  },
  {
    id: "avatarMast",
    name: "B · Avatar Mast",
    blurbJa: "アバター上にタブがせり出す。",
    blurbEn: "Tab protrudes above the avatar.",
  },
  {
    id: "cardEar",
    name: "C · Card Ear",
    blurbJa: "カード上辺から耳（タブ）が出る。",
    blurbEn: "File-tab ear on the top edge.",
  },
  {
    id: "spine",
    name: "D · Spine",
    blurbJa: "左端の縦タブ。背表紙をひっくり返す。",
    blurbEn: "Left spine tab — flip like a book.",
  },
  {
    id: "crown",
    name: "E · Crown Notch",
    blurbJa: "上辺中央の切り欠き。カード自体が物体。",
    blurbEn: "Top-center notch on the card body.",
  },
  {
    id: "orbit",
    name: "F · Orbit Badge",
    blurbJa: "アバター右上に被さるバッジ。",
    blurbEn: "Badge overlapping avatar top-right.",
  },
  {
    id: "curl",
    name: "G · Page Curl",
    blurbJa: "右下のページめくり。",
    blurbEn: "Bottom-right page curl.",
  },
] as const;

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

function MockAvatar() {
  return <View style={styles.avatar} />;
}

function MockStats() {
  return (
    <View style={styles.stats}>
      {["勝率", "総合得点", "UPSET", "最多得点者"].map((label) => (
        <View key={label} style={styles.statCell}>
          <Text style={styles.statLabel}>{label}</Text>
          <Text style={styles.statValue}>—</Text>
        </View>
      ))}
    </View>
  );
}

function MockHeaderExtra() {
  return (
    <View style={{ flex: 1, minWidth: 0, paddingTop: 2, flexDirection: "row" }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.name}>MPJ</Text>
        <Text style={styles.winNow}>Win now</Text>
      </View>
      <Text style={styles.units}>1,000</Text>
    </View>
  );
}

function FlipHit({
  flipped,
  onToggle,
  style,
  children,
  label,
}: {
  flipped: boolean;
  onToggle: () => void;
  style?: object | object[];
  children: ReactNode;
  label?: string;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={style}
      accessibilityRole="button"
      accessibilityState={{ selected: flipped }}
      accessibilityLabel={label}
    >
      {children}
    </Pressable>
  );
}

function StructuralCard({
  id,
  flipped,
  onToggle,
}: {
  id: VariantId;
  flipped: boolean;
  onToggle: () => void;
}) {
  const label = flipped ? "PROFILE" : "CAREER";

  if (id === "current") {
    return (
      <View>
        <View style={styles.cardBody}>
          <View style={styles.headerRow}>
            <MockAvatar />
            <MockHeaderExtra />
          </View>
          <Text style={styles.season}>NBA // 26-27 SEASON</Text>
          <MockStats />
        </View>
        <View style={styles.currentRow}>
          <FlipHit
            flipped={flipped}
            onToggle={onToggle}
            style={styles.btnCurrent}
            label={label}
          >
            <Text style={styles.btnCurrentIcon}>↻</Text>
            <Text style={styles.btnCurrentText}>{label}</Text>
          </FlipHit>
        </View>
      </View>
    );
  }

  if (id === "avatarMast") {
    return (
      <View style={[styles.cardBody, { paddingTop: 18, overflow: "visible" }]}>
        <View style={styles.headerRow}>
          <View style={styles.avatarWrap}>
            <FlipHit
              flipped={flipped}
              onToggle={onToggle}
              style={styles.mastTab}
              label={label}
            >
              <Text style={styles.mastTabText}>{label}</Text>
            </FlipHit>
            <MockAvatar />
          </View>
          <MockHeaderExtra />
        </View>
        <Text style={styles.season}>NBA // 26-27 SEASON</Text>
        <MockStats />
      </View>
    );
  }

  if (id === "cardEar") {
    return (
      <View style={{ paddingTop: 18 }}>
        <FlipHit
          flipped={flipped}
          onToggle={onToggle}
          style={styles.earTab}
          label={label}
        >
          <Text style={styles.earTabText}>{label}</Text>
        </FlipHit>
        <View style={styles.cardBody}>
          <View style={styles.headerRow}>
            <MockAvatar />
            <MockHeaderExtra />
          </View>
          <Text style={styles.season}>NBA // 26-27 SEASON</Text>
          <MockStats />
        </View>
      </View>
    );
  }

  if (id === "spine") {
    return (
      <View style={{ paddingLeft: 22 }}>
        <FlipHit
          flipped={flipped}
          onToggle={onToggle}
          style={styles.spineTab}
          label={label}
        >
          <Text style={styles.spineTabText}>{label}</Text>
        </FlipHit>
        <View style={styles.cardBody}>
          <View style={styles.headerRow}>
            <MockAvatar />
            <MockHeaderExtra />
          </View>
          <Text style={styles.season}>NBA // 26-27 SEASON</Text>
          <MockStats />
        </View>
      </View>
    );
  }

  if (id === "crown") {
    return (
      <View style={{ paddingTop: 16 }}>
        <FlipHit
          flipped={flipped}
          onToggle={onToggle}
          style={styles.crownTab}
          label={label}
        >
          <Text style={styles.crownTabText}>
            {flipped ? "PROFILE // FACE" : "CAREER // SHEET"}
          </Text>
        </FlipHit>
        <View style={[styles.cardBody, { paddingTop: 18 }]}>
          <View style={styles.headerRow}>
            <MockAvatar />
            <MockHeaderExtra />
          </View>
          <Text style={styles.season}>NBA // 26-27 SEASON</Text>
          <MockStats />
        </View>
      </View>
    );
  }

  if (id === "orbit") {
    return (
      <View style={styles.cardBody}>
        <View style={styles.headerRow}>
          <View style={styles.avatarWrap}>
            <MockAvatar />
            <FlipHit
              flipped={flipped}
              onToggle={onToggle}
              style={styles.orbitBadge}
              label={label}
            >
              <Text style={styles.orbitBadgeText}>{flipped ? "P" : "C"}</Text>
            </FlipHit>
          </View>
          <MockHeaderExtra />
        </View>
        <Text style={styles.season}>NBA // 26-27 SEASON</Text>
        <MockStats />
      </View>
    );
  }

  return (
    <View style={[styles.cardBody, { overflow: "hidden" }]}>
      <View style={styles.headerRow}>
        <MockAvatar />
        <MockHeaderExtra />
      </View>
      <Text style={styles.season}>NBA // 26-27 SEASON</Text>
      <MockStats />
      <FlipHit
        flipped={flipped}
        onToggle={onToggle}
        style={styles.curlHit}
        label={label}
      >
        <Text style={styles.curlText}>{flipped ? "◀" : "▶"}</Text>
      </FlipHit>
    </View>
  );
}

export default function CareerFlipButtonPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const isJa = language === "ja";
  const insets = useSafeAreaInsets();
  const [flippedById, setFlippedById] = useState<Record<VariantId, boolean>>(
    () =>
      Object.fromEntries(VARIANTS.map((v) => [v.id, false])) as Record<
        VariantId,
        boolean
      >
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>DEV PREVIEW · STRUCTURE</Text>
          <Text style={styles.title}>Career Flip Placement</Text>
          <Text style={styles.desc}>
            {isJa
              ? "ボタン色ではなく、出っ張り・背・耳など配置の根本案。"
              : "Placement concepts — mast, ear, spine, curl — not just chip styles."}
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel={isJa ? "閉じる" : "Close"}
        >
          <MaterialCommunityIcons name="close" size={22} color="#e2e8f0" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, 16) + 12 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {VARIANTS.map((v) => (
          <View key={v.id} style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionName}>{v.name}</Text>
              <Text style={styles.sectionState}>
                {flippedById[v.id] ? "BACK" : "FRONT"}
              </Text>
            </View>
            <Text style={styles.sectionBlurb}>
              {isJa ? v.blurbJa : v.blurbEn}
            </Text>
            <StructuralCard
              id={v.id}
              flipped={flippedById[v.id]}
              onToggle={() =>
                setFlippedById((prev) => ({
                  ...prev,
                  [v.id]: !prev[v.id],
                }))
              }
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#05080c",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
  },
  headerText: { flex: 1, minWidth: 0 },
  eyebrow: {
    fontFamily: RAJDHANI,
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: "rgba(165,243,252,0.55)",
  },
  title: {
    marginTop: 4,
    fontFamily: OXANIUM,
    fontSize: 15,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.9)",
  },
  desc: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.48)",
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 14,
  },
  section: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 12,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
  },
  sectionName: {
    fontFamily: RAJDHANI,
    fontSize: 13,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.88)",
  },
  sectionState: {
    fontFamily: OXANIUM,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.35)",
  },
  sectionBlurb: {
    marginTop: 6,
    marginBottom: 10,
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.45)",
  },
  cardBody: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#070d12",
    padding: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  avatar: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.5)",
    backgroundColor: "#1e293b",
  },
  avatarWrap: {
    position: "relative",
    width: 56,
    height: 56,
  },
  name: {
    fontFamily: OXANIUM,
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },
  winNow: {
    marginTop: 2,
    fontFamily: RAJDHANI,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.35)",
  },
  units: {
    fontFamily: OXANIUM,
    fontSize: 11,
    color: "rgba(253,230,138,0.8)",
  },
  season: {
    marginTop: 14,
    fontFamily: OXANIUM,
    fontSize: 9,
    letterSpacing: 1.6,
    textAlign: "center",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
  },
  stats: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    opacity: 0.45,
  },
  statCell: {
    width: "48%",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  statLabel: {
    fontFamily: RAJDHANI,
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
  },
  statValue: {
    marginTop: 2,
    fontFamily: OXANIUM,
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  currentRow: {
    marginTop: 8,
    alignItems: "flex-end",
  },
  btnCurrent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.35)",
    backgroundColor: "rgba(34,211,238,0.1)",
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  btnCurrentIcon: {
    fontSize: 13,
    color: "rgba(236,254,255,0.95)",
  },
  btnCurrentText: {
    fontFamily: RAJDHANI,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontWeight: "600",
    color: "rgba(236,254,255,0.95)",
  },
  mastTab: {
    position: "absolute",
    top: -14,
    left: 4,
    zIndex: 2,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.6)",
    backgroundColor: "#0a141c",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  mastTabText: {
    fontFamily: RAJDHANI,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    fontWeight: "600",
    color: CYAN,
  },
  earTab: {
    position: "absolute",
    top: 0,
    right: 16,
    zIndex: 2,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(103,232,249,0.5)",
    backgroundColor: "#0a141c",
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  earTabText: {
    fontFamily: RAJDHANI,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    fontWeight: "600",
    color: "rgba(236,254,255,0.95)",
  },
  spineTab: {
    position: "absolute",
    left: 0,
    top: 28,
    bottom: 28,
    width: 22,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: "rgba(103,232,249,0.45)",
    backgroundColor: "#0a141c",
  },
  spineTabText: {
    fontFamily: RAJDHANI,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "600",
    color: CYAN,
    transform: [{ rotate: "-90deg" }],
    width: 72,
    textAlign: "center",
  },
  crownTab: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    left: "18%",
    right: "18%",
    zIndex: 2,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(103,232,249,0.55)",
    backgroundColor: "#0a141c",
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  crownTabText: {
    fontFamily: RAJDHANI,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    fontWeight: "600",
    color: "rgba(236,254,255,0.95)",
  },
  orbitBadge: {
    position: "absolute",
    top: -8,
    right: -10,
    zIndex: 2,
    minWidth: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.6)",
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingHorizontal: 6,
  },
  orbitBadgeText: {
    fontFamily: OXANIUM,
    fontSize: 11,
    fontWeight: "700",
    color: CYAN,
  },
  curlHit: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 56,
    height: 56,
    alignItems: "flex-end",
    justifyContent: "flex-end",
    padding: 8,
    backgroundColor: "rgba(34,211,238,0.12)",
    borderTopLeftWidth: 1,
    borderColor: "rgba(103,232,249,0.35)",
  },
  curlText: {
    fontFamily: RAJDHANI,
    fontSize: 12,
    color: CYAN,
    transform: [{ rotate: "-18deg" }],
  },
});
