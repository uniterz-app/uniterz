import { getFirestore, Timestamp } from "firebase-admin/firestore";

/**
 * lib `refreshPredictKits` の hourly と同じ範囲（`PREDICT_KIT_CREATE_HORIZON_HOURS`）。
 * 欠場が変わった予想の作り直しも、20:00 に作れなかった試合の拾い直しも開始 24h 以内が対象
 */
const PATCH_HORIZON_MS = 24 * 60 * 60 * 1000;

/**
 * narrative_patch を Vercel に投げる前のゲート（Firestore のみ）。
 * 24h 以内に始まる未終了の NBA 試合が無いときは Next を起こさない。
 */
export async function shouldRunNbaProBriefPatch(
  now = new Date()
): Promise<boolean> {
  const db = getFirestore();
  const nowMs = now.getTime();
  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("startAtJst", ">", Timestamp.fromMillis(nowMs))
    .where("startAtJst", "<=", Timestamp.fromMillis(nowMs + PATCH_HORIZON_MS))
    .limit(20)
    .select("status", "final", "seasonPhase")
    .get();

  if (snap.empty) return false;

  return snap.docs.some((doc) => {
    const data = doc.data() ?? {};
    const status = String(data.status ?? "").toLowerCase();
    if (status === "final" || status === "ended" || data.final === true) {
      return false;
    }
    const phase = String(data.seasonPhase ?? "regular")
      .trim()
      .toLowerCase();
    if (phase === "preseason") return false;
    return true;
  });
}
