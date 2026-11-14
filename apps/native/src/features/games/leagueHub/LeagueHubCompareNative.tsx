/** スタイルマップの 2 人比較。今季スタッツを左右に並べ、上回った側にその選手のチームカラーの斜め帯 */
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { LeagueHubPlayer } from "../../../../../../lib/nba/leagueHub/leagueHubTypes";
import { CYBER_TAB_CYAN } from "../../../ui/cyberSideMenuNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import HubShareSectionNative, { useHubCapturing } from "./HubShareSectionNative";
import { HubTeamTag, playerNameStyle, teamInk, type HubLang } from "./leagueHubUiNative";

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

type CompareProps = {
  a: LeagueHubPlayer;
  b: LeagueHubPlayer;
  lang: HubLang;
  stamp: string;
  onClose: () => void;
};

export default function LeagueHubCompareNative({ lang, stamp, ...rest }: CompareProps) {
  return (
    <HubShareSectionNative title="VS" stamp={stamp} lang={lang}>
      <CompareBody {...rest} ja={lang === "ja"} />
    </HubShareSectionNative>
  );
}

function CompareBody({
  a,
  b,
  ja,
  onClose,
}: Omit<CompareProps, "lang" | "stamp"> & { ja: boolean }) {
  const capturing = useHubCapturing();
  const inkA = teamInk(a.teamId);
  const inkB = teamInk(b.teamId);
  return (
    <View>
      <View style={styles.table}>
        <View style={styles.row}>
          <PlayerHead p={a} />
          <View style={styles.spine} />
          <PlayerHead p={b} />
        </View>
        {COMPARE_ROWS.map((r) => {
          const w = winner(r, a, b);
          return (
            <View key={r.key} style={styles.row}>
              <ValueCell text={fmt(r.get(a), r.format)} win={w === -1} ink={inkA} />
              <View style={styles.spine}>
                <Text style={styles.label}>{r.label}</Text>
              </View>
              <ValueCell text={fmt(r.get(b), r.format)} win={w === 1} ink={inkB} />
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

function ValueCell({ text, win, ink }: { text: string; win: boolean; ink: string }) {
  return (
    <View style={styles.cell}>
      {win ? (
        <View
          pointerEvents="none"
          style={[styles.band, { backgroundColor: `${ink}55`, borderColor: ink, shadowColor: ink }]}
        >
          <View style={[styles.bandScan, { top: 3, backgroundColor: `${ink}66` }]} />
          <View style={[styles.bandScan, { bottom: 3, backgroundColor: `${ink}66` }]} />
        </View>
      ) : null}
      <Text style={[styles.value, win ? styles.valueWin : null]}>{text}</Text>
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
const SPINE = "rgba(0,245,255,0.5)";

const styles = StyleSheet.create({
  table: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: LINE,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
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
    paddingVertical: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LINE,
  },
  band: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: "18%",
    right: "18%",
    overflow: "hidden",
    borderWidth: 1,
    transform: [{ skewX: "-14deg" }],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
  },
  bandScan: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
  },
  value: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "700",
  },
  valueWin: {
    color: "#fff",
    fontWeight: "800",
  },
  spine: {
    width: 64,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: SPINE,
    backgroundColor: "rgba(0,245,255,0.05)",
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
