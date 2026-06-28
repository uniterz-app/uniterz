"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IBM_Plex_Mono } from "next/font/google";
import CyberEventModalFrame from "@/app/component/modals/CyberEventModalFrame";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

type Props = {
  open: boolean;
  language?: Language;
  onClose: () => void;
};

/** UNITERZ ノックアウトチャレンジ告知（予想フローで生涯1回表示） */
export default function WcKnockoutChallengeModal({
  open,
  language = "ja",
  onClose,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const m = t(language);
  const isJa = language === "ja";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  const entryConditionLabel = isJa ? "参加条件" : "How to enter";
  const eligibilityLabel = isJa ? "対象者" : "Eligible";
  const entryCondition = isJa
    ? "ノックアウトステージの試合を予想"
    : "Predict knockout stage matches";
  const eligibility = isJa
    ? "総合得点 1 位のユーザー"
    : "The #1 user by total score";

  return createPortal(
    <div
      className="fixed inset-0 z-[1000030] overflow-hidden"
      role="dialog"
      aria-modal
      aria-labelledby="wc-knockout-challenge-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label={m.common.close}
      />

      <div className="pointer-events-none relative flex h-full min-h-0 items-center justify-center p-4 pb-[max(1rem,var(--bottom-nav-clearance,0px))]">
        <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <CyberEventModalFrame
            monoClassName={mono.className}
            tagLabel="UNITERZ"
            title={isJa ? "ノックアウトチャレンジ" : "Knockout Challenge"}
            body={
              <div className="space-y-3">
                <p
                  id="wc-knockout-challenge-title"
                  className="font-semibold text-yellow-300"
                >
                  {isJa
                    ? "ノックアウト期間の 31 試合で総合得点 1 位のユーザーには、ワールドカップ優勝チームのユニフォームがプレゼントされます。"
                    : "The user ranked #1 in total score across the 31 knockout-stage matches wins the jersey of the World Cup champions."}
                </p>

                <div className="space-y-2 rounded-lg border border-cyan-400/25 bg-cyan-500/5 px-3 py-2.5">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-[11px] font-bold tracking-wide text-cyan-300/90">
                      {entryConditionLabel}
                    </span>
                    <span className="text-cyan-200/45">—</span>
                    <span className="text-[13px] font-semibold text-cyan-50/95">
                      {entryCondition}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-[11px] font-bold tracking-wide text-cyan-300/90">
                      {eligibilityLabel}
                    </span>
                    <span className="text-cyan-200/45">—</span>
                    <span className="text-[13px] font-semibold text-cyan-50/95">
                      {eligibility}
                    </span>
                  </div>
                </div>
              </div>
            }
            confirmLabel={isJa ? "予想する" : "Predict"}
            onConfirm={onClose}
            closeAriaLabel={m.common.close}
            onClose={onClose}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
