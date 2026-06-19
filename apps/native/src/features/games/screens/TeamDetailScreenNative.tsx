/**
 * Web `TeamDetailView` 相当
 */
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import type { GamesStackParamList } from "../../../navigation/types";
import { colors, fonts, radius, spacing } from "../../../theme/tokens";
import { useNativeTeamDetail, type NativeTeamDetail } from "../useNativeTeamDetail";
import { enOrdinal } from "../../../../../../lib/teamDetailConference";

type Mode = "total" | "home" | "away";
type ConfMode = "east" | "west";

function normalizeConference(v: string): ConfMode {
  return v === "EAST" || v === "east" ? "east" : "west";
}

function rate(wins: number, losses: number) {
  const total = wins + losses;
  return total > 0 ? (wins / total) * 100 : 0;
}

function modeStats(team: NativeTeamDetail, mode: Mode) {
  if (mode === "home") {
    const home = team.homeAway.home;
    return {
      wins: home.wins,
      losses: home.losses,
      avgFor: home.avgFor,
      avgAgainst: home.avgAgainst,
      rate: rate(home.wins, home.losses),
    };
  }
  if (mode === "away") {
    const away = team.homeAway.away;
    return {
      wins: away.wins,
      losses: away.losses,
      avgFor: away.avgFor,
      avgAgainst: away.avgAgainst,
      rate: rate(away.wins, away.losses),
    };
  }
  return {
    wins: team.wins,
    losses: team.losses,
    avgFor: team.avgPointsFor,
    avgAgainst: team.avgPointsAgainst,
    rate: team.winRate,
  };
}

