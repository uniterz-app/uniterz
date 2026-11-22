import type { NbaTradeBuzzItem } from "@/lib/predict/nbaTradeBuzz";
import type { NbaConfirmedTrade } from "@/lib/predict/nbaTradeConfirmed";

export const NBA_TRADE_BUZZ_API_PATH = "/api/nba/trade-buzz";

/** 黄色い点用（`?meta=1` だけ）。CDN 60 秒より速くしても新しい中身は来ない */
export const TRADE_BUZZ_META_POLL_MS = 60 * 1000;
/** Buzz 画面を開いているあいだの本文取り直し */
export const TRADE_BUZZ_FEED_POLL_MS = 3 * 60 * 1000;

/** @deprecated TRADE_BUZZ_META_POLL_MS と同じ */
export const TRADE_BUZZ_POLL_MS = TRADE_BUZZ_META_POLL_MS;

export type NbaTradeBuzzPublicPayload = {
  asOfJst: string | null;
  updatedAtMs: number | null;
  items: NbaTradeBuzzItem[];
  confirmed: NbaConfirmedTrade[];
};

export function nbaTradeBuzzVersionFromPayload(
  payload: Pick<NbaTradeBuzzPublicPayload, "updatedAtMs"> | null
): string | null {
  const ms = payload?.updatedAtMs;
  if (typeof ms !== "number" || !(ms > 0)) return null;
  return String(ms);
}
