/**
 * __DEV__ 下部ナビ見た目案。本番 AppTabBar には未接続。
 */
import { useState, type ComponentProps, type ReactNode } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import {
  chamferedRectPathD,
  NAV_BAR_CHAMFER_CUT,
} from "../features/games/matchListCyberClipPath";
import {
  MATCH_CARD_DISPLAY_FONT,
  MATCH_CARD_METRIC_FONT,
} from "../features/games/matchCardTypography";
import { colors } from "../theme/tokens";
import { CYBER_CHAMFER_ACCENT } from "../../../../lib/ui/cyberChamferAccent";
import NavBarChamferShellNative from "./NavBarChamferShellNative";

const RESULT_ICON = require("../../assets/navbar/result.png") as number;

const NAV_BLACK = "#000000";
const NAV_BLACK_FILL = "rgba(0,0,0,0.96)";
const NAV_BLACK_EDGE = "rgba(255,255,255,0.16)";
const NAV_BLACK_GRAD = [NAV_BLACK, NAV_BLACK] as const;
const NAV_BLACK_SHEEN = [
  "rgba(255,255,255,0.04)",
  "rgba(255,255,255,0.01)",
  "rgba(255,255,255,0)",
] as const;

function BlackChamferShell({ children }: { children: ReactNode }) {
  return (
    <NavBarChamferShellNative
      fill={NAV_BLACK_GRAD}
      sheen={NAV_BLACK_SHEEN}
      border={NAV_BLACK_EDGE}
    >
      {children}
    </NavBarChamferShellNative>
  );
}

export type NavPreviewTabKey = "games" | "result" | "rank" | "groups" | "me";

type TabDef = {
  key: NavPreviewTabKey;
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  image?: boolean;
  labelJa: string;
  labelEn: string;
};

const TABS: TabDef[] = [
  { key: "games", icon: "sword-cross", labelJa: "試合", labelEn: "GAMES" },
  {
    key: "result",
    icon: "chart-box-outline",
    image: true,
    labelJa: "結果",
    labelEn: "RESULT",
  },
  { key: "rank", icon: "trophy-outline", labelJa: "順位", labelEn: "RANK" },
  {
    key: "groups",
    icon: "account-group-outline",
    labelJa: "組",
    labelEn: "GROUP",
  },
  { key: "me", icon: "account-outline", labelJa: "自分", labelEn: "ME" },
];

export type NavBarPreviewCategory = "simple" | "standard" | "float" | "app";

export type NavBarPreviewMeta = {
  id: string;
  category: NavBarPreviewCategory;
  code: string;
  nameJa: string;
  nameEn: string;
  noteJa: string;
  noteEn: string;
};

export const NAV_BAR_PREVIEW_SECTIONS: {
  category: NavBarPreviewCategory;
  titleJa: string;
  titleEn: string;
}[] = [
  { category: "simple", titleJa: "シンプル", titleEn: "SIMPLE" },
  { category: "standard", titleJa: "普通（標準）", titleEn: "STANDARD" },
  { category: "float", titleJa: "浮いているドック", titleEn: "FLOATING DOCK" },
  { category: "app", titleJa: "アプリに合いそう", titleEn: "ON-BRAND" },
];

