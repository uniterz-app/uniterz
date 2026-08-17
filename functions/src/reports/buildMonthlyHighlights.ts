// synced from lib/reports/buildMonthlyHighlights.ts — run npm run sync:monthly-report-builders
// 月次レポート「月間ハイライト」— ピックアップ候補から価値の高い最大 3 件。
// docs/pro-subscription-plan.md §6
// functions/src/reports/buildMonthlyHighlights.ts と同期すること。

import type { MonthlyReportHighlight } from "./monthlyReportTypes";

export const MONTHLY_HIGHLIGHTS_LIMIT = 3;
export const MONTHLY_HIGHLIGHT_MIN_STREAK = 3;

export type MonthlyHighlightPostEvent = {
  settledAtMs: number;
  /** JST YYYY-MM-DD */
  dateKey: string;
  points: number;
  isWin: boolean;
  upsetPoints: number;
  home: { teamId: string; abbr: string; score: number };
  away: { teamId: string; abbr: string; score: number };
  myHome: number;
  myAway: number;
};

export type MonthlyHighlightRanks = {
  winRate: number | null;
  goalScorerHits: number | null;
  upset: number | null;
};

type Scored = {
  item: MonthlyReportHighlight;
  value: number;
};

function calcMaxWinStreak(
  events: MonthlyHighlightPostEvent[]
): number {
  const sorted = [...events].sort((a, b) => a.settledAtMs - b.settledAtMs);
  let cur = 0;
  let max = 0;
  for (const e of sorted) {
    if (e.isWin) {
      cur += 1;
      if (cur > max) max = cur;
    } else {
      cur = 0;
    }
  }
  return max;
}

function bestDivisionTop10(
  ranks: MonthlyHighlightRanks | undefined
): Extract<MonthlyReportHighlight, { kind: "divisionTop10" }> | null {
  if (!ranks) return null;
  const cands: { division: "winRate" | "goalScorerHits" | "upset"; rank: number }[] =
    [];
  if (ranks.winRate != null && ranks.winRate >= 1 && ranks.winRate <= 10) {
    cands.push({ division: "winRate", rank: ranks.winRate });
  }
  if (
    ranks.goalScorerHits != null &&
    ranks.goalScorerHits >= 1 &&
    ranks.goalScorerHits <= 10
  ) {
    cands.push({ division: "goalScorerHits", rank: ranks.goalScorerHits });
  }
  if (ranks.upset != null && ranks.upset >= 1 && ranks.upset <= 10) {
    cands.push({ division: "upset", rank: ranks.upset });
  }
  if (cands.length === 0) return null;
  cands.sort((a, b) => a.rank - b.rank);
  const best = cands[0]!;
  return { kind: "divisionTop10", division: best.division, rank: best.rank };
}

/**
 * 月内 posts イベント + 部門順位 → ハイライト最大 limit 件。
 * 種別は重複させず、価値スコア上位を採用。bestPick があれば先頭。
 */
export function buildMonthlyHighlights(
  events: MonthlyHighlightPostEvent[],
  ranks?: MonthlyHighlightRanks,
  opts?: { limit?: number; minStreak?: number }
): MonthlyReportHighlight[] {
  const limit = opts?.limit ?? MONTHLY_HIGHLIGHTS_LIMIT;
  const minStreak = opts?.minStreak ?? MONTHLY_HIGHLIGHT_MIN_STREAK;
  const scored: Scored[] = [];

  if (events.length > 0) {
    let best = events[0]!;
    for (const e of events) {
      if (e.points > best.points) best = e;
    }
    if (best.points > 0) {
      scored.push({
        value: best.points,
        item: {
          kind: "bestPick",
          dateKey: best.dateKey,
          home: best.home,
          away: best.away,
          myHome: best.myHome,
          myAway: best.myAway,
          points: best.points,
        },
      });
    }

    const byDay = new Map<
      string,
      { points: number; wins: number; posts: number }
    >();
    for (const e of events) {
      const d = byDay.get(e.dateKey) ?? { points: 0, wins: 0, posts: 0 };
      d.points += e.points;
      d.posts += 1;
      if (e.isWin) d.wins += 1;
      byDay.set(e.dateKey, d);
    }
    let bestDayKey = "";
    let bestDay = { points: 0, wins: 0, posts: 0 };
    for (const [k, v] of byDay) {
      if (
        v.points > bestDay.points ||
        (v.points === bestDay.points && v.posts > bestDay.posts)
      ) {
        bestDayKey = k;
        bestDay = v;
      }
    }
    if (bestDayKey && bestDay.points > 0) {
      scored.push({
        value: bestDay.points * 0.85,
        item: {
          kind: "bestDay",
          dateKey: bestDayKey,
          points: bestDay.points,
          wins: bestDay.wins,
          posts: bestDay.posts,
        },
      });
    }

    let bestUpset = events[0]!;
    for (const e of events) {
      if (e.upsetPoints > bestUpset.upsetPoints) bestUpset = e;
    }
    if (bestUpset.upsetPoints > 0) {
      scored.push({
        value: bestUpset.upsetPoints * 1.2,
        item: {
          kind: "upset",
          dateKey: bestUpset.dateKey,
          label: `${bestUpset.away.abbr} @ ${bestUpset.home.abbr}`,
          points: bestUpset.upsetPoints,
        },
      });
    }

    const streak = calcMaxWinStreak(events);
    if (streak >= minStreak) {
      scored.push({
        value: streak * 2.5,
        item: { kind: "winStreak", length: streak },
      });
    }
  }

  const div = bestDivisionTop10(ranks);
  if (div) {
    scored.push({
      value: (11 - div.rank) * 2,
      item: div,
    });
  }

  scored.sort((a, b) => b.value - a.value);
  const picked: MonthlyReportHighlight[] = [];
  const seen = new Set<string>();
  for (const s of scored) {
    if (picked.length >= limit) break;
    if (seen.has(s.item.kind)) continue;
    seen.add(s.item.kind);
    picked.push(s.item);
  }

  // UI は bestPick を先頭に置く
  const bestPick = picked.find((h) => h.kind === "bestPick");
  if (!bestPick) return picked;
  return [bestPick, ...picked.filter((h) => h !== bestPick)];
}
