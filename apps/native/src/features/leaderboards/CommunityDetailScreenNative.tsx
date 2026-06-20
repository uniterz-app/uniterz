import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import type { LeaderboardsStackParamList } from "../../navigation/types";
import { colors, fonts, spacing } from "../../theme/tokens";
import { useNativeLanguage } from "../../i18n/NativeLanguageProvider";
import type { Language } from "../../../../../lib/i18n/language";
import type { CommunityLeague, CommunityMetric } from "../../../../../lib/communities/types";
import { formatCommunityCompetitionLine } from "../../../../../lib/communities/competitionDisplay";
import { periodLabel } from "../../../../../lib/communities/labels";
import {
  communityMetricToMobile,
  communityRowToRankingCardRow,
} from "../../../../../lib/communities/leaderboardDisplayRow";
import type { RankingRowWithCountry } from "../../../../../app/component/rankings/_data/mockRows";
import {
  RankingListCardNative,
  RankingsTopPodiumNative,
} from "../rankings/RankingsUiParts";

const API_BASE = process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL?.replace(/\/$/, "") ?? "";

type CommunityGroupSummaryNative = {
  id: string;
  name: string;
  description: string | null;
  ownerUid: string;
  memberCount: number;
  headerImageUrl: string | null;
  rankingMetric: CommunityMetric;
  periodType: string;
  rankingLeague: CommunityLeague;
  rankingTeamIds: string[];
  archived: boolean;
  isOwner: boolean;
  inviteCode: string | null;
};

type CommunityGroupLeaderboardRowNative = {
  rank: number;
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;
  plan?: "free" | "pro";
  countryCode?: string;
  totalPosts?: number;
  totalWins?: number;
  sortValue: number;
  winRate: number;
  activeWinStreak: number;
  totalPoints: number;
  totalPrecision?: number;
  totalUpset?: number;
};

function msg(language: Language, ja: string, en: string) {
  return language === "en" ? en : ja;
}

