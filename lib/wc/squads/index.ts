// lib/wc/squads/index.ts
//
// FIFA 最終名簿（Wikipedia 2026-06-02）＋ 予想スタメン（試合済みは確定XI、未試合はメディア合成）

import { WC_GENERATED_SQUADS } from "./_generatedSquads";
import { WC_PREDICTED_LINEUPS } from "./_generatedLineups";
import { CONFIRMED_MATCH_LINEUP_ISO3 } from "./sources/matchLineups";
import {
  findSquadPlayer,
  resolveLineupPlayers,
  wcTeamIdToIso3,
  type WcPredictedLineup,
  type WcSquadPlayer,
  type WcTeamSquad,
} from "../squadTypes";

export { WC_GENERATED_SQUADS, WC_PREDICTED_LINEUPS };

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

export function getWcPredictedLineup(teamId: string): WcPredictedLineup | null {
  const iso3 = getWcSquadIso3(teamId);
  if (!iso3) return null;
  return WC_PREDICTED_LINEUPS[iso3] ?? null;
}

export function hasWcConfirmedMatchLineup(teamId: string): boolean {
  const iso3 = getWcSquadIso3(teamId);
  return iso3 ? CONFIRMED_MATCH_LINEUP_ISO3.has(iso3) : false;
}

export function getWcTeamSquad(teamId: string): WcTeamSquad | null {
  const squad = getWcSquad(teamId);
  const predictedLineup = getWcPredictedLineup(teamId);
  if (!squad?.length || !predictedLineup) return null;
  return { squad, predictedLineup };
}

export function getWcResolvedLineup(
  teamId: string,
): (WcSquadPlayer & { x: number; y: number })[] | null {
  const data = getWcTeamSquad(teamId);
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
