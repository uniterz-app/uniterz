/**
 * wcKnockoutAdvancement/{season} の読み書き・パース
 */

import type { WcGroupCode } from "@/lib/wc/groups";
import type { WcKnockoutAdvancement } from "@/lib/wc/wc-knockout-bracket-utils";
import { WC_2026_KNOCKOUT_ADVANCEMENT } from "@/lib/wc/wc-knockout-advancement-2026";
import { WC_KNOCKOUT_SEASON } from "@/lib/wc/wc-knockout-bracket";

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

function parseGroupTeamMap(
  raw: unknown
): Partial<Record<WcGroupCode, string>> {
  if (!raw || typeof raw !== "object") return {};
  const out: Partial<Record<WcGroupCode, string>> = {};
  for (const group of ALL_GROUPS) {
    const v = (raw as Record<string, unknown>)[group];
    if (typeof v === "string" && v.trim()) out[group] = v.trim();
  }
  return out;
}

function parseAdvancingThird(raw: unknown): WcGroupCode[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((g): g is WcGroupCode => typeof g === "string" && g.length === 1)
    .slice(0, 8);
}

export function parseWcKnockoutAdvancementDoc(
  data: unknown
): WcKnockoutAdvancement | null {
  if (!data || typeof data !== "object") return null;

  const groupWinners = parseGroupTeamMap(
    (data as { groupWinners?: unknown }).groupWinners
  );
  const groupRunnersUp = parseGroupTeamMap(
    (data as { groupRunnersUp?: unknown }).groupRunnersUp
  );
  const groupThirdPlaces = parseGroupTeamMap(
    (data as { groupThirdPlaces?: unknown }).groupThirdPlaces
  );
  const advancingThirdPlaceGroups = parseAdvancingThird(
    (data as { advancingThirdPlaceGroups?: unknown }).advancingThirdPlaceGroups
  );

  if (Object.keys(groupWinners).length === 0) return null;
  if (advancingThirdPlaceGroups.length !== 8) return null;

  return {
    groupWinners,
    groupRunnersUp,
    groupThirdPlaces,
    advancingThirdPlaceGroups,
  };
}

export function defaultWcKnockoutAdvancement(
  season = WC_KNOCKOUT_SEASON
): WcKnockoutAdvancement {
  if (season === WC_KNOCKOUT_SEASON) return WC_2026_KNOCKOUT_ADVANCEMENT;
  return WC_2026_KNOCKOUT_ADVANCEMENT;
}
