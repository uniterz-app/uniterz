/** Web `LiveGameStatsPanel` 相当 */
import { StyleSheet, Text, View } from "react-native";
import type { LiveGameStatsReport } from "../../../../../../lib/games/liveGameStats";
import { getTeamPrimaryColor } from "../../../../../../lib/team-colors";
import { LiveMarkPill } from "../LiveMarkPill";
import {
  liveMarkPillCyberBase,
  liveMarkTextCyberBase,
} from "../../../ui/liveMarkCyberStyles";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import LiveGameTeamStatsPanelNative from "./LiveGameTeamStatsPanelNative";
import LiveGameBoxScorePanelNative from "./LiveGameBoxScorePanelNative";
import LiveGameLineScorePanelNative from "./LiveGameLineScorePanelNative";
import LiveGameLeadersPanelNative from "./LiveGameLeadersPanelNative";
import LiveGameSectionTitleNative from "./LiveGameSectionTitleNative";

type Props = {
  report: LiveGameStatsReport;
  language?: "ja" | "en";
  /** オーバーレイで MatchCard がスコアを出すとき、スコアヘッダーを省略 */
  omitScoreHeader?: boolean;
};

export default function LiveGameStatsPanelNative({
  report,
  language = "ja",
  omitScoreHeader = false,
}: Props) {
  const homeColor =
    getTeamPrimaryColor("nba", report.home.teamId) ?? "#5cf0b5";
  const awayColor =
    getTeamPrimaryColor("nba", report.away.teamId) ?? "#b388ff";
  const isLive = report.phase === "live";
  const isEn = language === "en";
  const periodText =
    !isLive && /^final$/i.test(report.periodLabel.trim())
      ? ""
      : report.periodLabel;
  const liveStatusText = [periodText, report.clock ?? ""]
    .filter(Boolean)
    .join(" ");
  const finalLabel = isEn ? "Final" : "試合終了";
  const hasLineScore = Boolean(report.lineScore?.periods.length);

  return (
    <View style={styles.root}>
      {omitScoreHeader ? (
        hasLineScore ? (
          <View style={styles.section}>
            <LiveGameSectionTitleNative title="Score by Quarter" />
            <LiveGameLineScorePanelNative report={report} />
          </View>
        ) : null
      ) : (
        <View style={styles.summaryCard}>
          <View style={styles.headerGrid}>
            <Text
              style={[styles.abbr, styles.abbrRight, { color: homeColor }]}
              numberOfLines={1}
            >
              {report.home.abbr}
            </Text>
            <View style={styles.scoreCol}>
              {isLive ? (
                <LiveMarkPill
                  pillStyle={styles.livePill}
                  textStyle={styles.livePillText}
                />
              ) : null}
              <View style={styles.scoreRow}>
                <Text style={styles.scoreNum}>{report.home.score}</Text>
                <Text style={[styles.scoreNum, styles.scoreDash]}>–</Text>
                <Text style={styles.scoreNum}>{report.away.score}</Text>
              </View>
              {isLive ? (
                liveStatusText ? (
                  <Text style={styles.status}>{liveStatusText}</Text>
                ) : null
              ) : (
                <Text style={styles.status}>
                  {finalLabel}
                  {periodText ? ` (${periodText})` : ""}
                </Text>
              )}
            </View>
            <Text
              style={[styles.abbr, styles.abbrLeft, { color: awayColor }]}
              numberOfLines={1}
            >
              {report.away.abbr}
            </Text>
          </View>

          {hasLineScore ? (
            <View style={styles.lineScoreWrap}>
              <LiveGameLineScorePanelNative report={report} embedded />
            </View>
          ) : null}
        </View>
      )}

      <View style={styles.section}>
        <LiveGameSectionTitleNative title="Team Stats" />
        <LiveGameTeamStatsPanelNative report={report} />
      </View>

      <View style={styles.section}>
        <LiveGameSectionTitleNative title="Game Leaders" />
        <LiveGameLeadersPanelNative report={report} />
      </View>

      <View style={styles.section}>
        <LiveGameSectionTitleNative title="Box Score" />
        <LiveGameBoxScorePanelNative report={report} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 16 },
  section: { gap: 10 },
  summaryCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  headerGrid: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  abbr: {
    flex: 1,
    minWidth: 0,
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  abbrRight: { textAlign: "right" },
  abbrLeft: { textAlign: "left" },
  scoreCol: {
    alignItems: "center",
    gap: 4,
  },
  livePill: {
    ...liveMarkPillCyberBase,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  livePillText: {
    ...liveMarkTextCyberBase,
    fontSize: 8,
    letterSpacing: 1,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  scoreNum: {
    fontFamily: METRIC_FONT,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    color: "#fff",
    transform: [{ skewX: "-6deg" }],
  },
  scoreDash: {
    opacity: 0.7,
  },
  status: {
    fontFamily: METRIC_FONT,
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  lineScoreWrap: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
});
