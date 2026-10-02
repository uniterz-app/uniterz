/**
 * Pro Insight SCHEDULE の移動行。長い今夜の移動と、かなり動いた 2日合計だけ。
 */

import type { ProBriefLineItem } from "@/lib/predict/predictProBrief";
import { proBriefLine } from "@/lib/predict/predictProBrief";
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
    const hop = `${from}→${to}`;
    lines.push(
      proBriefLine({
        ja: `${hop} · 移動距離 ${km}`,
        en: `${hop} · Travel ${km}`,
        ko: `${hop} · 이동 거리 ${km}`,
        zh: `${hop} · 移动距离 ${km}`,
        es: `${hop} · Viaje ${km}`,
        pt: `${hop} · Viagem ${km}`,
        fr: `${hop} · Trajet ${km}`,
      })
    );
  }

  if (shouldShowTwoDayTravel(summary)) {
    const km = formatTravelKm(summary.windowKm);
    lines.push(
      proBriefLine({
        ja: `48時間 · 移動距離 ${km}`,
        en: `48h · Travel ${km}`,
        ko: `48시간 · 이동 거리 ${km}`,
        zh: `48 小时 · 移动距离 ${km}`,
        es: `48 h · Viaje ${km}`,
        pt: `48 h · Viagem ${km}`,
        fr: `48 h · Trajet ${km}`,
      })
    );
  }

  if (
    lines.length === 0 &&
    options?.homeNoTravel &&
    summary.isHomeTonight
  ) {
    lines.push(
      proBriefLine({
        ja: "ホーム · 移動なし",
        en: "Home · no travel",
        ko: "홈 · 이동 없음",
        zh: "主场 · 无需移动",
        es: "En casa · sin viaje",
        pt: "Em casa · sem viagem",
        fr: "À domicile · sans trajet",
      })
    );
  }

  return lines;
}
