"use client";

/**
 * チーム詳細 / 選手詳細 DISCIPLINE の年切替（Web / Native 共通）。
 * 初期シーズンは team-detail / player-detail 同梱の切片、
 * 他は `/api/nba/team-discipline` / `/api/nba/player-discipline`。
 */
import { useEffect, useMemo, useState } from "react";
import type { NbaDisciplineDetailSlice } from "@/lib/nba/discipline/disciplineTypes";
import { nbaLeagueStatsSeasonKeys } from "@/lib/rankings/nbaSeason";

type DisciplineSubject = "team" | "player";

const cache = new Map<string, Promise<NbaDisciplineDetailSlice | null>>();

function fetchDiscipline(
  apiBaseUrl: string | null | undefined,
  subject: DisciplineSubject,
  id: string,
  season: string
): Promise<NbaDisciplineDetailSlice | null> {
  const root = (apiBaseUrl ?? "").replace(/\/$/, "");
  const key = `${root}|${subject}|${id}|${season}`;
  let hit = cache.get(key);
  if (!hit) {
    const qs = new URLSearchParams({ [subject]: id, season });
    hit = fetch(`${root}/api/nba/${subject}-discipline?${qs.toString()}`)
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          discipline?: NbaDisciplineDetailSlice | null;
        };
        if (!res.ok || !data.ok) throw new Error(`${subject} discipline (${res.status})`);
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

export type NbaDisciplineSeasonState = {
  seasonKey: string;
  seasonKeys: readonly string[];
  setSeasonKey: (seasonKey: string) => void;
  slice: NbaDisciplineDetailSlice | null;
  loading: boolean;
};

export function useNbaDisciplineSeason(options: {
  subject: DisciplineSubject;
  id: string;
  initial: NbaDisciplineDetailSlice;
  apiBaseUrl?: string | null;
}): NbaDisciplineSeasonState {
  const { subject, id, initial, apiBaseUrl } = options;
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
  }, [subject, id, initial.season]);

  const isInitial = seasonKey === initial.season;
  const fetchKey = `${subject}|${id}|${seasonKey}`;

  useEffect(() => {
    if (isInitial) return;
    let cancelled = false;
    void fetchDiscipline(apiBaseUrl, subject, id, seasonKey)
      .then((slice) => {
        if (!cancelled) setFetched({ key: fetchKey, slice });
      })
      .catch(() => {
        if (!cancelled) setFetched({ key: fetchKey, slice: null });
      });
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, subject, id, seasonKey, isInitial, fetchKey]);

  const ready = isInitial || fetched?.key === fetchKey;
  return {
    seasonKey,
    seasonKeys,
    setSeasonKey,
    slice: isInitial ? initial : ready ? (fetched?.slice ?? null) : null,
    loading: !ready,
  };
}

export function useNbaTeamDisciplineSeason(options: {
  teamId: string;
  initial: NbaDisciplineDetailSlice;
  apiBaseUrl?: string | null;
}): NbaDisciplineSeasonState {
  return useNbaDisciplineSeason({
    subject: "team",
    id: options.teamId,
    initial: options.initial,
    apiBaseUrl: options.apiBaseUrl,
  });
}

export function useNbaPlayerDisciplineSeason(options: {
  playerId: string;
  initial: NbaDisciplineDetailSlice;
  apiBaseUrl?: string | null;
}): NbaDisciplineSeasonState {
  return useNbaDisciplineSeason({
    subject: "player",
    id: options.playerId,
    initial: options.initial,
    apiBaseUrl: options.apiBaseUrl,
  });
}
