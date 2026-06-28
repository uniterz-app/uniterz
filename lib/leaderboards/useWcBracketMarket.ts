"use client";

import { useCallback, useEffect, useState } from "react";
import type { WcBracketMarketData } from "@/lib/wc/wc-bracket-market-aggregate";

type Options = {
  season: string;
};

export default function useWcBracketMarket({ season }: Options) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [market, setMarket] = useState<WcBracketMarketData | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ season });
      const res = await fetch(`/api/wc-bracket-market?${q}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        market?: WcBracketMarketData | null;
      };
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "fetch failed");
      }
      setMarket(json.market ?? null);
    } catch (e: unknown) {
      setMarket(null);
      setError(e instanceof Error ? e.message : "fetch failed");
    } finally {
      setLoading(false);
    }
  }, [season]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { loading, error, market, refetch };
}
