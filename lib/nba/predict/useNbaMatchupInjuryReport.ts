"use client";

import { useEffect, useState } from "react";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { fetchTeamInjuriesSnapshot } from "@/lib/nba/teamInjuries/fetchTeamInjuriesClient";
import { buildMatchupInjuryReport } from "@/lib/nba/predict/buildMatchupInjuryReport";
import {
  createSnapshotFetchCache,
  nbaSnapshotCacheKey,
  NBA_SNAPSHOT_CACHE_TTL_MS,
} from "@/lib/nba/snapshotFetchCache";
import type { NbaTeamInjuriesApiPayload } from "@/lib/nba/teamInjuries/teamInjuryTypes";
import type { NbaInjuryReport } from "@/lib/predict/nbaInjuryReport";
import { emptyInjuryReport } from "@/lib/predict/nbaInjuryReportPreviewMocks";

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

/**
 * 予想 INJURY: 対戦2チーム分を合成。
 *
 * `?team=` を2本叩くとサーバーが同じ `nbaTeamInjuries/{season}` を2回読み、
 * CDN のキャッシュキーもチーム毎に散る。リーグ全体スナップショットを
 * 1 回取ってクライアントで切り出す（doc は元々 1 つ）。
 *
 * モックには落とさない（未 ingest は空レポート）。
 */
const cache = createSnapshotFetchCache<NbaTeamInjuriesApiPayload>(
  NBA_SNAPSHOT_CACHE_TTL_MS
);

function reportFromPayload(
  payload: NbaTeamInjuriesApiPayload,
  homeTeamId: string,
  awayTeamId: string,
  language: "ja" | "en"
): NbaInjuryReport {
  const homeEntries = payload.bundle.teams[homeTeamId] ?? [];
  const awayEntries = payload.bundle.teams[awayTeamId] ?? [];
  return buildMatchupInjuryReport({
    homeTeamId,
    awayTeamId,
    homeEntries,
    awayEntries,
    asOfLabel: payload.updatedAt || null,
    language,
  });
}

function sourceFromPayload(
  payload: NbaTeamInjuriesApiPayload,
  homeTeamId: string,
  awayTeamId: string
): "firestore" | "empty" {
  const homeEntries = payload.bundle.teams[homeTeamId] ?? [];
  const awayEntries = payload.bundle.teams[awayTeamId] ?? [];
  const any =
    homeEntries.length + awayEntries.length > 0 ||
    payload.source === "firestore";
  return any ? "firestore" : "empty";
}

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
  const key = nbaSnapshotCacheKey(apiBaseUrl, season);
  const peeked = want ? cache.peek(key) : null;
  const peekedReport =
    peeked && homeTeamId && awayTeamId
      ? reportFromPayload(peeked, homeTeamId, awayTeamId, language)
      : null;
  const scopeKey = `${key}|${homeTeamId}|${awayTeamId}|${language}`;

  const [report, setReport] = useState<NbaInjuryReport | null>(
    () => override ?? peekedReport
  );
  const [source, setSource] = useState<
    "override" | "firestore" | "empty" | "error"
  >(() =>
    override
      ? "override"
      : peeked
        ? sourceFromPayload(peeked, homeTeamId, awayTeamId)
        : "empty"
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
    if (!enabled) {
      return;
    }
    if (!homeTeamId || !awayTeamId) {
      setReport(null);
      setSource("empty");
      setReadyScope(scopeKey);
      return;
    }

    const hit = cache.peek(key);
    if (hit) {
      setReport(reportFromPayload(hit, homeTeamId, awayTeamId, language));
      setSource(sourceFromPayload(hit, homeTeamId, awayTeamId));
      setReadyScope(scopeKey);
      return;
    }

    let cancelled = false;
    cache
      .load(key, () => fetchTeamInjuriesSnapshot({ season, apiBaseUrl }))
      .then((payload) => {
        if (cancelled) return;
        setReport(
          reportFromPayload(payload, homeTeamId, awayTeamId, language)
        );
        setSource(sourceFromPayload(payload, homeTeamId, awayTeamId));
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
    key,
    scopeKey,
  ]);

  const resolved = override ?? report ?? peekedReport;
  const loading = Boolean(want && !resolved && readyScope !== scopeKey);

  return { report: resolved, loading, source };
}
