"use client";

import { useEffect, useState } from "react";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { buildMatchupRosterReport } from "@/lib/nba/teamRosters/buildMatchupRosterReport";
import { fetchMatchupRoster } from "@/lib/nba/teamRosters/fetchTeamRostersClient";
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
 * 予想 ROSTER: Firestore のアクティブロスターを優先。
 * 未 ingest / 失敗時は null（呼び出し側でモックに落とさない想定）。
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

  const [roster, setRoster] = useState<NbaRosterReport | null>(
    override ?? null
  );
  const [loading, setLoading] = useState(
    enabled && !override && !!homeTeamId && !!awayTeamId
  );
  const [source, setSource] = useState<
    "override" | "firestore" | "empty" | "error"
  >(override ? "override" : "empty");

  useEffect(() => {
    if (override) {
      setRoster(override);
      setSource("override");
      setLoading(false);
      return;
    }
    if (!enabled) {
      setLoading(false);
      return;
    }
    if (!homeTeamId || !awayTeamId) {
      setRoster(null);
      setSource("empty");
      setLoading(false);
      return;
    }

    const ac = new AbortController();
    setLoading(true);
    fetchMatchupRoster({
      homeTeamId,
      awayTeamId,
      season,
      apiBaseUrl,
      signal: ac.signal,
    })
      .then((payload) => {
        const built = buildMatchupRosterReport(
          homeTeamId,
          awayTeamId,
          payload.home,
          payload.away
        );
        setRoster(built);
        setSource(
          built && (payload.home || payload.away) ? "firestore" : "empty"
        );
      })
      .catch(() => {
        setRoster(null);
        setSource("error");
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [enabled, homeTeamId, awayTeamId, season, apiBaseUrl, override]);

  return { roster, loading, source };
}
