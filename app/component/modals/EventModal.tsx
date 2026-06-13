// app/component/modals/EventModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { IBM_Plex_Mono } from "next/font/google";
import CyberEventModalFrame from "@/app/component/modals/CyberEventModalFrame";
import type { EventNoticeContent } from "@/lib/events/eventNoticeTypes";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

import { resolveEventNoticeCopy } from "@/lib/events/resolveEventNoticeCopy";

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

function pickLocalized(event: EventNoticeContent, language: Language) {
  return resolveEventNoticeCopy(event, language);
}

export default function EventModal({
  event,
  onClose,
  language = "ja",
}: {
  event: EventNoticeContent;
  onClose: () => void;
  language?: Language;
}) {
  const [mounted, setMounted] = useState(false);
  const loc = useMemo(() => pickLocalized(event, language), [event, language]);
  const m = t(language);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!mounted) return null;

  const heroSrc = event.heroImageURL?.trim().replace(/\s+/g, "%20");

  return createPortal(
    <div
      className="fixed inset-0 z-[1000030] overflow-hidden"
      role="dialog"
      aria-modal
      aria-labelledby="cyber-event-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-transparent"
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
            tagLabel={loc.tag}
            title={loc.title}
            body={
              <>
                <p id="cyber-event-modal-title" className="whitespace-pre-wrap">
                  {loc.description}
                </p>
                {heroSrc ? (
                  <img
                    src={heroSrc}
                    alt=""
                    className="mt-4 w-full border border-cyan-400/30 object-cover"
                    style={{ aspectRatio: "16 / 9" }}
                  />
                ) : null}
              </>
            }
            confirmLabel={m.common.ok}
            closeAriaLabel={m.common.close}
            onClose={onClose}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
