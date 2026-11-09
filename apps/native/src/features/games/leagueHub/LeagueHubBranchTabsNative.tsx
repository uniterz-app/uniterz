/**
 * 上の斜めタブ列の 1 つから線を下ろし、一回り小さい下の段（横スクロールの斜めタブ）へつなぐ。
 * 親が左なら下の段は右寄せで線は左から、親が右なら反転。
 */
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { CyberSlantedTabNative, CYBER_TAB_CYAN } from "../../rankings/CyberSlantedTabNative";

/** 上の段（シアン）と並んでも段の違いが分かる、少し青寄りの色 */
export const SUB_TAB_ACCENT = "#5CC8FF";
export const SUB_TAB_THEME = {
  accent: SUB_TAB_ACCENT,
  inactiveText: SUB_TAB_ACCENT,
  inactiveBorder: SUB_TAB_ACCENT,
  activeText: "#050508",
} as const;

/** compact タブの本体と、タブ列の上下パディング。部品の寸法は変えない */
const TAB_BODY_H = 30;
const BAR_PAD = 6;
const BAR_GAP = 8;
/** 横スクロール列の上下左右（発光が切れない余白） */
const SCROLL_PAD = 12;
const SCROLL_H = TAB_BODY_H + SCROLL_PAD * 2;
const LOWER_SCALE = 0.86;
const LOWER_WIDTH_RATIO = 0.72;
/** skewX(-14deg) で下辺は左へ tan(14°)·高さ/2 ずれる */
const SKEW_SHIFT = Math.tan((14 * Math.PI) / 180) * (TAB_BODY_H / 2);

/** compact の字幅。斜めタブの中身は変えず、ラベルが収まる幅だけ外側で持つ */
export function slantedTabWidth(label: string): number {
  const fontSize = 9;
  const letter = fontSize * 0.14;
  const ink = label.length * fontSize * 0.68 + Math.max(0, label.length - 1) * letter;
  return Math.ceil(ink + 28);
}

function geometry(w: number, parentIndex: number, parentCount: number) {
  const tabW = (w - BAR_GAP * (parentCount - 1)) / parentCount;
  const parentCenter = parentIndex * (tabW + BAR_GAP) + tabW / 2;
  const parentLeft = parentCenter < w / 2;
  const visualW = w * LOWER_WIDTH_RATIO;
  /** transform scale は中心基準。縮めた後の見た目の幅が visualW になる素の幅 */
  const rawW = visualW / LOWER_SCALE;
  const inset = (rawW - visualW) / 2;
  const rawLeft = parentLeft ? w - visualW - inset : -inset;
  const nearEdge = parentLeft ? w - visualW : visualW;
  const outerEdge = parentLeft ? 0 : w;
  /** 親タブの下辺（傾きで左へずれる）の内側に収める */
  const bottomL = parentCenter - tabW / 2 - SKEW_SHIFT + 10;
  const bottomR = parentCenter + tabW / 2 - SKEW_SHIFT - 10;
  const lineX = Math.min(bottomR, Math.max(bottomL, (nearEdge + outerEdge) / 2));
  /** 1 つ目のタブの端まで（スクロール列の内側余白ぶん） */
  const tabEdge = parentLeft ? nearEdge + SCROLL_PAD * LOWER_SCALE : nearEdge - SCROLL_PAD * LOWER_SCALE;
  const midY = (SCROLL_PAD + TAB_BODY_H / 2) * LOWER_SCALE;
  return { rawW, rawLeft, lineX, tabEdge, midY };
}

export default function LeagueHubBranchTabsNative<T extends string>({
  parentIndex,
  parentCount,
  items,
  value,
  onChange,
}: {
  /** 線を出す上のタブの位置（0 始まり）と、上の列のタブ数（均等幅） */
  parentIndex: number;
  parentCount: number;
  items: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  const [w, setW] = useState(0);
  const g = w > 0 ? geometry(w, parentIndex, parentCount) : null;
  const x = g ? Math.round(g.lineX) : 0;
  const y = g ? Math.round(g.midY) : 0;
  const edge = g ? Math.round(g.tabEdge) : 0;

  return (
    <View style={styles.host} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {g ? (
        <>
          <View
            style={[
              styles.scaleBox,
              { left: g.rawLeft, width: g.rawW, transform: [{ scale: LOWER_SCALE }] },
            ]}
          >
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {items.map((it) => {
                const active = it.id === value;
                return (
                  <View key={it.id} style={[styles.slot, { width: slantedTabWidth(it.label) }]}>
                    <CyberSlantedTabNative
                      label={it.label}
                      active={active}
                      onPress={() => onChange(it.id)}
                      compact
                      fill
                      fontWeight="700"
                      theme={SUB_TAB_THEME}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                    />
                  </View>
                );
              })}
            </ScrollView>
          </View>
          <View pointerEvents="none" style={styles.lines}>
            <View
              style={[styles.line, { left: x - 0.5, top: -BAR_PAD, width: 1, height: y + BAR_PAD + 0.5 }]}
            />
            <View
              style={[
                styles.line,
                { left: Math.min(x, edge), top: y - 0.5, width: Math.abs(edge - x) + 1, height: 1 },
              ]}
            />
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    height: SCROLL_H * LOWER_SCALE,
    overflow: "visible",
    marginBottom: 4,
  },
  scaleBox: {
    position: "absolute",
    top: -(SCROLL_H * (1 - LOWER_SCALE)) / 2,
    height: SCROLL_H,
    overflow: "visible",
  },
  scrollContent: {
    gap: 8,
    paddingVertical: SCROLL_PAD,
    paddingHorizontal: SCROLL_PAD,
    alignItems: "center",
  },
  slot: {
    height: TAB_BODY_H,
  },
  lines: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    overflow: "visible",
  },
  line: {
    position: "absolute",
    backgroundColor: CYBER_TAB_CYAN,
  },
});
