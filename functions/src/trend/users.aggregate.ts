// functions/src/trend/users.aggregate.ts
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getApps, initializeApp } from "firebase-admin/app";

if (!getApps().length) initializeApp();
const db = getFirestore();

// ------------------------------
// ★ 連勝ランキングだけを作る
// ------------------------------
export async function aggregateUsersTrend() {
  // users 全件取得
  const snap = await db.collection("users").get();

  const rows: any[] = [];

  snap.forEach((doc) => {
    const d = doc.data();

    const streak = Number(d.currentStreak ?? 0);
    if (streak < 5) return; // ★ 5連勝未満は除外

    rows.push({
      uid: doc.id,
      displayName: d.displayName ?? "",
      handle: d.handle ?? "",
      photoURL: d.photoURL ?? d.avatarUrl ?? "",
      currentStreak: streak,
      maxStreak: Number(d.maxStreak ?? 0),
    });
  });

  // ★ 連勝順でソート
  rows.sort((a, b) => b.currentStreak - a.currentStreak);

  // ★ 上位10人を保存
  const top = rows.slice(0, 10);

  await db.doc("trend_cache/users").set({
    updatedAt: Timestamp.now(),
    users: top,
  });

  return { ok: true, count: top.length };
}
