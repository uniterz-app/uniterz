"use client";

import { useEffect, useState } from "react";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  fetchMatchupDetailBundle,
  peekMatchupDetailBundle,
} from "@/lib/nba/predict/fetchMatchupDetailClient";
import { buildMatchupInjuryReport } from "@/lib/nba/predict/buildMatchupInjuryReport";
import type { NbaInjuryReport } from "@/lib/predict/nbaInjuryReport";
import { emptyInjuryReport } from "@/lib/predict/nbaInjuryReportPreviewMocks";
import type { NbaMatchupDetailApiPayload } from "@/lib/nba/predict/loadMatchupDetailBundle";

type Options = {
  homeTeamId?: string;
  awayTeamId?: string;
  apiBaseUrl?: string | null;
  season?: string;
  override?: NbaInjuryReport | null;
  /** false のときは取得しない（未選択タブの先読みを止める） */
  enabled?: boolean;
  language?: "ja" | "en";
};

function reportFromDetail(
  payload: NbaMatchupDetailApiPayload,
  language: "ja" | "en"
): NbaInjuryReport {
  return buildMatchupInjuryReport({
    homeTeamId: payload.homeTeamId,
    awayTeamId: payload.awayTeamId,
    homeEntries: payload.injuryHome,
    awayEntries: payload.injuryAway,
    asOfLabel: payload.injuryUpdatedAt || null,
    language,
  });
}

function sourceFromDetail(
  payload: NbaMatchupDetailApiPayload
): "firestore" | "empty" {
  const any =
    payload.injuryHome.length + payload.injuryAway.length > 0 ||
    payload.source === "firestore";
  return any ? "firestore" : "empty";
}

/**
 * 予想 INJURY: `/api/nba/matchup-detail` 共有キャッシュから切り出し。
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
  const enabled = options.enabled ?? true;
  const language = options.language ?? "en";
  const want = enabled && !override && !!homeTeamId && !!awayTeamId;
  const fetchOpts = { homeTeamId, awayTeamId, season, apiBaseUrl };
  const peeked = want ? peekMatchupDetailBundle(fetchOpts) : null;
  const peekedReport = peeked ? reportFromDetail(peeked, language) : null;
  const scopeKey = `${homeTeamId}|${awayTeamId}|${season}|${language}|injury`;

  const [report, setReport] = useState<NbaInjuryReport | null>(
    () => override ?? peekedReport
  );
  const [source, setSource] = useState<
    "override" | "firestore" | "empty" | "error"
  >(() =>
    override ? "override" : peeked ? sourceFromDetail(peeked) : "empty"
  );
  const [readyScope, setReadyScope] = useState<string | null>(() =>
    override || peekedReport ? scopeKey : null
  );

  useEffect(() => {
    if (override) {
      setReport(override);
      setSource("override");
      setReadyScope(scopeKey);
      return;
    }
    if (!enabled) return;
    if (!homeTeamId || !awayTeamId) {
      setReport(null);
      setSource("empty");
      setReadyScope(scopeKey);
      return;
    }

    const hit = peekMatchupDetailBundle(fetchOpts);
    if (hit) {
      setReport(reportFromDetail(hit, language));
      setSource(sourceFromDetail(hit));
      setReadyScope(scopeKey);
      return;
    }

    let cancelled = false;
    fetchMatchupDetailBundle(fetchOpts)
      .then((payload) => {
        if (cancelled) return;
        setReport(reportFromDetail(payload, language));
        setSource(sourceFromDetail(payload));
      })
      .catch(() => {
        if (cancelled) return;
        setReport(emptyInjuryReport(homeTeamId, awayTeamId));
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
    language,
    scopeKey,
  ]);

  const resolved = override ?? report ?? peekedReport;
  const loading = Boolean(want && !resolved && readyScope !== scopeKey);

  return { report: resolved, loading, source };
}
