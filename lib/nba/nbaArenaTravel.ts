/**
 * NBA Insight 用の移動距離。マップピン座標をアリーナ位置として使い、
 * 今夜のレグと直近 48h の合計 km を出す。
 */

import { getNbaTeamMapCoord } from "@/lib/nba/nbaTeamMapCoords";
import { TEAM_SHORT } from "@/lib/team-short";

/** 今夜の移動を出す下限（短いロードは出さない） */
export const NBA_TRAVEL_TONIGHT_MIN_KM = 800;
/** 2日移動を出す下限。かなり動いたときだけ */
export const NBA_TRAVEL_WINDOW_MIN_KM = 2000;
/** 2日移動は複数レグのときだけ（今夜と同じ1本を繰り返さない） */
export const NBA_TRAVEL_WINDOW_MIN_LEGS = 2;
export const NBA_TRAVEL_WINDOW_MS = 48 * 60 * 60 * 1000;

const EARTH_KM = 6371;

export type NbaTravelStop = {
  /** その試合の会場 = ホームチーム ID */
  venueTeamId: string;
  startAtMs: number;
};

export type NbaTeamTravelSummary = {
  tonightKm: number | null;
  tonightFromId: string | null;
  tonightToId: string;
  windowKm: number;
  windowLegs: number;
  isHomeTonight: boolean;
};

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function kmBetweenArenas(
  fromTeamId: string,
  toTeamId: string
): number | null {
  if (!fromTeamId || !toTeamId) return null;
  if (fromTeamId === toTeamId) return 0;
  const from = getNbaTeamMapCoord(fromTeamId);
  const to = getNbaTeamMapCoord(toTeamId);
  if (!from || !to) return null;
  return haversineKm(from, to);
}

export function formatTravelKm(km: number): string {
  const rounded = Math.round(km);
  return `${rounded.toLocaleString("en-US")}km`;
}

export function nbaTravelAbbr(teamId: string): string {
  return (TEAM_SHORT[teamId] ?? teamId.replace(/^nba-/, "")).toUpperCase();
}

function sortStops(stops: NbaTravelStop[]): NbaTravelStop[] {
  return [...stops].sort((a, b) => a.startAtMs - b.startAtMs);
}

/**
 * `recentStops` は今夜より前の試合会場。無い場合は本拠地から今夜への1本。
 */
export function summarizeNbaTeamTravel(input: {
  teamId: string;
  tonightVenueTeamId: string;
  tonightStartAtMs: number;
  recentStops?: NbaTravelStop[];
}): NbaTeamTravelSummary {
  const tonightToId = input.tonightVenueTeamId;
  const isHomeTonight = input.teamId === tonightToId;
  const prior = sortStops(input.recentStops ?? []).filter(
    (s) => s.startAtMs < input.tonightStartAtMs
  );
  const tonightFromId = prior.at(-1)?.venueTeamId ?? input.teamId;
  const tonightKm = kmBetweenArenas(tonightFromId, tonightToId);

  const path: NbaTravelStop[] =
    prior.length > 0
      ? [
          ...prior,
          { venueTeamId: tonightToId, startAtMs: input.tonightStartAtMs },
        ]
      : [
          { venueTeamId: input.teamId, startAtMs: input.tonightStartAtMs - 1 },
          { venueTeamId: tonightToId, startAtMs: input.tonightStartAtMs },
        ];
  const windowStart = input.tonightStartAtMs - NBA_TRAVEL_WINDOW_MS;
  let windowKm = 0;
  let windowLegs = 0;
  for (let i = 1; i < path.length; i++) {
    const arrive = path[i]!;
    if (arrive.startAtMs < windowStart) continue;
    const fromId = path[i - 1]!.venueTeamId;
    const leg = kmBetweenArenas(fromId, arrive.venueTeamId);
    if (leg == null || leg <= 0) continue;
    windowKm += leg;
    windowLegs += 1;
  }

  return {
    tonightKm,
    tonightFromId,
    tonightToId,
    windowKm,
    windowLegs,
    isHomeTonight,
  };
}

export function shouldShowTonightTravel(summary: NbaTeamTravelSummary): boolean {
  return (
    !summary.isHomeTonight &&
    summary.tonightKm != null &&
    summary.tonightKm >= NBA_TRAVEL_TONIGHT_MIN_KM
  );
}

export function shouldShowTwoDayTravel(summary: NbaTeamTravelSummary): boolean {
  return (
    summary.windowLegs >= NBA_TRAVEL_WINDOW_MIN_LEGS &&
    summary.windowKm >= NBA_TRAVEL_WINDOW_MIN_KM
  );
}
