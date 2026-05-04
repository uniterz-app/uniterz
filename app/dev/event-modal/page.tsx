// app/dev/event-modal/page.tsx
"use client";

import { useState } from "react";
import EventModal from "@/app/component/modals/EventModal";
import { NBA_RIVAL_WEEK_EVENT } from "@/lib/events/nbaRivalWeek";
import type { EventNoticeContent } from "@/lib/events/eventNoticeTypes";

const DEV_EVENT: EventNoticeContent = {
  ...NBA_RIVAL_WEEK_EVENT,
  listInAnnouncements: false,
  showModal: false,
  pinned: false,
  postedAtMs: Date.UTC(2026, 0, 21),
  heroImageURL: "/event/eventheader.png",
};

export default function DevEventModalPage() {
  const [open, setOpen] = useState(true);

  return (
    <>
      <div className="p-6 text-white">
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-blue-500 rounded"
        >
          モーダル表示
        </button>
      </div>

      {open && (
        <EventModal event={DEV_EVENT} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
