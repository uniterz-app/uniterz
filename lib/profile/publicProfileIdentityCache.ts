/**
 * 他人プロフィールを開く直前の identity 先読み（Web / Native 共用）。
 * users 本文が来るまでのカード骨格用。TTL 短め。
 */

export type PublicProfileIdentitySeed = {
  targetUid: string | null;
  displayName: string;
  handle: string;
  bio: string;
  photoURL: string;
  plan: "free" | "pro";
  countryCode: string;
  posts: number;
  /** true = users ドキュメント由来（bio / skin まで揃いやすい） */
  fromUserDoc: boolean;
};

const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; seed: PublicProfileIdentitySeed }>();

function normKey(raw: string): string {
  try {
    return decodeURIComponent(raw).trim().replace(/^@+/u, "").toLowerCase();
  } catch {
    return raw.trim().replace(/^@+/u, "").toLowerCase();
  }
}

function writeKeys(
  keys: Array<string | null | undefined>,
  seed: PublicProfileIdentitySeed
): void {
  const at = Date.now();
  for (const key of keys) {
    const k = typeof key === "string" ? normKey(key) : "";
    if (!k) continue;
    cache.set(k, { at, seed });
  }
}

export function peekPublicProfileIdentity(
  routeKey: string | null | undefined
): PublicProfileIdentitySeed | null {
  const k = typeof routeKey === "string" ? normKey(routeKey) : "";
  if (!k) return null;
  const hit = cache.get(k);
  if (!hit || Date.now() - hit.at >= TTL_MS) return null;
  return hit.seed;
}

export function primePublicProfileIdentity(input: {
  routeKey: string;
  uid?: string | null;
  handle?: string | null;
  displayName?: string | null;
  bio?: string | null;
  photoURL?: string | null;
  plan?: "free" | "pro" | string | null;
  countryCode?: string | null;
  posts?: number | null;
  fromUserDoc?: boolean;
}): PublicProfileIdentitySeed {
  const uid = typeof input.uid === "string" ? input.uid.trim() : "";
  const handle = typeof input.handle === "string" ? input.handle.trim() : "";
  const displayName =
    typeof input.displayName === "string" && input.displayName.trim()
      ? input.displayName.trim()
      : handle || "User";
  const country =
    typeof input.countryCode === "string" ? input.countryCode.trim() : "";
  const seed: PublicProfileIdentitySeed = {
    targetUid: uid || null,
    displayName,
    handle,
    bio: typeof input.bio === "string" ? input.bio : "",
    photoURL: typeof input.photoURL === "string" ? input.photoURL.trim() : "",
    plan: input.plan === "pro" ? "pro" : "free",
    countryCode: country,
    posts:
      typeof input.posts === "number" && Number.isFinite(input.posts)
        ? Math.max(0, Math.floor(input.posts))
        : 0,
    fromUserDoc: input.fromUserDoc === true,
  };
  writeKeys([input.routeKey, uid, handle], seed);
  return seed;
}

export function invalidatePublicProfileIdentity(routeKey?: string): void {
  if (!routeKey) {
    cache.clear();
    return;
  }
  cache.delete(normKey(routeKey));
}
