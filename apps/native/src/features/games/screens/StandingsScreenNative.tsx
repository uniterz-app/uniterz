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

  return (
    <MobilePageShell title="Standings" onClose={() => navigation.goBack()}>
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
            return (
              <Pressable
                key={team.id}
                style={styles.row}
                onPress={() => navigation.navigate("TeamDetail", { teamId: team.id })}
              >
                <Text style={[styles.rank, rankNumberStyle(rank)]}>{rank}</Text>
                <Text style={styles.teamName} numberOfLines={1}>
                  {team.name}
                </Text>
                <Text style={styles.record}>
                  {record.wins}-{record.losses}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </MobilePageShell>
  );
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
  content: { padding: 16, gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(5,8,20,0.45)",
  },
  rank: { width: 28, fontWeight: "800", fontSize: 14, textAlign: "center" },
  rankPlayoff: { color: "#6ee7b7" },
  rankPlayIn: { color: "#fcd34d" },
  rankOut: { color: "#fca5a5" },
  teamName: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: "600" },
  record: { color: colors.textSecondary, fontSize: 13, fontVariant: ["tabular-nums"] },
});
