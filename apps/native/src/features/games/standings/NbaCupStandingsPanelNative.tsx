/**
 * NBA Cup グループ順位 — STANDINGS と同じ表殻。
 * データ: `/api/nba/cup-standings`（Firestore スナップショット）。
 */
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
import {
  formatStandingsWl,
  formatStandingsWinPct,
} from "../../../../../../lib/nba/nbaConferenceStandings";
import {
  formatCupDiff,
  formatCupGb,
} from "../../../../../../lib/nba/cupStandings/buildNbaCupStandingsFromGames";
import { useNbaCupStandings } from "../../../../../../lib/nba/cupStandings/useNbaCupStandings";
import type { NbaCupStandingsRow } from "../../../../../../lib/nba/cupStandings/nbaCupStandingsTypes";
import { notifyBackEdgeScroll } from "../../profile/backEdgeScrollNative";
import { nbaDailyStatsUpdateFootnote } from "../../../../../../lib/nba/nbaStatsUpdateSchedule";
import { getUniterzApiBaseUrl } from "../submitPredictionApi";
import { nbaLeagueStatsChrome } from "../stats/nbaStatsUiCopy";
import { CYBER_TAB_CYAN } from "../../../ui/cyberSideMenuNative";
import { METRIC_FONT, RANK_DISPLAY_FONT } from "../../rankings/rankingsUiTheme";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";
import {
  StandingsMetricColNative,
  StandingsSectionHeadNative,
  standingsTeamWash,
} from "./nbaStandingsTableSharedNative";

type Props = {
  language: string;
  onSelectTeam?: (teamId: string) => void;
};

const COL = {
  rank: 26,
  team: 108,
  wl: 66,
  pct: 72,
  diff: 64,
  gb: 52,
} as const;
const TABLE_PAD_X = 8;
const TABLE_W =
  COL.rank +
  COL.team +
  COL.wl +
  COL.pct +
  COL.diff +
  COL.gb +
  TABLE_PAD_X * 2;

function nick(row: NbaCupStandingsRow): string {
  return getMobileTeamName("nba", row.teamName).toUpperCase();
}

function rankColor(rank: number): string {
  if (rank === 1) return "rgba(110,231,183,0.95)";
  if (rank === 2) return "rgba(252,211,77,0.92)";
  return "rgba(252,165,165,0.75)";
}

export default function NbaCupStandingsPanelNative({
  language,
  onSelectTeam,
}: Props) {
  const chrome = nbaLeagueStatsChrome(language);
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const { board, loading, error } = useNbaCupStandings({
    apiBaseUrl: getUniterzApiBaseUrl(),
  });
  const updateFootnote = nbaDailyStatsUpdateFootnote(chrome.lang);
  const hasRows = board.groups.some((g) => g.rows.length > 0);

  return (
    <View style={styles.root} accessibilityLabel="NBA Cup standings">
      {loading ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color={CYBER_TAB_CYAN} />
        </View>
      ) : null}
      <View style={styles.top}>
        {updateFootnote ? <Text style={styles.asOf}>{updateFootnote}</Text> : null}
        {error && !hasRows ? (
          <Text style={styles.errorNote}>
            {language === "ja"
              ? "順位データを取得できません（API 未公開の可能性）"
              : "Could not load cup standings (API may be undeployed)"}
          </Text>
        ) : null}
      </View>
      <ScrollView
        style={styles.tableScroll}
        contentContainerStyle={{ paddingBottom: bottomContentReserveY }}
        showsVerticalScrollIndicator={false}
        onScroll={notifyBackEdgeScroll}
        scrollEventThrottle={16}
      >
        {board.groups.map((group, sectionIndex) => (
          <View
            key={group.id}
            style={sectionIndex > 0 ? styles.sectionSpaced : undefined}
          >
            <StandingsSectionHeadNative label={group.label} />
            <CupGroupTable
              rows={group.rows}
              chrome={chrome}
              onSelectTeam={onSelectTeam}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function CupGroupTable({
  rows,
  chrome,
  onSelectTeam,
}: {
  rows: NbaCupStandingsRow[];
  chrome: ReturnType<typeof nbaLeagueStatsChrome>;
  onSelectTeam?: (teamId: string) => void;
}) {
  return (
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
          <Text style={[styles.th, styles.colTeam]}>{chrome.teamCol}</Text>
          <StandingsMetricColNative width={COL.wl}>
            <Text style={[styles.th, styles.thMetric]}>
              {chrome.standingsWl}
            </Text>
          </StandingsMetricColNative>
          <StandingsMetricColNative width={COL.pct}>
            <Text style={[styles.th, styles.thPct]}>W%</Text>
          </StandingsMetricColNative>
          <StandingsMetricColNative width={COL.diff}>
            <Text style={[styles.th, styles.thMetric]}>DIFF</Text>
          </StandingsMetricColNative>
          <StandingsMetricColNative width={COL.gb}>
            <Text style={[styles.th, styles.thMetric]}>GB</Text>
          </StandingsMetricColNative>
        </View>
        {rows.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>—</Text>
          </View>
        ) : (
          rows.map((row) => {
            const primary = getTeamJerseyPrimaryColor("nba", row.teamId);
            return (
              <Pressable
                key={row.teamId}
                onPress={() => onSelectTeam?.(row.teamId)}
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
                        standingsTeamWash(primary, 0.18),
                        standingsTeamWash(primary, 0.08),
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
                      style={[styles.tdRank, { color: rankColor(row.rank) }]}
                    >
                      {row.rank}
                    </Text>
                    <Text style={styles.tdTeam} numberOfLines={1}>
                      {nick(row)}
                    </Text>
                    <StandingsMetricColNative width={COL.wl}>
                      <Text style={styles.tdWl}>
                        {formatStandingsWl({
                          wins: row.wins,
                          losses: row.losses,
                        })}
                      </Text>
                    </StandingsMetricColNative>
                    <StandingsMetricColNative width={COL.pct}>
                      <Text style={styles.tdPct}>
                        {formatStandingsWinPct(row.winPct)}
                      </Text>
                    </StandingsMetricColNative>
                    <StandingsMetricColNative width={COL.diff}>
                      <Text
                        style={[
                          styles.tdDiff,
                          row.diff > 0
                            ? styles.tdDiffPos
                            : row.diff < 0
                              ? styles.tdDiffNeg
                              : null,
                        ]}
                      >
                        {formatCupDiff(row.diff)}
                      </Text>
                    </StandingsMetricColNative>
                    <StandingsMetricColNative width={COL.gb}>
                      <Text style={styles.tdSplit}>{formatCupGb(row.gb)}</Text>
                    </StandingsMetricColNative>
                  </>
                )}
              </Pressable>
            );
          })
        )}
      </View>
    </ScrollView>
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
  errorNote: {
    fontFamily: METRIC_FONT,
    color: "rgba(252,165,165,0.9)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    textAlign: "right",
  },
  tableScroll: { flex: 1 },
  sectionSpaced: { marginTop: 20 },
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
  emptyRow: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontFamily: RANK_DISPLAY_FONT,
    color: "rgba(255,255,255,0.28)",
    fontSize: 16,
    letterSpacing: 2,
  },
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
    width: COL.team,
    fontFamily: "Oxanium_600SemiBold",
    fontWeight: "600",
    color: "rgba(255,255,255,0.94)",
    fontSize: 15,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    includeFontPadding: false,
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
  tdDiff: {
    width: "100%",
    textAlign: "center",
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  tdDiffPos: { color: "rgba(110,231,183,0.95)" },
  tdDiffNeg: { color: "rgba(252,165,165,0.9)" },
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
