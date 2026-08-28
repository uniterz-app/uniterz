/**
 * SCHEDULE 行（移動・休養・連戦・開幕）。
 */
import type { ProBriefLineItem } from "@/lib/predict/predictProBrief";
import type { ProBriefPhase } from "@/lib/predict/predictProBrief";
import {
  proBriefTravelLines,
  travelSummaryForBrief,
} from "@/lib/predict/nbaProBriefTravel";
import type { NbaTravelStop } from "@/lib/nba/nbaArenaTravel";

const DAY_MS = 24 * 60 * 60 * 1000;

export type TeamScheduleInput = {
  teamId: string;
  isHome: boolean;
  tonightVenueTeamId: string;
  tonightStartAtMs: number;
  /** 今夜より前の試合（新しい順でも古い順でも可） */
  priorGames: Array<{
    startAtMs: number;
    venueTeamId: string;
    isHome: boolean;
    overtime?: boolean;
  }>;
  /** 相手チームの休養日数（差を出す用） */
  opponentRestDays: number | null;
  phase: ProBriefPhase;
};

function restDaysBefore(
  tipAtMs: number,
  priorStartAtMs: number | null
): number | null {
  if (priorStartAtMs == null || priorStartAtMs <= 0) return null;
  const gap = tipAtMs - priorStartAtMs;
  if (gap < 0) return null;
  return Math.floor(gap / DAY_MS);
}

function countStreak(
  prior: TeamScheduleInput["priorGames"],
  home: boolean
): number {
  let n = 0;
  const sorted = [...prior].sort((a, b) => b.startAtMs - a.startAtMs);
  for (const g of sorted) {
    if (g.isHome !== home) break;
    n += 1;
  }
  return n;
}

function countInWindow(
  prior: TeamScheduleInput["priorGames"],
  tipAtMs: number,
  windowDays: number
): number {
  const from = tipAtMs - windowDays * DAY_MS;
  return prior.filter((g) => g.startAtMs >= from && g.startAtMs < tipAtMs).length;
}

export function computeRestDays(input: {
  tipAtMs: number;
  priorGames: TeamScheduleInput["priorGames"];
}): number | null {
  const last = [...input.priorGames].sort((a, b) => b.startAtMs - a.startAtMs)[0];
  return restDaysBefore(input.tipAtMs, last?.startAtMs ?? null);
}

export function buildScheduleLinesForTeam(
  input: TeamScheduleInput
): ProBriefLineItem[] {
  const lines: ProBriefLineItem[] = [];
  const priorSorted = [...input.priorGames].sort(
    (a, b) => a.startAtMs - b.startAtMs
  );
  const rest = computeRestDays({
    tipAtMs: input.tonightStartAtMs,
    priorGames: input.priorGames,
  });

  if (input.phase === "opening") {
    if (rest != null && rest >= 2) {
      lines.push({
        textJa: `開幕戦 · 休養十分（プレ最終から ${rest}日）`,
        textEn: `Opener · ${rest} days rest after last preseason`,
      });
    } else {
      lines.push({
        textJa: "開幕戦",
        textEn: "Season opener",
      });
    }
  } else if (rest === 0) {
    const oppRest = input.opponentRestDays;
    if (oppRest != null && oppRest >= 2) {
      lines.push({
        textJa: `B2B · 相手は休養 ${oppRest}日`,
        textEn: `B2B · opponent has ${oppRest} days rest`,
      });
    } else if (input.isHome) {
      lines.push({
        textJa: "ホーム Back-to-Back",
        textEn: "Home back-to-back",
      });
    } else {
      lines.push({ textJa: "B2B", textEn: "Back-to-back" });
    }
  } else if (rest != null && rest >= 2) {
    lines.push({
      textJa: `休養 ${rest}日`,
      textEn: `${rest} days rest`,
    });
  }

  const in4 = countInWindow(input.priorGames, input.tonightStartAtMs, 4);
  // 今夜を含めると in4+1
  if (in4 + 1 >= 3) {
    lines.push({
      textJa: "4日で3試合目",
      textEn: "3rd game in 4 days",
    });
  }
  const in6 = countInWindow(input.priorGames, input.tonightStartAtMs, 6);
  if (in6 + 1 >= 4 && in4 + 1 < 3) {
    lines.push({
      textJa: "6日で4試合目",
      textEn: "4th game in 6 days",
    });
  }

  const homeStreak = countStreak(input.priorGames, true);
  const awayStreak = countStreak(input.priorGames, false);
  if (input.isHome && homeStreak + 1 >= 3) {
    lines.push({
      textJa: `ホーム連戦 ${homeStreak + 1}試合目`,
      textEn: `Home stand game ${homeStreak + 1}`,
    });
  }
  if (!input.isHome && awayStreak + 1 >= 3) {
    lines.push({
      textJa: `アウェイ連戦 ${awayStreak + 1}試合目`,
      textEn: `Road trip game ${awayStreak + 1}`,
    });
  }

  if (input.tonightVenueTeamId === "nba-nuggets" && !input.isHome) {
    lines.push({
      textJa: "高地 · DEN",
      textEn: "Altitude · DEN",
    });
  }

  const last = [...input.priorGames].sort((a, b) => b.startAtMs - a.startAtMs)[0];
  if (last?.overtime) {
    lines.push({
      textJa: "前試合は延長戦後",
      textEn: "Coming off overtime",
    });
  }

  const recentStops: NbaTravelStop[] = priorSorted
    .slice(-4)
    .map((g) => ({
      venueTeamId: g.venueTeamId,
      startAtMs: g.startAtMs,
    }));
  const travel = travelSummaryForBrief({
    teamId: input.teamId,
    tonightVenueTeamId: input.tonightVenueTeamId,
    tonightStartAtMs: input.tonightStartAtMs,
    recentStops,
  });
  lines.push(
    ...proBriefTravelLines(travel, {
      homeNoTravel: input.isHome,
    })
  );

  // 重複除去（同じ textJa）
  const seen = new Set<string>();
  const deduped: ProBriefLineItem[] = [];
  for (const line of lines) {
    if (seen.has(line.textJa)) continue;
    seen.add(line.textJa);
    deduped.push(line);
  }
  return deduped.slice(0, 3);
}
