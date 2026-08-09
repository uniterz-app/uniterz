/**
 * Unit 獲得演出のキュー / 前回残高。
 * プロフィール復帰時に差分を再生する。
 */

import {
  UNIT_EARN_EVENT,
  UNIT_EARN_QUEUE_KEY,
  unitEarnLastSeenKey,
} from "@/lib/units/unitEarnMotion";

export type PendingUnitEarn = {
  amount: number;
  /** 任意ラベル（招待・バトル等）— 副文のフォールバック */
  label?: string | null;
  /** 主文言（例: 月間ランキング 8位） */
  title?: string | null;
  /** 補足（例: 2026年1月 · NBA） */
  subtitle?: string | null;
  /** 順位（表示用。title と併用） */
  rank?: number | null;
};

function safeParseAmount(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

export function readUnitEarnLastSeen(storageKey: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(unitEarnLastSeenKey(storageKey));
    if (raw == null || raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : null;
  } catch {
    return null;
  }
}

export function writeUnitEarnLastSeen(
  storageKey: string,
  balance: number
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      unitEarnLastSeenKey(storageKey),
      String(Math.max(0, Math.floor(balance)))
    );
  } catch {
    /* private mode 等は無視 */
  }
}

/** session キューへ積む（付与直後など） */
function normalizePending(entry: PendingUnitEarn): PendingUnitEarn {
  const amount = safeParseAmount(entry.amount);
  const rankRaw = entry.rank;
  const rank =
    typeof rankRaw === "number" && Number.isFinite(rankRaw)
      ? Math.max(1, Math.floor(rankRaw))
      : null;
  return {
    amount,
    label: entry.label ?? null,
    title: entry.title ?? null,
    subtitle: entry.subtitle ?? null,
    rank,
  };
}

export function enqueueUnitEarn(entry: PendingUnitEarn): void {
  if (typeof window === "undefined") return;
  const normalized = normalizePending(entry);
  if (normalized.amount <= 0) return;
  try {
    const prev = window.sessionStorage.getItem(UNIT_EARN_QUEUE_KEY);
    const list: PendingUnitEarn[] = prev
      ? (JSON.parse(prev) as PendingUnitEarn[])
      : [];
    if (!Array.isArray(list)) {
      window.sessionStorage.setItem(
        UNIT_EARN_QUEUE_KEY,
        JSON.stringify([normalized])
      );
    } else {
      list.push(normalized);
      window.sessionStorage.setItem(UNIT_EARN_QUEUE_KEY, JSON.stringify(list));
    }
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(
      new CustomEvent(UNIT_EARN_EVENT, {
        detail: normalized,
      })
    );
  } catch {
    /* ignore */
  }
}

/** キュー先頭を取り出す（なければ null） */
export function dequeueUnitEarn(): PendingUnitEarn | null {
  if (typeof window === "undefined") return null;
  try {
    const prev = window.sessionStorage.getItem(UNIT_EARN_QUEUE_KEY);
    if (!prev) return null;
    const list = JSON.parse(prev) as PendingUnitEarn[];
    if (!Array.isArray(list) || list.length === 0) return null;
    const [head, ...rest] = list;
    window.sessionStorage.setItem(UNIT_EARN_QUEUE_KEY, JSON.stringify(rest));
    const normalized = normalizePending({
      amount: head?.amount ?? 0,
      label: head?.label ?? null,
      title: head?.title ?? null,
      subtitle: head?.subtitle ?? null,
      rank: head?.rank ?? null,
    });
    if (normalized.amount <= 0) return dequeueUnitEarn();
    return normalized;
  } catch {
    return null;
  }
}

/** `?forceUnitEarn=120` — プレビュー強制 */
export function forceUnitEarnAmountFromQuery(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = new URLSearchParams(window.location.search).get(
      "forceUnitEarn"
    );
    if (raw == null || raw === "") return null;
    const n = safeParseAmount(raw === "1" ? 250 : raw);
    return n > 0 ? n : null;
  } catch {
    return null;
  }
}
