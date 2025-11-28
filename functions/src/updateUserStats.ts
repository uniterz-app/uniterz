// functions/src/updateUserStats.ts
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";

/** 集計バケットの型 */
export type Bucket = {
  /** 確定した投稿数（hit+miss, void除外） */
  posts: number;
  /** 総投稿数（期間中に「投稿した本数」） */
  postsTotal?: number;
  hit: number;
  units: number;
  oddsSum: number;
  oddsCnt: number;
};

/** JST（日付切り）用のキー生成: YYYY-MM-DD */
function toDateKeyJST(ts: Timestamp) {
  const d = ts.toDate();
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000); // UTC+9
  const yyyy = j.getUTCFullYear();
  const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(j.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** ゆるくリーグ文字列を正規化して b1 / j1 / other にまとめる */
function normalizeLeague(raw?: string | null): "b1" | "j1" | "other" {
  const v = String(raw ?? "").toLowerCase();

  if (v.includes("bj") || v.includes("b1") || v.includes("bleague")) {
    return "b1";
  }
  if (v === "j" || v.includes("j1") || v.includes("j.league") || v.includes("jleague")) {
    return "j1";
  }
  return "other";
}

/* ============================================================================
 * 共通ヘルパー：user_stats_daily から集計
 * ==========================================================================*/

/** 直近 days 日ぶんを daily から合算（全リーグ合算） */
async function sumRangeFromDaily(
  uid: string,
  toDate: Date, // JST の当日0:00を指す UTC Date
  days: number
): Promise<Bucket> {
  const db = getFirestore();
  const coll = db.collection("user_stats_daily");

  let bucket: Bucket = { posts: 0, hit: 0, units: 0, oddsSum: 0, oddsCnt: 0 };
  let postsTotal = 0;

  const ONE_DAY = 24 * 60 * 60 * 1000;
  const start = new Date(toDate.getTime() - (days - 1) * ONE_DAY);

  const keys: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * ONE_DAY);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const k = `${yyyy}-${mm}-${dd}`;
    keys.push(k);
  }

  const snaps = await Promise.all(keys.map((k) => coll.doc(`${uid}_${k}`).get()));
  for (const s of snaps) {
    if (!s.exists) continue;
    const v = s.data() as any;
    bucket.posts   += v.posts   || 0;
    bucket.hit     += v.hit     || 0;
    bucket.units   += v.units   || 0;
    bucket.oddsSum += v.oddsSum || 0;
    bucket.oddsCnt += v.oddsCnt || 0;

    // ★ その日の「投稿した本数」（createdPosts）を合算
    postsTotal += v.createdPosts || 0;
  }

  bucket.postsTotal = postsTotal;
  return bucket;
}

/** all は uid_ 前方一致で全件合算（必要十分。規模増で要最適化） */
async function sumAllFromDaily(uid: string): Promise<Bucket> {
  const db = getFirestore();
  const snapshot = await db
    .collection("user_stats_daily")
    .where("__name__", ">=", `${uid}_`)
    .where("__name__", "<", `${uid}_\uf8ff`)
    .get();

  let bucket: Bucket = { posts: 0, hit: 0, units: 0, oddsSum: 0, oddsCnt: 0 };
  let postsTotal = 0;

  snapshot.forEach((s) => {
    const v = s.data() as any;
    bucket.posts   += v.posts   || 0;
    bucket.hit     += v.hit     || 0;
    bucket.units   += v.units   || 0;
    bucket.oddsSum += v.oddsSum || 0;
    bucket.oddsCnt += v.oddsCnt || 0;

    postsTotal += v.createdPosts || 0;
  });

  bucket.postsTotal = postsTotal;
  return bucket;
}

/**
 * ✅ 1ユーザー分の user_stats（7d/30d/all）を、
 *    「今この瞬間の JST 日付」を基準に daily から再計算して保存する。
 */
export async function recomputeUserStatsFromDaily(uid: string): Promise<void> {
  const db = getFirestore();

  const now = Timestamp.now();
  const todayKey = toDateKeyJST(now);
  const toDate = new Date(`${todayKey}T00:00:00Z`); // JST基準の当日0時（UTC表現）

  const [b7, b30, ball] = await Promise.all([
    sumRangeFromDaily(uid, toDate, 7),
    sumRangeFromDaily(uid, toDate, 30),
    sumAllFromDaily(uid),
  ]);

  await db.doc(`user_stats/${uid}`).set(
    {
      updatedAt: FieldValue.serverTimestamp(),
      "7d": b7,
      "30d": b30,
      all: ball,
    },
    { merge: true }
  );
}

/* ============================================================================
 * 投稿1件を user_stats_daily / user_stats に適用（イベント駆動）
 * ==========================================================================*/

/**
 * 投稿1件を user_stats_daily / user_stats に適用（冪等）
 * - void-only は分母除外（posts/hit には加算しない）
 * - 7d/30d/all は正確さ優先で daily から再合成
 * - ★ league を受け取って all / b1 / j1 の3バケットに加算
 *
 * ★ 平均オッズ（oddsSum / oddsCnt）は「hit のときだけ」積み上げる
 */
