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

function parseRival(v: unknown): WeeklyReport["overtaken"][number] | null {
  if (!isRival(v)) return null;
  const o = v as Record<string, unknown>;
  const plan = o.plan === "pro" ? "pro" : o.plan === "free" ? "free" : undefined;
  return {
    uid: String(o.uid),
    displayName: String(o.displayName),
    photoURL: typeof o.photoURL === "string" ? o.photoURL : null,
    rank: typeof o.rank === "number" && Number.isFinite(o.rank) ? o.rank : 0,
    ...(plan ? { plan } : {}),
  };
}

function parseRivalList(raw: unknown): WeeklyReport["overtaken"] {
  if (!Array.isArray(raw)) return [];
  return raw.map(parseRival).filter((x): x is WeeklyReport["overtaken"][number] => x != null);
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
    overtaken: parseRivalList(d.overtaken),
    overtakenCount: Number(d.overtakenCount ?? 0) || 0,
    overtakenBy: parseRivalList(d.overtakenBy),
    overtakenByCount: Number(d.overtakenByCount ?? 0) || 0,
    nextTarget:
      d.nextTarget && typeof d.nextTarget === "object"
        ? (() => {
            const nt = d.nextTarget as {
              rival?: unknown;
              pointsBehind?: unknown;
            };
            const rival = parseRival(nt.rival);
            if (!rival || typeof nt.pointsBehind !== "number") return null;
            return { rival, pointsBehind: nt.pointsBehind };
          })()
        : null,
    threat:
      d.threat && typeof d.threat === "object"
        ? (() => {
            const th = d.threat as { rival?: unknown; pointsGap?: unknown };
            const rival = parseRival(th.rival);
            if (!rival || typeof th.pointsGap !== "number") return null;
            return { rival, pointsGap: th.pointsGap };
          })()
        : null,
    comment:
      d.comment && typeof d.comment === "object"
        ? (d.comment as WeeklyReport["comment"])
        : { tone: "held", factor: { kind: "none" } },
  };
}
