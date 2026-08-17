/** Web `NbaLeagueTeamStatsPanel` 相当 — リーグ 30 チーム表 + ソート → Team Detail */
import { useMemo, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getMobileTeamName } from "../../../../../../lib/team-name-split-mobile";
import { getTeamPrimaryColor } from "../../../../../../lib/team-colors";
import {
  formatMetricValue,
  metricValue,
  NBA_LEAGUE_TEAM_STAT_METRICS,
  NBA_LEAGUE_TEAM_STAT_METRIC_ROWS,
  sortLeagueTeamRows,
  defaultLeagueTeamStatSortDir,
  type NbaLeagueTeamStatSortDir,
  type NbaLeagueTeamStatMetric,
  type NbaLeagueTeamStatRow,
  type NbaLeagueTeamStatWindow,
} from "../../../../../../lib/predict/nbaLeagueTeamStatsMocks";
import { useLeagueTeamStatsBundle } from "../../../../../../lib/nba/useLeagueTeamStatsBundle";
import { getUniterzApiBaseUrl } from "../submitPredictionApi";
import type { NbaConferenceId } from "../../../../../../lib/nba/nbaConferenceTeams";
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

type ConfFilter = "all" | NbaConferenceId;

const OXANIUM_800 = "Oxanium_800ExtraBold";

