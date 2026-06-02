"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Copy, Share2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { jp } from "@/lib/fonts";
import { toast } from "@/app/component/ui/toast";
import { copyTextToClipboard } from "@/lib/clipboard/copyText";
import { shareCommunityInvite } from "@/lib/communities/inviteShare";
import type { CommunityMetric } from "@/lib/communities/types";
import {
  leagueLabel,
  metricLabel,
  periodLabel,
} from "@/lib/communities/labels";
import type { CommunityLeague } from "@/lib/communities/types";
import type { Language } from "@/lib/i18n/language";
import {
  ProCyberBadge,
  proBadgeStaticMotion,
} from "@/app/component/common/ProCyberBadge";
import { profileHrefWithRankingsReturn } from "@/lib/navigation/rankingsProfileFrom";
import { communityMetricToMobile } from "@/lib/communities/leaderboardDisplayRow";
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

const RANK_ROW_STAGGER_COUNT = 10;
const RANK_ROW_STAGGER_STEP_S = 0.07;
const rankRowEase = [0.22, 1, 0.36, 1] as const;

function rankRowRevealDelay(index: number): number {
  if (index < RANK_ROW_STAGGER_COUNT) return index * RANK_ROW_STAGGER_STEP_S;
  return RANK_ROW_STAGGER_COUNT * RANK_ROW_STAGGER_STEP_S;
}

