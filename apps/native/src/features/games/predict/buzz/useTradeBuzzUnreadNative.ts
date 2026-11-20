/** TODAY UNITERZ と同じ未読点。番号は公開 API の updatedAtMs。 */
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import {
  TRADE_BUZZ_SEEN_STORAGE_KEY,
  isTradeBuzzUnread,
} from "../../../../../../../lib/predict/nbaTradeBuzzUnread";
import {
  TRADE_BUZZ_FEED_POLL_MS,
  TRADE_BUZZ_META_POLL_MS,
  nbaTradeBuzzVersionFromPayload,
  type NbaTradeBuzzPublicPayload,
} from "../../../../../../../lib/predict/nbaTradeBuzzApi";
import {
  NBA_TRADE_BUZZ_AS_OF_JST,
  NBA_TRADE_BUZZ_CURATED,
} from "../../../../../../../lib/predict/nbaTradeBuzzCurated";
import { NBA_CONFIRMED_TRADES_2026_27 } from "../../../../../../../lib/predict/nbaTradeConfirmed";
import { fetchTradeBuzzNative } from "./fetchTradeBuzzNative";

const seenListeners = new Set<(v: string | null) => void>();
const payloadListeners = new Set<(p: NbaTradeBuzzPublicPayload) => void>();
let seenCache: string | null | undefined;
let payloadCache: NbaTradeBuzzPublicPayload | null = null;
let bodyEtag: string | null = null;
let metaEtag: string | null = null;

const FALLBACK: NbaTradeBuzzPublicPayload = {
  asOfJst: NBA_TRADE_BUZZ_AS_OF_JST,
  updatedAtMs: null,
  items: [...NBA_TRADE_BUZZ_CURATED],
  confirmed: [...NBA_CONFIRMED_TRADES_2026_27],
};

function applyPayload(next: NbaTradeBuzzPublicPayload): void {
  payloadCache = next;
  for (const fn of payloadListeners) fn(next);
}

async function loadSeen(): Promise<string | null> {
  if (seenCache !== undefined) return seenCache;
  try {
    seenCache = await AsyncStorage.getItem(TRADE_BUZZ_SEEN_STORAGE_KEY);
  } catch {
    seenCache = null;
  }
  return seenCache;
}

export type UseTradeBuzzUnreadOpts = {
  pollMs?: number;
  /** true: 本文まで取る（Buzz 画面）。Games ホームは点だけ */
  body?: boolean;
};

export function useTradeBuzzUnreadNative(opts: UseTradeBuzzUnreadOpts = {}) {
  const body = opts.body === true;
  const focused = useIsFocused();
  const pollMs = opts.pollMs ?? (body ? TRADE_BUZZ_FEED_POLL_MS : TRADE_BUZZ_META_POLL_MS);
  const activePollMs = focused ? pollMs : undefined;
  const [payload, setPayload] = useState<NbaTradeBuzzPublicPayload>(
    payloadCache ?? FALLBACK
  );
  const [seen, setSeen] = useState<string | null>(seenCache ?? null);
  const latest = nbaTradeBuzzVersionFromPayload(payload);

  useEffect(() => {
    let alive = true;
    void loadSeen().then((v) => {
      if (alive) setSeen(v);
    });
    seenListeners.add(setSeen);
    payloadListeners.add(setPayload);
    return () => {
      alive = false;
      seenListeners.delete(setSeen);
      payloadListeners.delete(setPayload);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (AppState.currentState !== "active") return;
      const hit = await fetchTradeBuzzNative({
        meta: !body,
        etag: body ? bodyEtag : metaEtag,
      });
      if (!alive || !hit) return;
      if (hit.etag) {
        if (body) bodyEtag = hit.etag;
        else metaEtag = hit.etag;
      }
      if (hit.notModified) return;
      const next = hit.payload;
      if (!next) return;
      if (body) {
        if (next.items.length === 0 && next.confirmed.length === 0 && next.updatedAtMs == null) {
          return;
        }
        applyPayload(next);
        return;
      }
      if (next.updatedAtMs == null && next.asOfJst == null) return;
      const prev = payloadCache ?? FALLBACK;
      applyPayload({
        ...prev,
        asOfJst: next.asOfJst ?? prev.asOfJst,
        updatedAtMs: next.updatedAtMs,
      });
    };
    if (!focused) {
      return () => {
        alive = false;
      };
    }
    void load();
    const id = activePollMs ? setInterval(load, activePollMs) : null;
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") void load();
    });
    return () => {
      alive = false;
      if (id != null) clearInterval(id);
      sub.remove();
    };
  }, [activePollMs, body, focused]);

  const markSeen = useCallback(() => {
    if (!latest) return;
    seenCache = latest;
    for (const fn of seenListeners) fn(latest);
    void AsyncStorage.setItem(TRADE_BUZZ_SEEN_STORAGE_KEY, latest).catch(() => {});
  }, [latest]);

  return {
    unread: isTradeBuzzUnread(latest, seen),
    latest,
    markSeen,
    items: payload.items,
    confirmed: payload.confirmed,
    asOfJst: payload.asOfJst,
  };
}
