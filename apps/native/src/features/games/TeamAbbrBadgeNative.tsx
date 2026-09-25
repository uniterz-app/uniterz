/** Web `TeamAbbrBadge` 相当 — OUTLINE GLOW（サイズ統一） */
import { StyleSheet, Text, View } from "react-native";
import { nbaTeamIdFromBracketCode } from "../../../../../lib/nba-bracket-code";
import {
  getTeamJerseyPrimaryColor,
  softenTeamUiColor,
} from "../../../../../lib/team-colors";
import { TEAM_SHORT } from "../../../../../lib/team-short";

const OX = "Oxanium_800ExtraBold";

type Props = {
  /** 略称（LAL）または teamId（nba-lakers） */
  abbr?: string | null;
  teamId?: string | null;
  /** 同系色対決時など、塗りを上書き */
  fillColor?: string | null;
  /** @deprecated サイズは統一。無視される */
  size?: "md" | "sm";
};

export default function TeamAbbrBadgeNative({
  abbr,
  teamId,
  fillColor,
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

  return (
    <View
      style={[
        styles.badgeSkew,
        {
          borderColor: fill,
          shadowColor: fill,
        },
      ]}
    >
      <View style={styles.badgeScan} pointerEvents="none">
        {Array.from({ length: 7 }, (_, i) => (
          <View
            key={i}
            style={[
              styles.badgeScanLine,
              {
                top: 1 + i * 3,
                backgroundColor: `${fill}33`,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.badgeText, { color: fill }]}>{resolvedAbbr}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeSkew: {
    width: 40,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "transparent",
    borderWidth: 1.5,
    transform: [{ skewX: "-14deg" }],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 6,
    elevation: 4,
  },
  badgeScan: {
    ...StyleSheet.absoluteFillObject,
  },
  badgeScanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
  },
  badgeText: {
    fontFamily: OX,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    /** 枠 -14deg + 文字 +8deg → 選手名と同じ -6deg */
    transform: [{ skewX: "8deg" }],
  },
});
