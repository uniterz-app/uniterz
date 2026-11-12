// functions/src/rankings/buildNbaSmartMoneyMarkets.ts
// 先週の Pick Up 週間ランキング（totalPoints）上位 5% の人だけの予想分布（Pro Insight 用）。
// コホート: nbaSmartMoneyCohort/{weekLabel}（+ members/{uid}）
// 市場:     nbaSmartMoneyMarkets/{gameId}
// 投稿の増減は Next の posts トランザクション（lib/predict/smartMoneyMarketServer.ts）。
// ここは日次でコホートを作り、先 7 日の試合を数え直して上書きする。

import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { dateKeyET, previousLabel, weekStartDateKeyET } from "./nbaPeriod";
import { GAME_PREDICTORS_COLLECTION } from "../notifications/gamePredictors";
import { parseMarketSide, type LiveMarketCounts } from "../liveGameMarket";

export const SMART_MONEY_COHORT_COLLECTION = "nbaSmartMoneyCohort";
export const SMART_MONEY_MARKETS_COLLECTION = "nbaSmartMoneyMarkets";

/** 上位 何% まで（rank / count × 100 がこれ以下） */
const SMART_MONEY_TOP_PERCENT = 5;
/** 数え直す試合の先読み */
const RECOUNT_LOOKAHEAD_MS = 7 * 24 * 60 * 60 * 1000;
const RECOUNT_GAME_LIMIT = 120;

type Cohort = {
  weekLabel: string;
  uids: string[];
};

function db() {
  return getFirestore();
}

function readUidList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.length > 0);
}

/** 先週の確定スナップショットから上位 5% を書く。既存メンバーで外れた人は消す */
async function writeCohort(weekLabel: string): Promise<Cohort> {
  const firestore = db();
  const snap = await firestore
    .collection("period_ranking_snapshots")
    .doc(`nba_weekly_${weekLabel}_totalPoints`)
    .get();
  const data = snap.data() ?? {};
  const count = typeof data.count === "number" ? data.count : 0;
  const rewardableMaxRank =
    typeof data.rewardableMaxRank === "number" ? data.rewardableMaxRank : 0;
  const ranks =
    data.ranks && typeof data.ranks === "object"
      ? (data.ranks as Record<string, unknown>)
      : {};

  const members: Array<{ uid: string; rank: number }> = [];
  if (count > 0) {
    for (const [uid, raw] of Object.entries(ranks)) {
      const rank = typeof raw === "number" ? raw : NaN;
      if (!Number.isFinite(rank) || rank < 1) continue;
      // 0 点の同順位まで入れない
      if (rank > rewardableMaxRank) continue;
      if ((rank / count) * 100 <= SMART_MONEY_TOP_PERCENT) {
        members.push({ uid, rank });
      }
    }
  }
  members.sort((a, b) => a.rank - b.rank);
  const cutoffRank = members.length ? members[members.length - 1].rank : null;
  const uids = members.map((m) => m.uid);

  const cohortRef = firestore.collection(SMART_MONEY_COHORT_COLLECTION).doc(weekLabel);
  const prev = await cohortRef.get();
  const nextSet = new Set(uids);
  const removed = readUidList(prev.data()?.uids).filter((u) => !nextSet.has(u));

  const writes: Array<(b: FirebaseFirestore.WriteBatch) => void> = [];
  for (const m of members) {
    writes.push((b) =>
      b.set(cohortRef.collection("members").doc(m.uid), {
        rank: m.rank,
        cohortSize: members.length,
      })
    );
  }
  for (const uid of removed) {
    writes.push((b) => b.delete(cohortRef.collection("members").doc(uid)));
  }
  for (let i = 0; i < writes.length; i += 400) {
    const batch = firestore.batch();
    for (const w of writes.slice(i, i + 400)) w(batch);
    await batch.commit();
  }

  await cohortRef.set({
    weekLabel,
    division: "standard",
    metric: "totalPoints",
    topPercent: SMART_MONEY_TOP_PERCENT,
    count,
    cutoffRank,
    memberCount: members.length,
    uids,
    builtAt: FieldValue.serverTimestamp(),
  });

  console.log(
    `[buildNbaSmartMoneyMarkets] cohort ${weekLabel} members=${members.length}/${count} cutoffRank=${cutoffRank}`
  );
  return { weekLabel, uids };
}

/**
 * 1 試合を数え直す。gamePredictors と市場 doc をトランザクションで読むので、
 * 同時に走る投稿のトランザクション（同じ 2 doc を読み書き）と順番が付く。
 */
async function recountGame(gameId: string, cohort: Cohort): Promise<void> {
  const firestore = db();
  const memberSet = new Set(cohort.uids);
  const predictorsRef = firestore.collection(GAME_PREDICTORS_COLLECTION).doc(gameId);
  const marketRef = firestore.collection(SMART_MONEY_MARKETS_COLLECTION).doc(gameId);

  await firestore.runTransaction(async (tx) => {
    const predictorsSnap = await tx.get(predictorsRef);
    await tx.get(marketRef);
    const uids = readUidList(predictorsSnap.data()?.uids).filter((u) =>
      memberSet.has(u)
    );
    const counts: LiveMarketCounts = { home: 0, away: 0, draw: 0 };
    if (uids.length) {
      const postSnaps = await tx.getAll(
        ...uids.map((u) => firestore.collection("posts").doc(`v2_${u}_${gameId}`))
      );
      for (const p of postSnaps) {
        if (!p.exists) continue;
        const side = parseMarketSide(p.data()?.prediction?.winner);
        if (side) counts[side] += 1;
      }
    }
    tx.set(marketRef, {
      gameId,
      weekLabel: cohort.weekLabel,
      pickCounts: counts,
      predictorCount: counts.home + counts.away + counts.draw,
      cohortSize: cohort.uids.length,
      recountedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

/**
 * 日次（期間スナップショットの後）。
 * - Eastern 月曜は前週が確定した日なのでコホートを書き直す
 * - それ以外はコホート doc が無いときだけ作る
 * - 先 7 日の NBA 試合の市場 doc を数え直す（コホート 0 人なら書かない）
 */
export async function buildNbaSmartMoneyMarkets(now: Date = new Date()): Promise<void> {
  const firestore = db();
  const thisWeek = weekStartDateKeyET(now);
  const weekLabel = previousLabel("weekly", thisWeek);
  const isMonday = dateKeyET(now) === thisWeek;

  const cohortSnap = await firestore
    .collection(SMART_MONEY_COHORT_COLLECTION)
    .doc(weekLabel)
    .get();
  const cohort: Cohort =
    isMonday || !cohortSnap.exists
      ? await writeCohort(weekLabel)
      : { weekLabel, uids: readUidList(cohortSnap.data()?.uids) };

  if (!cohort.uids.length) return;

  const gamesSnap = await firestore
    .collection("games")
    .where("league", "==", "nba")
    .where("startAtJst", ">=", Timestamp.fromMillis(now.getTime()))
    .where("startAtJst", "<=", Timestamp.fromMillis(now.getTime() + RECOUNT_LOOKAHEAD_MS))
    .select()
    .limit(RECOUNT_GAME_LIMIT)
    .get();

  let ok = 0;
  for (const g of gamesSnap.docs) {
    try {
      await recountGame(g.id, cohort);
      ok += 1;
    } catch (err) {
      console.error(`[buildNbaSmartMoneyMarkets] recount failed ${g.id}`, err);
    }
  }
  console.log(
    `[buildNbaSmartMoneyMarkets] ${weekLabel} recounted ${ok}/${gamesSnap.size} games`
  );
}
