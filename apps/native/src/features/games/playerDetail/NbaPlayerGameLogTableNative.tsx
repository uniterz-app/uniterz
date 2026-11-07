import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  formatFgLine,
  type NbaPlayerGameLog,
} from "../../../../../../lib/predict/nbaPlayerDetailPreviewMocks";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";

const FORM_WIN = "#00F5FF";
const FORM_LOSS = "#FF2D78";
const POSITIVE_TEAL = "#5cf0b5";
const ROW_H = 38;
const HEAD_H = 30;
const DATE_W = 44;
const GAME_W = 58;
const RESULT_W = 16;

type Col = {
  key: string;
  label: string;
  width: number;
  render: (g: NbaPlayerGameLog) => string;
  tone?: (g: NbaPlayerGameLog) => string | undefined;
  strong?: boolean;
  dim?: boolean;
};

function opt(n: number | undefined): string {
  return typeof n === "number" && Number.isFinite(n) ? String(n) : "—";
}

function pct(made: number, att: number): string {
  return att > 0 ? ((100 * made) / att).toFixed(1) : "—";
}

const COLS: Col[] = [
  { key: "min", label: "MIN", width: 34, render: (g) => String(Math.round(g.min)) },
  { key: "pts", label: "PTS", width: 34, render: (g) => String(g.pts), strong: true },
  { key: "reb", label: "REB", width: 34, render: (g) => String(g.reb) },
  { key: "ast", label: "AST", width: 34, render: (g) => String(g.ast) },
  { key: "stl", label: "STL", width: 32, render: (g) => String(g.stl) },
  { key: "blk", label: "BLK", width: 32, render: (g) => String(g.blk) },
  { key: "tov", label: "TOV", width: 34, render: (g) => String(g.tov) },
  { key: "fg", label: "FG", width: 50, render: (g) => formatFgLine(g.fgm, g.fga), dim: true },
  { key: "fgPct", label: "FG%", width: 42, render: (g) => pct(g.fgm, g.fga) },
  { key: "fg3", label: "3P", width: 44, render: (g) => formatFgLine(g.fg3m, g.fg3a), dim: true },
  { key: "fg3Pct", label: "3P%", width: 42, render: (g) => pct(g.fg3m, g.fg3a) },
  { key: "ft", label: "FT", width: 44, render: (g) => formatFgLine(g.ftm, g.fta), dim: true },
  { key: "ftPct", label: "FT%", width: 42, render: (g) => pct(g.ftm, g.fta) },
  { key: "oreb", label: "OREB", width: 38, render: (g) => opt(g.oreb) },
  { key: "dreb", label: "DREB", width: 38, render: (g) => opt(g.dreb) },
  { key: "pf", label: "PF", width: 28, render: (g) => opt(g.pf) },
  {
    key: "pm",
    label: "+/-",
    width: 40,
    render: (g) => `${g.plusMinus > 0 ? "+" : ""}${g.plusMinus}`,
    tone: (g) =>
      g.plusMinus > 0 ? POSITIVE_TEAL : g.plusMinus < 0 ? FORM_LOSS : undefined,
  },
];

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return `rgba(255,255,255,${alpha})`;
  const n = parseInt(raw, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export function NbaPlayerGameLogTableNative({
  logs,
  accent,
}: {
  logs: NbaPlayerGameLog[];
  accent: string;
}) {
  const frame = hexToRgba(accent, 0.3);
  const headLine = hexToRgba(accent, 0.18);
  const line = hexToRgba(accent, 0.1);
  const rowBorder = (i: number) =>
    i < logs.length - 1
      ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: line }
      : null;
  const zebra = (i: number) =>
    i % 2 === 1 ? { backgroundColor: "rgba(255,255,255,0.035)" } : null;
  const headBorder = {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: headLine,
  };

  return (
    <View style={[styles.wrap, { borderColor: frame }]}>
      <View style={[styles.fixedCol, { borderRightColor: headLine }]}>
        <View style={[styles.fixedRow, styles.headRow, headBorder]}>
          <Text style={[styles.headText, { width: DATE_W }]}>DATE</Text>
          <Text style={[styles.headText, { width: GAME_W }]}>GAME</Text>
          <Text style={[styles.headText, { width: RESULT_W }]}> </Text>
        </View>
        {logs.map((g, i) => (
          <View
            key={g.gameId}
            style={[styles.fixedRow, styles.bodyRow, zebra(i), rowBorder(i)]}
          >
            <Text style={[styles.date, { width: DATE_W }]} numberOfLines={1}>
              {g.dateLabel}
            </Text>
            <Text style={[styles.game, { width: GAME_W }]} numberOfLines={1}>
              {g.home ? "vs" : "@"} {g.oppAbbr}
            </Text>
            <Text
              style={[
                styles.result,
                { width: RESULT_W, color: g.result === "W" ? FORM_WIN : FORM_LOSS },
              ]}
            >
              {g.result}
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
          <View style={[styles.row, styles.headRow, headBorder]}>
            {COLS.map((c) => (
              <Text key={c.key} style={[styles.headText, styles.right, { width: c.width }]}>
                {c.label}
              </Text>
            ))}
          </View>
          {logs.map((g, i) => (
            <View key={g.gameId} style={[styles.row, styles.bodyRow, zebra(i), rowBorder(i)]}>
              {COLS.map((c) => {
                const tone = c.tone?.(g);
                return (
                  <Text
                    key={c.key}
                    style={[
                      styles.cell,
                      { width: c.width },
                      c.strong ? styles.strong : null,
                      c.dim ? styles.dim : null,
                      tone ? { color: tone } : null,
                    ]}
                  >
                    {c.render(g)}
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
    backgroundColor: "rgba(8,8,12,0.55)",
    overflow: "hidden",
  },
  fixedCol: {
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  fixedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 4,
  },
  headRow: {
    height: HEAD_H,
  },
  bodyRow: {
    height: ROW_H,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    gap: 6,
  },
  scrollContent: {
    paddingRight: 28,
  },
  headText: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  right: {
    textAlign: "right",
  },
  date: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
  },
  game: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    fontWeight: "700",
  },
  result: {
    fontFamily: METRIC_FONT,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    transform: [{ skewX: "-8deg" }],
  },
  cell: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  strong: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  dim: {
    color: "rgba(255,255,255,0.55)",
  },
});
