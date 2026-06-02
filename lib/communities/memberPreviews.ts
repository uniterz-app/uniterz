import type { DocumentReference, DocumentSnapshot, Firestore } from "firebase-admin/firestore";

export type GroupMemberPreview = {
  uid: string;
  photoURL: string | null;
  role: "owner" | "member";
};

const GET_ALL_CHUNK = 100;
export const GROUP_MEMBER_PREVIEW_LIMIT = 4;

async function getAllInChunks(
  db: Firestore,
  refs: DocumentReference[]
): Promise<DocumentSnapshot[]> {
  const out: DocumentSnapshot[] = [];
  for (let i = 0; i < refs.length; i += GET_ALL_CHUNK) {
    const chunk = refs.slice(i, i + GET_ALL_CHUNK);
    if (chunk.length === 0) continue;
    const snaps = await db.getAll(...chunk);
    out.push(...snaps);
  }
  return out;
}

/** 一覧カード用: オーナー優先 + 参加順で最大 limit 名の顔写真 */
export async function fetchGroupMemberPreviews(
  db: Firestore,
  groupId: string,
  ownerUid: string,
  limit = GROUP_MEMBER_PREVIEW_LIMIT
): Promise<GroupMemberPreview[]> {
  const memSnap = await db.collection(`groups/${groupId}/members`).get();
  if (memSnap.empty) return [];

  const sorted = [...memSnap.docs].sort((a, b) => {
    const aOwner = a.id === ownerUid || a.data()?.role === "owner" ? 0 : 1;
    const bOwner = b.id === ownerUid || b.data()?.role === "owner" ? 0 : 1;
    if (aOwner !== bOwner) return aOwner - bOwner;
    const ja =
      typeof a.data()?.joinedAt?.toMillis === "function"
        ? a.data()!.joinedAt.toMillis()
        : 0;
    const jb =
      typeof b.data()?.joinedAt?.toMillis === "function"
        ? b.data()!.joinedAt.toMillis()
        : 0;
    return ja - jb;
  });

  const picked = sorted.slice(0, limit);
  const uids = picked.map((d) => d.id);
  const cumSnaps = await getAllInChunks(
    db,
    uids.map((uid) => db.doc(`cumulative_stats/${uid}`))
  );
  const photoByUid = new Map<string, string | null>();
  for (const snap of cumSnaps) {
    if (!snap.exists) continue;
    const url = snap.data()?.photoURL;
    photoByUid.set(snap.id, typeof url === "string" && url ? url : null);
  }

  return picked.map((d) => ({
    uid: d.id,
    photoURL: photoByUid.get(d.id) ?? null,
    role:
      d.id === ownerUid || d.data()?.role === "owner"
        ? ("owner" as const)
        : ("member" as const),
  }));
}
