/**
 * Web `useUnitEarnOverlay` 相当 — AsyncStorage + pending_unit_earns。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { unitEarnLastSeenKey } from "../../../../../lib/units/unitEarnMotion";
import type { UnitEarnActive } from "../../../../../lib/units/useUnitEarnOverlay";
import type { PendingUnitEarn } from "../../../../../lib/units/pendingUnitEarn";
import { unitVaultUiBalance } from "../../../../../lib/units/unitVaultDisplay";
import {
  pendingUnitEarnDocToPlayEntry,
} from "../../../../../lib/units/pendingUnitEarnTypes";
import {
  claimMePendingUnitEarnsNative,
  fetchMePendingUnitEarnsNative,
} from "./pendingUnitEarnApiNative";

async function readLastSeen(storageKey: string): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(unitEarnLastSeenKey(storageKey));
    if (raw == null || raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : null;
  } catch {
    return null;
  }
}

async function writeLastSeen(storageKey: string, balance: number): Promise<void> {
  try {
    await AsyncStorage.setItem(
      unitEarnLastSeenKey(storageKey),
      String(Math.max(0, Math.floor(balance)))
    );
  } catch {
    /* ignore */
  }
}

type QueuedPlay = PendingUnitEarn & {
  preview?: boolean;
  pendingId?: string | null;
};

function earnMeta(entry: PendingUnitEarn): Pick<
  UnitEarnActive,
  "label" | "title" | "subtitle" | "rank"
> {
  const rankRaw = entry.rank;
  const rank =
    typeof rankRaw === "number" && Number.isFinite(rankRaw)
      ? Math.max(1, Math.floor(rankRaw))
      : null;
  return {
    label: entry.label ?? null,
    title: entry.title ?? null,
    subtitle: entry.subtitle ?? null,
    rank,
  };
}

