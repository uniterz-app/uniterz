import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type { CommunityLeague, CommunityMetric, CommunityPeriodType } from "@/lib/communities/types";
import { TIMEZONE_JST, getZonedYMD } from "@/lib/time/zonedTime";

type RankedRow = {
  rank: number;
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;
  plan: "free" | "pro";
  countryCode: string | null;
  totalPosts: number;
  totalWins: number;
  winRate: number;
  totalPoints: number;
  totalPrecision: number;
  totalUpset: number;
  activeWinStreak: number;
  sortValue: number;
};

export type LeaderboardSnapshot = {
  slotKey: string;
  rankingMetric: CommunityMetric;
  rankingLeague: CommunityLeague;
  periodType: CommunityPeriodType;
  rankingStartDateKey: string;
  memberCount: number;
  rows: RankedRow[];
  builtAtMs: number;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** JST 16:00 基準のスナップショット日付キー */
export function getLeaderboardSnapshotSlotKeyJst(now = new Date()): string {
  const ymd = getZonedYMD(now, TIMEZONE_JST);
  const hourJst = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE_JST,
      hour: "2-digit",
      hour12: false,
    }).format(now)
  );
  const base = new Date(Date.UTC(ymd.year, ymd.month - 1, ymd.day));
  if (Number.isFinite(hourJst) && hourJst < 16) {
    base.setUTCDate(base.getUTCDate() - 1);
  }
  return `${base.getUTCFullYear()}-${pad2(base.getUTCMonth() + 1)}-${pad2(base.getUTCDate())}`;
}

function snapshotRef(db: Firestore, groupId: string, slotKey: string) {
  return db.doc(`groups/${groupId}/leaderboard_snapshots/${slotKey}`);
}

export async function readLeaderboardSnapshot(
  db: Firestore,
  groupId: string,
  slotKey: string
): Promise<LeaderboardSnapshot | null> {
  const snap = await snapshotRef(db, groupId, slotKey).get();
  if (!snap.exists) return null;
  const d = snap.data() as Record<string, unknown>;
  const rows = Array.isArray(d.rows) ? (d.rows as RankedRow[]) : null;
  if (!rows) return null;
  return {
    slotKey: String(d.slotKey ?? slotKey),
    rankingMetric: String(d.rankingMetric ?? "totalPoints") as CommunityMetric,
    rankingLeague: String(d.rankingLeague ?? "all") as CommunityLeague,
    periodType: String(d.periodType ?? "from_now") as CommunityPeriodType,
    rankingStartDateKey: String(d.rankingStartDateKey ?? ""),
    memberCount: Number(d.memberCount ?? 0),
    rows,
    builtAtMs: Number(d.builtAtMs ?? 0),
  };
}

export async function writeLeaderboardSnapshot(
  db: Firestore,
  groupId: string,
  snapshot: LeaderboardSnapshot
) {
  await snapshotRef(db, groupId, snapshot.slotKey).set(
    {
      slotKey: snapshot.slotKey,
      rankingMetric: snapshot.rankingMetric,
      rankingLeague: snapshot.rankingLeague,
      periodType: snapshot.periodType,
      rankingStartDateKey: snapshot.rankingStartDateKey,
      memberCount: snapshot.memberCount,
      rows: snapshot.rows,
      builtAtMs: snapshot.builtAtMs,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

