/** Web `NbaLeagueTeamStatsPanel` 相当 — 左レール + リーグ 30 チーム表 */
import { useMemo, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getMobileTeamName } from "../../../../../../lib/team-name-split-mobile";
import { getTeamPrimaryColor } from "../../../../../../lib/team-colors";
import {
  formatMetricValue,
  metricValue,
  defaultLeagueTeamStatSortDir,
  leagueMetricDef,
  leagueTeamRailGroupsForMode,
  sortLeagueTeamRows,
  teamGamesPlayed,
  formatTeamRecord,
  type NbaLeagueTeamStatSortDir,
  type NbaLeagueTeamStatMetric,
  type NbaLeagueTeamStatRow,
} from "../../../../../../lib/predict/nbaLeagueTeamStatsMocks";
import { useLeagueTeamStatsBundle } from "../../../../../../lib/nba/useLeagueTeamStatsBundle";
import { nbaDailyStatsUpdateFootnote } from "../../../../../../lib/nba/nbaStatsUpdateSchedule";
import {
  coerceModeForPhase,
  modeTabLabel,
  modesForPhase,
  NBA_LEAGUE_STATS_PHASES,
  phaseTabLabel,
  resolveLeagueTeamStatRows,
  type NbaLeagueStatsMode,
  type NbaLeagueStatsPhase,
} from "../../../../../../lib/nba/leagueStatsTableTabs";
import { getUniterzApiBaseUrl } from "../submitPredictionApi";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
  CYBER_TAB_CYAN,
} from "../../rankings/CyberSlantedTabNative";
import {
  METRIC_FONT,
  RANK_DISPLAY_FONT,
} from "../../rankings/rankingsUiTheme";
import {
  MATCH_CARD_BRACKET_LETTER_SPACING_15,
  MATCH_CARD_BRACKET_TEXT,
} from "../matchCardTypography";
import { CYBER_SIDE_MENU_PANEL } from "../../../ui/cyberSideMenuNative";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";

const OXANIUM_800 = "Oxanium_800ExtraBold";

type Props = {
  language: "ja" | "en";
  onSelectTeam: (teamId: string) => void;
};

/** 選択チップのタグ横線（CyberSlantedTab は触らない） */
function RailChipScan() {
  const lines: number[] = [];
  for (let y = 2; y <= 36; y += 3) lines.push(y);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {lines.map((y) => (
        <View key={y} style={[railChipScanLine, { top: y }]} />
      ))}
    </View>
  );
}

const railChipScanLine = {
  position: "absolute" as const,
  left: 0,
  right: 0,
  height: 1,
  backgroundColor: "rgba(0,0,0,0.2)",
};

function nick(row: NbaLeagueTeamStatRow): string {
  return getMobileTeamName("nba", row.teamName).toUpperCase();
}

