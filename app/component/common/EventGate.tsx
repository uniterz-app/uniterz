// app/component/common/EventGate.tsx
"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import EventModal from "@/app/component/modals/EventModal";
import { CURRENT_EVENT } from "@/lib/events/currentEvent";

export default function EventGate() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const key = `event_seen_${CURRENT_EVENT.id}`;
    if (localStorage.getItem(key)) return;

    setOpen(true);
  }, []);

  const close = () => {
    localStorage.setItem(
      `event_seen_${CURRENT_EVENT.id}`,
      "1"
    );
    setOpen(false);
  };

  if (!open) return null;

  return <EventModal event={CURRENT_EVENT} onClose={close} />;
}
