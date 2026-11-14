import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { LeagueHubLineup } from "../../../../../../lib/nba/leagueHub/leagueHubTypes";
import { useNbaLeagueHubNative } from "../leagueHub/useNbaLeagueHubNative";
import { playerNameStyle } from "../leagueHub/leagueHubUiNative";
import { CYBER_TAB_CYAN } from "../../../ui/cyberSideMenuNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";

const SIZES = [5, 4, 3, 2] as const;
const POSITIVE = "#5cf0b5";
const NEGATIVE = "#FF2D78";
type Side = "most" | "best" | "worst";

function signed(v: number, digits: number): string {
  const n = v.toFixed(digits);
  return v > 0 ? `+${n}` : n;
}

function tone(v: number): string {
  if (v > 0) return POSITIVE;
  if (v < 0) return NEGATIVE;
  return "rgba(255,255,255,0.72)";
}

/** 2〜5 人。時間の多い組、ネットの高い組、低い組。 */
export default function NbaTeamLineupsNative({
  teamId,
  isJa,
  accent,
}: {
  teamId: string;
  isJa: boolean;
  accent: string;
}) {
  const { hub } = useNbaLeagueHubNative();
  const boards = hub?.teams.find((t) => t.teamId === teamId)?.lineupBoards ?? [];
  const [size, setSize] = useState<(typeof SIZES)[number]>(5);
  const [side, setSide] = useState<Side>("most");
  const [player, setPlayer] = useState<string | null>(null);
  if (boards.length === 0) return null;
  const board = boards.find((row) => row.size === size);
  const listed = board?.[side] ?? [];
  const rows = player ? listed.filter((row) => row.names.includes(player)) : listed;
  const rankOf = (list: LeagueHubLineup[] | undefined, row: LeagueHubLineup) => {
    const index = (list ?? []).findIndex((item) => item.names.join("-") === row.names.join("-"));
    return index >= 0 ? index + 1 : null;
  };
  const pickPlayer = (name: string) => setPlayer((current) => (current === name ? null : name));

  return (
    <View style={styles.wrap}>
      <View style={styles.tabs}>
        {SIZES.map((n) => (
          <Tab key={n} label={String(n)} on={size === n} onPress={() => setSize(n)} />
        ))}
      </View>
      <View style={styles.tabs}>
        <Tab label="MIN" on={side === "most"} onPress={() => setSide("most")} />
        <Tab label="BEST" on={side === "best"} onPress={() => setSide("best")} />
        <Tab label="WORST" on={side === "worst"} onPress={() => setSide("worst")} />
      </View>
      <Text style={styles.hint}>
        {player
          ? isJa
            ? `${player} が入っている組です。もう一度タップすると解除されます。`
            : `Groups with ${player}. Tap the name again to clear.`
          : isJa
            ? side === "most"
              ? `${size} 人で、一緒に出た時間が長い順です。名前をタップすると、その選手で絞れます。`
              : side === "best"
                ? `${size} 人で、ネットレーティングが高い順です。名前をタップすると、その選手で絞れます。`
                : `${size} 人で、ネットレーティングが低い順です。名前をタップすると、その選手で絞れます。`
            : side === "most"
              ? `${size}-man groups by minutes together. Tap a name to filter.`
              : side === "best"
                ? `${size}-man groups by highest net rating. Tap a name to filter.`
                : `${size}-man groups by lowest net rating. Tap a name to filter.`}
      </Text>
      {rows.length === 0 ? (
        <Text style={styles.empty}>{isJa ? "この条件の組がありません" : "No groups for this view"}</Text>
      ) : (
        rows.map((row) => (
          <LineupRow
            key={row.names.join("-")}
            row={row}
            accent={accent}
            selected={player}
            onPick={pickPlayer}
            ranks={
              player
                ? [
                    ["MIN", rankOf(board?.most, row)],
                    ["BEST", rankOf(board?.best, row)],
                    ["WORST", rankOf(board?.worst, row)],
                  ]
                : null
            }
          />
        ))
      )}
    </View>
  );
}

