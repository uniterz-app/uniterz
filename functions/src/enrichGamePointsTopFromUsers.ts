/**
 * pointsSummary.top の表示名 / アバターを users から補完。
 * posts には author オブジェクトが無いことが多く、handle だけだと ID っぽく見える。
 */
import type { Firestore } from "firebase-admin/firestore";
import type { GamePointsTopEntryAgg } from "./aggregateGamePointsDistribution";

function pickNonEmpty(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s : null;
}

export async function enrichGamePointsTopFromUsers(
  db: Firestore,
  top: GamePointsTopEntryAgg[]
): Promise<GamePointsTopEntryAgg[]> {
  const uids = [
    ...new Set(
      top
        .map((r) => (typeof r.uid === "string" ? r.uid.trim() : ""))
        .filter(Boolean)
    ),
  ];
  if (uids.length === 0) return top;

  const refs = uids.map((uid) => db.collection("users").doc(uid));
  const snaps = await db.getAll(...refs);
  const byUid = new Map<
    string,
    {
      handle: string | null;
      displayName: string | null;
      photoURL: string | null;
      isPro: boolean;
    }
  >();

  for (const snap of snaps) {
    if (!snap.exists) continue;
    const d = snap.data() ?? {};
    const handle = pickNonEmpty(d.handle);
    const displayName =
      pickNonEmpty(d.displayName) ?? pickNonEmpty(d.name) ?? handle;
    const photoURL =
      pickNonEmpty(d.photoURL) ??
      pickNonEmpty(d.avatarUrl) ??
      pickNonEmpty(d.profileImageUrl);
    byUid.set(snap.id, {
      handle,
      displayName,
      photoURL,
      isPro: d.isPro === true || d.plan === "pro",
    });
  }

  return top.map((row) => {
    const uid = typeof row.uid === "string" ? row.uid.trim() : "";
    if (!uid) return row;
    const p = byUid.get(uid);
    if (!p) return row;
    const handle = p.handle ?? row.handle;
    const displayName = p.displayName ?? handle ?? row.displayName;
    return {
      ...row,
      handle,
      displayName,
      photoURL: p.photoURL ?? row.photoURL ?? null,
      isPro: p.isPro || row.isPro,
    };
  });
}
