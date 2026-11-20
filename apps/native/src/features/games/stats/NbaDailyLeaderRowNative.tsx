/** TODAY の NBA リーダー 1 行（TODAY 画面と ASK で共用） */
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CYBER_TAB_CYAN } from "../../../ui/cyberSideMenuNative";
import { METRIC_FONT, RANK_DISPLAY_FONT } from "../../rankings/rankingsUiTheme";
import TeamAbbrBadgeNative from "../TeamAbbrBadgeNative";
import { inkAlpha, teamInk } from "../leagueHub/leagueHubUiNative";
import { formatNbaPlayerListName } from "../../../../../../lib/nba/formatNbaPlayerListName";
import {
  dailyLeaderSideStats,
  type DailyLeaderRow,
  type DailyLeaderStatKey,
} from "../../../../../../lib/nba/dailyLeaders/buildDailyLeaders";

function rankColor(rank: number): string {
  if (rank === 1) return "#FCD34D";
  if (rank <= 3) return CYBER_TAB_CYAN;
  return "rgba(255,255,255,0.45)";
}

type Props = {
  row: DailyLeaderRow;
  rank: number;
  stat: DailyLeaderStatKey;
  statLabel: string;
  liveLabel: string;
  onPress?: () => void;
};

export default function NbaDailyLeaderRowNative({ row: r, rank, stat, statLabel, liveLabel, onPress }: Props) {
  const ink = teamInk(r.teamId);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        { borderColor: inkAlpha(ink, 0.75), backgroundColor: inkAlpha(ink, 0.1) },
        pressed && styles.cardPressed,
      ]}
    >
      <Text style={[styles.rank, { color: rankColor(rank) }]}>{rank}</Text>
      <View style={styles.who}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {formatNbaPlayerListName(`${r.firstName} ${r.lastName}`, r.playerId)}
          </Text>
          <TeamAbbrBadgeNative teamId={r.teamId} />
        </View>
        <View style={styles.subRow}>
          <Text style={styles.sub}>
            {r.isHome ? "vs" : "@"} {r.oppAbbr}
          </Text>
          {r.stats ? (
            <Text style={styles.sideStats} numberOfLines={1}>
              {dailyLeaderSideStats(r.stats, stat).map((s) => (
                <Text key={s.key}>
                  {" · "}
                  <Text style={styles.sideValue}>{s.value}</Text> {s.label}
                </Text>
              ))}
            </Text>
          ) : null}
          {r.live ? <Text style={styles.live}>● {liveLabel}</Text> : null}
        </View>
      </View>
      <View style={styles.valueCol}>
        <Text style={[styles.value, rank === 1 && styles.valueTop]}>{r.value}</Text>
        <Text style={styles.valueLabel}>{statLabel}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 60,
    paddingLeft: 14,
    paddingRight: 14,
    paddingVertical: 8,
    overflow: "hidden",
    borderWidth: 1,
  },
  cardPressed: { opacity: 0.75 },
  rank: {
    width: 26,
    textAlign: "center",
    fontFamily: RANK_DISPLAY_FONT,
    fontSize: 28,
    lineHeight: 30,
    transform: [{ skewX: "-6deg" }],
  },
  who: { flex: 1, minWidth: 0, gap: 5 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: {
    flexShrink: 1,
    fontFamily: "Oxanium_600SemiBold",
    fontWeight: "600",
    fontSize: 15,
    letterSpacing: 0.4,
    color: "rgba(255,255,255,0.95)",
    textTransform: "uppercase",
    includeFontPadding: false,
    transform: [{ skewX: "-6deg" }],
  },
  subRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sub: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
  },
  sideStats: {
    flexShrink: 1,
    fontFamily: METRIC_FONT,
    fontSize: 10,
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.4)",
    transform: [{ skewX: "-6deg" }],
  },
  sideValue: { color: "rgba(255,255,255,0.85)" },
  live: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    letterSpacing: 1,
    color: "#f87171",
    transform: [{ skewX: "-6deg" }],
  },
  valueCol: { alignItems: "flex-end", minWidth: 44 },
  value: {
    fontFamily: "Oxanium_800ExtraBold",
    fontSize: 26,
    lineHeight: 28,
    color: "#fff",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  valueTop: { color: CYBER_TAB_CYAN },
  valueLabel: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.4)",
    transform: [{ skewX: "-6deg" }],
  },
});
