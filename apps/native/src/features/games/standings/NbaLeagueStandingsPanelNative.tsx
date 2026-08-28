/** Web `NbaLeagueStandingsPanel` 相当 — EAST / WEST カンファレンス順位表 */
import { useState, type ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getMobileTeamName } from "../../../../../../lib/team-name-split-mobile";
import { getTeamJerseyPrimaryColor } from "../../../../../../lib/team-colors";
import { formatStreakLabel } from "../../../../../../lib/predict/nbaTeamDetailPreviewMocks";
import { teamStreakBadgeTheme } from "../../../../../../lib/predict/nbaTeamDetailForm";
import { useNbaConferenceStandings } from "../../../../../../lib/nba/useNbaConferenceStandings";
import {
  formatStandingsWl,
  formatStandingsWinPct,
  type NbaConferenceStandingsRow,
} from "../../../../../../lib/nba/nbaConferenceStandings";
import type { NbaConferenceId } from "../../../../../../lib/nba/nbaConferenceTeams";
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
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";

type Props = {
  language: "ja" | "en";
  onSelectTeam: (teamId: string) => void;
};

const COL = {
  rank: 26,
  team: 108,
  wl: 66,
  pct: 72,
  strk: 68,
  split: 62,
  homeAway: 78,
} as const;
const TABLE_PAD_X = 8;
const TABLE_W =
  COL.rank +
  COL.team +
  COL.wl +
  COL.pct +
  COL.strk +
  COL.split +
  COL.homeAway * 2 +
  TABLE_PAD_X * 2;

function nick(row: NbaConferenceStandingsRow): string {
  return getMobileTeamName("nba", row.teamName).toUpperCase();
}

function rankColor(rank: number): string {
  if (rank <= 6) return "rgba(110,231,183,0.95)";
  if (rank <= 10) return "rgba(252,211,77,0.92)";
  return "rgba(252,165,165,0.75)";
}

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "").trim();
  if (raw.length !== 6) return `rgba(0,245,255,${alpha})`;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function ColDash() {
  return (
    <View pointerEvents="none" style={styles.vDash}>
      {DASH_TICKS.map((i) => (
        <View key={i} style={styles.vDashTick} />
      ))}
    </View>
  );
}

function MetricCol({
  width,
  children,
}: {
  width: number;
  children: ReactNode;
}) {
  return (
    <View style={[styles.metricCol, { width }]}>
      <ColDash />
      {children}
    </View>
  );
}

const DASH_TICKS = [0, 1, 2, 3, 4, 5, 6, 7];

