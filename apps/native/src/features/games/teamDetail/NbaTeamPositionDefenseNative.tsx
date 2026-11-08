import { StyleSheet, Text, View } from "react-native";
import {
  NBA_POSITION_GROUPS,
  type NbaPositionGroup,
  type NbaTeamPositionDefense,
} from "../../../../../../lib/nba/teamGameLog/teamPositionDefense";
import { CURRENT_NBA_SEASON_KEY } from "../../../../../../lib/rankings/nbaSeason";
import { CyberSlantedSegBarNative } from "../../rankings/CyberSlantedSegBarNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import type { NbaTeamDetailUiCopy } from "./nbaTeamDetailUiCopy";

const METRIC_DEFENSE = "#3BA0FF";
const METRIC_DEFENSE_GLOW = "rgba(59,160,255,0.34)";
const POSITIVE_TEAL = "#5cf0b5";
const NEGATIVE = "#FF2D78";
const SEGMENTS = 6;

const GROUP_LABEL: Record<NbaPositionGroup, string> = {
  G: "VS GUARDS",
  F: "VS FORWARDS",
  C: "VS CENTERS",
};

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return `rgba(255,255,255,${alpha})`;
  const n = parseInt(raw, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/** PERFORMANCE METRICS と同じ 5 チーム刻み（1 位 = 満タン） */
function rankSegPct(rank: number, teams: number): number {
  const r = Math.min(Math.max(1, teams), Math.max(1, Math.round(rank)));
  const bucket = Math.min(
    SEGMENTS - 1,
    Math.floor(((r - 1) / Math.max(1, teams)) * SEGMENTS)
  );
  return ((SEGMENTS - bucket) / SEGMENTS) * 100;
}

function fmtSigned(n: number): string {
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}`;
}

export function NbaTeamPositionDefenseNative({
  teamId,
  defense,
  accent,
  ui,
}: {
  teamId: string;
  defense: NbaTeamPositionDefense & { season: string };
  accent: string;
  ui: NbaTeamDetailUiCopy;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>POINTS ALLOWED BY POSITION</Text>
        <View
          style={[styles.titleLine, { backgroundColor: hexToRgba(accent, 0.35) }]}
        />
        {defense.season !== CURRENT_NBA_SEASON_KEY ? (
          <Text style={styles.season}>{defense.season}</Text>
        ) : null}
      </View>
      <Text style={styles.hint}>{ui.positionDefenseHint(defense.games)}</Text>
      <View style={[styles.card, { borderColor: hexToRgba(accent, 0.4) }]}>
        {NBA_POSITION_GROUPS.map((group, i) => {
          const cell = defense.groups[group].pts;
          const diff = Math.round((cell.value - cell.leagueAvg) * 10) / 10;
          return (
            <View
              key={group}
              style={[styles.row, i === NBA_POSITION_GROUPS.length - 1 ? null : styles.rowGap]}
            >
              <View style={styles.rowTop}>
                <Text style={styles.label}>{GROUP_LABEL[group]}</Text>
                <Text style={styles.value}>
                  {cell.value.toFixed(1)}{" "}
                  <Text style={styles.rank}>({ordinal(cell.rank)})</Text>
                </Text>
              </View>
              <CyberSlantedSegBarNative
                pct={rankSegPct(cell.rank, defense.teams)}
                segments={SEGMENTS}
                compact
                accent={{
                  border: METRIC_DEFENSE,
                  glow: METRIC_DEFENSE_GLOW,
                  bg: METRIC_DEFENSE,
                }}
                forceStatic
                replayKey={`${teamId}-pos-${group}`}
              />
              <View style={styles.rowBottom}>
                <Text style={styles.avg}>LG AVG {cell.leagueAvg.toFixed(1)}</Text>
                <Text
                  style={[
                    styles.diff,
                    diff < 0 ? { color: POSITIVE_TEAL } : diff > 0 ? { color: NEGATIVE } : null,
                  ]}
                >
                  {fmtSigned(diff)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
      <Text style={styles.note}>{ui.positionDefenseNote}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  titleLine: { flex: 1, height: StyleSheet.hairlineWidth },
  season: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontWeight: "700",
  },
  hint: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontWeight: "700",
  },
  card: {
    borderWidth: 1,
    backgroundColor: "rgba(8,8,12,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  row: { gap: 6 },
  rowGap: { marginBottom: 14 },
  rowTop: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
  },
  label: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  value: {
    fontFamily: METRIC_FONT,
    color: METRIC_DEFENSE,
    fontSize: 13,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  rank: { fontWeight: "700" },
  rowBottom: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
  },
  avg: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    fontVariant: ["tabular-nums"],
  },
  diff: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  note: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    fontWeight: "600",
    lineHeight: 13,
  },
});
