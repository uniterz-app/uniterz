import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { LeagueHubPlayerMatchup } from "../../../../../../lib/nba/leagueHub/leagueHubTypes";
import { useNbaLeagueHubNative } from "../leagueHub/useNbaLeagueHubNative";
import { playerNameStyle, teamAbbr } from "../leagueHub/leagueHubUiNative";
import { CYBER_TAB_CYAN } from "../../../ui/cyberSideMenuNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";

/** 順位ハブに載っている選手の、今季のマッチアップ。ハブにいない選手は出さない。 */
export default function NbaPlayerMatchupsNative({
  playerId,
  isJa,
}: {
  playerId: string;
  isJa: boolean;
}) {
  const { hub } = useNbaLeagueHubNative();
  const player = hub?.players.find((p) => p.playerId === playerId);
  const defense = player?.matchups ?? [];
  const offense = player?.guardedBy ?? [];
  const [side, setSide] = useState<"of" | "df">("of");
  if (defense.length === 0 && offense.length === 0) return null;
  const active = side === "df" ? "df" : "of";
  const rows = active === "df" ? defense : offense;

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{isJa ? "マッチアップ" : "MATCHUPS"}</Text>
        <View style={styles.titleLine} />
      </View>
      <View style={styles.tabs}>
        <Tab label="OF" on={active === "of"} onPress={() => setSide("of")} />
        <Tab label="DF" on={active === "df"} onPress={() => setSide("df")} />
      </View>
      <Text style={styles.sideHint}>
        {active === "df"
          ? isJa
            ? "誰をマークしたか"
            : "Who they guarded"
          : isJa
            ? "誰にマークされたか"
            : "Who guarded them"}
      </Text>
      <MatchupBlock
        madeLabel={isJa ? "成功/試投" : "FGM/FGA"}
        statLabel={
          active === "df"
            ? isJa
              ? "許した FG%"
              : "FG% ALLOWED"
            : isJa
              ? "自分の FG%"
              : "OWN FG%"
        }
        rows={rows}
        empty={isJa ? "この向きの記録がありません" : "No matchups on this side"}
      />
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

function MatchupBlock({
  madeLabel,
  statLabel,
  rows,
  empty,
}: {
  madeLabel: string;
  statLabel: string;
  rows: LeagueHubPlayerMatchup[];
  empty: string;
}) {
  if (rows.length === 0) return <Text style={styles.empty}>{empty}</Text>;
  return (
    <View style={styles.block}>
      <View style={styles.head}>
        <Text style={styles.headName}> </Text>
        <Text style={styles.headStat}>MIN</Text>
        <Text style={styles.headStat}>{madeLabel}</Text>
        <Text style={styles.headStat}>{statLabel}</Text>
      </View>
      {rows.map((row) => (
        <View key={row.playerId} style={styles.row}>
          <View style={styles.nameCol}>
            <Text style={[styles.name, playerNameStyle]} numberOfLines={1}>
              {row.name}
            </Text>
            <Text style={styles.team}>{teamAbbr(row.teamId)}</Text>
          </View>
          <Text style={styles.stat}>{row.minutes.toFixed(1)}</Text>
          <Text style={styles.stat}>
            {row.fgm}/{row.fga}
          </Text>
          <View style={styles.pctCol}>
            <Text style={styles.stat}>{(row.fgPct * 100).toFixed(1)}</Text>
            {row.usualFgPct != null ? (
              <Text style={styles.usual}>{`普段 ${(row.usualFgPct * 100).toFixed(0)}`}</Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16, gap: 14 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: {
    fontFamily: METRIC_FONT,
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
  },
  titleLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: "rgba(0,245,255,0.35)" },
  tabs: { flexDirection: "row", gap: 6 },
  tab: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.26)",
    paddingVertical: 10,
  },
  tabOn: {
    borderColor: CYBER_TAB_CYAN,
    backgroundColor: CYBER_TAB_CYAN,
  },
  tabLabel: {
    fontFamily: METRIC_FONT,
    color: CYBER_TAB_CYAN,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  tabLabelOn: { color: "#050508" },
  sideHint: {
    fontFamily: METRIC_FONT,
    color: "rgba(0,245,255,0.68)",
    fontSize: 11,
    lineHeight: 16,
  },
  block: { gap: 6 },
  empty: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,245,255,0.35)",
  },
  headName: { flex: 1 },
  headStat: {
    width: 58,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.45)",
    fontSize: 9,
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  nameCol: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 6 },
  name: { flexShrink: 1, color: "#fff", fontSize: 13 },
  team: {
    fontFamily: METRIC_FONT,
    color: CYBER_TAB_CYAN,
    fontSize: 10,
    fontWeight: "700",
  },
  pctCol: { width: 58, alignItems: "flex-end" },
  usual: {
    fontFamily: METRIC_FONT,
    color: "rgba(0,245,255,0.75)",
    fontSize: 9,
    fontWeight: "700",
  },
  stat: {
    width: 58,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
});
