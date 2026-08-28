"use client";

import { useEffect, useMemo, useState } from "react";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { fetchTeamRosterSlice } from "@/lib/nba/teamRosters/fetchTeamRostersClient";
import { buildMatchupRosterReport } from "@/lib/nba/teamRosters/buildMatchupRosterReport";
import { fetchTeamPayroll } from "@/lib/nba/teamPayroll/fetchTeamPayrollClient";
import { fetchTeamGameLog } from "@/lib/nba/teamGameLog/fetchTeamGameLogClient";
import { fetchTeamInjuries } from "@/lib/nba/teamInjuries/fetchTeamInjuriesClient";
import {
  fetchTeamStrengthSplit,
  type NbaTeamStrengthSplit,
} from "@/lib/nba/insights/fetchTeamStrengthSplitClient";
import type { NbaTeamGameLogSlice } from "@/lib/nba/teamGameLog/teamGameLogTypes";
import type { NbaRosterTeamBlock } from "@/lib/predict/nbaRoster";
import type {
  NbaTeamDetailPreview,
  NbaTeamInjuryEntry,
  NbaTeamPayroll,
} from "@/lib/predict/nbaTeamDetailPreviewMocks";

type Options = {
  teamId?: string;
  /** Native: getUniterzApiBaseUrl() */
  apiBaseUrl?: string | null;
  season?: string;
  /** getNbaTeamDetailPreview の結果 */
  base: NbaTeamDetailPreview;
};

export type NbaTeamDetailOverlayFailures = {
  roster: boolean;
  payroll: boolean;
  gameLog: boolean;
  injuries: boolean;
  strengthSplit: boolean;
};

function winPct(wins: number, losses: number): number {
  const n = wins + losses;
  if (n <= 0) return 0;
  return wins / n;
}

function emptyFailures(): NbaTeamDetailOverlayFailures {
  return {
    roster: false,
    payroll: false,
    gameLog: false,
    injuries: false,
    strengthSplit: false,
  };
}

/**
 * チーム詳細の ROSTER / PAYROLL / 試合ログ（form・splits）を Firestore 実データで上書き。
 * 未 ingest・開幕前は base の 0 / 空のまま（モックなし）。
 * W–L / H2H / form は試合ログを正（リーグ先進指標と混ぜない）。
 * vs .500+ / sub-.500 は nbaTeamSeasonRecords を正。
 * roster / injuries は team スコープ API のみ叩く。
 */
export function useNbaTeamDetailLiveOverlay(options: Options): {
  detail: NbaTeamDetailPreview;
  loading: boolean;
  failures: NbaTeamDetailOverlayFailures;
  hasFetchError: boolean;
} {
  const teamId = options.teamId?.trim() || options.base.teamId;
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const apiBaseUrl = options.apiBaseUrl;
  const base = options.base;

  const [rosterBlock, setRosterBlock] = useState<NbaRosterTeamBlock | null>(
    null
  );
  const [payroll, setPayroll] = useState<NbaTeamPayroll | null>(null);
  const [gameLog, setGameLog] = useState<NbaTeamGameLogSlice | null>(null);
  const [injuries, setInjuries] = useState<NbaTeamInjuryEntry[] | null>(null);
  const [strengthSplit, setStrengthSplit] =
    useState<NbaTeamStrengthSplit | null>(null);
  const [failures, setFailures] =
    useState<NbaTeamDetailOverlayFailures>(emptyFailures);
  const [loading, setLoading] = useState(!!teamId);

  useEffect(() => {
    if (!teamId) {
      setRosterBlock(null);
      setPayroll(null);
      setGameLog(null);
      setInjuries(null);
      setStrengthSplit(null);
      setFailures(emptyFailures());
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    setFailures(emptyFailures());

    type Settled<T> = { ok: true; value: T } | { ok: false };

    const wrap = <T,>(p: Promise<T>): Promise<Settled<T>> =>
      p.then((value) => ({ ok: true as const, value })).catch(() => ({
        ok: false as const,
      }));

    Promise.all([
      wrap(
        fetchTeamRosterSlice({
          teamId,
          season,
          apiBaseUrl,
          signal: ac.signal,
        }).then((payload) => {
          const team = payload.team;
          if (!team) return null;
          const report = buildMatchupRosterReport(
            teamId,
            teamId,
            team,
            team
          );
          return report?.home ?? null;
        })
      ),
      wrap(
        fetchTeamPayroll({
          teamId,
          season,
          apiBaseUrl,
          signal: ac.signal,
        }).then((payload) => payload.payroll)
      ),
      wrap(
        fetchTeamGameLog({
          teamId,
          season,
          apiBaseUrl,
          signal: ac.signal,
        }).then((payload) => payload.log)
      ),
      wrap(
        fetchTeamInjuries({
          teamId,
          season,
          apiBaseUrl,
          signal: ac.signal,
        }).then((payload) => payload.injuries)
      ),
      wrap(
        fetchTeamStrengthSplit({
          teamId,
          season,
          apiBaseUrl,
          signal: ac.signal,
        })
      ),
    ])
      .then(([roster, pay, log, inj, strength]) => {
        if (ac.signal.aborted) return;
        setRosterBlock(roster.ok ? roster.value : null);
        setPayroll(pay.ok ? pay.value : null);
        setGameLog(log.ok ? log.value : null);
        setInjuries(inj.ok ? inj.value : null);
        setStrengthSplit(strength.ok ? strength.value : null);
        setFailures({
          roster: !roster.ok,
          payroll: !pay.ok,
          gameLog: !log.ok,
          injuries: !inj.ok,
          strengthSplit: !strength.ok,
        });
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [teamId, season, apiBaseUrl]);

  const detail = useMemo((): NbaTeamDetailPreview => {
    const fromGames = gameLog != null;

    return {
      ...base,
      rosterBlock: rosterBlock ?? base.rosterBlock,
      payroll: payroll ?? base.payroll,
      ...(injuries != null ? { injuries } : null),
      ...(strengthSplit != null ? { strengthSplit } : null),
      ...(fromGames && gameLog
        ? {
            recentGames: gameLog.recentGames,
            upcomingGames: gameLog.upcomingGames,
            last10Record: gameLog.last10Record,
            streak: gameLog.streak,
            homeAwaySplit: gameLog.homeAwaySplit,
            conferenceSplit: gameLog.conferenceSplit,
            season: {
              wins: gameLog.seasonRecord.wins,
              losses: gameLog.seasonRecord.losses,
              winPct: winPct(
                gameLog.seasonRecord.wins,
                gameLog.seasonRecord.losses
              ),
            },
            headToHead: gameLog.headToHead,
          }
        : null),
    };
  }, [base, rosterBlock, payroll, gameLog, injuries, strengthSplit]);

  const hasFetchError =
    failures.roster ||
    failures.payroll ||
    failures.gameLog ||
    failures.injuries ||
    failures.strengthSplit;

  return { detail, loading, failures, hasFetchError };
}
