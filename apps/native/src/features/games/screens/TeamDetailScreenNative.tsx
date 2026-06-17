import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import type { GamesStackParamList } from "../../../navigation/types";
import { colors, radius, spacing } from "../../../theme/tokens";
import { useNativeTeamDetail } from "../useNativeTeamDetail";

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function TeamDetailScreenNative() {
  const route = useRoute<RouteProp<GamesStackParamList, "TeamDetail">>();
  const navigation = useNavigation();
  const { teamId } = route.params;
  const { team, loading, notFound } = useNativeTeamDetail(teamId);

  return (
    <MobilePageShell title={team?.name ?? "Team"} onClose={() => navigation.goBack()}>
      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 32 }} />
      ) : notFound || !team ? (
        <Text style={styles.muted}>Team not found</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.hero, { borderColor: team.colors.primary }]}>
            <Text style={styles.teamName}>{team.name}</Text>
            <Text style={styles.meta}>
              {String(team.conference).toUpperCase()}
              {team.rank != null ? ` · #${team.rank}` : ""}
            </Text>
            <Text style={styles.record}>
              {team.wins}-{team.losses} ({team.winRate.toFixed(1)}%)
            </Text>
          </View>

          <Text style={styles.section}>Season averages</Text>
          <View style={styles.grid}>
            <StatBox label="PPG" value={team.avgPointsFor.toFixed(1)} />
            <StatBox label="Opp PPG" value={team.avgPointsAgainst.toFixed(1)} />
            {team.ppgRank != null ? <StatBox label="PPG Rank" value={`#${team.ppgRank}`} /> : null}
            {team.papgRank != null ? (
              <StatBox label="Opp Rank" value={`#${team.papgRank}`} />
            ) : null}
          </View>

          <Text style={styles.section}>Home / Away</Text>
          <View style={styles.splitCard}>
            <Text style={styles.splitTitle}>HOME</Text>
            <Text style={styles.splitLine}>
              {team.homeAway.home.wins}-{team.homeAway.home.losses}
            </Text>
            <Text style={styles.splitSub}>
              {team.homeAway.home.avgFor.toFixed(1)} / {team.homeAway.home.avgAgainst.toFixed(1)}
            </Text>
          </View>
          <View style={styles.splitCard}>
            <Text style={styles.splitTitle}>AWAY</Text>
            <Text style={styles.splitLine}>
              {team.homeAway.away.wins}-{team.homeAway.away.losses}
            </Text>
            <Text style={styles.splitSub}>
              {team.homeAway.away.avgFor.toFixed(1)} / {team.homeAway.away.avgAgainst.toFixed(1)}
            </Text>
          </View>

          <Text style={styles.section}>
            Last 10 ({team.last10.wins}-{team.last10.losses})
          </Text>
          {team.last10.games.map((g, i) => (
            <View key={`${g.date}-${g.vs}-${i}`} style={styles.gameRow}>
              <Text style={styles.gameDate}>{g.date}</Text>
              <Text style={styles.gameVs}>{g.home ? "vs" : "@"} {g.vs}</Text>
              <Text style={styles.gameScore}>{g.score}</Text>
              <Text style={[styles.gameResult, g.result === "W" ? styles.win : styles.loss]}>
                {g.result}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: 10, paddingBottom: 32 },
  muted: { color: colors.textSecondary, textAlign: "center", marginTop: 32 },
  hero: {
    padding: 16,
    borderRadius: radius.card,
    borderWidth: 1,
    backgroundColor: "rgba(5,8,20,0.55)",
    gap: 4,
  },
  teamName: { color: colors.textPrimary, fontSize: 22, fontWeight: "800" },
  meta: { color: colors.textSecondary, fontSize: 12, letterSpacing: 1 },
  record: { color: colors.textPrimary, fontSize: 18, fontWeight: "700", marginTop: 4 },
  section: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 8,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statBox: {
    width: "47%",
    padding: 12,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(5,8,20,0.45)",
  },
  statLabel: { color: colors.textSecondary, fontSize: 11 },
  statValue: { color: colors.textPrimary, fontSize: 18, fontWeight: "700", marginTop: 4 },
  splitCard: {
    padding: 12,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(5,8,20,0.45)",
  },
  splitTitle: { color: colors.textMuted, fontSize: 11, letterSpacing: 1 },
  splitLine: { color: colors.textPrimary, fontSize: 16, fontWeight: "700", marginTop: 4 },
  splitSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  gameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  gameDate: { width: 44, color: colors.textMuted, fontSize: 12 },
  gameVs: { flex: 1, color: colors.textPrimary, fontSize: 13 },
  gameScore: { color: colors.textSecondary, fontSize: 13, fontVariant: ["tabular-nums"] },
  gameResult: { width: 20, textAlign: "center", fontWeight: "800" },
  win: { color: "#6ee7b7" },
  loss: { color: "#fca5a5" },
});
