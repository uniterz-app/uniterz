/**
 * 表示名（ユーザー名）前方一致でユーザー検索（Admin SDK）。
 * `users.displayName` の単一フィールド範囲クエリ。
 * 大文字小文字ゆれ用に数パターンを並列取得してマージする。
 */
import type { Firestore } from "firebase-admin/firestore";

export type UserSearchHit = {
  uid: string;
  handle: string;
  displayName: string;
  photoURL: string | null;
  plan: "free" | "pro";
};

/** 検索クエリ整形（前後空白・先頭@除去。大文字小文字は保持） */
export function normalizeUserSearchQuery(raw: string): string {
  return raw.trim().replace(/^@+/, "");
}

function mapUserDoc(
  uid: string,
  data: Record<string, unknown> | undefined
): UserSearchHit | null {
  if (!data || data.deleted === true) return null;
  const handle =
    typeof data.handle === "string" ? data.handle.trim().replace(/^@+/, "") : "";
  if (!handle) return null;
  const displayName =
    (typeof data.displayName === "string" && data.displayName.trim()) ||
    handle;
  const photoURL =
    typeof data.photoURL === "string" && data.photoURL.trim()
      ? data.photoURL.trim()
      : null;
  const plan = data.plan === "pro" ? "pro" : "free";
  return { uid, handle, displayName, photoURL, plan };
}

function displayNameMatches(displayName: string, q: string): boolean {
  const name = displayName.trim();
  if (!name || !q) return false;
  if (name.startsWith(q)) return true;
  return name.toLowerCase().startsWith(q.toLowerCase());
}

/** Firestore 範囲用プレフィックス候補（大小文字ゆれ） */
function prefixVariants(q: string): string[] {
  const base = normalizeUserSearchQuery(q);
  if (base.length < 2) return [];
  const out = new Set<string>();
  out.add(base);
  out.add(base.toLowerCase());
  out.add(base.toUpperCase());
  out.add(base.charAt(0).toUpperCase() + base.slice(1));
  out.add(base.charAt(0).toUpperCase() + base.slice(1).toLowerCase());
  return [...out].filter((s) => s.length >= 2 && s.length <= 40);
}

async function queryDisplayNamePrefix(
  db: Firestore,
  prefix: string,
  fetchLimit: number
): Promise<UserSearchHit[]> {
  const end = `${prefix}\uf8ff`;
  const snap = await db
    .collection("users")
    .where("displayName", ">=", prefix)
    .where("displayName", "<=", end)
    .orderBy("displayName")
    .limit(fetchLimit)
    .get();

  const rows: UserSearchHit[] = [];
  for (const doc of snap.docs) {
    const hit = mapUserDoc(doc.id, doc.data() as Record<string, unknown>);
    if (hit) rows.push(hit);
  }
  return rows;
}

/**
 * @param q 表示名クエリ。最低 2 文字。
 */
export async function searchUsersByDisplayNamePrefix(
  db: Firestore,
  q: string,
  opts?: { limit?: number; excludeUid?: string | null }
): Promise<UserSearchHit[]> {
  const query = normalizeUserSearchQuery(q);
  if (query.length < 2 || query.length > 40) return [];

  const limit = Math.min(Math.max(opts?.limit ?? 20, 1), 30);
  const exclude = opts?.excludeUid?.trim() || "";
  const prefixes = prefixVariants(query);
  if (prefixes.length === 0) return [];

  const perQuery = limit + (exclude ? 4 : 0);
  const batches = await Promise.all(
    prefixes.map((p) => queryDisplayNamePrefix(db, p, perQuery))
  );

  const out: UserSearchHit[] = [];
  const seen = new Set<string>();
  for (const batch of batches) {
    for (const hit of batch) {
      if (exclude && hit.uid === exclude) continue;
      if (!displayNameMatches(hit.displayName, query)) continue;
      if (seen.has(hit.uid)) continue;
      seen.add(hit.uid);
      out.push(hit);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/** @deprecated 表示名検索へ移行。互換エイリアス */
export async function searchUsersByHandlePrefix(
  db: Firestore,
  q: string,
  opts?: { limit?: number; excludeUid?: string | null }
): Promise<UserSearchHit[]> {
  return searchUsersByDisplayNamePrefix(db, q, opts);
}
