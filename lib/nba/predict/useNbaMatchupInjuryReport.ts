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

  const [report, setReport] = useState<NbaInjuryReport | null>(
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
      setReport(override);
      setSource("override");
      setLoading(false);
      return;
    }
    if (!enabled) {
      setLoading(false);
      return;
    }
    if (!homeTeamId || !awayTeamId) {
      setReport(null);
      setSource("empty");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    cache
      .load(nbaSnapshotCacheKey(apiBaseUrl, season), () =>
        fetchTeamInjuriesSnapshot({ season, apiBaseUrl })
      )
      .then((payload) => {
        if (cancelled) return;
        const homeEntries = payload.bundle.teams[homeTeamId] ?? [];
        const awayEntries = payload.bundle.teams[awayTeamId] ?? [];
        setReport(
          buildMatchupInjuryReport({
            homeTeamId,
            awayTeamId,
            homeEntries,
            awayEntries,
            asOfLabel: payload.updatedAt || null,
            language,
          })
        );
        const any =
          homeEntries.length + awayEntries.length > 0 ||
          payload.source === "firestore";
        setSource(any ? "firestore" : "empty");
      })
      .catch(() => {
        if (cancelled) return;
        setReport(emptyInjuryReport(homeTeamId, awayTeamId));
        setSource("error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, homeTeamId, awayTeamId, season, apiBaseUrl, override, language]);

  return { report, loading, source };
}
