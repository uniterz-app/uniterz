import { useCallback, useEffect, useMemo, useState } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Language } from "../../../../../lib/i18n/language";
import { buildCommunityInviteShareText } from "../../../../../lib/communities/inviteShare";
import {
  communityMetricToMobile,
  communityRowToRankingCardRow,
} from "../../../../../lib/communities/leaderboardDisplayRow";
import { profilePathKeyFromRow } from "../../../../../lib/profile/profilePathKey";
import { SkeletonScanNative } from "../../components/SkeletonScanNative";
import {
  RankingsCyberPanelNative,
  RankingsCyberSectionLabelNative,
} from "../rankings/RankingsCyberPanelNative";
import RankingsListEntranceRowNative from "../rankings/RankingsListEntranceRowNative";
import { RankingListCardNative } from "../rankings/RankingsRankingCards";
import type { RankingsLanguage } from "../rankings/rankingsTexts";
import {
  fetchCommunityGroupDetail,
  getCachedCommunityGroupDetail,
  invalidateCommunityGroupDetail,
  listPreviewToSummary,
} from "./communityGroupDetailCacheNative";
import { communityApiUrl, communityAuthHeader, type CommunityGroupListPreview, type CommunityGroupSummary } from "./communityApiNative";
import CommunityGroupHeaderHeroNative from "./CommunityGroupHeaderHeroNative";
import CommunityGroupZoneLabelNative from "./CommunityGroupZoneLabelNative";
import { COMMUNITY_GROUP_PANEL_PADDING_X } from "../../../../../lib/communities/communityGroupShell";
import { RankingsShellGridOverlay } from "../rankings/rankingsUiDecorations";
import { copyTextNative, shareTextNative } from "./copyTextNative";
import { getShareAppOrigin } from "../../../../../lib/share/shareAppUrls";
import { communityMono, communityPressableTapStyle } from "./communityCrtThemeNative";
import { COMMUNITY_GROUP_HERO_BG } from "../../../../../lib/communities/communityGroupHeroLayout";

type Props = {
  groupId: string;
  language: Language;
  listPreview?: CommunityGroupListPreview | null;
  getIdToken: () => Promise<string>;
  /** 親 ScrollView に任せる場合は false */
  scrollEnabled?: boolean;
  reloadToken?: number;
  onSummaryLoaded?: (summary: CommunityGroupSummary) => void;
  onExitAction?: () => void;
  onRequestEndGroup?: (groupName: string) => void;
  onOpenProfile?: (handle: string) => void;
  onImageUpdated?: () => void;
  /** ヘッダー画像編集中 — 親 ScrollView 制御用 */
  onHeaderImageEditingChange?: (editing: boolean) => void;
  /** `CommunityGroupDetailCard` 内 — 余白を詰めてヒーローを上端に揃える */
  inDetailCard?: boolean;
};

