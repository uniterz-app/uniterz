import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import type { LeaderboardsStackParamList } from "../../navigation/types";
import { colors, spacing } from "../../theme/tokens";

const API_BASE = process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL?.replace(/\/$/, "") ?? "";

export default function CommunityDetailScreenNative() {
  const route = useRoute<RouteProp<LeaderboardsStackParamList, "CommunityDetail">>();
  const navigation = useNavigation();
  const { fUser } = useFirebaseUser();
  const { groupId } = route.params;
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [members, setMembers] = useState<Array<{ handle: string; rank: number }>>([]);

  useEffect(() => {
    if (!fUser || !API_BASE) {
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const token = await fUser.getIdToken();
        const res = await fetch(`${API_BASE}/api/communities/${groupId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = (await res.json()) as {
            name?: string;
            members?: Array<{ handle: string; rank: number }>;
          };
          setName(data.name ?? groupId);
          setMembers(data.members ?? []);
        }
      } catch {
        setName(groupId);
      } finally {
        setLoading(false);
      }
    })();
  }, [fUser, groupId]);

  return (
    <MobilePageShell
      title={name || "Group"}
      appBackground
      onClose={() => navigation.goBack()}
    >
      {loading ? (
        <ActivityIndicator color={colors.accentCyan} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {members.length === 0 ? (
            <Text style={styles.empty}>メンバーなし</Text>
          ) : (
            members.map((m) => (
              <View key={m.handle} style={styles.row}>
                <Text style={styles.rank}>#{m.rank}</Text>
                <Text style={styles.handle}>@{m.handle}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: 8 },
  empty: { color: colors.textSecondary, textAlign: "center", marginTop: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderGlass,
  },
  rank: { color: colors.accentCyan, fontWeight: "800", width: 36 },
  handle: { color: colors.textPrimary, fontSize: 15 },
});
