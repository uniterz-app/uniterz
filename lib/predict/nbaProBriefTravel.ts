/**
 * Pro Insight SCHEDULE の移動行。長い今夜の移動と、かなり動いた 2日合計だけ。
 */

import type { ProBriefLineItem } from "@/lib/predict/predictProBrief";
import {
  formatTravelKm,
  nbaTravelAbbr,
  shouldShowTonightTravel,
  shouldShowTwoDayTravel,
  summarizeNbaTeamTravel,
  type NbaTeamTravelSummary,
  type NbaTravelStop,
} from "@/lib/nba/nbaArenaTravel";

export function travelSummaryForBrief(input: {
  teamId: string;
  tonightVenueTeamId: string;
  tonightStartAtMs: number;
  recentStops?: NbaTravelStop[];
}): NbaTeamTravelSummary {
  return summarizeNbaTeamTravel(input);
}

export function proBriefTravelLines(
  summary: NbaTeamTravelSummary,
  options?: { homeNoTravel?: boolean }
): ProBriefLineItem[] {
  const lines: ProBriefLineItem[] = [];

  if (shouldShowTonightTravel(summary) && summary.tonightKm != null) {
    const from = nbaTravelAbbr(summary.tonightFromId ?? "");
    const to = nbaTravelAbbr(summary.tonightToId);
    const km = formatTravelKm(summary.tonightKm);
    const hopJa = `${from}→${to} · 移動距離 ${km}`;
    const hopEn = `${from}→${to} · Travel ${km}`;
    lines.push({ textJa: hopJa, textEn: hopEn });
  }

  if (shouldShowTwoDayTravel(summary)) {
    const km = formatTravelKm(summary.windowKm);
    lines.push({
      textJa: `48時間 · 移動距離 ${km}`,
      textEn: `48h · Travel ${km}`,
    });
  }

  if (
    lines.length === 0 &&
    options?.homeNoTravel &&
    summary.isHomeTonight
  ) {
    lines.push({
      textJa: "ホーム · 移動なし",
      textEn: "Home · no travel",
    });
  }

  return lines;
}
