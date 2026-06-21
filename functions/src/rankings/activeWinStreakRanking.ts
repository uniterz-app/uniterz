import { getFirestore, Timestamp } from "firebase-admin/firestore";

function toDateKeyJST(d: Date): string {
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = j.getUTCFullYear();
  const m = String(j.getUTCMonth() + 1).padStart(2, "0");
  const day = String(j.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function jstDayBounds(now: Date = new Date()): {
  dateKey: string;
  start: Timestamp;
  end: Timestamp;
} {
  const j = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const startJst = new Date(
    Date.UTC(j.getUTCFullYear(), j.getUTCMonth(), j.getUTCDate(), 0, 0, 0, 0)
  );
  startJst.setTime(startJst.getTime() - 9 * 60 * 60 * 1000);
  const endJst = new Date(startJst.getTime() + 24 * 60 * 60 * 1000);
  return {
    dateKey: toDateKeyJST(now),
    start: Timestamp.fromDate(startJst),
    end: Timestamp.fromDate(endJst),
  };
}

/** JST 今日に league 向け投稿が確定（settledAt）した authorUid — 16:00 スナップショット用 */
export async function loadAuthorUidsSettledToday(
  league: "wc" | "nba",
  now: Date = new Date()
): Promise<Set<string>> {
  const { start, end } = jstDayBounds(now);
  const snap = await getFirestore()
    .collection("posts")
    .where("league", "==", league)
    .where("schemaVersion", "==", 2)
    .where("status", "==", "final")
    .where("settledAt", ">=", start)
    .where("settledAt", "<", end)
    .select("authorUid")
    .get();

  const out = new Set<string>();
  for (const doc of snap.docs) {
    const uid = String(doc.data().authorUid ?? "").trim();
    if (uid) out.add(uid);
  }
  return out;
}

/** @deprecated use loadAuthorUidsSettledToday */
export const loadAuthorUidsPostedToday = loadAuthorUidsSettledToday;

export function isActiveWinStreakRankingEligible(
  uid: string,
  activeWinStreak: number,
  settledTodayUids: Set<string>
): boolean {
  return settledTodayUids.has(uid) && activeWinStreak > 0;
}
