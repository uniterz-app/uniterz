/**
 * 1 試合分の Pro Insight を決定論的に生成。
 * 設計正: docs/pro-insight-design.md
 */
import type { PredictProBrief } from "@/lib/predict/predictProBrief";
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import {
  proBriefSampleNote,
  resolveProBriefPhase,
} from "@/lib/nba/insights/proInsightPhases";
import {
  findTeamRow,
  teamGamesPlayed,
} from "@/lib/nba/insights/rankTeamMetrics";
import {
  buildMatchupEdgesForTeam,
  injuryNamesUsedInEdges,
} from "@/lib/nba/insights/buildMatchupEdges";
import {
  buildScheduleLinesForTeam,
  computeRestDays,
  type TeamScheduleInput,
} from "@/lib/nba/insights/buildScheduleLines";
import { buildContextLinesForTeam } from "@/lib/nba/insights/buildContextLines";
import type { NbaTeamSeasonRecordsBundle } from "@/lib/nba/insights/priorSeasonRecordTypes";
import type { NbaTeamAceOutRecordsBundle } from "@/lib/nba/insights/aceOutRecordTypes";

export type GenerateMatchupInsightInput = {
  homeTeamId: string;
  awayTeamId: string;
  tipAtMs: number;
  seasonRows: NbaLeagueTeamStatRow[];
  /** opening 用。無ければ seasonRows を前季扱いフォールバックしない（空配列推奨） */
  priorSeasonRows: NbaLeagueTeamStatRow[] | null;
  /** 前季 games 集計（ホーム/アウェイ・H2H・対.500） */
  priorRecords?: NbaTeamSeasonRecordsBundle | null;
  /** 今季 games 集計 */
  seasonRecords?: NbaTeamSeasonRecordsBundle | null;
  /** opening 用の前季エース欠場 W–L */
  priorAceOutRecords?: NbaTeamAceOutRecordsBundle | null;
  /** early / full 用の今季エース欠場 W–L */
  seasonAceOutRecords?: NbaTeamAceOutRecordsBundle | null;
  homeInjuries: NbaTeamInjuryEntry[];
  awayInjuries: NbaTeamInjuryEntry[];
  homePriorGames: TeamScheduleInput["priorGames"];
  awayPriorGames: TeamScheduleInput["priorGames"];
  homeRecentOppWinPcts?: number[];
  awayRecentOppWinPcts?: number[];
  nowMs?: number;
};

export function generateMatchupInsight(
  input: GenerateMatchupInsightInput
): PredictProBrief {
  const homeRow = findTeamRow(input.seasonRows, input.homeTeamId);
  const awayRow = findTeamRow(input.seasonRows, input.awayTeamId);
  const gamesPlayed = Math.min(
    teamGamesPlayed(homeRow),
    teamGamesPlayed(awayRow)
  );
  // 片方だけ試合数が進んでいる場合は小さい方（開幕直後のズレ）を採用
  const phase = resolveProBriefPhase(gamesPlayed);
  const priorRows =
    phase === "opening" && input.priorSeasonRows && input.priorSeasonRows.length > 0
      ? input.priorSeasonRows
      : null;
  const aceOutRecords =
    phase === "opening"
      ? input.priorAceOutRecords ?? null
      : input.seasonAceOutRecords ?? null;

  const homeRest = computeRestDays({
    tipAtMs: input.tipAtMs,
    priorGames: input.homePriorGames,
  });
  const awayRest = computeRestDays({
    tipAtMs: input.tipAtMs,
    priorGames: input.awayPriorGames,
  });

  const homeEdges = buildMatchupEdgesForTeam({
    phase,
    seasonRows: input.seasonRows,
    priorRows,
    priorRecords: input.priorRecords ?? null,
    seasonRecords: input.seasonRecords ?? null,
    aceOutRecords,
    teamId: input.homeTeamId,
    opponentId: input.awayTeamId,
    isHome: true,
    injuries: input.homeInjuries,
  });
  const awayEdges = buildMatchupEdgesForTeam({
    phase,
    seasonRows: input.seasonRows,
    priorRows,
    priorRecords: input.priorRecords ?? null,
    seasonRecords: input.seasonRecords ?? null,
    aceOutRecords,
    teamId: input.awayTeamId,
    opponentId: input.homeTeamId,
    isHome: false,
    injuries: input.awayInjuries,
  });

  const homeUsed = injuryNamesUsedInEdges(homeEdges);
  const awayUsed = injuryNamesUsedInEdges(awayEdges);

  const homeSchedule = buildScheduleLinesForTeam({
    teamId: input.homeTeamId,
    isHome: true,
    tonightVenueTeamId: input.homeTeamId,
    tonightStartAtMs: input.tipAtMs,
    priorGames: input.homePriorGames,
    opponentRestDays: awayRest,
    phase,
  });
  const awaySchedule = buildScheduleLinesForTeam({
    teamId: input.awayTeamId,
    isHome: false,
    tonightVenueTeamId: input.homeTeamId,
    tonightStartAtMs: input.tipAtMs,
    priorGames: input.awayPriorGames,
    opponentRestDays: homeRest,
    phase,
  });

  const homeContext = buildContextLinesForTeam({
    phase,
    seasonRows: input.seasonRows,
    priorRows,
    priorRecords: input.priorRecords ?? null,
    seasonRecords: input.seasonRecords ?? null,
    aceOutRecords,
    teamId: input.homeTeamId,
    isHome: true,
    injuries: input.homeInjuries,
    injuryNamesUsedInMatchup: homeUsed,
    recentOppWinPcts: input.homeRecentOppWinPcts ?? [],
  });
  const awayContext = buildContextLinesForTeam({
    phase,
    seasonRows: input.seasonRows,
    priorRows,
    priorRecords: input.priorRecords ?? null,
    seasonRecords: input.seasonRecords ?? null,
    aceOutRecords,
    teamId: input.awayTeamId,
    isHome: false,
    injuries: input.awayInjuries,
    injuryNamesUsedInMatchup: awayUsed,
    recentOppWinPcts: input.awayRecentOppWinPcts ?? [],
  });

  const nowMs = input.nowMs ?? Date.now();
  const brief: PredictProBrief = {
    home: {
      edges: homeEdges,
      schedule: homeSchedule,
      context: homeContext,
    },
    away: {
      edges: awayEdges,
      schedule: awaySchedule,
      context: awayContext,
    },
    phase,
    gamesPlayed,
    generatedAtMs: nowMs,
  };

  if (phase === "early") {
    const note = proBriefSampleNote(gamesPlayed);
    brief.sampleNoteJa = note.sampleNoteJa;
    brief.sampleNoteEn = note.sampleNoteEn;
  }

  return brief;
}

/**
 * T-1h: 既存 brief に最新 injury / priorGames を反映した完全版。
 * phase / sampleNote は再計算結果を採用（試合数が変わらない限り同じ）。
 */
export function patchMatchupInsightInjuriesAndSchedule(
  existing: PredictProBrief,
  input: GenerateMatchupInsightInput
): PredictProBrief {
  const regenerated = generateMatchupInsight(input);
  return {
    ...regenerated,
    // phase / sample は再計算結果を採用（試合数が変わらない限り同じ）
    generatedAtMs: existing.generatedAtMs ?? regenerated.generatedAtMs,
    patchedAtMs: input.nowMs ?? Date.now(),
  };
}
