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
import { fetchNbaConferenceStandings } from "@/lib/nba/standings/fetchNbaConferenceStandingsClient";
import { findNbaConferenceStandingsRow } from "@/lib/nba/standings/findNbaConferenceStandingsRow";
import { applyStandingsToTeamDetailPreview } from "@/lib/nba/teamDetail/applyStandingsToTeamDetailPreview";
import { applyTeamGameLogToTeamDetailPreview } from "@/lib/nba/teamDetail/applyTeamGameLogToTeamDetailPreview";
import type {
  NbaTeamDetailPreview,
  NbaTeamInjuryEntry,
  NbaTeamPayroll,
} from "@/lib/predict/nbaTeamDetailPreviewMocks";
import type { NbaConferenceStandingsRow } from "@/lib/nba/nbaConferenceStandings";
import type { NbaTeamGameLogSlice } from "@/lib/nba/teamGameLog/teamGameLogTypes";
import type { NbaRosterTeamBlock } from "@/lib/predict/nbaRoster";
import { fetchTeamAceOutRecord } from "@/lib/nba/detailInsights/fetchTeamAceOutClient";
import type { NbaTeamAceOutRecord } from "@/lib/nba/insights/aceOutRecordTypes";

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
  standings: boolean;
  injuries: boolean;
  strengthSplit: boolean;
  aceOut: boolean;
};

function emptyFailures(): NbaTeamDetailOverlayFailures {
  return {
    roster: false,
    payroll: false,
    gameLog: false,
    standings: false,
    injuries: false,
    strengthSplit: false,
    aceOut: false,
  };
}

/**
 * チーム詳細の live データを公開 API（Firestore スナップショット）で上書き。
 *
 * - **W–L / 順位 / HOME-AWAY / L10 / 連勝** → BDL standings（`/api/nba/standings`）
 * - **直近試合・H2H・vs East/West** → team game logs（`games` 由来）
 * - **指標** → league stats bundle（ベース）+ overlay は触らない
 * - roster / payroll / injuries / strengthSplit / aceOut → 各 team API
 *
 * `teams` コレクションは読まない。
 */
export function useNbaTeamDetailLiveOverlay(options: Options): {
  detail: NbaTeamDetailPreview;
  aceOut: NbaTeamAceOutRecord | null;
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
  const [standingsRow, setStandingsRow] =
    useState<NbaConferenceStandingsRow | null>(null);
  const [injuries, setInjuries] = useState<NbaTeamInjuryEntry[] | null>(null);
  const [strengthSplit, setStrengthSplit] =
    useState<NbaTeamStrengthSplit | null>(null);
  const [aceOut, setAceOut] = useState<NbaTeamAceOutRecord | null>(null);
  const [failures, setFailures] =
    useState<NbaTeamDetailOverlayFailures>(emptyFailures);
  const [loading, setLoading] = useState(!!teamId);

  useEffect(() => {
    if (!teamId) {
      setRosterBlock(null);
      setPayroll(null);
      setGameLog(null);
      setStandingsRow(null);
      setInjuries(null);
      setStrengthSplit(null);
      setAceOut(null);
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
        fetchNbaConferenceStandings({
          season,
          apiBaseUrl,
          signal: ac.signal,
        }).then((payload) =>
          findNbaConferenceStandingsRow(payload.board, teamId)
        )
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
      wrap(
        fetchTeamAceOutRecord({
          teamId,
          season,
          apiBaseUrl,
          signal: ac.signal,
        })
      ),
    ])
      .then(([roster, pay, log, standings, inj, strength, ace]) => {
        if (ac.signal.aborted) return;
        setRosterBlock(roster.ok ? roster.value : null);
        setPayroll(pay.ok ? pay.value : null);
        setGameLog(log.ok ? log.value : null);
        setStandingsRow(standings.ok ? standings.value : null);
        setInjuries(inj.ok ? inj.value : null);
        setStrengthSplit(strength.ok ? strength.value : null);
        setAceOut(ace.ok ? ace.value : null);
        setFailures({
          roster: !roster.ok,
          payroll: !pay.ok,
          gameLog: !log.ok,
          standings: !standings.ok,
          injuries: !inj.ok,
          strengthSplit: !strength.ok,
          aceOut: !ace.ok,
        });
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [teamId, season, apiBaseUrl]);

  const detail = useMemo((): NbaTeamDetailPreview => {
    let next: NbaTeamDetailPreview = {
      ...base,
      rosterBlock: rosterBlock ?? base.rosterBlock,
      payroll: payroll ?? base.payroll,
      ...(injuries != null ? { injuries } : null),
      ...(strengthSplit != null ? { strengthSplit } : null),
    };

    if (gameLog) {
      next = applyTeamGameLogToTeamDetailPreview(next, gameLog, {
        includeSeasonRecord: standingsRow == null,
      });
    }

    if (standingsRow) {
      next = applyStandingsToTeamDetailPreview(next, standingsRow);
    }

    return next;
  }, [
    base,
    rosterBlock,
    payroll,
    gameLog,
    standingsRow,
    injuries,
    strengthSplit,
  ]);

  const hasFetchError =
    failures.roster ||
    failures.payroll ||
    failures.gameLog ||
    failures.standings ||
    failures.injuries ||
    failures.strengthSplit;

  return { detail, aceOut, loading, failures, hasFetchError };
}