function LineupRow({
  row,
  accent,
  selected,
  onPick,
  ranks,
}: {
  row: LeagueHubLineup;
  accent: string;
  selected: string | null;
  onPick: (name: string) => void;
  ranks: [string, number | null][] | null;
}) {
  const top = row.names.slice(0, 3);
  const bottom = row.names.slice(3);
  return (
    <View style={[styles.row, { borderBottomColor: accent }]}>
      <View style={styles.nameRow}>
        <View style={styles.names}>
          <NameLine names={top} accent={accent} selected={selected} onPick={onPick} />
          {bottom.length > 0 ? (
            <NameLine names={bottom} accent={accent} selected={selected} onPick={onPick} />
          ) : null}
        </View>
        <Stat
          label="MIN"
          value={row.min.toFixed(0)}
          color="rgba(255,255,255,0.82)"
          note={row.games != null ? `${row.games} G` : undefined}
          side
        />
      </View>
      {ranks ? (
        <View style={styles.ranks}>
          {ranks.map(([label, rank]) => (
            <Text key={label} style={styles.rank}>
              {label} {rank ?? "–"}
            </Text>
          ))}
        </View>
      ) : null}
      <View style={styles.stats}>
        <Stat label="RTG" value={signed(row.net, 1)} color={tone(row.net)} />
        <Stat label="+/-" value={signed(row.pm ?? 0, 0)} color={tone(row.pm ?? 0)} />
        <Stat label="OFRTG" value={row.off != null ? row.off.toFixed(1) : "–"} color="#fff" />
        <Stat label="DFRTG" value={row.def != null ? row.def.toFixed(1) : "–"} color="#fff" />
      </View>
    </View>
  );
}

function NameLine({
  names,
  accent,
  selected,
  onPick,
}: {
  names: string[];
  accent: string;
  selected: string | null;
  onPick: (name: string) => void;
}) {
  return (
    <View style={styles.nameLine}>
      {names.map((name, index) => (
        <View key={name} style={styles.nameItem}>
          {index > 0 ? <Text style={styles.dot}>·</Text> : null}
          <Pressable onPress={() => onPick(name)}>
            <Text style={[styles.name, playerNameStyle, selected === name ? { color: accent } : null]} numberOfLines={1}>
              {name}
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function Stat({
  label,
  value,
  color,
  side,
  note,
}: {
  label: string;
  value: string;
  color: string;
  side?: boolean;
  note?: string;
}) {
  return (
    <View style={side ? styles.statSide : styles.stat}>
      <Text style={[side ? styles.minValue : styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {note ? <Text style={styles.statNote}>{note}</Text> : null}
    </View>
  );
}

function Tab({
  label,
  on,
  onPress,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.tab, on ? styles.tabOn : null]} onPress={onPress}>
      <Text style={[styles.tabLabel, on ? styles.tabLabelOn : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: -12, gap: 8 },
  tabs: { flexDirection: "row", gap: 6 },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.26)",
  },
  tabOn: { backgroundColor: CYBER_TAB_CYAN, borderColor: CYBER_TAB_CYAN },
  tabLabel: {
    fontFamily: METRIC_FONT,
    color: CYBER_TAB_CYAN,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  tabLabelOn: { color: "#050508" },
  hint: {
    fontFamily: METRIC_FONT,
    color: "rgba(0,245,255,0.68)",
    fontSize: 11,
    lineHeight: 16,
  },
  empty: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
  },
  row: {
    gap: 6,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: "rgba(255,255,255,0.35)",
  },
  nameRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  names: { flex: 1, minWidth: 0, gap: 3 },
  nameLine: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  nameItem: { flexDirection: "row", alignItems: "center" },
  dot: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
    marginHorizontal: 4,
  },
  name: { color: "#fff", fontSize: 14, lineHeight: 18 },
  ranks: { flexDirection: "row", gap: 12 },
  rank: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.78)",
    fontSize: 10,
    letterSpacing: 0.4,
  },
  stats: { flexDirection: "row" },
  stat: { flex: 1, alignItems: "flex-start" },
  statSide: { width: 56, flex: 0, alignItems: "flex-end" },
  minValue: {
    fontFamily: METRIC_FONT,
    fontSize: 26,
    lineHeight: 28,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  statValue: {
    fontFamily: METRIC_FONT,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.78)",
    fontSize: 10,
    letterSpacing: 0.4,
    marginTop: 1,
  },
  statNote: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.78)",
    fontSize: 10,
    letterSpacing: 0.4,
    marginTop: 1,
  },
});
