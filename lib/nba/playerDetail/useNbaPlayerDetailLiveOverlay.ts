"use client";

/**
 * プレイヤー詳細を `/api/nba/player-detail` 1本で上書き。
 * 契約は複数年スナップショット。未取得時は NO DATA。
 * アワードは curated（手動）。
 * ロスター外は Hero / Career / Awards / More 向けに識別情報を埋める。
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
  applyOffRosterPlayerToPlayerDetail,
  applyPlayerCareerSeasonsToPlayerDetail,
  applyPlayerContractToPlayerDetail,
  applyPlayerGameLogsToPlayerDetail,
  applyPlayerSeasonMetricsToPlayerDetail,
  applyPlayerShotZonesToPlayerDetail,
  applyRosterToPlayerDetail,
  syncTeamHistoryWithCurrentRoster,
  type PlayerRosterHit,
} from "@/lib/nba/playerDetail/applyPlayerDetailLiveSlices";
import { findPlayerInLeaders } from "@/lib/nba/sliceNbaPlayerFromLeaders";
import { resolveOffRosterPlayerNameFromAwards } from "@/lib/nba/playerDetail/resolveOffRosterPlayerIdentity";

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
    const awardName = resolveOffRosterPlayerNameFromAwards(playerId);
    if (!bundle) {
      const leadersHit = findPlayerInLeaders(leaders, playerId);
      if (!next.teamId?.trim() && (leadersHit || awardName)) {
        next = applyOffRosterPlayerToPlayerDetail(next, {
          fromLeaders: leadersHit
            ? {
                playerName: leadersHit.playerName,
                teamId: leadersHit.teamId,
                conference: leadersHit.conference,
              }
            : null,
          playerName: awardName,
        });
      } else {
        next = overlayPlayerDetailWithLeaders(next, leaders);
      }
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

    if (hit) {
      next = applyRosterToPlayerDetail(next, hit);
    }
    if (bundle.contract.contract) {
      next = applyPlayerContractToPlayerDetail(next, bundle.contract.contract);
    }
    if (bundle.careerSeasons.careerSeasons) {
      next = applyPlayerCareerSeasonsToPlayerDetail(
        next,
        bundle.careerSeasons.careerSeasons,
        bundle.careerSeasons.bio
      );
    }
    if (hit) {
      next = syncTeamHistoryWithCurrentRoster(next, hit);
    } else {
      const leadersHit = findPlayerInLeaders(leaders, playerId);
      const identity = bundle.offRosterIdentity;
      next = applyOffRosterPlayerToPlayerDetail(next, {
        fromLeaders: leadersHit
          ? {
              playerName: leadersHit.playerName,
              teamId: leadersHit.teamId,
              conference: leadersHit.conference,
            }
          : identity
            ? {
                playerName: identity.playerName,
                teamId: identity.teamId,
                conference: identity.conference ?? undefined,
              }
            : null,
        playerName:
          bundle.careerSeasons.playerName ||
          identity?.playerName ||
          awardName,
      });
    }
    if (hit && bundle.gameLogs.gameLogs?.length) {
      next = applyPlayerGameLogsToPlayerDetail(next, bundle.gameLogs.gameLogs);
    }
    if (hit && bundle.shotZones.shotZones?.length) {
      next = applyPlayerShotZonesToPlayerDetail(next, bundle.shotZones.shotZones);
    }

    if (hit) {
      const injuryEntry =
        bundle.injury?.injuries?.find((e) => String(e.playerId) === playerId) ??
        null;
      next = applyInjuryToPlayerDetail(next, injuryEntry);
    }

    // leaders は順位・値のみ。引退勢はシーズン平均を載せない（usage strip 等が復活しない）
    if (hit) {
      next = overlayPlayerDetailWithLeaders(next, leaders);
    } else {
      const leadersHit = findPlayerInLeaders(leaders, playerId);
      if (leadersHit?.playerName && (!next.firstName || next.firstName === "—" || next.firstName === "Player")) {
        const parts = leadersHit.playerName.trim().split(/\s+/).filter(Boolean);
        next = {
          ...next,
          firstName: parts[0] ?? next.firstName,
          lastName:
            parts.length > 1 ? parts.slice(1).join(" ") : next.lastName,
        };
      }
    }
    if (!hit && next.availability.status !== "retired") {
      next = applyOffRosterPlayerToPlayerDetail(next, {
        playerName:
          bundle.careerSeasons.playerName ||
          bundle.offRosterIdentity?.playerName ||
          awardName,
      });
    }
    if (hit) {
      next = applyPlayerSeasonMetricsToPlayerDetail(
        next,
        bundle.seasonMetrics.metrics,
        bundle.seasonMetrics.gamesPlayed
      );
    }
    next = applyCuratedPlayerAwardsToPlayerDetail(next, playerId);

    if (bundle.season) {
      next = { ...next, asOfLabel: bundle.season };
    } else if (bundle.roster.averagesSeasonKey) {
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
