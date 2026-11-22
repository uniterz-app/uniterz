/** Buzz / 確定のチーム絞り。ALL + 出てくる略称。お気に入りは先頭 */
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import TeamAbbrBadgeNative from "../../TeamAbbrBadgeNative";
import { nbaTeamIdFromBracketCode } from "../../../../../../../lib/nba-bracket-code";
import {
  getTeamAbbrBadgeColor,
  teamColorRgba,
} from "../../../../../../../lib/team-colors";

type Props = {
  abbrs: readonly string[];
  selected: string | null;
  favoriteAbbr?: string | null;
  onSelect: (abbr: string | null) => void;
};

const OX = "Oxanium_700Bold";
const CYAN = "#00F5FF";

export default function BuzzTeamFilterRowNative({
  abbrs,
  selected,
  favoriteAbbr = null,
  onSelect,
}: Props) {
  if (abbrs.length < 2) return null;
  const fav = favoriteAbbr?.toUpperCase() ?? null;

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <Pressable
        onPress={() => onSelect(null)}
        accessibilityRole="button"
        accessibilityState={{ selected: selected == null }}
        accessibilityLabel="すべてのチーム"
        style={({ pressed }) => [
          styles.chip,
          selected == null ? styles.chipOn : styles.chipOff,
          pressed ? styles.pressed : null,
        ]}
      >
        <Text style={selected == null ? styles.allOn : styles.allOff}>ALL</Text>
      </Pressable>
      {abbrs.map((abbr) => {
        const on = selected === abbr;
        const isFav = fav === abbr;
        const teamId = nbaTeamIdFromBracketCode(abbr);
        const tint = teamId ? getTeamAbbrBadgeColor(teamId) : CYAN;
        return (
          <Pressable
            key={abbr}
            onPress={() => onSelect(on ? null : abbr)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${abbr}${isFav ? " お気に入り" : ""}`}
            style={({ pressed }) => [
              styles.chip,
              on
                ? {
                    borderColor: CYAN,
                    backgroundColor: "rgba(0,245,255,0.16)",
                  }
                : {
                    borderColor: teamColorRgba(tint, 0.45),
                    backgroundColor: teamColorRgba(tint, 0.08),
                  },
              pressed ? styles.pressed : null,
            ]}
          >
            {isFav ? <View style={styles.favDot} /> : null}
            <TeamAbbrBadgeNative abbr={abbr} teamId={teamId} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 12,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 34,
  },
  chipOn: {
    borderColor: CYAN,
    backgroundColor: CYAN,
  },
  chipOff: {
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  pressed: {
    opacity: 0.72,
  },
  allOn: {
    fontFamily: OX,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#050508",
  },
  allOff: {
    fontFamily: OX,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.7)",
  },
  favDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#F5C518",
    marginRight: 2,
  },
});
