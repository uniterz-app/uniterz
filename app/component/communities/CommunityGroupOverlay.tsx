"use client";

import { useEffect } from "react";
import type { Language } from "@/lib/i18n/language";
import CommunityGroupDetailView from "./CommunityGroupDetailView";

type Props = {
  open: boolean;
  groupId: string | null;
  language: Language;
  variant: "web" | "mobile";
  onClose: () => void;
  onRefreshList?: () => void;
};

export default function CommunityGroupOverlay({
  open,
  groupId,
  language,
  variant,
  onClose,
  onRefreshList,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !groupId) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-white/15 bg-[#0c1419] shadow-2xl sm:max-h-[88vh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CommunityGroupDetailView
          className="min-h-0 flex-1"
          groupId={groupId}
          language={language}
          variant={variant}
          headerBanner="wide_when_image"
          showCloseButton
          onClose={onClose}
          onExitAction={() => {
            onRefreshList?.();
            onClose();
          }}
        />
      </div>
    </div>
  );
}
