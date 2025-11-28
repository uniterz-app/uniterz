// functions/src/trend/games.aggregate.ts

import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
// ❗ shared.ts の export が不完全でも動作するように * で吸収
import * as Shared from "./shared";

const decayFactor = Shared.decayFactor;
const hoursSince = Shared.hoursSince;
const tsHoursAgo = Shared.tsHoursAgo;

type GameEvent = {
  type: "click_card" | "open_predictions" | "create_prediction" | "predict";
  gameId: string;
  league: "B1" | "J1" | string;
  ts?: number;      // epoch ms (旧クライアント)
  at?: Timestamp;   // Timestamp (新クライアント)
};

const NORMALIZE_TYPE = (t: string) => {
  const s = (t || "").trim();
  if (s === "predict") return "create_prediction"; // 互換
  return s;
};

const BASE_WEIGHT: Record<
  "click_card" | "open_predictions" | "create_prediction",
  number
> = {
  click_card: 1,
  open_predictions: 1,
  create_prediction: 3,
};

type BucketKey = string; // "B1:gameId"
type Bucket = {
  league: string;
  gameId: string;
  raw: number;
  score: number;
  lastAt?: Timestamp;
  clicks: number;
  opens: number;
  creates: number;
};

/* -----------------------------------------------------
 * games/{id} の status をまとめて取得
 * ---------------------------------------------------*/
async function fetchGameStatusMap(gameIds: string[]) {
  const db = getFirestore();

  const uniqIds = Array.from(new Set(gameIds)).filter(Boolean);
  const statusMap = new Map<string, string | null>();

  if (uniqIds.length === 0) return statusMap;

  const snaps = await Promise.all(
    uniqIds.map((id) => db.doc(`games/${id}`).get())
  );

  for (const snap of snaps) {
    if (!snap.exists) continue;
    const data = snap.data() as any;

    const status: string | null =
      (data.status as string | undefined) ??
      (data.game?.status as string | undefined) ??
      null;

    statusMap.set(snap.id, status);
  }

  return statusMap;
}

/* -----------------------------------------------------
 * main function
 * ---------------------------------------------------*/
export async function aggregateGamesTrend() {
  const db = getFirestore();

  const WINDOW_HOURS = 24;
  const sinceMs = Date.now() - WINDOW_HOURS * 60 * 60 * 1000;

  const sinceTimestamp = tsHoursAgo(WINDOW_HOURS);

  // ts (number) 版
  const qTs = db
    .collection("events_game")
    .where("ts", ">=", sinceMs)
    .orderBy("ts", "desc");

  // at (Timestamp) 版
  const qAt = db
    .collection("events_game")
    .where("at", ">=", sinceTimestamp)
    .orderBy("at", "desc");

  const [snapTs, snapAt] = await Promise.all([qTs.get(), qAt.get()]);

  // 重複排除
  const seen = new Set<string>();
  const docs = [...snapTs.docs, ...snapAt.docs].filter((d) => {
    if (seen.has(d.id)) return false;
    seen.add(d.id);
    return true;
  });

  const buckets = new Map<BucketKey, Bucket>();

  for (const doc of docs) {
    const e = doc.data() as GameEvent;

    const typeNorm = NORMALIZE_TYPE(e.type) as keyof typeof BASE_WEIGHT;
    if (!(typeNorm in BASE_WEIGHT)) continue;

    const gameId = String(e.gameId || "").trim();
    const league = (e.league || "").toUpperCase();

    if (!gameId || !league) continue;
    if (league !== "B1" && league !== "J1") continue;

    // イベント時刻
    let at: Timestamp;
    if (typeof e.ts === "number" && Number.isFinite(e.ts)) {
      at = Timestamp.fromMillis(e.ts);
    } else if (e.at instanceof Timestamp) {
      at = e.at;
    } else {
      at = doc.createTime as unknown as Timestamp;
    }

    const hrs = hoursSince(at);
    const weight = BASE_WEIGHT[typeNorm] * decayFactor(hrs);

    const key: BucketKey = `${league}:${gameId}`;
    const b =
      buckets.get(key) ??
      {
        league,
        gameId,
        raw: 0,
        score: 0,
        lastAt: at,
        clicks: 0,
        opens: 0,
        creates: 0,
      };

    b.raw += BASE_WEIGHT[typeNorm];
    b.score += weight;
    b.lastAt =
      !b.lastAt || at.toMillis() > b.lastAt.toMillis() ? at : b.lastAt;

    if (typeNorm === "click_card") b.clicks++;
    if (typeNorm === "open_predictions") b.opens++;
    if (typeNorm === "create_prediction") b.creates++;

    buckets.set(key, b);
  }

  /* -----------------------------------------------------
   * ★ status === "final" の試合は除外
   * ---------------------------------------------------*/
  const gameIds = Array.from(buckets.values()).map((b) => b.gameId);
  const statusMap = await fetchGameStatusMap(gameIds);

  const filtered = new Map<BucketKey, Bucket>();
  for (const [key, b] of buckets) {
    const st = statusMap.get(b.gameId);
    if (st && st.toLowerCase() === "final") continue; // 除外
    filtered.set(key, b);
  }

  /* -----------------------------------------------------
   * リーグ別にまとめる
   * ---------------------------------------------------*/
  const byLeague = new Map<string, Bucket[]>();
  for (const b of filtered.values()) {
    const arr = byLeague.get(b.league) ?? [];
    arr.push(b);
    byLeague.set(b.league, arr);
  }

  /* -----------------------------------------------------
   * TOP 8 に絞る
   * ---------------------------------------------------*/
  const TOP_N = 8;
  const result: Record<string, any[]> = {};

  for (const [league, arr] of byLeague.entries()) {
    arr.sort((a, z) => z.score - a.score);

    result[league] = arr.slice(0, TOP_N).map((b) => ({
      gameId: b.gameId,
      league: b.league,
      score: Number(b.score.toFixed(4)),
      raw: b.raw,
      lastAt: b.lastAt,
      clicks: b.clicks,
      opens: b.opens,
      creates: b.creates,
    }));
  }

  /* -----------------------------------------------------
   * Firestore 保存
   * ---------------------------------------------------*/
  const payload = {
    updatedAt: FieldValue.serverTimestamp(),
    windowHours: WINDOW_HOURS,
    ...result,
  };

  await db.collection("trend_cache").doc("games").set(payload);

  return {
    ok: true,
    counts: Object.fromEntries(
      [...byLeague.entries()].map(([k, v]) => [k, v.length])
    ),
  };
}
