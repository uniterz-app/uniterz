"use client";

import { useEffect, useState } from "react";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { fetchTeamInjuries } from "@/lib/nba/teamInjuries/fetchTeamInjuriesClient";
import { buildMatchupInjuryReport } from "@/lib/nba/predict/buildMatchupInjuryReport";
import type { NbaInjuryReport } from "@/lib/predict/nbaInjuryReport";
import { emptyInjuryReport } from "@/lib/predict/nbaInjuryReportPreviewMocks";

type Options = {
  homeTeamId?: string;
  awayTeamId?: string;
  apiBaseUrl?: string | null;
  season?: string;
  override?: NbaInjuryReport | null;
};

/**
 * 予想 INJURY: 対戦2チームの `/api/nba/team-injuries?team=` を合成。
 * モックには落とさない（未 ingest は空レポート）。
 */
export function useNbaMatchupInjuryReport(options: Options): {
  report: NbaInjuryReport | null;
  loading: boolean;
  source: "override" | "firestore" | "empty" | "error";
} {
  const homeTeamId = options.homeTeamId?.trim() ?? "";
  const awayTeamId = options.awayTeamId?.trim() ?? "";
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const override = options.override;
  const apiBaseUrl = options.apiBaseUrl;

  const [report, setReport] = useState<NbaInjuryReport | null>(
    override ?? null
  );
  const [loading, setLoading] = useState(
    !override && !!homeTeamId && !!awayTeamId
  );
  const [source, setSource] = useState<
    "override" | "firestore" | "empty" | "error"
  >(override ? "override" : "empty");

  useEffect(() => {
    if (override) {
      setReport(override);
      setSource("override");
      setLoading(false);
      return;
    }
    if (!homeTeamId || !awayTeamId) {
      setReport(null);
      setSource("empty");
      setLoading(false);
      return;
    }

    const ac = new AbortController();
    setLoading(true);

    Promise.all([
      fetchTeamInjuries({
        teamId: homeTeamId,
        season,
        apiBaseUrl,
        signal: ac.signal,
      }),
      fetchTeamInjuries({
        teamId: awayTeamId,
        season,
        apiBaseUrl,
        signal: ac.signal,
      }),
    ])
      .then(([home, away]) => {
        if (ac.signal.aborted) return;
        const built = buildMatchupInjuryReport({
          homeTeamId,
          awayTeamId,
          homeEntries: home.injuries ?? [],
          awayEntries: away.injuries ?? [],
          asOfLabel: home.updatedAt || away.updatedAt || null,
        });
        setReport(built);
        const any =
          (home.injuries?.length ?? 0) + (away.injuries?.length ?? 0) > 0 ||
          home.source === "firestore" ||
          away.source === "firestore";
        setSource(any ? "firestore" : "empty");
      })
      .catch(() => {
        if (ac.signal.aborted) return;
        setReport(emptyInjuryReport(homeTeamId, awayTeamId));
        setSource("error");
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [homeTeamId, awayTeamId, season, apiBaseUrl, override]);

  return { report, loading, source };
}
