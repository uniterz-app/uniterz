/**
 * Web `lib/api/fetchSeasonAwards` 相当（Native: API base URL 付き）
 */
import { auth } from "../../lib/firebase";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import { CURRENT_NBA_SEASON_KEY } from "../../../../../lib/rankings/nbaSeason";
import type {
  NbaAwardCandidate,
  NbaSeasonAwardsPicks,
  NbaSeasonAwardsPrediction,
} from "../../../../../lib/predict/nbaSeasonAwardsPredict";

export type SeasonAwardsApiPayload = {
  ok: boolean;
  season: string;
  prediction: NbaSeasonAwardsPrediction | null;
  candidates: NbaAwardCandidate[];
  error?: string;
};

async function parseJson(res: Response): Promise<SeasonAwardsApiPayload> {
  return (await res.json().catch(() => ({}))) as SeasonAwardsApiPayload;
}

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("ログインが必要です。");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

function requireBase(): string {
  const base = getUniterzApiBaseUrl();
  if (!base) {
    throw new Error(
      "EXPO_PUBLIC_UNITERZ_API_BASE_URL が未設定です。apps/native/.env を確認してください。"
    );
  }
  return base;
}

function networkHint(cause: unknown): Error {
  const raw = cause instanceof Error ? cause.message : String(cause ?? "");
  if (/network|failed|fetch/i.test(raw) || !raw.trim()) {
    return new Error(
      "API に接続できません。Next.js（npm run dev）が起動しているか、EXPO_PUBLIC_UNITERZ_API_BASE_URL を確認してください。"
    );
  }
  return cause instanceof Error ? cause : new Error(raw || "request failed");
}

export async function fetchMeSeasonAwardsNative(
  season: string = CURRENT_NBA_SEASON_KEY
): Promise<SeasonAwardsApiPayload> {
  const base = requireBase();
  const headers = await authHeader();
  const qs = new URLSearchParams({ season });
  let res: Response;
  try {
    res = await fetch(`${base}/api/me/season-awards?${qs}`, {
      method: "GET",
      headers,
    });
  } catch (e) {
    throw networkHint(e);
  }
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(
      data?.error || res.statusText || `取得に失敗しました（${res.status}）`
    );
  }
  return data;
}

export async function fetchProfileSeasonAwardsNative(
  uid: string,
  season: string = CURRENT_NBA_SEASON_KEY
): Promise<SeasonAwardsApiPayload> {
  const base = requireBase();
  const qs = new URLSearchParams({ uid, season });
  let res: Response;
  try {
    res = await fetch(`${base}/api/profile/season-awards?${qs}`, {
      method: "GET",
    });
  } catch (e) {
    throw networkHint(e);
  }
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(
      data?.error || res.statusText || `取得に失敗しました（${res.status}）`
    );
  }
  return data;
}

export async function saveMeSeasonAwardsNative(input: {
  season?: string;
  picks: NbaSeasonAwardsPicks;
}): Promise<SeasonAwardsApiPayload> {
  const base = requireBase();
  const headers = await authHeader();
  let res: Response;
  try {
    res = await fetch(`${base}/api/me/season-awards`, {
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
  } catch (e) {
    throw networkHint(e);
  }
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(
      data?.error || res.statusText || `提出に失敗しました（${res.status}）`
    );
  }
  return data;
}
