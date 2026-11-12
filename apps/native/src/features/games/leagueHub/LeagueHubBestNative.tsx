import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NbaLeagueHubDoc } from "../../../../../../lib/nba/leagueHub/leagueHubTypes";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import { playerNameStyle, teamAbbr, teamInk, type HubLang } from "./leagueHubUiNative";

const POSITIVE = "#5cf0b5";
const NEGATIVE = "#FF2D78";
const LIMIT = 10;

function signed(v: number, digits = 1): string {
  const n = v.toFixed(digits);
  return v > 0 ? `+${n}` : n;
}

function tone(v: number): string {
  if (v > 0) return POSITIVE;
  if (v < 0) return NEGATIVE;
  return "rgba(255,255,255,0.72)";
}

/** リーグで、オンとオフの差が大きい選手。 */
export function LeagueHubOnOffBestNative({
  hub,
  lang,
  onSelectPlayer,
}: {
  hub: NbaLeagueHubDoc;
  lang: HubLang;
  onSelectPlayer: (playerId: string) => void;
}) {
  const rows = hub.players
    .flatMap((player) => {
      const row = player.onOff;
      if (!row || row.onMin < 100 || row.offMin < 50) return [];
      return [{ ...player, onNet: row.onNet, offNet: row.offNet, diff: row.onNet - row.offNet }];
    })
    .sort((a, b) => b.diff - a.diff)
    .slice(0, LIMIT);
  if (rows.length === 0) {
    return <Text style={styles.empty}>{lang === "ja" ? "まだデータがありません" : "No data yet"}</Text>;
  }
  return (
    <View>
      <View style={styles.head}>
        <Text style={styles.headName}> </Text>
        <Text style={styles.headStat}>ON</Text>
        <Text style={styles.headStat}>OFF</Text>
        <Text style={styles.headStat}>DIFF</Text>
      </View>
      {rows.map((row, index) => (
        <Pressable key={row.playerId} style={styles.row} onPress={() => onSelectPlayer(row.playerId)}>
          <Text style={styles.rank}>{index + 1}</Text>
          <View style={styles.who}>
            <Text style={[styles.name, playerNameStyle]} numberOfLines={1}>
              {row.name}
            </Text>
            <Text style={[styles.team, { color: teamInk(row.teamId) }]}>{teamAbbr(row.teamId)}</Text>
          </View>
          <Text style={[styles.stat, { color: tone(row.onNet) }]}>{signed(row.onNet)}</Text>
          <Text style={[styles.stat, { color: tone(row.offNet) }]}>{signed(row.offNet)}</Text>
          <Text style={[styles.stat, { color: tone(row.diff) }]}>{signed(row.diff)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** リーグで、ネットレーティングが高い 5 人組。 */
export function LeagueHubLineupBestNative({
  hub,
  lang,
  onSelectTeam,
}: {
  hub: NbaLeagueHubDoc;
  lang: HubLang;
  onSelectTeam: (teamId: string) => void;
}) {
  const pool = hub.teams.flatMap((team) => {
    const board = team.lineupBoards?.find((row) => row.size === 5);
    return (board?.best ?? []).map((unit) => ({ teamId: team.teamId, ...unit }));
  });
  const floor = pool.some((row) => row.min >= 30) ? 30 : 15;
  const rows = pool
    .filter((row) => row.min >= floor)
    .sort((a, b) => b.net - a.net || b.min - a.min)
    .slice(0, LIMIT);
  if (rows.length === 0) {
    return <Text style={styles.empty}>{lang === "ja" ? "まだデータがありません" : "No data yet"}</Text>;
  }
  return (
    <View>
      {rows.map((row, index) => (
        <Pressable key={`${row.teamId}-${row.names.join("-")}`} style={styles.line} onPress={() => onSelectTeam(row.teamId)}>
          <Text style={styles.rank}>{index + 1}</Text>
          <View style={styles.lineBody}>
            <Text style={[styles.name, playerNameStyle]}>
              {row.names.slice(0, 3).join("  ·  ")}
            </Text>
            <Text style={[styles.name, playerNameStyle]}>
              {row.names.slice(3).join("  ·  ")}
            </Text>
            <View style={styles.lineMeta}>
              <Text style={[styles.team, { color: teamInk(row.teamId) }]}>{teamAbbr(row.teamId)}</Text>
              <Text style={styles.meta}>{row.min.toFixed(0)} MIN</Text>
              <Text style={[styles.meta, { color: tone(row.net) }]}>{signed(row.net)} RTG</Text>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    marginTop: 8,
  },
  head: { flexDirection: "row", alignItems: "flex-end", gap: 6, marginTop: 8 },
  headName: { flex: 1 },
  headStat: {
    width: 48,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.78)",
    fontSize: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  line: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  rank: {
    width: 16,
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontWeight: "700",
  },
  who: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 6 },
  lineBody: { flex: 1, gap: 2 },
  name: { color: "#fff", fontSize: 13 },
  team: { fontFamily: METRIC_FONT, fontSize: 10, fontWeight: "800" },
  stat: {
    width: 48,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    fontSize: 13,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  lineMeta: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2 },
  meta: { fontFamily: METRIC_FONT, color: "rgba(255,255,255,0.78)", fontSize: 11, fontWeight: "700" },
});