export const NAV_BAR_PREVIEW_GALLERY: NavBarPreviewMeta[] = [
  {
    id: "s01",
    category: "simple",
    code: "S01",
    nameJa: "フラット アイコン",
    nameEn: "Flush icons",
    noteJa: "画面下端にベタ置き。ラベルなし。一番シンプル。",
    noteEn: "Flush to the bottom. Icons only. The simplest chrome.",
  },
  {
    id: "s02",
    category: "simple",
    code: "S02",
    nameJa: "フラット ラベル",
    nameEn: "Flush labels",
    noteJa: "ベタ置きに小さいラベル。情報量だけ足した版。",
    noteEn: "Same flush bar, with tiny labels under icons.",
  },
  {
    id: "s03",
    category: "simple",
    code: "S03",
    nameJa: "ヘアライン",
    nameEn: "Hairline",
    noteJa: "背景と同化した極薄バー。上に 1px 線だけ。",
    noteEn: "Almost invisible chrome. A 1px hairline on top.",
  },
  {
    id: "s04",
    category: "simple",
    code: "S04",
    nameJa: "カプセル",
    nameEn: "Capsule",
    noteJa: "完全な丸ピルを少し浮かせる。装飾なし。",
    noteEn: "A round floating capsule. No chamfer, no labels.",
  },
  {
    id: "o01",
    category: "standard",
    code: "O01",
    nameJa: "iOS タブバー",
    nameEn: "iOS tab bar",
    noteJa: "フル幅・半透明・アイコン+ラベル。いちばん普通。",
    noteEn: "Full-width, translucent, icon + label. The default phone pattern.",
  },
  {
    id: "o02",
    category: "standard",
    code: "O02",
    nameJa: "Material インジケータ",
    nameEn: "Material indicator",
    noteJa: "選択アイコンの後ろにピル。Android 標準に近い。",
    noteEn: "Active icon sits on a pill. Familiar Android pattern.",
  },
  {
    id: "o03",
    category: "standard",
    code: "O03",
    nameJa: "中央ヒーロー",
    nameEn: "Center hero",
    noteJa: "リザルトだけ円で一段大きく。SNS 系の普通さ。",
    noteEn: "Raised center Result. Common social-app pattern.",
  },
  {
    id: "o04",
    category: "standard",
    code: "O04",
    nameJa: "ラベル付きドック",
    nameEn: "Labeled dock",
    noteJa: "角丸の浮遊バー + ラベル。今の位置感を普通側へ。",
    noteEn: "Rounded floating dock with labels. Current placement, calmer shape.",
  },
  {
    id: "c01",
    category: "float",
    code: "C01",
    nameJa: "現行",
    nameEn: "Current",
    noteJa: "以前のガラスドック。白アイコン。",
    noteEn: "Previous glass dock. White icons.",
  },
  {
    id: "c02",
    category: "float",
    code: "C02",
    nameJa: "現行 + ラベル",
    nameEn: "Current + labels",
    noteJa: "現行の角切りドックに小さいラベルを足す。",
    noteEn: "Same chamfered dock, with micro labels.",
  },
  {
    id: "c03",
    category: "float",
    code: "C03",
    nameJa: "ソフトフロート",
    nameEn: "Soft float",
    noteJa: "同じ浮き方だが角丸ガラス。角切りを外した版。",
    noteEn: "Same float, rounded glass instead of chamfer.",
  },
  {
    id: "c04",
    category: "float",
    code: "C04",
    nameJa: "アイランド",
    nameEn: "Islands",
    noteJa: "5 つの独立スクエア。バーという塊を分解する。",
    noteEn: "Five separate squares. No single bar body.",
  },
  {
    id: "a01",
    category: "app",
    code: "A01",
    nameJa: "HUD レール",
    nameEn: "HUD rail",
    noteJa: "全幅角切り + 上端のシアン走査線。選択は下線。",
    noteEn: "Full-width chamfer + cyan scan. Active = underline.",
  },
  {
    id: "a02",
    category: "app",
    code: "A02",
    nameJa: "シアンスロット",
    nameEn: "Cyan slot",
    noteJa: "現行の浮遊角切り。選択タブだけシアン枠。",
    noteEn: "Current float/chamfer. Active tab gets a cyan frame.",
  },
  {
    id: "a03",
    category: "app",
    code: "A03",
    nameJa: "ゴールドアクティブ",
    nameEn: "Gold active",
    noteJa: "現行の浮遊角切り。選択はメニューと同じ黄。",
    noteEn: "Current float/chamfer. Active tint matches the yellow menu chrome.",
  },
  {
    id: "a04",
    category: "app",
    code: "A04",
    nameJa: "セグメント HUD",
    nameEn: "Segment HUD",
    noteJa: "5 つの角切りセルを隙間で並べる。競技セレクト感。",
    noteEn: "Five chamfered cells with gaps. Competitive select row.",
  },
];

