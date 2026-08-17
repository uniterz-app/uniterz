"use client";

import { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, X, MessageCircle } from "lucide-react";
import type { Language } from "@/lib/i18n/language";
import { toast } from "@/app/component/ui/toast";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";
import { CommunityModalGridBackdrop } from "@/app/component/communities/CommunityModalGridBackdrop";
import { COMMUNITY_MODAL_CARD_CLASS } from "@/app/component/communities/CommunityCrtTheme";
import { copyTextToClipboard } from "@/lib/clipboard/copyText";
import {
  buildCommunityInviteShareText,
  buildCommunityInviteShareUrls,
} from "@/lib/communities/inviteShare";

type Props = {
  open: boolean;
  inviteCode: string;
  groupName?: string;
  language: Language;
  onClose: () => void;
};

export default function InviteShareModal({
  open,
  inviteCode,
  groupName,
  language,
  onClose,
}: Props) {
  const [copyBusy, setCopyBusy] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);

  const urls = useMemo(
    () =>
      buildCommunityInviteShareUrls({
        inviteCode,
        groupName,
        language,
      }),
    [inviteCode, groupName, language]
  );

  const text = urls.text;
  const t = useMemo(
    () =>
      language === "en"
        ? {
            title: "Share invite",
            line: "Share to LINE",
            x: "Share to X",
            copy: "Copy message",
            copied: "Invite message copied.",
            copyFailed: "Could not copy.",
          }
        : {
            title: "招待を共有",
            line: "LINEで共有",
            x: "Xで共有",
            copy: "招待文をコピー",
            copied: "招待文をコピーしました。",
            copyFailed: "コピーできませんでした。",
          },
    [language]
  );

  const onCopy = useCallback(async () => {
    if (copyBusy) return;
    setCopyBusy(true);
    try {
      const ok = await copyTextToClipboard(text);
      if (ok) {
        setCopiedNotice(true);
        window.setTimeout(() => setCopiedNotice(false), 1600);
      } else {
        toast.error(t.copyFailed);
      }
    } finally {
      setCopyBusy(false);
    }
  }, [copyBusy, t.copyFailed, text]);

  const onOpenExternal = useCallback(
    (url: string) => {
      window.open(url, "_blank", "noopener,noreferrer");
      onClose();
    },
    [onClose]
  );

  const onOpenLine = useCallback(() => {
    // Mobile: open LINE app only (no web fallback to avoid unwanted redirect).
    const ua = navigator.userAgent || "";
    const isMobile =
      /iPhone|iPad|iPod|Android/i.test(ua) ||
      (typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches);
    if (isMobile) {
      window.location.href = urls.lineAppUrl;
      onClose();
      return;
    }
    onOpenExternal(urls.lineUrl);
  }, [onClose, onOpenExternal, urls.lineAppUrl, urls.lineUrl]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000040] overflow-hidden overscroll-none"
      role="dialog"
      aria-modal
      aria-labelledby="invite-share-title"
    >
      <CommunityModalGridBackdrop onClick={onClose} />
      <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center p-4 pb-[max(1rem,var(--bottom-nav-clearance))]">
        <div
          className={`pointer-events-auto w-full max-w-sm ${COMMUNITY_MODAL_CARD_CLASS} px-5 py-6`}
          onClick={(e) => e.stopPropagation()}
        >
          <ShellGridOverlay />
          {copiedNotice ? (
            <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
              <div className="rounded-none border border-emerald-300/35 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 shadow-[0_0_24px_rgba(16,185,129,0.35)]">
                {t.copied}
              </div>
            </div>
          ) : null}
          <div className="relative z-10">
            <h2
              id="invite-share-title"
              className="text-center text-xl font-bold text-white"
            >
              {t.title}
            </h2>
            <p className="mt-2 text-center text-sm leading-relaxed text-white/65">
              {groupName ? (
                language === "en" ? (
                  <>Join “{groupName}” on Uniterz.</>
                ) : (
                  <>Uniterzで「{groupName}」に参加しよう。</>
                )
              ) : language === "en" ? (
                <>Join on Uniterz and compete with others.</>
              ) : (
                <>Uniterzに参加して競おう。</>
              )}
            </p>

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={onOpenLine}
                className="flex w-full items-center justify-center gap-2 rounded-none border border-[rgba(0,245,255,0.35)] bg-[rgba(0,245,255,0.12)] px-4 py-2.5 text-sm font-semibold text-cyan-50"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                {t.line}
              </button>
              <button
                type="button"
                onClick={() => onOpenExternal(urls.xUrl)}
                className="flex w-full items-center justify-center gap-2 rounded-none border border-[rgba(0,245,255,0.22)] bg-[rgba(0,245,255,0.06)] px-4 py-2.5 text-sm font-semibold text-cyan-50/90"
              >
                <X className="h-4 w-4" aria-hidden />
                {t.x}
              </button>
              <button
                type="button"
                onClick={() => void onCopy()}
                disabled={copyBusy}
                className="flex w-full items-center justify-center gap-2 rounded-none border border-[rgba(0,245,255,0.22)] bg-[rgba(0,245,255,0.06)] px-4 py-2.5 text-sm font-semibold text-cyan-50/90 disabled:opacity-60"
              >
                <Copy className="h-4 w-4" aria-hidden />
                {t.copy}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

