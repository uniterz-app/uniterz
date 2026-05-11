// app/component/modals/EventModal.tsx
"use client";

import EventNoticeBody from "@/app/component/events/EventNoticeBody";
import type { EventNoticeContent } from "@/lib/events/eventNoticeTypes";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

export default function EventModal({
  event,
  onClose,
  language = "ja",
}: {
  event: EventNoticeContent;
  onClose: () => void;
  language?: Language;
}) {
  const isEn = language === "en";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div
        className="relative w-[340px] max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 0%, #2A0F3A 0%, #120818 55%, #07030A 100%)",
          border: "1px solid rgba(120,180,255,0.35)",
          boxShadow:
            "0 0 40px rgba(120,180,255,0.18), 0 0 80px rgba(120,120,255,0.15)",
        }}
      >
        {/* Header title */}
        <div
          className="px-4 py-3 text-center text-xs tracking-[0.35em]"
          style={{
            color: "#FFFFFF",
            borderBottom: "1px solid rgba(120,180,255,0.25)",
          }}
        >
          INFORMATION
        </div>

        <EventNoticeBody event={event} heroHeight={160} embedInModal isEn={isEn} />

        {/* Back */}
        <div
          className="p-4"
          style={{
            borderTop: "1px solid rgba(120,180,255,0.25)",
          }}
        >
          <button
            onClick={onClose}
            className="w-full py-2 rounded-full text-xs tracking-[0.35em] text-white"
            style={{
              border: "1px solid rgba(120,180,255,0.5)",
              background:
                "linear-gradient(180deg, rgba(120,180,255,0.18), rgba(80,120,255,0.1))",
            }}
          >
            {t(language).common.close}
          </button>
        </div>
      </div>
    </div>
  );
}
