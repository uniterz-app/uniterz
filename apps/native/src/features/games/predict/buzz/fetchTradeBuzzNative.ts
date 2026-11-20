import { getUniterzApiBaseUrl } from "../../submitPredictionApi";
import {
  NBA_TRADE_BUZZ_API_PATH,
  type NbaTradeBuzzPublicPayload,
} from "../../../../../../../lib/predict/nbaTradeBuzzApi";
import type { NbaTradeBuzzItem } from "../../../../../../../lib/predict/nbaTradeBuzz";
import type { NbaConfirmedTrade } from "../../../../../../../lib/predict/nbaTradeConfirmed";

function itemsOf(raw: unknown): NbaTradeBuzzItem[] {
  return Array.isArray(raw) ? (raw as NbaTradeBuzzItem[]) : [];
}

function confirmedOf(raw: unknown): NbaConfirmedTrade[] {
  return Array.isArray(raw) ? (raw as NbaConfirmedTrade[]) : [];
}

export type FetchTradeBuzzOpts = {
  /** true: 黄色い点用。本文は取らない */
  meta?: boolean;
  etag?: string | null;
};

export type FetchTradeBuzzResult = {
  notModified: boolean;
  payload: NbaTradeBuzzPublicPayload | null;
  etag: string | null;
};

export async function fetchTradeBuzzNative(
  opts: FetchTradeBuzzOpts = {}
): Promise<FetchTradeBuzzResult | null> {
  const base = getUniterzApiBaseUrl();
  if (!base) return null;
  const path = opts.meta
    ? `${NBA_TRADE_BUZZ_API_PATH}?meta=1`
    : NBA_TRADE_BUZZ_API_PATH;
  try {
    const headers: Record<string, string> = {};
    if (opts.etag) headers["If-None-Match"] = opts.etag;
    const res = await fetch(`${base}${path}`, { headers });
    const etag = res.headers.get("etag");
    if (res.status === 304) {
      return { notModified: true, payload: null, etag: etag ?? opts.etag ?? null };
    }
    if (!res.ok) return null;
    const json = (await res.json()) as Record<string, unknown>;
    const updatedAtMs = Number(json.updatedAtMs);
    const payload: NbaTradeBuzzPublicPayload = {
      asOfJst: typeof json.asOfJst === "string" ? json.asOfJst : null,
      updatedAtMs: Number.isFinite(updatedAtMs) && updatedAtMs > 0 ? updatedAtMs : null,
      items: opts.meta ? [] : itemsOf(json.items),
      confirmed: opts.meta ? [] : confirmedOf(json.confirmed),
    };
    return { notModified: false, payload, etag };
  } catch {
    return null;
  }
}
