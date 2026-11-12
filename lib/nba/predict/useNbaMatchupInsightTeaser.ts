"use client";

/**
 * Free 向け: ピックアップ試合の PREVIEW 第 1 段落（`/api/nba/matchup-insight?teaser=1`）と、
 * 予想の材料があるか・今季の的中率（中身は返らない）。
 * どれも無い試合・未生成は null（従来の Pro ゲートを出す）。
 */
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import {
  sanitizeProInsightPreviewTeaser,
  type ProInsightPreviewTeaser,
} from "@/lib/predict/proInsightPreviewTeaser";
import {
  sanitizePredictKitRecord,
  type ProInsightPredictKitRecord,
} from "@/lib/nba/insights/predictKit/predictKitTypes";

type TeaserState = {
  teaser: ProInsightPreviewTeaser | null;
  hasKit: boolean;
  kitRecord: ProInsightPredictKitRecord | null;
};

const EMPTY: TeaserState = { teaser: null, hasKit: false, kitRecord: null };

export function useNbaMatchupInsightTeaser(opts: {
  gameId?: string | null;
  enabled?: boolean;
  apiBaseUrl?: string | null;
}): TeaserState & { loading: boolean } {
  const gameId = (opts.gameId ?? "").trim();
  const apiBase = (opts.apiBaseUrl ?? "").replace(/\/$/, "");
  const want = opts.enabled !== false && !!gameId;
  const scope = `${gameId}|${apiBase}`;
  const [state, setState] = useState<TeaserState>(EMPTY);
  const [readyScope, setReadyScope] = useState<string | null>(null);

  useEffect(() => {
    if (!want) return;
    let cancelled = false;
    (async () => {
      let next: TeaserState = EMPTY;
      try {
        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdToken();
          const path = `/api/nba/matchup-insight?gameId=${encodeURIComponent(gameId)}&teaser=1`;
          const res = await fetch(apiBase ? `${apiBase}${path}` : path, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const json = (await res.json()) as { teaser?: unknown; hasKit?: unknown; kitRecord?: unknown };
            next = {
              teaser: sanitizeProInsightPreviewTeaser(json.teaser),
              hasKit: json.hasKit === true,
              kitRecord: sanitizePredictKitRecord(json.kitRecord),
            };
          }
        }
      } catch {
        next = EMPTY;
      }
      if (cancelled) return;
      setState(next);
      setReadyScope(scope);
    })();
    return () => {
      cancelled = true;
    };
  }, [want, gameId, apiBase, scope]);

  const ready = readyScope === scope;
  return {
    ...(want && ready ? state : EMPTY),
    loading: want && !ready,
  };
}
