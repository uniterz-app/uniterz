/**
 * Web `CommunityGroupDetailView` 相当
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import type { LeaderboardsStackParamList } from "../../navigation/types";
import { colors, fonts, spacing } from "../../theme/tokens";
import type { Language } from "../../../../../lib/i18n/language";
import type { CommunityLeague, CommunityMetric } from "../../../../../lib/communities/types";
import { formatCommunityCompetitionLine } from "../../../../../lib/communities/competitionDisplay";
import { periodLabel } from "../../../../../lib/communities/labels";
import {
  communityMetricToMobile,
  communityRowToRankingCardRow,
} from "../../../../../lib/communities/leaderboardDisplayRow";
import { RankingListCardNative, RankingsTopPodiumNative } from "../rankings/RankingsUiParts";

const API_BASE = process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL?.replace(/\/$/, "") ?? "";

type CommunityGroupSummary = {
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

type CommunityGroupLeaderboardRow = {
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

type DetailState = {
  summary: CommunityGroupSummary | null;
  rows: CommunityGroupLeaderboardRow[];
  loading: boolean;
  error: string | null;
};

type JsonObject = Record<string, unknown>;

function getErrorMessage(raw: unknown): string {
  if (raw && typeof raw === "object" && "error" in raw) {
    return String((raw as { error?: unknown }).error ?? "failed");
  }
  return "failed";
}

export default function CommunityDetailScreenNative() {
  const route = useRoute<RouteProp<LeaderboardsStackParamList, "CommunityDetail">>();
  const navigation = useNavigation<NativeStackNavigationProp<LeaderboardsStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { groupId } = route.params;
  const [state, setState] = useState<DetailState>({
    summary: null,
    rows: [],
    loading: true,
    error: null,
  });
  const [actionBusy, setActionBusy] = useState(false);

  const language: Language = "ja";
  const summary = state.summary;

  const loadDetail = useCallback(async () => {
    if (!fUser || !API_BASE) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: API_BASE ? "ログインが必要です。" : "API が未設定です。",
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const token = await fUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [summaryRes, leaderboardRes] = await Promise.all([
        fetch(`${API_BASE}/api/communities/${groupId}/summary`, { headers }),
        fetch(`${API_BASE}/api/communities/${groupId}/leaderboard`, { headers }),
      ]);
      const summaryJson = (await summaryRes.json().catch(() => ({}))) as JsonObject;
      const leaderboardJson = (await leaderboardRes.json().catch(() => ({}))) as JsonObject;

      if (!summaryRes.ok || summaryJson.ok !== true || !summaryJson.group) {
        throw new Error(getErrorMessage(summaryJson));
      }

      setState({
        summary: summaryJson.group as CommunityGroupSummary,
        rows:
          leaderboardRes.ok && leaderboardJson.ok === true && Array.isArray(leaderboardJson.rows)
            ? (leaderboardJson.rows as CommunityGroupLeaderboardRow[])
            : [],
        loading: false,
        error: null,
      });
    } catch (e) {
      setState({
        summary: null,
        rows: [],
        loading: false,
        error: e instanceof Error ? e.message : "読み込みに失敗しました。",
      });
    }
  }, [fUser, groupId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const competitionLine = useMemo(() => {
    if (!summary) return "";
    return formatCommunityCompetitionLine(
      {
        rankingLeague: summary.rankingLeague ?? "all",
        rankingMetric: summary.rankingMetric,
        rankingTeamIds: summary.rankingTeamIds ?? [],
      },
      language
    );
  }, [summary, language]);

  const metric = summary ? communityMetricToMobile(summary.rankingMetric) : "totalScore";
  const rankingRows = useMemo(
    () => state.rows.map((row) => communityRowToRankingCardRow(row, summary?.rankingMetric ?? "totalPoints")),
    [state.rows, summary?.rankingMetric]
  );
  const top3 = rankingRows.slice(0, 3);
  const restRows = rankingRows.slice(3);

  const postGroupAction = useCallback(
    async (path: "archive" | "leave") => {
      if (!fUser || !API_BASE || actionBusy) return;
      setActionBusy(true);
      try {
        const token = await fUser.getIdToken();
        const res = await fetch(`${API_BASE}/api/communities/${groupId}/${path}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = (await res.json().catch(() => ({}))) as JsonObject;
        if (!res.ok || json.ok !== true) {
          throw new Error(getErrorMessage(json));
        }
        Alert.alert("", path === "archive" ? "グループを終了しました。" : "退会しました。");
        navigation.goBack();
      } catch (e) {
        Alert.alert("エラー", e instanceof Error ? e.message : "操作に失敗しました。");
      } finally {
        setActionBusy(false);
      }
    },
    [actionBusy, fUser, groupId, navigation]
  );

  const confirmArchive = useCallback(() => {
    Alert.alert("グループを終了", "このグループを終了しますか？", [
      { text: "キャンセル", style: "cancel" },
      { text: "終了する", style: "destructive", onPress: () => void postGroupAction("archive") },
    ]);
  }, [postGroupAction]);

  const confirmLeave = useCallback(() => {
    Alert.alert("グループを退会", "このグループから退会しますか？", [
      { text: "キャンセル", style: "cancel" },
      { text: "退会する", style: "destructive", onPress: () => void postGroupAction("leave") },
    ]);
  }, [postGroupAction]);

  const shareInvite = useCallback(async () => {
    if (!summary?.inviteCode) return;
    try {
      await Share.share({
        message: `UNITERZ コミュニティ「${summary.name}」の招待コード: ${summary.inviteCode}`,
      });
    } catch {
      Alert.alert("エラー", "招待を共有できませんでした。");
    }
  }, [summary?.inviteCode, summary?.name]);

  return (
    <MobilePageShell
      title={summary?.name || "Group"}
      appBackground
      onClose={() => navigation.goBack()}
    >
      {state.loading ? (
        <ActivityIndicator color={colors.accentCyan} style={{ marginTop: 40 }} />
      ) : state.error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>LOAD FAILED</Text>
          <Text style={styles.errorBody}>{state.error}</Text>
          <Pressable style={styles.retryButton} onPress={() => void loadDetail()}>
            <Text style={styles.retryButtonText}>再読み込み</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {summary?.headerImageUrl ? (
            <Image source={{ uri: summary.headerImageUrl }} style={styles.heroImage} />
          ) : null}

          {summary ? (
            <View style={styles.summaryPanel}>
              <View style={styles.panelGlow} pointerEvents="none" />
              <Text style={styles.kicker}>COMMUNITY_RANKING</Text>
              <Text style={styles.title}>{summary.name}</Text>
              {summary.description ? (
                <Text style={styles.description}>{summary.description}</Text>
              ) : null}
              <Text style={styles.metaLine}>
                参加人数: {summary.memberCount} · {competitionLine} ·{" "}
                {periodLabel("from_now", language)}
              </Text>
              {summary.archived ? <Text style={styles.ended}>このグループは終了しています。</Text> : null}
            </View>
          ) : null}

          {summary?.isOwner && !summary.archived ? (
            <View style={styles.actionPanel}>
              <Text style={styles.sectionLabel}>INVITE_CODE</Text>
              {summary.inviteCode ? (
                <View style={styles.inviteRow}>
                  <Text style={styles.inviteCode}>{summary.inviteCode}</Text>
                  <Pressable style={styles.smallButton} onPress={shareInvite}>
                    <MaterialCommunityIcons
                      name="share-variant"
                      size={14}
                      color="rgba(236,254,255,0.92)"
                    />
                    <Text style={styles.smallButtonText}>共有</Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={styles.mutedText}>
                  このグループには招待コードが保存されていません。
                </Text>
              )}
              <Pressable
                style={[styles.dangerButton, actionBusy && styles.disabledButton]}
                disabled={actionBusy}
                onPress={confirmArchive}
              >
                <Text style={styles.dangerButtonText}>
                  {actionBusy ? "処理中…" : "グループを終了する"}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {summary && !summary.isOwner && !summary.archived ? (
            <Pressable
              style={[styles.leaveButton, actionBusy && styles.disabledButton]}
              disabled={actionBusy}
              onPress={confirmLeave}
            >
              <Text style={styles.leaveButtonText}>{actionBusy ? "処理中…" : "グループを退会"}</Text>
            </Pressable>
          ) : null}

          <Text style={styles.sectionLabel}>RANKING</Text>
          {rankingRows.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.empty}>まだエントリーがありません。</Text>
            </View>
          ) : (
            <View style={styles.rankingSection}>
              <RankingsTopPodiumNative rows={top3} metric={metric} language={language} />
              <View style={styles.restList}>
                {restRows.map((row, index) => (
                  <RankingListCardNative
                    key={row.uid}
                    row={row}
                    rank={index + 4}
                    metric={metric}
                    language={language}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 12,
    paddingBottom: spacing.xl,
    gap: 12,
  },
  heroImage: {
    height: 144,
    marginHorizontal: -12,
    backgroundColor: "rgba(2,6,23,0.8)",
  },
  summaryPanel: {
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.24)",
    backgroundColor: "rgba(2,6,23,0.72)",
    padding: 14,
    gap: 8,
  },
  panelGlow: {
    position: "absolute",
    top: -40,
    right: -34,
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "rgba(34,211,238,0.12)",
  },
  kicker: {
    color: "rgba(103,232,249,0.72)",
    fontFamily: fonts.metric,
    fontSize: 11,
    letterSpacing: 1.8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 25,
  },
  description: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 14,
    lineHeight: 21,
  },
  metaLine: {
    color: "rgba(255,255,255,0.48)",
    fontFamily: fonts.metric,
    fontSize: 11,
    lineHeight: 17,
    letterSpacing: 0.6,
  },
  ended: {
    color: "rgba(253,230,138,0.92)",
    fontSize: 13,
  },
  actionPanel: {
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.18)",
    backgroundColor: "rgba(8,13,22,0.76)",
    padding: 12,
    gap: 10,
  },
  sectionLabel: {
    color: "rgba(165,243,252,0.72)",
    fontFamily: fonts.metric,
    fontSize: 11,
    letterSpacing: 1.8,
  },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inviteCode: {
    flex: 1,
    color: "rgba(236,254,255,0.96)",
    fontFamily: fonts.metricExtra,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 2.1,
  },
  smallButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.28)",
    backgroundColor: "rgba(34,211,238,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  smallButtonText: {
    color: "rgba(236,254,255,0.92)",
    fontSize: 12,
    fontWeight: "700",
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.42)",
    backgroundColor: "rgba(127,29,29,0.32)",
    paddingVertical: 10,
    alignItems: "center",
  },
  dangerButtonText: {
    color: "rgba(254,202,202,0.92)",
    fontSize: 13,
    fontWeight: "700",
  },
  leaveButton: {
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.2)",
    backgroundColor: "rgba(34,211,238,0.06)",
    paddingVertical: 11,
    alignItems: "center",
  },
  leaveButtonText: {
    color: "rgba(207,250,254,0.8)",
    fontFamily: fonts.metric,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  disabledButton: {
    opacity: 0.55,
  },
  mutedText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  rankingSection: {
    gap: 0,
  },
  restList: {
    gap: 0,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.14)",
    backgroundColor: "rgba(2,6,23,0.58)",
    paddingVertical: 28,
  },
  empty: {
    color: colors.textSecondary,
    textAlign: "center",
  },
  errorCard: {
    margin: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.3)",
    backgroundColor: "rgba(127,29,29,0.18)",
    padding: 16,
    gap: 10,
  },
  errorTitle: {
    color: "rgba(254,202,202,0.95)",
    fontFamily: fonts.metric,
    fontSize: 12,
    letterSpacing: 1.8,
  },
  errorBody: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 21,
  },
  retryButton: {
    borderWidth: 1,
    borderColor: colors.accentCyan,
    backgroundColor: "rgba(34,211,238,0.12)",
    paddingVertical: 10,
    alignItems: "center",
  },
  retryButtonText: {
    color: colors.textPrimary,
    fontWeight: "800",
  },
});