function rankColor(rank: number): string {
  if (rank <= 6) return "rgba(110,231,183,0.95)";
  if (rank <= 10) return "rgba(252,211,77,0.92)";
  return "rgba(252,165,165,0.75)";
}

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "").trim();
  if (raw.length !== 6) return `rgba(92,240,181,${alpha})`;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function NbaLeagueTeamStatsPanelNative({
  language,
  onSelectTeam,
}: Props) {
  const isJa = language === "ja";
  const { width: screenW } = useWindowDimensions();
  const railW = Math.round(screenW * 0.22);
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const { bundle, source, loading, error } = useLeagueTeamStatsBundle({
    apiBaseUrl: getUniterzApiBaseUrl(),
  });
  const updateFootnote = nbaDailyStatsUpdateFootnote(isJa ? "ja" : "en", bundle.asOfLabel);
  const [phase, setPhase] = useState<NbaLeagueStatsPhase>("season");
  const [mode, setMode] = useState<NbaLeagueStatsMode>("per_game");
  const groups = useMemo(() => leagueTeamRailGroupsForMode(mode), [mode]);
  const [metric, setMetric] = useState<NbaLeagueTeamStatMetric>("winPct");
  const [sortDir, setSortDir] = useState<NbaLeagueTeamStatSortDir>(() =>
    defaultLeagueTeamStatSortDir(leagueMetricDef("winPct").higherIsBetter)
  );

  const metricMeta = leagueMetricDef(metric);
  const activeGroupId =
    groups.find((g) => g.metrics.some((m) => m.id === metric))?.id ?? "basic";

  function applyMetric(next: NbaLeagueTeamStatMetric) {
    const meta = leagueMetricDef(next);
    setMetric(next);
    setSortDir(defaultLeagueTeamStatSortDir(meta.higherIsBetter));
  }

  function applyMode(next: NbaLeagueStatsMode) {
    setMode(next);
    const nextGroups = leagueTeamRailGroupsForMode(next);
    const allowed = new Set(
      nextGroups.flatMap((g) => g.metrics.map((m) => m.id))
    );
    if (!allowed.has(metric)) {
      const fallback = nextGroups[0]?.metrics[0]?.id;
      if (fallback) applyMetric(fallback);
    }
  }

  function toggleSortDir() {
    setSortDir((d) => (d === "desc" ? "asc" : "desc"));
  }

  const modeOptions = modesForPhase(phase);
  const rows = useMemo(() => {
    const base = resolveLeagueTeamStatRows({
      phase,
      mode,
      season: bundle.season,
      last10: bundle.last10,
    });
    return sortLeagueTeamRows(base, metric, sortDir);
  }, [bundle, phase, mode, metric, sortDir]);

  return (
    <View style={styles.root}>
      {loading ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color={CYBER_TAB_CYAN} />
        </View>
      ) : null}

      <View style={styles.top}>
        <Text style={styles.asOf}>{updateFootnote}</Text>
        {error ? (
          <Text style={styles.fetchWarn}>
            {isJa
              ? `読み込み失敗（${error}）`
              : `Failed to load (${error})`}
          </Text>
        ) : null}
        <View style={styles.tabBlock}>
          <CyberSlantedTabBarNative fill>
            {NBA_LEAGUE_STATS_PHASES.map((p) => (
              <CyberSlantedTabNative
                key={p}
                label={phaseTabLabel(p)}
                active={phase === p}
                onPress={() => {
                  setPhase(p);
                  setMode(coerceModeForPhase(p, mode));
                }}
                compact
                fontWeight="700"
              />
            ))}
          </CyberSlantedTabBarNative>
          <View style={styles.subTabBlock}>
            <CyberSlantedTabBarNative fill>
              {modeOptions.map((m) => (
                <CyberSlantedTabNative
                  key={m}
                  label={modeTabLabel(m)}
                  active={mode === m}
                  onPress={() => applyMode(m)}
                  compact
                  fontWeight="700"
                />
              ))}
            </CyberSlantedTabBarNative>
          </View>
        </View>
      </View>

      <View style={styles.split}>
        <View style={[styles.railWrap, { width: railW }]}>
          <ScrollView
            style={styles.railScroll}
            contentContainerStyle={[
              styles.railInner,
              { paddingBottom: bottomContentReserveY },
            ]}
            showsVerticalScrollIndicator={false}
          >
          {groups.map((group, index) => {
            const groupActive = group.id === activeGroupId;
            const showAdvancedLabel = index === 1;
            return (
              <View key={group.id} style={styles.railGroup}>
                {showAdvancedLabel ? (
                  <Text style={styles.modeLabel} numberOfLines={1}>
                    ADVANCED
                  </Text>
                ) : null}
                <Pressable
                  onPress={() => {
                    const first = group.metrics[0];
                    if (first) applyMetric(first.id);
                  }}
                  hitSlop={4}
                >
                  <Text
                    style={[
                      styles.groupLabel,
                      groupActive && styles.groupLabelActive,
                    ]}
                    numberOfLines={1}
                  >
                    {group.short}
                  </Text>
                </Pressable>
                {group.metrics.map((m) => {
                  const active = metric === m.id;
                  return (
                    <Pressable
                      key={m.id}
                      onPress={() => applyMetric(m.id)}
                      style={[styles.railChip, active && styles.railChipActive]}
                    >
                      {active ? <RailChipScan /> : null}
                      <Text
                        style={[
                          styles.railChipLabel,
                          active && styles.railChipLabelActive,
                        ]}
                        numberOfLines={1}
                      >
                        {m.short}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
        </View>

        <View style={styles.main}>
          <Text style={styles.metricHint} numberOfLines={2}>
            {isJa ? metricMeta.hintJa : metricMeta.hintEn}
          </Text>

          <ScrollView
            style={styles.tableScroll}
            contentContainerStyle={[
              styles.tablePad,
              { paddingBottom: bottomContentReserveY },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.table}>
              <View style={styles.tableHead}>
                <Text style={[styles.th, styles.colRank]}>#</Text>
                <Pressable
                  onPress={toggleSortDir}
                  hitSlop={4}
                  style={styles.thTeamBtn}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isJa
                      ? sortDir === "desc"
                        ? "降順。タップで昇順"
                        : "昇順。タップで降順"
                      : sortDir === "desc"
                        ? "Descending. Tap for ascending"
                        : "Ascending. Tap for descending"
                  }
                >
                  <Text style={styles.th}>Team</Text>
                  <Text style={styles.thSortDir}>
                    {isJa
                      ? sortDir === "desc"
                        ? "降順"
                        : "昇順"
                      : sortDir === "desc"
                        ? "hi→lo"
                        : "lo→hi"}
                  </Text>
                  <MaterialCommunityIcons
                    name={sortDir === "desc" ? "arrow-down" : "arrow-up"}
                    size={11}
                    color={CYBER_TAB_CYAN}
                  />
                </Pressable>
                {metric === "winPct" ? (
                  <>
                    <Text style={[styles.th, styles.colRecord]}>W-L</Text>
                    <Text style={[styles.th, styles.colMetric]}>W%</Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.th, styles.colGp]}>GP</Text>
                    <Text style={[styles.th, styles.colMetric]}>
                      {metricMeta.short}
                    </Text>
                  </>
                )}
              </View>
              {rows.map((row, index) => {
                const rank = index + 1;
                const primary = metricValue(row, metric);
                const rankColorVal = rankColor(rank);
                const teamPrimary =
                  getTeamPrimaryColor("nba", row.teamId) ?? "#5cf0b5";
                return (
                  <Pressable
                    key={row.teamId}
                    onPress={() => onSelectTeam(row.teamId)}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.row,
                      pressed ? styles.rowPressed : null,
                    ]}
                  >
                    {({ pressed }) => (
                      <>
                    <LinearGradient
                      colors={[
                        hexToRgba(teamPrimary, 0.18),
                        hexToRgba(teamPrimary, 0.1),
                        "rgba(0,0,0,0)",
                      ]}
                      locations={[0, 0.5, 1]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      pointerEvents="none"
                      style={StyleSheet.absoluteFillObject}
                    />
                    {pressed ? (
                      <View pointerEvents="none" style={styles.rowPressedWash} />
                    ) : null}
                    <Text style={[styles.tdRank, { color: rankColorVal }]}>
                      {rank}
                    </Text>
                    <View style={styles.colTeamInner}>
                      <Text style={styles.tdTeam} numberOfLines={1}>
                        {nick(row)}
                      </Text>
                    </View>
                    {metric === "winPct" ? (
                      <Text style={styles.tdRecord}>
                        {formatTeamRecord(row)}
                      </Text>
                    ) : (
                      <Text style={styles.tdGp}>{teamGamesPlayed(row)}</Text>
                    )}
                    <Text style={styles.tdMetric}>
                      {formatMetricValue(metric, primary)}
                    </Text>
                      </>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(4,10,16,0.35)",
  },
  top: {
    paddingHorizontal: 12,
    paddingTop: 2,
    marginBottom: 8,
    gap: 6,
  },
  asOf: {
    fontFamily: METRIC_FONT,
    color: "rgba(0,245,255,0.45)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    textAlign: "right",
  },
  fetchWarn: {
    fontFamily: METRIC_FONT,
    color: "rgba(252,211,77,0.75)",
    fontSize: 10,
    lineHeight: 14,
  },
  tabBlock: { marginBottom: 2, gap: 6 },
  subTabBlock: { marginTop: 0 },
  split: {
    flex: 1,
    flexDirection: "row",
    minHeight: 0,
  },
  railWrap: {
    flexGrow: 0,
    flexShrink: 0,
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.42)",
    backgroundColor: "rgba(4,14,22,0.55)",
  },
  railScroll: {
    flex: 1,
  },
  railInner: {
    paddingHorizontal: 6,
    paddingTop: 4,
  },
  railGroup: {
    marginBottom: 10,
    gap: 4,
  },
  modeLabel: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.32)",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
    marginTop: 2,
  },
  groupLabel: {
    fontFamily: METRIC_FONT,
    color: "rgba(0,245,255,0.42)",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.0,
    textTransform: "uppercase",
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  groupLabelActive: {
    color: CYBER_TAB_CYAN,
  },
  railChip: {
    alignSelf: "stretch",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.26)",
    backgroundColor: "transparent",
    borderRadius: 2,
    paddingVertical: 9,
    paddingHorizontal: 2,
    alignItems: "center",
  },
  railChipActive: {
    borderColor: CYBER_TAB_CYAN,
    backgroundColor: CYBER_TAB_CYAN,
  },
  railChipLabel: {
    fontFamily: METRIC_FONT,
    color: CYBER_TAB_CYAN,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
  },
  railChipLabelActive: {
    color: "#050508",
  },
  main: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 10,
    paddingRight: 12,
  },
  metricHint: {
    fontFamily: METRIC_FONT,
    color: "rgba(0,245,255,0.68)",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 6,
  },
  tableScroll: { flex: 1 },
  tablePad: {},
  table: {
    borderWidth: 1,
    borderColor: CYBER_SIDE_MENU_PANEL.innerBorderColor,
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: "rgba(4,16,24,0.35)",
  },
  tableHead: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,245,255,0.06)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CYBER_SIDE_MENU_PANEL.innerBorderColor,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  th: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.42)",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  thTeamBtn: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  thSortDir: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.42)",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  colRank: { width: 26 },
  colGp: { width: 28, textAlign: "right" },
  colRecord: { width: 44, textAlign: "right" },
  colMetric: { width: 56, textAlign: "right", color: CYBER_TAB_CYAN },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,245,255,0.08)",
    overflow: "hidden",
  },
  rowPressed: {
    transform: [{ scale: 0.985 }],
  },
  rowPressedWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,245,255,0.16)",
  },
  tdRank: {
    width: 26,
    fontFamily: RANK_DISPLAY_FONT,
    fontSize: 15,
    letterSpacing: 0.5,
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-10deg" }],
  },
  colTeamInner: { flex: 1, minWidth: 0 },
  tdTeam: {
    ...MATCH_CARD_BRACKET_TEXT,
    flexShrink: 1,
    color: "rgba(255,255,255,0.92)",
    fontSize: 17,
    letterSpacing: MATCH_CARD_BRACKET_LETTER_SPACING_15,
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
  },
  tdGp: {
    width: 28,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  tdRecord: {
    width: 44,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  tdMetric: {
    width: 56,
    textAlign: "right",
    fontFamily: OXANIUM_800,
    color: CYBER_TAB_CYAN,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
});
