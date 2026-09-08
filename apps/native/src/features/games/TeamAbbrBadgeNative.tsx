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
  /** 同系色対決時など、塗りを上書き */
  fillColor?: string | null;
  /** `sm` = アワード市場など密な行向け */
  size?: "md" | "sm";
};

export default function TeamAbbrBadgeNative({
  abbr,
  teamId,
  fillColor,
  size = "md",
}: Props) {
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
  const fill = fillColor
    ? softenTeamUiColor(fillColor)
    : id
      ? softenTeamUiColor(getTeamJerseyPrimaryColor("nba", id))
      : "#5B8CFF";
  const ink = contrastingInkOnHex(fill);
  const sm = size === "sm";

  return (
    <View
      style={[
        sm ? styles.badgeSkewSm : styles.badgeSkew,
        { backgroundColor: fill },
      ]}
    >
      <View style={styles.badgeScan} pointerEvents="none">
        {Array.from({ length: sm ? 6 : 8 }, (_, i) => (
          <View
            key={i}
            style={[styles.badgeScanLine, { top: 1 + i * (sm ? 2.5 : 3) }]}
          />
        ))}
      </View>
      <Text
        style={[
          sm ? styles.badgeTextSm : styles.badgeText,
          { color: ink },
        ]}
      >
        {resolvedAbbr}
      </Text>
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
  badgeSkewSm: {
    minWidth: 28,
    height: 16,
    paddingHorizontal: 5,
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
  badgeTextSm: {
    fontFamily: OX,
    fontSize: 7,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    transform: [{ skewX: "14deg" }],
  },
});
