import { ScrollView, StyleSheet, Text, View } from "react-native";
import type {
  NbaTeamSplitAverages,
  NbaTeamSplitStatRow,
} from "../../../../../../lib/nba/teamGameLog/teamGameLogDetail";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";

const POSITIVE_TEAL = "#5cf0b5";
const NEGATIVE = "#FF2D78";
const ROW_H = 38;
const HEAD_H = 30;
const LABEL_W = 84;

export type NbaTeamStatSplitTableRow = {
  key: string;
  label: string;
  labelColor?: string;
  row: NbaTeamSplitStatRow;
};

type Col = {
  key: string;
  label: string;
  width: number;
  render: (avg: NbaTeamSplitAverages) => string;
  tone?: (avg: NbaTeamSplitAverages) => string | undefined;
};

function fmt1(n: number | null): string {
  return n == null ? "—" : n.toFixed(1);
}

function fmtSigned(n: number): string {
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}`;
}

const STAT_COLS: Col[] = [
  { key: "pts", label: "PTS", width: 46, render: (a) => a.pts.toFixed(1) },
  { key: "opp", label: "OPP", width: 46, render: (a) => a.oppPts.toFixed(1) },
  {
    key: "diff",
    label: "+/-",
    width: 48,
    render: (a) => fmtSigned(a.diff),
    tone: (a) => (a.diff > 0 ? POSITIVE_TEAL : a.diff < 0 ? NEGATIVE : undefined),
  },
  { key: "fgPct", label: "FG%", width: 46, render: (a) => fmt1(a.fgPct) },
  { key: "fg3Pct", label: "3P%", width: 46, render: (a) => fmt1(a.fg3Pct) },
  { key: "fg3m", label: "3PM", width: 42, render: (a) => fmt1(a.fg3m) },
  { key: "ftPct", label: "FT%", width: 46, render: (a) => fmt1(a.ftPct) },
  { key: "reb", label: "REB", width: 44, render: (a) => fmt1(a.reb) },
  { key: "oreb", label: "OREB", width: 46, render: (a) => fmt1(a.oreb) },
  { key: "ast", label: "AST", width: 44, render: (a) => fmt1(a.ast) },
  { key: "stl", label: "STL", width: 40, render: (a) => fmt1(a.stl) },
  { key: "blk", label: "BLK", width: 40, render: (a) => fmt1(a.blk) },
  { key: "tov", label: "TOV", width: 42, render: (a) => fmt1(a.tov) },
  { key: "pf", label: "PF", width: 40, render: (a) => fmt1(a.pf) },
  { key: "oppFgPct", label: "OPP FG%", width: 62, render: (a) => fmt1(a.oppFgPct) },
  { key: "oppFg3Pct", label: "OPP 3P%", width: 62, render: (a) => fmt1(a.oppFg3Pct) },
];

const WL_W = 50;

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return `rgba(255,255,255,${alpha})`;
  const n = parseInt(raw, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export function NbaTeamStatSplitTableNative({
  rows,
  accent,
}: {
  rows: NbaTeamStatSplitTableRow[];
  accent: string;
}) {
  const frame = hexToRgba(accent, 0.3);
  const headLine = hexToRgba(accent, 0.18);
  const line = hexToRgba(accent, 0.1);
  const rowBorder = (i: number) =>
    i < rows.length - 1
      ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: line }
      : null;
  const zebra = (i: number) =>
    i % 2 === 1 ? { backgroundColor: "rgba(255,255,255,0.035)" } : null;

  return (
    <View style={[styles.wrap, { borderColor: frame }]}>
      <View style={[styles.labelCol, { borderRightColor: headLine }]}>
        <View
          style={[
            styles.headCell,
            { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: headLine },
          ]}
        />
        {rows.map((r, i) => (
          <View key={r.key} style={[styles.labelCell, zebra(i), rowBorder(i)]}>
            <Text
              style={[styles.labelText, r.labelColor ? { color: r.labelColor } : null]}
              numberOfLines={1}
            >
              {r.label}
            </Text>
          </View>
        ))}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View>
          <View
            style={[
              styles.row,
              styles.headCell,
              { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: headLine },
            ]}
          >
            <Text style={[styles.headText, { width: WL_W }]}>W-L</Text>
            {STAT_COLS.map((c) => (
              <Text key={c.key} style={[styles.headText, { width: c.width }]}>
                {c.label}
              </Text>
            ))}
          </View>
          {rows.map((r, i) => {
            const avg = r.row.avg;
            return (
              <View key={r.key} style={[styles.row, styles.bodyRow, zebra(i), rowBorder(i)]}>
                <Text style={[styles.cell, styles.wlCell, { width: WL_W }]}>
                  {r.row.wins}-{r.row.losses}
                </Text>
                {STAT_COLS.map((c) => {
                  const tone = avg ? c.tone?.(avg) : undefined;
                  return (
                    <Text
                      key={c.key}
                      style={[styles.cell, { width: c.width }, tone ? { color: tone } : null]}
                    >
                      {avg ? c.render(avg) : "—"}
                    </Text>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    borderWidth: 1,
    backgroundColor: "rgba(8,8,12,0.5)",
    overflow: "hidden",
  },
  labelCol: {
    width: LABEL_W,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  headCell: {
    height: HEAD_H,
    justifyContent: "center",
  },
  labelCell: {
    height: ROW_H,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  labelText: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.88)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    transform: [{ skewX: "-8deg" }],
  },
  scrollContent: {
    paddingRight: 28,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    gap: 6,
  },
  bodyRow: {
    height: ROW_H,
  },
  headText: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "right",
    transform: [{ skewX: "-6deg" }],
  },
  cell: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  wlCell: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
