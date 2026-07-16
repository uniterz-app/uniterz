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

  // ---- ③ 累計ユーザー（count 集約 — 全件 read より安価） ----
  const totalUsersSnap = await db.collection("users").count().get();
  const totalUsers = totalUsersSnap.data().count;

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
