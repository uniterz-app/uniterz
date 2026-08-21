import { getFirestore, Timestamp } from "firebase-admin/firestore";
import {
  markGamePushNotified,
  sendExpoPushToUids,
  type SendTarget,
} from "./sendExpoPush";
import { resolveGameMatchupCopy } from "./pushNotificationCopy";

const PUSH_LEAGUES = ["nba", "bj", "j1", "pl", "wc"] as const;
const LOOKAHEAD_LIMIT = 40;

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

function targetsFromPredictorUids(
  gameId: string,
  uids: unknown
): SendTarget[] {
  if (!Array.isArray(uids)) return [];
  const out: SendTarget[] = [];
  const seen = new Set<string>();
  for (const raw of uids) {
    if (typeof raw !== "string" || !raw.trim()) continue;
    const uid = raw.trim();
    if (seen.has(uid)) continue;
    seen.add(uid);
    out.push({
      uid,
      data: { type: "prediction_deadline", gameId, postId: "" },
    });
  }
  return out;
}

export async function runNotifyPredictionDeadlineCron(): Promise<void> {
  const firestore = getFirestore();
  const now = Date.now();
  const until = new Date(now + 70 * 60 * 1000);

  const leagueSnaps = await Promise.all(
    PUSH_LEAGUES.map((league) =>
      firestore
        .collection("games")
        .where("league", "==", league)
        .where("startAtJst", ">=", Timestamp.fromMillis(now))
        .where("startAtJst", "<=", Timestamp.fromDate(until))
        .limit(LOOKAHEAD_LIMIT)
        .get()
    )
  );
  const gameDocs = leagueSnaps.flatMap((snap) => snap.docs);

  for (const gameDoc of gameDocs) {
    const gameData = gameDoc.data();
    if (gameData.final === true) continue;
    const start =
      gameData.startAtJst instanceof Timestamp
        ? gameData.startAtJst.toMillis()
        : typeof gameData.startAtJst?.toMillis === "function"
          ? gameData.startAtJst.toMillis()
          : 0;
    if (start <= now) continue;
    const remaining = start - now;
    const bucket = BUCKETS.find(
      (b) => remaining >= b.minMs && remaining <= b.maxMs
    );
    if (!bucket) continue;
    if (gameData[bucket.field]) continue;

    const gameId = gameDoc.id;
    const targets = targetsFromPredictorUids(gameId, gameData.predictorUids);
    if (targets.length === 0) {
      await markGamePushNotified(gameId, bucket.field);
      continue;
    }

    const matchup = resolveGameMatchupCopy(gameData);
    const result = await sendExpoPushToUids({
      type: "prediction_deadline",
      targets,
      matchup,
      predictionDeadlineMinutes: bucket.minutes,
    });

    await markGamePushNotified(gameId, bucket.field);
    console.log(
      `[notifyPredictionDeadlineCron] game=${gameId} min=${bucket.minutes} sent=${result.sent} targets=${targets.length}`
    );
  }
}
