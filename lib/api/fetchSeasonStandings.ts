"use client";

import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { NbaSeasonStandingsPrediction } from "@/lib/predict/nbaSeasonStandingsPredict";

export type SeasonStandingsApiPayload = {
  ok: boolean;
  season: string;
  prediction: NbaSeasonStandingsPrediction | null;
  error?: string;
};

/** 任意ユーザーの提出（公開） */
export async function fetchProfileSeasonStandings(
  uid: string,
  season: string = CURRENT_NBA_SEASON_KEY
): Promise<SeasonStandingsApiPayload> {
  const qs = new URLSearchParams({ uid, season });
  const res = await fetch(`/api/profile/season-standings?${qs}`, {
    method: "GET",
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as SeasonStandingsApiPayload;
  if (!res.ok) {
    throw new Error(data?.error ?? res.statusText);
  }
  return data;
}
