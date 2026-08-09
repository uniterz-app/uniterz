/**
 * Web `useUnitEarnOverlay` 相当 — AsyncStorage で前回残高を保持。
 * プレビュー加算後は表示残高を sticky で維持（1000→1250 が戻らない）。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { unitEarnLastSeenKey } from "../../../../../lib/units/unitEarnMotion";
import type {
  UnitEarnActive,
} from "../../../../../lib/units/useUnitEarnOverlay";
import type { PendingUnitEarn } from "../../../../../lib/units/pendingUnitEarn";
import { unitVaultUiBalance } from "../../../../../lib/units/unitVaultDisplay";

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

export function useUnitEarnOverlayNative(opts: {
  balance: number | null | undefined;
  enabled: boolean;
  storageKey: string;
}): {
  active: UnitEarnActive | null;
  vaultBalance: number | null;
  absorbed: boolean;
  markAbsorbed: () => void;
  dismiss: () => void;
  play: (entry: PendingUnitEarn & { preview?: boolean }) => void;
} {
  const { balance, enabled, storageKey } = opts;
  const [active, setActive] = useState<UnitEarnActive | null>(null);
  const [absorbed, setAbsorbed] = useState(false);
  const [stickyUiBalance, setStickyUiBalance] = useState<number | null>(null);
  const stickyRef = useRef<number | null>(null);
  const primedRef = useRef(false);
  const busyRef = useRef(false);

  stickyRef.current = stickyUiBalance;

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
      const rankRaw = entry.rank;
      const rank =
        typeof rankRaw === "number" && Number.isFinite(rankRaw)
          ? Math.max(1, Math.floor(rankRaw))
          : null;
      busyRef.current = true;
      setAbsorbed(false);
      setActive({
        amount,
        fromBalance,
        toBalance,
        label: entry.label ?? null,
        title: entry.title ?? null,
        subtitle: entry.subtitle ?? null,
        rank,
        preview: entry.preview === true,
      });
    },
    [balance]
  );

  const markAbsorbed = useCallback(() => {
    /** 着地と同期して金庫を更新（遅延するとプロフィール全体が後追い再描画に見える） */
    setAbsorbed(true);
  }, []);

  const dismiss = useCallback(() => {
    setActive((prev) => {
      if (prev?.preview) {
        setStickyUiBalance(prev.toBalance);
        stickyRef.current = prev.toBalance;
      } else if (prev) {
        void writeLastSeen(storageKey, prev.toBalance);
        setStickyUiBalance(null);
        stickyRef.current = null;
      }
      return null;
    });
    setAbsorbed(false);
    busyRef.current = false;
  }, [storageKey]);

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
        const last = await readLastSeen(storageKey);
        if (!alive) return;
        if (last == null) {
          await writeLastSeen(storageKey, current);
          return;
        }
        if (current > last) {
          busyRef.current = true;
          setAbsorbed(false);
          setActive({
            amount: current - last,
            fromBalance: last,
            toBalance: current,
          });
          return;
        }
        await writeLastSeen(storageKey, current);
        return;
      }

      if (busyRef.current || active) return;

      const last = await readLastSeen(storageKey);
      if (!alive) return;
      if (last == null) {
        await writeLastSeen(storageKey, current);
        return;
      }
      if (current > last) {
        busyRef.current = true;
        setAbsorbed(false);
        setActive({
          amount: current - last,
          fromBalance: last,
          toBalance: current,
        });
        return;
      }
      if (current < last) {
        await writeLastSeen(storageKey, current);
      }
    })();

    return () => {
      alive = false;
    };
  }, [active, balance, enabled, storageKey]);

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
