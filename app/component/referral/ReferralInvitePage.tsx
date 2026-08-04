"use client";

/**
 * 招待画面（docs/referral-design.md §16）
 * 進捗・コードは GET /api/me/referral
 */
import { useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";
import ProfileCyberPage from "@/app/component/profile/ProfileCyberPage";
import { nameOxanium } from "@/lib/fonts";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { fetchMeReferral } from "@/lib/api/fetchMeReferral";
import {
  REFERRAL_INVITEE_UNITS,
  REFERRAL_MILESTONES,
  REFERRAL_REFERRER_MAX_COMPLETED,
  REFERRAL_REFERRER_MAX_UNITS,
  REFERRAL_REFERRER_UNITS_PER_COMPLETED,
  emptyReferralInviteSummary,
  type ReferralInviteProgressRow,
  type ReferralInviteStatus,
  type ReferralInviteSummary,
} from "@/lib/referral/referralRewards";
import ReferralStampBoard from "@/app/component/referral/ReferralStampBoard";

function statusLabel(status: ReferralInviteStatus, isJa: boolean): string {
  if (isJa) {
    switch (status) {
      case "completed":
        return "達成";
      case "in_progress":
        return "進行中";
      case "under_review":
        return "確認中";
      case "registered":
        return "登録済";
      case "invalid":
        return "無効";
      case "fraud_rejected":
        return "対象外";
      case "withdrawn":
        return "退会";
      default:
        return status;
    }
  }
  switch (status) {
    case "completed":
      return "Done";
    case "in_progress":
      return "In progress";
    case "under_review":
      return "Review";
    case "registered":
      return "Registered";
    case "invalid":
      return "Invalid";
    case "fraud_rejected":
      return "Rejected";
    case "withdrawn":
      return "Left";
    default:
      return status;
  }
}

function progressHint(row: ReferralInviteProgressRow, isJa: boolean): string {
  if (row.status === "completed") {
    return isJa ? "条件達成・付与済" : "Completed";
  }
  if (row.status === "in_progress" || row.status === "registered") {
    const left = Math.max(0, 7 - row.activePredictDays);
    return isJa
      ? `予想投稿日数：${row.activePredictDays}／7日 / あと${left}日間の予想投稿で条件達成`
      : `Predict days: ${row.activePredictDays}/7 · ${left} more day(s) to qualify`;
  }
  return statusLabel(row.status, isJa);
}

function qrImageUrl(data: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=168x168&margin=8&data=${encodeURIComponent(data)}`;
}

export default function ReferralInvitePage() {
  const { fUser } = useFirebaseUser();
  const { language } = useUserLanguage(fUser?.uid ?? null);
  const isJa = language === "ja";
  const [summary, setSummary] = useState<ReferralInviteSummary>(() =>
    emptyReferralInviteSummary()
  );
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const uid = fUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const data = await fetchMeReferral();
        if (cancelled) return;
        const origin =
          typeof window !== "undefined" ? window.location.origin : "";
        const path = data.invitePath || data.inviteUrl || "";
        const inviteUrl = path.startsWith("http")
          ? path
          : `${origin}${path.startsWith("/") ? path : `/${path}`}`;
        setSummary({
          inviteCode: data.inviteCode,
          inviteUrl,
          completedCount: data.completedCount,
          inProgressCount: data.inProgressCount,
          underReviewCount: data.underReviewCount,
          unitsFromBase: data.unitsFromBase,
          unitsFromMilestones: data.unitsFromMilestones,
          rows: data.rows ?? [],
        });
      } catch {
        if (!cancelled) {
          setSummary(emptyReferralInviteSummary());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fUser?.uid]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  }, []);

  const copyText = useCallback(
    async (text: string, okMsg: string) => {
      try {
        await navigator.clipboard.writeText(text);
        flash(okMsg);
      } catch {
        flash(isJa ? "コピーに失敗しました" : "Copy failed");
      }
    },
    [flash, isJa]
  );

  const share = useCallback(async () => {
    const title = isJa ? "Uniterz に招待" : "Join me on Uniterz";
    const text = isJa
      ? `Uniterz でスポーツ予想しよう。招待コード: ${summary.inviteCode}`
      : `Join me on Uniterz. Invite code: ${summary.inviteCode}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: summary.inviteUrl });
        return;
      }
      await copyText(
        `${text}\n${summary.inviteUrl}`,
        isJa ? "招待文をコピーしました" : "Invite text copied"
      );
    } catch {
      /* cancelled */
    }
  }, [copyText, isJa, summary.inviteCode, summary.inviteUrl]);

  return (
    <ProfileCyberPage
      title="INVITE"
      eyebrow="PROFILE"
      subtitle={
        isJa
          ? "友達を招待して Unit を獲得。相手が7日分の予想を出すと双方に付与されます。"
          : "Invite friends for Units. Both earn when they predict on 7 different days."
      }
      contentClassName="max-w-lg space-y-4"
    >
      {loading ? (
        <p
          className={[
            nameOxanium.className,
            "text-[10px] font-bold uppercase tracking-[0.12em] text-white/40",
          ].join(" ")}
        >
          {isJa ? "読み込み中…" : "Loading…"}
        </p>
      ) : null}
      {toast ? (
        <p
          className={[
            nameOxanium.className,
            "border border-[#2DFF6E]/35 bg-[#2DFF6E]/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#2DFF6E]/90",
          ].join(" ")}
        >
          {toast}
        </p>
      ) : null}

      {/* 共有（主役） */}
      <section className="space-y-3 border border-cyan-300/25 bg-[rgba(6,12,20,0.92)] p-3">
        <div className="flex items-center justify-between gap-2">
          <h2
            className={[
              nameOxanium.className,
              "text-[11px] font-extrabold uppercase tracking-[0.16em] text-cyan-200/90",
            ].join(" ")}
          >
            {isJa ? "招待を送る" : "Send invite"}
          </h2>
          <p
            className={[
              nameOxanium.className,
              "text-[8px] font-bold uppercase tracking-[0.12em] text-white/35",
            ].join(" ")}
          >
            CODE · LINK · QR
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="min-w-0 space-y-2.5">
            <div>
              <p
                className={[
                  nameOxanium.className,
                  "mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white/40",
                ].join(" ")}
              >
                {isJa ? "招待コード" : "Invite code"}
              </p>
              <div className="flex items-stretch gap-2">
                <code className="min-w-0 flex-1 truncate border border-amber-300/35 bg-amber-300/10 px-3 py-2.5 text-[16px] font-bold tracking-[0.14em] text-amber-100">
                  {summary.inviteCode}
                </code>
                <button
                  type="button"
                  onClick={() =>
                    void copyText(
                      summary.inviteCode,
                      isJa ? "コードをコピーしました" : "Code copied"
                    )
                  }
                  className={[
                    nameOxanium.className,
                    "shrink-0 border border-amber-300/30 bg-amber-300/10 px-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-amber-100/90",
                  ].join(" ")}
                >
                  {isJa ? "コピー" : "Copy"}
                </button>
              </div>
            </div>

            <div>
              <p
                className={[
                  nameOxanium.className,
                  "mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white/40",
                ].join(" ")}
              >
                {isJa ? "招待リンク" : "Invite link"}
              </p>
              <div className="flex items-stretch gap-2">
                <p className="min-w-0 flex-1 truncate border border-white/12 bg-white/[0.03] px-3 py-2.5 text-[11px] text-cyan-200/85">
                  {summary.inviteUrl}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    void copyText(
                      summary.inviteUrl,
                      isJa ? "リンクをコピーしました" : "Link copied"
                    )
                  }
                  className={[
                    nameOxanium.className,
                    "shrink-0 border border-white/15 bg-white/[0.06] px-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-white/75",
                  ].join(" ")}
                >
                  {isJa ? "コピー" : "Copy"}
                </button>
              </div>
            </div>
          </div>

          <div className="mx-auto flex w-[132px] flex-col items-center gap-1.5 sm:mx-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImageUrl(summary.inviteUrl)}
              alt=""
              width={132}
              height={132}
              className="border border-white/20 bg-white p-1.5"
            />
            <p
              className={[
                nameOxanium.className,
                "text-[8px] font-bold uppercase tracking-[0.14em] text-white/35",
              ].join(" ")}
            >
              QR
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void share()}
          className={[
            nameOxanium.className,
            "w-full border border-cyan-300/50 bg-cyan-300/15 px-3 py-3 text-[12px] font-extrabold uppercase tracking-[0.16em] text-cyan-50",
          ].join(" ")}
        >
          {isJa ? "招待を共有" : "Share invite"}
        </button>
      </section>

      {/* 報酬（コンパクト） */}
      <section className="space-y-2 border border-white/12 bg-white/[0.03] p-3">
        <h2
          className={[
            nameOxanium.className,
            "text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/70",
          ].join(" ")}
        >
          {isJa ? "報酬" : "Rewards"}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              label: isJa ? "あなた" : "You",
              value: `+${REFERRAL_REFERRER_UNITS_PER_COMPLETED}`,
              hint: isJa ? "1人達成ごと" : "per clear",
            },
            {
              label: isJa ? "友達" : "Friend",
              value: `+${REFERRAL_INVITEE_UNITS}`,
              hint: isJa ? "1回のみ" : "once",
            },
            {
              label: isJa ? "区切り" : "Bonus",
              value: `+${REFERRAL_MILESTONES[0].bonusUnits}/+${REFERRAL_MILESTONES[1].bonusUnits}/+${REFERRAL_MILESTONES[2].bonusUnits}`,
              hint: "3 / 5 / 10",
            },
            {
              label: isJa ? "上限" : "Cap",
              value: String(REFERRAL_REFERRER_MAX_UNITS),
              hint: `${REFERRAL_REFERRER_MAX_COMPLETED} invites`,
            },
          ].map((c) => (
            <div
              key={c.label}
              className="border border-white/10 bg-black/25 px-2.5 py-2"
            >
              <p
                className={[
                  nameOxanium.className,
                  "text-[8px] font-bold uppercase tracking-[0.12em] text-white/40",
                ].join(" ")}
              >
                {c.label}
              </p>
              <p
                className={[
                  nameOxanium.className,
                  "mt-1 text-[15px] font-extrabold tabular-nums tracking-wide text-cyan-100",
                ].join(" ")}
              >
                {c.value}
                <span className="ml-1 text-[8px] tracking-[0.1em] text-white/40">
                  UNIT
                </span>
              </p>
              <p className="mt-0.5 text-[10px] text-white/35">{c.hint}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] leading-relaxed text-white/40">
          {isJa
            ? "付与は、友達が異なる7日に有効予想を投稿したあと。登録だけでは付きません。"
            : "Granted after the invitee posts on 7 different days. Signup alone does not count."}
        </p>
      </section>

      {/* 進行ステータス */}
      <section className="grid grid-cols-2 gap-2">
        {[
          {
            label: isJa ? "進行中" : "Active",
            value: String(summary.inProgressCount),
          },
          {
            label: isJa ? "確認中" : "Review",
            value: String(summary.underReviewCount),
          },
        ].map((c) => (
          <div
            key={c.label}
            className="border border-white/10 bg-white/[0.03] px-2.5 py-2.5 text-center"
          >
            <p
              className={[
                nameOxanium.className,
                "text-[8px] font-bold uppercase tracking-[0.12em] text-white/40",
              ].join(" ")}
            >
              {c.label}
            </p>
            <p
              className={[
                nameOxanium.className,
                "mt-1 text-[20px] font-extrabold tabular-nums text-white",
              ].join(" ")}
            >
              {c.value}
            </p>
          </div>
        ))}
      </section>

      <ReferralStampBoard
        completedCount={summary.completedCount}
        isJa={isJa}
      />

      <section className="space-y-2">
        <h2
          className={[
            nameOxanium.className,
            "text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/70",
          ].join(" ")}
        >
          {isJa ? "招待の進捗" : "Invite progress"}
        </h2>
        <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-[2px] border border-white/12">
          {summary.rows.map((row) => (
            <li key={row.id} className="bg-white/[0.02] px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  {row.status === "completed" ? (
                    <span
                      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#F97316]/20"
                      aria-hidden
                    >
                      <Check
                        className="h-3 w-3 stroke-[3]"
                        color="#F97316"
                      />
                    </span>
                  ) : null}
                  <span className="truncate text-[13px] font-semibold text-white/85">
                    {row.label}
                  </span>
                </div>
                <span
                  className={[
                    nameOxanium.className,
                    "shrink-0 text-[9px] font-bold uppercase tracking-[0.1em]",
                    row.status === "completed"
                      ? "text-[#F97316]/90"
                      : "text-cyan-200/75",
                  ].join(" ")}
                >
                  {statusLabel(row.status, isJa)}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-white/45">
                {progressHint(row, isJa)}
              </p>
            </li>
          ))}
        </ul>
        <p className="text-[10px] text-white/30">
          {isJa
            ? "※ 表示はプレビュー用モックです。本番のデータ接続はこれから。"
            : "※ Preview mock data. Live API wiring comes next."}
        </p>
      </section>
    </ProfileCyberPage>
  );
}
