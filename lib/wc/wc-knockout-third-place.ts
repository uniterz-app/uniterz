/**
 * WC 2026 — 3 位通過チームのブラケット割当（FIFA Annex C）
 */

import type { WcGroupCode } from "@/lib/wc/groups";
import { WC_THIRD_PLACE_ANNEX_C_BY_KEY } from "@/lib/wc/wc-knockout-third-place-annex-data";

/** 3 位通過チームが対戦するグループ 1 位のグループ（R32） */
export const WC_THIRD_PLACE_WINNER_SLOTS: readonly WcGroupCode[] = [
  "A",
  "B",
  "D",
  "E",
  "G",
  "I",
  "K",
  "L",
] as const;

export function formatThirdPlacePoolLabel(
  candidateGroups: readonly WcGroupCode[]
): string {
  return `3${[...candidateGroups].sort().join("")}`;
}

export function advancingThirdPlaceKey(
  groups: readonly WcGroupCode[]
): string {
  return [...groups].sort().join("");
}

/**
 * 8 つの 3 位通過グループから Annex C の行キーを引く。
 */
export function lookupAnnexCRow(
  advancingThirdPlaceGroups: readonly WcGroupCode[]
): Record<string, string> | null {
  if (advancingThirdPlaceGroups.length !== 8) return null;
  const key = advancingThirdPlaceKey(advancingThirdPlaceGroups);
  return WC_THIRD_PLACE_ANNEX_C_BY_KEY[key] ?? null;
}

/**
 * グループ 1 位 W が対戦する 3 位チームのグループを返す。
 * @param winnerGroup 1 位のグループ（A/B/D/E/G/I/K/L のいずれか）
 * @param advancingThirdPlaceGroups 通過した 3 位 8 グループ
 */
export function resolveThirdPlaceTeamForWinnerSlot(
  winnerGroup: WcGroupCode,
  advancingThirdPlaceGroups: readonly WcGroupCode[],
  _candidatePool?: WcGroupCode[]
): WcGroupCode | null {
  if (!WC_THIRD_PLACE_WINNER_SLOTS.includes(winnerGroup)) return null;
  const row = lookupAnnexCRow(advancingThirdPlaceGroups);
  if (!row) return null;
  const assigned = row[winnerGroup];
  if (!assigned) return null;
  return assigned as WcGroupCode;
}
