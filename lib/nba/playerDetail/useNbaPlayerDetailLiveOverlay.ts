"use client";

/**
 * プレイヤー詳細の ROSTER / INJURY / CONTRACT / CAREER / GAME LOGS / SHOT ZONES を実データで上書き。
 * 契約は BDL 複数年（/api/nba/player-contract）。未取得時は NO DATA
 * （ペイロール1行フォールバックは「残り1年」に見えるため使わない）。
 * roster は player=、injury は team= スコープ。
 */
import { useEffect, useMemo, useState } from "react";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { fetchPlayerRosterHit } from "@/lib/nba/teamRosters/fetchTeamRostersClient";
import { fetchTeamInjuries } from "@/lib/nba/teamInjuries/fetchTeamInjuriesClient";
import { fetchPlayerContract } from "@/lib/nba/playerDetail/fetchPlayerContractClient";
import { fetchPlayerCareerSeasons } from "@/lib/nba/playerDetail/fetchPlayerCareerSeasonsClient";
import { fetchPlayerGameLogs } from "@/lib/nba/playerDetail/fetchPlayerGameLogsClient";
import { fetchPlayerShotZones } from "@/lib/nba/playerDetail/fetchPlayerShotZonesClient";
import { overlayPlayerDetailWithLeaders } from "@/lib/nba/sliceNbaPlayerFromLeaders";
import type { NbaPlayerDetailPreview } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import type { NbaPlayerContractSummary } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import type { NbaPlayerStatLeadersBundle } from "@/lib/predict/nbaPlayerStatLeadersMocks";
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import {
  applyCuratedPlayerAwardsToPlayerDetail,
  applyInjuryToPlayerDetail,
  applyPlayerCareerSeasonsToPlayerDetail,
  applyPlayerContractToPlayerDetail,
  applyPlayerGameLogsToPlayerDetail,
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

type Settled<T> = { ok: true; value: T } | { ok: false };

function wrap<T>(p: Promise<T>): Promise<Settled<T>> {
  return p
    .then((value) => ({ ok: true as const, value }))
    .catch(() => ({ ok: false as const }));
}

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

  const [rosterHit, setRosterHit] = useState<PlayerRosterHit | null>(null);
  const [averagesSeasonKey, setAveragesSeasonKey] = useState<string | null>(
    null
  );
  const [injury, setInjury] = useState<NbaTeamInjuryEntry | null>(null);
  const [contract, setContract] = useState<NbaPlayerContractSummary | null>(
    null
  );
  const [careerSeasons, setCareerSeasons] = useState<
    NbaPlayerDetailPreview["careerSeasons"] | null
  >(null);
  const [gameLogs, setGameLogs] = useState<
    NbaPlayerDetailPreview["gameLogs"] | null
  >(null);
  const [shotZones, setShotZones] = useState<
    NbaPlayerDetailPreview["shotZones"] | null
  >(null);
  const [rosterFailed, setRosterFailed] = useState(false);
  const [injuryFailed, setInjuryFailed] = useState(false);
  const [loading, setLoading] = useState(!!playerId);

  useEffect(() => {
    if (!playerId) {
      setRosterHit(null);
      setAveragesSeasonKey(null);
      setInjury(null);
      setContract(null);
      setCareerSeasons(null);
      setGameLogs(null);
      setShotZones(null);
      setRosterFailed(false);
      setInjuryFailed(false);
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    setRosterFailed(false);
    setInjuryFailed(false);

    void (async () => {
      try {
      const roster = await wrap(
        fetchPlayerRosterHit({
          playerId,
          season,
          apiBaseUrl,
          signal: ac.signal,
        }).then((payload) => ({
          hit: payload.hit
            ? {
                teamId: payload.hit.teamId,
                teamName: payload.hit.teamName,
                player: payload.hit.player,
              }
            : null,
          averagesSeasonKey: payload.averagesSeasonKey,
        }))
      );
      if (ac.signal.aborted) return;

      const hit = roster.ok ? roster.value.hit : null;
      setRosterHit(hit);
      setAveragesSeasonKey(
        roster.ok ? roster.value.averagesSeasonKey || null : null
      );
      setRosterFailed(!roster.ok);

      const teamId = hit?.teamId || base.teamId || "";

      const [inj, con, career, logs, zones] = await Promise.all([
        teamId
          ? wrap(
              fetchTeamInjuries({
                teamId,
                season,
                apiBaseUrl,
                signal: ac.signal,
              })
            )
          : Promise.resolve({ ok: false as const }),
        wrap(
          fetchPlayerContract({
            playerId,
            season,
            apiBaseUrl,
            teamId: teamId || null,
            signal: ac.signal,
          })
        ),
        wrap(
          fetchPlayerCareerSeasons({
            playerId,
            season,
            apiBaseUrl,
            teamId: teamId || null,
            position: hit?.player.position || base.position || null,
            signal: ac.signal,
          })
        ),
        wrap(
          fetchPlayerGameLogs({
            playerId,
            season,
            apiBaseUrl,
            teamId: teamId || null,
            signal: ac.signal,
          })
        ),
        wrap(
          fetchPlayerShotZones({
            playerId,
            season,
            apiBaseUrl,
            teamId: teamId || null,
            signal: ac.signal,
          })
        ),
      ]);

      if (ac.signal.aborted) return;

      setInjuryFailed(Boolean(teamId) && !inj.ok);

      if (con.ok && con.value.contract) {
        setContract(con.value.contract);
      } else {
        setContract(null);
      }

      if (career.ok) {
        setCareerSeasons(career.value.careerSeasons);
      } else {
        setCareerSeasons(null);
      }

      if (logs.ok) {
        setGameLogs(logs.value.gameLogs);
      } else {
        setGameLogs(null);
      }

      if (zones.ok) {
        setShotZones(zones.value.shotZones);
      } else {
        setShotZones(null);
      }

      if (hit && inj.ok) {
        const entries = inj.value.injuries ?? [];
        setInjury(
          entries.find((e) => String(e.playerId) === playerId) ?? null
        );
      } else {
        setInjury(null);
      }
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [playerId, season, apiBaseUrl, base.teamId, base.position]);

  const detail = useMemo((): NbaPlayerDetailPreview => {
    let next = base;
    if (rosterHit) next = applyRosterToPlayerDetail(next, rosterHit);
    if (contract) {
      next = applyPlayerContractToPlayerDetail(next, contract);
    }
    if (careerSeasons) {
      next = applyPlayerCareerSeasonsToPlayerDetail(next, careerSeasons);
    }
    if (gameLogs) {
      next = applyPlayerGameLogsToPlayerDetail(next, gameLogs);
    }
    if (shotZones) {
      next = applyPlayerShotZonesToPlayerDetail(next, shotZones);
    }
    next = applyInjuryToPlayerDetail(next, injury);
    next = overlayPlayerDetailWithLeaders(next, leaders);
    next = applyCuratedPlayerAwardsToPlayerDetail(next, playerId);
    // シーズン平均の季ラベルはロスター averages を正（開幕前は 25-26 など）
    if (averagesSeasonKey) {
      next = { ...next, asOfLabel: averagesSeasonKey };
    }
    return next;
  }, [
    base,
    playerId,
    rosterHit,
    averagesSeasonKey,
    injury,
    contract,
    careerSeasons,
    gameLogs,
    shotZones,
    leaders,
  ]);

  return {
    detail,
    loading,
    hasFetchError: rosterFailed || injuryFailed,
  };
}