const FLOAT_IDS = new Set([
  "s04",
  "o04",
  "c01",
  "c02",
  "c03",
  "c04",
  "a02",
  "a03",
  "a04",
]);

type TabRowOpts = {
  active: NavPreviewTabKey;
  onSelect: (key: NavPreviewTabKey) => void;
  ja: boolean;
  showLabel?: boolean;
  iconSize?: number;
  resultSize?: number;
  activeColor?: string;
  inactiveColor?: string;
  activeScale?: number;
  indicator?: "none" | "underline" | "pill" | "slot" | "hero";
  slotColor?: string;
  labelSize?: number;
  itemStyle?: StyleProp<ViewStyle>;
  rowStyle?: StyleProp<ViewStyle>;
  tintResult?: boolean;
};

function TabGlyph({
  tab,
  color,
  iconSize,
  resultSize,
  tintResult,
}: {
  tab: TabDef;
  color: string;
  iconSize: number;
  resultSize: number;
  tintResult: boolean;
}) {
  if (tab.image) {
    return (
      <Image
        source={RESULT_ICON}
        style={{
          width: resultSize,
          height: resultSize,
          tintColor: tintResult ? color : undefined,
          opacity: tintResult ? 1 : undefined,
        }}
        resizeMode="contain"
      />
    );
  }
  return (
    <MaterialCommunityIcons name={tab.icon} size={iconSize} color={color} />
  );
}

