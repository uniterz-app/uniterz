/**
 * groups/{id}.memberPreviews を最新化する。
 * 一覧カード用。フル members スキャンを毎回やらないため group 文書に載せる。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import {
  fetchGroupMemberPreviews,
  GROUP_MEMBER_PREVIEW_LIMIT,
  type GroupMemberPreview,
} from "./memberPreviews";

export function parseStoredMemberPreviews(
  raw: unknown
): GroupMemberPreview[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: GroupMemberPreview[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const uid = String((row as GroupMemberPreview).uid ?? "").trim();
    if (!uid) continue;
    const photoRaw = (row as GroupMemberPreview).photoURL;
    const roleRaw = (row as GroupMemberPreview).role;
    out.push({
      uid,
      photoURL:
        typeof photoRaw === "string" && photoRaw.trim()
          ? photoRaw.trim()
          : null,
      role: roleRaw === "owner" ? "owner" : "member",
    });
    if (out.length >= GROUP_MEMBER_PREVIEW_LIMIT) break;
  }
  return out.length > 0 ? out : null;
}

/** join / leave / create 後に呼ぶ。失敗しても本体処理は落とさない想定で try/catch 側任せ。 */
export async function refreshGroupMemberPreviews(
  db: Firestore,
  groupId: string,
  ownerUid: string
): Promise<GroupMemberPreview[]> {
  const previews = await fetchGroupMemberPreviews(db, groupId, ownerUid);
  await db.doc(`groups/${groupId}`).set(
    {
      memberPreviews: previews,
      memberPreviewsUpdatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return previews;
}
