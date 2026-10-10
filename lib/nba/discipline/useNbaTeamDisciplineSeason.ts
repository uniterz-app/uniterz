"use client";

/**
 * チーム詳細 DISCIPLINE の年切替（Web / Native 共通）。
 * 初期シーズンは team-detail 同梱の切片、他は `/api/nba/team-discipline`。
 */
import { useEffect, useMemo, useState } from "react";
import type { NbaDisciplineDetailSlice } from "@/lib/nba/discipline/disciplineTypes";
import { nbaLeagueStatsSeasonKeys } from "@/lib/rankings/nbaSeason";

const cache = new Map<string, Promise<NbaDisciplineDetailSlice | null>>();

function fetchTeamDiscipline(
  apiBaseUrl: string | null | undefined,
  teamId: string,
  season: string
): Promise<NbaDisciplineDetailSlice | null> {
  const root = (apiBaseUrl ?? "").replace(/\/$/, "");
  const key = `${root}|${teamId}|${season}`;
  let hit = cache.get(key);
  if (!hit) {
    const qs = new URLSearchParams({ team: teamId, season });
    hit = fetch(`${root}/api/nba/team-discipline?${qs.toString()}`)
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          discipline?: NbaDisciplineDetailSlice | null;
        };
        if (!res.ok || !data.ok) throw new Error(`team discipline (${res.status})`);
        return data.discipline ?? null;
      })
      .catch((e) => {
        cache.delete(key);
        throw e;
      });
    cache.set(key, hit);
  }
  return hit;
}

export function useNbaTeamDisciplineSeason(options: {
  teamId: string;
  initial: NbaDisciplineDetailSlice;
  apiBaseUrl?: string | null;
}): {
  seasonKey: string;
  seasonKeys: readonly string[];
  setSeasonKey: (seasonKey: string) => void;
  slice: NbaDisciplineDetailSlice | null;
  loading: boolean;
} {
  const { teamId, initial, apiBaseUrl } = options;
  const seasonKeys = useMemo(
    () => nbaLeagueStatsSeasonKeys(initial.season),
    [initial.season]
  );
  const [seasonKey, setSeasonKey] = useState(initial.season);
  const [fetched, setFetched] = useState<{
    key: string;
    slice: NbaDisciplineDetailSlice | null;
  } | null>(null);

  useEffect(() => {
    setSeasonKey(initial.season);
  }, [teamId, initial.season]);

  const isInitial = seasonKey === initial.season;
  const fetchKey = `${teamId}|${seasonKey}`;

  useEffect(() => {
    if (isInitial) return;
    let cancelled = false;
    void fetchTeamDiscipline(apiBaseUrl, teamId, seasonKey)
      .then((slice) => {
        if (!cancelled) setFetched({ key: fetchKey, slice });
      })
      .catch(() => {
        if (!cancelled) setFetched({ key: fetchKey, slice: null });
      });
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, teamId, seasonKey, isInitial, fetchKey]);

  const ready = isInitial || fetched?.key === fetchKey;
  return {
    seasonKey,
    seasonKeys,
    setSeasonKey,
    slice: isInitial ? initial : ready ? (fetched?.slice ?? null) : null,
    loading: !ready,
  };
}
