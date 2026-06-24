"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Copy, Share2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { jp } from "@/lib/fonts";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import { toast } from "@/app/component/ui/toast";
import { copyTextToClipboard } from "@/lib/clipboard/copyText";
import { shareCommunityInvite } from "@/lib/communities/inviteShare";
import type { CommunityMetric } from "@/lib/communities/types";
import { formatCommunityCompetitionLine } from "@/lib/communities/competitionDisplay";
import { periodLabel } from "@/lib/communities/labels";
import type { Language } from "@/lib/i18n/language";
import {
  communityMetricToMobile,
  communityLeagueForProfile,
  communityRowToRankingCardRow,
} from "@/lib/communities/leaderboardDisplayRow";
import RankingCard from "@/app/component/rankings/RankingCard";
import TopPodium from "@/app/component/rankings/TopPodium";
import { restContainer, restItem } from "@/app/component/rankings/anim";
import {
  RankingsCyberPanel,
  RankingsCyberSectionLabel,
} from "@/app/component/rankings/RankingsCyberPanel";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";
import {
  fetchCommunityGroupDetail,
  getCachedCommunityGroupDetail,
  invalidateCommunityGroupDetail,
  listPreviewToSummary,
  type CommunityGroupLeaderboardRow,
  type CommunityGroupListPreview,
  type CommunityGroupSummary,
} from "@/app/component/communities/communityGroupDetailCache";
import { warmGroupLeaderboardProfiles } from "@/lib/communities/warmGroupLeaderboardProfiles";
import EndGroupConfirmModal from "@/app/component/communities/EndGroupConfirmModal";
import InviteShareModal from "@/app/component/communities/InviteShareModal";

async function authHeader(): Promise<string | null> {
  const u = auth.currentUser;
  if (!u) return null;
  const token = await u.getIdToken();
  return `Bearer ${token}`;
}

function commMsg(lang: Language, m: { ja: string; en: string }) {
  if (lang === "en") return m.en;
  return m.ja;
}

export type CommunityGroupDetailViewProps = {
  groupId: string;
  language: Language;
  variant: "web" | "mobile";
  /** 画像があるときだけ横長バナーを表示。ないときは上段なし */
  headerBanner: "wide_when_image" | "off";
  showBackLink?: boolean;
  showCloseButton?: boolean;
  onClose?: () => void;
  /** アーカイブ・退会成功時に router の代わりに実行（オーバーレイ用） */
  onExitAction?: () => void;
  /** ScheduleList 予想オーバーレイ内表示 */
  inOverlay?: boolean;
  /** オーバーレイ上部に戻るバーがあるときは true（サムネと被らない） */
  inOverlayBackBar?: boolean;
  /** 一覧からの即時表示用（API 待ちの間） */
  listPreview?: CommunityGroupListPreview | null;
  /** グループ終了確認モーダルを開く（オーバーレイ側で表示） */
  onRequestEndGroup?: (groupName: string) => void;
  className?: string;
};

