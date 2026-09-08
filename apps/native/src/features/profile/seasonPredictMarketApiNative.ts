/**
 * Web `fetchSeasonPredictMarket` 相当（Native）
 */
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import type {
  SeasonAwardsMarketSnapshot,
  SeasonStandingsMarketSnapshot,
} from "../../../../../lib/predict/seasonPredictMarket";

export type SeasonPredictMarketApiPayload = {
  ok: boolean;
  season: string;
  locked: boolean;
  pending: boolean;
  deadlineAtMs?: number;
  builtAtMs?: number;
  standings: SeasonStandingsMarketSnapshot | null;
  awards: SeasonAwardsMarketSnapshot | null;
  message?: string;
  error?: string;
};

function requireBase(): string {
  const base = getUniterzApiBaseUrl();
  if (!base) {
    throw new Error(
      "EXPO_PUBLIC_UNITERZ_API_BASE_URL が未設定です。apps/native/.env を確認してください。"
    );
  }
  return base;
}

export async function fetchSeasonPredictMarketNative(opts?: {
  season?: string;
  kind?: "standings" | "awards" | "all";
}): Promise<SeasonPredictMarketApiPayload> {
  const base = requireBase();
  const qs = new URLSearchParams();
  if (opts?.season) qs.set("season", opts.season);
  if (opts?.kind && opts.kind !== "all") qs.set("kind", opts.kind);
  const res = await fetch(`${base}/api/nba/season-predict-market?${qs}`, {
    method: "GET",
  });
  const data = (await res.json().catch(() => ({}))) as SeasonPredictMarketApiPayload;
  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? `market_fetch_${res.status}`);
  }
  return data;
}
