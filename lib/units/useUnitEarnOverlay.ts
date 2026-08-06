"use client";

/**
 * プロフィール Unit 獲得演出の状態。
 * - 残高増加差分
 * - session キュー
 * - `?forceUnitEarn=`
 * - プレビュー再生後は加算後の表示残高を維持（実残高 0 で 1000 に戻さない）
 */
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import {
  UNIT_EARN_EVENT,
} from "@/lib/units/unitEarnMotion";
import {
  dequeueUnitEarn,
  forceUnitEarnAmountFromQuery,
  readUnitEarnLastSeen,
  writeUnitEarnLastSeen,
  type PendingUnitEarn,
} from "@/lib/units/pendingUnitEarn";
import { unitVaultUiBalance } from "@/lib/units/unitVaultDisplay";

export type UnitEarnActive = {
  amount: number;
  fromBalance: number;
  toBalance: number;
  label?: string | null;
  /** 強制プレビュー（lastSeen を更新しない） */
  preview?: boolean;
};

export function useUnitEarnOverlay(opts: {
  balance: number | null | undefined;
  enabled: boolean;
  storageKey: string;
}): {
  active: UnitEarnActive | null;
  /** 金庫に渡す表示残高（モック / プレビュー加算済み込み） */
  vaultBalance: number | null;
  absorbed: boolean;
  markAbsorbed: () => void;
  dismiss: () => void;
  /** プレビュー等で明示再生 */
  play: (entry: PendingUnitEarn & { preview?: boolean }) => void;
} {
  const { balance, enabled, storageKey } = opts;
  const [active, setActive] = useState<UnitEarnActive | null>(null);
  const [absorbed, setAbsorbed] = useState(false);
  /** プレビュー加算後の表示残高（例: 1000→1250）。実残高が付いたらクリア */
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
      /**
       * プレビューは画面上の金庫を起点。
       * 直前のプレビューで 1250 になっていれば、そこからさらに加算する。
       */
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
        label: entry.label ?? null,
        preview: entry.preview === true,
      });
    },
    [balance]
  );

  const markAbsorbed = useCallback(() => {
    /** 飛行着地フレームと金庫再描画が重ならないよう低優先度で反映 */
    startTransition(() => {
      setAbsorbed(true);
    });
  }, []);

  const dismiss = useCallback(() => {
    setActive((prev) => {
      if (prev?.preview) {
        /** 1000 + 250 = 1250 を演出後も維持 */
        setStickyUiBalance(prev.toBalance);
        stickyRef.current = prev.toBalance;
      } else if (prev) {
        writeUnitEarnLastSeen(storageKey, prev.toBalance);
        setStickyUiBalance(null);
        stickyRef.current = null;
      }
      return null;
    });
    setAbsorbed(false);
    busyRef.current = false;
  }, [storageKey]);

  /** 実残高が付いたら sticky を捨てて本番値に同期 */
  useEffect(() => {
    if (balance == null || !Number.isFinite(balance)) return;
    const real = Math.max(0, Math.floor(balance));
    if (real > 0 && stickyUiBalance != null) {
      setStickyUiBalance(null);
      stickyRef.current = null;
    }
  }, [balance, stickyUiBalance]);

  /** 初回同期 + 差分検知 + キュー */
  useEffect(() => {
    if (!enabled || balance == null || !Number.isFinite(balance)) return;
    const current = Math.max(0, Math.floor(balance));

    if (!primedRef.current) {
      primedRef.current = true;

      const forced = forceUnitEarnAmountFromQuery();
      if (forced != null) {
        const ui = stickyRef.current ?? unitVaultUiBalance(current);
        busyRef.current = true;
        setAbsorbed(false);
        setActive({
          amount: forced,
          fromBalance: ui,
          toBalance: ui + forced,
          preview: true,
        });
        return;
      }

      const queued = dequeueUnitEarn();
      if (queued) {
        const from = Math.max(0, current - queued.amount);
        busyRef.current = true;
        setAbsorbed(false);
        setActive({
          amount: queued.amount,
          fromBalance: from,
          toBalance: current,
          label: queued.label ?? null,
        });
        return;
      }

      const last = readUnitEarnLastSeen(storageKey);
      if (last == null) {
        writeUnitEarnLastSeen(storageKey, current);
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
      writeUnitEarnLastSeen(storageKey, current);
      return;
    }

    if (busyRef.current || active) return;

    const queued = dequeueUnitEarn();
    if (queued) {
      const from = Math.max(0, current - queued.amount);
      busyRef.current = true;
      setAbsorbed(false);
      setActive({
        amount: queued.amount,
        fromBalance: from,
        toBalance: Math.max(current, from + queued.amount),
        label: queued.label ?? null,
      });
      return;
    }

    const last = readUnitEarnLastSeen(storageKey);
    if (last == null) {
      writeUnitEarnLastSeen(storageKey, current);
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
      writeUnitEarnLastSeen(storageKey, current);
    }
  }, [active, balance, enabled, storageKey]);

  /** 明示イベント（enqueueUnitEarn から） */
  useEffect(() => {
    if (!enabled) return;
    const onEarn = (ev: Event) => {
      if (busyRef.current || active) return;
      const detail = (ev as CustomEvent<PendingUnitEarn>).detail;
      const amount = Math.max(0, Math.floor(Number(detail?.amount) || 0));
      if (amount <= 0) return;
      const current =
        typeof balance === "number" && Number.isFinite(balance)
          ? Math.max(0, Math.floor(balance))
          : 0;
      busyRef.current = true;
      setAbsorbed(false);
      setActive({
        amount,
        fromBalance: current,
        toBalance: current + amount,
        label: detail?.label ?? null,
      });
    };
    window.addEventListener(UNIT_EARN_EVENT, onEarn);
    return () => window.removeEventListener(UNIT_EARN_EVENT, onEarn);
  }, [active, balance, enabled]);

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
