/** Web `NbaSeasonStandingsViewPanel` 相当（提出済み順位 YOUR STANDING + 帯サイドライン） */
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import JerseyMarkSvg from "../../JerseyMarkSvg";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../../../rankings/CyberSlantedTabNative";
import type { NbaConferenceId } from "../../../../../../../lib/nba/nbaConferenceTeams";
import { NBA_STANDINGS_RANKS } from "../../../../../../../lib/nba/nbaConferenceTeams";
import { NBA_TEAM_NAME_BY_ID } from "../../../../../../../lib/nba-team-names";
import { TEAM_SHORT } from "../../../../../../../lib/team-short";
import {
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
} from "../../../../../../../lib/team-colors";
import type {
  NbaConferenceStandingsPicks,
  NbaSeasonStandingsPrediction,
  NbaStandingsRank,
} from "../../../../../../../lib/predict/nbaSeasonStandingsPredict";

type Props = {
  prediction: NbaSeasonStandingsPrediction;
  official?: NbaSeasonStandingsPrediction | null;
};

type Band = "straight" | "playin" | "out";

const OX = "Oxanium_700Bold";

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

function fullName(teamId: string): string {
  const full = NBA_TEAM_NAME_BY_ID[teamId];
  if (full) return full.toUpperCase();
  return (TEAM_SHORT[teamId] ?? teamId).toUpperCase();
}

function ViewRow({
  rank,
  teamId,
  officialTeamId,
  isLast,
}: {
  rank: NbaStandingsRank;
  teamId: string | null | undefined;
  officialTeamId?: string | null;
  isLast: boolean;
}) {
  const band = bandForRank(rank);
  const hit =
    teamId && officialTeamId != null && officialTeamId !== ""
      ? officialTeamId === teamId
      : null;

  return (
    <View style={[styles.viewRow, !isLast ? styles.viewRowBorder : null, !teamId ? { opacity: 0.5 } : null]}>
      <View style={[styles.bandBar, { backgroundColor: bandBar(band) }]} />
      <Text style={[styles.viewRank, { color: bandRankColor(band) }]}>{rank}</Text>
      {teamId ? (
        <>
          <JerseyMarkSvg
            accent={getTeamJerseyPrimaryColor("nba", teamId)}
            accentEnd={getTeamJerseySecondaryColor("nba", teamId)}
            size={24}
          />
          <Text style={styles.viewTeam} numberOfLines={1}>
            {fullName(teamId)}
          </Text>
          {hit != null ? (
            <Text style={[styles.resultMark, hit ? styles.hit : styles.miss]}>{hit ? "HIT" : "MISS"}</Text>
          ) : null}
        </>
      ) : (
        <Text style={styles.dash}>—</Text>
      )}
    </View>
  );
}

function ConferenceList({
  picks,
  officialPicks,
}: {
  picks: NbaConferenceStandingsPicks;
  officialPicks?: NbaConferenceStandingsPicks | null;
}) {
  return (
    <View style={styles.list}>
      {Array.from({ length: NBA_STANDINGS_RANKS }, (_, i) => {
        const rank = (i + 1) as NbaStandingsRank;
        return (
          <ViewRow
            key={rank}
            rank={rank}
            teamId={picks[rank]}
            officialTeamId={officialPicks?.[rank]}
            isLast={rank === NBA_STANDINGS_RANKS}
          />
        );
      })}
    </View>
  );
}

export default function NbaSeasonStandingsViewPanelNative({ prediction, official = null }: Props) {
  const [conference, setConference] = useState<NbaConferenceId>("east");
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.h2}>Your standing</Text>
        <Text style={styles.season}>{prediction.season}</Text>
      </View>

      <View style={{ marginBottom: 10 }}>
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

      <ConferenceList
        picks={conference === "east" ? prediction.east : prediction.west}
        officialPicks={official ? (conference === "east" ? official.east : official.west) : null}
      />
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
  list: {
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.2)",
    backgroundColor: "rgba(4,9,16,0.97)",
    overflow: "hidden",
  },
  viewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 5,
    position: "relative",
  },
  viewRowBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  bandBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3 },
  viewRank: { width: 20, fontFamily: OX, fontSize: 11, fontWeight: "900", fontVariant: ["tabular-nums"] },
  viewTeam: {
    flex: 1,
    minWidth: 0,
    fontFamily: OX,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: "#fff",
    textTransform: "uppercase",
  },
  resultMark: { fontFamily: OX, fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  hit: { color: "rgba(45,255,110,0.85)" },
  miss: { color: "rgba(255,138,180,0.7)" },
  dash: { flex: 1, fontSize: 10, color: "rgba(255,255,255,0.25)" },
});
