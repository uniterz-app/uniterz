"use client";

/** シーズン予想を両方提出した直後の招待カード（開幕前の紹介特典） */
import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import cn from "clsx";
import { jp, nameOxanium } from "@/lib/fonts";
import { fetchMeReferral } from "@/lib/api/fetchMeReferral";
import { referralPreseasonInviteCopy } from "@/lib/referral/referralPreseasonBonus";
import UniterzLogo from "@/app/component/units/UniterzLogo";

type Props = {
  open: boolean;
  language?: string | null;
  onClose: () => void;
};

export default function ReferralPreseasonInviteCard({ open, language, onClose }: Props) {
  const copy = referralPreseasonInviteCopy(language);
  const [busy, setBusy] = useState(false);

  const handleInvite = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const data = await fetchMeReferral();
      const path = data.invitePath || data.inviteUrl || "";
      const url = path.startsWith("http")
        ? path
        : `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
      const text = copy.shareMessage(data.inviteCode, url);
      if (navigator.share) {
        await navigator.share({ text, url }).catch(() => {});
      } else {
        await navigator.clipboard?.writeText(text).catch(() => {});
      }
      onClose();
    } catch (e) {
      console.error("ReferralPreseasonInviteCard", e);
    } finally {
      setBusy(false);
    }
  }, [busy, copy, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center px-7"
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
    >
      <button
        type="button"
        aria-label={copy.later}
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />
      <div
        className={cn(
          jp.className,
          "relative w-full max-w-[320px] border border-[rgba(0,245,255,0.35)] bg-[#07090d] px-[22px] pb-3.5 pt-[22px] text-center"
        )}
      >
        <p
          className={cn(
            nameOxanium.className,
            "text-[11px] font-extrabold tracking-[0.16em] text-[#ffe9a8]"
          )}
        >
          {copy.eyebrow}
        </p>
        <div className="mx-auto mt-2.5 w-[92px]">
          <UniterzLogo width={92} title="UNITERZ" />
        </div>
        <p className="mt-3 text-[17px] font-extrabold leading-6 text-white/95">
          {copy.title}
        </p>
        <p className="mt-2.5 text-[13px] font-semibold leading-5 text-[rgba(226,246,255,0.75)]">
          {copy.body}
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleInvite()}
          className="mt-5 min-h-[44px] w-full bg-[#00F5FF] px-5 text-[14px] font-extrabold text-[#041018] disabled:opacity-70"
        >
          {copy.invite}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-1.5 w-full py-2.5 text-[13px] font-semibold text-white/50"
        >
          {copy.later}
        </button>
      </div>
    </div>,
    document.body
  );
}
