// app/dev/event-modal/page.tsx
"use client";

import { useState } from "react";
import EventModal from "@/app/component/modals/EventModal";
import { NBA_RIVAL_WEEK_EVENT } from "@/lib/events/nbaRivalWeek";

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
        <EventModal
          event={NBA_RIVAL_WEEK_EVENT}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
