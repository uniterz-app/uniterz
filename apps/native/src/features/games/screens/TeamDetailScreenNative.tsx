import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CandleChartLoaderNative } from "../../../components/CandleChartLoaderNative";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import type { GamesStackParamList } from "../../../navigation/types";
import { colors, fonts, radius, spacing } from "../../../theme/tokens";
import { type NativeTeamLastGame, useNativeTeamDetail } from "../useNativeTeamDetail";

function winRate(wins: number, losses: number) {
  const total = wins + losses;
  return total > 0 ? (wins / total) * 100 : 0;
}

function ordinal(n: number | null) {
  if (n == null) return "—";
  const mod10 = n % 10;
  const mod100 = n % 100;
  const suffix = mod10 === 1 && mod100 !== 11 ? "st" : mod10 === 2 && mod100 !== 12 ? "nd" : mod10 === 3 && mod100 !== 13 ? "rd" : "th";
  return `${n}${suffix}`;
}

function DetailCard({ children, accent }: { children: ReactNode; accent: string }) {
  return (
    <View style={[styles.card, { borderColor: `${accent}55` }]}>
      <LinearGradient
        colors={[`${accent}20`, "rgba(255,255,255,0.025)", "rgba(2,6,23,0.36)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function StatBox({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={[styles.statBox, accent ? { borderColor: `${accent}4D` } : null]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function LastGameCard({ game }: { game: NativeTeamLastGame }) {
  const win = game.result === "W";
  return (
    <View style={[styles.gameCard, win ? styles.gameWin : styles.gameLoss]}>
      <View style={styles.gameMain}>
        <Text style={styles.gameDate}>{game.date}</Text>
        <Text style={styles.gameVs} numberOfLines={1}>
          {game.home ? "vs" : "@"} {game.vs}
        </Text>
      </View>
      <Text style={styles.gameScore}>{game.score}</Text>
      <Text style={[styles.gameResult, win ? styles.win : styles.loss]}>{game.result}</Text>
    </View>
  );
}

export default function TeamDetailScreenNative() {
  const route = useRoute<RouteProp<GamesStackParamList, "TeamDetail">>();
  const navigation = useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  const { teamId } = route.params;
  const { team, loading, notFound } = useNativeTeamDetail(teamId);
  const [mode, setMode] = useState<"total" | "home" | "away">("total");
  const [confMode, setConfMode] = useState<"east" | "west">("east");

  useEffect(() => {
    if (!team?.conference) return;
    setConfMode(String(team.conference).toLowerCase() === "east" ? "east" : "west");
  }, [team?.conference]);

  const modeStats = useMemo(() => {
    if (!team) return null;
    if (mode === "home") {
      const h = team.homeAway.home;
      return {
        label: "HOME",
        icon: "home-variant-outline" as const,
        wins: h.wins,
        losses: h.losses,
        avgFor: h.avgFor,
        avgAgainst: h.avgAgainst,
        rate: winRate(h.wins, h.losses),
      };
    }
    if (mode === "away") {
      const a = team.homeAway.away;
      return {
        label: "AWAY",
        icon: "airplane" as const,
        wins: a.wins,
        losses: a.losses,
        avgFor: a.avgFor,
        avgAgainst: a.avgAgainst,
        rate: winRate(a.wins, a.losses),
      };
    }
    return {
      label: "TOTAL",
      icon: "chart-timeline-variant" as const,
      wins: team.wins,
      losses: team.losses,
      avgFor: team.avgPointsFor,
      avgAgainst: team.avgPointsAgainst,
      rate: team.winRate,
    };
  }, [mode, team]);

  const conferenceStats = team
    ? confMode === "east"
      ? team.conferenceRecord.vsEast
      : team.conferenceRecord.vsWest
    : null;

  return (
    <MobilePageShell title={team?.name ?? "TEAM DETAIL"} onClose={() => navigation.goBack()}>
      {loading ? (
        <View style={{ marginTop: 32, alignItems: "center" }}>
          <CandleChartLoaderNative />
        </View>
      ) : notFound || !team ? (
        <Text style={styles.muted}>Team not found</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <DetailCard accent={team.colors.primary}>
            <View style={styles.heroTop}>
              <Text style={styles.conference}>
                {String(team.conference || "NBA").toUpperCase()}{" "}
                <Text style={styles.conferenceRank}>{ordinal(team.conferenceRank ?? team.rank)}</Text>
              </Text>
            </View>
            <Text style={styles.teamName} numberOfLines={1}>
              {team.name}
            </Text>
            <Text style={styles.record}>
              {team.wins}-{team.losses} · {team.winRate.toFixed(1)}%
            </Text>
          </DetailCard>

          {modeStats ? (
            <Pressable
              onPress={() =>
                setMode(mode === "total" ? "home" : mode === "home" ? "away" : "total")
              }
              accessibilityRole="button"
            >
              <DetailCard accent={team.colors.primary}>
                <View style={styles.modeRow}>
                  <View>
                    <View style={styles.modeLabelRow}>
                      <MaterialCommunityIcons
                        name={modeStats.icon}
                        size={15}
                        color="rgba(255,255,255,0.65)"
                      />
                      <Text style={styles.modeLabel}>{modeStats.label}</Text>
                    </View>
                    <Text style={styles.bigRecord}>
                      {modeStats.wins}-{modeStats.losses}
                    </Text>
                    <Text style={styles.tapHint}>tap to switch</Text>
                  </View>
                  <View style={styles.modeNumbers}>
                    <MetricLine label="PTS For" value={modeStats.avgFor.toFixed(1)} />
                    <MetricLine label="Against" value={modeStats.avgAgainst.toFixed(1)} />
                    <MetricLine label="Win Rate" value={`${modeStats.rate.toFixed(1)}%`} />
                  </View>
                </View>
              </DetailCard>
            </Pressable>
          ) : null}

          <View style={styles.twoCol}>
            <View style={styles.twoColItem}>
              <DetailCard accent={team.colors.orange}>
                <Text style={styles.sectionInCard}>CLUTCH (±5 PTS)</Text>
                <View style={styles.miniMetricRow}>
                  <Text style={styles.miniRecord}>
                    {team.clutch.wins}-{team.clutch.losses}
                  </Text>
                  <View style={styles.miniRate}>
                    <Text style={styles.statLabel}>Win Rate</Text>
                    <Text style={styles.statValue}>
                      {winRate(team.clutch.wins, team.clutch.losses).toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </DetailCard>
            </View>
            <View style={styles.twoColItem}>
              <Pressable
                onPress={() => setConfMode(confMode === "east" ? "west" : "east")}
                accessibilityRole="button"
              >
                <DetailCard accent={confMode === "east" ? "#EF3B24" : "#007AC1"}>
                  <Text style={styles.sectionInCard}>
                    {confMode === "east" ? "VS EAST" : "VS WEST"}
                  </Text>
                  <View style={styles.miniMetricRow}>
                    <Text
                      style={[
                        styles.miniRecord,
                        { color: confMode === "east" ? "#ff6b5f" : "#49b6ff" },
                      ]}
                    >
                      {conferenceStats?.wins ?? 0}-{conferenceStats?.losses ?? 0}
                    </Text>
                    <View style={styles.miniRate}>
                      <Text style={styles.statLabel}>Win Rate</Text>
                      <Text style={styles.statValue}>
                        {winRate(conferenceStats?.wins ?? 0, conferenceStats?.losses ?? 0).toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                </DetailCard>
              </Pressable>
            </View>
          </View>

          <Text style={styles.section}>Season averages</Text>
          <View style={styles.grid}>
            <StatBox label="PPG" value={team.avgPointsFor.toFixed(1)} accent={team.colors.primary} />
            <StatBox label="Opp PPG" value={team.avgPointsAgainst.toFixed(1)} accent={team.colors.primary} />
            {team.ppgRank != null ? <StatBox label="PPG Rank" value={`#${team.ppgRank}`} accent={team.colors.secondary} /> : null}
            {team.papgRank != null ? (
              <StatBox label="Opp Rank" value={`#${team.papgRank}`} accent={team.colors.secondary} />
            ) : null}
          </View>

          <Text style={styles.section}>
            Last 10 ({team.last10.wins}-{team.last10.losses})
          </Text>
          <View style={styles.last10Panel}>
            {team.last10.games.length === 0 ? (
              <Text style={styles.mutedSmall}>No games</Text>
            ) : (
              team.last10.games.map((g, i) => (
                <LastGameCard key={`${g.date}-${g.vs}-${i}`} game={g} />
              ))
            )}
          </View>
        </ScrollView>
      )}
    </MobilePageShell>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricLine}>
      <Text style={styles.metricLineLabel}>{label}</Text>
      <Text style={styles.metricLineValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: 12, paddingBottom: 36 },
  muted: { color: colors.textSecondary, textAlign: "center", marginTop: 32 },
  mutedSmall: { color: colors.textSecondary, textAlign: "center", paddingVertical: 14 },
  card: {
    borderRadius: radius.card,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "rgba(5,8,20,0.58)",
  },
  cardBody: { padding: 14 },
  heroTop: { alignItems: "flex-start" },
  conference: {
    color: "rgba(255,255,255,0.78)",
    fontFamily: fonts.brand,
    fontSize: 17,
    letterSpacing: 1.2,
  },
  conferenceRank: { color: "rgba(255,255,255,0.55)" },
  teamName: {
    color: colors.textPrimary,
    fontFamily: fonts.brand,
    fontSize: 34,
    letterSpacing: 1.3,
    textAlign: "center",
    marginTop: 6,
  },
  record: {
    color: colors.textPrimary,
    fontFamily: fonts.metric,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 8,
    textAlign: "center",
  },
  modeRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  modeLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  modeLabel: { color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: "800" },
  bigRecord: {
    color: colors.textPrimary,
    fontFamily: fonts.metric,
    fontSize: 35,
    fontWeight: "900",
    marginTop: 8,
  },
  tapHint: { color: "rgba(255,255,255,0.38)", fontSize: 11, marginTop: 4 },
  modeNumbers: { alignItems: "flex-end", gap: 8, justifyContent: "center" },
  metricLine: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  metricLineLabel: { color: "rgba(255,255,255,0.52)", fontSize: 11 },
  metricLineValue: {
    color: colors.textPrimary,
    fontFamily: fonts.metric,
    fontSize: 22,
    fontWeight: "900",
  },
  twoCol: { flexDirection: "row", gap: 10 },
  twoColItem: { flex: 1 },
  sectionInCard: { color: "rgba(255,255,255,0.68)", fontSize: 11, fontWeight: "800" },
  miniMetricRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 8, gap: 8 },
  miniRecord: {
    color: colors.textPrimary,
    fontFamily: fonts.metric,
    fontSize: 25,
    fontWeight: "900",
  },
  miniRate: { alignItems: "flex-end" },
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
  statValue: {
    color: colors.textPrimary,
    fontFamily: fonts.metric,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
  },
  last10Panel: {
    gap: 8,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(5,8,20,0.35)",
    padding: 10,
  },
  gameCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: "rgba(15,23,42,0.62)",
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  gameWin: {
    borderColor: "rgba(80,200,255,0.62)",
  },
  gameLoss: {
    borderColor: "rgba(255,80,80,0.58)",
  },
  gameMain: { flex: 1, minWidth: 0 },
  gameDate: { color: colors.textMuted, fontSize: 11 },
  gameVs: { color: colors.textPrimary, fontSize: 13, marginTop: 2 },
  gameScore: {
    color: colors.textPrimary,
    fontFamily: fonts.metric,
    fontSize: 16,
    fontWeight: "800",
  },
  gameResult: { width: 20, textAlign: "center", fontWeight: "800" },
  win: { color: "#6ee7b7" },
  loss: { color: "#fca5a5" },
});