export default function NbaLeagueStandingsPanelNative({
  language,
  onSelectTeam,
}: Props) {
  const isJa = language === "ja";
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const { board, asOfLabel, loading } = useNbaConferenceStandings({
    apiBaseUrl: getUniterzApiBaseUrl(),
  });
  const [conference, setConference] = useState<NbaConferenceId>("east");
  const rows = conference === "east" ? board.east : board.west;

  return (
    <View style={styles.root}>
      {loading ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color={CYBER_TAB_CYAN} />
        </View>
      ) : null}
      <View style={styles.top}>
        <Text style={styles.asOf}>{asOfLabel}</Text>
        <CyberSlantedTabBarNative fill>
          <CyberSlantedTabNative
            label="EAST"
            active={conference === "east"}
            onPress={() => setConference("east")}
            compact
            fontWeight="700"
          />
          <CyberSlantedTabNative
            label="WEST"
            active={conference === "west"}
            onPress={() => setConference("west")}
            compact
            fontWeight="700"
          />
        </CyberSlantedTabBarNative>
      </View>
      <ScrollView
        style={styles.tableScroll}
        contentContainerStyle={{ paddingBottom: bottomContentReserveY }}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          nestedScrollEnabled
          directionalLockEnabled
          bounces={false}
          showsHorizontalScrollIndicator
          contentContainerStyle={styles.hScrollContent}
        >
          <View style={styles.table}>
            <View style={styles.head}>
              <Text style={[styles.th, styles.colRank]}>#</Text>
              <Text style={[styles.th, styles.colTeam]}>
                {isJa ? "チーム" : "Team"}
              </Text>
              <MetricCol width={COL.wl}>
                <Text style={[styles.th, styles.thMetric]}>
                  {isJa ? "成績" : "W-L"}
                </Text>
              </MetricCol>
              <MetricCol width={COL.pct}>
                <Text style={[styles.th, styles.thPct]}>W%</Text>
              </MetricCol>
              <MetricCol width={COL.strk}>
                <Text style={[styles.th, styles.thMetric]}>
                  {isJa ? "連勝" : "STRK"}
                </Text>
              </MetricCol>
              <MetricCol width={COL.split}>
                <Text style={[styles.th, styles.thMetric]}>L10</Text>
              </MetricCol>
              <MetricCol width={COL.homeAway}>
                <Text style={[styles.th, styles.thMetric]}>HOME</Text>
              </MetricCol>
              <MetricCol width={COL.homeAway}>
                <Text style={[styles.th, styles.thMetric]}>AWAY</Text>
              </MetricCol>
            </View>
            {rows.map((row) => {
              const primary = getTeamJerseyPrimaryColor("nba", row.teamId);
              const streakTheme = teamStreakBadgeTheme(row.streak);
              return (
                <View key={row.teamId}>
                  {row.rank === 7 ? (
                    <View style={[styles.sep, styles.sepPlayoff]} />
                  ) : null}
                  {row.rank === 11 ? (
                    <View style={[styles.sep, styles.sepPlayin]} />
                  ) : null}
                  <Pressable
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
                            hexToRgba(primary, 0.18),
                            hexToRgba(primary, 0.08),
                            "rgba(0,0,0,0)",
                          ]}
                          locations={[0, 0.36, 1]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          pointerEvents="none"
                          style={StyleSheet.absoluteFillObject}
                        />
                        {pressed ? (
                          <View
                            pointerEvents="none"
                            style={styles.rowPressedWash}
                          />
                        ) : null}
                        <Text
                          style={[
                            styles.tdRank,
                            { color: rankColor(row.rank) },
                          ]}
                        >
                          {row.rank}
                        </Text>
                        <Text style={styles.tdTeam} numberOfLines={1}>
                          {nick(row)}
                        </Text>
                        <MetricCol width={COL.wl}>
                          <Text style={styles.tdWl}>
                            {formatStandingsWl({
                              wins: row.wins,
                              losses: row.losses,
                            })}
                          </Text>
                        </MetricCol>
                        <MetricCol width={COL.pct}>
                          <Text style={styles.tdPct}>
                            {formatStandingsWinPct(row.winPct)}
                          </Text>
                        </MetricCol>
                        <MetricCol width={COL.strk}>
                          <Text
                            style={[
                              styles.tdStrk,
                              { color: streakTheme.headlineColor },
                            ]}
                          >
                            {formatStreakLabel(row.streak)}
                          </Text>
                        </MetricCol>
                        <MetricCol width={COL.split}>
                          <Text style={styles.tdSplit}>
                            {formatStandingsWl(row.last10)}
                          </Text>
                        </MetricCol>
                        <MetricCol width={COL.homeAway}>
                          <Text style={styles.tdSplit}>
                            {formatStandingsWl(row.home)}
                          </Text>
                        </MetricCol>
                        <MetricCol width={COL.homeAway}>
                          <Text style={styles.tdSplit}>
                            {formatStandingsWl(row.away)}
                          </Text>
                        </MetricCol>
                      </>
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
        </ScrollView>
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
  tableScroll: { flex: 1 },
  hScrollContent: {
    paddingHorizontal: 8,
  },
  table: {
    width: TABLE_W,
    overflow: "hidden",
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,245,255,0.12)",
    backgroundColor: "rgba(4,16,24,0.35)",
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: TABLE_PAD_X,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,245,255,0.12)",
    backgroundColor: "rgba(0,245,255,0.06)",
  },
  th: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  colRank: { width: COL.rank },
  colTeam: { width: COL.team },
  metricCol: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  vDash: {
    position: "absolute",
    left: 0,
    top: 5,
    bottom: 5,
    width: 1,
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  vDashTick: {
    width: 1,
    height: 3,
    backgroundColor: "rgba(0,245,255,0.28)",
  },
  thMetric: {
    width: "100%",
    textAlign: "center",
    transform: [{ skewX: "-6deg" }],
  },
  thPct: {
    width: "100%",
    textAlign: "center",
    color: CYBER_TAB_CYAN,
    transform: [{ skewX: "-6deg" }],
  },
  sep: { height: StyleSheet.hairlineWidth, width: "100%" },
  sepPlayoff: { backgroundColor: "rgba(52,211,153,0.55)" },
  sepPlayin: { backgroundColor: "rgba(251,191,36,0.5)" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: TABLE_PAD_X,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,245,255,0.08)",
    overflow: "hidden",
  },
  rowPressed: { transform: [{ scale: 0.99 }] },
  rowPressedWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,245,255,0.16)",
  },
  tdRank: {
    width: COL.rank,
    fontFamily: RANK_DISPLAY_FONT,
    fontSize: 18,
    letterSpacing: 0.5,
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-10deg" }],
  },
  tdTeam: {
    ...MATCH_CARD_BRACKET_TEXT,
    width: COL.team,
    color: "rgba(255,255,255,0.94)",
    fontSize: 18,
    letterSpacing: MATCH_CARD_BRACKET_LETTER_SPACING_15,
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
    paddingRight: 8,
  },
  tdWl: {
    width: "100%",
    textAlign: "center",
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.88)",
    fontSize: 15,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  tdPct: {
    width: "100%",
    textAlign: "center",
    fontFamily: METRIC_FONT,
    color: CYBER_TAB_CYAN,
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  tdStrk: {
    width: "100%",
    textAlign: "center",
    fontFamily: METRIC_FONT,
    fontSize: 15,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  tdSplit: {
    width: "100%",
    textAlign: "center",
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
});
