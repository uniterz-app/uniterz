/** MARK リスト — `users/{uid}.markedPredictors`（既存の users 更新ルールで書ける） */
import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  MARKED_BY_SUBCOLLECTION,
  MAX_MARKS_PRO,
  parseUserMark,
  type UserMark,
} from "../../../../../lib/marks/markTypes";
import {
  hydrateMarksMemory,
  peekMarksWriteEpoch,
} from "../../../../../lib/marks/marksMemoryStore";
import {
  invalidateProfileUserDocNative,
  loadProfileUserDocNative,
} from "./profileUserDocCacheNative";

const MARKS_FIELD = "markedPredictors";

type MarksOk = { ok: true; marks: UserMark[] };
type MarksFail = { ok: false; error: "failed" };

function parseMarksField(raw: unknown): UserMark[] {
  if (!Array.isArray(raw)) return [];
  const rows: UserMark[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const data = item as Record<string, unknown>;
    const uid =
      typeof data.targetUid === "string" ? data.targetUid.trim() : "";
    const parsed = parseUserMark(uid, data);
    if (!parsed || seen.has(parsed.targetUid)) continue;
    seen.add(parsed.targetUid);
    rows.push(parsed);
  }
  rows.sort((a, b) => b.createdAtMs - a.createdAtMs);
  return rows.slice(0, MAX_MARKS_PRO);
}

export function parseMarksFromUserDoc(
  data: Record<string, unknown> | null | undefined
): UserMark[] {
  return parseMarksField(data?.[MARKS_FIELD]);
}

/** 既に読んだ users ドキュメントから MARK メモリを埋める（追加 getDoc なし） */
export function hydrateMarksFromUserDoc(
  uid: string,
  data: Record<string, unknown> | null | undefined
): void {
  const owner = uid.trim();
  if (!owner || !data) return;
  hydrateMarksMemory(
    owner,
    parseMarksFromUserDoc(data),
    peekMarksWriteEpoch()
  );
}

function toWriteRows(rows: UserMark[]): Array<{
  targetUid: string;
  handle: string;
  displayName: string;
  photoURL: string | null;
  createdAtMs: number;
}> {
  return rows.map((row) => ({
    targetUid: row.targetUid,
    handle: row.handle,
    displayName: row.displayName,
    photoURL: row.photoURL,
    createdAtMs: row.createdAtMs,
  }));
}

export async function listMarksNative(uid: string): Promise<UserMark[]> {
  const owner = uid.trim();
  if (!owner) return [];
  const loaded = await loadProfileUserDocNative(owner);
  return parseMarksFromUserDoc(loaded?.data);
}

/** メモリ上の最新リストをそのまま書く。getDoc で組み直さない（競合で消えるため） */
export async function persistMarksNative(
  uid: string,
  next: UserMark[]
): Promise<MarksOk | MarksFail> {
  const owner = uid.trim();
  if (!owner) return { ok: false, error: "failed" };
  try {
    await updateDoc(doc(db, "users", owner), {
      [MARKS_FIELD]: toWriteRows(next),
    });
    invalidateProfileUserDocNative(owner);
    return { ok: true, marks: next };
  } catch (err) {
    console.warn("[marks] persist failed", err);
    return { ok: false, error: "failed" };
  }
}

export async function setMarkedByNative(
  targetUid: string,
  fromUid: string
): Promise<void> {
  const target = targetUid.trim();
  const from = fromUid.trim();
  if (!target || !from || target === from) return;
  try {
    await setDoc(doc(db, "users", target, MARKED_BY_SUBCOLLECTION, from), {
      fromUid: from,
      createdAtMs: Date.now(),
    });
  } catch (err) {
    console.warn("[marks] markedBy set failed", err);
  }
}

export async function clearMarkedByNative(
  targetUid: string,
  fromUid: string
): Promise<void> {
  const target = targetUid.trim();
  const from = fromUid.trim();
  if (!target || !from) return;
  try {
    await deleteDoc(doc(db, "users", target, MARKED_BY_SUBCOLLECTION, from));
  } catch (err) {
    console.warn("[marks] markedBy clear failed", err);
  }
}

export async function countMarkedByNative(uid: string): Promise<number> {
  const owner = uid.trim();
  if (!owner) return 0;
  try {
    const snap = await getCountFromServer(
      collection(db, "users", owner, MARKED_BY_SUBCOLLECTION)
    );
    return snap.data().count;
  } catch (err) {
    console.warn("[marks] markedBy count failed", err);
    return 0;
  }
}
