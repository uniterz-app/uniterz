import { getFirestore, Timestamp } from "firebase-admin/firestore";
import {
  markGamePushNotified,
  sendExpoPushToUids,
  type SendTarget,
} from "./sendExpoPush";
import { resolveGameMatchupCopy } from "./pushNotificationCopy";

const PUSH_LEAGUES = ["nba", "bj", "j1", "pl", "wc"] as const;
const LOOKAHEAD_LIMIT = 40;
/** 今日〜直近スレートで予想している人を「未予想リマインド」対象の母集団にする */
const ACTIVE_SLATE_MS = 24 * 60 * 60 * 1000;
const ACTIVE_SLATE_LIMIT = 120;

type DeadlineBucket = {
  minutes: 10 | 30 | 60;
  minMs: number;
  maxMs: number;
  field:
    | "pushNotifiedDeadline60At"
    | "pushNotifiedDeadline30At"
    | "pushNotifiedDeadline10At";
};

const BUCKETS: DeadlineBucket[] = [
  {
    minutes: 60,
    minMs: 55 * 60 * 1000,
    maxMs: 70 * 60 * 1000,
    field: "pushNotifiedDeadline60At",
  },
  {
    minutes: 30,
    minMs: 25 * 60 * 1000,
    maxMs: 40 * 60 * 1000,
    field: "pushNotifiedDeadline30At",
  },
  {
    minutes: 10,
    minMs: 5 * 60 * 1000,
    maxMs: 15 * 60 * 1000,
    field: "pushNotifiedDeadline10At",
  },
];

type GameRow = {
  id: string;
  startMs: number;
  predictorUids: Set<string>;
  matchup: ReturnType<typeof resolveGameMatchupCopy>;
};

function startMsFromGame(data: FirebaseFirestore.DocumentData): number {
  const startAt = data.startAtJst;
  if (startAt instanceof Timestamp) return startAt.toMillis();
  if (startAt && typeof startAt.toMillis === "function") return startAt.toMillis();
  return 0;
}

function uidSetFromPredictorUids(uids: unknown): Set<string> {
  const out = new Set<string>();
  if (!Array.isArray(uids)) return out;
  for (const raw of uids) {
    if (typeof raw === "string" && raw.trim()) out.add(raw.trim());
  }
  return out;
}

/**
 * 予想締切プッシュ:
 * - 対象は「直近スレートで何か予想している人」のうち、当該試合は未予想
 * - 同じ分前バケツ内の未予想はユーザーごとに1通にまとめる
 */
export async function runNotifyPredictionDeadlineCron(): Promise<void> {
  const firestore = getFirestore();
  const now = Date.now();
  const deadlineUntil = new Date(now + 70 * 60 * 1000);
  const slateUntil = new Date(now + ACTIVE_SLATE_MS);

  const [deadlineSnaps, slateSnaps] = await Promise.all([
    Promise.all(
      PUSH_LEAGUES.map((league) =>
        firestore
          .collection("games")
          .where("league", "==", league)
          .where("startAtJst", ">=", Timestamp.fromMillis(now))
          .where("startAtJst", "<=", Timestamp.fromDate(deadlineUntil))
          .limit(LOOKAHEAD_LIMIT)
          .get()
      )
    ),
    Promise.all(
      PUSH_LEAGUES.map((league) =>
        firestore
          .collection("games")
          .where("league", "==", league)
          .where("startAtJst", ">=", Timestamp.fromMillis(now))
          .where("startAtJst", "<=", Timestamp.fromDate(slateUntil))
          .limit(ACTIVE_SLATE_LIMIT)
          .get()
      )
    ),
  ]);

  const activePredictors = new Set<string>();
  for (const snap of slateSnaps.flat()) {
    for (const doc of snap.docs) {
      const data = doc.data();
      if (data.final === true) continue;
      for (const uid of uidSetFromPredictorUids(data.predictorUids)) {
        activePredictors.add(uid);
      }
    }
  }

  if (activePredictors.size === 0) {
    console.log("[notifyPredictionDeadlineCron] no active predictors on slate");
    return;
  }

  const deadlineGames: GameRow[] = [];
  for (const snap of deadlineSnaps.flat()) {
    for (const doc of snap.docs) {
      const data = doc.data();
      if (data.final === true) continue;
      const startMs = startMsFromGame(data);
      if (startMs <= now) continue;
      deadlineGames.push({
        id: doc.id,
        startMs,
        predictorUids: uidSetFromPredictorUids(data.predictorUids),
        matchup: resolveGameMatchupCopy(data),
      });
    }
  }

  deadlineGames.sort((a, b) => a.startMs - b.startMs);

  for (const bucket of BUCKETS) {
    const gamesInBucket = deadlineGames.filter((g) => {
      const remaining = g.startMs - now;
      return remaining >= bucket.minMs && remaining <= bucket.maxMs;
    });
    if (gamesInBucket.length === 0) continue;

    // 既にこのバケツで通知済みの試合は除外（doc 再読）
    const pendingGames: GameRow[] = [];
    for (const game of gamesInBucket) {
      const fresh = await firestore.doc(`games/${game.id}`).get();
      const data = fresh.data();
      if (!data || data[bucket.field]) continue;
      pendingGames.push(game);
    }
    if (pendingGames.length === 0) continue;

    type Pending = { games: GameRow[] };
    const byUid = new Map<string, Pending>();
    for (const game of pendingGames) {
      for (const uid of activePredictors) {
        if (game.predictorUids.has(uid)) continue;
        const row = byUid.get(uid) ?? { games: [] };
        row.games.push(game);
        byUid.set(uid, row);
      }
    }

    const targets: SendTarget[] = [];
    const matchupByUid = new Map<
      string,
      ReturnType<typeof resolveGameMatchupCopy> & { pendingCount: number }
    >();

    for (const [uid, pending] of byUid) {
      const games = pending.games.slice().sort((a, b) => a.startMs - b.startMs);
      const lead = games[0]!;
      targets.push({
        uid,
        data: {
          type: "prediction_deadline",
          gameId: lead.id,
          postId: "",
        },
      });
      matchupByUid.set(uid, {
        ...lead.matchup,
        pendingCount: games.length,
      });
    }

    if (targets.length > 0) {
      // ユーザーごとに pendingCount / lead matchup が違うので1人ずつ送る
      let sent = 0;
      for (const target of targets) {
        const matchup = matchupByUid.get(target.uid);
        const result = await sendExpoPushToUids({
          type: "prediction_deadline",
          targets: [target],
          matchup,
          predictionDeadlineMinutes: bucket.minutes,
        });
        sent += result.sent;
      }
      console.log(
        `[notifyPredictionDeadlineCron] min=${bucket.minutes} sent=${sent} users=${targets.length} games=${pendingGames.length}`
      );
    } else {
      console.log(
        `[notifyPredictionDeadlineCron] min=${bucket.minutes} no unpredicted targets games=${pendingGames.length}`
      );
    }

    for (const game of pendingGames) {
      await markGamePushNotified(game.id, bucket.field);
    }
  }
}
