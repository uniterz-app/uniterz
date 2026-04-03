import { getFirestore, Timestamp } from "firebase-admin/firestore";

export async function dailyAnalyticsCore() {
  const db = getFirestore();

  // 今日の0:00
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 🔥 Firestore Timestamp に変換（最重要）
  const startTs = Timestamp.fromDate(today);

  const dateKey = today.toISOString().slice(0, 10);

  // ---- ① 今日の新規ユーザー ----
  const newUsers = (
    await db.collection("users").where("createdAt", ">=", startTs).get()
  ).size;

  // ---- ② 今日の投稿 ----
  const newPosts = (
    await db.collectionGroup("posts").where("createdAt", ">=", startTs).get()
  ).size;

  // ---- ③ 累計ユーザー ----
  const totalUsers = (await db.collection("users").get()).size;

  const payload = {
    newUsers,
    newPosts,
    totalUsers,
    dau: 0,
    ts: Date.now(),
  };

  // ---- Firestore に保存 ----
  await db
    .collection("analytics")
    .doc("daily")
    .collection("stats")
    .doc(dateKey)
    .set(payload);

  return payload;
}