type Props = {
  language: "ja" | "en";
  onSelectTeam: (teamId: string) => void;
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

function MetricChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.metricChip, active && styles.metricChipActive]}
    >
      <Text style={[styles.metricChipLabel, active && styles.metricChipLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function NbaLeagueTeamStatsPanelNative({
  language,
  onSelectTeam,
}: Props) {
  const isJa = language === "ja";
  const { bundle, source, loading, error } = useLeagueTeamStatsBundle({
    apiBaseUrl: getUniterzApiBaseUrl(),
  });
  const [windowId, setWindowId] = useState<NbaLeagueTeamStatWindow>("season");
  const [conf, setConf] = useState<ConfFilter>("all");
  const [metric, setMetric] = useState<NbaLeagueTeamStatMetric>("winPct");
  const [sortDir, setSortDir] = useState<NbaLeagueTeamStatSortDir>(() =>
    defaultLeagueTeamStatSortDir(
      NBA_LEAGUE_TEAM_STAT_METRICS.find((m) => m.id === "winPct")!
        .higherIsBetter
    )
  );

  const metricMeta = NBA_LEAGUE_TEAM_STAT_METRICS.find((m) => m.id === metric)!;

  function selectMetric(next: NbaLeagueTeamStatMetric) {
    const meta = NBA_LEAGUE_TEAM_STAT_METRICS.find((m) => m.id === next)!;
    setMetric(next);
    setSortDir(defaultLeagueTeamStatSortDir(meta.higherIsBetter));
  }

  function toggleSortDir() {
    setSortDir((d) => (d === "desc" ? "asc" : "desc"));
  }

  const rows = useMemo(() => {
    const base = windowId === "season" ? bundle.season : bundle.last10;
    const filtered =
      conf === "all" ? base : base.filter((r) => r.conference === conf);
    return sortLeagueTeamRows(filtered, metric, sortDir);
  }, [bundle, windowId, conf, metric, sortDir]);

  return (
    <View style={styles.root}>
      {loading ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color={CYBER_TAB_CYAN} />
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={[styles.pad, { paddingBottom: 64 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.asOf}>
            {bundle.asOfLabel}
            {source === "firestore" ? "" : " · MOCK"}
          </Text>
          <Text style={styles.sub}>
            {isJa
              ? "リーグ全体を指標で並べ替え。チームをタップして詳細へ。"
              : "Sort the league by metric. Tap a team for detail."}
          </Text>
          {error ? (
            <Text style={styles.fetchWarn}>
              {isJa
                ? `API 未接続のためローカルモックを表示（${error}）`
                : `Showing local mock (${error})`}
            </Text>
          ) : null}
        </View>

        <View style={styles.tabBlock}>
          <CyberSlantedTabBarNative fill>
            <CyberSlantedTabNative
              label="SEASON"
              active={windowId === "season"}
              onPress={() => setWindowId("season")}
              compact
              fontWeight="700"
            />
            <CyberSlantedTabNative
              label="LAST 10"
              active={windowId === "last10"}
              onPress={() => setWindowId("last10")}
              compact
              fontWeight="700"
            />
          </CyberSlantedTabBarNative>
        </View>

        <View style={styles.tabBlock}>
          <CyberSlantedTabBarNative fill>
            <CyberSlantedTabNative
              label="ALL"
              active={conf === "all"}
              onPress={() => setConf("all")}
              compact
              fontWeight="700"
            />
            <CyberSlantedTabNative
              label="EAST"
              active={conf === "east"}
              onPress={() => setConf("east")}
              compact
              fontWeight="700"
            />
            <CyberSlantedTabNative
              label="WEST"
              active={conf === "west"}
              onPress={() => setConf("west")}
              compact
              fontWeight="700"
            />
          </CyberSlantedTabBarNative>
        </View>

        <View style={styles.metricBlock}>
          {NBA_LEAGUE_TEAM_STAT_METRIC_ROWS.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.metricRowLine}>
              {row.map((m) => (
                <View key={m.id} style={styles.metricCell}>
                  <MetricChip
                    active={metric === m.id}
                    label={m.short}
                    onPress={() => selectMetric(m.id)}
                  />
                </View>
              ))}
            </View>
          ))}
        </View>

        <Text style={styles.metricHint}>
          {isJa ? metricMeta.hintJa : metricMeta.hintEn}
        </Text>

        <View style={styles.sortMeta}>
          <Pressable
            onPress={toggleSortDir}
            hitSlop={6}
            style={styles.sortToggle}
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
            <Text style={styles.sortLabel}>
              Sort · {metricMeta.label}
              {isJa
                ? sortDir === "desc"
                  ? " · 降順"
                  : " · 昇順"
                : sortDir === "desc"
                  ? " · high→low"
                  : " · low→high"}
            </Text>
            <MaterialCommunityIcons
              name={sortDir === "desc" ? "arrow-down" : "arrow-up"}
              size={14}
              color="rgba(0,245,255,0.7)"
            />
          </Pressable>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.colRank]}>#</Text>
            <Text style={[styles.th, styles.colTeam]}>Team</Text>
            <Pressable
              onPress={toggleSortDir}
              hitSlop={4}
              style={[styles.thMetricBtn, styles.colMetric]}
              accessibilityRole="button"
              accessibilityLabel={
                isJa
                  ? `${metricMeta.short}の並べ替え方向`
                  : `Toggle sort on ${metricMeta.short}`
              }
            >
              <Text style={[styles.th, styles.thAccent]}>{metricMeta.short}</Text>
              <MaterialCommunityIcons
                name={sortDir === "desc" ? "arrow-down" : "arrow-up"}
                size={11}
                color={CYBER_TAB_CYAN}
                style={styles.thSortIcon}
              />
            </Pressable>
            <Text style={[styles.th, styles.colWl]}>W-L</Text>
            <Text style={[styles.th, styles.colNet]}>NET</Text>
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
                style={styles.row}
                accessibilityRole="button"
                accessibilityLabel={
                  isJa
                    ? `${nick(row)}の詳細を開く`
                    : `Open ${nick(row)} detail`
                }
              >
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
                <Text style={[styles.tdRank, { color: rankColorVal }]}>
                  {rank}
                </Text>
                <View style={styles.colTeamInner}>
                  <Text style={styles.tdTeam} numberOfLines={1}>
                    {nick(row)}
                  </Text>
                </View>
                <Text style={styles.tdMetric}>
                  {formatMetricValue(metric, primary)}
                </Text>
                <Text style={styles.tdWl}>
                  {row.wins}-{row.losses}
                </Text>
                <Text style={styles.tdNet}>
                  {formatMetricValue("netrtg", row.netrtg)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
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
  pad: { paddingHorizontal: 16, paddingTop: 4 },
  header: { marginBottom: 12, gap: 6 },
  asOf: {
    fontFamily: METRIC_FONT,
    color: "rgba(0,245,255,0.45)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    textAlign: "right",
  },
  sub: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.52)",
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  fetchWarn: {
    fontFamily: METRIC_FONT,
    color: "rgba(252,211,77,0.75)",
    fontSize: 10,
    lineHeight: 14,
  },
  tabBlock: { marginBottom: 10 },
  metricBlock: { gap: 6, marginBottom: 8 },
  metricRowLine: {
    flexDirection: "row",
    gap: 6,
  },
  metricCell: {
    flex: 1,
    minWidth: 0,
  },
  metricHint: {
    fontFamily: METRIC_FONT,
    color: "rgba(0,245,255,0.68)",
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
    minHeight: 34,
  },
  metricChip: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.28)",
    backgroundColor: "rgba(4,20,30,0.72)",
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 8,
    alignItems: "center",
  },
  metricChipActive: {
    borderColor: CYBER_TAB_CYAN,
    backgroundColor: CYBER_TAB_CYAN,
  },
  metricChipLabel: {
    fontFamily: METRIC_FONT,
    color: CYBER_TAB_CYAN,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    textAlign: "center",
    transform: [{ skewX: "-6deg" }],
  },
  metricChipLabelActive: {
    color: "#050508",
  },
  sortMeta: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sortToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
    paddingRight: 4,
  },
  sortLabel: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.42)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
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
  thAccent: { color: CYBER_TAB_CYAN, textAlign: "right" },
  thMetricBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
  },
  thSortIcon: { opacity: 0.85, marginTop: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,245,255,0.08)",
    overflow: "hidden",
  },
  colRank: { width: 28 },
  colTeam: { flex: 1.2 },
  colMetric: { width: 64, textAlign: "right" },
  colWl: { width: 52, textAlign: "right" },
  colNet: { width: 52, textAlign: "right" },
  tdRank: {
    width: 28,
    fontFamily: RANK_DISPLAY_FONT,
    fontSize: 15,
    letterSpacing: 0.5,
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-10deg" }],
  },
  colTeamInner: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
  },
  tdTeam: {
    ...MATCH_CARD_BRACKET_TEXT,
    flexShrink: 1,
    color: "rgba(255,255,255,0.92)",
    fontSize: 18,
    letterSpacing: MATCH_CARD_BRACKET_LETTER_SPACING_15,
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
  },
  tdMetric: {
    width: 64,
    textAlign: "right",
    fontFamily: OXANIUM_800,
    color: CYBER_TAB_CYAN,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  tdWl: {
    width: 52,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.48)",
    fontSize: 11,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  tdNet: {
    width: 52,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.48)",
    fontSize: 11,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
});
