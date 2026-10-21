/**
 * 連勝は「試合が終了になった順」に数える。同じ 1 分の取り込みで複数試合が final になると
 * onGameFinalV2 が並列に走り、ユーザーごとに反映順がばらつく（同じ予想でもボーナスがずれる）。
 * そこで (finalAt, gameId) の順で、先に終わった試合の連勝反映が済むまで待ってから反映する。
 */
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { leagueToSport } from "./settlementGame";

/** これより前に final になった試合は待たない（取り込み 1 回分 + 余裕） */
const LOOKBACK_MS = 15 * 60 * 1000;
const POLL_MS = 3000;
/** 先行試合の精算が落ちていても、この時間で諦めて進める */
const MAX_WAIT_MS = 150 * 1000;

function claimsRef(db: FirebaseFirestore.Firestore, gameId: string) {
  return db.doc(`gameSettlementClaims/${gameId}`);
}

export async function markStreakApplied(
  db: FirebaseFirestore.Firestore,
  gameId: string
): Promise<void> {
  await claimsRef(db, gameId).set(
    { streakAppliedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
}

function toMs(v: unknown): number | null {
  if (v instanceof Timestamp) return v.toMillis();
  if (v && typeof (v as { toMillis?: () => number }).toMillis === "function") {
    return (v as { toMillis: () => number }).toMillis();
  }
  return null;
}

async function pendingPredecessors(
  db: FirebaseFirestore.Firestore,
  gameId: string,
  league: string,
  finalAtMs: number
): Promise<string[]> {
  const sport = leagueToSport(league);
  const snap = await db
    .collection("games")
    .where("finalAt", ">=", Timestamp.fromMillis(finalAtMs - LOOKBACK_MS))
    .where("finalAt", "<=", Timestamp.fromMillis(finalAtMs))
    .get();
  const earlier = snap.docs.filter((d) => {
    if (d.id === gameId) return false;
    const data = d.data();
    if (data.final !== true || data.resultComputedAtV2 != null) return false;
    if (leagueToSport(String(data.league ?? "")) !== sport) return false;
    const ms = toMs(data.finalAt);
    if (ms == null) return false;
    return ms < finalAtMs || (ms === finalAtMs && d.id < gameId);
  });
  if (earlier.length === 0) return [];
  const claims = await db.getAll(...earlier.map((d) => claimsRef(db, d.id)));
  return earlier
    .filter((_, i) => claims[i]?.get("streakAppliedAt") == null)
    .map((d) => d.id);
}

/** 先に final になった同じ競技の試合の連勝反映を待つ（最大 MAX_WAIT_MS） */
export async function waitForEarlierStreakGames(
  db: FirebaseFirestore.Firestore,
  gameId: string,
  game: { league?: string | null; finalAt?: unknown }
): Promise<void> {
  const finalAtMs = toMs(game.finalAt);
  if (finalAtMs == null) return;
  const deadline = Date.now() + MAX_WAIT_MS;
  for (;;) {
    const pending = await pendingPredecessors(
      db,
      gameId,
      String(game.league ?? ""),
      finalAtMs
    );
    if (pending.length === 0) return;
    if (Date.now() >= deadline) {
      console.warn(
        `[streakOrder] ${gameId} gave up waiting for ${pending.join(",")}`
      );
      return;
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}
