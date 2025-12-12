import { onRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

export const listUserStatsIds = onRequest(async (req, res) => {
  const db = getFirestore();
  const snap = await db.collection("user_stats_v2").select().get();

  const ids = snap.docs.map((d) => d.id);

  res.json({ count: ids.length, ids });
});
