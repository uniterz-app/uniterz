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
  onStart: () => void;
};

/** ブラケット未提出時 — 入力フロー開始前の確認（CyberEventModalFrame） */
export default function WcBracketStartPromptModal({
  open,
  language = "ja",
  onClose,
  onStart,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const m = t(language);
  const isJa = language === "ja";

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
            tagLabel={isJa ? "ブラケット未提出" : "NOT SUBMITTED"}
            title={
              isJa ? "ブラケットを提出しますか？" : "Submit your bracket?"
            }
            body={
              <div className="space-y-3">
                <p id="wc-bracket-start-prompt-title">
                  {isJa
                    ? "ノックアウト全31試合を予想し"
                    : "Predict all 31 knockout matches."}
                </p>
                <p>
                  {isJa
                    ? "すべての予想を的中させたユーザーにユニフォームがプレゼントされます"
                    : "Users who get every pick right win a jersey."}
                </p>
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
