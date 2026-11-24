import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  averageRecentGameLogs,
  formatMetricDisplay,
  isPlayerDetailLast10AboveSeason,
  NBA_PLAYER_DETAIL_SEASON_SHOWN,
  playerDetailRecentRawValue,
  playerDetailSeasonRawValue,
  type NbaPlayerDetailPreview,
  type NbaPlayerGameLog,
  type NbaPlayerSeasonMetric,
} from "../../../../../../lib/predict/nbaPlayerDetailPreviewMocks";
import { isPlayerDetailRankShown } from "../../../../../../lib/predict/nbaPlayerDetailHowTheyPlay";
import {
  filterLogsByWindow,
  nbaStatsWindowId,
  nbaStatsWindowsForLogs,
  type NbaStatsWindow,
} from "../../../../../../lib/nba/nbaStatsWindow";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import { profileOverviewChartNoDataStyle } from "../../profile/profileOverviewChartShell";
import { nbaPlayerDetailChrome } from "./nbaPlayerDetailChromeCopy";
import NbaStatsWindowChipsNative from "../stats/NbaStatsWindowChipsNative";

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return `rgba(124,255,107,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) {
    return `rgba(124,255,107,${alpha})`;
  }
  return `rgba(${r},${g},${b},${alpha})`;
}

/** 選手詳細の SEASON AVERAGES（Season / 月 / 直近 N）。ASK でも同じ部品を出す */
export function NbaPlayerSeasonAveragesNative({
  metrics,
  season,
  logs,
  accent,
  language,
  statsWindow: statsWindowProp,
  onStatsWindowChange,
}: {
  metrics: NbaPlayerSeasonMetric[];
  season: NbaPlayerDetailPreview["season"];
  logs: NbaPlayerGameLog[];
  accent: string;
  language: string;
  statsWindow?: NbaStatsWindow;
  onStatsWindowChange?: (next: NbaStatsWindow) => void;
}) {
  const chrome = nbaPlayerDetailChrome(language);
  const shown = NBA_PLAYER_DETAIL_SEASON_SHOWN.map(
    (id) => metrics.find((m) => m.id === id)
  ).filter((m): m is NbaPlayerSeasonMetric => Boolean(m));
  const cellLine = hexToRgba(accent, 0.22);
  const windows = useMemo(() => nbaStatsWindowsForLogs(logs), [logs]);
  const [innerWindow, setInnerWindow] = useState<NbaStatsWindow>({
    kind: "season",
  });
  const window = statsWindowProp ?? innerWindow;
  const setWindow = onStatsWindowChange ?? setInnerWindow;
  const windowId = nbaStatsWindowId(window);
  const filtered = useMemo(() => filterLogsByWindow(logs, window), [logs, window]);
  const windowAvg = useMemo(
    () =>
      window.kind === "season"
        ? null
        : averageRecentGameLogs(filtered, filtered.length),
    [filtered, window.kind]
  );
  const hasSeasonAverages = season.gamesPlayed > 0;
  const hot = "#FCD34D";

  const renderCells = (
    cells: Array<{
      id: string;
      short: string;
      display: string;
      leagueRank?: number;
      highlight?: boolean;
    }>
  ) => (
    <View style={[styles.advGrid, { borderColor: hexToRgba(accent, 0.4) }]}>
      {cells.map((m, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const lastRow = Math.floor((cells.length - 1) / 3);
        return (
          <View
            key={m.id}
            style={[
              styles.advCell,
              col < 2
                ? {
                    borderRightWidth: StyleSheet.hairlineWidth,
                    borderRightColor: cellLine,
                  }
                : null,
              row < lastRow
                ? {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: cellLine,
                  }
                : null,
            ]}
          >
            <View style={styles.advCellTop}>
              <Text style={styles.advLabel}>{m.short}</Text>
              {m.leagueRank != null && isPlayerDetailRankShown(m.leagueRank) ? (
                <Text
                  style={[
                    styles.advRank,
                    {
                      color:
                        m.leagueRank <= 10
                          ? accent
                          : "rgba(255,255,255,0.35)",
                    },
                  ]}
                >
                  #{m.leagueRank}
                </Text>
              ) : null}
            </View>
            <Text
              style={[
                styles.advValue,
                m.highlight ? { color: hot } : null,
              ]}
            >
              {m.display}
            </Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.advWrap}>
      <View style={styles.advTitleRow}>
        <Text style={styles.advTitle}>{chrome.seasonAverages}</Text>
        {window.kind !== "season" && filtered.length > 0 ? (
          <Text style={styles.advWindowN}>{filtered.length} GP</Text>
        ) : null}
      </View>
      <NbaStatsWindowChipsNative
        windows={windows}
        value={window}
        onChange={setWindow}
        accent={accent}
        language={language}
      />
      {windowId === "season" && hasSeasonAverages
        ? renderCells(
            shown.map((m) => ({
              id: m.id,
              short: m.short,
              display: m.display,
              leagueRank: m.leagueRank,
            }))
          )
        : windowId !== "season" && windowAvg
          ? renderCells(
              shown.map((m) => {
                const v = playerDetailRecentRawValue(windowAvg, m.id);
                const seasonV = playerDetailSeasonRawValue(season, m.id);
                return {
                  id: m.id,
                  short: m.short,
                  display: formatMetricDisplay(m.id, v),
                  highlight:
                    hasSeasonAverages &&
                    isPlayerDetailLast10AboveSeason(v, seasonV),
                };
              })
            )
          : (
              <View
                accessibilityRole="text"
                accessibilityLabel="NO DATA"
                style={[styles.noData, { borderColor: hexToRgba(accent, 0.3) }]}
              >
                <Text style={profileOverviewChartNoDataStyle}>NO DATA</Text>
              </View>
            )}
    </View>
  );
}

const styles = StyleSheet.create({
  advWrap: { gap: 10 },
  advTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  advTitle: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "#FFFFFF",
  },
  advWindowN: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.55)",
    fontVariant: ["tabular-nums"],
  },
  advGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    backgroundColor: "rgba(6,8,12,0.72)",
    overflow: "hidden",
  },
  advCell: {
    width: "33.333%",
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 4,
  },
  advCellTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  advLabel: {
    fontFamily: METRIC_FONT,
    color: "rgba(200,200,210,0.55)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  advRank: {
    fontFamily: METRIC_FONT,
    fontSize: 12,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-10deg" }],
  },
  advValue: {
    fontFamily: METRIC_FONT,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  careerHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  careerTabs: {
    flexDirection: "row",
    borderWidth: 1,
    overflow: "hidden",
  },
  careerTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  careerTabText: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  noData: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 88,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 12,
    paddingVertical: 28,
  },
});
