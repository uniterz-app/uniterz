import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Language } from "../../../../../lib/i18n/language";
import { formatCommunityCompetitionLine } from "../../../../../lib/communities/competitionDisplay";
import { buildCommunityInviteShareText } from "../../../../../lib/communities/inviteShare";
import { periodLabel } from "../../../../../lib/communities/labels";
import {
  communityMetricToMobile,
  communityRowToRankingCardRow,
} from "../../../../../lib/communities/leaderboardDisplayRow";
import { profilePathKeyFromRow } from "../../../../../lib/profile/profilePathKey";
import { RankingsShellGridOverlay } from "../rankings/rankingsUiDecorations";
import { RankingsTopPodiumNative, RankingListCardNative } from "../rankings/RankingsRankingCards";
import type { RankingsLanguage } from "../rankings/rankingsTexts";
import {
  fetchCommunityGroupDetail,
  getCachedCommunityGroupDetail,
  invalidateCommunityGroupDetail,
  listPreviewToSummary,
} from "./communityGroupDetailCacheNative";
import { communityApiUrl, communityAuthHeader, type CommunityGroupListPreview } from "./communityApiNative";
import { copyTextNative, shareTextNative } from "./copyTextNative";
import { getShareAppOrigin } from "../../../../../lib/share/shareAppUrls";
import { communityPressableTapStyle } from "./communityCrtThemeNative";

type Props = {
  groupId: string;
  language: Language;
  listPreview?: CommunityGroupListPreview | null;
  getIdToken: () => Promise<string>;
  onExitAction?: () => void;
  onRequestEndGroup?: (groupName: string) => void;
  onOpenProfile?: (handle: string) => void;
};

