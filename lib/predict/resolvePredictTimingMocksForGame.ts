/**
 * NBA 予想オーバーレイ — プレビュー mock を任意の対戦カードに当てはめる。
 * API 接続前の Native / Web 共通フォールバック。
 */

import { injuryReportForPreset } from "@/lib/predict/nbaInjuryReportPreviewMocks";
import { rosterForPreset } from "@/lib/predict/nbaRosterPreviewMocks";
import { teamStatsForPreset } from "@/lib/predict/nbaTeamStatsPreviewMocks";
import type { PredictProBrief } from "@/lib/predict/predictProBrief";
import type { NbaInjuryReport } from "@/lib/predict/nbaInjuryReport";
import type { NbaRosterReport } from "@/lib/predict/nbaRoster";
import type { NbaTeamStatsBundle } from "@/lib/predict/nbaTeamStatsPreviewMocks";
import { PREDICT_TIMING_PREVIEW_PRESETS } from "@/lib/predict/predictTimingPreviewMocks";

export type PredictTimingMarketBand = {
  homePct: number;
  awayPct: number;
  drawPct?: number;
  bandN: number;
};

export type PredictTimingMocksForGame = {
  presetId: string;
  proBrief: PredictProBrief;
  injuryReport: NbaInjuryReport;
  teamStats: NbaTeamStatsBundle;
  roster: NbaRosterReport;
  marketBand: PredictTimingMarketBand | null;
};

const DEFAULT_PRESET_ID = "both-teams-rich";

function patchInjuryReport(
  report: NbaInjuryReport,
  homeTeamId: string,
  awayTeamId: string,
  homeTeamName: string,
  awayTeamName: string
): NbaInjuryReport {
  return {
    ...report,
    home: {
      ...report.home,
      teamId: homeTeamId,
      teamName: homeTeamName,
      side: "home",
    },
    away: {
      ...report.away,
      teamId: awayTeamId,
      teamName: awayTeamName,
      side: "away",
    },
  };
}

/** 対戦カード向けにプレビュー mock を解決（実 API 未接続時） */
export function resolvePredictTimingMocksForGame(input: {
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  presetId?: string;
}): PredictTimingMocksForGame {
  const presetId = input.presetId ?? DEFAULT_PRESET_ID;
  const preset =
    PREDICT_TIMING_PREVIEW_PRESETS.find((p) => p.id === presetId) ??
    PREDICT_TIMING_PREVIEW_PRESETS.find((p) => p.id === DEFAULT_PRESET_ID)!;

  const injuryBase = injuryReportForPreset(preset.id);
  const roster = rosterForPreset(
    preset.id,
    input.homeTeamId,
    input.awayTeamId,
    input.homeTeamName,
    input.awayTeamName
  );

  return {
    presetId: preset.id,
    proBrief: preset.proBrief,
    injuryReport: patchInjuryReport(
      injuryBase,
      input.homeTeamId,
      input.awayTeamId,
      input.homeTeamName,
      input.awayTeamName
    ),
    teamStats: teamStatsForPreset(preset.id),
    roster,
    marketBand: preset.market?.band
      ? {
          homePct: preset.market.band.homePct,
          awayPct: preset.market.band.awayPct,
          drawPct: preset.market.band.drawPct,
          bandN: preset.market.band.bandN ?? 0,
        }
      : null,
  };
}
