/**
 * teams.lastGames の並び替え・表示用。
 * playedAt（試合開始日時）を優先し、無ければ at。
 */
export function lastGameAtMillis(entry: {
  playedAt?: unknown;
  at?: unknown;
}): number {
  const v = entry.playedAt ?? entry.at;
  if (
    v != null &&
    typeof (v as { toMillis?: () => number }).toMillis === "function"
  ) {
    const n = (v as { toMillis: () => number }).toMillis();
    return typeof n === "number" && Number.isFinite(n) ? n : 0;
  }
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.getTime();
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return 0;
}

/** Last 10 UI 用（sortAtMs が無い古いデータ向け） */
export function compareLastGamesByTime(
  a: { sortAtMs?: number; date?: string },
  b: { sortAtMs?: number; date?: string }
): number {
  const da = a.sortAtMs ?? 0;
  const db = b.sortAtMs ?? 0;
  return da - db;
}
