import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TEAM_SHORT } from "../../../../../../lib/team-short";
import { getTeamAbbrBadgeColor } from "../../../../../../lib/team-colors";
import type { LeagueHubAxisFormat } from "../../../../../../lib/nba/leagueHub/leagueHubScatterPresets";
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
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionLine} />
        {right}
      </View>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
      {children}
    </View>
  );
}

export function HubChips<T extends string>({
  items,
  value,
  onChange,
}: {
  items: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
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
}: {
  items: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <View style={styles.toggle}>
      {items.map((it) => {
        const active = it.id === value;
        return (
          <Pressable
            key={it.id}
            onPress={() => onChange(it.id)}
            style={[styles.toggleItem, active ? { backgroundColor: CYBER_TAB_CYAN } : null]}
          >
            <Text
              style={[
                styles.toggleText,
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

/** 選手 / チームの 1 行（順位・色点・名前・値） */
export function HubRow({
  rank,
  teamId,
  name,
  sub,
  value,
  valueSub,
  onPress,
  highlight,
  kind = "player",
}: {
  rank?: number;
  teamId: string | null;
  name: string;
  /** team = 順位表と同じチーム名書体 */
  kind?: "player" | "team";
  sub?: string;
  value: string;
  valueSub?: string;
  onPress?: () => void;
  highlight?: boolean;
}) {
  const ink = teamInk(teamId);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        highlight ? styles.rowHighlight : null,
        pressed ? styles.rowPressed : null,
      ]}
    >
      {rank != null ? <Text style={styles.rowRank}>{rank}</Text> : null}
      <View style={[styles.rowDot, { backgroundColor: ink }]} />
      <View style={styles.rowNameCol}>
        <Text
          style={[styles.rowName, kind === "team" ? teamNameStyle : null]}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {sub ? `${teamAbbr(teamId)} · ${sub}` : teamAbbr(teamId)}
        </Text>
      </View>
      <View style={styles.rowValueCol}>
        <Text style={styles.rowValue}>{value}</Text>
        {valueSub ? <Text style={styles.rowValueSub}>{valueSub}</Text> : null}
      </View>
    </Pressable>
  );
}

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
        <Text style={[styles.colTitle, { color: "rgba(110,231,183,0.95)" }]}>{leftTitle}</Text>
        {left}
      </View>
      <View style={styles.col}>
        <Text style={[styles.colTitle, { color: "rgba(252,165,165,0.9)" }]}>{rightTitle}</Text>
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
  sectionHint: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 8,
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
  toggleItem: {
    paddingHorizontal: 8,
    paddingVertical: 3,
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
  rowHighlight: {
    backgroundColor: "rgba(0,245,255,0.08)",
  },
  rowPressed: {
    backgroundColor: "rgba(0,245,255,0.12)",
  },
  rowRank: {
    fontFamily: RANK_DISPLAY_FONT,
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    width: 18,
    textAlign: "center",
  },
  rowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rowNameCol: {
    flex: 1,
    minWidth: 0,
  },
  rowName: {
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
