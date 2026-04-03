import type { Firestore } from "firebase-admin/firestore";

export async function getGroupOrThrow(
  db: Firestore,
  groupId: string
): Promise<FirebaseFirestore.DocumentSnapshot> {
  const snap = await db.doc(`groups/${groupId}`).get();
  if (!snap.exists) {
    const e = new Error("group_not_found");
    (e as { status?: number }).status = 404;
    throw e;
  }
  return snap;
}

export async function assertMember(
  db: Firestore,
  groupId: string,
  uid: string
): Promise<FirebaseFirestore.DocumentSnapshot> {
  const groupSnap = await getGroupOrThrow(db, groupId);
  const mem = await db.doc(`groups/${groupId}/members/${uid}`).get();
  if (!mem.exists) {
    const e = new Error("not_a_member");
    (e as { status?: number }).status = 403;
    throw e;
  }
  return groupSnap;
}

export async function assertOwner(
  db: Firestore,
  groupId: string,
  uid: string
): Promise<FirebaseFirestore.DocumentSnapshot> {
  const groupSnap = await assertMember(db, groupId, uid);
  const data = groupSnap.data();
  if (data?.ownerUid !== uid) {
    const e = new Error("not_owner");
    (e as { status?: number }).status = 403;
    throw e;
  }
  return groupSnap;
}
