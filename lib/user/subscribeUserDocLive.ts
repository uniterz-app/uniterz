/**
 * users/{uid} の onSnapshot を uid 単位で共有（多重購読を 1 本にまとめる）。
 */
import { doc, onSnapshot, type DocumentData, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Listener = (data: DocumentData | null) => void;

type Hub = {
  listeners: Set<Listener>;
  unsub: Unsubscribe | null;
  last: DocumentData | null | undefined;
};

const hubs = new Map<string, Hub>();

export function subscribeUserDocLive(
  uid: string,
  listener: Listener
): () => void {
  let hub = hubs.get(uid);
  if (!hub) {
    hub = { listeners: new Set(), unsub: null, last: undefined };
    hubs.set(uid, hub);
  }

  hub.listeners.add(listener);
  if (hub.last !== undefined) {
    listener(hub.last);
  }

  if (!hub.unsub) {
    const ref = doc(db, "users", uid);
    hub.unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.exists() ? snap.data() : null;
        const h = hubs.get(uid);
        if (!h) return;
        h.last = data;
        for (const l of h.listeners) l(data);
      },
      () => {
        const h = hubs.get(uid);
        if (!h) return;
        h.last = null;
        for (const l of h.listeners) l(null);
      }
    );
  }

  return () => {
    const h = hubs.get(uid);
    if (!h) return;
    h.listeners.delete(listener);
    if (h.listeners.size === 0) {
      h.unsub?.();
      hubs.delete(uid);
    }
  };
}
