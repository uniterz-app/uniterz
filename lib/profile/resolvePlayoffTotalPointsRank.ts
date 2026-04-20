/**
 * rankSnapshotHistory / snapshotRanks に保存された「順位」用の数値を JS number にする。
 * Firestore の int64 は Long 等のオブジェクトで返ることがあり、typeof === "number" だけでは拾えない。
 */
export function coerceTotalPointsRank(v: unknown): number | null {
  if (v == null) return null;

  let n: number;

  if (typeof v === "number") {
    if (!Number.isFinite(v)) return null;
    n = v;
  } else if (typeof v === "bigint") {
    n = Number(v);
    if (!Number.isFinite(n)) return null;
  } else if (typeof v === "string") {
    const t = v.trim();
    if (!/^\d+$/.test(t)) return null;
    n = parseInt(t, 10);
  } else if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    /** REST / 一部バインダが返す整数ラッパ */
    const iv = o.integerValue ?? o._integerValue;
    if (typeof iv === "number" && Number.isFinite(iv)) {
      n = iv;
    } else if (typeof iv === "string" && /^\d+$/.test(iv.trim())) {
      n = parseInt(iv.trim(), 10);
    } else if (typeof o.toNumber === "function") {
      const x = (o as { toNumber: () => number }).toNumber();
      if (!Number.isFinite(x)) return null;
      n = x;
    } else if (typeof o.valueOf === "function") {
      const raw = (o as { valueOf: () => unknown }).valueOf();
      if (typeof raw === "number" && Number.isFinite(raw)) n = raw;
      else if (typeof raw === "string" && /^\d+$/.test(raw.trim()))
        n = parseInt(raw.trim(), 10);
      else return null;
    } else if (
      typeof o.low === "number" &&
      typeof o.high === "number" &&
      (o.high === 0 || o.high === -1)
    ) {
      const low = (o.low as number) >>> 0;
      const high = o.high | 0;
      n = high * 0x100000000 + low;
      if (!Number.isFinite(n)) return null;
    } else {
      n = Number(v);
      if (!Number.isFinite(n)) return null;
    }
  } else {
    n = Number(v);
    if (!Number.isFinite(n)) return null;
  }

  const r = Math.floor(n);
  return r >= 1 ? r : null;
}