export async function applyPostToUserStats(opts: {
  uid: string;
  postId: string;
  createdAt: Timestamp;
  settlement: "hit" | "miss" | "void";
  resultUnits: number;
  usedOdds: number; // Σ(pct*odds)
  league?: string | null;      // ★ 追加
}) {
  const db = getFirestore();
  const { uid, postId, createdAt, settlement, resultUnits, usedOdds, league } = opts;
  const dateKey = toDateKeyJST(createdAt);
  const leagueKey = normalizeLeague(league);

  // ---- 日別へ反映（冪等: applied_posts/{postId} マーカー）----
  const dailyDoc = db.doc(`user_stats_daily/${uid}_${dateKey}`);
  const marker = dailyDoc.collection("applied_posts").doc(postId);

  await db.runTransaction(async (tx) => {
    const markerSnap = await tx.get(marker);
    if (markerSnap.exists) {
      // 二重計上はスキップ
      return;
    }

    const incPosts = settlement === "void" ? 0 : 1;
    const incHit   = settlement === "hit" ? 1 : 0;

    // 既存の「全リーグ合算（トップレベル）」は維持
    const baseUpdate: any = {
      date: dateKey,
      posts: FieldValue.increment(incPosts),
      hit: FieldValue.increment(incHit),
      units: FieldValue.increment(resultUnits),
      updatedAt: FieldValue.serverTimestamp(),

      // all バケット（全リーグ合算）
      all: {
        posts: FieldValue.increment(incPosts),
        hit: FieldValue.increment(incHit),
        units: FieldValue.increment(resultUnits),
      },
    };
    baseUpdate.createdPosts = FieldValue.increment(1);

    // ★ 平均オッズは「hit のときだけ」積み上げる
    if (settlement === "hit") {
      baseUpdate.oddsSum = FieldValue.increment(usedOdds);
      baseUpdate.oddsCnt = FieldValue.increment(1);

      baseUpdate.all.oddsSum = FieldValue.increment(usedOdds);
      baseUpdate.all.oddsCnt = FieldValue.increment(1);
    }

    // B1 専用バケット
    if (leagueKey === "b1") {
      baseUpdate.b1 = {
        posts: FieldValue.increment(incPosts),
        hit: FieldValue.increment(incHit),
        units: FieldValue.increment(resultUnits),
      };

      if (settlement === "hit") {
        baseUpdate.b1.oddsSum = FieldValue.increment(usedOdds);
        baseUpdate.b1.oddsCnt = FieldValue.increment(1);
      }
    }

    // J1 専用バケット
    if (leagueKey === "j1") {
      baseUpdate.j1 = {
        posts: FieldValue.increment(incPosts),
        hit: FieldValue.increment(incHit),
        units: FieldValue.increment(resultUnits),
      };

      if (settlement === "hit") {
        baseUpdate.j1.oddsSum = FieldValue.increment(usedOdds);
        baseUpdate.j1.oddsCnt = FieldValue.increment(1);
      }
    }

    tx.set(dailyDoc, baseUpdate, { merge: true });
    tx.set(marker, { at: FieldValue.serverTimestamp() });
  });

  // ✅ 投稿イベントがあったタイミングでも 7d/30d/all を最新にしておく
  await recomputeUserStatsFromDaily(uid);
}

/* ============================================================================
 * 任意期間の合算ヘルパー（ランキング etc. 用）
 * ==========================================================================*/

/**
 * ✅ カレンダー範囲（JST日付ベース）で user_stats_daily を合算する汎用ヘルパー
 * - start: 含む / end: 含まない（[start, end)）
 * - start/end は「JST の 0:00 を指す UTC Date」を想定
 *
 * - ★ league: "all" | "b1" | "j1"
 *   - "all": v.all があれば優先、それがなければ従来どおりトップレベルを使う
 *   - "b1"/"j1": v.b1 / v.j1 を見る（無ければ 0 扱い）
 */
export async function getBucketForDateRangeJst(
  uid: string,
  start: Date,
  end: Date,
  league: "all" | "b1" | "j1" = "all"
): Promise<Bucket> {
  const db = getFirestore();
  const coll = db.collection("user_stats_daily");

  let bucket: Bucket = { posts: 0, hit: 0, units: 0, oddsSum: 0, oddsCnt: 0 };
  let postsTotal = 0;

  const ONE_DAY = 24 * 60 * 60 * 1000;

  for (let t = start.getTime(); t < end.getTime(); t += ONE_DAY) {
    const d = new Date(t);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const key = `${yyyy}-${mm}-${dd}`;

    const snap = await coll.doc(`${uid}_${key}`).get();
    if (!snap.exists) continue;

    const v = snap.data() as any;

    let src: any;
    if (league === "all") {
      // all バケットがあればそれを優先、無ければ従来のトップレベルを使う
      src = v.all ?? v;
    } else if (league === "b1") {
      src = v.b1;
    } else {
      src = v.j1;
    }

    if (!src) continue;

    bucket.posts   += src.posts   || 0;
    bucket.hit     += src.hit     || 0;
    bucket.units   += src.units   || 0;
    bucket.oddsSum += src.oddsSum || 0;
    bucket.oddsCnt += src.oddsCnt || 0;

    postsTotal += v.createdPosts || 0;
  }

  bucket.postsTotal = postsTotal;
  return bucket;
}

/** ============================================================================
 * ★ 追加：全ユーザーの user_stats を毎日再計算するヘルパー
 * ============================================================================
 */

// 全ユーザーをループして daily → 7d/30d/all を再計算
export const recomputeAllUsersDaily = onSchedule(
  {
    schedule: "0 4 * * *", // 毎日 JST 13:00（UTC 4:00）
    timeZone: "Asia/Tokyo",
  },
  async () => {
    const db = getFirestore();

    const usersSnap = await db.collection("users").select().get();
    console.log(`⭐ Daily refresh users: ${usersSnap.size}`);

    for (const doc of usersSnap.docs) {
      const uid = doc.id;
      try {
        await recomputeUserStatsFromDaily(uid);
        console.log(` updated: ${uid}`);
      } catch (err) {
        console.error(` error updating: ${uid}`, err);
      }
    }

    console.log("🎉 Daily stats refresh completed.");
  }
);
