import { onRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

export const fixUserStats = onRequest(async (req, res) => {
  const db = getFirestore();

  // ① uids を配列として受け取る
  let raw = req.query.uids;

  let uids: string[] = [];

  if (typeof raw === "string") {
    // "a,b,c" → ["a","b","c"]
    uids = raw.split(",").map((s) => s.trim()).filter(Boolean);
  }

  // ② uid（単体指定）と共存させる
  const single = req.query.uid;
  if (typeof single === "string") {
    uids.push(single);
  }

  // ③ 重複削除
  uids = [...new Set(uids)];

  if (uids.length === 0) {
    res.status(400).json({ ok: false, error: "uid or uids required" });
    return;
  }

  // レスポンス即返す
  res.status(200).json({ ok: true, count: uids.length });

  // ④ 非同期で実行
  setImmediate(async () => {
    console.log("START recompute", uids.length, "users");

    console.log("FINISHED ALL");
  });
});