export default function CommunityGroupDetailViewNative({
  groupId,
  language,
  listPreview = null,
  getIdToken,
  scrollEnabled = true,
  reloadToken = 0,
  onSummaryLoaded,
  onExitAction,
  onRequestEndGroup,
  onOpenProfile,
  onImageUpdated,
  onHeaderImageEditingChange,
  inDetailCard = false,
}: Props) {
  const initialCached = getCachedCommunityGroupDetail(groupId);
  const [summary, setSummary] = useState(() =>
    initialCached?.summary ?? (listPreview ? listPreviewToSummary(groupId, listPreview) : null)
  );
  const [rows, setRows] = useState(() => initialCached?.rows ?? []);
  const [metric, setMetric] = useState(() => initialCached?.metric ?? listPreview?.rankingMetric ?? "totalPoints");
  const [loadingDetail, setLoadingDetail] = useState(() => !initialCached && !listPreview);
  const [loadingRows, setLoadingRows] = useState(() => !initialCached);

  const scrollStyle = useMemo(
    () => [
      styles.scroll,
      inDetailCard && styles.scrollInDetailCard,
    ],
    [inDetailCard]
  );

  const load = useCallback(async () => {
    if (!groupId) return;
    const cached = getCachedCommunityGroupDetail(groupId);
    if (cached) {
      setSummary(cached.summary);
      onSummaryLoaded?.(cached.summary);
      setRows(cached.rows);
      setMetric(cached.metric);
      setLoadingDetail(false);
      setLoadingRows(false);
    } else if (listPreview) {
      const previewSummary = listPreviewToSummary(groupId, listPreview);
      setSummary(previewSummary);
      onSummaryLoaded?.(previewSummary);
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
        cyberAlert("", language === "en" ? "Load failed." : "読み込みに失敗しました。");
      }
      setLoadingDetail(false);
      setLoadingRows(false);
      return;
    }
    setSummary(entry.summary);
    onSummaryLoaded?.(entry.summary);
    setRows(entry.rows);
    setMetric(entry.metric);
    setLoadingDetail(false);
    setLoadingRows(false);
  }, [groupId, listPreview, language, getIdToken, onSummaryLoaded]);

  useEffect(() => {
    void load();
  }, [load, reloadToken]);

  const t = useMemo(
    () =>
      language === "en"
        ? {
            ranking: "RANKING",
            inviteLabel: "Invite code",
            copyInvite: "Copy",
            shareInvite: "Share",
            inviteUnavailable:
              "Invite code is not stored for this group. Create a new group to get a code.",
            endGroup: "End this group",
            leave: "Leave group",
            noEntries: "No entries yet.",
          }
        : {
            ranking: "RANKING",
            inviteLabel: "招待コード",
            copyInvite: "コピー",
            shareInvite: "共有",
            inviteUnavailable:
              "このグループには招待コードが保存されていません。新規作成時に表示されたコードをご利用ください。",
            endGroup: "グループを終了する",
            leave: "グループを退会",
            noEntries: "まだエントリーがありません。",
          },
    [language]
  );

  const rankMetricForProfile = communityMetricToMobile(metric);
  const rankingCardRows = useMemo(() => rows.map((r) => communityRowToRankingCardRow(r, metric)), [rows, metric]);
  const lang = language as RankingsLanguage;
  const rankListEntranceKey = useMemo(
    () => `${groupId}:${metric}:${rows.map((r) => `${r.uid}:${r.rank}`).join("|")}`,
    [groupId, metric, rows]
  );

  const onCopyInvite = useCallback(async () => {
    const code = summary?.inviteCode;
    if (!code) return;
    const ok = await copyTextNative(code);
    cyberAlert(
      "",
      ok
        ? language === "en"
          ? "Invite code copied."
          : "招待コードをコピーしました。"
        : language === "en"
          ? "Could not copy."
          : "コピーできませんでした。"
    );
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
    cyberAlert(
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
                cyberAlert("", String(json?.error ?? "failed"));
                return;
              }
              cyberAlert("", language === "en" ? "Left group." : "退会しました。");
              invalidateCommunityGroupDetail(groupId);
              onExitAction?.();
            })();
          },
        },
      ]
    );
  }, [groupId, language, getIdToken, onExitAction]);

  const handleHeaderImageUpdated = useCallback(
    (patch: { headerImageUrl?: string | null; headerImagePositionY?: number }) => {
      setSummary((prev) => (prev ? { ...prev, ...patch } : prev));
      invalidateCommunityGroupDetail(groupId);
      onImageUpdated?.();
    },
    [groupId, onImageUpdated]
  );

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

  const content = (
    <>
      {summary ? (
        <CommunityGroupHeaderHeroNative
          groupId={groupId}
          language={language}
          summary={summary}
          getIdToken={getIdToken}
          capTop={inDetailCard}
          onImageUpdated={handleHeaderImageUpdated}
          onImageEditingChange={onHeaderImageEditingChange}
        />
      ) : null}

      <View style={styles.rankingZoneLabel}>
        <CommunityGroupZoneLabelNative>{t.ranking}</CommunityGroupZoneLabelNative>
      </View>

      {loadingRows ? (
        <RankingsCyberPanelNative subtle compact style={styles.rankingSkeletonPanel}>
          <SkeletonScanNative style={styles.skeletonLine} />
          <SkeletonScanNative style={styles.skeletonRow} />
          <SkeletonScanNative style={styles.skeletonRow} />
          <SkeletonScanNative style={styles.skeletonRow} />
        </RankingsCyberPanelNative>
      ) : rankingCardRows.length === 0 ? (
        <Text style={styles.emptyRank}>{t.noEntries}</Text>
      ) : (
        <View style={styles.rankingList}>
          {rankingCardRows.map((row, i) => (
            <RankingsListEntranceRowNative
              key={row.uid ?? row.handle ?? `r-${i + 1}`}
              index={i}
              entranceKey={rankListEntranceKey}
            >
              <RankingListCardNative
                row={row}
                rank={i + 1}
                metric={rankMetricForProfile}
                language={lang}
                onPress={onOpenProfile ? () => openProfile(row) : undefined}
              />
            </RankingsListEntranceRowNative>
          ))}
        </View>
      )}

      {summary?.isOwner && !summary.archived ? (
        <RankingsCyberPanelNative subtle compact style={styles.invitePanel}>
          <RankingsCyberSectionLabelNative subtle style={styles.sectionLabelInPanel}>
            {t.inviteLabel}
          </RankingsCyberSectionLabelNative>
          {summary.inviteCode ? (
            <View style={styles.inviteCodeRow}>
              <Text style={styles.inviteCode}>{summary.inviteCode}</Text>
              <View style={styles.inviteActions}>
                <Pressable
                  onPress={() => void onCopyInvite()}
                  style={({ pressed }) => [styles.inviteBtn, pressed && communityPressableTapStyle(true)]}
                  accessibilityLabel={t.copyInvite}
                >
                  <MaterialCommunityIcons name="content-copy" size={14} color="rgba(186,230,253,0.8)" />
                  <Text style={styles.inviteBtnText}>{t.copyInvite}</Text>
                </Pressable>
                <Pressable
                  onPress={() => void onShareInvite()}
                  style={({ pressed }) => [styles.inviteBtn, styles.inviteBtnPrimary, pressed && communityPressableTapStyle(true)]}
                  accessibilityLabel={t.shareInvite}
                >
                  <MaterialCommunityIcons name="share-variant" size={14} color="rgba(224,242,254,0.95)" />
                  <Text style={[styles.inviteBtnText, styles.inviteBtnTextPrimary]}>{t.shareInvite}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Text style={styles.inviteUnavailable}>{t.inviteUnavailable}</Text>
          )}
          <Pressable
            onPress={() => onRequestEndGroup?.(summary.name)}
            style={({ pressed }) => [styles.endGroupBtn, pressed && communityPressableTapStyle(true)]}
          >
            <Text style={styles.endGroupText}>{t.endGroup}</Text>
          </Pressable>
        </RankingsCyberPanelNative>
      ) : null}

      {!summary?.isOwner && !summary?.archived ? (
        <Pressable
          onPress={() => void onLeave()}
          style={({ pressed }) => [styles.leaveBtn, pressed && communityPressableTapStyle(true)]}
        >
          <Text style={styles.leaveText}>{t.leave}</Text>
        </Pressable>
      ) : null}
    </>
  );

  return (
    <View style={styles.root}>
      <RankingsShellGridOverlay borderRadius={16} />
      {scrollEnabled ? (
        <ScrollView contentContainerStyle={scrollStyle} showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        <View style={scrollStyle}>{content}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 320,
    backgroundColor: COMMUNITY_GROUP_HERO_BG,
    borderRadius: 16,
    overflow: "hidden",
  },
  scroll: {
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 12,
  },
  scrollInDetailCard: {
    paddingTop: 0,
    paddingHorizontal: 0,
  },
  loadingWrap: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  rankingZoneLabel: {
    paddingHorizontal: COMMUNITY_GROUP_PANEL_PADDING_X,
    marginBottom: 8,
  },
  sectionLabelInPanel: {
    marginBottom: 10,
    paddingBottom: 6,
  },
  inviteCodeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  inviteCode: {
    flex: 1,
    minWidth: 120,
    fontSize: 17,
    fontWeight: "600",
    fontFamily: communityMono,
    letterSpacing: 2.8,
    color: "rgba(224,242,254,0.92)",
  },
  inviteActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.18)",
    backgroundColor: "rgba(34,211,238,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  inviteBtnPrimary: {
    borderColor: "rgba(34,211,238,0.22)",
    backgroundColor: "rgba(34,211,238,0.08)",
  },
  inviteBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(186,230,253,0.8)",
  },
  inviteBtnTextPrimary: {
    color: "rgba(224,242,254,0.95)",
  },
  inviteUnavailable: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.45)",
  },
  endGroupBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.35)",
    backgroundColor: "rgba(127,29,29,0.3)",
    paddingVertical: 10,
    alignItems: "center",
  },
  endGroupText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(254,202,202,0.95)",
  },
  leaveBtn: {
    marginTop: 4,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.16)",
    backgroundColor: "rgba(34,211,238,0.05)",
    paddingVertical: 10,
    alignItems: "center",
  },
  leaveText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: communityMono,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(186,230,253,0.7)",
  },
  rankingSkeletonPanel: {
    marginBottom: 8,
  },
  skeletonLine: {
    height: 12,
    width: "42%",
    marginBottom: 10,
    borderRadius: 2,
    backgroundColor: "rgba(34,211,238,0.1)",
  },
  skeletonRow: {
    height: 44,
    marginBottom: 8,
    borderRadius: 2,
    backgroundColor: "rgba(34,211,238,0.08)",
  },
  emptyRank: {
    textAlign: "center",
    fontSize: 14,
    color: "rgba(255,255,255,0.45)",
    marginVertical: 24,
  },
  rankingList: {
    marginTop: -4,
    marginBottom: 16,
    gap: 0,
  },
  invitePanel: {
    marginTop: 4,
  },
});
