import { useEffect, useState } from "react";
import { eventModalQueueAt } from "../../../../../lib/events/syntheticEventNotices";
import type { EventNoticeContent } from "../../../../../lib/events/eventNoticeTypes";
import {
  loadAnnouncementReadIdsFor,
  subscribeAnnouncementReadsRefresh,
} from "../../../../../lib/announcements/loadAnnouncementReadIds";
import { subscribeAppTutorialBlockingEvents } from "../../../../../lib/tutorial/tutorialBlockingEvents";
import { db } from "../../lib/firebase";
import { useNativeUserLanguage } from "../../hooks/useNativeUserLanguage";
import { markAnnouncementReadNative } from "../profile/mobileScreens/markAnnouncementReadNative";
import {
  readFirstRunSetupPendingNative,
  subscribeFirstRunSetupNative,
} from "../auth/firstRunSetupNative";
import EventModalNative from "./EventModalNative";

export default function EventGateNative({ uid }: { uid: string }) {
  const { language, ready } = useNativeUserLanguage(uid);
  const [event, setEvent] = useState<EventNoticeContent | null>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    return subscribeAppTutorialBlockingEvents(setBlocked);
  }, []);

  useEffect(() => {
    if (!uid || !ready || blocked) return;
    let cancelled = false;

    const pick = async () => {
      if (await readFirstRunSetupPendingNative(uid)) return;
      const queue = eventModalQueueAt();
      if (queue.length === 0) {
        setEvent(null);
        return;
      }
      const ids = queue.map((e) => e.id);
      const readIds = await loadAnnouncementReadIdsFor(db, uid, ids);
      if (cancelled) return;
      const next = queue.find((e) => !readIds.has(e.id)) ?? null;
      setEvent(next);
    };

    void pick();
    const unsubReads = subscribeAnnouncementReadsRefresh(() => {
      void pick();
    });
    const unsubFirstRun = subscribeFirstRunSetupNative(() => {
      void pick();
    });
    return () => {
      cancelled = true;
      unsubReads();
      unsubFirstRun();
    };
  }, [uid, ready, blocked]);

  if (!event || blocked) return null;

  return (
    <EventModalNative
      event={event}
      language={language}
      onClose={() => {
        markAnnouncementReadNative(uid, event.id);
        setEvent(null);
      }}
    />
  );
}
