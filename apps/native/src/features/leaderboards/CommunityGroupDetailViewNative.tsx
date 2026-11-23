import { useCallback, useEffect, useMemo, useState } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Language } from "../../../../../lib/i18n/language";
import { buildCommunityInviteShareText } from "../../../../../lib/communities/inviteShare";
import {
  communityMetricToMobile,
  communityRowToRankingCardRow,
} from "../../../../../lib/communities/leaderboardDisplayRow";
import { resortCommunityLeaderboardRows } from "../../../../../lib/communities/resortCommunityLeaderboardRows";
import {
  parseCommunityGamesScope,
  type CommunityGamesScope,
} from "../../../../../lib/communities/communityGamesScope";
import { metricLabel } from "../../../../../lib/communities/labels";
import type { CommunityMetric } from "../../../../../lib/communities/types";
import { warmPublicProfileFromRankingRowNative } from "../profile/warmPublicProfileNative";
import type { OpenPublicProfileWarm } from "../../navigation/navigateToPublicProfileNative";
import { SkeletonScanNative } from "../../components/SkeletonScanNative";
import { RankingsCyberPanelNative } from "../rankings/RankingsCyberPanelNative";
import RankingsListEntranceRowNative from "../rankings/RankingsListEntranceRowNative";
import { RankingListCardNative } from "../rankings/RankingsRankingCards";
import type { RankingsLanguage } from "../rankings/rankingsTexts";
import {
  fetchCommunityGroupDetail,
  getCachedCommunityGroupDetail,
  invalidateCommunityGroupDetail,
  listPreviewToSummary,
} from "./communityGroupDetailCacheNative";
import {
  communityApiUrl,
  communityAuthHeader,
  type CommunityGroupLeaderboardRow,
  type CommunityGroupListPreview,
  type CommunityGroupSummary,
} from "./communityApiNative";
import CommunityGroupHeaderHeroNative from "./CommunityGroupHeaderHeroNative";
import CommunityGroupViewBarNative from "./CommunityGroupViewBarNative";
import CommunityEditGroupModalNative from "./CommunityEditGroupModalNative";
import { CommunityModalBackdropNative } from "./CommunityCrtPartsNative";
import { RankingsShellGridOverlay } from "../rankings/rankingsUiDecorations";
import { copyTextNative, shareTextNative } from "./copyTextNative";
import { getShareAppOrigin } from "../../../../../lib/share/shareAppUrls";
import { communityMono, communityPressableTapStyle } from "./communityCrtThemeNative";
import { COMMUNITY_GROUP_HERO_BG } from "../../../../../lib/communities/communityGroupHeroLayout";
import { MAX_MEMBERS_PER_GROUP } from "../../../../../lib/communities/limitValues";
import { resolveLocalizedLang } from "../../../../../lib/i18n/localize";
import { moderationCopy } from "../../../../../lib/moderation/moderationCopy";
import { filterBlockedRows } from "../../../../../lib/moderation/moderationTypes";
import ModerationSheetNative from "../moderation/ModerationSheetNative";
import { useBlockedUidsNative } from "../moderation/blockedUsersStoreNative";

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
  /** 終了確認後に呼ばれる（アーカイブ実行） */
  onRequestEndGroup?: (groupName: string) => void;
  /** 親 Modal 内では cyberAlert が裏に回るため、確認 UI を親に任せる */
  onRequestLeave?: () => void;
  onOpenProfile?: (handle: string, warm?: OpenPublicProfileWarm) => void;
  onImageUpdated?: () => void;
  /** ヘッダー画像編集中 — 親 ScrollView 制御用 */
  onHeaderImageEditingChange?: (editing: boolean) => void;
  /** `CommunityGroupDetailCard` 内 — 余白を詰めてヒーローを上端に揃える */
  inDetailCard?: boolean;
  /** 親が Modal のとき、確認も embedded で重ねる */
  embedConfirmModals?: boolean;
  /** 終了 API 実行中（確認モーダルの busy） */
  endingGroup?: boolean;
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
  onRequestLeave,
  onOpenProfile,
  onImageUpdated,
  onHeaderImageEditingChange,
  inDetailCard = false,
  embedConfirmModals = false,
  endingGroup = false,
}: Props) {
  const initialCached = getCachedCommunityGroupDetail(groupId);
  const [summary, setSummary] = useState(() =>
    initialCached?.summary ?? (listPreview ? listPreviewToSummary(groupId, listPreview) : null)
  );
  const [baseRows, setBaseRows] = useState<CommunityGroupLeaderboardRow[]>(
    () => initialCached?.rows ?? []
  );
  const [metric, setMetric] = useState<CommunityMetric>(
    () => initialCached?.metric ?? listPreview?.rankingMetric ?? "totalPoints"
  );
  const [gamesScope, setGamesScope] = useState<CommunityGamesScope>(() =>
    parseCommunityGamesScope(
      initialCached?.gamesScope ??
        initialCached?.summary?.rankingGamesScope ??
        "all"
    )
  );
  const [loadingDetail, setLoadingDetail] = useState(() => !initialCached && !listPreview);
  const [loadingRows, setLoadingRows] = useState(() => !initialCached);
  const [inviteBusy, setInviteBusy] = useState(false);
  /** 招待コードは常時出さず、空き枠タップで開く */
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const [headerImageEditingLocal, setHeaderImageEditingLocal] = useState(false);

  const setScrollLocked = useCallback(
    (locked: boolean) => {
      onHeaderImageEditingChange?.(locked);
    },
    [onHeaderImageEditingChange]
  );

  const openEditGroup = useCallback(() => {
    setEditGroupOpen(true);
    setScrollLocked(true);
  }, [setScrollLocked]);

  const closeEditGroup = useCallback(() => {
    setEditGroupOpen(false);
    setScrollLocked(headerImageEditingLocal);
  }, [headerImageEditingLocal, setScrollLocked]);

  const scrollStyle = useMemo(
    () => [
      styles.scroll,
      inDetailCard && styles.scrollInDetailCard,
    ],
    [inDetailCard]
  );

  const applyEntry = useCallback(
    (
      entry: {
        summary: CommunityGroupSummary;
        rows: CommunityGroupLeaderboardRow[];
        metric: CommunityMetric;
        gamesScope: CommunityGamesScope;
      },
      keepViewMetric: boolean
    ) => {
      setSummary(entry.summary);
      onSummaryLoaded?.(entry.summary);
      setBaseRows(entry.rows);
      setGamesScope(entry.gamesScope);
      if (!keepViewMetric) {
        setMetric(entry.metric);
      }
    },
    [onSummaryLoaded]
  );

  const load = useCallback(
    async (opts?: { gamesScope?: CommunityGamesScope; keepViewMetric?: boolean }) => {
      if (!groupId) return;
      const requestedScope = opts?.gamesScope;
      const keepViewMetric = opts?.keepViewMetric ?? false;
      const cached = getCachedCommunityGroupDetail(groupId, requestedScope);
      if (cached) {
        applyEntry(cached, keepViewMetric);
        setLoadingDetail(false);
        setLoadingRows(false);
      } else if (listPreview && !requestedScope) {
        const previewSummary = listPreviewToSummary(groupId, listPreview);
        setSummary(previewSummary);
        onSummaryLoaded?.(previewSummary);
        if (!keepViewMetric) setMetric(listPreview.rankingMetric);
        setLoadingDetail(false);
        setLoadingRows(true);
      } else {
        setLoadingRows(true);
      }

      const entry = await fetchCommunityGroupDetail(groupId, getIdToken, {
        gamesScope: requestedScope,
      });
      if (!entry) {
        if (!cached && !listPreview) {
          cyberAlert("", language === "en" ? "Load failed." : "読み込みに失敗しました。");
        }
        setLoadingDetail(false);
        setLoadingRows(false);
        return;
      }
      applyEntry(entry, keepViewMetric);
      setLoadingDetail(false);
      setLoadingRows(false);
    },
    [groupId, listPreview, language, getIdToken, onSummaryLoaded, applyEntry]
  );

  useEffect(() => {
    void load();
  }, [groupId, reloadToken]); // eslint-disable-line react-hooks/exhaustive-deps -- 初回と明示リロードのみ

  const onSelectMetric = useCallback((next: CommunityMetric) => {
    setMetric(next);
  }, []);

  const onSelectGamesScope = useCallback(
    (next: CommunityGamesScope) => {
      if (next === gamesScope || loadingRows) return;
      // 成功するまでタブを切り替えない（失敗時に全試合得点のままピックアップ表示になるのを防ぐ）
      void (async () => {
        setLoadingRows(true);
        const entry = await fetchCommunityGroupDetail(groupId, getIdToken, {
          gamesScope: next,
        });
        if (!entry || entry.gamesScope !== next) {
          setLoadingRows(false);
          cyberAlert(
            "",
            language === "en"
              ? "Could not load Pick Up scores. Try again."
              : "ピックアップの得点を読み込めませんでした。もう一度お試しください。"
          );
          return;
        }
        applyEntry(entry, true);
        setLoadingDetail(false);
        setLoadingRows(false);
      })();
    },
    [gamesScope, loadingRows, groupId, getIdToken, language, applyEntry]
  );

  const t = useMemo(
    () =>
      language === "en"
        ? {
            inviteLabel: "Invite code",
            copyInvite: "Copy",
            shareInvite: "Share",
            issueInvite: "Create invite code",
            issuing: "…",
            inviteUnavailable: "Could not create an invite code. Try again.",
            openSlot: "Add someone",
            leave: "Leave group",
            noEntries: "No entries yet.",
            endTitle: "End this group?",
            endBody: (name: string) =>
              `This will archive "${name}". Members will no longer see it in active slots.`,
            endCancel: "Cancel",
            endConfirm: "End group",
          }
        : {
            inviteLabel: "招待コード",
            copyInvite: "コピー",
            shareInvite: "共有",
            issueInvite: "招待コードを発行",
            issuing: "…",
            inviteUnavailable: "招待コードを発行できませんでした。もう一度お試しください。",
            openSlot: "人を追加",
            leave: "グループを退会",
            noEntries: "まだエントリーがありません。",
            endTitle: "グループを終了しますか？",
            endBody: (name: string) =>
              `「${name}」を終了します。メンバーはアクティブなスロットから非表示になります。`,
            endCancel: "キャンセル",
            endConfirm: "終了する",
          },
    [language]
  );

  const rows = useMemo(
    () => resortCommunityLeaderboardRows(baseRows, metric),
    [baseRows, metric]
  );

  const moderation = useMemo(
    () => moderationCopy(resolveLocalizedLang(language)),
    [language]
  );
  const [reportOpen, setReportOpen] = useState(false);
  const blockedUids = useBlockedUidsNative();
  const rankMetricForProfile = communityMetricToMobile(metric);
  const rankingItems = useMemo(
    () =>
      filterBlockedRows(rows, blockedUids, (r) => r.uid).map((r) => ({
        rank: r.rank,
        row: communityRowToRankingCardRow(r, metric),
      })),
    [rows, metric, blockedUids]
  );
  const rankingCardRows = useMemo(
    () => rankingItems.map((item) => item.row),
    [rankingItems]
  );
  const lang = language as RankingsLanguage;
  const reduceMotion = useReducedMotion() ?? false;
  const rankListEntranceKey = useMemo(
    () =>
      `${groupId}:${metric}:${gamesScope}:${rows.map((r) => `${r.uid}:${r.rank}`).join("|")}`,
    [groupId, metric, gamesScope, rows]
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

  const onIssueInvite = useCallback(async (): Promise<string | null> => {
    if (!summary?.isOwner || inviteBusy) return summary?.inviteCode ?? null;
    setInviteBusy(true);
    try {
      const h = await communityAuthHeader(getIdToken);
      if (!h) return null;
      const res = await fetch(
        communityApiUrl(`/api/communities/${groupId}/rotate-invite`),
        { method: "POST", headers: { Authorization: h } }
      );
      const json = await res.json().catch(() => ({}));
      const code =
        typeof json?.inviteCode === "string" ? json.inviteCode.trim() : "";
      if (!res.ok || !json?.ok || !code) {
        cyberAlert("", t.inviteUnavailable);
        return null;
      }
      setSummary((prev) => (prev ? { ...prev, inviteCode: code } : prev));
      invalidateCommunityGroupDetail(groupId);
      return code;
    } finally {
      setInviteBusy(false);
    }
  }, [
    summary?.isOwner,
    summary?.inviteCode,
    inviteBusy,
    getIdToken,
    groupId,
    t.inviteUnavailable,
  ]);

  const onToggleInvite = useCallback(async () => {
    if (inviteOpen) {
      setInviteOpen(false);
      return;
    }
    if (!summary?.inviteCode) {
      if (!summary?.isOwner) {
        cyberAlert("", t.inviteUnavailable);
        return;
      }
      const code = await onIssueInvite();
      if (!code) return;
    }
    setInviteOpen(true);
  }, [
    inviteOpen,
    summary?.inviteCode,
    summary?.isOwner,
    onIssueInvite,
    t.inviteUnavailable,
  ]);

  const onLeave = useCallback(() => {
    if (onRequestLeave) {
      onRequestLeave();
      return;
    }
    // スタック画面など、親確認がない場合のフォールバック
    cyberAlert(
      language === "en" ? "Leave this group?" : "このグループから退会しますか？",
      language === "en"
        ? "You will leave this group."
        : "このグループから退会します。",
      [
        { text: language === "en" ? "Cancel" : "キャンセル", style: "cancel" },
        {
          text: language === "en" ? "Leave" : "退会",
          style: "destructive",
          onPress: () => {
            void (async () => {
              const h = await communityAuthHeader(getIdToken);
              if (!h) {
                cyberAlert(
                  "",
                  language === "en" ? "Sign in required." : "ログインが必要です。"
                );
                return;
              }
              const res = await fetch(
                communityApiUrl(`/api/communities/${groupId}/leave`),
                {
                  method: "POST",
                  headers: { Authorization: h },
                }
              );
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
      ],
      { variant: "confirm" }
    );
  }, [groupId, language, getIdToken, onExitAction, onRequestLeave]);

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
      const handle = warmPublicProfileFromRankingRowNative(row, {
        // グループ行は期間集計のためカード全体スタッツには載せない
        skipStatsPrime: true,
      });
      if (!handle || !onOpenProfile) return;
      onOpenProfile(handle, {
        uid: row.uid,
        handle: typeof row.handle === "string" ? row.handle : null,
        displayName: row.displayName,
        photoURL: typeof row.photoURL === "string" ? row.photoURL : null,
        plan: row.plan === "pro" ? "pro" : "free",
        planProBgVariant:
          typeof row.planProBgVariant === "string"
            ? row.planProBgVariant
            : null,
        countryCode:
          typeof row.countryCode === "string" ? row.countryCode : null,
        skipStatsPrime: true,
      });
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
          onImageEditingChange={(editing) => {
            setHeaderImageEditingLocal(editing);
            setScrollLocked(editing || editGroupOpen);
          }}
          onEditGroup={
            summary.isOwner && !summary.archived ? openEditGroup : undefined
          }
          onEndGroup={
            summary.isOwner && !summary.archived && onRequestEndGroup
              ? () => setEndConfirmOpen(true)
              : undefined
          }
        />
      ) : null}

      <CommunityGroupViewBarNative
        language={language}
        metric={metric}
        gamesScope={gamesScope}
        onSelectMetric={onSelectMetric}
        onSelectGamesScope={onSelectGamesScope}
        gamesScopeBusy={loadingRows}
      />

      {loadingRows ? (
        <RankingsCyberPanelNative subtle compact style={styles.rankingSkeletonPanel}>
          <SkeletonScanNative style={styles.skeletonLine} />
          <SkeletonScanNative style={styles.skeletonRow} />
          <SkeletonScanNative style={styles.skeletonRow} />
          <SkeletonScanNative style={styles.skeletonRow} />
        </RankingsCyberPanelNative>
      ) : (
        <View style={styles.rankingList}>
          {rankingCardRows.length === 0 ? (
            <Text style={styles.emptyRank}>{t.noEntries}</Text>
          ) : (
            rankingItems.map((item, i) => (
              <RankingsListEntranceRowNative
                key={item.row.uid ?? item.row.handle ?? `r-${item.rank}`}
                index={i}
                entranceKey={rankListEntranceKey}
              >
                <RankingListCardNative
                  row={item.row}
                  rank={item.rank}
                  metric={rankMetricForProfile}
                  language={lang}
                  animateCrown={item.rank === 1}
                  pageKey={rankListEntranceKey}
                  reduceMotion={reduceMotion}
                  frameFallback
                  metricTagOverride={
                    metric === "activeWinStreak"
                      ? metricLabel("activeWinStreak", language)
                      : null
                  }
                  onPress={onOpenProfile ? () => openProfile(item.row) : undefined}
                />
              </RankingsListEntranceRowNative>
            ))
          )}
          {/* 順位番号ではなく「一覧の最後の人」の直後 */}
          {summary &&
          !summary.archived &&
          (summary.memberCount ?? rankingItems.length) < MAX_MEMBERS_PER_GROUP ? (
            <>
              <Pressable
                disabled={inviteBusy}
                onPress={() => void onToggleInvite()}
                style={({ pressed }) => [
                  styles.openMemberSlot,
                  inviteOpen && styles.openMemberSlotActive,
                  rankingCardRows.length === 0 && styles.openMemberSlotAlone,
                  pressed && communityPressableTapStyle(true),
                ]}
                accessibilityRole="button"
                accessibilityLabel={t.openSlot}
              >
                <MaterialCommunityIcons
                  name={inviteOpen ? "chevron-up" : "plus"}
                  size={18}
                  color="rgba(148,163,184,0.72)"
                />
                <Text style={styles.openMemberSlotText}>
                  {inviteBusy ? t.issuing : t.openSlot}
                </Text>
              </Pressable>
              {inviteOpen && summary.inviteCode ? (
                <View style={styles.inviteReveal}>
                  <Text style={styles.inviteLabel}>{t.inviteLabel}</Text>
                  <View style={styles.inviteCodeRow}>
                    <Text style={styles.inviteCode}>{summary.inviteCode}</Text>
                    <View style={styles.inviteActions}>
                      <Pressable
                        onPress={() => void onCopyInvite()}
                        style={({ pressed }) => [
                          styles.inviteBtn,
                          pressed && communityPressableTapStyle(true),
                        ]}
                        accessibilityLabel={t.copyInvite}
                      >
                        <MaterialCommunityIcons
                          name="content-copy"
                          size={14}
                          color="rgba(186,230,253,0.8)"
                        />
                        <Text style={styles.inviteBtnText}>{t.copyInvite}</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => void onShareInvite()}
                        style={({ pressed }) => [
                          styles.inviteBtn,
                          styles.inviteBtnPrimary,
                          pressed && communityPressableTapStyle(true),
                        ]}
                        accessibilityLabel={t.shareInvite}
                      >
                        <MaterialCommunityIcons
                          name="share-variant"
                          size={14}
                          color="rgba(224,242,254,0.95)"
                        />
                        <Text
                          style={[styles.inviteBtnText, styles.inviteBtnTextPrimary]}
                        >
                          {t.shareInvite}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      )}

      {!summary?.isOwner && !summary?.archived ? (
        <Pressable
          onPress={onLeave}
          style={({ pressed }) => [styles.leaveBtn, pressed && communityPressableTapStyle(true)]}
        >
          <Text style={styles.leaveText}>{t.leave}</Text>
        </Pressable>
      ) : null}

      {summary && !summary.isOwner ? (
        <>
          <Pressable
            onPress={() => setReportOpen(true)}
            style={({ pressed }) => [styles.reportBtn, pressed && communityPressableTapStyle(true)]}
            accessibilityRole="button"
          >
            <Text style={styles.reportText}>{moderation.reportGroup}</Text>
          </Pressable>
          <ModerationSheetNative
            visible={reportOpen}
            onClose={() => setReportOpen(false)}
            targetType="group"
            targetId={groupId}
            targetLabel={summary.name}
            language={language}
          />
        </>
      ) : null}
    </>
  );

  return (
    <View style={[styles.root, inDetailCard ? styles.rootInDetailCard : null]}>
      {inDetailCard ? null : <RankingsShellGridOverlay borderRadius={0} />}
      {scrollEnabled ? (
        <ScrollView contentContainerStyle={scrollStyle} showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        <View style={scrollStyle}>{content}</View>
      )}
      {summary ? (
        <CommunityEditGroupModalNative
          visible={editGroupOpen}
          groupId={groupId}
          language={language}
          initialName={summary.name}
          initialDescription={summary.description}
          initialHeaderImageUrl={summary.headerImageUrl}
          getIdToken={getIdToken}
          onClose={closeEditGroup}
          onSaved={() => {
            closeEditGroup();
            invalidateCommunityGroupDetail(groupId);
            void load({ keepViewMetric: true });
            onImageUpdated?.();
          }}
        />
      ) : null}
      {summary && onRequestEndGroup ? (
        <CommunityModalBackdropNative
          visible={endConfirmOpen}
          embedded={embedConfirmModals}
          onClose={() => {
            if (!endingGroup) setEndConfirmOpen(false);
          }}
        >
          <Text style={styles.endConfirmTitle}>{t.endTitle}</Text>
          <Text style={styles.endConfirmBody}>{t.endBody(summary.name)}</Text>
          <View style={styles.endConfirmActions}>
            <Pressable
              disabled={endingGroup}
              onPress={() => setEndConfirmOpen(false)}
              style={({ pressed }) => [
                styles.endConfirmCancelBtn,
                pressed && communityPressableTapStyle(true),
              ]}
            >
              <Text style={styles.endConfirmCancelText}>{t.endCancel}</Text>
            </Pressable>
            <Pressable
              disabled={endingGroup}
              onPress={() => {
                onRequestEndGroup(summary.name);
              }}
              style={({ pressed }) => [
                styles.endConfirmOkBtn,
                pressed && communityPressableTapStyle(true),
              ]}
            >
              <Text style={styles.endConfirmOkText}>
                {endingGroup ? t.issuing : t.endConfirm}
              </Text>
            </Pressable>
          </View>
        </CommunityModalBackdropNative>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 320,
    backgroundColor: COMMUNITY_GROUP_HERO_BG,
    borderRadius: 0,
    overflow: "hidden",
  },
  rootInDetailCard: {
    backgroundColor: "transparent",
  },
  endConfirmTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 8,
  },
  endConfirmBody: {
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 16,
  },
  endConfirmActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  endConfirmCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  endConfirmCancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
  },
  endConfirmOkBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(248,113,113,0.9)",
  },
  endConfirmOkText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#050508",
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
  inviteLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
    marginBottom: 10,
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
  reportBtn: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  reportText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(148,163,184,0.75)",
    textDecorationLine: "underline",
  },
  rankingSkeletonPanel: {
    marginBottom: 8,
    backgroundColor: COMMUNITY_GROUP_HERO_BG,
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
    marginTop: 4,
    marginBottom: 16,
    backgroundColor: COMMUNITY_GROUP_HERO_BG,
  },
  /** 一覧末尾（最後のメンバーの直下）— あとから入れる空き枠 */
  openMemberSlot: {
    minHeight: 72,
    marginTop: 3,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(148,163,184,0.38)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  openMemberSlotAlone: {
    marginTop: 0,
  },
  openMemberSlotActive: {
    borderColor: "rgba(34,211,238,0.42)",
    backgroundColor: "rgba(34,211,238,0.05)",
  },
  openMemberSlotText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: "rgba(148,163,184,0.72)",
  },
  inviteReveal: {
    marginTop: 8,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
});
