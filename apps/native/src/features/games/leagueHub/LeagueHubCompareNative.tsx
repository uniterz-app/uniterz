/** スタイルマップの 2 人比較。今季スタッツを左右に並べ、上回った側のセルに色を付ける */
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { LeagueHubPlayer } from "../../../../../../lib/nba/leagueHub/leagueHubTypes";
import { CYBER_TAB_CYAN } from "../../rankings/CyberSlantedTabNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import HubShareSectionNative, { useHubCapturing } from "./HubShareSectionNative";
import { HubTeamTag, playerNameStyle, type HubLang } from "./leagueHubUiNative";

type CompareRow = {
  key: string;
  label: string;
  get: (p: LeagueHubPlayer) => number | null | undefined;
  format: "int" | "one" | "pct";
  /** 低いほど良い */
  invert?: boolean;
};

const COMPARE_ROWS: readonly CompareRow[] = [
  { key: "gp", label: "G", get: (p) => p.gp, format: "int" },
  { key: "min", label: "MIN", get: (p) => p.min, format: "one" },
  { key: "pts", label: "PTS", get: (p) => p.m.pts, format: "one" },
  { key: "reb", label: "REB", get: (p) => p.m.reb, format: "one" },
  { key: "ast", label: "AST", get: (p) => p.m.ast, format: "one" },
  { key: "stl", label: "STL", get: (p) => p.m.stl, format: "one" },
  { key: "blk", label: "BLK", get: (p) => p.m.blk, format: "one" },
  { key: "tov", label: "TOV", get: (p) => p.m.tov, format: "one", invert: true },
  { key: "fg3_pct", label: "3P%", get: (p) => p.m.fg3_pct, format: "pct" },
  { key: "ft_pct", label: "FT%", get: (p) => p.m.ft_pct, format: "pct" },
  { key: "ts_pct", label: "TS%", get: (p) => p.m.ts_pct, format: "pct" },
  { key: "drtg", label: "DRtg", get: (p) => p.m.drtg, format: "one", invert: true },
  { key: "pie", label: "PIE", get: (p) => p.m.pie, format: "pct" },
];

function fmt(v: number | null | undefined, format: CompareRow["format"]): string {
  if (v == null || !Number.isFinite(v)) return "—";
  if (format === "int") return String(Math.round(v));
  if (format === "pct") return `${(v * 100).toFixed(1)}%`;
  return v.toFixed(1);
}

/** 表示上同じ数字は引き分け。-1 = 左、1 = 右、0 = なし */
function winner(row: CompareRow, a: LeagueHubPlayer, b: LeagueHubPlayer): -1 | 0 | 1 {
  const va = row.get(a);
  const vb = row.get(b);
  if (va == null || vb == null || fmt(va, row.format) === fmt(vb, row.format)) return 0;
  return (row.invert ? va < vb : va > vb) ? -1 : 1;
}

export default function LeagueHubCompareNative({
  a,
  b,
  lang,
  stamp,
  onClose,
}: {
  a: LeagueHubPlayer;
  b: LeagueHubPlayer;
  lang: HubLang;
  stamp: string;
  onClose: () => void;
}) {
  return (
    <HubShareSectionNative title="VS" stamp={stamp} lang={lang}>
      <CompareBody a={a} b={b} ja={lang === "ja"} onClose={onClose} />
    </HubShareSectionNative>
  );
}

function CompareBody({
  a,
  b,
  ja,
  onClose,
}: {
  a: LeagueHubPlayer;
  b: LeagueHubPlayer;
  ja: boolean;
  onClose: () => void;
}) {
  const capturing = useHubCapturing();
  return (
    <View>
      <View style={styles.table}>
        <View style={[styles.row, styles.headRow]}>
          <PlayerHead p={a} />
          <View style={styles.labelCell} />
          <PlayerHead p={b} />
        </View>
        {COMPARE_ROWS.map((r) => {
          const w = winner(r, a, b);
          return (
            <View key={r.key} style={styles.row}>
              <View style={[styles.cell, w === -1 ? styles.cellWin : null]}>
                <Text style={[styles.value, w === -1 ? styles.valueWin : null]}>
                  {fmt(r.get(a), r.format)}
                </Text>
              </View>
              <View style={styles.labelCell}>
                <Text style={styles.label}>{r.label}</Text>
              </View>
              <View style={[styles.cell, w === 1 ? styles.cellWin : null]}>
                <Text style={[styles.value, w === 1 ? styles.valueWin : null]}>
                  {fmt(r.get(b), r.format)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
      <Text style={styles.foot}>
        {ja
          ? "今季の 1 試合平均。TOV と DRtg は低い方が上。"
          : "Season per-game. Lower TOV and DRtg are better."}
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
      <Text style={[styles.playerName, playerNameStyle]} numberOfLines={1}>
        {p.name}
      </Text>
      <HubTeamTag teamId={p.teamId} />
    </View>
  );
}

const LINE = "rgba(0,245,255,0.16)";

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: LINE,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LINE,
  },
  headRow: {
    borderTopWidth: 0,
  },
  player: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  playerName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    maxWidth: "100%",
  },
  cell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  cellWin: {
    backgroundColor: "rgba(0,245,255,0.12)",
  },
  value: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "700",
  },
  valueWin: {
    color: "#fff",
    fontWeight: "800",
  },
  labelCell: {
    width: 64,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: LINE,
  },
  label: {
    fontFamily: METRIC_FONT,
    color: CYBER_TAB_CYAN,
    fontSize: 11,
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
