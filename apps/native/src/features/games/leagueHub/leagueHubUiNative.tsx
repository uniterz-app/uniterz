import { useState, type ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TEAM_SHORT } from "../../../../../../lib/team-short";
import { getTeamAbbrBadgeColor } from "../../../../../../lib/team-colors";
import type { LeagueHubAxisFormat } from "../../../../../../lib/nba/leagueHub/leagueHubScatterPresets";
import type { LeagueHubPosition } from "../../../../../../lib/nba/leagueHub/leagueHubTypes";
import { CYBER_TAB_CYAN } from "../../rankings/CyberSlantedTabNative";
import { METRIC_FONT, RANK_DISPLAY_FONT } from "../../rankings/rankingsUiTheme";
export type HubLang = "ja" | "en";

export function teamAbbr(teamId: string | null | undefined): string {
  if (!teamId) return "—";
  return TEAM_SHORT[teamId] ?? teamId.replace(/^nba-/, "").slice(0, 3).toUpperCase();
}

export function teamInk(teamId: string | null | undefined): string {
  return teamId ? getTeamAbbrBadgeColor(teamId) : "rgba(255,255,255,0.6)";
}

/** #RRGGBB に透明度を足す。それ以外の形式はそのまま */
export function inkAlpha(color: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(color);
  if (!m) return color;
  const n = parseInt(m[1]!, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export function formatHubValue(v: number | null | undefined, format: LeagueHubAxisFormat): string {
  if (v == null || !Number.isFinite(v)) return "—";
  if (format === "pct") return `${(v * 100).toFixed(1)}%`;
  if (format === "ppp") return v.toFixed(2);
  return v.toFixed(1);
}

export function formatRecord(r: { wins: number; losses: number } | null | undefined): string {
  return r ? `${r.wins}-${r.losses}` : "—";
}

export function recordPct(r: { wins: number; losses: number } | null | undefined): number | null {
  if (!r) return null;
  const g = r.wins + r.losses;
  return g > 0 ? r.wins / g : null;
}

/** 説明は隠しておき、見出し横の「?」で吹き出しとして出す */
export function HubSection({
  title,
  hint,
  right,
  children,
}: {
  title: string;
  hint?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  const [hintOpen, setHintOpen] = useState(false);
  const [tailCenter, setTailCenter] = useState(28);
  const showHint = Boolean(hint) && hintOpen;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {hint ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: hintOpen }}
            onPress={() => setHintOpen((open) => !open)}
            hitSlop={8}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              const next = Math.round(x + width / 2);
              setTailCenter((prev) => (prev === next ? prev : next));
            }}
            style={[styles.hintToggle, hintOpen ? styles.hintToggleOn : null]}
          >
            <Text style={[styles.hintToggleText, hintOpen ? styles.hintToggleTextOn : null]}>
              ?
            </Text>
          </Pressable>
        ) : null}
        <View style={styles.sectionLine} />
        {right}
      </View>
      <View>
        {children}
        {showHint ? (
          <View pointerEvents="none" style={styles.hintBubble}>
            <View style={[styles.hintTail, { left: tailCenter - 5 }]} />
            <Text style={styles.hintBubbleText}>{hint}</Text>
          </View>
        ) : null}
      </View>
      {showHint ? (
        <Modal
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={() => setHintOpen(false)}
        >
          <View style={StyleSheet.absoluteFill} onTouchStart={() => setHintOpen(false)} />
        </Modal>
      ) : null}
    </View>
  );
}

