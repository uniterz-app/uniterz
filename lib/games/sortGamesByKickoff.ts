import { normalizeStartAtJst } from "./transform";

/** 試合一覧：キックオフが早い試合ほど小さい（上に来る） */
export function gameKickoffMillis(game: Record<string, unknown>): number {
  const d = normalizeStartAtJst(game);
  return d ? d.getTime() : Number.MAX_SAFE_INTEGER;
}

export function compareGamesByKickoffAsc(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): number {
  const diff = gameKickoffMillis(a) - gameKickoffMillis(b);
  if (diff !== 0) return diff;
  return String(a.id ?? "").localeCompare(String(b.id ?? ""), "en");
}

/** マッチカード一覧：試合開始が早い順（final / live は並びに影響しない） */
export function sortGamesByKickoffAsc<T extends Record<string, unknown>>(
  games: readonly T[]
): T[] {
  if (games.length <= 1) return [...games];
  return [...games].sort(compareGamesByKickoffAsc);
}
