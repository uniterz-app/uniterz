"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { auth } from "@/lib/firebase";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { toast } from "@/app/component/ui/toast";
import CommunityGroupDetailView from "./CommunityGroupDetailView";
import EndGroupConfirmModal from "./EndGroupConfirmModal";
import {
  invalidateCommunityGroupDetail,
  type CommunityGroupListPreview,
} from "@/app/component/communities/communityGroupDetailCache";

async function authHeader(): Promise<string | null> {
  const u = auth.currentUser;
  if (!u) return null;
  return `Bearer ${await u.getIdToken()}`;
}

type Props = {
  open: boolean;
  groupId: string | null;
  listPreview?: CommunityGroupListPreview | null;
  language: Language;
  variant: "web" | "mobile";
  onClose: () => void;
  onRefreshList?: () => void;
};

/** 試合一覧の予想オーバーレイ（ScheduleList）と同系の全画面モーダル */
export default function CommunityGroupOverlay({
  open,
  groupId,
  listPreview = null,
  language,
  variant,
  onClose,
  onRefreshList,
}: Props) {
  const m = t(language);
  const isMobile = variant === "mobile";
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const [endConfirmName, setEndConfirmName] = useState("");
  const [endingGroup, setEndingGroup] = useState(false);

  useLayoutEffect(() => {
    if (!open) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (open) return;
    setEndConfirmOpen(false);
    setEndConfirmName("");
    setEndingGroup(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.body.classList.remove("splash-bg");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (endConfirmOpen) {
        if (!endingGroup) setEndConfirmOpen(false);
        return;
      }
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, endConfirmOpen, endingGroup, onClose]);

  const confirmEndGroup = useCallback(async () => {
    if (!groupId) return;
    const h = await authHeader();
    if (!h) return;
    setEndingGroup(true);
    try {
      const res = await fetch(`/api/communities/${groupId}/archive`, {
        method: "POST",
        headers: { Authorization: h },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        toast.error(String(json?.error ?? "failed"));
        return;
      }
      setEndConfirmOpen(false);
      toast.success(
        language === "en" ? "Group ended." : "グループを終了しました。"
      );
      invalidateCommunityGroupDetail(groupId);
      onRefreshList?.();
      onClose();
    } finally {
      setEndingGroup(false);
    }
  }, [groupId, language, onRefreshList, onClose]);

  if (!open || !groupId || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        key="community-group-overlay"
        className="fixed inset-0 z-100000 overflow-hidden"
        role="dialog"
        aria-modal={!endConfirmOpen}
      >
        <button
          type="button"
          aria-label={m.common.close}
          className="absolute inset-0 z-0 bg-black/35 backdrop-blur-md"
          onClick={() => {
            if (!endConfirmOpen) onClose();
          }}
        />

        <div
          className="relative z-10 h-dvh overflow-y-auto overflow-x-hidden pointer-events-auto pb-bottom-nav"
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorY: "contain",
            overscrollBehaviorX: "none",
            touchAction: "pan-y",
          }}
        >
          <div
            className={[
              "mx-auto w-full overflow-x-hidden",
              isMobile
                ? "max-w-2xl px-3 pb-32 pt-4 sm:px-4 sm:pb-36 sm:pt-6"
                : "max-w-5xl px-4 pb-24 pt-6 sm:px-6 md:px-8",
            ].join(" ")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full overflow-x-hidden">
              <button
                type="button"
                aria-label={m.common.close}
                className={[
                  "absolute right-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/90 backdrop-blur-md",
                  isMobile ? "" : "transition hover:bg-black/55",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!endConfirmOpen) onClose();
                }}
              >
                <X size={18} strokeWidth={2.4} />
              </button>

              <div
                className={[
                  "overflow-hidden rounded-2xl",
                  "border border-white/12",
                  "bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_42%,rgba(255,255,255,0.018)_100%),linear-gradient(180deg,rgba(5,8,20,0.80)_0%,rgba(5,8,20,0.80)_100%)]",
                  "backdrop-blur-xl",
                  "shadow-[0_18px_44px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.20),inset_0_-1px_0_rgba(255,255,255,0.05)]",
                ].join(" ")}
              >
                <CommunityGroupDetailView
                  inOverlay
                  groupId={groupId}
                  listPreview={listPreview}
                  language={language}
                  variant={variant}
                  headerBanner="wide_when_image"
                  showCloseButton={false}
                  showBackLink={false}
                  onClose={onClose}
                  onExitAction={() => {
                    onRefreshList?.();
                    onClose();
                  }}
                  onRequestEndGroup={(name) => {
                    setEndConfirmName(name);
                    setEndConfirmOpen(true);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <EndGroupConfirmModal
        open={endConfirmOpen}
        groupName={endConfirmName || listPreview?.name}
        language={language}
        busy={endingGroup}
        onCancel={() => {
          if (!endingGroup) setEndConfirmOpen(false);
        }}
        onConfirm={() => void confirmEndGroup()}
      />
    </>,
    document.body
  );
}
