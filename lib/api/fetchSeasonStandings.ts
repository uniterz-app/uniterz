"use client";

import { auth } from "@/lib/firebase";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type {
  NbaConferenceStandingsPicks,
  NbaSeasonStandingsPrediction,
} from "@/lib/predict/nbaSeasonStandingsPredict";

export type SeasonStandingsApiPayload = {
  ok: boolean;
  season: string;
  prediction: NbaSeasonStandingsPrediction | null;
  /** 非公開の理由（返せないとき）。締切前 = before_deadline / 本人の非公開設定 = private */
  hidden?: "before_deadline" | "private" | null;
  error?: string;
};

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("not authenticated");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

/** ログイン中なら Bearer を付ける（本人判定用・無ければ空） */
async function optionalAuthHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  try {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

/** 自分の提出（要ログイン） */
export async function fetchMeSeasonStandings(
  season: string = CURRENT_NBA_SEASON_KEY
): Promise<SeasonStandingsApiPayload> {
  const headers = await authHeader();
  const qs = new URLSearchParams({ season });
  const res = await fetch(`/api/me/season-standings?${qs}`, {
    method: "GET",
    headers,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as SeasonStandingsApiPayload;
  if (!res.ok) {
    throw new Error(data?.error ?? res.statusText);
  }
  return data;
}

/** 任意ユーザーの提出（公開） */
export async function fetchProfileSeasonStandings(
  uid: string,
  season: string = CURRENT_NBA_SEASON_KEY
): Promise<SeasonStandingsApiPayload> {
  const qs = new URLSearchParams({ uid, season });
  const headers = await optionalAuthHeader();
  const res = await fetch(`/api/profile/season-standings?${qs}`, {
    method: "GET",
    headers,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as SeasonStandingsApiPayload;
  if (!res.ok) {
    throw new Error(data?.error ?? res.statusText);
  }
  return data;
}

export async function saveMeSeasonStandings(input: {
  season?: string;
  east: NbaConferenceStandingsPicks;
  west: NbaConferenceStandingsPicks;
}): Promise<SeasonStandingsApiPayload> {
  const headers = await authHeader();
  const res = await fetch("/api/me/season-standings", {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      season: input.season ?? CURRENT_NBA_SEASON_KEY,
      east: input.east,
      west: input.west,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as SeasonStandingsApiPayload;
  if (!res.ok) {
    throw new Error(data?.error ?? res.statusText);
  }
  return data;
}
