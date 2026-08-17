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

async function userDocByUid(
  db: Firestore,
  uid: string
): Promise<{ id: string; data: Record<string, unknown> } | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, data: snap.data() as Record<string, unknown> };
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
  return { id: d.id, data: d.data() as Record<string, unknown> };
}

/**
 * プロフィール URL / カード ID から users ドキュメントを解決する。
 * カードの `ID: @XXXX` は slug（小文字）で、ハンドルとは別フィールドのことがある。
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
