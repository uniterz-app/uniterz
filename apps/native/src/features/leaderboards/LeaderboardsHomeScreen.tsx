import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { colors, fonts, spacing } from "../../theme/tokens";
import type { LeaderboardsStackParamList } from "../../navigation/types";
import type { CommunityLeague, CommunityMetric } from "../../../../../lib/communities/types";
import { formatCommunityCompetitionLine } from "../../../../../lib/communities/competitionDisplay";
import {
  markLeaderboardsIntroSeenNative,
  readLeaderboardsIntroSeenNative,
} from "../../navigation/navLeaderboardsIntroSeenNative";

const API_BASE = process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL?.replace(/\/$/, "") ?? "";

type Group = {
  id: string;
  name: string;
  description?: string | null;
  memberCount: number;
  inviteCode?: string;
  headerImageUrl?: string | null;
  rankingMetric?: CommunityMetric;
  rankingLeague?: CommunityLeague;
  rankingTeamIds?: string[];
  role?: string;
};

function groupCompetitionLine(group: Group) {
  return formatCommunityCompetitionLine(
    {
      rankingLeague: group.rankingLeague ?? "all",
      rankingMetric: group.rankingMetric ?? "totalPoints",
      rankingTeamIds: group.rankingTeamIds ?? [],
    },
    "ja"
  );
}

type Props = { bottomReserveY?: number };

