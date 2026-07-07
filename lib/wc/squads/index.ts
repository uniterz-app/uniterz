// lib/wc/squads/index.ts
//
// FIFA 最終名簿（Wikipedia 2026-06-02）＋ 予想スタメン（試合済みは確定XI、未試合はメディア合成）

import { WC_GENERATED_SQUADS } from "./_generatedSquads";
import { WC_PREDICTED_LINEUPS } from "./_generatedLineups";
import { WC_KNOCKOUT_R16_LINEUPS } from "./_generatedKnockoutR16Lineups";
import {
  parseWcKnockoutLineupRound,
  shouldUseKnockoutR16Lineup,
} from "./knockoutLineupRound";
import {
  findSquadPlayer,
  resolveLineupPlayers,
  wcTeamIdToIso3,
  type WcPredictedLineup,
  type WcSquadPlayer,
  type WcTeamSquad,
} from "../squadTypes";

export { WC_GENERATED_SQUADS, WC_PREDICTED_LINEUPS, WC_KNOCKOUT_R16_LINEUPS };

export type WcLineupContext = {
  /** `wc-2026-ko-M97` 形式 — QF 以降は R16 スナップショットを優先 */
  gameId?: string | null;
};

export function getWcSquadIso3(teamId: string): string | null {
  return wcTeamIdToIso3(teamId);
}

export function hasWcSquadData(teamId: string): boolean {
  const iso3 = getWcSquadIso3(teamId);
  if (!iso3) return false;
  return Boolean(WC_GENERATED_SQUADS[iso3]?.length);
}

export function getWcSquad(teamId: string): WcSquadPlayer[] | null {
  const iso3 = getWcSquadIso3(teamId);
  if (!iso3) return null;
  return WC_GENERATED_SQUADS[iso3] ?? null;
}

export function getWcPredictedLineup(
  teamId: string,
  context?: WcLineupContext,
): WcPredictedLineup | null {
  const iso3 = getWcSquadIso3(teamId);
  if (!iso3) return null;

  const round = parseWcKnockoutLineupRound(context?.gameId);
  if (shouldUseKnockoutR16Lineup(round)) {
    const r16Lineup = WC_KNOCKOUT_R16_LINEUPS[iso3];
    if (r16Lineup) return r16Lineup;
  }

  return WC_PREDICTED_LINEUPS[iso3] ?? null;
}

export function getWcTeamSquad(
  teamId: string,
  context?: WcLineupContext,
): WcTeamSquad | null {
  const squad = getWcSquad(teamId);
  const predictedLineup = getWcPredictedLineup(teamId, context);
  if (!squad?.length || !predictedLineup) return null;
  return { squad, predictedLineup };
}

export function getWcResolvedLineup(
  teamId: string,
  context?: WcLineupContext,
): (WcSquadPlayer & { x: number; y: number })[] | null {
  const data = getWcTeamSquad(teamId, context);
  if (!data) return null;
  const resolved = resolveLineupPlayers(data.squad, data.predictedLineup);
  return resolved.length === 11 ? resolved : null;
}

export function getWcSquadPlayer(
  teamId: string,
  playerId: string,
): WcSquadPlayer | undefined {
  const squad = getWcSquad(teamId);
  if (!squad) return undefined;
  return findSquadPlayer(squad, playerId);
}