export function useUnitEarnOverlayNative(opts: {
  balance: number | null | undefined;
  enabled: boolean;
  storageKey: string;
  language?: "ja" | "en";
}): {
  active: UnitEarnActive | null;
  vaultBalance: number | null;
  absorbed: boolean;
  markAbsorbed: () => void;
  dismiss: () => void;
  play: (entry: PendingUnitEarn & { preview?: boolean }) => void;
} {
  const { balance, enabled, storageKey, language = "ja" } = opts;
  const [active, setActive] = useState<UnitEarnActive | null>(null);
  const [absorbed, setAbsorbed] = useState(false);
  const [stickyUiBalance, setStickyUiBalance] = useState<number | null>(null);
  const stickyRef = useRef<number | null>(null);
  const primedRef = useRef(false);
  const busyRef = useRef(false);
  const queueRef = useRef<QueuedPlay[]>([]);
  const cursorBalanceRef = useRef<number | null>(null);

  stickyRef.current = stickyUiBalance;

  const playNextFromQueue = useCallback(
    (currentBalance: number) => {
      const next = queueRef.current.shift();
      if (!next) {
        busyRef.current = false;
        cursorBalanceRef.current = null;
        void writeLastSeen(storageKey, currentBalance);
        return;
      }
      const amount = Math.max(0, Math.floor(next.amount));
      if (amount <= 0) {
        playNextFromQueue(currentBalance);
        return;
      }
      const from =
        cursorBalanceRef.current != null
          ? cursorBalanceRef.current
          : Math.max(0, currentBalance - amount);
      const to = from + amount;
      cursorBalanceRef.current = to;
      busyRef.current = true;
      setAbsorbed(false);
      setActive({
        amount,
        fromBalance: from,
        toBalance: to,
        ...earnMeta(next),
        preview: next.preview === true,
        pendingId: next.pendingId ?? null,
      });
    },
    [storageKey]
  );

  const enqueueAndPlay = useCallback(
    (items: QueuedPlay[], currentBalance: number) => {
      const valid = items.filter(
        (item) => Math.max(0, Math.floor(item.amount)) > 0
      );
      if (valid.length === 0) return false;
      const pendingSum = valid.reduce(
        (sum, item) => sum + Math.max(0, Math.floor(item.amount)),
        0
      );
      cursorBalanceRef.current = Math.max(0, currentBalance - pendingSum);
      queueRef.current = [...queueRef.current, ...valid];
      if (!busyRef.current && !active) {
        playNextFromQueue(currentBalance);
      }
      return true;
    },
    [active, playNextFromQueue]
  );

  const play = useCallback(
    (entry: PendingUnitEarn & { preview?: boolean }) => {
      const amount = Math.max(0, Math.floor(entry.amount));
      if (amount <= 0 || busyRef.current) return;
      const real =
        typeof balance === "number" && Number.isFinite(balance)
          ? Math.max(0, Math.floor(balance))
          : 0;
      const current = entry.preview
        ? (stickyRef.current ?? unitVaultUiBalance(real))
        : real;
      const fromBalance = entry.preview
        ? current
        : Math.max(0, current - amount);
      const toBalance = entry.preview
        ? current + amount
        : Math.max(current, fromBalance + amount);
      busyRef.current = true;
      setAbsorbed(false);
      setActive({
        amount,
        fromBalance,
        toBalance,
        ...earnMeta(entry),
        preview: entry.preview === true,
        pendingId: null,
      });
    },
    [balance]
  );

  const markAbsorbed = useCallback(() => {
    setAbsorbed(true);
  }, []);

  const dismiss = useCallback(() => {
    setActive((prev) => {
      if (prev?.preview) {
        setStickyUiBalance(prev.toBalance);
        stickyRef.current = prev.toBalance;
        busyRef.current = false;
        return null;
      }
      if (prev?.pendingId) {
        void claimMePendingUnitEarnsNative([prev.pendingId]);
      }
      if (prev) {
        void writeLastSeen(storageKey, prev.toBalance);
      }
      const current =
        typeof balance === "number" && Number.isFinite(balance)
          ? Math.max(0, Math.floor(balance))
          : prev?.toBalance ?? 0;
      if (queueRef.current.length > 0) {
        setTimeout(() => {
          playNextFromQueue(current);
        }, 0);
        return null;
      }
      void writeLastSeen(storageKey, current);
      cursorBalanceRef.current = null;
      busyRef.current = false;
      setStickyUiBalance(null);
      stickyRef.current = null;
      return null;
    });
    setAbsorbed(false);
  }, [balance, playNextFromQueue, storageKey]);

  useEffect(() => {
    if (balance == null || !Number.isFinite(balance)) return;
    const real = Math.max(0, Math.floor(balance));
    if (real > 0 && stickyUiBalance != null) {
      setStickyUiBalance(null);
      stickyRef.current = null;
    }
  }, [balance, stickyUiBalance]);

  useEffect(() => {
    if (!enabled || balance == null || !Number.isFinite(balance)) return;
    const current = Math.max(0, Math.floor(balance));
    let alive = true;

    void (async () => {
      if (!primedRef.current) {
        primedRef.current = true;

        try {
          const pendingRes = await fetchMePendingUnitEarnsNative();
          if (!alive) return;
          if (pendingRes.ok && pendingRes.entries.length > 0) {
            const items: QueuedPlay[] = pendingRes.entries.map((doc) => ({
              ...pendingUnitEarnDocToPlayEntry(doc, language),
              pendingId: doc.id,
            }));
            const pendingSum = items.reduce(
              (sum, item) => sum + Math.max(0, Math.floor(item.amount)),
              0
            );
            const last = await readLastSeen(storageKey);
            if (!alive) return;
            if (last != null && current - last > pendingSum) {
              items.push({ amount: current - last - pendingSum });
            }
            enqueueAndPlay(items, current);
            return;
          }
        } catch {
          /* fallback */
        }

        const last = await readLastSeen(storageKey);
        if (!alive) return;
        if (last == null) {
          await writeLastSeen(storageKey, current);
          return;
        }
        if (current > last) {
          enqueueAndPlay([{ amount: current - last }], current);
          return;
        }
        await writeLastSeen(storageKey, current);
        return;
      }

      if (busyRef.current || active) return;

      try {
        const pendingRes = await fetchMePendingUnitEarnsNative();
        if (!alive) return;
        if (pendingRes.ok && pendingRes.entries.length > 0) {
          enqueueAndPlay(
            pendingRes.entries.map((doc) => ({
              ...pendingUnitEarnDocToPlayEntry(doc, language),
              pendingId: doc.id,
            })),
            current
          );
          return;
        }
      } catch {
        /* ignore */
      }

      const last = await readLastSeen(storageKey);
      if (!alive) return;
      if (last == null) {
        await writeLastSeen(storageKey, current);
        return;
      }
      if (current > last) {
        enqueueAndPlay([{ amount: current - last }], current);
        return;
      }
      if (current < last) {
        await writeLastSeen(storageKey, current);
      }
    })();

    return () => {
      alive = false;
    };
  }, [active, balance, enabled, enqueueAndPlay, language, storageKey]);

  const vaultBalance =
    balance == null && stickyUiBalance == null
      ? null
      : active
        ? absorbed
          ? active.toBalance
          : active.fromBalance
        : stickyUiBalance != null
          ? stickyUiBalance
          : unitVaultUiBalance(balance);

  return {
    active,
    vaultBalance,
    absorbed,
    markAbsorbed,
    dismiss,
    play,
  };
}
