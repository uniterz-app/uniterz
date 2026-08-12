"use client";

/**
 * プロフィール Unit 獲得演出の状態。
 * - pending_unit_earns（ランキング付与など文言付き）
 * - 残高増加差分
 * - session キュー
 * - `?forceUnitEarn=`
 * - プレビュー再生後は加算後の表示残高を維持
 */
import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  claimMePendingUnitEarns,
  fetchMePendingUnitEarns,
} from "@/lib/api/fetchMePendingUnitEarns";
import {
  pendingUnitEarnDocToPlayEntry,
  type PendingUnitEarnDoc,
} from "@/lib/units/pendingUnitEarnTypes";

export type UnitEarnActive = {
  amount: number;
  fromBalance: number;
  toBalance: number;
  label?: string | null;
  title?: string | null;
  subtitle?: string | null;
  rank?: number | null;
  /** 強制プレビュー（lastSeen を更新しない） */
  preview?: boolean;
  /** pending_unit_earns の doc id（既読用） */
  pendingId?: string | null;
};

function earnMetaFromEntry(entry: PendingUnitEarn): Pick<
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

type QueuedPlay = PendingUnitEarn & {
  preview?: boolean;
  pendingId?: string | null;
};

export function useUnitEarnOverlay(opts: {
  balance: number | null | undefined;
  enabled: boolean;
  storageKey: string;
  language?: "ja" | "en";
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
  const { balance, enabled, storageKey, language = "ja" } = opts;
  const [active, setActive] = useState<UnitEarnActive | null>(null);
  const [absorbed, setAbsorbed] = useState(false);
  /** プレビュー加算後の表示残高（例: 1000→1250）。実残高が付いたらクリア */
  const [stickyUiBalance, setStickyUiBalance] = useState<number | null>(null);
  const stickyRef = useRef<number | null>(null);
  const primedRef = useRef(false);
  const busyRef = useRef(false);
  const queueRef = useRef<QueuedPlay[]>([]);
  const cursorBalanceRef = useRef<number | null>(null);

  stickyRef.current = stickyUiBalance;

  const playNextFromQueue = useCallback((currentBalance: number) => {
    const next = queueRef.current.shift();
    if (!next) {
      busyRef.current = false;
      cursorBalanceRef.current = null;
      writeUnitEarnLastSeen(storageKey, currentBalance);
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
      ...earnMetaFromEntry(next),
      preview: next.preview === true,
      pendingId: next.pendingId ?? null,
    });
  }, [storageKey]);

  const enqueueAndPlay = useCallback(
    (items: QueuedPlay[], currentBalance: number) => {
      const valid = items.filter((item) => Math.max(0, Math.floor(item.amount)) > 0);
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
        ...earnMetaFromEntry(entry),
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
        void claimMePendingUnitEarns([prev.pendingId]);
      }
      if (prev) {
        writeUnitEarnLastSeen(storageKey, prev.toBalance);
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
      writeUnitEarnLastSeen(storageKey, current);
      cursorBalanceRef.current = null;
      busyRef.current = false;
      setStickyUiBalance(null);
      stickyRef.current = null;
      return null;
    });
    setAbsorbed(false);
  }, [balance, playNextFromQueue, storageKey]);

  /** 実残高が付いたら sticky を捨てて本番値に同期 */
  useEffect(() => {
    if (balance == null || !Number.isFinite(balance)) return;
    const real = Math.max(0, Math.floor(balance));
    if (real > 0 && stickyUiBalance != null) {
      setStickyUiBalance(null);
      stickyRef.current = null;
    }
  }, [balance, stickyUiBalance]);

  /** 初回同期 + pending + 差分検知 + キュー */
  useEffect(() => {
    if (!enabled || balance == null || !Number.isFinite(balance)) return;
    const current = Math.max(0, Math.floor(balance));
    let alive = true;

    void (async () => {
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
            title: "月間ランキング",
            subtitle: "Preview · NBA",
            rank: 8,
            label: "月間ランキング 8位",
            preview: true,
          });
          return;
        }

        const queued = dequeueUnitEarn();
        if (queued) {
          enqueueAndPlay([queued], current);
          return;
        }

        try {
          const pendingRes = await fetchMePendingUnitEarns();
          if (!alive) return;
          if (pendingRes.ok && pendingRes.entries.length > 0) {
            const items: QueuedPlay[] = pendingRes.entries.map(
              (doc: PendingUnitEarnDoc) => ({
                ...pendingUnitEarnDocToPlayEntry(doc, language),
                pendingId: doc.id,
              })
            );
            const pendingSum = items.reduce(
              (sum, item) => sum + Math.max(0, Math.floor(item.amount)),
              0
            );
            const last = readUnitEarnLastSeen(storageKey);
            if (last != null && current - last > pendingSum) {
              items.push({ amount: current - last - pendingSum });
            }
            enqueueAndPlay(items, current);
            return;
          }
        } catch {
          /* pending 取得失敗時は残高差分へフォールバック */
        }

        const last = readUnitEarnLastSeen(storageKey);
        if (last == null) {
          writeUnitEarnLastSeen(storageKey, current);
          return;
        }
        if (current > last) {
          enqueueAndPlay([{ amount: current - last }], current);
          return;
        }
        writeUnitEarnLastSeen(storageKey, current);
        return;
      }

      if (busyRef.current || active) return;

      const queued = dequeueUnitEarn();
      if (queued) {
        enqueueAndPlay([queued], current);
        return;
      }

      try {
        const pendingRes = await fetchMePendingUnitEarns();
        if (!alive) return;
        if (pendingRes.ok && pendingRes.entries.length > 0) {
          const items: QueuedPlay[] = pendingRes.entries.map((doc) => ({
            ...pendingUnitEarnDocToPlayEntry(doc, language),
            pendingId: doc.id,
          }));
          enqueueAndPlay(items, current);
          return;
        }
      } catch {
        /* ignore */
      }

      const last = readUnitEarnLastSeen(storageKey);
      if (last == null) {
        writeUnitEarnLastSeen(storageKey, current);
        return;
      }
      if (current > last) {
        enqueueAndPlay([{ amount: current - last }], current);
        return;
      }
      if (current < last) {
        writeUnitEarnLastSeen(storageKey, current);
      }
    })();

    return () => {
      alive = false;
    };
  }, [
    active,
    balance,
    enabled,
    enqueueAndPlay,
    language,
    storageKey,
  ]);

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
      enqueueAndPlay(
        [
          {
            amount,
            ...earnMetaFromEntry(detail ?? { amount }),
          },
        ],
        current
      );
    };
    window.addEventListener(UNIT_EARN_EVENT, onEarn);
    return () => window.removeEventListener(UNIT_EARN_EVENT, onEarn);
  }, [active, balance, enabled, enqueueAndPlay]);

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