function displayMain(metric: CommunityMetric, row: CommunityGroupLeaderboardRow): string {
  if (metric === "activeWinStreak") {
    return String(Math.round(row.activeWinStreak));
  }
  if (metric === "winRate") {
    const v = row.winRate <= 1 ? row.winRate : row.winRate / 100;
    return `${Math.round(v * 1000) / 10}%`;
  }
  if (metric === "totalPrecision" || metric === "totalUpset") {
    return (Math.round(row.sortValue * 10) / 10).toLocaleString();
  }
  return (Math.round(row.sortValue * 100) / 100).toLocaleString();
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
  listPreview = null,
  onRequestEndGroup,
  className = "",
}: CommunityGroupDetailViewProps) {
  const router = useRouter();
  const pathname = usePathname();
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

    const entry = await fetchCommunityGroupDetail(groupId);
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
  const myUid = auth.currentUser?.uid ?? null;
  const rankMetricForProfile = communityMetricToMobile(metric);

  const prefersReducedMotion = useReducedMotion();

  const rankListAnimKey = useMemo(
    () =>
      `${groupId}:${metric}:${rows.map((r) => `${r.uid}:${r.rank}`).join("|")}`,
    [groupId, metric, rows]
  );

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
        inOverlay ? "pt-12" : "min-h-0 flex-1",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {inOverlay ? <ShellGridOverlay /> : null}
      {(showBackLink || showCloseButton) && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5">
          <div className="min-w-0">
            {showBackLink ? (
              <Link
                href={rankingsHref}
                className="text-xs text-cyan-300/90 underline"
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
              className="rounded-lg border border-white/15 px-3 py-1 text-xs text-white/80 hover:bg-white/5"
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
          <p className="text-sm text-white/45">
            {commMsg(language, {
              en: "Loading…",
              ja: "読み込み中…",
            })}
          </p>
        )}

        {!loadingDetail && summary && (
          <>
            <h1
              className={[
                "font-bold leading-tight text-white",
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
                "mt-2 text-white/55",
                isWeb ? "text-sm" : "text-xs sm:text-sm",
              ].join(" ")}
            >
              {t.members}: {summary.memberCount} ·{" "}
              {leagueLabel(summary.rankingLeague ?? "all", language)} ·{" "}
              {metricLabel(metric, language)} ·{" "}
              {periodLabel("from_now", language)}
            </p>

            {summary.archived && (
              <p className="mt-2 text-sm text-amber-200/90">{t.ended}</p>
            )}

            {summary.isOwner && !summary.archived && (
              <div className="mt-4 space-y-2 rounded-xl border border-blue-400/20 bg-blue-500/8 p-3">
                <p
                  className={[
                    "font-medium uppercase tracking-wide text-blue-200/70",
                    isWeb ? "text-xs" : "text-[11px]",
                  ].join(" ")}
                >
                  {t.inviteLabel}
                </p>
                {summary.inviteCode ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={[
                        "min-w-0 flex-1 font-mono font-bold tracking-[0.18em] text-white tabular-nums",
                        isWeb ? "text-xl" : "text-lg",
                      ].join(" ")}
                    >
                      {summary.inviteCode}
                    </p>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void onCopyInvite()}
                        className={[
                          "flex items-center gap-1 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 font-semibold text-white/90",
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
                          "flex items-center gap-1 rounded-lg border border-blue-400/35 bg-blue-500/15 px-2.5 py-1.5 font-semibold text-blue-100",
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
                    "mt-2 w-full rounded-lg border border-red-400/30 bg-red-500/10 py-2 text-red-200",
                    isWeb ? "text-base" : "text-sm",
                  ].join(" ")}
                >
                  {t.endGroup}
                </button>
              </div>
            )}

            {!summary.isOwner && !summary.archived && (
              <button
                type="button"
                onClick={() => void onLeave()}
                className={[
                  "mt-4 w-full rounded-xl border border-white/15 py-2 text-white/80",
                  isWeb ? "text-base" : "text-sm",
                ].join(" ")}
              >
                {t.leave}
              </button>
            )}

            <h2
              className={[
                "mb-2 mt-6 font-bold text-white/85",
                isWeb ? "text-base" : "text-sm",
              ].join(" ")}
            >
              {t.ranking}
            </h2>
            {loadingRows ? (
              <div className="space-y-2 rounded-xl border border-white/10 bg-white/4 p-4">
                <div className="h-3 w-2/5 animate-pulse rounded bg-white/10" />
                <div className="h-8 animate-pulse rounded-lg bg-white/8" />
                <div className="h-8 animate-pulse rounded-lg bg-white/8" />
              </div>
            ) : null}
            <div
              className={[
                "overflow-hidden rounded-xl border border-white/10",
                loadingRows ? "hidden" : "",
              ].join(" ")}
            >
              <table className={["w-full text-left", isWeb ? "text-base" : "text-sm"].join(" ")}>
                <thead
                  className={[
                    "border-b border-white/10 bg-white/6 text-white/55",
                    isWeb ? "text-sm" : "text-xs",
                  ].join(" ")}
                >
                  <tr>
                    <th className="px-2 py-2">{t.rank}</th>
                    <th className="px-2 py-2">{t.player}</th>
                    <th className="px-2 py-2 text-right">{t.score}</th>
                  </tr>
                </thead>
                <tbody key={rankListAnimKey}>
                  {rows.map((r, index) => (
                    <motion.tr
                      key={r.uid}
                      className={[
                        "border-b text-white/90 transition-colors cursor-pointer hover:bg-white/6",
                        r.uid === myUid
                          ? "border-cyan-400/30 bg-cyan-500/10"
                          : "border-white/5",
                      ].join(" ")}
                      role="link"
                      tabIndex={0}
                      onClick={() => {
                        const handleOrUid = r.handle || r.uid;
                        const base = variant === "web" ? "/web" : "/mobile";
                        const href = profileHrefWithRankingsReturn(
                          pathname,
                          base,
                          handleOrUid,
                          {
                            metric: rankMetricForProfile,
                            phase: "playoffs",
                          }
                        );
                        router.push(href);
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter" && e.key !== " ") return;
                        e.preventDefault();
                        const handleOrUid = r.handle || r.uid;
                        const base = variant === "web" ? "/web" : "/mobile";
                        const href = profileHrefWithRankingsReturn(
                          pathname,
                          base,
                          handleOrUid,
                          {
                            metric: rankMetricForProfile,
                            phase: "playoffs",
                          }
                        );
                        router.push(href);
                      }}
                      initial={
                        prefersReducedMotion ? false : { opacity: 0, y: 8 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: prefersReducedMotion ? 0 : 0.32,
                        delay: prefersReducedMotion
                          ? 0
                          : rankRowRevealDelay(index),
                        ease: rankRowEase,
                      }}
                    >
                      <td className={["px-2 py-2 font-mono", isWeb ? "text-sm" : "text-xs"].join(" ")}>{r.rank}</td>
                      <td className="px-2 py-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="relative h-7 w-7 shrink-0">
                            {r.plan === "pro" ? (
                              <>
                                <span
                                  className="pointer-events-none absolute -inset-[2px] z-0 rounded-full border border-cyan-400/22 shadow-[0_0_10px_rgba(34,211,238,0.14)]"
                                  aria-hidden
                                />
                                <span
                                  className="pointer-events-none absolute inset-0 z-[1] rounded-full border border-white/[0.08]"
                                  aria-hidden
                                />
                              </>
                            ) : null}
                            <div className="relative z-[2] h-full w-full overflow-hidden rounded-full">
                              {r.photoURL ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={r.photoURL}
                                  alt=""
                                  className="h-7 w-7 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-7 w-7 rounded-full bg-white/10" />
                              )}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 max-w-full items-center gap-1 overflow-hidden">
                              <span
                                className={[
                                  "truncate font-medium text-white/90",
                                  isWeb ? "text-sm" : "text-xs",
                                ].join(" ")}
                              >
                                {r.displayName}
                              </span>
                              {r.plan === "pro" ? (
                                <ProCyberBadge
                                  {...proBadgeStaticMotion}
                                  compact
                                  ariaLabel={
                                    commMsg(language, {
                                      en: "Pro member",
                                      ja: "Pro 会員",
                                    })
                                  }
                                />
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={["px-2 py-2 text-right font-mono", isWeb ? "text-sm" : "text-xs"].join(" ")}>
                        {displayMain(metric, r)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
    </>
  );
}
