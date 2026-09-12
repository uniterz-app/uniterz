"use client";

import { useEffect, useState } from "react";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { buildMatchupRosterReport } from "@/lib/nba/teamRosters/buildMatchupRosterReport";
import {
  fetchMatchupDetailBundle,
  peekMatchupDetailBundle,
} from "@/lib/nba/predict/fetchMatchupDetailClient";
import type { NbaRosterReport } from "@/lib/predict/nbaRoster";

type Options = {
  homeTeamId?: string;
  awayTeamId?: string;
  /** Native: getUniterzApiBaseUrl() */
  apiBaseUrl?: string | null;
  season?: string;
  /** prop で渡された場合は API をスキップ */
  override?: NbaRosterReport | null;
  /** false のときは取得しない（未選択タブの先読みを止める） */
  enabled?: boolean;
};

/**
 * 予想 ROSTER: `/api/nba/matchup-detail` 共有キャッシュから切り出し。
 */
export function useNbaMatchupRoster(options: Options): {
  roster: NbaRosterReport | null;
  loading: boolean;
  source: "override" | "firestore" | "empty" | "error";
} {
  const homeTeamId = options.homeTeamId?.trim() ?? "";
  const awayTeamId = options.awayTeamId?.trim() ?? "";
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const override = options.override;
  const apiBaseUrl = options.apiBaseUrl;
  const enabled = options.enabled ?? true;
  const want = enabled && !override && !!homeTeamId && !!awayTeamId;
  const fetchOpts = { homeTeamId, awayTeamId, season, apiBaseUrl };
  const peeked = want ? peekMatchupDetailBundle(fetchOpts) : null;
  const peekedRoster =
    peeked?.roster ??
    (peeked
      ? buildMatchupRosterReport(
          homeTeamId,
          awayTeamId,
          peeked.rosterHome,
          peeked.rosterAway
        )
      : null);
  const scopeKey = `${homeTeamId}|${awayTeamId}|${season}|roster`;

  const [roster, setRoster] = useState<NbaRosterReport | null>(
    () => override ?? peekedRoster
  );
  const [source, setSource] = useState<
    "override" | "firestore" | "empty" | "error"
  >(() =>
    override
      ? "override"
      : peeked && (peeked.rosterHome || peeked.rosterAway)
        ? "firestore"
        : "empty"
  );
  const [readyScope, setReadyScope] = useState<string | null>(() =>
    override || peekedRoster ? scopeKey : null
  );

  useEffect(() => {
    if (override) {
      setRoster(override);
      setSource("override");
      setReadyScope(scopeKey);
      return;
    }
    if (!enabled) return;
    if (!homeTeamId || !awayTeamId) {
      setRoster(null);
      setSource("empty");
      setReadyScope(scopeKey);
      return;
    }

    const hit = peekMatchupDetailBundle(fetchOpts);
    if (hit) {
      const built =
        hit.roster ??
        buildMatchupRosterReport(
          homeTeamId,
          awayTeamId,
          hit.rosterHome,
          hit.rosterAway
        );
      setRoster(built);
      setSource(
        built && (hit.rosterHome || hit.rosterAway) ? "firestore" : "empty"
      );
      setReadyScope(scopeKey);
      return;
    }

    let cancelled = false;
    fetchMatchupDetailBundle(fetchOpts)
      .then((payload) => {
        if (cancelled) return;
        const built =
          payload.roster ??
          buildMatchupRosterReport(
            homeTeamId,
            awayTeamId,
            payload.rosterHome,
            payload.rosterAway
          );
        setRoster(built);
        setSource(
          built && (payload.rosterHome || payload.rosterAway)
            ? "firestore"
            : "empty"
        );
      })
      .catch(() => {
        if (cancelled) return;
        setRoster(null);
        setSource("error");
      })
      .finally(() => {
        if (!cancelled) setReadyScope(scopeKey);
      });

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    homeTeamId,
    awayTeamId,
    season,
    apiBaseUrl,
    override,
    scopeKey,
  ]);

  const resolved = override ?? roster ?? peekedRoster;
  const loading = Boolean(want && !resolved && readyScope !== scopeKey);

  return { roster: resolved, loading, source };
}
