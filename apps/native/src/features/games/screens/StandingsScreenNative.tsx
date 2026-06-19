import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { collection, getDocs, query, where } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import { db } from "../../../lib/firebase";
import { colors } from "../../../theme/tokens";
import { compareNbaStandingsSortRows } from "../../../../../../lib/nba/compareNbaStandingsSort";
import { nbaRegularSeasonWinsLosses } from "../../../../../../lib/nbaRegularSeasonRecord";
import type { GamesStackParamList } from "../../../navigation/types";

type Team = {
  id: string;
  name: string;
  conference: "east" | "west" | "EAST" | "WEST";
  wins: number;
  losses: number;
  winRate?: number;
  rank?: number;
  standingsTiebreakOrder?: number;
};

function normalizeConference(v: unknown): "east" | "west" {
  if (v === "EAST" || v === "east") return "east";
  return "west";
}

function rankNumberStyle(rank: number) {
  if (rank <= 6) return styles.rankPlayoff;
  if (rank <= 10) return styles.rankPlayIn;
  return styles.rankOut;
}

/** NBA スタンディング（NbaStandingsPanel port） */
export default function StandingsScreenNative() {
  const navigation = useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [tab, setTab] = useState<"east" | "west">("east");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const q = query(collection(db, "teams"), where("league", "==", "nba"));
    void getDocs(q)
      .then((snap) => {
        if (!alive) return;
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Team, "id">),
        }));
        setTeams(list);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const confTeams = teams.filter((t) => normalizeConference(t.conference) === tab);
    return [...confTeams].sort((a, b) => compareNbaStandingsSortRows(a, b));
  }, [teams, tab]);
  const leaderRecord = filtered[0] ? nbaRegularSeasonWinsLosses(filtered[0]) : null;

  return (
    <MobilePageShell title="スタンディング" appBackground onClose={() => navigation.goBack()}>
      <View style={styles.tabs}>
        {(["east", "west"] as const).map((c) => (
          <Pressable
            key={c}
            style={[styles.tabChip, tab === c && styles.tabChipActive]}
            onPress={() => setTab(c)}
          >
            <Text style={[styles.tabLabel, tab === c && styles.tabLabelActive]}>
              {c.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {filtered.map((team, index) => {
            const rank = team.rank ?? index + 1;
            const record = nbaRegularSeasonWinsLosses(team);
            const games = record.wins + record.losses;
            const pct = games > 0 ? (record.wins / games) * 100 : 0;
            const gb =
              index === 0 || !leaderRecord
                ? "—"
                : (((leaderRecord.wins - record.wins) + (record.losses - leaderRecord.losses)) / 2).toFixed(1);
            return (
              <View key={team.id}>
                <Pressable onPress={() => navigation.navigate("TeamDetail", { teamId: team.id })}>
                  <LinearGradient
                    colors={rowGradient(rank, tab)}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.row}
                  >
                    <Text style={[styles.rank, rankNumberStyle(rank)]}>{rank}</Text>
                    <Text style={styles.teamName} numberOfLines={1}>
                      {team.name}
                    </Text>
                    <View style={styles.recordBlock}>
                      <Text style={styles.record}>{record.wins}-{record.losses}</Text>
                      <Text style={styles.gb}>{gb}</Text>
                      <Text style={styles.pct}>{pct.toFixed(1)}%</Text>
                    </View>
                  </LinearGradient>
                </Pressable>
                {index + 1 === 6 || index + 1 === 10 ? (
                  <View style={[styles.separator, index + 1 === 6 ? styles.sepPlayoff : styles.sepPlayIn]} />
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      )}
    </MobilePageShell>
  );
}

function rowGradient(rank: number, conference: "east" | "west"): [string, string, string, string] {
  const base = conference === "east" ? "220,38,38" : "37,99,235";
  const strong = rank <= 6 ? 0.65 : rank <= 10 ? 0.55 : 0.45;
  const mid = rank <= 6 ? 0.45 : rank <= 10 ? 0.35 : 0.25;
  const soft = rank <= 6 ? 0.18 : rank <= 10 ? 0.15 : 0.12;
  return [
    `rgba(${base},${strong})`,
    `rgba(${base},${mid})`,
    `rgba(${base},${soft})`,
    `rgba(${base},0.04)`,
  ];
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 8 },
  tabChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  tabChipActive: {
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  tabLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: "600" },
  tabLabelActive: { color: colors.textPrimary },
  content: { padding: 16, gap: 8, paddingBottom: 32 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  rank: { width: 28, fontWeight: "800", fontSize: 14, textAlign: "center" },
  rankPlayoff: { color: "#6ee7b7" },
  rankPlayIn: { color: "#fcd34d" },
  rankOut: { color: "#fca5a5" },
  teamName: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: "600" },
  recordBlock: { flexDirection: "row", alignItems: "center", gap: 12 },
  record: { color: "rgba(255,255,255,0.72)", fontSize: 12, fontVariant: ["tabular-nums"] },
  gb: { color: "rgba(255,255,255,0.45)", fontSize: 11, width: 34, textAlign: "right", fontVariant: ["tabular-nums"] },
  pct: { color: "rgba(255,255,255,0.75)", fontSize: 11, width: 44, textAlign: "right", fontVariant: ["tabular-nums"] },
  separator: { height: StyleSheet.hairlineWidth, marginVertical: 8 },
  sepPlayoff: { backgroundColor: "rgba(52,211,153,0.6)" },
  sepPlayIn: { backgroundColor: "rgba(251,191,36,0.6)" },
});
