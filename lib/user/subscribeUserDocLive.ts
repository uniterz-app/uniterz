/**
 * users/{uid} の onSnapshot を uid 単位で共有（多重購読を 1 本にまとめる）。
 */
import { doc, onSnapshot, type DocumentData, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * `fromCache`: サーバー未確認のローカル結果（オフライン起動など）。
 * `error`: 購読エラー。どちらも data が null でも「doc が無い」とは限らない
 */
export type UserDocLiveMeta = { fromCache: boolean; error: boolean };

type Listener = (data: DocumentData | null, meta: UserDocLiveMeta) => void;

type Hub = {
  listeners: Set<Listener>;
  unsub: Unsubscribe | null;
  last: DocumentData | null | undefined;
  lastMeta: UserDocLiveMeta;
};

const hubs = new Map<string, Hub>();

export function subscribeUserDocLive(
  uid: string,
  listener: Listener
): () => void {
  let hub = hubs.get(uid);
  if (!hub) {
    hub = {
      listeners: new Set(),
      unsub: null,
      last: undefined,
      lastMeta: { fromCache: false, error: false },
    };
    hubs.set(uid, hub);
  }

  hub.listeners.add(listener);
  if (hub.last !== undefined) {
    listener(hub.last, hub.lastMeta);
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
        h.lastMeta = { fromCache: snap.metadata.fromCache, error: false };
        for (const l of h.listeners) l(data, h.lastMeta);
      },
      () => {
        const h = hubs.get(uid);
        if (!h) return;
        h.last = null;
        h.lastMeta = { fromCache: false, error: true };
        for (const l of h.listeners) l(null, h.lastMeta);
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
