import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import { looksLikeFirestoreUid } from "./profilePathKey";
import {
  peekUserDocMemoryEntry,
  setUserDocMemory,
} from "../user/userDocMemoryCache";
import { pickClientSafeUserFields } from "../security/publicUserDocumentFields";

export function normalizeProfileRouteKey(raw: string): string {
  return raw.trim().replace(/^@+/u, "");
}

function uniqueKeys(values: string[]): string[] {
  const out: string[] = [];
  for (const v of values) {
    const s = v.trim();
    if (!s || out.includes(s)) continue;
    out.push(s);
  }
  return out;
}

/** 公開プロフィール経路では sensitive を落とす（SDK 直読みの緩和。ルール変更の前段） */
function asPublicProfileDoc(
  id: string,
  data: Record<string, unknown>
): { id: string; data: Record<string, unknown> } {
  return { id, data: pickClientSafeUserFields(data) };
}

async function userDocByUid(
  db: Firestore,
  uid: string
): Promise<{ id: string; data: Record<string, unknown> } | null> {
  const safeUid = uid.trim();
  if (!safeUid) return null;

  const mem = peekUserDocMemoryEntry(safeUid);
  if (mem) {
    return mem.exists
      ? asPublicProfileDoc(safeUid, mem.data)
      : null;
  }

  const snap = await getDoc(doc(db, "users", safeUid));
  if (!snap.exists()) {
    setUserDocMemory(safeUid, { exists: false, data: {} });
    return null;
  }
  const data = snap.data() as Record<string, unknown>;
  // メモリにはフルを残す（本人経路が同じキャッシュを使うことがある）
  setUserDocMemory(safeUid, { exists: true, data });
  return asPublicProfileDoc(snap.id, data);
}

async function userDocByField(
  db: Firestore,
  field: "handle" | "slug" | "username",
  value: string
): Promise<{ id: string; data: Record<string, unknown> } | null> {
  const snap = await getDocs(
    query(collection(db, "users"), where(field, "==", value), limit(1))
  );
  if (snap.empty) return null;
  const d = snap.docs[0]!;
  const data = d.data() as Record<string, unknown>;
  setUserDocMemory(d.id, { exists: true, data });
  return asPublicProfileDoc(d.id, data);
}

/**
 * プロフィール URL / カード ID から users ドキュメントを解決する。
 * カードの `ID: @XXXX` は slug（小文字）で、ハンドルとは別フィールドのことがある。
 * uid 解決は `userDocMemoryCache` を共有（二重 getDoc を避ける）。
 */
export async function fetchUserDocByRouteKey(
  db: Firestore,
  rawKey: string
): Promise<{ id: string; data: Record<string, unknown> } | null> {
  const key = normalizeProfileRouteKey(rawKey);
  if (!key) return null;
  const candidates = uniqueKeys([key, key.toLowerCase()]);

  if (looksLikeFirestoreUid(key)) {
    const byUid = await userDocByUid(db, key);
    if (byUid) return byUid;
  }

  for (const slug of candidates) {
    const slugSnap = await getDoc(doc(db, "slugs", slug));
    if (!slugSnap.exists()) continue;
    const uid = slugSnap.data()?.uid;
    if (typeof uid !== "string" || !uid.trim()) continue;
    const found = await userDocByUid(db, uid.trim());
    if (found) return found;
  }

  for (const value of candidates) {
    for (const field of ["slug", "username", "handle"] as const) {
      const found = await userDocByField(db, field, value);
      if (found) return found;
    }
  }

  if (!looksLikeFirestoreUid(key)) {
    const byUid = await userDocByUid(db, key);
    if (byUid) return byUid;
  }

  return null;
}
