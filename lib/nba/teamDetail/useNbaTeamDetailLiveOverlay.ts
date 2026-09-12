"use client";

import { useEffect, useMemo, useState } from "react";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { fetchTeamDetailBundle } from "@/lib/nba/teamDetail/fetchTeamDetailClient";
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
import type { NbaTeamAceOutRecord } from "@/lib/nba/insights/aceOutRecordTypes";
import type { NbaTeamStrengthSplit } from "@/lib/nba/insights/fetchTeamStrengthSplitClient";
import type { NbaTeamDetailShapeEdges } from "@/lib/nba/teamShapes/fetchTeamShapeEdgesClient";

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
  shapeEdges: boolean;
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
    shapeEdges: false,
  };
}

/**
 * チーム詳細の live データを公開 API（Firestore スナップショット）で上書き。
 *
 * **1 fetch:** `GET /api/nba/team-detail`（player-detail と同型の合成）。
 * リーグ表指標は `useLeagueTeamStatsBundle`（別・共有キャッシュ）のまま。
 */
export function useNbaTeamDetailLiveOverlay(options: Options): {
  detail: NbaTeamDetailPreview;
  aceOut: NbaTeamAceOutRecord | null;
  shapeEdges: NbaTeamDetailShapeEdges | null;
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
  const [shapeEdges, setShapeEdges] =
    useState<NbaTeamDetailShapeEdges | null>(null);
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
      setShapeEdges(null);
      setFailures(emptyFailures());
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setFailures(emptyFailures());

    void fetchTeamDetailBundle({
      teamId,
      season,
      apiBaseUrl,
    })
      .then((payload) => {
        if (cancelled) return;
        setRosterBlock(payload.rosterBlock);
        setPayroll(payload.payroll);
        setGameLog(payload.gameLog);
        setStandingsRow(payload.standingsRow);
        setInjuries(payload.injuries);
        setStrengthSplit(payload.strengthSplit);
        setAceOut(payload.aceOut);
        setShapeEdges(payload.shapeEdges);
        setFailures(emptyFailures());
      })
      .catch(() => {
        if (cancelled) return;
        setRosterBlock(null);
        setPayroll(null);
        setGameLog(null);
        setStandingsRow(null);
        setInjuries(null);
        setStrengthSplit(null);
        setAceOut(null);
        setShapeEdges(null);
        setFailures({
          roster: true,
          payroll: true,
          gameLog: true,
          standings: true,
          injuries: true,
          strengthSplit: true,
          aceOut: true,
          shapeEdges: true,
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
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

  return { detail, aceOut, shapeEdges, loading, failures, hasFetchError };
}
