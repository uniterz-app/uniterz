import type {
  SeasonAwardsMarketSnapshot,
  SeasonStandingsMarketSnapshot,
} from "@/lib/predict/seasonPredictMarket";

export type SeasonPredictMarketResponse = {
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

export async function fetchSeasonPredictMarket(opts?: {
  season?: string;
  kind?: "standings" | "awards" | "all";
}): Promise<SeasonPredictMarketResponse> {
  const qs = new URLSearchParams();
  if (opts?.season) qs.set("season", opts.season);
  if (opts?.kind && opts.kind !== "all") qs.set("kind", opts.kind);
  const res = await fetch(`/api/nba/season-predict-market?${qs}`, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = (await res.json().catch(() => null)) as SeasonPredictMarketResponse | null;
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error ?? `market_fetch_${res.status}`);
  }
  return data;
}
