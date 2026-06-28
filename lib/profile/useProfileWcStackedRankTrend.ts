"use client";

import { useEffect, useState } from "react";
import { fetchRankPlayoffTrendClient } from "@/lib/profile/fetchRankPlayoffTrendClient";
import type { PlayoffRankTrendPoint } from "@/lib/profile/useProfilePlayoffRankTrend";
import {
  getProfileRankTrendSectionTitle,
  WC_KINETIK_STACKED_STAGES,
  type WcKinetikStackedStage,
} from "@/lib/profile/profileKinetikMetricsSection";

export type ProfileRankTrendSection = {
  wcStage: WcKinetikStackedStage;
  title: string;
  chartRows: PlayoffRankTrendPoint[];
  /** グループステージは終了 — スナップショット固定表示 */
  frozen: boolean;
};

const LIVE_CACHE_TTL_MS = 5 * 60 * 1000;
const FROZEN_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const cache = new Map<
  string,
  { at: number; points: PlayoffRankTrendPoint[] }
>();

function cacheKey(uid: string, stage: WcKinetikStackedStage): string {
  return `${uid}:worldcup:${stage}`;
}

function readCache(
  key: string,
  frozen: boolean
): PlayoffRankTrendPoint[] | null {
  const hit = cache.get(key);
  if (!hit) return null;
  const ttl = frozen ? FROZEN_CACHE_TTL_MS : LIVE_CACHE_TTL_MS;
  if (Date.now() - hit.at > ttl) return null;
  return hit.points;
}

export function useProfileWcStackedRankTrend(
  uid: string | null | undefined,
  enabled: boolean,
  apiBase?: string
): {
  sections: ProfileRankTrendSection[];
  loading: boolean;
} {
  const [sections, setSections] = useState<ProfileRankTrendSection[]>([]);
  const [loading, setLoading] = useState(enabled && !!uid);

  useEffect(() => {
    if (!enabled || !uid) {
      setSections([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const results = await Promise.all(
          WC_KINETIK_STACKED_STAGES.map(async (stage) => {
            const frozen = stage === "qualifying";
            const key = cacheKey(uid, stage);
            const cached = readCache(key, frozen);
            if (cached) {
              return { stage, points: cached, frozen };
            }
            const points = await fetchRankPlayoffTrendClient(
              uid,
              "worldcup",
              stage,
              apiBase
            );
            cache.set(key, { at: Date.now(), points });
            return { stage, points, frozen };
          })
        );
        if (cancelled) return;

        const built: ProfileRankTrendSection[] = [];
        for (const { stage, points, frozen } of results) {
          if (stage === "qualifying" && points.length === 0) continue;
          built.push({
            wcStage: stage,
            title: getProfileRankTrendSectionTitle(stage),
            chartRows: points,
            frozen,
          });
        }
        setSections(built);
      } catch {
        if (!cancelled) setSections([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiBase, enabled, uid]);

  return { sections, loading };
}
