/**
 * Web `NbaLeagueStatsSeasonNav` 相当 — ◀ 25-26 ▶
 */
import { Pressable, StyleSheet, Text, View } from "react-native";
import { nbaLeagueStatsSeasonNavState } from "../../../../../lib/nba/nbaLeagueStatsSeasonNav";

const CYAN = "#00F5FF";

type Props = {
  seasonKey: string;
  onSeasonChange: (seasonKey: string) => void;
};

export default function NbaLeagueStatsSeasonNavNative({
  seasonKey,
  onSeasonChange,
}: Props) {
  const nav = nbaLeagueStatsSeasonNavState(seasonKey);

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Older season"
        disabled={!nav.canGoOlder}
        onPress={() => {
          if (nav.olderKey) onSeasonChange(nav.olderKey);
        }}
        style={[styles.btn, !nav.canGoOlder && styles.btnDisabled]}
      >
        <Text style={[styles.chev, !nav.canGoOlder && styles.chevDisabled]}>
          ◀
        </Text>
      </Pressable>
      <Text style={styles.label}>{nav.label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Newer season"
        disabled={!nav.canGoNewer}
        onPress={() => {
          if (nav.newerKey) onSeasonChange(nav.newerKey);
        }}
        style={[styles.btn, !nav.canGoNewer && styles.btnDisabled]}
      >
        <Text style={[styles.chev, !nav.canGoNewer && styles.chevDisabled]}>
          ▶
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btn: {
    width: 28,
    height: 28,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: {
    borderColor: "rgba(255,255,255,0.15)",
    opacity: 0.4,
  },
  chev: {
    color: CYAN,
    fontSize: 11,
    fontWeight: "800",
  },
  chevDisabled: {
    color: "rgba(255,255,255,0.35)",
  },
  label: {
    minWidth: 72,
    textAlign: "center",
    color: CYAN,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});
