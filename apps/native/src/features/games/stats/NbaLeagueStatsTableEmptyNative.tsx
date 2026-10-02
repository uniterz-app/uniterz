/** Web `NbaLeagueStatsTableEmpty` 相当 */
import { StyleSheet, Text, View } from "react-native";
import type { LeagueStatsEmptyStateCopy } from "../../../../../../lib/nba/leagueStatsEmptyState";
import { CYBER_TAB_CYAN } from "../../rankings/CyberSlantedTabNative";

type Props = {
  copy: LeagueStatsEmptyStateCopy;
};

export default function NbaLeagueStatsTableEmptyNative({ copy }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.body}>{copy.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 192,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.14)",
    backgroundColor: "rgba(4,16,24,0.45)",
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    fontFamily: "Oxanium_800ExtraBold",
    fontSize: 11,
    letterSpacing: 2,
    color: `${CYBER_TAB_CYAN}BF`,
    textTransform: "uppercase",
  },
  body: {
    marginTop: 12,
    maxWidth: 280,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
  },
});
