/**
 * プレビュー用 — グループ A〜L の 48 チームからノックアウト進出 32 国を仮決め。
 * 本番はグループステージ結果で置き換える。
 */

import type { WcGroupCode } from "@/lib/wc/groups";
import { getWcGroupByCode } from "@/lib/wc/groups";
import type { WcKnockoutAdvancement } from "@/lib/wc/wc-knockout-bracket-utils";

const ALL_GROUPS: readonly WcGroupCode[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
];

/** Annex C キー EFGHIJKL に対応する 3 位通過 8 グループ */
const DEMO_ADVANCING_THIRD: readonly WcGroupCode[] = [
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
];

export function buildWcDemoKnockoutAdvancement(): WcKnockoutAdvancement {
  const groupWinners: Partial<Record<WcGroupCode, string>> = {};
  const groupRunnersUp: Partial<Record<WcGroupCode, string>> = {};
  const groupThirdPlaces: Partial<Record<WcGroupCode, string>> = {};

  for (const code of ALL_GROUPS) {
    const g = getWcGroupByCode(code);
    if (!g) continue;
    groupWinners[code] = g.teamIds[0];
    groupRunnersUp[code] = g.teamIds[1];
    groupThirdPlaces[code] = g.teamIds[2];
  }

  return {
    groupWinners,
    groupRunnersUp,
    groupThirdPlaces,
    advancingThirdPlaceGroups: DEMO_ADVANCING_THIRD,
  };
}

export const WC_DEMO_KNOCKOUT_ADVANCEMENT = buildWcDemoKnockoutAdvancement();