export default function CommunityGroupDetailView({
  groupId,
  language,
  variant,
  headerBanner,
  showBackLink,
  showCloseButton,
  onClose,
  onExitAction,
  inOverlay = false,
  inOverlayBackBar = false,
  listPreview = null,
  onRequestEndGroup,
  className = "",
}: CommunityGroupDetailViewProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const initialCached = getCachedCommunityGroupDetail(groupId);
  const [summary, setSummary] = useState<CommunityGroupSummary | null>(
    () =>
      initialCached?.summary ??
      (listPreview ? listPreviewToSummary(groupId, listPreview) : null)
  );
  const [rows, setRows] = useState<CommunityGroupLeaderboardRow[]>(
    () => initialCached?.rows ?? []
  );
  const [metric, setMetric] = useState<CommunityMetric>(
    () =>
      initialCached?.metric ??
      listPreview?.rankingMetric ??
      "totalPoints"
  );
  const [loadingDetail, setLoadingDetail] = useState(
    () => !initialCached && !listPreview
  );
  const [loadingRows, setLoadingRows] = useState(() => !initialCached);
  const [localEndConfirmOpen, setLocalEndConfirmOpen] = useState(false);
  const [localEndConfirmName, setLocalEndConfirmName] = useState("");
  const [endingGroup, setEndingGroup] = useState(false);
  const [inviteShareOpen, setInviteShareOpen] = useState(false);

  const rankingsHref = variant === "web" ? "/web/rankings" : "/mobile/rankings";
  const isWeb = variant === "web";

  const applyEntry = useCallback(
    (entry: NonNullable<ReturnType<typeof getCachedCommunityGroupDetail>>) => {
      setSummary(entry.summary);
      setRows(entry.rows);
      setMetric(entry.metric);
    },
    []
  );

  const load = useCallback(async () => {
    if (!groupId) return;

    const cached = getCachedCommunityGroupDetail(groupId);
    if (cached) {
      applyEntry(cached);
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

    const entry = await fetchCommunityGroupDetail(groupId, {
      onPartial: (partial) => {
        if (partial.summary) {
          setSummary(partial.summary);
          setLoadingDetail(false);
        }
        if (partial.rows) {
          setRows(partial.rows);
          setLoadingRows(false);
        }
        if (partial.metric) setMetric(partial.metric);
      },
    });
    if (!entry) {
      if (!cached && !listPreview) {
        toast.error(
          commMsg(language, { en: "Load failed.", ja: "読み込みに失敗しました。" })
        );
      }
      setLoadingDetail(false);
      setLoadingRows(false);
      return;
    }
    applyEntry(entry);
    setLoadingDetail(false);
    setLoadingRows(false);
  }, [groupId, listPreview, language, applyEntry]);

  useEffect(() => {
    void load();
  }, [groupId, load]);

  const t = useMemo(() => {
    if (language === "en") {
      return {
        back: "Back to rankings",
        close: "Close",
        members: "Members",
        rank: "Rank",
        player: "Player",
        score: "Score",
        ranking: "Ranking",
            ended: "This group has ended.",
            inviteLabel: "Invite code",
            copyInvite: "Copy",
            shareInvite: "Share",
            inviteUnavailable:
              "Invite code is not stored for this group. Create a new group to get a code.",
            endGroup: "End this group",
            leave: "Leave group",
      };
    }
    return {
      back: "ランキングに戻る",
      close: "閉じる",
      members: "参加人数",
      rank: "順位",
      player: "ユーザー",
      score: "スコア",
      ranking: "ランキング",
      ended: "このグループは終了しています。",
      inviteLabel: "招待コード",
      copyInvite: "コピー",
      shareInvite: "共有",
      inviteUnavailable:
        "このグループには招待コードが保存されていません。新規作成時に表示されたコードをご利用ください。",
      endGroup: "グループを終了する",
      leave: "グループを退会",
    };
  }, [language]);

  const finishExit = useCallback(() => {
    if (onExitAction) onExitAction();
    else router.push(rankingsHref);
  }, [onExitAction, router, rankingsHref]);

  const onCopyInvite = useCallback(async () => {
    const code = summary?.inviteCode;
    if (!code) return;
    if (await copyTextToClipboard(code)) {
      toast.info(
        commMsg(language, {
          en: "Invite code copied.",
          ja: "招待コードをコピーしました。",
        })
      );
    } else {
      toast.error(
        commMsg(language, {
          en: "Could not copy.",
          ja: "コピーできませんでした。",
        })
      );
    }
  }, [summary?.inviteCode, language]);

  const onShareInvite = useCallback(async () => {
    const code = summary?.inviteCode;
    if (!code) return;
    const result = await shareCommunityInvite({
      inviteCode: code,
      groupName: summary?.name,
      language,
    });
    if (result === "shared") {
      toast.info(
        commMsg(language, {
          en: "Invite shared.",
          ja: "招待を共有しました。",
        })
      );
      return;
    }
    if (result === "unsupported") {
      setInviteShareOpen(true);
      return;
    }
    if (result === "cancelled") return;
    toast.error(
      commMsg(language, {
        en: "Could not share.",
        ja: "共有できませんでした。",
      })
    );
  }, [summary?.inviteCode, summary?.name, language]);

  const confirmEndGroup = useCallback(async () => {
    const h = await authHeader();
    if (!h) return;
    setEndingGroup(true);
    try {
      const res = await fetch(`/api/communities/${groupId}/archive`, {
        method: "POST",
        headers: { Authorization: h },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        toast.error(String(json?.error ?? "failed"));
        return;
      }
      setLocalEndConfirmOpen(false);
      toast.success(
        commMsg(language, {
          en: "Group ended.",
          ja: "グループを終了しました。",
        })
      );
      invalidateCommunityGroupDetail(groupId);
      finishExit();
    } finally {
      setEndingGroup(false);
    }
  }, [groupId, language, finishExit]);

  const requestEndGroup = useCallback(
    (name: string) => {
      if (onRequestEndGroup) {
        onRequestEndGroup(name);
        return;
      }
      setLocalEndConfirmName(name);
      setLocalEndConfirmOpen(true);
    },
    [onRequestEndGroup]
  );

  const onLeave = useCallback(async () => {
    const h = await authHeader();
    if (!h) return;
    const ok = window.confirm(
      commMsg(language, {
        en: "Leave this group?",
        ja: "このグループから退会しますか？",
      })
    );
    if (!ok) return;
    const res = await fetch(`/api/communities/${groupId}/leave`, {
      method: "POST",
      headers: { Authorization: h },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.ok) {
      toast.error(String(json?.error ?? "failed"));
      return;
    }
    toast.success(
      commMsg(language, {
        en: "Left group.",
        ja: "退会しました。",
      })
    );
    invalidateCommunityGroupDetail(groupId);
    finishExit();
  }, [groupId, language, finishExit]);

  const showBanner =
    headerBanner === "wide_when_image" &&
    summary?.headerImageUrl;
  const rankMetricForProfile = communityMetricToMobile(metric);
  const profileStatsLeague = communityLeagueForProfile(summary?.rankingLeague);

  const rankingCardRows = useMemo(
    () => rows.map((r) => communityRowToRankingCardRow(r, metric)),
    [rows, metric]
  );
  const top3 = rankingCardRows.slice(0, 3);
  const restRows = rankingCardRows.slice(3);

  const prefersReducedMotion = useReducedMotion();

  const rankListAnimKey = useMemo(
    () =>
      `${groupId}:${metric}:${rows.map((r) => `${r.uid}:${r.rank}`).join("|")}`,
    [groupId, metric, rows]
  );

  useEffect(() => {
    if (!rows.length || loadingRows) return;
    warmGroupLeaderboardProfiles(
      router,
      pathname,
      variant,
      groupId,
      rows,
      metric,
      summary?.rankingLeague
    );
  }, [
    groupId,
    loadingRows,
    metric,
    pathname,
    rows,
    router,
    summary?.rankingLeague,
    variant,
  ]);

  return (
    <>
      {!onRequestEndGroup ? (
        <EndGroupConfirmModal
          open={localEndConfirmOpen}
          groupName={localEndConfirmName || summary?.name}
          language={language}
          busy={endingGroup}
          onCancel={() => {
            if (!endingGroup) setLocalEndConfirmOpen(false);
          }}
          onConfirm={() => void confirmEndGroup()}
        />
      ) : null}
      <InviteShareModal
        open={inviteShareOpen}
        inviteCode={summary?.inviteCode ?? ""}
        groupName={summary?.name}
        language={language}
        onClose={() => setInviteShareOpen(false)}
      />
      <div
      className={[
        `relative flex flex-col ${jp.className}`,
        inOverlay ? (inOverlayBackBar ? "" : "pt-12") : "min-h-0 flex-1",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {inOverlay ? <ShellGridOverlay /> : null}
      {(showBackLink || showCloseButton) && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-cyan-400/20 px-3 py-2.5">
          <div className="min-w-0">
            {showBackLink ? (
              <Link
                href={rankingsHref}
                className="font-mono text-[11px] uppercase tracking-[0.18em] text-cyan-300/90 underline-offset-2 hover:underline"
              >
                ← {t.back}
              </Link>
            ) : (
              <span />
            )}
          </div>
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-none border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-cyan-100/90 hover:bg-cyan-500/15"
            >
              {t.close}
            </button>
          )}
        </div>
      )}

      {showBanner && summary?.headerImageUrl && (
        <div className="relative h-36 w-full shrink-0 overflow-hidden sm:h-44">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={summary.headerImageUrl}
            alt=""
            className="h-full w-full object-cover object-center"
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent" />
        </div>
      )}

      <div
        className={[
          "relative z-10 px-3 pb-4 pt-3",
          inOverlay ? "" : "min-h-0 flex-1 overflow-y-auto",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {loadingDetail && (
          <CandleChartLoader
            label={commMsg(language, {
              en: "Loading…",
              ja: "読み込み中…",
            })}
          />
        )}

        {!loadingDetail && summary && (
          <>
            <RankingsCyberPanel subtle className="mb-4">
              <h1
                className={[
                  "font-bold leading-tight text-cyan-50/95",
                  isWeb ? "text-2xl" : "text-lg sm:text-xl",
                ].join(" ")}
              >
                {summary.name}
              </h1>
              {summary.description ? (
                <p
                  className={[
                    "mt-2 whitespace-pre-wrap leading-relaxed text-white/65",
                    isWeb ? "text-base" : "text-sm",
                  ].join(" ")}
                >
                  {summary.description}
                </p>
              ) : null}
              <p
                className={[
                  "mt-3 font-mono uppercase tracking-[0.1em] text-white/45",
                  isWeb ? "text-xs" : "text-[11px] sm:text-xs",
                ].join(" ")}
              >
                {t.members}: {summary.memberCount} ·{" "}
                {formatCommunityCompetitionLine(
                  {
                    rankingLeague: summary.rankingLeague ?? "all",
                    rankingMetric: metric,
                    rankingTeamIds: summary.rankingTeamIds,
                  },
                  language
                )}{" "}
                · {periodLabel("from_now", language)}
              </p>

              {summary.archived && (
                <p className="mt-2 text-sm text-amber-200/90">{t.ended}</p>
              )}
            </RankingsCyberPanel>

            {summary.isOwner && !summary.archived && (
              <RankingsCyberPanel subtle compact className="mb-4">
                <RankingsCyberSectionLabel subtle>{t.inviteLabel}</RankingsCyberSectionLabel>
                {summary.inviteCode ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={[
                        "min-w-0 flex-1 font-mono font-semibold tracking-[0.14em] text-cyan-50/90 tabular-nums",
                        isWeb ? "text-lg" : "text-base",
                      ].join(" ")}
                    >
                      {summary.inviteCode}
                    </p>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void onCopyInvite()}
                        className={[
                          "flex items-center gap-1 rounded-none border border-cyan-400/18 bg-cyan-500/6 px-2.5 py-1.5 font-medium text-cyan-100/80",
                          isWeb ? "text-sm" : "text-xs",
                        ].join(" ")}
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden />
                        {t.copyInvite}
                      </button>
                      <button
                        type="button"
                        onClick={() => void onShareInvite()}
                        className={[
                          "flex items-center gap-1 rounded-none border border-cyan-400/22 bg-cyan-500/8 px-2.5 py-1.5 font-medium text-cyan-50/90",
                          isWeb ? "text-sm" : "text-xs",
                        ].join(" ")}
                      >
                        <Share2 className="h-3.5 w-3.5" aria-hidden />
                        {t.shareInvite}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p
                    className={[
                      "leading-relaxed text-white/45",
                      isWeb ? "text-sm" : "text-xs",
                    ].join(" ")}
                  >
                    {t.inviteUnavailable}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => requestEndGroup(summary.name)}
                  className={[
                    "mt-3 w-full rounded-none border border-red-400/35 bg-red-950/30 py-2 text-red-200",
                    isWeb ? "text-base" : "text-sm",
                  ].join(" ")}
                >
                  {t.endGroup}
                </button>
              </RankingsCyberPanel>
            )}

            {!summary.isOwner && !summary.archived && (
              <button
                type="button"
                onClick={() => void onLeave()}
                className={[
                  "mb-4 w-full rounded-none border border-cyan-400/16 bg-cyan-500/5 py-2 font-mono text-sm uppercase tracking-[0.1em] text-cyan-100/70",
                  isWeb ? "text-base" : "text-sm",
                ].join(" ")}
              >
                {t.leave}
              </button>
            )}

            <RankingsCyberSectionLabel subtle>{t.ranking}</RankingsCyberSectionLabel>
            {loadingRows ? (
              <RankingsCyberPanel subtle compact>
                <div className="space-y-2">
                  <div className="h-3 w-2/5 skeleton-scan rounded-none bg-cyan-400/10" />
                  <div className="h-11 skeleton-scan rounded-none bg-cyan-400/8" />
                  <div className="h-11 skeleton-scan rounded-none bg-cyan-400/8" />
                  <div className="h-11 skeleton-scan rounded-none bg-cyan-400/8" />
                </div>
              </RankingsCyberPanel>
            ) : rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-white/45">
                {commMsg(language, {
                  en: "No entries yet.",
                  ja: "まだエントリーがありません。",
                })}
              </p>
            ) : (
              <div key={rankListAnimKey} className="cyber-rank-list-panel">
                <TopPodium
                  rows={top3}
                  metric={rankMetricForProfile}
                  rankingLeague={profileStatsLeague.rankingLeague}
                  wcStage={profileStatsLeague.wcStage}
                  language={language}
                  countUpEnabled={false}
                  entranceEnabled={false}
                  compact
                  shellTone="subtle"
                  groupReturnGroupId={groupId}
                />
                <motion.div
                  variants={restContainer}
                  initial={prefersReducedMotion ? "show" : "hidden"}
                  animate="show"
                >
                  {restRows.map((r, i) => (
                    <motion.div
                      key={r.uid}
                      variants={restItem}
                      custom={i}
                    >
                      <RankingCard
                        row={r}
                        rank={i + 4}
                        metric={rankMetricForProfile}
                        rankingLeague={profileStatsLeague.rankingLeague}
                        wcStage={profileStatsLeague.wcStage}
                        language={language}
                        size="compact"
                        shellTone="subtle"
                        animateValue={false}
                        groupReturnGroupId={groupId}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}
