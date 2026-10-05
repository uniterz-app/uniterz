"use client";

/** ユーザー / グループの通報・ブロック（App Store 1.2）。Native `ModerationSheetNative` と同じ手順 */

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import cn from "clsx";
import { resolveLocalizedLang } from "@/lib/i18n/localize";
import { moderationCopy } from "@/lib/moderation/moderationCopy";
import {
  MODERATION_REPORT_REASONS,
  type ModerationReportReason,
  type ModerationTargetType,
} from "@/lib/moderation/moderationTypes";
import {
  blockUser,
  submitModerationReport,
  unblockUser,
  useBlockedUids,
} from "@/lib/moderation/useBlockedUids";

type Step =
  | { kind: "menu" }
  | { kind: "reasons" }
  | { kind: "blockConfirm" }
  | { kind: "sending" }
  | { kind: "done"; title: string; body?: string };

type Tone = "accent" | "danger" | "ghost";

function ActionButton({
  label,
  tone,
  onClick,
}: {
  label: string;
  tone: Tone;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full border bg-transparent py-3 font-mono text-sm font-bold tracking-wide transition-colors",
        tone === "accent" && "border-cyan-300/55 text-cyan-200 active:bg-cyan-300/10",
        tone === "danger" && "border-red-400/55 text-red-300 active:bg-red-400/10",
        tone === "ghost" && "border-white/15 text-white/70 active:bg-white/[0.08]"
      )}
    >
      {label}
    </button>
  );
}

export default function ModerationSheet({
  open,
  onClose,
  targetType,
  targetId,
  targetLabel,
  language,
  onBlocked,
}: {
  open: boolean;
  onClose: () => void;
  targetType: ModerationTargetType;
  targetId: string;
  targetLabel: string;
  language: string | null | undefined;
  onBlocked?: () => void;
}) {
  const copy = useMemo(
    () => moderationCopy(resolveLocalizedLang(language)),
    [language]
  );
  const blockedUids = useBlockedUids();
  const isBlocked = targetType === "user" && blockedUids.has(targetId);
  const [step, setStep] = useState<Step>({ kind: "menu" });
  const [blockedNow, setBlockedNow] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(targetType === "group" ? { kind: "reasons" } : { kind: "menu" });
      setBlockedNow(false);
    }
  }, [open, targetType]);

  if (!open || typeof document === "undefined") return null;

  const close = () => {
    if (step.kind === "sending") return;
    onClose();
    if (blockedNow) onBlocked?.();
  };

  const sendReport = async (reason: ModerationReportReason) => {
    setStep({ kind: "sending" });
    const result = await submitModerationReport({ targetType, targetId, reason });
    setStep(
      result === "ok"
        ? { kind: "done", title: copy.reportDoneTitle, body: copy.reportDoneBody }
        : {
            kind: "done",
            title: result === "rate_limited" ? copy.rateLimited : copy.failed,
          }
    );
  };

  const doBlock = async () => {
    setStep({ kind: "sending" });
    const ok = await blockUser(targetId);
    setBlockedNow(ok);
    setStep(
      ok
        ? { kind: "done", title: copy.blockDoneTitle, body: copy.blockDoneBody }
        : { kind: "done", title: copy.failed }
    );
  };

  const doUnblock = async () => {
    setStep({ kind: "sending" });
    const ok = await unblockUser(targetId);
    setStep({ kind: "done", title: ok ? copy.unblockDoneTitle : copy.failed });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 px-6"
      onClick={close}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[320px] border border-cyan-300/30 bg-black px-5 py-[18px]"
        onClick={(e) => e.stopPropagation()}
      >
        {targetLabel ? (
          <p className="mb-3.5 truncate text-center text-[15px] font-bold text-white/95">
            {targetLabel}
          </p>
        ) : null}

        {step.kind === "menu" ? (
          <div className="flex flex-col gap-2.5">
            <ActionButton
              label={copy.report}
              tone="accent"
              onClick={() => setStep({ kind: "reasons" })}
            />
            <ActionButton
              label={isBlocked ? copy.unblock : copy.block}
              tone="danger"
              onClick={() =>
                isBlocked ? void doUnblock() : setStep({ kind: "blockConfirm" })
              }
            />
            <ActionButton label={copy.cancel} tone="ghost" onClick={close} />
          </div>
        ) : null}

        {step.kind === "reasons" ? (
          <>
            <p className="text-center text-base font-bold text-white">
              {copy.reasonTitle}
            </p>
            <div className="mt-4 flex flex-col gap-2.5">
              {MODERATION_REPORT_REASONS.map((reason) => (
                <ActionButton
                  key={reason}
                  label={copy.reasons[reason]}
                  tone="accent"
                  onClick={() => void sendReport(reason)}
                />
              ))}
              <ActionButton label={copy.cancel} tone="ghost" onClick={close} />
            </div>
          </>
        ) : null}

        {step.kind === "blockConfirm" ? (
          <>
            <p className="text-center text-base font-bold text-white">
              {copy.blockConfirmTitle}
            </p>
            <p className="mt-2.5 text-center text-[13px] leading-5 text-slate-400">
              {copy.blockConfirmBody}
            </p>
            <div className="mt-4 flex flex-col gap-2.5">
              <ActionButton
                label={copy.block}
                tone="danger"
                onClick={() => void doBlock()}
              />
              <ActionButton label={copy.cancel} tone="ghost" onClick={close} />
            </div>
          </>
        ) : null}

        {step.kind === "sending" ? (
          <div className="my-6 flex justify-center">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
          </div>
        ) : null}

        {step.kind === "done" ? (
          <>
            <p className="text-center text-base font-bold text-white">{step.title}</p>
            {step.body ? (
              <p className="mt-2.5 text-center text-[13px] leading-5 text-slate-400">
                {step.body}
              </p>
            ) : null}
            <div className="mt-4">
              <ActionButton label={copy.close} tone="ghost" onClick={close} />
            </div>
          </>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
