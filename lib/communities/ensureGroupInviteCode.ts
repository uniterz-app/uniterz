/**
 * グループの平文招待コードを保証する。
 * 古いグループは hash のみで、後から共有できなくなるため。
 */
import type { DocumentReference, DocumentSnapshot } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { generateInviteCode, hashInviteCode } from "./inviteCode";

const MAX_ATTEMPTS = 8;

export async function ensureGroupInviteCode(
  groupSnap: DocumentSnapshot
): Promise<string | null> {
  if (!groupSnap.exists) return null;
  const ref = groupSnap.ref as DocumentReference;
  const d = groupSnap.data() ?? {};
  if (d.archivedAt) return null;

  const existing =
    typeof d.inviteCode === "string" && d.inviteCode.trim()
      ? d.inviteCode.trim()
      : null;
  if (existing) return existing;

  const db = ref.firestore;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const plain = generateInviteCode();
    const hash = hashInviteCode(plain);
    const clash = await db
      .collection("groups")
      .where("inviteCodeHash", "==", hash)
      .limit(1)
      .get();
    if (!clash.empty) continue;

    await ref.update({
      inviteCode: plain,
      inviteCodeHash: hash,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return plain;
  }
  return null;
}

/** オーナーが明示的に再発行するとき */
export async function rotateGroupInviteCode(
  groupSnap: DocumentSnapshot
): Promise<string | null> {
  if (!groupSnap.exists) return null;
  const ref = groupSnap.ref as DocumentReference;
  const d = groupSnap.data() ?? {};
  if (d.archivedAt) return null;

  const db = ref.firestore;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const plain = generateInviteCode();
    const hash = hashInviteCode(plain);
    const clash = await db
      .collection("groups")
      .where("inviteCodeHash", "==", hash)
      .limit(1)
      .get();
    if (!clash.empty) continue;

    await ref.update({
      inviteCode: plain,
      inviteCodeHash: hash,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return plain;
  }
  return null;
}