export default function CommunityDetailScreenNative() {
  const route = useRoute<RouteProp<LeaderboardsStackParamList, "CommunityDetail">>();
  const navigation = useNavigation<NativeStackNavigationProp<LeaderboardsStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeLanguage();
  const { groupId } = route.params;
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [loadingRows, setLoadingRows] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyAction, setBusyAction] = useState<"archive" | "leave" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<CommunityGroupSummaryNative | null>(null);
  const [rows, setRows] = useState<CommunityGroupLeaderboardRowNative[]>([]);

  const load = useCallback(async () => {
    if (!fUser || !API_BASE) {
      setError(
        !API_BASE
          ? msg(language, "API が未設定です。", "API base URL is not configured.")
          : msg(language, "ログインが必要です。", "Login is required.")
      );
      setLoadingDetail(false);
      setLoadingRows(false);
      return;
    }

    setError(null);
    setLoadingDetail(true);
    setLoadingRows(true);
    try {
      const token = await fUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [summaryRes, leaderboardRes] = await Promise.all([
        fetch(`${API_BASE}/api/communities/${groupId}/summary`, { headers }),
        fetch(`${API_BASE}/api/communities/${groupId}/leaderboard`, { headers }),
      ]);
      const summaryJson = await summaryRes.json().catch(() => ({}));
      const leaderboardJson = await leaderboardRes.json().catch(() => ({}));

      if (!summaryRes.ok || !summaryJson?.ok || !summaryJson?.group) {
        throw new Error(String(summaryJson?.error ?? "failed"));
      }

      setSummary(summaryJson.group as CommunityGroupSummaryNative);
      setRows(
        leaderboardRes.ok && leaderboardJson?.ok && Array.isArray(leaderboardJson.rows)
          ? (leaderboardJson.rows as CommunityGroupLeaderboardRowNative[])
          : []
      );
    } catch {
      setError(msg(language, "読み込みに失敗しました。", "Load failed."));
      setRows([]);
    } finally {
      setLoadingDetail(false);
      setLoadingRows(false);
      setRefreshing(false);
    }
  }, [fUser, groupId, language]);

  useEffect(() => {
    void load();
  }, [load]);

  const metric = summary?.rankingMetric ?? "totalPoints";
  const mobileMetric = communityMetricToMobile(metric);
  const competitionLine = summary
    ? formatCommunityCompetitionLine(
        {
          rankingLeague: summary.rankingLeague ?? "all",
          rankingMetric: metric,
          rankingTeamIds: summary.rankingTeamIds,
        },
        language
      )
    : "";
  const rankingsLanguage = language === "en" ? "en" : "ja";

  const rankingRows: RankingRowWithCountry[] = useMemo(
    () =>
      rows.map((row) =>
        communityRowToRankingCardRow(
          row as Parameters<typeof communityRowToRankingCardRow>[0],
          metric
        )
      ),
    [metric, rows]
  );
  const top3 = rankingRows.slice(0, 3);
  const restRows = rankingRows.slice(3);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  const shareInvite = useCallback(async () => {
    const code = summary?.inviteCode;
    if (!code) return;
    try {
      await Share.share({
        message: msg(
          language,
          `${summary?.name ?? "UNITERZ"} の招待コード: ${code}`,
          `Invite code for ${summary?.name ?? "UNITERZ"}: ${code}`
        ),
      });
    } catch {
      Alert.alert(
        msg(language, "エラー", "Error"),
        msg(language, "共有に失敗しました。", "Could not share.")
      );
    }
  }, [language, summary?.inviteCode, summary?.name]);

  const archiveGroup = useCallback(() => {
    if (!summary || !fUser || !API_BASE) return;
    Alert.alert(
      msg(language, "グループを終了", "End group"),
      msg(
        language,
        `「${summary.name}」を終了しますか？`,
        `End "${summary.name}"?`
      ),
      [
        { text: msg(language, "キャンセル", "Cancel"), style: "cancel" },
        {
          text: msg(language, "終了する", "End"),
          style: "destructive",
          onPress: () => {
            void (async () => {
              setBusyAction("archive");
              try {
                const token = await fUser.getIdToken();
                const res = await fetch(`${API_BASE}/api/communities/${groupId}/archive`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json().catch(() => ({}));
                if (!res.ok || !json?.ok) throw new Error(String(json?.error ?? "failed"));
                Alert.alert("", msg(language, "グループを終了しました。", "Group ended."));
                navigation.goBack();
              } catch {
                Alert.alert(
                  msg(language, "エラー", "Error"),
                  msg(language, "グループ終了に失敗しました。", "Could not end group.")
                );
              } finally {
                setBusyAction(null);
              }
            })();
          },
        },
      ]
    );
  }, [fUser, groupId, language, navigation, summary]);

  const leaveGroup = useCallback(() => {
    if (!summary || !fUser || !API_BASE) return;
    Alert.alert(
      msg(language, "グループを退会", "Leave group"),
      msg(
        language,
        `「${summary.name}」から退会しますか？`,
        `Leave "${summary.name}"?`
      ),
      [
        { text: msg(language, "キャンセル", "Cancel"), style: "cancel" },
        {
          text: msg(language, "退会する", "Leave"),
          style: "destructive",
          onPress: () => {
            void (async () => {
              setBusyAction("leave");
              try {
                const token = await fUser.getIdToken();
                const res = await fetch(`${API_BASE}/api/communities/${groupId}/leave`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json().catch(() => ({}));
                if (!res.ok || !json?.ok) throw new Error(String(json?.error ?? "failed"));
                Alert.alert("", msg(language, "退会しました。", "Left group."));
                navigation.goBack();
              } catch {
                Alert.alert(
                  msg(language, "エラー", "Error"),
                  msg(language, "退会に失敗しました。", "Could not leave group.")
                );
              } finally {
                setBusyAction(null);
              }
            })();
          },
        },
      ]
    );
  }, [fUser, groupId, language, navigation, summary]);

  return (
    <MobilePageShell
      title={summary?.name || "GROUP DETAIL"}
      appBackground
      onClose={() => navigation.goBack()}
    >
      {loadingDetail ? (
        <ActivityIndicator color={colors.accentCyan} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accentCyan}
            />
          }
        >
          {summary?.headerImageUrl ? (
            <View style={styles.bannerWrap}>
              <Image source={{ uri: summary.headerImageUrl }} style={styles.banner} resizeMode="cover" />
              <LinearGradient
                colors={["rgba(2,6,23,0)", "rgba(2,6,23,0.82)"]}
                style={StyleSheet.absoluteFillObject}
              />
            </View>
          ) : null}

          {error ? (
            <View style={styles.panel}>
              <Text style={styles.empty}>{error}</Text>
            </View>
          ) : null}

          {summary ? (
            <>
              <View style={styles.panel}>
                <PanelGlow />
                <Text style={styles.kicker}>COMMUNITY GROUP</Text>
                <Text style={styles.title}>{summary.name}</Text>
                {summary.description ? (
                  <Text style={styles.description}>{summary.description}</Text>
                ) : null}
                <Text style={styles.meta}>
                  {msg(language, "参加人数", "Members")}: {summary.memberCount} · {competitionLine} ·{" "}
                  {periodLabel("from_now", language)}
                </Text>
                {summary.archived ? (
                  <View style={styles.archivedBadge}>
                    <MaterialCommunityIcons name="archive-lock-outline" size={14} color="#fbbf24" />
                    <Text style={styles.archivedText}>
                      {msg(language, "このグループは終了しています。", "This group has ended.")}
                    </Text>
                  </View>
                ) : null}
              </View>

              {summary.isOwner && !summary.archived ? (
                <View style={styles.panel}>
                  <PanelGlow tone="amber" />
                  <Text style={styles.sectionLabel}>{msg(language, "招待コード", "Invite code")}</Text>
                  {summary.inviteCode ? (
                    <View style={styles.inviteRow}>
                      <Text style={styles.inviteCode} numberOfLines={1}>
                        {summary.inviteCode}
                      </Text>
                      <Pressable style={styles.iconButton} onPress={shareInvite} accessibilityRole="button">
                        <MaterialCommunityIcons name="share-variant" size={16} color="#cffafe" />
                        <Text style={styles.iconButtonText}>{msg(language, "共有", "Share")}</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Text style={styles.description}>
                      {msg(
                        language,
                        "このグループには招待コードが保存されていません。新規作成時に表示されたコードをご利用ください。",
                        "Invite code is not stored for this group. Create a new group to get a code."
                      )}
                    </Text>
                  )}
                  <Pressable
                    style={[styles.dangerButton, busyAction === "archive" && styles.disabledButton]}
                    onPress={archiveGroup}
                    disabled={busyAction === "archive"}
                    accessibilityRole="button"
                  >
                    <Text style={styles.dangerButtonText}>
                      {busyAction === "archive"
                        ? msg(language, "処理中…", "Processing…")
                        : msg(language, "グループを終了する", "End this group")}
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {!summary.isOwner && !summary.archived ? (
                <Pressable
                  style={[styles.leaveButton, busyAction === "leave" && styles.disabledButton]}
                  onPress={leaveGroup}
                  disabled={busyAction === "leave"}
                  accessibilityRole="button"
                >
                  <Text style={styles.leaveButtonText}>
                    {busyAction === "leave"
                      ? msg(language, "処理中…", "Processing…")
                      : msg(language, "グループを退会", "Leave group")}
                  </Text>
                </Pressable>
              ) : null}

              <View style={styles.rankingHeader}>
                <View style={styles.rule} />
                <Text style={styles.rankingLabel}>{msg(language, "ランキング", "Ranking")}</Text>
                <View style={styles.rule} />
              </View>

              {loadingRows ? (
                <View style={styles.panel}>
                  <ActivityIndicator color={colors.accentCyan} />
                </View>
              ) : rankingRows.length === 0 ? (
                <Text style={styles.empty}>
                  {msg(language, "まだエントリーがありません。", "No entries yet.")}
                </Text>
              ) : (
                <View style={styles.rankPanel}>
                  <RankingsTopPodiumNative
                    rows={top3}
                    metric={mobileMetric}
                    language={rankingsLanguage}
                  />
                  {restRows.map((row, index) => (
                    <RankingListCardNative
                      key={row.uid}
                      row={row}
                      rank={index + 4}
                      metric={mobileMetric}
                      language={rankingsLanguage}
                    />
                  ))}
                </View>
              )}
            </>
          ) : null}
        </ScrollView>
      )}
    </MobilePageShell>
  );
}

function PanelGlow({ tone = "cyan" }: { tone?: "cyan" | "amber" }) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={
        tone === "amber"
          ? ["rgba(251,191,36,0.1)", "rgba(251,191,36,0.02)", "rgba(0,0,0,0)"]
          : ["rgba(34,211,238,0.11)", "rgba(34,211,238,0.025)", "rgba(0,0,0,0)"]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFillObject}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: 14 },
  bannerWrap: {
    height: 148,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.2)",
    backgroundColor: "rgba(15,23,42,0.6)",
  },
  banner: {
    width: "100%",
    height: "100%",
  },
  panel: {
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.22)",
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(2,6,23,0.54)",
  },
  kicker: {
    color: "rgba(103,232,249,0.76)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2.2,
    fontFamily: fonts.metric,
  },
  title: {
    marginTop: 6,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26,
  },
  description: {
    marginTop: 9,
    color: "rgba(255,255,255,0.66)",
    fontSize: 13,
    lineHeight: 21,
  },
  meta: {
    marginTop: 12,
    color: "rgba(255,255,255,0.46)",
    fontSize: 11,
    lineHeight: 18,
    letterSpacing: 0.8,
    fontFamily: fonts.metric,
    textTransform: "uppercase",
  },
  archivedBadge: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.28)",
    backgroundColor: "rgba(251,191,36,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  archivedText: {
    color: "rgba(253,230,138,0.94)",
    fontSize: 12,
    fontWeight: "700",
  },
  sectionLabel: {
    color: "rgba(186,230,253,0.86)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    fontFamily: fonts.metric,
  },
  inviteRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inviteCode: {
    flex: 1,
    color: "rgba(236,254,255,0.96)",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2.2,
    fontFamily: fonts.metric,
  },
  iconButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.28)",
    backgroundColor: "rgba(34,211,238,0.1)",
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  iconButtonText: {
    color: "rgba(236,254,255,0.92)",
    fontSize: 12,
    fontWeight: "800",
  },
  dangerButton: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.36)",
    backgroundColor: "rgba(127,29,29,0.28)",
    paddingVertical: 11,
    alignItems: "center",
  },
  dangerButtonText: {
    color: "rgba(254,202,202,0.94)",
    fontSize: 14,
    fontWeight: "800",
  },
  leaveButton: {
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.16)",
    backgroundColor: "rgba(34,211,238,0.055)",
    paddingVertical: 12,
    alignItems: "center",
  },
  leaveButtonText: {
    color: "rgba(207,250,254,0.76)",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.4,
    fontFamily: fonts.metric,
  },
  disabledButton: {
    opacity: 0.55,
  },
  rankingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  rankingLabel: {
    color: "rgba(186,230,253,0.88)",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2.4,
  },
  rule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(34,211,238,0.24)",
  },
  rankPanel: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.18)",
    borderRadius: 16,
    backgroundColor: "rgba(2,6,23,0.36)",
  },
  empty: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
    fontSize: 13,
  },
});
