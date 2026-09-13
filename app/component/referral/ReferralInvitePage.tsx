"use client";

/**
 * 招待画面（docs/referral-design.md §16）
 * 進捗・コードは GET /api/me/referral
 */
import { useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";
import ProfileCyberPage from "@/app/component/profile/ProfileCyberPage";
import { nameOxanium } from "@/lib/fonts";
import {
  renderReferralSkewedDigits,
  referralSkewBlockClassName,
  referralSkewBlockStyle,
} from "@/lib/referral/referralSkewedDigits";
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
  type ReferralInviteSummary,
} from "@/lib/referral/referralRewards";
import {
  referralInviteProgressHint,
  referralInviteScreenCopy,
  referralInviteStatusLabel,
} from "@/lib/referral/referralInviteCopy";
import ReferralStampBoard from "@/app/component/referral/ReferralStampBoard";

function qrImageUrl(data: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=168x168&margin=8&data=${encodeURIComponent(data)}`;
}

export default function ReferralInvitePage() {
  const { fUser } = useFirebaseUser();
  const { language } = useUserLanguage(fUser?.uid ?? null);
  const copy = referralInviteScreenCopy(language);
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
        flash(copy.copyFailed);
      }
    },
    [flash, copy.copyFailed]
  );

  const share = useCallback(async () => {
    const title = copy.shareTitle;
    const text = copy.shareTextOnly(summary.inviteCode);
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: summary.inviteUrl });
        return;
      }
      await copyText(
        `${text}\n${summary.inviteUrl}`,
        copy.inviteTextCopied
      );
    } catch {
      /* cancelled */
    }
  }, [copy, copyText, summary.inviteCode, summary.inviteUrl]);

  return (
    <ProfileCyberPage
      title="INVITE"
      eyebrow="PROFILE"
      subtitle={copy.description}
      contentClassName="max-w-lg space-y-4 pb-8"
    >
      {loading ? (
        <p
          className={[
            nameOxanium.className,
            "text-[10px] font-bold uppercase tracking-[0.12em] text-white/40",
          ].join(" ")}
        >
          {copy.loading}
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
            {copy.sendInvite}
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
                {copy.inviteCode}
              </p>
              <div className="flex items-stretch gap-2">
                <code
                  className={referralSkewBlockClassName(
                    "min-w-0 flex-1 truncate border border-amber-300/35 bg-amber-300/10 px-3 py-2.5 text-[16px] font-bold tracking-[0.14em] text-amber-100"
                  )}
                  style={referralSkewBlockStyle}
                >
                  {summary.inviteCode}
                </code>
                <button
                  type="button"
                  onClick={() =>
                    void copyText(summary.inviteCode, copy.codeCopied)
                  }
                  className={[
                    nameOxanium.className,
                    "shrink-0 border border-amber-300/30 bg-amber-300/10 px-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-amber-100/90",
                  ].join(" ")}
                >
                  {copy.copy}
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
                {copy.inviteLink}
              </p>
              <div className="flex items-stretch gap-2">
                <p className="min-w-0 flex-1 truncate border border-white/12 bg-white/[0.03] px-3 py-2.5 text-[11px] text-cyan-200/85">
                  {summary.inviteUrl}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    void copyText(summary.inviteUrl, copy.linkCopied)
                  }
                  className={[
                    nameOxanium.className,
                    "shrink-0 border border-white/15 bg-white/[0.06] px-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-white/75",
                  ].join(" ")}
                >
                  {copy.copy}
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
          {copy.shareInvite}
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
          {copy.rewards}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              label: copy.you,
              value: `+${REFERRAL_REFERRER_UNITS_PER_COMPLETED}`,
              hint: copy.perClear,
            },
            {
              label: copy.friend,
              value: `+${REFERRAL_INVITEE_UNITS}`,
              hint: copy.once,
            },
            {
              label: copy.bonus,
              value: `+${REFERRAL_MILESTONES[0].bonusUnits}/+${REFERRAL_MILESTONES[1].bonusUnits}/+${REFERRAL_MILESTONES[2].bonusUnits}`,
              hint: "3 / 5 / 10",
            },
            {
              label: copy.cap,
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
                {renderReferralSkewedDigits(c.value)}
                <span className="ml-1 text-[8px] tracking-[0.1em] text-white/40">
                  UNIT
                </span>
              </p>
              <p className="mt-0.5 text-[10px] text-white/35">
                {renderReferralSkewedDigits(c.hint)}
              </p>
            </div>
          ))}
        </div>
        <p className="text-[11px] leading-relaxed text-white/40">
          {copy.grantNote}
        </p>
      </section>

      {/* 進行ステータス */}
      <section className="grid grid-cols-2 gap-2">
        {[
          {
            label: copy.active,
            value: String(summary.inProgressCount),
          },
          {
            label: copy.review,
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
        language={language}
      />

      <section className="space-y-2">
        <h2
          className={[
            nameOxanium.className,
            "text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/70",
          ].join(" ")}
        >
          {copy.inviteProgress}
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
                  {referralInviteStatusLabel(row.status, copy.lang)}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-white/45">
                {referralInviteProgressHint(row, language)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </ProfileCyberPage>
  );
}
