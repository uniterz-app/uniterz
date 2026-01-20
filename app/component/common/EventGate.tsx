// app/component/common/EventGate.tsx
"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import EventModal from "@/app/component/modals/EventModal";
import { CURRENT_EVENT } from "@/lib/events/currentEvent";

export default function EventGate() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      const key = `event_seen_${CURRENT_EVENT.id}`;
      if (localStorage.getItem(key)) return;

      setOpen(true);
    });

    return () => unsub();
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
