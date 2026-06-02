"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Share2 } from "lucide-react";
import type { Language } from "@/lib/i18n/language";
import { jp } from "@/lib/fonts";
import { toast } from "@/app/component/ui/toast";
import { copyTextToClipboard } from "@/lib/clipboard/copyText";
import { shareCommunityInvite } from "@/lib/communities/inviteShare";
import { CommunityModalGridBackdrop } from "@/app/component/communities/CommunityModalGridBackdrop";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";
import InviteShareModal from "@/app/component/communities/InviteShareModal";

type Props = {
  open: boolean;
  inviteCode: string;
  groupName?: string;
  language: Language;
  onClose: () => void;
};

export default function GroupCreatedSuccessModal({
  open,
  inviteCode,
  groupName,
  language,
  onClose,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteShareOpen, setInviteShareOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setInviteShareOpen(false);
    }
  }, [open]);

  const copyCode = useCallback(async () => {
    const ok = await copyTextToClipboard(inviteCode);
    if (ok) {
      setCopied(true);
      return;
    }
    toast.error(
      language === "en" ? "Could not copy." : "コピーできませんでした。"
    );
  }, [inviteCode, language]);

  const shareCode = useCallback(async () => {
    const result = await shareCommunityInvite({
      inviteCode,
      groupName,
      language,
    });
    if (result === "shared") {
      toast.info(
        language === "en" ? "Invite shared." : "招待を共有しました。"
      );
      return;
    }
    if (result === "unsupported") {
      setInviteShareOpen(true);
      return;
    }
    if (result === "cancelled") return;
    toast.error(
      language === "en" ? "Could not share." : "共有できませんでした。"
    );
  }, [inviteCode, groupName, language]);

  const t = useMemo(
    () =>
      language === "en"
        ? {
            title: "Group created",
            body: groupName
              ? `"${groupName}" is ready. Share this invite code so friends can join.`
              : "Share this invite code so friends can join.",
            inviteLabel: "Invite code",
            copied: "Copied to clipboard",
            copy: "Copy code",
            share: "Share invite",
            ok: "OK",
          }
        : {
            title: "作成しました",
            body: groupName
              ? `「${groupName}」を作成しました。友達に招待コードを共有して参加してもらいましょう。`
              : "友達に招待コードを共有して参加してもらいましょう。",
            inviteLabel: "招待コード",
            copied: "クリップボードにコピーしました",
            copy: "コードをコピー",
            share: "招待を共有",
            ok: "OK",
          },
    [language, groupName]
  );

  if (!open || !mounted || !inviteCode) return null;

  return (
    <>
      {createPortal(
    <div
      className="fixed inset-0 z-[1000030] overflow-hidden overscroll-none"
      role="dialog"
      aria-modal
      aria-labelledby="group-created-title"
    >
      <CommunityModalGridBackdrop
        onClick={onClose}
        closeLabel={language === "en" ? "Close" : "閉じる"}
      />
      <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center p-4 pb-[max(1rem,var(--bottom-nav-clearance))]">
      <div
        className={`pointer-events-auto relative isolate w-full max-w-sm overflow-hidden rounded-2xl border border-white/12 bg-[#0c1419]/95 px-5 py-6 shadow-[0_18px_44px_rgba(0,0,0,0.55)] backdrop-blur-xl ${jp.className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <ShellGridOverlay />
        <div className="relative z-10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-300">
          <Check className="h-6 w-6" strokeWidth={2.5} aria-hidden />
        </div>

        <h2
          id="group-created-title"
          className="text-center text-xl font-bold text-white"
        >
          {t.title}
        </h2>
        <p className="mt-2 text-center text-sm leading-relaxed text-white/65">
          {t.body}
        </p>

        <p className="mt-5 text-center text-xs font-medium uppercase tracking-wide text-white/45">
          {t.inviteLabel}
        </p>
        <p className="mt-1 text-center font-mono text-2xl font-bold tracking-[0.2em] text-white tabular-nums">
          {inviteCode}
        </p>

        {copied ? (
          <p className="mt-2 text-center text-xs text-emerald-300/90">
            {t.copied}
          </p>
        ) : null}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void shareCode()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-400/35 bg-blue-500/20 px-4 py-2.5 text-sm font-semibold text-blue-50"
          >
            <Share2 className="h-4 w-4" aria-hidden />
            {t.share}
          </button>
          <button
            type="button"
            onClick={() => void copyCode()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white/90"
          >
            <Copy className="h-4 w-4" aria-hidden />
            {t.copy}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30"
        >
          {t.ok}
        </button>
        </div>
      </div>
      </div>
    </div>,
        document.body
      )}
      <InviteShareModal
        open={inviteShareOpen}
        inviteCode={inviteCode}
        groupName={groupName}
        language={language}
        onClose={() => setInviteShareOpen(false)}
      />
    </>
  );
}
