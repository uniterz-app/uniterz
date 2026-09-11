"use client";

/**
 * 対戦カードの Pro Insight を公開 API から読む。
 * 新 UI: narrative（試合共通）。旧 brief は互換で残す。
 * Pro 限定 — Authorization 必須。
 */
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import type { PredictProBrief } from "@/lib/predict/predictProBrief";
import type { ProInsightNarrativeBrief } from "@/lib/predict/proInsightNarrativeTypes";
import { sanitizeProBriefForDisplay } from "@/lib/predict/validateProBrief";
import {
  sanitizeProInsightNarrativeForDisplay,
  type ProInsightNarrativeStatus,
} from "@/lib/predict/validateProInsightNarrative";

export function useNbaMatchupProBrief(opts: {
  gameId?: string | null;
  /** @deprecated 旧 HOME/AWAY。プレビュー用 */
  override?: PredictProBrief | null;
  /** ナラティブ上書き（Dev / ゲート以外のプレビュー） */
  narrativeOverride?: ProInsightNarrativeBrief | null;
  enabled?: boolean;
  /** Native: EXPO_PUBLIC_UNITERZ_API_BASE_URL */
  apiBaseUrl?: string | null;
}): {
  brief: PredictProBrief | null;
  narrative: ProInsightNarrativeBrief | null;
  status: ProInsightNarrativeStatus;
  loading: boolean;
} {
  const enabled = opts.enabled !== false;
  const override = opts.override;
  const narrativeOverride = opts.narrativeOverride;
  const gameId = (opts.gameId ?? "").trim();
  const apiBase = (opts.apiBaseUrl ?? "").replace(/\/$/, "");
  const hasNarrativeOverride = narrativeOverride != null;
  const hasBriefOverride = override != null;
  const want =
    enabled && !hasNarrativeOverride && !hasBriefOverride && !!gameId;
  const fetchScope = `${gameId}|${apiBase}`;

  const [brief, setBrief] = useState<PredictProBrief | null>(() =>
    hasBriefOverride ? sanitizeProBriefForDisplay(override) : null
  );
  const [narrative, setNarrative] = useState<ProInsightNarrativeBrief | null>(
    () =>
      hasNarrativeOverride
        ? sanitizeProInsightNarrativeForDisplay(narrativeOverride)
        : null
  );
  const [status, setStatus] = useState<ProInsightNarrativeStatus>(() =>
    hasNarrativeOverride ? "ready" : "empty"
  );
  const [readyScope, setReadyScope] = useState<string | null>(() =>
    hasNarrativeOverride || hasBriefOverride ? fetchScope : null
  );

  useEffect(() => {
    if (hasNarrativeOverride) {
      setNarrative(sanitizeProInsightNarrativeForDisplay(narrativeOverride));
      setStatus("ready");
      setBrief(hasBriefOverride ? sanitizeProBriefForDisplay(override) : null);
      setReadyScope(fetchScope);
      return;
    }
    if (hasBriefOverride) {
      setBrief(sanitizeProBriefForDisplay(override));
      setNarrative(null);
      setStatus("empty");
      setReadyScope(fetchScope);
      return;
    }
    if (!enabled || !gameId) {
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          if (!cancelled) {
            setBrief(null);
            setNarrative(null);
            setStatus("empty");
          }
          return;
        }
        const token = await user.getIdToken();
        const path = `/api/nba/matchup-insight?gameId=${encodeURIComponent(gameId)}`;
        const url = apiBase ? `${apiBase}${path}` : path;
        const res = await fetch(url, {
          credentials: "same-origin",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (!cancelled) {
            setBrief(null);
            setNarrative(null);
            setStatus("empty");
          }
          return;
        }
        const json = (await res.json()) as {
          ok?: boolean;
          brief?: PredictProBrief | null;
          narrative?: unknown;
          status?: ProInsightNarrativeStatus;
        };
        if (cancelled) return;
        const nextNarrative = sanitizeProInsightNarrativeForDisplay(
          json.narrative
        );
        setNarrative(nextNarrative);
        setBrief(sanitizeProBriefForDisplay(json.brief) ?? null);
        setStatus(
          json.status === "ready" ||
            json.status === "pending" ||
            json.status === "empty"
            ? json.status
            : nextNarrative
              ? "ready"
              : "empty"
        );
      } catch {
        if (!cancelled) {
          setBrief(null);
          setNarrative(null);
          setStatus("empty");
        }
      } finally {
        if (!cancelled) setReadyScope(fetchScope);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    gameId,
    override,
    narrativeOverride,
    hasBriefOverride,
    hasNarrativeOverride,
    apiBase,
    fetchScope,
  ]);

  const resolvedNarrative = hasNarrativeOverride
    ? sanitizeProInsightNarrativeForDisplay(narrativeOverride)
    : narrative;
  const resolvedBrief = hasBriefOverride
    ? sanitizeProBriefForDisplay(override)
    : brief;
  const resolvedStatus: ProInsightNarrativeStatus = hasNarrativeOverride
    ? "ready"
    : status;
  const loading = Boolean(want && readyScope !== fetchScope);

  return {
    brief: resolvedBrief,
    narrative: resolvedNarrative,
    status: resolvedStatus,
    loading,
  };
}
