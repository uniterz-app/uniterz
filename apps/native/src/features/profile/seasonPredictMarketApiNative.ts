/**
 * Web `fetchSeasonPredictMarket` 相当（Native）
 */
import { auth } from "../../lib/firebase";
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
  /** 締切前の途中集計（提出者のみ） */
  preview?: boolean;
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
  /** 締切前に提出者として途中集計を読む（要ログイン） */
  preview?: boolean;
}): Promise<SeasonPredictMarketApiPayload> {
  const base = requireBase();
  const qs = new URLSearchParams();
  if (opts?.season) qs.set("season", opts.season);
  if (opts?.kind && opts.kind !== "all") qs.set("kind", opts.kind);
  const headers: Record<string, string> = {};
  if (opts?.preview) {
    qs.set("preview", "1");
    const token = await auth.currentUser?.getIdToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${base}/api/nba/season-predict-market?${qs}`, {
    method: "GET",
    headers,
  });
  const data = (await res.json().catch(() => ({}))) as SeasonPredictMarketApiPayload;
  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? `market_fetch_${res.status}`);
  }
  return data;
}