export default function LeaderboardsHomeScreen({ bottomReserveY = 0 }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<LeaderboardsStackParamList>>();
  const insets = useSafeAreaInsets();
  const screenTopPad = insets.top + spacing.sm;
  const { fUser } = useFirebaseUser();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [introOpen, setIntroOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    void readLeaderboardsIntroSeenNative().then((seen) => {
      if (!seen) {
        void markLeaderboardsIntroSeenNative();
        setIntroOpen(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!fUser || !API_BASE) {
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const token = await fUser.getIdToken();
        const res = await fetch(`${API_BASE}/api/communities/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = (await res.json()) as { groups?: Group[] };
          setGroups(data.groups ?? []);
        }
      } catch {
        // 空のまま
      } finally {
        setLoading(false);
      }
    })();
  }, [fUser]);

  async function handleCreate() {
    if (!fUser || !API_BASE || !groupName.trim()) return;
    try {
      const token = await fUser.getIdToken();
      const res = await fetch(`${API_BASE}/api/communities/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: groupName.trim() }),
      });
      if (!res.ok) throw new Error("failed");
      setCreateOpen(false);
      setGroupName("");
      Alert.alert("", "グループを作成しました。");
    } catch {
      Alert.alert("エラー", "グループ作成に失敗しました。");
    }
  }

  async function handleJoin() {
    if (!fUser || !API_BASE || !inviteCode.trim()) return;
    try {
      const token = await fUser.getIdToken();
      const res = await fetch(`${API_BASE}/api/communities/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });
      if (!res.ok) throw new Error("failed");
      setJoinOpen(false);
      setInviteCode("");
      Alert.alert("", "グループに参加しました。");
    } catch {
      Alert.alert("エラー", "参加に失敗しました。招待コードを確認してください。");
    }
  }

  return (
    <View style={[styles.root, { paddingTop: screenTopPad, paddingBottom: bottomReserveY }]}>
      <View style={styles.foreground}>
      <Text style={styles.header}>LEADERBOARDS</Text>
      <Text style={styles.sub}>コミュニティグループ</Text>

      <View style={styles.slots}>
        <Pressable style={styles.slot} onPress={() => setCreateOpen(true)}>
          <LinearGradient
            colors={["rgba(34,211,238,0.12)", "rgba(255,255,255,0.02)"]}
            style={StyleSheet.absoluteFillObject}
          />
          <MaterialCommunityIcons name="plus-box-outline" size={18} color="rgba(103,232,249,0.9)" />
          <Text style={styles.slotTitle}>作成</Text>
          <Text style={styles.slotDesc}>新しいグループを作る</Text>
        </Pressable>
        <Pressable style={styles.slot} onPress={() => setJoinOpen(true)}>
          <LinearGradient
            colors={["rgba(251,191,36,0.11)", "rgba(255,255,255,0.02)"]}
            style={StyleSheet.absoluteFillObject}
          />
          <MaterialCommunityIcons name="ticket-confirmation-outline" size={18} color="rgba(253,230,138,0.9)" />
          <Text style={styles.slotTitle}>参加</Text>
          <Text style={styles.slotDesc}>招待コードで参加</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accentCyan} style={{ marginTop: 24 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {groups.length === 0 ? (
            <Text style={styles.empty}>NO GROUPS</Text>
          ) : (
            groups.map((g) => {
              const isOwner = g.role === "owner";
              return (
                <Pressable
                  key={g.id}
                  style={styles.groupCard}
                  onPress={() => navigation.navigate("CommunityDetail", { groupId: g.id })}
                >
                  <View style={styles.groupAccent} />
                  <View style={styles.groupBody}>
                    <View style={styles.thumb}>
                      {g.headerImageUrl ? (
                        <Image source={{ uri: g.headerImageUrl }} style={styles.thumbImg} resizeMode="cover" />
                      ) : (
                        <MaterialCommunityIcons
                          name="view-grid-plus-outline"
                          size={22}
                          color="rgba(103,232,249,0.32)"
                        />
                      )}
                    </View>
                    <View style={styles.groupMain}>
                      <View style={styles.groupTopLine}>
                        <Text style={styles.groupName} numberOfLines={1}>
                          {g.name}
                        </Text>
                        <View style={[styles.roleBadge, isOwner ? styles.roleOwner : styles.roleMember]}>
                          <Text
                            style={[
                              styles.roleBadgeText,
                              isOwner ? styles.roleOwnerText : styles.roleMemberText,
                            ]}
                          >
                            {isOwner ? "OWNER" : "MEMBER"}
                          </Text>
                        </View>
                      </View>
                      {g.description ? (
                        <Text style={styles.groupDesc} numberOfLines={1}>
                          {g.description}
                        </Text>
                      ) : null}
                      <Text style={styles.groupMeta} numberOfLines={1}>
                        {g.memberCount} members · {groupCompetitionLine(g)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}

      </View>

      <IntroModal visible={introOpen} onClose={() => setIntroOpen(false)} />
      <SimpleModal visible={createOpen} title="グループ作成" onClose={() => setCreateOpen(false)}>
        <TextInput
          style={styles.input}
          placeholder="グループ名"
          placeholderTextColor={colors.textMuted}
          value={groupName}
          onChangeText={setGroupName}
        />
        <Pressable style={styles.cta} onPress={handleCreate}>
          <Text style={styles.ctaLabel}>作成</Text>
        </Pressable>
      </SimpleModal>
      <SimpleModal visible={joinOpen} title="グループ参加" onClose={() => setJoinOpen(false)}>
        <TextInput
          style={styles.input}
          placeholder="招待コード"
          placeholderTextColor={colors.textMuted}
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="characters"
        />
        <Pressable style={styles.cta} onPress={handleJoin}>
          <Text style={styles.ctaLabel}>参加</Text>
        </Pressable>
      </SimpleModal>
    </View>
  );
}

function IntroModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>グループ機能</Text>
          <Text style={styles.modalBody}>
            リーダーボードでコミュニティを作成・参加し、メンバー内ランキングを競えます。
          </Text>
          <Pressable style={styles.cta} onPress={onClose}>
            <Text style={styles.ctaLabel}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function SimpleModal({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          {children}
          <Pressable onPress={onClose} style={{ marginTop: 8 }}>
            <Text style={styles.cancel}>キャンセル</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent", paddingHorizontal: spacing.sm, position: "relative" },
  foreground: { flex: 1, zIndex: 1 },
  header: {
    fontFamily: fonts.brand,
    fontSize: 28,
    letterSpacing: 2,
    color: colors.textPrimary,
  },
  sub: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing.md },
  slots: { flexDirection: "row", gap: 10 },
  slot: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 14,
    overflow: "hidden",
    padding: 14,
    backgroundColor: colors.glassCardBg,
  },
  slotTitle: { color: colors.accentCyan, fontWeight: "700", fontSize: 15 },
  slotDesc: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  list: { paddingTop: spacing.md, gap: 10 },
  empty: {
    fontFamily: fonts.brand,
    fontSize: 24,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 40,
  },
  groupCard: {
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.2)",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.025)",
  },
  groupAccent: {
    width: 3,
    backgroundColor: "#22d3ee",
    shadowColor: "#22d3ee",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
  },
  groupBody: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  thumb: {
    width: 52,
    height: 52,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.25)",
    backgroundColor: "#0a1018",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbImg: { width: "100%", height: "100%" },
  groupMain: { flex: 1, minWidth: 0, justifyContent: "center" },
  groupTopLine: { flexDirection: "row", alignItems: "center", gap: 8, minWidth: 0 },
  groupName: { flex: 1, color: colors.textPrimary, fontWeight: "800", fontSize: 15 },
  roleBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  roleOwner: {
    borderColor: "rgba(251,191,36,0.45)",
    backgroundColor: "rgba(251,191,36,0.08)",
  },
  roleMember: {
    borderColor: "rgba(34,211,238,0.3)",
    backgroundColor: "rgba(34,211,238,0.06)",
  },
  roleBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  roleOwnerText: { color: "rgba(251,191,36,0.9)" },
  roleMemberText: { color: "rgba(186,230,253,0.75)" },
  groupDesc: { color: "rgba(255,255,255,0.52)", fontSize: 11, marginTop: 4 },
  groupMeta: { color: "rgba(186,230,253,0.74)", fontSize: 11, marginTop: 6 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.surfacePrimary,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 12,
  },
  modalTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "800" },
  modalBody: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 10,
    padding: 12,
    color: colors.textPrimary,
  },
  cta: {
    backgroundColor: "rgba(34,211,238,0.18)",
    borderWidth: 1,
    borderColor: colors.accentCyan,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  ctaLabel: { color: colors.textPrimary, fontWeight: "700" },
  cancel: { color: colors.textSecondary, textAlign: "center" },
});
