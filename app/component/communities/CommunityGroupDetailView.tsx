"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { jp } from "@/lib/fonts";
import { toast } from "@/app/component/ui/toast";
import type { CommunityMetric } from "@/lib/communities/types";
import { metricLabel, periodLabel } from "@/lib/communities/labels";
import {
  ProCyberBadge,
  proBadgeStaticMotion,
} from "@/app/component/common/ProCyberBadge";
import type { Language } from "@/lib/i18n/language";

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

type Summary = {
  id: string;
  name: string;
  ownerUid: string;
  memberCount: number;
  headerImageUrl: string | null;
  rankingMetric: CommunityMetric;
  periodType: string;
  archived: boolean;
  isOwner: boolean;
};

type LBRow = {
  rank: number;
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;
  plan?: "free" | "pro";
  sortValue: number;
  winRate: number;
  activeWinStreak: number;
  totalPoints: number;
};

function displayMain(metric: CommunityMetric, row: LBRow): string {
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
  className = "",
}: CommunityGroupDetailViewProps) {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<LBRow[]>([]);
  const [metric, setMetric] = useState<CommunityMetric>("totalPoints");
  const [loading, setLoading] = useState(true);
  const [transferUid, setTransferUid] = useState("");

  const rankingsHref = variant === "web" ? "/web/rankings" : "/mobile/rankings";

  const load = useCallback(async () => {
    const h = await authHeader();
    if (!h || !groupId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [sRes, lRes] = await Promise.all([
        fetch(`/api/communities/${groupId}/summary`, {
          headers: { Authorization: h },
          cache: "no-store",
        }),
        fetch(`/api/communities/${groupId}/leaderboard`, {
          headers: { Authorization: h },
          cache: "no-store",
        }),
      ]);
      const sJson = await sRes.json().catch(() => ({}));
      const lJson = await lRes.json().catch(() => ({}));
      if (!sRes.ok || !sJson?.ok) {
        toast.error(sJson?.error ?? "load failed");
        setSummary(null);
        setRows([]);
        return;
      }
      setSummary(sJson.group);
      setMetric(sJson.group.rankingMetric);
      if (lRes.ok && lJson?.ok) {
        setRows(lJson.rows ?? []);
      } else {
        setRows([]);
      }
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

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
        archived: "This community is archived.",
        regen: "New invite code",
        transfer: "Transfer ownership",
        transferPh: "Member user ID",
        transferBtn: "Transfer",
        archive: "Archive group",
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
      archived: "このコミュニティはアーカイブされています。",
      regen: "招待コードを再発行",
      transfer: "オーナー譲渡",
      transferPh: "譲渡先のユーザーID",
      transferBtn: "譲渡",
      archive: "グループをアーカイブ",
      leave: "グループを退会",
    };
  }, [language]);

  const finishExit = useCallback(() => {
    if (onExitAction) onExitAction();
    else router.push(rankingsHref);
  }, [onExitAction, router, rankingsHref]);

  const onRotate = useCallback(async () => {
    const h = await authHeader();
    if (!h) return;
    const res = await fetch(`/api/communities/${groupId}/rotate-invite`, {
      method: "POST",
      headers: { Authorization: h },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.ok) {
      toast.error(String(json?.error ?? "failed"));
      return;
    }
    const code = String(json.inviteCode ?? "");
    toast.success(
      commMsg(language, {
        en: `New code: ${code}`,
        ja: `新しい招待コード: ${code}`,
      })
    );
    try {
      await navigator.clipboard.writeText(code);
      toast.info(
        commMsg(language, {
          en: "Copied.",
          ja: "コピーしました。",
        })
      );
    } catch {
      /* ignore */
    }
  }, [groupId, language]);

  const onTransfer = useCallback(async () => {
    const id = transferUid.trim();
    if (!id) return;
    const h = await authHeader();
    if (!h) return;
    const ok = window.confirm(
      commMsg(language, {
        en: "Transfer ownership to this user? You will become a member.",
        ja: "このユーザーにオーナーを譲渡しますか？あなたはメンバーになります。",
      })
    );
    if (!ok) return;
    const res = await fetch(`/api/communities/${groupId}/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: h },
      body: JSON.stringify({ targetUid: id }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.ok) {
      toast.error(String(json?.error ?? "failed"));
      return;
    }
    toast.success(
      commMsg(language, {
        en: "Transferred.",
        ja: "譲渡しました。",
      })
    );
    setTransferUid("");
    void load();
  }, [groupId, transferUid, language, load]);

  const onArchive = useCallback(async () => {
    const h = await authHeader();
    if (!h) return;
    const ok = window.confirm(
      commMsg(language, {
        en: "Archive this group? New joins will be blocked.",
        ja: "このグループをアーカイブしますか？新規参加はできなくなります。",
      })
    );
    if (!ok) return;
    const res = await fetch(`/api/communities/${groupId}/archive`, {
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
        en: "Archived.",
        ja: "アーカイブしました。",
      })
    );
    finishExit();
  }, [groupId, language, finishExit]);

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
    finishExit();
  }, [groupId, language, finishExit]);

  const showBanner =
    headerBanner === "wide_when_image" &&
    summary?.headerImageUrl;

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${jp.className} ${className}`}>
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
        <div className="relative h-24 w-full shrink-0 overflow-hidden sm:h-28">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={summary.headerImageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-3">
        {loading && (
          <p className="text-sm text-white/45">
            {commMsg(language, {
              en: "Loading…",
              ja: "読み込み中…",
            })}
          </p>
        )}

        {!loading && summary && (
          <>
            <h1 className="text-lg font-bold leading-tight text-white sm:text-xl">
              {summary.name}
            </h1>
            <p className="mt-1 text-xs text-white/55 sm:text-sm">
              {t.members}: {summary.memberCount} ·{" "}
              {metricLabel(metric, language)} ·{" "}
              {periodLabel(
                summary.periodType as
                  | "all_time"
                  | "calendar_month"
                  | "rolling_30d",
                language
              )}
            </p>

            {summary.archived && (
              <p className="mt-2 text-sm text-amber-200/90">{t.archived}</p>
            )}

            {summary.isOwner && !summary.archived && (
              <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-white/4 p-3">
                <button
                  type="button"
                  onClick={() => void onRotate()}
                  className="w-full rounded-lg border border-cyan-400/25 bg-cyan-500/10 py-2 text-sm text-cyan-100"
                >
                  {t.regen}
                </button>
                <div className="flex gap-2">
                  <input
                    value={transferUid}
                    onChange={(e) => setTransferUid(e.target.value)}
                    placeholder={t.transferPh}
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 font-mono text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => void onTransfer()}
                    className="shrink-0 rounded-lg border border-white/15 bg-white/10 px-2 py-1.5 text-xs text-white/90"
                  >
                    {t.transferBtn}
                  </button>
                </div>
                <p className="text-[10px] text-white/35">{t.transfer}</p>
                <button
                  type="button"
                  onClick={() => void onArchive()}
                  className="w-full rounded-lg border border-red-400/30 bg-red-500/10 py-2 text-sm text-red-200"
                >
                  {t.archive}
                </button>
              </div>
            )}

            {!summary.isOwner && !summary.archived && (
              <button
                type="button"
                onClick={() => void onLeave()}
                className="mt-4 w-full rounded-xl border border-white/15 py-2 text-sm text-white/80"
              >
                {t.leave}
              </button>
            )}

            <h2 className="mb-2 mt-6 text-sm font-bold text-white/85">
              {t.ranking}
            </h2>
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-white/6 text-xs text-white/55">
                  <tr>
                    <th className="px-2 py-2">{t.rank}</th>
                    <th className="px-2 py-2">{t.player}</th>
                    <th className="px-2 py-2 text-right">{t.score}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.uid}
                      className="border-b border-white/5 text-white/90"
                    >
                      <td className="px-2 py-2 font-mono text-xs">{r.rank}</td>
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
                              <span className="truncate text-xs font-medium text-white/90">
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
                            {r.handle ? (
                              <div className="truncate text-[11px] text-white/40">
                                @{r.handle}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-xs">
                        {displayMain(metric, r)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
