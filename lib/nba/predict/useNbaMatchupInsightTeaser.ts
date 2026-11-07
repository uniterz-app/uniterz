"use client";

/**
 * Free 向け: ピックアップ試合の PREVIEW 第 1 段落（`/api/nba/matchup-insight?teaser=1`）。
 * PREVIEW の無い試合・未生成は null（従来の Pro ゲートを出す）。
 */
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import {
  sanitizeProInsightPreviewTeaser,
  type ProInsightPreviewTeaser,
} from "@/lib/predict/proInsightPreviewTeaser";

export function useNbaMatchupInsightTeaser(opts: {
  gameId?: string | null;
  enabled?: boolean;
  apiBaseUrl?: string | null;
}): { teaser: ProInsightPreviewTeaser | null; loading: boolean } {
  const gameId = (opts.gameId ?? "").trim();
  const apiBase = (opts.apiBaseUrl ?? "").replace(/\/$/, "");
  const want = opts.enabled !== false && !!gameId;
  const scope = `${gameId}|${apiBase}`;
  const [teaser, setTeaser] = useState<ProInsightPreviewTeaser | null>(null);
  const [readyScope, setReadyScope] = useState<string | null>(null);

  useEffect(() => {
    if (!want) return;
    let cancelled = false;
    (async () => {
      let next: ProInsightPreviewTeaser | null = null;
      try {
        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdToken();
          const path = `/api/nba/matchup-insight?gameId=${encodeURIComponent(gameId)}&teaser=1`;
          const res = await fetch(apiBase ? `${apiBase}${path}` : path, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const json = (await res.json()) as { teaser?: unknown };
            next = sanitizeProInsightPreviewTeaser(json.teaser);
          }
        }
      } catch {
        next = null;
      }
      if (cancelled) return;
      setTeaser(next);
      setReadyScope(scope);
    })();
    return () => {
      cancelled = true;
    };
  }, [want, gameId, apiBase, scope]);

  const ready = readyScope === scope;
  return {
    teaser: want && ready ? teaser : null,
    loading: want && !ready,
  };
}
