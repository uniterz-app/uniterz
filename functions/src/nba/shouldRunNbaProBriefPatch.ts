import { getFirestore, Timestamp } from "firebase-admin/firestore";

/** tip の 1h 前〜 tip — lib `PRO_BRIEF_PATCH_BEFORE_TIP_MS` と同値 */
const PATCH_BEFORE_TIP_MS = 60 * 60 * 1000;

/**
 * narrative_patch を Vercel に投げる前のゲート（Firestore のみ）。
 * tip 1h 以内の未終了 NBA 試合が無いときは Next を起こさない。
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
    .where(
      "startAtJst",
      "<=",
      Timestamp.fromMillis(nowMs + PATCH_BEFORE_TIP_MS)
    )
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