function TabRow({
  active,
  onSelect,
  ja,
  showLabel = false,
  iconSize = 22,
  resultSize = 28,
  activeColor = colors.tabActive,
  inactiveColor = colors.tabInactive,
  activeScale = 1.04,
  indicator = "none",
  slotColor = "rgba(79,247,244,0.9)",
  labelSize = 8,
  itemStyle,
  rowStyle,
  tintResult = false,
}: TabRowOpts) {
  return (
    <View style={[styles.row, rowStyle]}>
      {TABS.map((tab) => {
        const isOn = tab.key === active;
        const color = isOn ? activeColor : inactiveColor;
        const isHero = indicator === "hero" && tab.key === "result";
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isOn }}
            onPress={() => onSelect(tab.key)}
            style={[
              styles.item,
              isHero && styles.heroItem,
              itemStyle,
            ]}
          >
            {indicator === "pill" && isOn ? (
              <View style={styles.pillBehind} />
            ) : null}
            {indicator === "slot" && isOn ? (
              <View style={[styles.slotFrame, { borderColor: slotColor }]} />
            ) : null}
            {isHero ? (
              <View style={styles.heroDisc}>
                <TabGlyph
                  tab={tab}
                  color="#071018"
                  iconSize={iconSize}
                  resultSize={26}
                  tintResult
                />
              </View>
            ) : (
              <View
                style={[
                  styles.glyph,
                  isOn && { transform: [{ scale: activeScale }] },
                  !isOn && { opacity: 0.92 },
                ]}
              >
                <TabGlyph
                  tab={tab}
                  color={color}
                  iconSize={iconSize}
                  resultSize={resultSize}
                  tintResult={tintResult}
                />
              </View>
            )}
            {showLabel ? (
              <Text
                style={[
                  styles.label,
                  { fontSize: labelSize, color, opacity: isOn ? 1 : 0.72 },
                ]}
              >
                {ja ? tab.labelJa : tab.labelEn}
              </Text>
            ) : null}
            {indicator === "underline" && isOn ? (
              <View style={[styles.underline, { backgroundColor: slotColor }]} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function ChamferSurface({
  cut = NAV_BAR_CHAMFER_CUT,
  fill = NAV_BLACK_FILL,
  border = NAV_BLACK_EDGE,
  style,
  children,
}: {
  cut?: number;
  fill?: string;
  border?: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const d =
    size.w > 0 && size.h > 0 ? chamferedRectPathD(size.w, size.h, cut) : "";
  return (
    <View
      style={style}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5)
          return;
        setSize({ w: width, h: height });
      }}
    >
      {d ? (
        <Svg
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          width={size.w}
          height={size.h}
        >
          <Path d={d} fill={fill} />
          <Path d={d} fill="none" stroke={border} strokeWidth={1} />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}

function HomeTick() {
  return <View style={styles.homeTick} />;
}

function VariantBar({
  id,
  active,
  onSelect,
  ja,
}: {
  id: string;
  active: NavPreviewTabKey;
  onSelect: (key: NavPreviewTabKey) => void;
  ja: boolean;
}) {
  const row = (opts: Partial<TabRowOpts> = {}) => (
    <TabRow active={active} onSelect={onSelect} ja={ja} {...opts} />
  );

  switch (id) {
    case "s01":
      return (
        <View style={styles.flushSolid}>
          {row({ iconSize: 22, resultSize: 28 })}
          <HomeTick />
        </View>
      );
    case "s02":
      return (
        <View style={styles.flushSolid}>
          {row({ showLabel: true, iconSize: 20, resultSize: 24, labelSize: 8 })}
          <HomeTick />
        </View>
      );
    case "s03":
      return (
        <View style={styles.hairline}>
          {row({
            iconSize: 18,
            resultSize: 22,
            activeScale: 1,
            inactiveColor: "rgba(226,232,240,0.28)",
          })}
        </View>
      );
    case "s04":
      return (
        <View style={styles.capsule}>
          {row({ iconSize: 20, resultSize: 26 })}
        </View>
      );
    case "o01":
      return (
        <LinearGradient
          colors={[NAV_BLACK, NAV_BLACK]}
          style={styles.iosBar}
        >
          {row({
            showLabel: true,
            iconSize: 20,
            resultSize: 24,
            labelSize: 9,
            activeColor: "#e2e8f0",
          })}
          <HomeTick />
        </LinearGradient>
      );
    case "o02":
      return (
        <View style={styles.flushSolid}>
          {row({
            showLabel: true,
            iconSize: 20,
            resultSize: 22,
            labelSize: 8,
            indicator: "pill",
            activeColor: "#4ff7f4",
            tintResult: true,
          })}
          <HomeTick />
        </View>
      );
    case "o03":
      return (
        <View style={styles.flushSolid}>
          {row({
            showLabel: true,
            iconSize: 20,
            resultSize: 24,
            labelSize: 8,
            indicator: "hero",
          })}
          <HomeTick />
        </View>
      );
    case "o04":
      return (
        <View style={styles.roundDock}>
          {row({
            showLabel: true,
            iconSize: 18,
            resultSize: 24,
            labelSize: 8,
          })}
        </View>
      );
    case "c01":
      return (
        <BlackChamferShell>
          {row({
            iconSize: 23,
            resultSize: 32,
            rowStyle: styles.currentRow,
          })}
        </BlackChamferShell>
      );
    case "c02":
      return (
        <BlackChamferShell>
          {row({
            showLabel: true,
            iconSize: 20,
            resultSize: 26,
            labelSize: 8,
            rowStyle: styles.currentRowLabel,
          })}
        </BlackChamferShell>
      );
    case "c03":
      return (
        <LinearGradient
          colors={[NAV_BLACK, NAV_BLACK]}
          style={styles.softDock}
        >
          {row({ iconSize: 22, resultSize: 30 })}
        </LinearGradient>
      );
    case "c04":
      return (
        <View style={styles.islandRow}>
          {TABS.map((tab) => {
            const isOn = tab.key === active;
            const color = isOn ? colors.tabActive : colors.tabInactive;
            return (
              <Pressable
                key={tab.key}
                onPress={() => onSelect(tab.key)}
                style={[styles.island, isOn && styles.islandOn]}
              >
                <TabGlyph
                  tab={tab}
                  color={color}
                  iconSize={18}
                  resultSize={22}
                  tintResult={false}
                />
              </Pressable>
            );
          })}
        </View>
      );
    case "a01":
      return (
        <ChamferSurface
          fill={NAV_BLACK}
          border="rgba(79,247,244,0.28)"
          style={styles.hudRail}
        >
          <View style={styles.scan} />
          {row({
            iconSize: 20,
            resultSize: 26,
            indicator: "underline",
            slotColor: "#4ff7f4",
            activeColor: "#4ff7f4",
            tintResult: true,
            rowStyle: { paddingTop: 4 },
          })}
        </ChamferSurface>
      );
    case "a02":
      return (
        <BlackChamferShell>
          {row({
            iconSize: 22,
            resultSize: 28,
            indicator: "slot",
            slotColor: "rgba(79,247,244,0.85)",
            activeColor: "#4ff7f4",
            tintResult: true,
            rowStyle: styles.currentRow,
          })}
        </BlackChamferShell>
      );
    case "a03":
      return (
        <BlackChamferShell>
          {row({
            iconSize: 22,
            resultSize: 28,
            activeColor: CYBER_CHAMFER_ACCENT,
            tintResult: true,
            rowStyle: styles.currentRow,
          })}
        </BlackChamferShell>
      );
    case "a04":
      return (
        <View style={styles.segmentRow}>
          {TABS.map((tab) => {
            const isOn = tab.key === active;
            const color = isOn ? "#4ff7f4" : colors.tabInactive;
            return (
              <Pressable
                key={tab.key}
                onPress={() => onSelect(tab.key)}
                style={styles.segmentCell}
              >
                <ChamferSurface
                  cut={8}
                  fill={isOn ? "rgba(79,247,244,0.12)" : NAV_BLACK}
                  border={
                    isOn ? "rgba(79,247,244,0.7)" : "rgba(255,255,255,0.10)"
                  }
                  style={styles.segmentInner}
                >
                  <TabGlyph
                    tab={tab}
                    color={color}
                    iconSize={18}
                    resultSize={22}
                    tintResult
                  />
                </ChamferSurface>
              </Pressable>
            );
          })}
        </View>
      );
    default:
      return null;
  }
}

function FakeScene({
  float,
  children,
}: {
  float: boolean;
  children: ReactNode;
}) {
  return (
    <View style={[styles.scene, float && styles.sceneFloat]}>
      <View style={styles.sceneGrid} pointerEvents="none" />
      <View style={styles.sceneBody}>
        <View style={styles.sceneHead}>
          <Text style={styles.sceneTitle}>NBA</Text>
          <View style={styles.sceneChip}>
            <Text style={styles.sceneChipText}>TODAY</Text>
          </View>
        </View>
        <View style={styles.sceneCard} />
        <View style={styles.sceneCard} />
        <View style={[styles.sceneCard, styles.sceneCardShort]} />
      </View>
      <View
        pointerEvents="box-none"
        style={float ? styles.floatSlot : styles.flushSlot}
      >
        {children}
      </View>
    </View>
  );
}

export function NavBarPreviewBlock({
  meta,
  ja,
}: {
  meta: NavBarPreviewMeta;
  ja: boolean;
}) {
  const [active, setActive] = useState<NavPreviewTabKey>("games");
  const float = FLOAT_IDS.has(meta.id);
  return (
    <View style={styles.block}>
      <View style={styles.blockHead}>
        <Text style={styles.code}>{meta.code}</Text>
        <Text style={styles.name}>{ja ? meta.nameJa : meta.nameEn}</Text>
      </View>
      <Text style={styles.note}>{ja ? meta.noteJa : meta.noteEn}</Text>
      <FakeScene float={float}>
        <VariantBar
          id={meta.id}
          active={active}
          onSelect={setActive}
          ja={ja}
        />
      </FakeScene>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
    backgroundColor: "rgba(5,8,14,0.55)",
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 8,
  },
  blockHead: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  code: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "#4ff7f4",
  },
  name: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 20,
    letterSpacing: 1.2,
    color: "#F8FAFC",
    includeFontPadding: false,
  },
  note: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
    lineHeight: 15,
    color: "rgba(148,163,184,0.88)",
    marginTop: -4,
  },
  scene: {
    height: 236,
    overflow: "hidden",
    backgroundColor: "#1a2030",
    borderWidth: 1,
    borderColor: "rgba(79,247,244,0.12)",
  },
  sceneFloat: {
    overflow: "hidden",
  },
  sceneGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
    backgroundColor: "transparent",
    borderTopWidth: 1,
    borderColor: "rgba(79,247,244,0.06)",
  },
  sceneBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 8,
  },
  sceneHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sceneTitle: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 22,
    letterSpacing: 2,
    color: "#F8FAFC",
    includeFontPadding: false,
  },
  sceneChip: {
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.45)",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sceneChipText: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 8,
    letterSpacing: 1.2,
    color: "#facc15",
  },
  sceneCard: {
    height: 36,
    backgroundColor: "rgba(18,24,36,0.9)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.14)",
  },
  sceneCardShort: {
    width: "72%",
    opacity: 0.7,
  },
  flushSlot: {
    width: "100%",
  },
  floatSlot: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  item: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  glyph: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontWeight: "700",
    letterSpacing: 0.6,
    includeFontPadding: false,
  },
  flushSolid: {
    backgroundColor: NAV_BLACK,
    borderTopWidth: 1,
    borderTopColor: NAV_BLACK_EDGE,
    paddingBottom: 6,
  },
  hairline: {
    backgroundColor: NAV_BLACK_FILL,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(226,232,240,0.28)",
  },
  capsule: {
    alignSelf: "center",
    width: "100%",
    borderRadius: 999,
    backgroundColor: NAV_BLACK,
    borderWidth: 1,
    borderColor: NAV_BLACK_EDGE,
    overflow: "hidden",
  },
  iosBar: {
    borderTopWidth: 1,
    borderTopColor: NAV_BLACK_EDGE,
    paddingBottom: 6,
  },
  roundDock: {
    borderRadius: 18,
    backgroundColor: NAV_BLACK,
    borderWidth: 1,
    borderColor: NAV_BLACK_EDGE,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  currentRow: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  currentRowLabel: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  softDock: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: NAV_BLACK_EDGE,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  islandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  island: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: NAV_BLACK,
    borderWidth: 1,
    borderColor: NAV_BLACK_EDGE,
    borderRadius: 8,
  },
  islandOn: {
    borderColor: "rgba(255,255,255,0.42)",
    backgroundColor: "#0d0d0d",
  },
  hudRail: {
    overflow: "hidden",
  },
  scan: {
    height: 1,
    backgroundColor: "rgba(79,247,244,0.55)",
  },
  underline: {
    width: 18,
    height: 2,
    marginTop: 2,
  },
  pillBehind: {
    position: "absolute",
    width: 42,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(79,247,244,0.14)",
    top: 6,
  },
  slotFrame: {
    position: "absolute",
    width: 40,
    height: 40,
    borderWidth: 1,
    top: 4,
  },
  heroItem: {
    minHeight: 56,
  },
  heroDisc: {
    width: 48,
    height: 48,
    marginTop: -18,
    borderRadius: 24,
    backgroundColor: "#4ff7f4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: NAV_BLACK,
  },
  segmentRow: {
    flexDirection: "row",
    gap: 5,
  },
  segmentCell: {
    flex: 1,
  },
  segmentInner: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  homeTick: {
    alignSelf: "center",
    width: 86,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(226,232,240,0.28)",
    marginTop: 2,
    marginBottom: 2,
  },
});
