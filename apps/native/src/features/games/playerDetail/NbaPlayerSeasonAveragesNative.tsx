import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  averageRecentGameLogs,
  formatMetricDisplay,
  formatPlayerDetailWindowDelta,
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

const HOT = "#FCD34D";
const COOL = "rgba(125,211,252,0.88)";

type GridCell = {
  id: string;
  short: string;
  display: string;
  leagueRank?: number;
  delta?: { text: string; up: boolean; flat: boolean } | null;
};

function MetricGrid({
  cells,
  accent,
  cellLine,
}: {
  cells: GridCell[];
  accent: string;
  cellLine: string;
}) {
  return (
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
            <Text style={styles.advValue}>{m.display}</Text>
            {m.delta ? (
              <Text
                style={[
                  styles.advDelta,
                  {
                    color: m.delta.flat
                      ? "rgba(255,255,255,0.38)"
                      : m.delta.up
                        ? HOT
                        : COOL,
                  },
                ]}
                numberOfLines={1}
              >
                {m.delta.text}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function NoData({ accent }: { accent: string }) {
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel="NO DATA"
      style={[styles.noData, { borderColor: hexToRgba(accent, 0.3) }]}
    >
      <Text style={profileOverviewChartNoDataStyle}>NO DATA</Text>
    </View>
  );
}

function defaultPeriodWindow(
  windows: readonly NbaStatsWindow[]
): NbaStatsWindow | null {
  return (
    windows.find((w) => w.kind === "last" && w.n === 10) ??
    windows.find((w) => w.kind !== "season") ??
    null
  );
}

/** 選手詳細の SEASON AVERAGES。シーズン表と期間表を切替 */
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
  const periodWindows = useMemo(
    () => windows.filter((w) => w.kind !== "season"),
    [windows]
  );
  const [innerWindow, setInnerWindow] = useState<NbaStatsWindow>({
    kind: "season",
  });
  const [savedPeriod, setSavedPeriod] = useState<NbaStatsWindow | null>(null);
  const window = statsWindowProp ?? innerWindow;
  const setWindow = onStatsWindowChange ?? setInnerWindow;
  const compare = window.kind !== "season";

  useEffect(() => {
    if (compare) setSavedPeriod(window);
  }, [compare, window]);

  const periodValue =
    (compare ? window : savedPeriod) ?? defaultPeriodWindow(periodWindows);

  const filtered = useMemo(
    () => (compare ? filterLogsByWindow(logs, window) : []),
    [logs, window, compare]
  );
  const windowAvg = useMemo(
    () =>
      compare && filtered.length > 0
        ? averageRecentGameLogs(filtered, filtered.length)
        : null,
    [filtered, compare]
  );
  const hasSeasonAverages = season.gamesPlayed > 0;

  const seasonCells: GridCell[] = shown.map((m) => ({
    id: m.id,
    short: m.short,
    display: m.display,
    leagueRank: m.leagueRank,
  }));

  const windowCells: GridCell[] | null =
    compare && windowAvg
      ? shown.map((m) => {
          const windowRaw = playerDetailRecentRawValue(windowAvg, m.id);
          const seasonRaw = playerDetailSeasonRawValue(season, m.id);
          return {
            id: m.id,
            short: m.short,
            display: formatMetricDisplay(m.id, windowRaw),
            delta: formatPlayerDetailWindowDelta(m.id, windowRaw, seasonRaw),
          };
        })
      : null;

  const gp = compare
    ? filtered.length > 0
      ? `${filtered.length} GP`
      : null
    : hasSeasonAverages
      ? `${season.gamesPlayed} GP`
      : null;

  return (
    <View style={styles.advWrap}>
      <View style={styles.advTitleRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: !compare }}
          onPress={() => setWindow({ kind: "season" })}
          style={[
            styles.modeChip,
            { borderColor: accent },
            !compare ? { backgroundColor: accent } : null,
          ]}
        >
          <Text
            style={[
              styles.modeChipLabel,
              { color: !compare ? "#050508" : accent },
            ]}
          >
            {chrome.seasonAverages}
          </Text>
        </Pressable>
        {periodWindows.length > 0 && periodValue ? (
          <NbaStatsWindowChipsNative
            windows={periodWindows}
            value={periodValue}
            onChange={(next) => {
              setSavedPeriod(next);
              setWindow(next);
            }}
            accent={accent}
            language={language}
            filled={compare}
            showWhenSingle
            onActivate={() => {
              if (!compare && periodValue) {
                setWindow(periodValue);
                return true;
              }
              return false;
            }}
          />
        ) : null}
        {gp ? <Text style={styles.advWindowN}>{gp}</Text> : null}
      </View>

      {compare ? (
        windowCells ? (
          <MetricGrid cells={windowCells} accent={accent} cellLine={cellLine} />
        ) : (
          <NoData accent={accent} />
        )
      ) : hasSeasonAverages ? (
        <MetricGrid cells={seasonCells} accent={accent} cellLine={cellLine} />
      ) : (
        <NoData accent={accent} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  advWrap: { gap: 10 },
  advTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  modeChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  modeChipLabel: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
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
  advDelta: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
    fontVariant: ["tabular-nums"],
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
