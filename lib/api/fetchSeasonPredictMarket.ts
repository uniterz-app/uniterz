import type {
  SeasonAwardsMarketSnapshot,
  SeasonStandingsMarketSnapshot,
} from "@/lib/predict/seasonPredictMarket";

export type SeasonPredictMarketResponse = {
  ok: boolean;
  season: string;
  locked: boolean;
  pending: boolean;
  /** 締切前の途中集計（提出者のみ） */
  preview?: boolean;
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
  /** 締切前に提出者として途中集計を読む（要ログイン） */
  preview?: boolean;
}): Promise<SeasonPredictMarketResponse> {
  const qs = new URLSearchParams();
  if (opts?.season) qs.set("season", opts.season);
  if (opts?.kind && opts.kind !== "all") qs.set("kind", opts.kind);
  const headers: Record<string, string> = {};
  if (opts?.preview) {
    qs.set("preview", "1");
    const { auth } = await import("@/lib/firebase");
    const token = await auth.currentUser?.getIdToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`/api/nba/season-predict-market?${qs}`, {
    method: "GET",
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = (await res.json().catch(() => null)) as SeasonPredictMarketResponse | null;
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error ?? `market_fetch_${res.status}`);
  }
  return data;
}
