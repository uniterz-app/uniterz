// functions/src/trend/users.aggregate.ts
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// ------------------------------
// ★ 連勝ランキングだけを作る
// ------------------------------
export async function aggregateUsersTrend() {
  const db = getFirestore(); // ← ★ ここで取得する

  const snap = await db.collection("users").get();
  const rows: any[] = [];

  for (const doc of snap.docs) {
    const d = doc.data();

    const statsSnap = await db
      .collection("user_stats_v2")
      .doc(doc.id)
      .get();

    if (!statsSnap.exists) continue;

    const stats = statsSnap.data()!;
    const streak = Number(stats.currentStreak ?? 0);
    if (streak < 5) continue;

    rows.push({
      uid: doc.id,
      displayName: d.displayName ?? "",
      handle: d.handle ?? "",
      photoURL: d.photoURL ?? d.avatarUrl ?? "",
      currentStreak: streak,
      maxStreak: Number(stats.maxStreak ?? 0),
    });
  }

  rows.sort((a, b) => b.currentStreak - a.currentStreak);

  const top = rows.slice(0, 10);

  await db.doc("trend_cache/users").set({
    updatedAt: Timestamp.now(),
    users: top,
  });

  return { ok: true, count: top.length };
}
