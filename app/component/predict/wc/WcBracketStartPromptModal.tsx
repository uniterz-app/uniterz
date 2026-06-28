"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IBM_Plex_Mono } from "next/font/google";
import CyberEventModalFrame from "@/app/component/modals/CyberEventModalFrame";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { WC_KNOCKOUT_SEASON } from "@/lib/wc/wc-knockout-bracket";
import { formatWcBracketSubmissionDeadline } from "@/lib/wc/wc-knockout-config";

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

type Props = {
  open: boolean;
  language?: Language;
  season?: string;
  onClose: () => void;
  onStart: () => void;
};

/** WC ブラケット未提出 — 入力フロー開始前の確認（CyberEventModalFrame） */
export default function WcBracketStartPromptModal({
  open,
  language = "ja",
  season = WC_KNOCKOUT_SEASON,
  onClose,
  onStart,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const m = t(language);
  const isJa = language === "ja";
  const deadlineLabel = formatWcBracketSubmissionDeadline(season, language);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000030] overflow-hidden"
      role="dialog"
      aria-modal
      aria-labelledby="wc-bracket-start-prompt-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label={m.common.close}
      />

      <div className="pointer-events-none relative flex h-full min-h-0 items-center justify-center p-4 pb-[max(1rem,var(--bottom-nav-clearance,0px))]">
        <div
          className="pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <CyberEventModalFrame
            monoClassName={mono.className}
            tagLabel={isJa ? "WC ブラケット" : "WC BRACKET"}
            title={
              isJa
                ? "ノックアウトブラケットを予想"
                : "Predict the knockout bracket"
            }
            body={
              <div className="space-y-3">
                <p id="wc-bracket-start-prompt-title">
                  {isJa
                    ? "ノックアウト全31試合の勝者を予想しよう。"
                    : "Pick the winner of all 31 knockout matches."}
                </p>
                <p>
                  {isJa
                    ? "すべての予想を的中させたユーザーにユニフォームがプレゼントされます。"
                    : "Get every pick right to win a jersey."}
                </p>
                {deadlineLabel ? (
                  <p className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2.5 text-[13px] leading-relaxed text-amber-100/95">
                    <span className="font-bold tracking-wide">
                      {isJa ? "締切" : "Deadline"}
                    </span>
                    <span className="mx-1.5 text-amber-200/50">—</span>
                    <span className="font-semibold tabular-nums">
                      {deadlineLabel}
                    </span>
                    <span className="mt-1 block text-[11px] font-normal text-amber-100/65">
                      {isJa
                        ? "R32 第1試合（M73）キックオフまで"
                        : "Before Round of 32 Match 73 kickoff"}
                    </span>
                  </p>
                ) : null}
                <p className="text-cyan-300/75">
                  {isJa
                    ? "締切までは予想を変更できます"
                    : "You can edit your picks before the deadline"}
                </p>
              </div>
            }
            secondaryLabel={isJa ? "あとで" : "Not now"}
            onSecondary={onClose}
            confirmLabel={isJa ? "入力する" : "Start"}
            onConfirm={onStart}
            closeAriaLabel={m.common.close}
            onClose={onClose}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
