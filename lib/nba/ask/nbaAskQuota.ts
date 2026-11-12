/**
 * スタッツ質問チャットの回数ルール（費用の上限を決める唯一の場所）。
 *
 * - アプリの使い方の質問: 誰でも無制限（裏で 1 日 / 1 分の安全上限）
 * - スタッツの質問: 無料は 1 日 3 回、Pro は無制限（裏で 1 日 60 回）。日本時間 0 時に戻る
 * - スタッツの回数は「AI が実際にスタッツの道具を使った」ときだけ答えたあとに数える
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import {
  consumeRateLimit,
  DAY_MS,
  MINUTE_MS,
  RATE_LIMIT_COLLECTION,
} from "@/lib/security/rateLimit";

/** 無料アカウントのスタッツ質問（1 日） */
export const NBA_ASK_FREE_STATS_DAILY = 3;
/** Pro のスタッツ質問の安全上限（1 日）。人が手で打って届く数ではない */
const PRO_STATS_DAILY_CAP = 60;
/** 質問全体の安全上限（1 日・アプリの質問を含む） */
const TOTAL_DAILY_CAP = { free: 50, pro: 120 } as const;
/** 連投（スクリプト）止め */
const PER_MINUTE_CAP = 10;

const STATS_DAILY_SCOPE = "nba_ask_stats";
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = Number(raw);
  return raw != null && raw.trim() !== "" && Number.isInteger(n) && n >= 0 ? n : fallback;
}

function dayWindowStart(): number {
  return Math.floor(Date.now() / DAY_MS) * DAY_MS;
}

/** スタッツの回数は「明日また」と案内するので日本時間の 0 時で区切る */
function jstDayStart(): number {
  return Math.floor((Date.now() + JST_OFFSET_MS) / DAY_MS) * DAY_MS - JST_OFFSET_MS;
}

function statsDailyRef(db: Firestore, uid: string) {
  return db
    .collection(RATE_LIMIT_COLLECTION)
    .doc(`${STATS_DAILY_SCOPE}__${uid}__${jstDayStart()}`);
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
  const snap = await statsDailyRef(db, uid).get();
  const used = Number(snap.data()?.count ?? 0);
  if (isPro) {
    return {
      allowed: used < envInt("NBA_ASK_PRO_STATS_DAILY", PRO_STATS_DAILY_CAP),
      freeRemaining: null,
    };
  }
  const remaining = Math.max(0, envInt("NBA_ASK_FREE_STATS_DAILY", NBA_ASK_FREE_STATS_DAILY) - used);
  return { allowed: remaining > 0, freeRemaining: remaining };
}

/** 答えを返したあと、スタッツの道具を使った質問だけ数える */
export async function recordNbaAskStatsUse(db: Firestore, uid: string): Promise<void> {
  await statsDailyRef(db, uid).set(
    {
      scope: STATS_DAILY_SCOPE,
      subject: uid,
      count: FieldValue.increment(1),
      expiresAt: new Date(jstDayStart() + 2 * DAY_MS),
    },
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
