"use client";

/**
 * 対戦カードの Pro Insight（games.proBrief）を公開 API から読む。
 */
import { useEffect, useState } from "react";
import type { PredictProBrief } from "@/lib/predict/predictProBrief";
import { sanitizeProBriefForDisplay } from "@/lib/predict/validateProBrief";

export function useNbaMatchupProBrief(opts: {
  gameId?: string | null;
  override?: PredictProBrief | null;
  enabled?: boolean;
  /** Native: EXPO_PUBLIC_UNITERZ_API_BASE_URL */
  apiBaseUrl?: string | null;
}): {
  brief: PredictProBrief | null;
  loading: boolean;
} {
  const enabled = opts.enabled !== false;
  const override = opts.override;
  const gameId = (opts.gameId ?? "").trim();
  const apiBase = (opts.apiBaseUrl ?? "").replace(/\/$/, "");
  const [brief, setBrief] = useState<PredictProBrief | null>(
    () => sanitizeProBriefForDisplay(override) ?? null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (override !== undefined && override !== null) {
      setBrief(sanitizeProBriefForDisplay(override));
      return;
    }
    if (!enabled || !gameId) {
      setBrief(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const path = `/api/nba/matchup-insight?gameId=${encodeURIComponent(gameId)}`;
        const url = apiBase ? `${apiBase}${path}` : path;
        const res = await fetch(url, { credentials: "same-origin" });
        if (!res.ok) {
          if (!cancelled) setBrief(null);
          return;
        }
        const json = (await res.json()) as {
          ok?: boolean;
          brief?: PredictProBrief | null;
        };
        if (cancelled) return;
        setBrief(sanitizeProBriefForDisplay(json.brief) ?? null);
      } catch {
        if (!cancelled) setBrief(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, gameId, override, apiBase]);

  return { brief, loading };
}
