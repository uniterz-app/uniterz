import { TEAM_SHORT } from "@/lib/team-short";

/**
 * ブラケットの winner / championPick は TEAM_SHORT の略称（例: LAL）と一致。
 */
export function nbaTeamIdFromBracketCode(
  code: string | null | undefined
): string | null {
  if (!code) return null;
  const c = code.trim().toUpperCase();
  if (!c) return null;
  const entry = Object.entries(TEAM_SHORT).find(
    ([teamId, short]) => teamId.startsWith("nba-") && short.toUpperCase() === c
  );
  return entry?.[0] ?? null;
}
