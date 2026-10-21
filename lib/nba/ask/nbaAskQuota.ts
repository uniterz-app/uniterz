/**
 * スタッツ質問チャットの回数ルール（費用の上限を決める唯一の場所）。
 *
 * - アプリの使い方の質問: 誰でも無制限（裏で 1 日 / 1 分の安全上限）
 * - スタッツの質問: 無料はアカウント通算 5 回、Pro は無制限（裏で 1 日 60 回）
 * - スタッツの回数は「AI が実際にスタッツの道具を使った」ときだけ答えたあとに数える
 * - 外部検索は Pro だけ。1 日 3 回まで（スタッツの 60 回とは別）
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import {
  consumeRateLimit,
  DAY_MS,
  MINUTE_MS,
  RATE_LIMIT_COLLECTION,
} from "@/lib/security/rateLimit";

/** 無料アカウントのスタッツ質問（通算） */
export const NBA_ASK_FREE_STATS_LIFETIME = 5;
/** Pro のスタッツ質問の安全上限（1 日）。人が手で打って届く数ではない */
const PRO_STATS_DAILY_CAP = 60;
/**
 * Pro の外部検索（1 日）。検索 1 回はスタッツ読みより高いので、別の低い上限にする。
 * 毎日使い切っても月の Pro 収入を超えない数。
 */
export const NBA_ASK_PRO_WEB_DAILY = 3;
const WEB_DAILY_SCOPE = "nba_ask_web";
/** 質問全体の安全上限（1 日・アプリの質問を含む） */
const TOTAL_DAILY_CAP = { free: 50, pro: 120 } as const;
/** 連投（スクリプト）止め */
const PER_MINUTE_CAP = 10;

const USAGE_COLLECTION = "nbaAskUsage";
const STATS_DAILY_SCOPE = "nba_ask_stats";

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = Number(raw);
  return raw != null && raw.trim() !== "" && Number.isInteger(n) && n >= 0 ? n : fallback;
}

function dayWindowStart(): number {
  return Math.floor(Date.now() / DAY_MS) * DAY_MS;
}

function statsDailyRef(db: Firestore, uid: string) {
  return db
    .collection(RATE_LIMIT_COLLECTION)
    .doc(`${STATS_DAILY_SCOPE}__${uid}__${dayWindowStart()}`);
}

function usageRef(db: Firestore, uid: string) {
  return db.collection(USAGE_COLLECTION).doc(uid);
}

export type NbaAskStatsAllowance = {
  /** このリクエストでスタッツの道具を渡してよいか */
  allowed: boolean;
  /** 無料の残り回数（Pro は null = 無制限表示） */
  freeRemaining: number | null;
};

export async function readNbaAskStatsAllowance(
  db: Firestore,
  uid: string,
  isPro: boolean
): Promise<NbaAskStatsAllowance> {
  if (isPro) {
    const snap = await statsDailyRef(db, uid).get();
    const used = Number(snap.data()?.count ?? 0);
    return {
      allowed: used < envInt("NBA_ASK_PRO_STATS_DAILY", PRO_STATS_DAILY_CAP),
      freeRemaining: null,
    };
  }
  const limit = envInt("NBA_ASK_FREE_STATS_LIFETIME", NBA_ASK_FREE_STATS_LIFETIME);
  const snap = await usageRef(db, uid).get();
  const used = Number(snap.data()?.freeStatsUsed ?? 0);
  const remaining = Math.max(0, limit - used);
  return { allowed: remaining > 0, freeRemaining: remaining };
}

/** 答えを返したあと、スタッツの道具を使った質問だけ数える */
export async function recordNbaAskStatsUse(
  db: Firestore,
  uid: string,
  isPro: boolean
): Promise<void> {
  if (isPro) {
    await statsDailyRef(db, uid).set(
      {
        scope: STATS_DAILY_SCOPE,
        subject: uid,
        count: FieldValue.increment(1),
        expiresAt: new Date(dayWindowStart() + 2 * DAY_MS),
      },
      { merge: true }
    );
    return;
  }
  await usageRef(db, uid).set(
    { freeStatsUsed: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
}

export type NbaAskGateResult =
  | { ok: true }
  | { ok: false; reason: "per_minute" | "daily" };

/** 質問ごとに先に消費する安全上限（1 分 / 1 日） */
export async function consumeNbaAskSafetyCaps(
  db: Firestore,
  uid: string,
  isPro: boolean
): Promise<NbaAskGateResult> {
  const minute = await consumeRateLimit(
    db,
    { scope: "nba_ask_min", limit: PER_MINUTE_CAP, windowMs: MINUTE_MS },
    uid
  );
  if (!minute.allowed) return { ok: false, reason: "per_minute" };
  const day = await consumeRateLimit(
    db,
    {
      scope: "nba_ask_day",
      limit: isPro ? TOTAL_DAILY_CAP.pro : TOTAL_DAILY_CAP.free,
      windowMs: DAY_MS,
    },
    uid
  );
  if (!day.allowed) return { ok: false, reason: "daily" };
  return { ok: true };
}

/** Pro の外部検索を 1 回分確保する。上限なら検索しない */
export async function consumeNbaAskWebSearch(
  db: Firestore,
  uid: string
): Promise<{ ok: true; remaining: number } | { ok: false }> {
  const limit = envInt("NBA_ASK_PRO_WEB_DAILY", NBA_ASK_PRO_WEB_DAILY);
  const verdict = await consumeRateLimit(
    db,
    { scope: WEB_DAILY_SCOPE, limit, windowMs: DAY_MS },
    uid
  );
  return verdict.allowed ? { ok: true, remaining: verdict.remaining } : { ok: false };
}

/** 検索そのものが失敗した回は数えない */
export async function refundNbaAskWebSearch(db: Firestore, uid: string): Promise<void> {
  try {
    await db
      .collection(RATE_LIMIT_COLLECTION)
      .doc(`${WEB_DAILY_SCOPE}__${uid}__${dayWindowStart()}`)
      .set({ count: FieldValue.increment(-1) }, { merge: true });
  } catch (e) {
    console.warn("[nbaAskQuota] web refund failed", e);
  }
}

/** 答えを返せなかった質問は 1 日の安全上限に数えない */
export async function refundNbaAskDaily(db: Firestore, uid: string): Promise<void> {
  try {
    await db
      .collection(RATE_LIMIT_COLLECTION)
      .doc(`nba_ask_day__${uid}__${dayWindowStart()}`)
      .set({ count: FieldValue.increment(-1) }, { merge: true });
  } catch (e) {
    console.warn("[nbaAskQuota] refund failed", e);
  }
}
