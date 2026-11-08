/** スタイルマップの 2 人比較。指標ごとに左右へ伸びる棒（リーグ内の位置） */
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { LeagueHubAxisFormat } from "../../../../../../lib/nba/leagueHub/leagueHubScatterPresets";
import type {
  LeagueHubPlayer,
  LeagueHubPlayerMetric,
} from "../../../../../../lib/nba/leagueHub/leagueHubTypes";
import { CYBER_TAB_CYAN } from "../../rankings/CyberSlantedTabNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import HubShareSectionNative, { useHubCapturing } from "./HubShareSectionNative";
import {
  HubTeamTag,
  formatHubValue,
  playerNameStyle,
  teamInk,
  type HubLang,
} from "./leagueHubUiNative";

type CompareRow = {
  metric: LeagueHubPlayerMetric;
  label: string;
  format: LeagueHubAxisFormat;
  /** 低いほど良い */
  invert?: boolean;
};

const COMPARE_ROWS: readonly CompareRow[] = [
  { metric: "pts", label: "PTS", format: "one" },
  { metric: "reb", label: "REB", format: "one" },
  { metric: "ast", label: "AST", format: "one" },
  { metric: "stocks", label: "STL+BLK", format: "one" },
  { metric: "ts_pct", label: "TS%", format: "pct" },
  { metric: "fg3_pct", label: "3P%", format: "pct" },
  { metric: "usg", label: "USG%", format: "pct" },
  { metric: "tov_pct", label: "TOV%", format: "pct", invert: true },
  { metric: "drtg", label: "DRtg", format: "one", invert: true },
  { metric: "pie", label: "PIE", format: "pct" },
];

/** 0（リーグ最下位）〜 1（最上位）。invert は低いほど 1 に近い */
function leaguePosition(
  players: readonly LeagueHubPlayer[],
  metric: LeagueHubPlayerMetric,
  v: number,
  invert?: boolean
): number {
  const vals = players.map((p) => p.m[metric]).filter((x): x is number => x != null);
  if (vals.length < 2) return 0.5;
  const below = vals.filter((x) => (invert ? x > v : x < v)).length;
  return below / (vals.length - 1);
}

export default function LeagueHubCompareNative({
  a,
  b,
  players,
  lang,
  stamp,
  onClose,
}: {
  a: LeagueHubPlayer;
  b: LeagueHubPlayer;
  players: readonly LeagueHubPlayer[];
  lang: HubLang;
  stamp: string;
  onClose: () => void;
}) {
  const ja = lang === "ja";
  const rows = useMemo(
    () =>
      COMPARE_ROWS.map((r) => {
        const va = a.m[r.metric];
        const vb = b.m[r.metric];
        const win =
          va == null || vb == null || va === vb
            ? 0
            : (r.invert ? va < vb : va > vb)
              ? -1
              : 1;
        return {
          ...r,
          va,
          vb,
          win,
          pa: va == null ? 0 : leaguePosition(players, r.metric, va, r.invert),
          pb: vb == null ? 0 : leaguePosition(players, r.metric, vb, r.invert),
        };
      }),
    [a, b, players]
  );

  return (
    <HubShareSectionNative title="VS" stamp={stamp} lang={lang}>
      <CompareBody
        a={a}
        b={b}
        rows={rows}
        ja={ja}
        playersCount={players.length}
        onClose={onClose}
      />
    </HubShareSectionNative>
  );
}

function CompareBody({
  a,
  b,
  rows,
  ja,
  playersCount,
  onClose,
}: {
  a: LeagueHubPlayer;
  b: LeagueHubPlayer;
  rows: Array<CompareRow & { va?: number; vb?: number; win: number; pa: number; pb: number }>;
  ja: boolean;
  playersCount: number;
  onClose: () => void;
}) {
  const capturing = useHubCapturing();
  return (
    <View>
      <View style={styles.head}>
        <PlayerHead p={a} />
        <View style={styles.headGap} />
        <PlayerHead p={b} />
      </View>
      {rows.map((r) => (
        <View key={r.metric} style={styles.row}>
          <Text style={[styles.value, styles.valueLeft, r.win === -1 ? styles.valueWin : null]}>
            {formatHubValue(r.va, r.format)}
          </Text>
          <View style={[styles.barSide, styles.barSideLeft]}>
            <View
              style={[
                styles.bar,
                { width: `${Math.max(4, r.pa * 100)}%`, backgroundColor: teamInk(a.teamId) },
                r.win === -1 ? null : styles.barLose,
              ]}
            />
          </View>
          <Text style={styles.label}>{r.label}</Text>
          <View style={styles.barSide}>
            <View
              style={[
                styles.bar,
                { width: `${Math.max(4, r.pb * 100)}%`, backgroundColor: teamInk(b.teamId) },
                r.win === 1 ? null : styles.barLose,
              ]}
            />
          </View>
          <Text style={[styles.value, styles.valueRight, r.win === 1 ? styles.valueWin : null]}>
            {formatHubValue(r.vb, r.format)}
          </Text>
        </View>
      ))}
      <Text style={styles.foot}>
        {ja
          ? `棒はリーグ ${playersCount} 人の中の位置。長いほど上位（端まで伸びたら 1 位）。TOV% と DRtg は低いほど上位。`
          : `Bars = rank among ${playersCount} players. Longer is better (full = #1). Lower TOV% and DRtg rank higher.`}
      </Text>
      {capturing ? null : (
        <Pressable onPress={onClose} hitSlop={8} style={styles.close}>
          <Text style={styles.closeText}>{ja ? "比較を閉じる" : "Close"}</Text>
        </Pressable>
      )}
    </View>
  );
}

function PlayerHead({ p }: { p: LeagueHubPlayer }) {
  return (
    <View style={styles.player}>
      <View style={styles.playerLine}>
        <Text style={[styles.playerName, playerNameStyle]} numberOfLines={1}>
          {p.name}
        </Text>
        <HubTeamTag teamId={p.teamId} />
      </View>
      <Text style={styles.playerSub}>
        {p.gp} GP · {p.min.toFixed(1)} MIN
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  headGap: {
    width: 58,
  },
  player: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  playerLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "100%",
  },
  playerName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    flexShrink: 1,
  },
  playerSub: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  value: {
    width: 48,
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "700",
  },
  valueLeft: {
    textAlign: "left",
  },
  valueRight: {
    textAlign: "right",
  },
  valueWin: {
    color: "#fff",
    fontWeight: "800",
  },
  barSide: {
    flex: 1,
    height: 8,
    justifyContent: "center",
  },
  barSideLeft: {
    alignItems: "flex-end",
  },
  bar: {
    height: 8,
  },
  barLose: {
    opacity: 0.35,
  },
  label: {
    width: 58,
    textAlign: "center",
    fontFamily: METRIC_FONT,
    color: CYBER_TAB_CYAN,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  foot: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    lineHeight: 14,
    marginTop: 8,
  },
  close: {
    alignSelf: "center",
    marginTop: 8,
    paddingVertical: 4,
  },
  closeText: {
    fontFamily: METRIC_FONT,
    color: "rgba(0,245,255,0.75)",
    fontSize: 11,
    fontWeight: "700",
  },
});
