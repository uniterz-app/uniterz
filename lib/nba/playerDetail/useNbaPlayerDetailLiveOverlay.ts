"use client";

/**
 * プレイヤー詳細を `/api/nba/player-detail` 1本で上書き。
 * 契約は複数年スナップショット。未取得時は NO DATA。
 * アワードは curated（手動）。
 */
import { useEffect, useMemo, useState } from "react";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { fetchPlayerDetailBundle } from "@/lib/nba/playerDetail/fetchPlayerDetailClient";
import { overlayPlayerDetailWithLeaders } from "@/lib/nba/sliceNbaPlayerFromLeaders";
import type { NbaPlayerDetailPreview } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import type { NbaPlayerStatLeadersBundle } from "@/lib/predict/nbaPlayerStatLeadersMocks";
import type { NbaPlayerDetailApiPayload } from "@/lib/nba/playerDetail/loadPlayerDetailBundle";
import {
  applyCuratedPlayerAwardsToPlayerDetail,
  applyInjuryToPlayerDetail,
  applyPlayerCareerSeasonsToPlayerDetail,
  applyPlayerContractToPlayerDetail,
  applyPlayerGameLogsToPlayerDetail,
  applyPlayerSeasonMetricsToPlayerDetail,
  applyPlayerShotZonesToPlayerDetail,
  applyRosterToPlayerDetail,
  type PlayerRosterHit,
} from "@/lib/nba/playerDetail/applyPlayerDetailLiveSlices";

type Options = {
  playerId?: string;
  /** Native: getUniterzApiBaseUrl() */
  apiBaseUrl?: string | null;
  season?: string;
  base: NbaPlayerDetailPreview;
  leaders: NbaPlayerStatLeadersBundle;
};

export function useNbaPlayerDetailLiveOverlay(options: Options): {
  detail: NbaPlayerDetailPreview;
  loading: boolean;
  hasFetchError: boolean;
} {
  const playerId = (options.playerId ?? options.base.playerId).trim();
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const apiBaseUrl = options.apiBaseUrl;
  const base = options.base;
  const leaders = options.leaders;

  const [bundle, setBundle] = useState<NbaPlayerDetailApiPayload | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(!!playerId);

  useEffect(() => {
    if (!playerId) {
      setBundle(null);
      setFailed(false);
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    setFailed(false);

    void (async () => {
      try {
        const payload = await fetchPlayerDetailBundle({
          playerId,
          season,
          apiBaseUrl,
          signal: ac.signal,
        });
        if (ac.signal.aborted) return;
        setBundle(payload);
      } catch {
        if (ac.signal.aborted) return;
        setBundle(null);
        setFailed(true);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [playerId, season, apiBaseUrl]);

  const detail = useMemo((): NbaPlayerDetailPreview => {
    let next = base;
    if (!bundle) {
      next = overlayPlayerDetailWithLeaders(next, leaders);
      next = applyCuratedPlayerAwardsToPlayerDetail(next, playerId);
      return next;
    }

    const hit: PlayerRosterHit | null = bundle.roster.hit
      ? {
          teamId: bundle.roster.hit.teamId,
          teamName: bundle.roster.hit.teamName,
          player: bundle.roster.hit.player,
        }
      : null;

    if (hit) next = applyRosterToPlayerDetail(next, hit);
    if (bundle.contract.contract) {
      next = applyPlayerContractToPlayerDetail(next, bundle.contract.contract);
    }
    if (bundle.careerSeasons.careerSeasons) {
      next = applyPlayerCareerSeasonsToPlayerDetail(
        next,
        bundle.careerSeasons.careerSeasons
      );
    }
    if (bundle.gameLogs.gameLogs?.length) {
      next = applyPlayerGameLogsToPlayerDetail(next, bundle.gameLogs.gameLogs);
    }
    if (bundle.shotZones.shotZones?.length) {
      next = applyPlayerShotZonesToPlayerDetail(next, bundle.shotZones.shotZones);
    }

    const injuryEntry =
      bundle.injury?.injuries?.find((e) => String(e.playerId) === playerId) ??
      null;
    next = applyInjuryToPlayerDetail(next, injuryEntry);

    next = overlayPlayerDetailWithLeaders(next, leaders);
    next = applyPlayerSeasonMetricsToPlayerDetail(
      next,
      bundle.seasonMetrics.metrics,
      bundle.seasonMetrics.gamesPlayed
    );
    next = applyCuratedPlayerAwardsToPlayerDetail(next, playerId);

    if (bundle.roster.averagesSeasonKey) {
      next = { ...next, asOfLabel: bundle.roster.averagesSeasonKey };
    }
    return next;
  }, [base, playerId, bundle, leaders]);

  return {
    detail,
    loading,
    hasFetchError: failed,
  };
}
