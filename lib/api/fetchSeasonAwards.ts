"use client";

import { auth } from "@/lib/firebase";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type {
  NbaAwardCandidate,
  NbaSeasonAwardsPicks,
  NbaSeasonAwardsPrediction,
} from "@/lib/predict/nbaSeasonAwardsPredict";

export type SeasonAwardsApiPayload = {
  ok: boolean;
  season: string;
  prediction: NbaSeasonAwardsPrediction | null;
  candidates: NbaAwardCandidate[];
  error?: string;
};

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("not authenticated");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

/** 自分の提出（要ログイン） */
export async function fetchMeSeasonAwards(
  season: string = CURRENT_NBA_SEASON_KEY
): Promise<SeasonAwardsApiPayload> {
  const headers = await authHeader();
  const qs = new URLSearchParams({ season });
  const res = await fetch(`/api/me/season-awards?${qs}`, {
    method: "GET",
    headers,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as SeasonAwardsApiPayload;
  if (!res.ok) {
    throw new Error(data?.error ?? res.statusText);
  }
  return data;
}

/** 任意ユーザーの提出（公開） */
export async function fetchProfileSeasonAwards(
  uid: string,
  season: string = CURRENT_NBA_SEASON_KEY
): Promise<SeasonAwardsApiPayload> {
  const qs = new URLSearchParams({ uid, season });
  const res = await fetch(`/api/profile/season-awards?${qs}`, {
    method: "GET",
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as SeasonAwardsApiPayload;
  if (!res.ok) {
    throw new Error(data?.error ?? res.statusText);
  }
  return data;
}

export async function saveMeSeasonAwards(input: {
  season?: string;
  picks: NbaSeasonAwardsPicks;
}): Promise<SeasonAwardsApiPayload> {
  const headers = await authHeader();
  const res = await fetch("/api/me/season-awards", {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      season: input.season ?? CURRENT_NBA_SEASON_KEY,
      picks: input.picks,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as SeasonAwardsApiPayload;
  if (!res.ok) {
    throw new Error(data?.error ?? res.statusText);
  }
  return data;
}
