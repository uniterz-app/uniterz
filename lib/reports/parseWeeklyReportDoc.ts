// 週次レポート Firestore doc の id / パース。

import type { WeeklyReport } from "@/lib/reports/weeklyReportTypes";
import { dateKeyJST } from "@/lib/rankings/rankSnapshotDate";

export function weeklyReportDocId(uid: string, weekLabel: string): string {
  return `${uid}_weekly_${weekLabel}`;
}

/** 直近の月曜 dateKey（JST）。当日が月曜なら当日 */
export function weekStartDateKeyJST(now: Date = new Date()): string {
  const todayKey = dateKeyJST(now);
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const daysSinceMonday = (jst.getUTCDay() + 6) % 7;
  const [y, m, d] = todayKey.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d - daysSinceMonday));
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${base.getUTCFullYear()}-${pad2(base.getUTCMonth() + 1)}-${pad2(base.getUTCDate())}`;
}

function isRival(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.uid === "string" && typeof o.displayName === "string";
}

/** Firestore doc → WeeklyReport。不正なら null */
export function parseWeeklyReportDoc(raw: unknown): WeeklyReport | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if (d.league !== "nba") return null;
  if (typeof d.label !== "string") return null;
  if (d.status !== "live" && d.status !== "final") return null;
  const range = d.range as { startKey?: string; endKey?: string } | undefined;
  if (!range?.startKey || !range?.endKey) return null;
  if (typeof d.rank !== "number" || !Number.isFinite(d.rank)) return null;
  if (typeof d.totalPoints !== "number") return null;
  if (!Array.isArray(d.divisions)) return null;

  return {
    league: "nba",
    label: d.label,
    range: { startKey: range.startKey, endKey: range.endKey },
    status: d.status,
    participantCount: Number(d.participantCount ?? 0) || 0,
    rank: d.rank,
    prevRank: typeof d.prevRank === "number" ? d.prevRank : null,
    rankDeltaPlaces:
      typeof d.rankDeltaPlaces === "number" ? d.rankDeltaPlaces : null,
    topPercent: typeof d.topPercent === "number" ? d.topPercent : null,
    totalPoints: d.totalPoints,
    prevTotalPoints:
      typeof d.prevTotalPoints === "number" ? d.prevTotalPoints : null,
    totalPosts: Number(d.totalPosts ?? 0) || 0,
    totalWins: Number(d.totalWins ?? 0) || 0,
    divisions: d.divisions as WeeklyReport["divisions"],
    overtaken: Array.isArray(d.overtaken)
      ? (d.overtaken.filter(isRival) as WeeklyReport["overtaken"])
      : [],
    overtakenCount: Number(d.overtakenCount ?? 0) || 0,
    overtakenBy: Array.isArray(d.overtakenBy)
      ? (d.overtakenBy.filter(isRival) as WeeklyReport["overtakenBy"])
      : [],
    overtakenByCount: Number(d.overtakenByCount ?? 0) || 0,
    nextTarget:
      d.nextTarget && typeof d.nextTarget === "object"
        ? (d.nextTarget as WeeklyReport["nextTarget"])
        : null,
    threat:
      d.threat && typeof d.threat === "object"
        ? (d.threat as WeeklyReport["threat"])
        : null,
    comment:
      d.comment && typeof d.comment === "object"
        ? (d.comment as WeeklyReport["comment"])
        : { tone: "held", factor: { kind: "none" } },
  };
}
