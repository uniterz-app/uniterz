/** Web `LiveGameBoxScorePanel` 相当 — チーム色グラデ枠 */
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { playerCardName } from "../../../../../../lib/predict/nbaRoster";
import type {
  LiveGameBoxPlayer,
  LiveGameBoxTeam,
  LiveGameStatsReport,
} from "../../../../../../lib/games/liveGameStats";
import {
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
} from "../../../../../../lib/team-colors";
import JerseyMarkSvg from "../JerseyMarkSvg";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";

const BOX_COLS = [
  { key: "min", label: "MIN" },
  { key: "pts", label: "PTS" },
  { key: "reb", label: "REB" },
  { key: "ast", label: "AST" },
  { key: "stl", label: "STL" },
  { key: "blk", label: "BLK" },
  { key: "tov", label: "TO" },
  { key: "fg", label: "FG" },
  { key: "fg3", label: "3P" },
  { key: "ft", label: "FT" },
  { key: "pm", label: "+/-" },
] as const;

const EMPHASIS = new Set(["pts", "fg", "fg3"]);

type Props = {
  report: LiveGameStatsReport;
};

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return `rgba(255,255,255,${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function sortBoxPlayers(players: LiveGameBoxPlayer[]): LiveGameBoxPlayer[] {
  return [...players].sort((a, b) => {
    if (a.starter !== b.starter) return a.starter ? -1 : 1;
    if (b.pts !== a.pts) return b.pts - a.pts;
    return b.min - a.min;
  });
}

function boxValues(p: LiveGameBoxPlayer): string[] {
  const pm = p.plusMinus;
  return [
    String(p.min),
    String(p.pts),
    String(p.reb),
    String(p.ast),
    String(p.stl),
    String(p.blk),
    String(p.tov),
    p.fg,
    p.fg3,
    p.ft,
    pm > 0 ? `+${pm}` : String(pm),
  ];
}

function TeamBoxCard({
  block,
  defaultOpen,
}: {
  block: LiveGameBoxTeam;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const teamPrimary = getTeamJerseyPrimaryColor("nba", block.teamId);
  const jerseySecondary = getTeamJerseySecondaryColor("nba", block.teamId);
  const border = hexToRgba(teamPrimary, 0.55);
  const divider = hexToRgba(teamPrimary, 0.22);
  const sideLabel = block.side === "home" ? "HOME" : "AWAY";
  const players = useMemo(() => sortBoxPlayers(block.players), [block.players]);

  return (
    <View style={[styles.card, { borderColor: border }]}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={[
          styles.header,
          open
            ? {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: divider,
              }
            : null,
        ]}
      >
        <JerseyMarkSvg
          accent={teamPrimary}
          accentEnd={jerseySecondary}
          size={36}
        />
        <View style={styles.headerText}>
          <View style={styles.headerTop}>
            <Text
              style={[styles.sideTag, { borderColor: teamPrimary, color: teamPrimary }]}
            >
              {sideLabel}
            </Text>
            <Text style={styles.teamName} numberOfLines={1}>
              {block.teamName}
            </Text>
          </View>
        </View>
        <MaterialCommunityIcons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={teamPrimary}
        />
      </Pressable>

      {open ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tablePad}>
            <View style={styles.tableHead}>
              <View style={styles.identityCol}>
                <Text style={styles.thJersey}>#</Text>
                <Text style={styles.thPlayer}>Player</Text>
                <Text style={styles.thPos}>Pos</Text>
              </View>
              {BOX_COLS.map((c) => (
                <Text key={c.key} style={styles.thStat}>
                  {c.label}
                </Text>
              ))}
            </View>
            {players.map((p) => {
              const values = boxValues(p);
              return (
                <View key={p.playerId} style={styles.tableRow}>
                  <View style={styles.identityCol}>
                    <View style={[styles.jersey, { borderColor: teamPrimary }]}>
                      <Text style={[styles.jerseyNum, { color: teamPrimary }]}>
                        {p.jerseyNumber}
                      </Text>
                    </View>
                    <Text style={styles.playerName} numberOfLines={1}>
                      {playerCardName(p)}
                    </Text>
                    <Text style={styles.pos}>{p.position}</Text>
                  </View>
                  {values.map((v, i) => (
                    <Text
                      key={BOX_COLS[i]!.key}
                      style={[
                        styles.stat,
                        EMPHASIS.has(BOX_COLS[i]!.key)
                          ? styles.statEmphasis
                          : styles.statMuted,
                      ]}
                    >
                      {v}
                    </Text>
                  ))}
                </View>
              );
            })}
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

export default function LiveGameBoxScorePanelNative({ report }: Props) {
  return (
    <View style={styles.stack}>
      <TeamBoxCard block={report.box.home} defaultOpen />
      <TeamBoxCard block={report.box.away} defaultOpen={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  card: {
    overflow: "hidden",
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  headerText: { flex: 1, minWidth: 0 },
  headerTop: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  sideTag: {
    fontFamily: METRIC_FONT,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  teamName: {
    flexShrink: 1,
    fontFamily: METRIC_FONT,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#fff",
  },
  tablePad: { paddingHorizontal: 8, paddingBottom: 8, minWidth: "100%" },
  tableHead: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
    paddingVertical: 4,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
    paddingVertical: 6,
  },
  identityCol: {
    width: 176,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 6,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "rgba(255,255,255,0.08)",
  },
  thJersey: {
    width: 28,
    textAlign: "center",
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
  },
  thPlayer: {
    flex: 1,
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
  },
  thPos: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
  },
  thStat: {
    width: 40,
    textAlign: "center",
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
  },
  jersey: {
    width: 28,
    height: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  jerseyNum: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  playerName: {
    maxWidth: 96,
    fontFamily: METRIC_FONT,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: "#fff",
    transform: [{ skewX: "-6deg" }],
  },
  pos: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
  },
  stat: {
    width: 40,
    textAlign: "center",
    fontFamily: METRIC_FONT,
    fontSize: 14,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  statEmphasis: { color: "#fff" },
  statMuted: { color: "rgba(255,255,255,0.78)" },
});
