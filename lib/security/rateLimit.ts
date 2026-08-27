/**
 * Firestore 固定ウィンドウのレート制限（Admin SDK 専用）。
 *
 * サーバーレスなのでプロセス内カウンタは使えない（インスタンスごとに別勘定）。
 * `rate_limits/{scope}__{subject}__{windowStart}` を 1 トランザクションで増やす。
 *
 * Firestore が落ちているときは通す（fail-open）。認証の代わりではなく、
 * スパムと招待コードの総当たりを鈍らせるためのもの。
 *
 * 掃除: `expiresAt` に TTL ポリシーを張る（コンソール / gcloud）。
 *   gcloud firestore fields ttls update expiresAt \
 *     --collection-group=rate_limits --enable-ttl
 */
import { Timestamp, type Firestore } from "firebase-admin/firestore";

export const RATE_LIMIT_COLLECTION = "rate_limits";

export type RateLimitRule = {
  /** 集計単位。エンドポイントごとに別名にする */
  scope: string;
  /** 上限回数 */
  limit: number;
  /** ウィンドウ幅（ミリ秒） */
  windowMs: number;
};

export type RateLimitVerdict =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSec: number };

/** 代表的な窓 */
export const MINUTE_MS = 60 * 1000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

/**
 * 書き込み系エンドポイントの上限を 1 箇所にまとめる（レビューしやすくするため）。
 * 通常利用では絶対に当たらない値にしてある。
 */
export const RATE_LIMIT_RULES = {
  /** 招待コードの総当たり。ハッシュ一致を試す経路すべてで共有する */
  inviteCodeLookup: {
    scope: "invite_code_lookup",
    limit: 20,
    windowMs: 10 * MINUTE_MS,
  },
  squadCreate: { scope: "squad_create", limit: 10, windowMs: HOUR_MS },
  squadInvite: { scope: "squad_invite", limit: 30, windowMs: HOUR_MS },
  squadJoinRequest: {
    scope: "squad_join_request",
    limit: 20,
    windowMs: HOUR_MS,
  },
  postCreate: { scope: "post_create", limit: 80, windowMs: HOUR_MS },
  profileView: { scope: "profile_view", limit: 200, windowMs: HOUR_MS },
  /** 公開プロフィール集計 API（user-stats / career / rank-playoff-trend） */
  profilePublicRead: {
    scope: "profile_public_read",
    limit: 240,
    windowMs: HOUR_MS,
  },
  communityCreate: { scope: "community_create", limit: 5, windowMs: DAY_MS },
} as const satisfies Record<string, RateLimitRule>;

export async function consumeRateLimit(
  db: Firestore,
  rule: RateLimitRule,
  subject: string
): Promise<RateLimitVerdict> {
  const key = String(subject ?? "").trim();
  if (!key) return { allowed: true, remaining: rule.limit };

  const now = Date.now();
  const windowStart = Math.floor(now / rule.windowMs) * rule.windowMs;
  const windowEnd = windowStart + rule.windowMs;
  const ref = db
    .collection(RATE_LIMIT_COLLECTION)
    .doc(`${rule.scope}__${key}__${windowStart}`);

  try {
    return await db.runTransaction<RateLimitVerdict>(async (tx) => {
      const snap = await tx.get(ref);
      const count = Number(snap.data()?.count ?? 0);
      if (count >= rule.limit) {
        return {
          allowed: false,
          retryAfterSec: Math.max(1, Math.ceil((windowEnd - now) / 1000)),
        };
      }
      tx.set(
        ref,
        {
          scope: rule.scope,
          subject: key,
          count: count + 1,
          windowStart: Timestamp.fromMillis(windowStart),
          // ウィンドウを跨いだ調査ができる程度に残す
          expiresAt: Timestamp.fromMillis(windowEnd + rule.windowMs),
        },
        { merge: true }
      );
      return { allowed: true, remaining: rule.limit - count - 1 };
    });
  } catch (err) {
    console.warn(`[rateLimit] ${rule.scope} check failed (fail-open)`, err);
    return { allowed: true, remaining: rule.limit };
  }
}

/**
 * 未認証・認証前の経路用。Vercel は `x-forwarded-for` を付ける。
 * 偽装可能なので uid が取れるなら uid を使う。
 */
export function rateLimitSubjectFromRequest(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const first = fwd.split(",")[0]?.trim();
  if (first) return `ip:${first}`;
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return `ip:${real}`;
  return "ip:unknown";
}
