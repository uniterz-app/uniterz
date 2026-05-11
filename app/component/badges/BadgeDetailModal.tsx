"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft } from "lucide-react";
import type { Language } from "@/lib/i18n/language";
import { DATE_LOCALE } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";

function subscribeToBody() {
  return () => {};
}

function getBodySnapshot(): HTMLElement | null {
  return typeof document !== "undefined" ? document.body : null;
}

function getBodyServerSnapshot(): null {
  return null;
}

function useDocumentBody(): HTMLElement | null {
  return useSyncExternalStore(
    subscribeToBody,
    getBodySnapshot,
    getBodyServerSnapshot,
  );
}

export type BadgeDetailModalProps = {
  badge: any;
  onClose: () => void;
  language?: Language;
  /** Shine animation on the badge image (mobile palette). */
  shine?: boolean;
};

function resolveAwardedMs(badge: any): number | null {
  const a = badge?.awardedAt;
  if (a && typeof a.toMillis === "function") return a.toMillis();
  if (typeof a === "number") return a;
  const g = badge?.grantedAt;
  if (g instanceof Date) return g.getTime();
  if (typeof g === "number") return g;
  return null;
}

/** Fits badge modal in one viewport without internal scroll (image scales down on short screens). */
const IMG_BOX =
  "h-[clamp(5rem,18dvh,8.25rem)] w-[clamp(5rem,18dvh,8.25rem)] max-w-[72vw] shrink-0";

export default function BadgeDetailModal({
  badge,
  onClose,
  language = "ja",
  shine = false,
}: BadgeDetailModalProps) {
  const m = t(language);
  const awardedMs = resolveAwardedMs(badge);
  const portalRoot = useDocumentBody();

  useLayoutEffect(() => {
    if (!portalRoot) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [portalRoot]);

  const imageBlock =
    shine && badge.icon ? (
      <div className="flex shrink-0 justify-center leading-none">
        <div
          className={`relative ${IMG_BOX} min-w-0 overflow-hidden rounded-2xl`}
        >
          <img
            src={badge.icon}
            alt={badge.id}
            className="relative z-10 h-full w-full min-h-0 min-w-0 object-contain"
          />
          <div
            className="
                pointer-events-none absolute inset-0
                -translate-x-full animate-badge-shine bg-linear-to-r
                from-transparent via-white/45 to-transparent skew-x-12
              "
            aria-hidden
          />
        </div>
      </div>
    ) : badge.icon ? (
      <div className="flex shrink-0 justify-center leading-none">
        <img
          src={badge.icon}
          alt={badge.id}
          className={`${IMG_BOX} min-w-0 object-contain`}
        />
      </div>
    ) : (
      <p className="shrink-0 py-4 text-center text-sm text-white/50">
        {badge.title ?? badge.id}
      </p>
    );

  const overlay = (
    <div
      className="
        fixed inset-0 z-9999 flex min-h-dvh w-full items-center justify-center
        overflow-hidden bg-black/60 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]
        pb-[max(0.75rem,env(safe-area-inset-bottom))]
        backdrop-blur-sm
        sm:px-6 sm:py-6
      "
      onClick={onClose}
      role="presentation"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="
            absolute right-[-60px] top-[-120px] h-[280px] w-[280px]
            rounded-full bg-[#FFD451] opacity-[0.18] blur-[90px] mix-blend-screen
          "
        />
        <div
          className="
            absolute bottom-[-100px] left-[-80px] h-[260px] w-[260px]
            rounded-full bg-[#D12A4C] opacity-[0.16] blur-[100px] mix-blend-screen
          "
        />
        <div
          className="
            absolute left-1/2 top-[20%] h-[200px] w-[200px] -translate-x-1/2
            rounded-full bg-white opacity-[0.1] blur-[120px] mix-blend-screen
          "
        />
      </div>

      <div
        className={[
          "relative z-10 flex max-h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))]",
          "w-[85%] max-w-sm shrink-0 flex-col items-stretch overflow-hidden rounded-3xl",
          "border border-white/10 bg-[#050814]/80 text-white shadow-2xl",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-[0.38]"
          style={PROFILE_SHELL_GRID_STYLE}
          aria-hidden
        />
        <div className="relative z-10 flex flex-col items-stretch px-5 pb-3 pt-3 sm:px-6 sm:pb-4 sm:pt-4">
        {imageBlock}

        <h2 className="mt-2 line-clamp-3 shrink-0 text-center text-[15px] font-bold leading-tight tracking-wide wrap-anywhere sm:text-[17px]">
          {badge.title ?? badge.id}
        </h2>

        {badge.description ? (
          <p className="mt-1.5 line-clamp-5 shrink-0 text-center text-[12px] leading-snug text-white/70 wrap-anywhere sm:text-[13px]">
            {badge.description}
          </p>
        ) : null}

        {awardedMs != null ? (
          <p className="mt-1 shrink-0 text-center text-[10px] leading-none text-white/40 sm:text-[11px]">
            {`${m.badges.awardedOn}${new Date(awardedMs).toLocaleDateString(DATE_LOCALE[language])}`}
          </p>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="
            mx-auto mt-3 flex h-11 w-11 shrink-0 items-center justify-center
            rounded-full border border-white/20 bg-white/10 backdrop-blur-sm
            transition hover:bg-white/20 sm:h-12 sm:w-12
          "
          aria-label={m.common.back}
        >
          <ChevronLeft
            className="h-6 w-6 text-white sm:h-6 sm:w-6"
            strokeWidth={2.25}
            aria-hidden
          />
        </button>
        </div>
      </div>
    </div>
  );

  if (!portalRoot) return null;
  return createPortal(overlay, portalRoot);
}
