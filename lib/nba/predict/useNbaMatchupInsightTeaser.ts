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
  /** この試合を解除済み（初回の無料 / 広告）。中身の取得に切り替える */
  unlocked: boolean;
  /** 初回の無料解除がまだ使える（ボタンを「無料」にする） */
  firstFreeAvailable: boolean;
  /** キット生成時刻（未読点の番号。中身は含まない） */
  updatedAt: string | null;
};

const EMPTY: TeaserState = {
  teaser: null,
  hasKit: false,
  kitRecord: null,
  unlocked: false,
  firstFreeAvailable: false,
  updatedAt: null,
};

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
    const load = async (user: { getIdToken: () => Promise<string> }) => {
      let next: TeaserState = EMPTY;
      try {
        const token = await user.getIdToken();
        // v=2: キット作成前の teaser 403 が CDN に残っていることがある
        const path = `/api/nba/matchup-insight?gameId=${encodeURIComponent(gameId)}&teaser=1&v=2`;
        const res = await fetch(apiBase ? `${apiBase}${path}` : path, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = (await res.json()) as {
            teaser?: unknown;
            hasKit?: unknown;
            kitRecord?: unknown;
            unlocked?: unknown;
            firstFreeAvailable?: unknown;
            predictKit?: unknown;
            updatedAt?: unknown;
          };
          const hasKit =
            json.hasKit === true ||
            (json.predictKit != null && typeof json.predictKit === "object");
          next = {
            teaser: sanitizeProInsightPreviewTeaser(json.teaser),
            hasKit,
            kitRecord: sanitizePredictKitRecord(json.kitRecord),
            unlocked: json.unlocked === true,
            firstFreeAvailable: json.firstFreeAvailable === true,
            updatedAt:
              typeof json.updatedAt === "string" && json.updatedAt
                ? json.updatedAt
                : hasKit
                  ? "kit"
                  : null,
          };
        }
      } catch {
        next = EMPTY;
      }
      if (cancelled) return;
      setState(next);
      setReadyScope(scope);
    };
    const unsub = auth.onIdTokenChanged((user) => {
      if (cancelled) return;
      if (!user) {
        setState(EMPTY);
        setReadyScope(scope);
        return;
      }
      void load(user);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [want, gameId, apiBase, scope]);

  const ready = readyScope === scope;
  return {
    ...(want && ready ? state : EMPTY),
    loading: want && !ready,
  };
}
