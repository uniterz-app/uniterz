"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Download, Instagram, MessageCircle, Share2, X } from "lucide-react";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { toast } from "@/app/component/ui/toast";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";
import { CommunityModalGridBackdrop } from "@/app/component/communities/CommunityModalGridBackdrop";
import { copyImageToClipboard } from "@/lib/clipboard/copyImage";
import {
  buildResultCardShareUrls,
  downloadResultCardImage,
  isMobileShareContext,
  shareResultCardFile,
  type ResultCardImagePayload,
} from "@/lib/result/shareResultCardImage";

type Props = {
  open: boolean;
  payload: ResultCardImagePayload | null;
  language: Language;
  onClose: () => void;
};

export default function ShareResultCardModal({
  open,
  payload,
  language,
  onClose,
}: Props) {
  const m = t(language);
  const r = m.rankings;
  const res = m.results;
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [busy, setBusy] = useState(false);

  const urls = useMemo(
    () => buildResultCardShareUrls(payload?.shareText ?? "", payload?.shareUrl),
    [payload?.shareText, payload?.shareUrl]
  );
  const mobile = isMobileShareContext();

  useEffect(() => {
    if (!open) setCopiedNotice(false);
  }, [open]);

  const runNativeShare = useCallback(async (): Promise<boolean> => {
    if (!payload) return false;
    setBusy(true);
    try {
      const result = await shareResultCardFile(payload.file, payload.shareText);
      if (result === "shared") {
        onClose();
        return true;
      }
      if (result === "cancelled") return true;
      return false;
    } finally {
      setBusy(false);
    }
  }, [onClose, payload]);

  const onShareToApps = useCallback(async () => {
    const ok = await runNativeShare();
    if (!ok && payload) {
      downloadResultCardImage(payload.dataUrl, "uniterz-result-card.png");
      toast.info(r.shareRankCardSaveHint);
    }
  }, [payload, r.shareRankCardSaveHint, runNativeShare]);

  const onShareInstagram = useCallback(async () => {
    if (mobile) {
      await onShareToApps();
      return;
    }
    if (payload) {
      downloadResultCardImage(payload.dataUrl, "uniterz-result-card.png");
    }
    toast.info(r.shareRankCardInstagramDesktop);
  }, [mobile, onShareToApps, payload, r.shareRankCardInstagramDesktop]);

  const onShareLine = useCallback(async () => {
    if (mobile) {
      const shared = await runNativeShare();
      if (shared) return;
      window.location.href = urls.lineAppUrl;
      onClose();
      return;
    }
    window.open(urls.lineUrl, "_blank", "noopener,noreferrer");
    if (payload) downloadResultCardImage(payload.dataUrl, "uniterz-result-card.png");
    toast.info(r.shareRankCardAttachHint);
    onClose();
  }, [
    mobile,
    onClose,
    payload,
    r.shareRankCardAttachHint,
    runNativeShare,
    urls.lineAppUrl,
    urls.lineUrl,
  ]);

  const onShareX = useCallback(async () => {
    if (mobile) {
      const shared = await runNativeShare();
      if (shared) return;
    }
    window.open(urls.xUrl, "_blank", "noopener,noreferrer");
    if (payload && !mobile) {
      downloadResultCardImage(payload.dataUrl, "uniterz-result-card.png");
      toast.info(r.shareRankCardAttachHint);
    }
    onClose();
  }, [mobile, onClose, payload, r.shareRankCardAttachHint, runNativeShare, urls.xUrl]);

  const onSave = useCallback(() => {
    if (!payload) return;
    downloadResultCardImage(payload.dataUrl, "uniterz-result-card.png");
    onClose();
  }, [onClose, payload]);

  const onCopy = useCallback(async () => {
    if (!payload || busy) return;
    setBusy(true);
    try {
      const ok = await copyImageToClipboard(payload.blob);
      if (ok) {
        setCopiedNotice(true);
        window.setTimeout(() => setCopiedNotice(false), 1600);
      } else {
        toast.error(r.shareRankCardCopyFailed);
      }
    } finally {
      setBusy(false);
    }
  }, [busy, payload, r.shareRankCardCopyFailed]);

  if (!open || !payload || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000040] overflow-hidden overscroll-none"
      role="dialog"
      aria-modal
      aria-labelledby="share-result-card-title"
    >
      <CommunityModalGridBackdrop onClick={onClose} />
      <div className="pointer-events-none fixed inset-0 z-10 flex items-end justify-center p-4 pb-[max(1rem,var(--bottom-nav-clearance))] sm:items-center">
        <div
          className="pointer-events-auto relative isolate w-full max-w-sm overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#0c1419]/95 px-5 py-5 shadow-[0_18px_44px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <ShellGridOverlay />
          {copiedNotice ? (
            <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
              <div className="rounded-xl border border-emerald-300/35 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 shadow-[0_0_24px_rgba(16,185,129,0.35)]">
                {r.shareRankCardCopied}
              </div>
            </div>
          ) : null}
          <div className="relative z-10">
            <h2
              id="share-result-card-title"
              className="text-center text-lg font-bold text-white"
            >
              {res.shareMyResult}
            </h2>
            <p className="mt-1.5 text-center text-xs leading-relaxed text-white/60">
              {r.shareRankCardHint}
            </p>

            <div className="mt-4 overflow-hidden rounded-lg border border-cyan-400/15 bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={payload.dataUrl}
                alt=""
                className="block w-full"
                draggable={false}
              />
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={() => void onShareToApps()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/35 bg-cyan-500/15 px-4 py-3 text-sm font-semibold text-cyan-50 disabled:opacity-60"
            >
              <Share2 className="h-4 w-4" aria-hidden />
              {r.shareRankCardToApps}
            </button>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void onShareX()}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-white/12 bg-white/8 px-2 py-3 text-[11px] font-semibold text-white/85 disabled:opacity-60"
              >
                <X className="h-5 w-5" aria-hidden />
                {r.shareRankCardX}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onShareInstagram()}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-white/12 bg-white/8 px-2 py-3 text-[11px] font-semibold text-white/85 disabled:opacity-60"
              >
                <Instagram className="h-5 w-5" aria-hidden />
                {r.shareRankCardInstagram}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onShareLine()}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-blue-400/25 bg-blue-500/12 px-2 py-3 text-[11px] font-semibold text-blue-50 disabled:opacity-60"
              >
                <MessageCircle className="h-5 w-5" aria-hidden />
                {r.shareRankCardLine}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={onSave}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/6 px-3 py-2.5 text-xs font-semibold text-white/80 disabled:opacity-60"
              >
                <Download className="h-3.5 w-3.5" aria-hidden />
                {r.shareRankCardSave}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onCopy()}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/6 px-3 py-2.5 text-xs font-semibold text-white/80 disabled:opacity-60"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden />
                {r.shareRankCardCopy}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
