"use client";

/** DISCIPLINE シーズン推移（Web / Native 共通）。`/api/nba/discipline-history` */
import { useEffect, useState } from "react";
import type { NbaDisciplineHistoryPoint } from "@/lib/nba/discipline/disciplineTypes";

const cache = new Map<string, Promise<NbaDisciplineHistoryPoint[]>>();

function fetchHistory(
  apiBaseUrl: string | null | undefined,
  subject: "team" | "player",
  id: string,
  toSeason: string
): Promise<NbaDisciplineHistoryPoint[]> {
  const root = (apiBaseUrl ?? "").replace(/\/$/, "");
  const key = `${root}|${subject}|${id}|${toSeason}`;
  let hit = cache.get(key);
  if (!hit) {
    const qs = new URLSearchParams({ [subject]: id, to: toSeason });
    hit = fetch(`${root}/api/nba/discipline-history?${qs.toString()}`)
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          points?: NbaDisciplineHistoryPoint[];
        };
        if (!res.ok || !data.ok) throw new Error(`discipline history (${res.status})`);
        return data.points ?? [];
      })
      .catch((e) => {
        cache.delete(key);
        throw e;
      });
    cache.set(key, hit);
  }
  return hit;
}

export function useNbaDisciplineHistory(options: {
  subject: "team" | "player";
  id: string;
  toSeason: string;
  apiBaseUrl?: string | null;
}): NbaDisciplineHistoryPoint[] | null {
  const { subject, id, toSeason, apiBaseUrl } = options;
  const key = `${subject}|${id}|${toSeason}`;
  const [state, setState] = useState<{
    key: string;
    points: NbaDisciplineHistoryPoint[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchHistory(apiBaseUrl, subject, id, toSeason)
      .then((points) => {
        if (!cancelled) setState({ key, points });
      })
      .catch(() => {
        if (!cancelled) setState({ key, points: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, subject, id, toSeason, key]);

  return state?.key === key ? state.points : null;
}
