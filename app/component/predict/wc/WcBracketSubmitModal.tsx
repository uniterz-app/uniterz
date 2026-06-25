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
  isResubmit?: boolean;
  language?: Language;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

/** WC ブラケット提出・更新確認（CyberEventModalFrame） */
export default function WcBracketSubmitModal({
  open,
  isResubmit = false,
  language = "ja",
  loading = false,
  onClose,
  onConfirm,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const m = t(language);
  const isJa = language === "ja";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  const tagLabel = isResubmit
    ? isJa
      ? "ブラケット更新"
      : "BRACKET UPDATE"
    : isJa
      ? "提出確認"
      : "SUBMIT CONFIRM";

  const title = isResubmit
    ? isJa
      ? "ブラケットを更新する"
      : "Update your bracket"
    : isJa
      ? "ブラケットを提出する"
      : "Submit your bracket";

  const confirmLabel = loading
    ? isJa
      ? "送信中…"
      : "Submitting…"
    : isResubmit
      ? isJa
        ? "更新する"
        : "Update"
      : isJa
        ? "提出する"
        : "Submit";

  return createPortal(
    <div
      className="fixed inset-0 z-[100010] overflow-hidden"
      role="dialog"
      aria-modal
      aria-labelledby="wc-bracket-submit-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={() => {
          if (loading) return;
          onClose();
        }}
        aria-label={m.common.close}
      />

      <div className="pointer-events-none relative flex h-full min-h-0 items-center justify-center p-4 pb-[max(1rem,var(--bottom-nav-clearance,0px))]">
        <div
          className="pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <CyberEventModalFrame
            monoClassName={mono.className}
            tagLabel={tagLabel}
            title={title}
            body={
              <div className="space-y-3">
                <p id="wc-bracket-submit-modal-title">
                  {isJa
                    ? "ノックアウト全31試合の予想を確定します。"
                    : "Your picks for all 31 knockout matches will be saved."}
                </p>
                <p>
                  {isJa
                    ? "サバイバー方式 — 外した枝から先は表示されません。"
                    : "Survivor mode — branches after your first miss are hidden."}
                </p>
                <p className="text-cyan-300/75">
                  {isJa
                    ? "締切までは何度でも予想を変更できます。"
                    : "You can change your picks anytime before the deadline."}
                </p>
              </div>
            }
            secondaryLabel={isJa ? "戻る" : "Back"}
            onSecondary={() => {
              if (loading) return;
              onClose();
            }}
            confirmLabel={confirmLabel}
            confirmLoading={loading}
            confirmDisabled={loading}
            onConfirm={onConfirm}
            closeAriaLabel={m.common.close}
            onClose={() => {
              if (loading) return;
              onClose();
            }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
