/** Web `NbaSeasonAwardsViewPanel` の TeamAbbrBadge 相当 */
import { StyleSheet, Text, View } from "react-native";
import { nbaTeamIdFromBracketCode } from "../../../../../lib/nba-bracket-code";
import {
  contrastingInkOnHex,
  getTeamJerseyPrimaryColor,
  softenTeamUiColor,
} from "../../../../../lib/team-colors";
import { TEAM_SHORT } from "../../../../../lib/team-short";

const OX = "Oxanium_700Bold";

type Props = {
  /** 略称（LAL）または teamId（nba-lakers） */
  abbr?: string | null;
  teamId?: string | null;
};

export default function TeamAbbrBadgeNative({ abbr, teamId }: Props) {
  const resolvedAbbr = (
    abbr?.trim() ||
    (teamId ? TEAM_SHORT[teamId] : null) ||
    ""
  )
    .slice(0, 3)
    .toUpperCase();
  if (!resolvedAbbr) return null;

  const id =
    teamId?.startsWith("nba-")
      ? teamId
      : nbaTeamIdFromBracketCode(resolvedAbbr);
  const fill = id
    ? softenTeamUiColor(getTeamJerseyPrimaryColor("nba", id))
    : "#5B8CFF";
  const ink = contrastingInkOnHex(fill);

  return (
    <View style={[styles.badgeSkew, { backgroundColor: fill }]}>
      <View style={styles.badgeScan} pointerEvents="none">
        {Array.from({ length: 8 }, (_, i) => (
          <View key={i} style={[styles.badgeScanLine, { top: 1 + i * 3 }]} />
        ))}
      </View>
      <Text style={[styles.badgeText, { color: ink }]}>{resolvedAbbr}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeSkew: {
    minWidth: 38,
    height: 22,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    transform: [{ skewX: "-14deg" }],
  },
  badgeScan: {
    ...StyleSheet.absoluteFillObject,
  },
  badgeScanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  badgeText: {
    fontFamily: OX,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    transform: [{ skewX: "14deg" }],
  },
});
