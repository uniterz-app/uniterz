/** Web `PredictProBriefPanel` 相当 */
import { StyleSheet, Text, View } from "react-native";
import {
  briefEdgeDetail,
  briefLineText,
  type PredictProBrief,
  type ProBriefTeamCard,
} from "../../../../../../lib/predict/predictProBrief";
import { getMobileTeamName } from "../../../../../../lib/team-name-split-mobile";
import { NBA_TEAM_NAME_BY_ID } from "../../../../../../lib/nba-team-names";
import { getTeamJerseyPrimaryColor } from "../../../../../../lib/team-colors";
import type { GamesLanguage } from "../gamesI18n";

type Props = {
  brief: PredictProBrief;
  language: GamesLanguage;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
};

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return `rgba(34,211,238,${alpha})`;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function teamDisplayName(teamId: string, fallback: string): string {
  if (teamId.startsWith("nba-")) {
    const full = NBA_TEAM_NAME_BY_ID[teamId];
    if (full) return getMobileTeamName("nba", full);
  }
  return fallback;
}

function SectionLabel({
  children,
  tone,
}: {
  children: string;
  tone: "matchup" | "schedule" | "context";
}) {
  const color =
    tone === "matchup"
      ? "rgba(110,231,183,0.8)"
      : tone === "schedule"
        ? "rgba(253,230,138,0.8)"
        : "rgba(103,232,249,0.75)";
  return (
    <Text style={[styles.sectionLabel, { color }]}>{children}</Text>
  );
}

function TeamBriefCard({
  side,
  teamId,
  teamName,
  card,
  language,
}: {
  side: "home" | "away";
  teamId: string;
  teamName: string;
  card: ProBriefTeamCard;
  language: GamesLanguage;
}) {
  const lang = language === "ja" ? "ja" : "en";
  const primary = getTeamJerseyPrimaryColor("nba", teamId);
  const border = hexToRgba(primary, 0.55);
  const divider = hexToRgba(primary, 0.2);

  return (
    <View style={[styles.teamCard, { borderColor: border }]}>
      <View style={[styles.teamHeader, { borderBottomColor: divider }]}>
        <Text style={[styles.sideLabel, { color: hexToRgba(primary, 0.85) }]}>
          {side === "home" ? "HOME" : "AWAY"}
        </Text>
        <Text style={styles.teamName} numberOfLines={1}>
          {teamDisplayName(teamId, teamName).toUpperCase()}
        </Text>
      </View>

      <View style={styles.section}>
        <SectionLabel tone="matchup">Matchup</SectionLabel>
        {card.edges.length > 0 ? (
          card.edges.map((edge, i) => {
            const detail = briefEdgeDetail(edge, lang);
            return (
              <View key={`e-${i}`} style={styles.edgeItem}>
                <Text style={styles.edgeLabel}>{edge.label}</Text>
                {detail ? <Text style={styles.edgeDetail}>{detail}</Text> : null}
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyLine}>—</Text>
        )}
      </View>

      <View style={[styles.section, { borderTopColor: divider, borderTopWidth: 1 }]}>
        <SectionLabel tone="schedule">Schedule</SectionLabel>
        {card.schedule.length > 0 ? (
          card.schedule.map((item, i) => (
            <Text key={`s-${i}`} style={styles.scheduleLine}>
              {briefLineText(item, lang)}
            </Text>
          ))
        ) : (
          <Text style={styles.emptyLine}>—</Text>
        )}
      </View>

      <View style={[styles.section, { borderTopColor: divider, borderTopWidth: 1 }]}>
        <SectionLabel tone="context">Context</SectionLabel>
        {card.context.length > 0 ? (
          card.context.map((item, i) => (
            <Text key={`c-${i}`} style={styles.contextLine}>
              {briefLineText(item, lang)}
            </Text>
          ))
        ) : (
          <Text style={styles.emptyLine}>—</Text>
        )}
      </View>
    </View>
  );
}

export default function PredictProBriefPanelNative({
  brief,
  language,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
}: Props) {
  return (
    <View style={styles.shell}>
      <Text style={styles.kicker}>Pro Insight</Text>
      <View style={styles.grid}>
        <TeamBriefCard
          side="home"
          teamId={homeTeamId}
          teamName={homeTeamName}
          card={brief.home}
          language={language}
        />
        <TeamBriefCard
          side="away"
          teamId={awayTeamId}
          teamName={awayTeamName}
          card={brief.away}
          language={language}
        />
      </View>
    </View>
  );
}

const OXANIUM = "Oxanium_700Bold";

const styles = StyleSheet.create({
  shell: {
    borderTopWidth: 1,
    borderTopColor: "rgba(34,211,238,0.22)",
    backgroundColor: "rgba(5,10,18,0.72)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  kicker: {
    fontFamily: OXANIUM,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(165,243,252,0.9)",
    marginBottom: 6,
  },
  grid: {
    flexDirection: "row",
    gap: 6,
  },
  teamCard: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    backgroundColor: "rgba(6,11,18,0.92)",
    overflow: "hidden",
  },
  teamHeader: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  sideLabel: {
    fontFamily: OXANIUM,
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1.6,
  },
  teamName: {
    fontFamily: OXANIUM,
    fontSize: 11,
    fontWeight: "800",
    fontStyle: "italic",
    color: "#fff",
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  sectionLabel: {
    fontFamily: OXANIUM,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  edgeItem: {
    marginTop: 4,
  },
  edgeLabel: {
    fontFamily: OXANIUM,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.92)",
  },
  edgeDetail: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(255,255,255,0.45)",
  },
  scheduleLine: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "500",
    color: "rgba(255,251,235,0.85)",
  },
  contextLine: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "500",
    color: "rgba(236,254,255,0.8)",
  },
  emptyLine: {
    marginTop: 4,
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
  },
});