function StatBox({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={[styles.statBox, accent ? { borderColor: `${accent}55` } : null]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function DepthCard({
  children,
  accent,
  style,
}: {
  children: ReactNode;
  accent: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.depthCard, { borderColor: `${accent}33` }, style]}>
      <View style={[styles.cardGlow, { backgroundColor: `${accent}18` }]} pointerEvents="none" />
      {children}
    </View>
  );
}

export default function TeamDetailScreenNative() {
  const route = useRoute<RouteProp<GamesStackParamList, "TeamDetail">>();
  const navigation = useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  const { teamId } = route.params;
  const { team, loading, notFound } = useNativeTeamDetail(teamId);
  const [mode, setMode] = useState<Mode>("total");
  const [confMode, setConfMode] = useState<ConfMode>("east");

  const stats = useMemo(() => (team ? modeStats(team, mode) : null), [team, mode]);
  const conference = team ? normalizeConference(team.conference) : "west";
  const confRecord =
    team && confMode === "east" ? team.conferenceRecord.vsEast : team?.conferenceRecord.vsWest;

  useEffect(() => {
    if (team) setConfMode(normalizeConference(team.conference));
  }, [team]);

  const switchMode = () => {
    setMode((current) => (current === "total" ? "home" : current === "home" ? "away" : "total"));
  };

  return (
    <MobilePageShell title={team?.name ?? "Team"} appBackground onClose={() => navigation.goBack()}>
      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 32 }} />
      ) : notFound || !team ? (
        <Text style={styles.muted}>Team not found</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.hero, { borderColor: `${team.colors.primary}77` }]}>
            <View style={[styles.heroOrb, { backgroundColor: `${team.colors.primary}22` }]} />
            <View style={styles.scanLines} pointerEvents="none" />
            <Text style={[styles.conference, conference === "east" ? styles.east : styles.west]}>
              {conference.toUpperCase()}{" "}
              <Text style={styles.conferenceRank}>
                {team.conferenceRank != null ? enOrdinal(team.conferenceRank) : "--"}
              </Text>
            </Text>
            <Text style={styles.teamName} numberOfLines={1}>
              {team.name}
            </Text>
          </View>

          {stats ? (
            <DepthCard accent={team.colors.primary}>
              <Pressable style={styles.modeCard} onPress={switchMode}>
                <View style={styles.modeLeft}>
                  <View style={styles.modeTitleRow}>
                    {mode === "home" ? (
                      <MaterialCommunityIcons name="home-variant" size={14} color={colors.textSecondary} />
                    ) : null}
                    {mode === "away" ? (
                      <MaterialCommunityIcons name="airplane" size={14} color={colors.textSecondary} />
                    ) : null}
                    <Text style={styles.modeLabel}>{mode.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.modeRecord}>
                    {stats.wins}-{stats.losses}
                  </Text>
                  <Text style={styles.tapHint}>tap to switch</Text>
                </View>
                <View style={styles.modeRight}>
                  <Text style={styles.metricLine}>PTS For {stats.avgFor.toFixed(1)}</Text>
                  <Text style={styles.metricLine}>Against {stats.avgAgainst.toFixed(1)}</Text>
                  <Text style={styles.metricLine}>Win Rate {stats.rate.toFixed(1)}%</Text>
                </View>
              </Pressable>
            </DepthCard>
          ) : null}

          <View style={styles.twoCol}>
            <DepthCard accent={team.colors.orange} style={styles.halfCard}>
              <Text style={styles.cardLabel}>CLUTCH (+/-5 PTS)</Text>
              <Text style={styles.cardRecord}>
                {team.clutch.wins}-{team.clutch.losses}
              </Text>
              <Text style={styles.cardSub}>Win Rate {rate(team.clutch.wins, team.clutch.losses).toFixed(1)}%</Text>
            </DepthCard>
            <DepthCard accent={confMode === "east" ? "#F87171" : "#5AC8FA"} style={styles.halfCard}>
              <Pressable onPress={() => setConfMode((current) => (current === "east" ? "west" : "east"))}>
                <Text style={styles.cardLabel}>{confMode === "east" ? "VS EAST" : "VS WEST"}</Text>
                <Text style={[styles.cardRecord, confMode === "east" ? styles.east : styles.west]}>
                  {confRecord?.wins ?? 0}-{confRecord?.losses ?? 0}
                </Text>
                <Text style={styles.cardSub}>
                  Win Rate {rate(confRecord?.wins ?? 0, confRecord?.losses ?? 0).toFixed(1)}%
                </Text>
              </Pressable>
            </DepthCard>
          </View>

          <Text style={styles.section}>Season averages</Text>
          <View style={styles.grid}>
            <StatBox label="PPG" value={team.avgPointsFor.toFixed(1)} accent={team.colors.primary} />
            <StatBox label="Opp PPG" value={team.avgPointsAgainst.toFixed(1)} accent={team.colors.primary} />
            {team.ppgRank != null ? (
              <StatBox label="PPG Rank" value={`#${team.ppgRank}`} accent={team.colors.secondary} />
            ) : null}
            {team.papgRank != null ? (
              <StatBox label="Opp Rank" value={`#${team.papgRank}`} accent={team.colors.secondary} />
            ) : null}
          </View>

          <DepthCard accent={team.colors.primary}>
            <Text style={styles.sectionInCard}>
              Last 10 Games ({team.last10.wins}-{team.last10.losses})
            </Text>
            {team.last10.games.length === 0 ? (
              <Text style={styles.mutedSmall}>No games</Text>
            ) : (
              team.last10.games.map((g, i) => (
                <View
                  key={`${g.date}-${g.vs}-${i}`}
                  style={[
                    styles.gameRow,
                    g.result === "W" ? styles.gameRowWin : styles.gameRowLoss,
                  ]}
                >
                  <Text style={styles.gameDate}>{g.date}</Text>
                  <Text style={styles.gameVs} numberOfLines={1}>
                    {g.home ? "vs" : "@"} {g.vs}
                  </Text>
                  <Text style={styles.gameScore}>{g.score}</Text>
                  <Text style={[styles.gameResult, g.result === "W" ? styles.win : styles.loss]}>
                    {g.result}
                  </Text>
                </View>
              ))
            )}
          </DepthCard>
        </ScrollView>
      )}
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: 12, paddingBottom: 36 },
  muted: { color: colors.textSecondary, textAlign: "center", marginTop: 32 },
  hero: {
    position: "relative",
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    gap: 8,
  },
  heroOrb: {
    position: "absolute",
    top: -60,
    right: -42,
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  scanLines: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.16,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  conference: {
    fontFamily: fonts.brand,
    fontSize: 18,
    letterSpacing: 1.5,
  },
  east: {
    color: "#F87171",
  },
  west: {
    color: "#5AC8FA",
  },
  conferenceRank: {
    color: "rgba(255,255,255,0.58)",
  },
  teamName: {
    color: colors.textPrimary,
    fontFamily: fonts.brand,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: 1.2,
    textAlign: "center",
  },
  depthCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: radius.card,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 14,
  },
  cardGlow: {
    position: "absolute",
    top: -44,
    left: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  modeCard: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    gap: 12,
  },
  modeLeft: {
    flex: 1,
  },
  modeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  modeLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: "700",
  },
  modeRecord: {
    color: colors.textPrimary,
    fontFamily: fonts.metricExtra,
    fontSize: 34,
    lineHeight: 38,
  },
  tapHint: {
    color: "rgba(255,255,255,0.38)",
    fontSize: 11,
    marginTop: 6,
  },
  modeRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 6,
  },
  metricLine: {
    color: colors.textPrimary,
    fontFamily: fonts.metric,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  twoCol: {
    flexDirection: "row",
    gap: 10,
  },
  halfCard: {
    flex: 1,
    minHeight: 112,
  },
  cardLabel: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: "700",
  },
  cardRecord: {
    color: colors.textPrimary,
    fontFamily: fonts.metricExtra,
    fontSize: 28,
    marginTop: 8,
  },
  cardSub: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 6,
    fontVariant: ["tabular-nums"],
  },
  section: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 8,
  },
  sectionInCard: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
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
  mutedSmall: { color: colors.textSecondary, fontSize: 12 },
  gameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
    backgroundColor: "rgba(15,23,42,0.48)",
  },
  gameRowWin: {
    borderColor: "rgba(80,200,255,0.42)",
  },
  gameRowLoss: {
    borderColor: "rgba(255,80,80,0.38)",
  },
  gameDate: { width: 44, color: colors.textMuted, fontSize: 12 },
  gameVs: { flex: 1, color: colors.textPrimary, fontSize: 13 },
  gameScore: { color: colors.textSecondary, fontSize: 13, fontVariant: ["tabular-nums"] },
  gameResult: { width: 20, textAlign: "center", fontWeight: "800" },
  win: { color: "#6ee7b7" },
  loss: { color: "#fca5a5" },
});
