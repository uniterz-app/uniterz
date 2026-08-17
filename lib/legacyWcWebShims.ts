/** NBA-only: no-op shims for removed `@/lib/wc/*` modules */
export { resolveWcStageFromGame } from "@/lib/games/resolveWcStageFromGame";

export type WcGoalScorerPick = { playerId: string; teamId: string };
export type WcGameGoalScorer = WcGoalScorerPick & {
  ownGoal?: boolean;
  name?: string;
  minute?: number | null;
};

export type WcCountryMeta = { flag: string; name?: string };

export function isWcKnockoutGame(..._args: unknown[]): boolean {
  return false;
}

export function normalizeWcGoalScorerPick(raw: unknown): WcGoalScorerPick | null {
  if (!raw || typeof raw !== "object") return null;
  const playerId = String((raw as WcGoalScorerPick).playerId ?? "").trim();
  const teamId = String((raw as WcGoalScorerPick).teamId ?? "").trim();
  if (!playerId || !teamId) return null;
  return { playerId, teamId };
}

export function validateWcGoalScorerPickForGame(
  ..._args: unknown[]
): { ok: false; error: string } {
  return { ok: false, error: "wc_removed" };
}

export function isWcGoalScorerPickValidForPredictedScore(..._args: unknown[]): boolean {
  return false;
}

export function resolveWcTeamId(...args: unknown[]): string | null {
  for (const a of args) {
    if (a && typeof a === "object" && "teamId" in (a as object)) {
      const id = (a as { teamId?: string }).teamId;
      if (typeof id === "string" && id.trim()) return id.trim();
    }
    if (typeof a === "string" && a.trim()) return a.trim();
  }
  return null;
}

export function teamIdToWcCountry(_teamId: unknown): WcCountryMeta | null {
  return null;
}

export function teamIdToCountryName(_teamId: unknown, _lang?: string): string | null {
  return null;
}

export async function fetchWcTeamRecordMap(..._args: unknown[]): Promise<Record<string, never>> {
  return {};
}

export function resolveWcMatchGoalScorersForDisplay(..._args: unknown[]): never[] {
  return [];
}

export function resolveWcGroupStageStandingForKnockoutDisplay(..._args: unknown[]): null {
  return null;
}

export function resolveWcResultCardGroupStanding(..._args: unknown[]): null {
  return null;
}

export function resolveWcGroupCodeLabel(..._args: unknown[]): null {
  return null;
}

export function hasWcMatchPreview(..._args: unknown[]): boolean {
  return false;
}

export function useWcKnockoutChallengePrompt(..._args: unknown[]): {
  open: boolean;
  dismiss: () => void;
} {
  return { open: false, dismiss: () => {} };
}

export type WcSquadPlayer = { playerId?: string; name: string };

export function getWcSquad(..._args: unknown[]): WcSquadPlayer[] {
  return [];
}

export function getWcSquadPlayer(..._args: unknown[]): WcSquadPlayer | null {
  return null;
}

export function normalizeWcGameGoalScorers(..._args: unknown[]): WcGameGoalScorer[] {
  return [];
}

export type ResolveWcGameGoalScorersResult =
  | { ok: false; error: string }
  | { ok: true; scorers: WcGameGoalScorer[] };

export function resolveWcGameGoalScorers(
  ..._args: unknown[]
): ResolveWcGameGoalScorersResult {
  return { ok: false, error: "wc_removed" };
}

export async function resettleWcGoalScorerBonusesForGame(
  ..._args: unknown[]
): Promise<{ updated: number }> {
  return { updated: 0 };
}

export const WC_KNOCKOUT_SEASON = "WC2026";

export function useWcBracketSubmitted(_season?: string) {
  return {
    submitted: false,
    loading: false,
    shouldPromptInput: false,
  };
}