export function HubChips<T extends string>({
  items,
  value,
  onChange,
  wrap = false,
  columns = 3,
}: {
  items: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  /** 横スクロールではなく columns 列で折り返す */
  wrap?: boolean;
  columns?: 3 | 4 | 5;
}) {
  if (wrap) {
    return (
      <View style={styles.chipGrid}>
        {items.map((it) => {
          const active = it.id === value;
          return (
            <Pressable
              key={it.id}
              onPress={() => onChange(it.id)}
              style={[
                styles.chip,
                styles.chipCell,
                columns === 4 ? styles.chipCell4 : columns === 5 ? styles.chipCell5 : null,
                active ? styles.chipActive : null,
              ]}
            >
              <Text
                style={[styles.chipText, active ? styles.chipTextActive : null]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {it.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chips}
    >
      {items.map((it) => {
        const active = it.id === value;
        return (
          <Pressable
            key={it.id}
            onPress={() => onChange(it.id)}
            style={[styles.chip, active ? styles.chipActive : null]}
          >
            <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function HubToggle<T extends string>({
  items,
  value,
  onChange,
  fill = false,
}: {
  items: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  /** 横幅いっぱいに等分する */
  fill?: boolean;
}) {
  return (
    <View style={[styles.toggle, fill ? styles.toggleFill : null]}>
      {items.map((it) => {
        const active = it.id === value;
        return (
          <Pressable
            key={it.id}
            onPress={() => onChange(it.id)}
            style={[
              styles.toggleItem,
              fill ? styles.toggleItemFill : null,
              active ? { backgroundColor: CYBER_TAB_CYAN } : null,
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                fill ? styles.toggleTextFill : null,
                { color: active ? "#050508" : "rgba(255,255,255,0.55)" },
              ]}
            >
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** TEAM / PLAYER の下の区分タブ（下線で選択を示す・等幅） */
export function HubSubTabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <View style={styles.subTabs}>
      {items.map((it) => {
        const active = it.id === value;
        return (
          <Pressable
            key={it.id}
            onPress={() => onChange(it.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [styles.subTab, pressed ? styles.subTabPressed : null]}
          >
            <Text style={[styles.subTabText, active ? styles.subTabTextActive : null]}>
              {it.label}
            </Text>
            {active ? <View style={styles.subTabBar} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export type HubPosFilter = "all" | LeagueHubPosition;

/** 全員 / G / F / C */
export function HubPosToggle({
  value,
  onChange,
  lang,
}: {
  value: HubPosFilter;
  onChange: (v: HubPosFilter) => void;
  lang: HubLang;
}) {
  return (
    <HubToggle
      items={[
        { id: "all", label: "ALL" },
        { id: "G", label: "G" },
        { id: "F", label: "F" },
        { id: "C", label: "C" },
      ]}
      value={value}
      onChange={onChange}
    />
  );
}

/** 選手 / チームの 1 行（順位・色点・名前・値） */
export function HubRow({
  rank,
  teamId,
  name,
  sub,
  value,
  cells,
  valueSub,
  valueSubColor,
  onPress,
  highlight,
  kind = "player",
  rankMove,
  framed,
}: {
  rank?: number;
  /** 先週からの順位変動（+ = 上昇）。"new" = 新しく圏内 */
  rankMove?: number | "new" | null;
  teamId: string | null;
  name: string;
  /** team = 順位表と同じチーム名書体 */
  kind?: "player" | "team";
  sub?: string;
  value?: string;
  /** `HubCellHeader` の見出しと揃う等幅の数値列（value の代わり） */
  cells?: readonly string[];
  valueSub?: string;
  valueSubColor?: string;
  onPress?: () => void;
  highlight?: boolean;
  /** チーム色の薄い枠で 1 行ずつ囲む */
  framed?: boolean;
}) {
  const ink = teamInk(teamId);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        framed
          ? [
              styles.rowFramed,
              { borderColor: inkAlpha(ink, 0.75), backgroundColor: inkAlpha(ink, 0.1) },
            ]
          : null,
        highlight ? styles.rowHighlight : null,
        pressed ? styles.rowPressed : null,
      ]}
    >
      {rank != null ? (
        <View style={styles.rowRankCol}>
          <Text style={styles.rowRank}>{rank}</Text>
          {rankMove != null && rankMove !== 0 ? (
            <Text
              style={[
                styles.rowMove,
                {
                  color:
                    rankMove === "new" || rankMove > 0
                      ? HUB_GOOD_COLOR
                      : HUB_BAD_COLOR,
                },
              ]}
            >
              {rankMove === "new" ? "NEW" : rankMove > 0 ? `▲${rankMove}` : `▼${-rankMove}`}
            </Text>
          ) : null}
        </View>
      ) : null}
      {kind === "team" ? (
        <View style={[styles.rowSquare, { backgroundColor: ink }]} />
      ) : null}
      <View style={styles.rowNameCol}>
        <View style={styles.rowNameLine}>
          <Text
            style={[
              styles.rowName,
              kind === "team" ? teamNameStyle : playerNameStyle,
            ]}
            numberOfLines={1}
          >
            {name}
          </Text>
          {kind === "player" ? <HubTeamTag teamId={teamId} /> : null}
        </View>
        {kind === "team" ? (
          <Text style={styles.rowSub} numberOfLines={1}>
            {sub ? `${teamAbbr(teamId)} · ${sub}` : teamAbbr(teamId)}
          </Text>
        ) : sub ? (
          <Text style={styles.rowSub} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
      <View style={styles.rowValueCol}>
        {cells ? (
          <View style={styles.cells}>
            {cells.map((c, i) => (
              <Text key={i} style={[styles.rowValue, styles.cell]} numberOfLines={1}>
                {c}
              </Text>
            ))}
          </View>
        ) : (
          <Text style={styles.rowValue}>{value}</Text>
        )}
        {valueSub ? (
          <Text style={[styles.rowValueSub, valueSubColor ? { color: valueSubColor } : null]}>
            {valueSub}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/** `HubRow` の `cells` の上に置く列見出し */
export function HubCellHeader({
  labels,
  caption,
  framed,
}: {
  labels: readonly string[];
  /** 列全体の単位（例: 平均得点） */
  caption?: string;
  /** 下の行が `framed` のとき、枠の内側の数値列に揃える */
  framed?: boolean;
}) {
  return (
    <View style={[styles.cellHeader, framed ? styles.cellHeaderFramed : null]}>
      {caption ? <Text style={styles.cellCaption}>{caption}</Text> : null}
      <View style={styles.cells}>
        {labels.map((l, i) => (
          <Text key={i} style={[styles.cellLabel, styles.cell]} numberOfLines={1}>
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
}

/** 名前の右に置く小さいチームタグ（`TeamAbbrBadgeNative` の縮小版） */
export function HubTeamTag({ teamId }: { teamId: string | null | undefined }) {
  if (!teamId) return null;
  const fill = teamInk(teamId);
  return (
    <View style={[styles.tag, { borderColor: fill, shadowColor: fill }]}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          pointerEvents="none"
          style={[styles.tagScanLine, { top: 1 + i * 3, backgroundColor: `${fill}33` }]}
        />
      ))}
      <Text style={[styles.tagText, { color: fill }]}>{teamAbbr(teamId)}</Text>
    </View>
  );
}

/** 並んだ行のあいだに挟むリーグ平均の線 */
export function HubAvgDivider({ label }: { label: string }) {
  return (
    <View style={styles.avgDivider}>
      <View style={styles.avgLine} />
      <Text style={styles.avgText}>{label}</Text>
      <View style={styles.avgLine} />
    </View>
  );
}

export const HUB_GOOD_COLOR = "rgba(110,231,183,0.95)";
export const HUB_BAD_COLOR = "rgba(252,165,165,0.9)";

export function HubEmpty({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

/** 左右 2 列（BEST / WORST・HOT / COLD など） */
export function HubTwoCol({
  leftTitle,
  rightTitle,
  left,
  right,
}: {
  leftTitle: string;
  rightTitle: string;
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <View style={styles.twoCol}>
      <View style={styles.col}>
        <Text style={[styles.colTitle, { color: HUB_GOOD_COLOR }]}>{leftTitle}</Text>
        {left}
      </View>
      <View style={styles.col}>
        <Text style={[styles.colTitle, { color: HUB_BAD_COLOR }]}>{rightTitle}</Text>
        {right}
      </View>
    </View>
  );
}

/** 順位表 `tdTeam` と同じ */
export const teamNameStyle = {
  fontFamily: "Oxanium_600SemiBold",
  fontWeight: "600" as const,
  letterSpacing: 0.6,
  textTransform: "uppercase" as const,
  includeFontPadding: false,
  transform: [{ skewX: "-6deg" }],
};

/** 選手リーダー表 `tdPlayer` と同じ */
export const playerNameStyle = { ...teamNameStyle, letterSpacing: 0.4 };

export const hubStyles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.18)",
    backgroundColor: "rgba(4,10,16,0.55)",
    padding: 10,
  },
  footnote: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.38)",
    fontSize: 10,
    marginTop: 6,
    lineHeight: 14,
  },
});

const styles = StyleSheet.create({
  section: {
    marginBottom: 28,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: METRIC_FONT,
    color: CYBER_TAB_CYAN,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2.4,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(0,245,255,0.22)",
  },
  hintToggle: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.45)",
  },
  hintToggleOn: {
    backgroundColor: CYBER_TAB_CYAN,
    borderColor: CYBER_TAB_CYAN,
  },
  hintToggleText: {
    fontFamily: METRIC_FONT,
    color: CYBER_TAB_CYAN,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 14,
  },
  hintToggleTextOn: {
    color: "#050508",
  },
  hintBubble: {
    position: "absolute",
    top: 2,
    left: 0,
    right: 0,
    zIndex: 2,
    elevation: 4,
    borderWidth: 1,
    borderColor: CYBER_TAB_CYAN,
    backgroundColor: CYBER_TAB_CYAN,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  hintTail: {
    position: "absolute",
    top: -5,
    width: 10,
    height: 10,
    backgroundColor: CYBER_TAB_CYAN,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: CYBER_TAB_CYAN,
    transform: [{ rotate: "45deg" }],
  },
  hintBubbleText: {
    fontFamily: METRIC_FONT,
    color: "#050508",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    lineHeight: 16,
  },
  chips: {
    gap: 6,
    paddingBottom: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.45)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingBottom: 8,
  },
  chipCell: {
    flexBasis: "30%",
    flexGrow: 1,
    alignItems: "center",
  },
  chipCell4: {
    flexBasis: "22%",
    paddingHorizontal: 4,
  },
  chipCell5: {
    flexBasis: "17%",
    paddingHorizontal: 3,
  },
  chipActive: {
    backgroundColor: CYBER_TAB_CYAN,
    borderColor: CYBER_TAB_CYAN,
  },
  chipText: {
    fontFamily: METRIC_FONT,
    color: CYBER_TAB_CYAN,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  chipTextActive: {
    color: "#050508",
  },
  toggle: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
  },
  subTabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,245,255,0.22)",
  },
  subTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
  },
  subTabPressed: {
    backgroundColor: "rgba(0,245,255,0.08)",
  },
  subTabText: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  subTabTextActive: {
    color: CYBER_TAB_CYAN,
  },
  subTabBar: {
    position: "absolute",
    left: 6,
    right: 6,
    bottom: -1,
    height: 2,
    backgroundColor: CYBER_TAB_CYAN,
  },
  toggleItem: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  toggleFill: {
    alignSelf: "stretch",
    marginBottom: 6,
  },
  toggleItemFill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 5,
  },
  toggleTextFill: {
    fontSize: 11,
    letterSpacing: 1.4,
  },
  toggleText: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  rowFramed: {
    borderWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  rowHighlight: {
    backgroundColor: "rgba(0,245,255,0.08)",
  },
  rowPressed: {
    backgroundColor: "rgba(0,245,255,0.12)",
  },
  rowRankCol: {
    width: 22,
    alignItems: "center",
  },
  rowMove: {
    fontFamily: METRIC_FONT,
    fontSize: 8,
    fontWeight: "800",
    marginTop: 1,
  },
  rowRank: {
    fontFamily: RANK_DISPLAY_FONT,
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    width: 18,
    textAlign: "center",
  },
  rowSquare: {
    width: 8,
    height: 8,
  },
  rowNameCol: {
    flex: 1,
    minWidth: 0,
  },
  rowNameLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    minWidth: 0,
  },
  tag: {
    width: 28,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    transform: [{ skewX: "-14deg" }],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
  },
  tagScanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
  },
  tagText: {
    fontFamily: "Oxanium_800ExtraBold",
    fontSize: 7.5,
    letterSpacing: 0.6,
    includeFontPadding: false,
    transform: [{ skewX: "8deg" }],
  },
  rowName: {
    flexShrink: 1,
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  rowSub: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    marginTop: 1,
  },
  rowValueCol: {
    alignItems: "flex-end",
  },
  rowValue: {
    fontFamily: METRIC_FONT,
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  rowValueSub: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    marginTop: 1,
  },
  cells: {
    flexDirection: "row",
  },
  cell: {
    width: 44,
    textAlign: "right",
  },
  cellHeader: {
    alignItems: "flex-end",
    paddingHorizontal: 4,
    paddingTop: 6,
    paddingBottom: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,245,255,0.22)",
  },
  cellHeaderFramed: {
    paddingHorizontal: 9,
    borderBottomWidth: 0,
    marginBottom: 4,
  },
  cellCaption: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.45)",
    fontSize: 9,
    marginBottom: 1,
  },
  cellLabel: {
    fontFamily: METRIC_FONT,
    color: "rgba(0,245,255,0.7)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  avgDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  avgLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(0,245,255,0.5)",
  },
  avgText: {
    fontFamily: METRIC_FONT,
    color: CYBER_TAB_CYAN,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  empty: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    paddingVertical: 12,
    textAlign: "center",
  },
  twoCol: {
    flexDirection: "row",
    gap: 10,
  },
  col: {
    flex: 1,
    minWidth: 0,
  },
  colTitle: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
    marginBottom: 2,
  },
});
