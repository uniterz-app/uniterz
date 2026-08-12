/** Web `NbaSeasonStandingsViewPanel` 相当（順位 | West | East、列区切りあり） */
import { StyleSheet, Text, View } from "react-native";
import JerseyMarkSvg from "../../JerseyMarkSvg";
import { NBA_STANDINGS_RANKS } from "../../../../../../../lib/nba/nbaConferenceTeams";
import { getNbaTeamNicknameById } from "../../../../../../../lib/nba-team-names";
import {
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
} from "../../../../../../../lib/team-colors";
import type {
  NbaSeasonStandingsPrediction,
  NbaStandingsRank,
} from "../../../../../../../lib/predict/nbaSeasonStandingsPredict";
import {
  MATCH_CARD_BRACKET_LETTER_SPACING_12,
  MATCH_CARD_BRACKET_TEXT,
} from "../../matchCardTypography";

type Props = {
  prediction: NbaSeasonStandingsPrediction;
  official?: NbaSeasonStandingsPrediction | null;
};

type Band = "straight" | "playin" | "out";

const OX = "Oxanium_700Bold";
const COL_DIVIDER = "rgba(255,255,255,0.1)";

function bandForRank(rank: NbaStandingsRank): Band {
  if (rank <= 6) return "straight";
  if (rank <= 10) return "playin";
  return "out";
}

function bandBar(band: Band): string {
  if (band === "straight") return "#00E5FF";
  if (band === "playin") return "#2DFF6E";
  return "rgba(255,255,255,0.18)";
}

function bandRankColor(band: Band): string {
  if (band === "straight") return "#fff";
  if (band === "playin") return "#2DFF6E";
  return "rgba(255,255,255,0.35)";
}

function TeamCell({
  teamId,
  officialTeamId,
}: {
  teamId: string | null | undefined;
  officialTeamId?: string | null;
}) {
  const hit =
    teamId && officialTeamId != null && officialTeamId !== ""
      ? officialTeamId === teamId
      : null;

  if (!teamId) {
    return <Text style={styles.dash}>—</Text>;
  }

  return (
    <View style={styles.teamCell}>
      <JerseyMarkSvg
        accent={getTeamJerseyPrimaryColor("nba", teamId)}
        accentEnd={getTeamJerseySecondaryColor("nba", teamId)}
        size={24}
      />
      <Text style={styles.viewTeam} numberOfLines={1}>
        {getNbaTeamNicknameById(teamId).toUpperCase()}
      </Text>
      {hit != null ? (
        <Text style={[styles.resultMark, hit ? styles.hit : styles.miss]}>{hit ? "HIT" : "MISS"}</Text>
      ) : null}
    </View>
  );
}

function CombinedRow({
  rank,
  westTeamId,
  eastTeamId,
  westOfficialTeamId,
  eastOfficialTeamId,
  isLast,
}: {
  rank: NbaStandingsRank;
  westTeamId: string | null | undefined;
  eastTeamId: string | null | undefined;
  westOfficialTeamId?: string | null;
  eastOfficialTeamId?: string | null;
  isLast: boolean;
}) {
  const band = bandForRank(rank);

  return (
    <View style={[styles.dataRow, !isLast ? styles.rowBorder : null]}>
      <View style={[styles.rankCol, styles.colDivider]}>
        <View style={[styles.bandBar, { backgroundColor: bandBar(band) }]} />
        <Text style={[styles.viewRank, { color: bandRankColor(band) }]}>{rank}</Text>
      </View>
      <View style={[styles.teamCol, styles.colDivider]}>
        <TeamCell teamId={westTeamId} officialTeamId={westOfficialTeamId} />
      </View>
      <View style={styles.teamCol}>
        <TeamCell teamId={eastTeamId} officialTeamId={eastOfficialTeamId} />
      </View>
    </View>
  );
}

export default function NbaSeasonStandingsViewPanelNative({ prediction, official = null }: Props) {
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.h2}>Your standing</Text>
        <Text style={styles.season}>{prediction.season}</Text>
      </View>

      <View style={styles.card}>
        <View style={[styles.headerRow, styles.rowBorder]}>
          <View style={[styles.rankCol, styles.colDivider]} />
          <View style={[styles.teamCol, styles.colDivider]}>
            <Text style={[styles.colLabel, styles.colLabelWest]}>WEST</Text>
          </View>
          <View style={styles.teamCol}>
            <Text style={[styles.colLabel, styles.colLabelEast]}>EAST</Text>
          </View>
        </View>

        {Array.from({ length: NBA_STANDINGS_RANKS }, (_, i) => {
          const rank = (i + 1) as NbaStandingsRank;
          return (
            <CombinedRow
              key={rank}
              rank={rank}
              westTeamId={prediction.west[rank]}
              eastTeamId={prediction.east[rank]}
              westOfficialTeamId={official?.west[rank]}
              eastOfficialTeamId={official?.east[rank]}
              isLast={rank === NBA_STANDINGS_RANKS}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", marginBottom: 12 },
  h2: {
    fontFamily: OX,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2.4,
    color: "#fff",
    textTransform: "uppercase",
  },
  season: {
    marginTop: 4,
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
  },
  card: {
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.2)",
    backgroundColor: "rgba(4,9,16,0.97)",
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  colDivider: {
    borderRightWidth: 1,
    borderRightColor: COL_DIVIDER,
  },
  rankCol: {
    width: 36,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    position: "relative",
  },
  teamCol: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: "center",
  },
  colLabel: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    textAlign: "center",
    textTransform: "uppercase",
  },
  colLabelWest: { color: "rgba(252,211,77,0.8)" },
  colLabelEast: { color: "rgba(103,232,249,0.8)" },
  bandBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3 },
  viewRank: {
    fontFamily: OX,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  teamCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
  },
  viewTeam: {
    ...MATCH_CARD_BRACKET_TEXT,
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    letterSpacing: MATCH_CARD_BRACKET_LETTER_SPACING_12,
    color: "#fff",
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
  },
  resultMark: { fontFamily: OX, fontSize: 7, fontWeight: "800", letterSpacing: 0.6, flexShrink: 0 },
  hit: { color: "rgba(45,255,110,0.85)" },
  miss: { color: "rgba(255,138,180,0.7)" },
  dash: { fontSize: 12, color: "rgba(255,255,255,0.25)" },
});
