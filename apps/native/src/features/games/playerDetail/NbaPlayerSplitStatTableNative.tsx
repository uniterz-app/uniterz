import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { NbaPlayerSplitExtras } from "../../../../../../lib/predict/nbaPlayerDetailPreviewMocks";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";

const POSITIVE_TEAL = "#5cf0b5";
const NEGATIVE = "#FF2D78";
const ROW_H = 38;
const HEAD_H = 30;
const LABEL_W = 84;

export type NbaPlayerSplitStatRow = NbaPlayerSplitExtras & {
  games: number;
  min?: number;
  pts: number;
  reb: number;
  ast: number;
  plusMinus: number;
};

export type NbaPlayerSplitStatTableRow = {
  key: string;
  label: string;
  row: NbaPlayerSplitStatRow;
};

type Col = {
  key: string;
  label: string;
  width: number;
  render: (r: NbaPlayerSplitStatRow) => string;
  tone?: (r: NbaPlayerSplitStatRow) => string | undefined;
  strong?: boolean;
};

function num(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function pct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toFixed(1);
}

const COLS: Col[] = [
  { key: "gp", label: "GP", width: 30, render: (r) => String(r.games) },
  {
    key: "wl",
    label: "W-L",
    width: 44,
    render: (r) => (r.wins == null || r.losses == null ? "—" : `${r.wins}-${r.losses}`),
  },
  { key: "min", label: "MIN", width: 40, render: (r) => num(r.min) },
  { key: "pts", label: "PTS", width: 40, render: (r) => num(r.pts), strong: true },
  { key: "reb", label: "REB", width: 38, render: (r) => num(r.reb) },
  { key: "ast", label: "AST", width: 38, render: (r) => num(r.ast) },
  {
    key: "pm",
    label: "+/-",
    width: 46,
    render: (r) => `${r.plusMinus > 0 ? "+" : ""}${num(r.plusMinus)}`,
    tone: (r) =>
      r.plusMinus > 0 ? POSITIVE_TEAL : r.plusMinus < 0 ? NEGATIVE : undefined,
  },
  { key: "fgPct", label: "FG%", width: 44, render: (r) => pct(r.fgPct) },
  { key: "fg3m", label: "3PM", width: 38, render: (r) => num(r.fg3m) },
  { key: "fg3Pct", label: "3P%", width: 44, render: (r) => pct(r.fg3Pct) },
  { key: "fta", label: "FTA", width: 38, render: (r) => num(r.fta) },
  { key: "ftPct", label: "FT%", width: 44, render: (r) => pct(r.ftPct) },
  { key: "stl", label: "STL", width: 36, render: (r) => num(r.stl) },
  { key: "blk", label: "BLK", width: 36, render: (r) => num(r.blk) },
  { key: "tov", label: "TOV", width: 38, render: (r) => num(r.tov) },
  { key: "oreb", label: "OREB", width: 42, render: (r) => num(r.oreb) },
  { key: "dreb", label: "DREB", width: 42, render: (r) => num(r.dreb) },
  { key: "pf", label: "PF", width: 34, render: (r) => num(r.pf) },
];

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return `rgba(255,255,255,${alpha})`;
  const n = parseInt(raw, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export function NbaPlayerSplitStatTableNative({
  rows,
  accent,
  labelHeader = "",
}: {
  rows: NbaPlayerSplitStatTableRow[];
  accent: string;
  labelHeader?: string;
}) {
  const frame = hexToRgba(accent, 0.4);
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
            styles.labelCell,
            { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: headLine },
          ]}
        >
          <Text style={styles.headText} numberOfLines={1}>
            {labelHeader}
          </Text>
        </View>
        {rows.map((r, i) => (
          <View key={r.key} style={[styles.labelCell, styles.bodyRow, zebra(i), rowBorder(i)]}>
            <Text style={styles.labelText} numberOfLines={1}>
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
            {COLS.map((c) => (
              <Text key={c.key} style={[styles.headText, styles.right, { width: c.width }]}>
                {c.label}
              </Text>
            ))}
          </View>
          {rows.map((r, i) => (
            <View key={r.key} style={[styles.row, styles.bodyRow, zebra(i), rowBorder(i)]}>
              {COLS.map((c) => {
                const tone = c.tone?.(r.row);
                return (
                  <Text
                    key={c.key}
                    style={[
                      styles.cell,
                      { width: c.width },
                      c.strong ? styles.strong : null,
                      tone ? { color: tone } : null,
                    ]}
                  >
                    {c.render(r.row)}
                  </Text>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
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
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  labelText: {
    fontFamily: METRIC_FONT,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
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
    transform: [{ skewX: "-6deg" }],
  },
  right: {
    textAlign: "right",
  },
  cell: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  strong: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