export default function CommunityGroupDetailViewNative({
  groupId,
  language,
  listPreview = null,
  getIdToken,
  onExitAction,
  onRequestEndGroup,
  onOpenProfile,
}: Props) {
  const initialCached = getCachedCommunityGroupDetail(groupId);
  const [summary, setSummary] = useState(() =>
    initialCached?.summary ?? (listPreview ? listPreviewToSummary(groupId, listPreview) : null)
  );
  const [rows, setRows] = useState(() => initialCached?.rows ?? []);
  const [metric, setMetric] = useState(() => initialCached?.metric ?? listPreview?.rankingMetric ?? "totalPoints");
  const [loadingDetail, setLoadingDetail] = useState(() => !initialCached && !listPreview);
  const [loadingRows, setLoadingRows] = useState(() => !initialCached);

  const load = useCallback(async () => {
    if (!groupId) return;
    const cached = getCachedCommunityGroupDetail(groupId);
    if (cached) {
      setSummary(cached.summary);
      setRows(cached.rows);
      setMetric(cached.metric);
      setLoadingDetail(false);
      setLoadingRows(false);
    } else if (listPreview) {
      setSummary(listPreviewToSummary(groupId, listPreview));
      setMetric(listPreview.rankingMetric);
      setLoadingDetail(false);
      setLoadingRows(true);
    } else {
      setLoadingDetail(true);
      setLoadingRows(true);
    }

    const entry = await fetchCommunityGroupDetail(groupId, getIdToken);
    if (!entry) {
      if (!cached && !listPreview) {
        Alert.alert("", language === "en" ? "Load failed." : "読み込みに失敗しました。");
      }
      setLoadingDetail(false);
      setLoadingRows(false);
      return;
    }
    setSummary(entry.summary);
    setRows(entry.rows);
    setMetric(entry.metric);
    setLoadingDetail(false);
    setLoadingRows(false);
  }, [groupId, listPreview, language, getIdToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const t = useMemo(
    () =>
      language === "en"
        ? {
            members: "Members",
            ranking: "Ranking",
            ended: "This group has ended.",
            inviteLabel: "Invite code",
            copyInvite: "Copy",
            shareInvite: "Share",
            inviteUnavailable:
              "Invite code is not stored for this group. Create a new group to get a code.",
            endGroup: "End this group",
            leave: "Leave group",
          }
        : {
            members: "参加人数",
            ranking: "ランキング",
            ended: "このグループは終了しています。",
            inviteLabel: "招待コード",
            copyInvite: "コピー",
            shareInvite: "共有",
            inviteUnavailable:
              "このグループには招待コードが保存されていません。新規作成時に表示されたコードをご利用ください。",
            endGroup: "グループを終了する",
            leave: "グループを退会",
          },
    [language]
  );

  const rankMetricForProfile = communityMetricToMobile(metric);
  const rankingCardRows = useMemo(() => rows.map((r) => communityRowToRankingCardRow(r, metric)), [rows, metric]);
  const top3 = rankingCardRows.slice(0, 3);
  const restRows = rankingCardRows.slice(3);
  const lang = language as RankingsLanguage;
  const rankListEntranceKey = useMemo(
    () => `${groupId}:${metric}:${rows.map((r) => `${r.uid}:${r.rank}`).join("|")}`,
    [groupId, metric, rows]
  );

  const competition = summary
    ? formatCommunityCompetitionLine(
        {
          rankingLeague: summary.rankingLeague ?? "all",
          rankingMetric: summary.rankingMetric,
          rankingTeamIds: summary.rankingTeamIds,
        },
        language
      )
    : "";

  const onCopyInvite = useCallback(async () => {
    const code = summary?.inviteCode;
    if (!code) return;
    const ok = await copyTextNative(code);
    Alert.alert("", ok ? (language === "en" ? "Invite code copied." : "招待コードをコピーしました。") : (language === "en" ? "Could not copy." : "コピーできませんでした。"));
  }, [summary?.inviteCode, language]);

  const onShareInvite = useCallback(async () => {
    const code = summary?.inviteCode;
    if (!code) return;
    const base = buildCommunityInviteShareText({
      inviteCode: code,
      groupName: summary?.name ?? undefined,
      language,
    });
    const origin = getShareAppOrigin();
    const message = base.includes(origin) ? base : `${base}\n\n${origin}`;
    await shareTextNative(t.shareInvite, message);
  }, [summary?.inviteCode, summary?.name, language, t.shareInvite]);

  const onLeave = useCallback(async () => {
    Alert.alert(
      "",
      language === "en" ? "Leave this group?" : "このグループから退会しますか？",
      [
        { text: language === "en" ? "Cancel" : "キャンセル", style: "cancel" },
        {
          text: language === "en" ? "Leave" : "退会",
          style: "destructive",
          onPress: () => {
            void (async () => {
              const h = await communityAuthHeader(getIdToken);
              if (!h) return;
              const res = await fetch(communityApiUrl(`/api/communities/${groupId}/leave`), {
                method: "POST",
                headers: { Authorization: h },
              });
              const json = await res.json().catch(() => ({}));
              if (!res.ok || !json?.ok) {
                Alert.alert("", String(json?.error ?? "failed"));
                return;
              }
              Alert.alert("", language === "en" ? "Left group." : "退会しました。");
              invalidateCommunityGroupDetail(groupId);
              onExitAction?.();
            })();
          },
        },
      ]
    );
  }, [groupId, language, getIdToken, onExitAction]);

  const openProfile = useCallback(
    (row: (typeof rankingCardRows)[number]) => {
      const handle = profilePathKeyFromRow(row);
      if (handle && onOpenProfile) onOpenProfile(handle);
    },
    [onOpenProfile]
  );

  if (loadingDetail && !summary) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color="#22d3ee" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <RankingsShellGridOverlay borderRadius={16} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {summary?.headerImageUrl ? (
          <Image source={{ uri: summary.headerImageUrl }} style={styles.banner} resizeMode="cover" />
        ) : null}

        <View style={styles.headerBlock}>
          <Text style={styles.groupName}>{summary?.name}</Text>
          {summary?.description ? <Text style={styles.description}>{summary.description}</Text> : null}
          <Text style={styles.competition}>{competition}</Text>
          <Text style={styles.period}>{periodLabel("from_now", language)}</Text>
          <Text style={styles.memberCount}>
            {t.members}: {summary?.memberCount ?? 0}
          </Text>
          {summary?.archived ? <Text style={styles.ended}>{t.ended}</Text> : null}
        </View>

        {summary?.inviteCode ? (
          <View style={styles.inviteRow}>
            <View style={styles.inviteLeft}>
              <Text style={styles.inviteLabel}>{t.inviteLabel}</Text>
              <Text style={styles.inviteCode}>{summary.inviteCode}</Text>
            </View>
            <Pressable onPress={() => void onCopyInvite()} style={({ pressed }) => [styles.inviteBtn, pressed && communityPressableTapStyle(true)]}>
              <Text style={styles.inviteBtnText}>{t.copyInvite}</Text>
            </Pressable>
            <Pressable onPress={() => void onShareInvite()} style={({ pressed }) => [styles.inviteBtn, pressed && communityPressableTapStyle(true)]}>
              <Text style={styles.inviteBtnText}>{t.shareInvite}</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.inviteUnavailable}>{t.inviteUnavailable}</Text>
        )}

        <Text style={styles.sectionTitle}>{t.ranking}</Text>
        {loadingRows ? (
          <ActivityIndicator color="#22d3ee" style={{ marginVertical: 24 }} />
        ) : rankingCardRows.length === 0 ? (
          <Text style={styles.emptyRank}>NO DATA</Text>
        ) : (
          <>
            <RankingsTopPodiumNative
              rows={top3}
              metric={rankMetricForProfile}
              language={lang}
              onPressProfile={onOpenProfile ? openProfile : undefined}
              entranceKey={rankListEntranceKey}
            />
            <View style={styles.list}>
              {restRows.map((row, i) => (
                <RankingListCardNative
                  key={row.uid ?? row.handle ?? `r-${i + 4}`}
                  row={row}
                  rank={i + 4}
                  metric={rankMetricForProfile}
                  language={lang}
                  onPress={onOpenProfile ? () => openProfile(row) : undefined}
                />
              ))}
            </View>
          </>
        )}

        {!summary?.archived ? (
          <View style={styles.actions}>
            {summary?.isOwner ? (
              <Pressable
                onPress={() => onRequestEndGroup?.(summary.name)}
                style={({ pressed }) => [styles.dangerBtn, pressed && communityPressableTapStyle(true)]}
              >
                <Text style={styles.dangerText}>{t.endGroup}</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => void onLeave()} style={({ pressed }) => [styles.dangerBtn, pressed && communityPressableTapStyle(true)]}>
                <Text style={styles.dangerText}>{t.leave}</Text>
              </Pressable>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(5,8,20,0.88)",
    minHeight: 320,
  },
  scroll: {
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 12,
  },
  loadingWrap: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  banner: {
    width: "100%",
    height: 140,
    borderRadius: 8,
    marginBottom: 12,
  },
  headerBlock: {
    marginBottom: 12,
  },
  groupName: {
    fontSize: 22,
    fontWeight: "700",
    color: "rgba(248,250,252,0.96)",
  },
  description: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.65)",
  },
  competition: {
    marginTop: 8,
    fontSize: 12,
    color: "rgba(165,243,252,0.75)",
  },
  period: {
    marginTop: 4,
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
  },
  memberCount: {
    marginTop: 6,
    fontSize: 12,
    color: "rgba(167,243,208,0.9)",
    fontWeight: "600",
  },
  ended: {
    marginTop: 8,
    fontSize: 12,
    color: "rgba(251,113,133,0.9)",
  },
  inviteRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.2)",
    backgroundColor: "rgba(34,211,238,0.05)",
  },
  inviteLeft: {
    flex: 1,
    minWidth: 120,
  },
  inviteLabel: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
  },
  inviteCode: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 3,
    color: "#fff",
  },
  inviteBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  inviteBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
  },
  inviteUnavailable: {
    fontSize: 11,
    lineHeight: 17,
    color: "rgba(255,255,255,0.45)",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(165,243,252,0.85)",
    marginBottom: 10,
  },
  emptyRank: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 3,
    color: "rgba(255,255,255,0.35)",
    marginVertical: 24,
  },
  list: {
    gap: 8,
    marginTop: 8,
  },
  actions: {
    marginTop: 20,
  },
  dangerBtn: {
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.35)",
    backgroundColor: "rgba(244,63,94,0.08)",
    paddingVertical: 12,
    alignItems: "center",
  },
  dangerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(254,205,211,0.95)",
  },
});
