import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import {
  GAME_PREDICTORS_COLLECTION,
  loadGamePredictorUids,
} from "./gamePredictors";
import {
  markGamePushNotified,
  sendExpoPushToUids,
  type SendTarget,
} from "./sendExpoPush";
import { resolveGameMatchupCopy } from "./pushNotificationCopy";

const LOOKAHEAD_MS = 20 * 60 * 1000;
const LOOKAHEAD_LIMIT = 40;
const PUSH_LEAGUES = ["nba", "bj", "j1", "pl", "wc"] as const;

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
      data: { type: "game_start", gameId, postId: "" },
    });
  }
  return out;
}

/**
 * レガシー: 予想者一覧が無い試合だけ posts から uid を拾う（select のみ）。
 * 新規投稿は posts_v2 で gamePredictors/{gameId}.uids に積む。
 */
async function legacyTargetsFromPosts(
  gameId: string
): Promise<SendTarget[]> {
  const snap = await getFirestore()
    .collection("posts")
    .where("gameId", "==", gameId)
    .where("schemaVersion", "==", 2)
    .select("authorUid")
    .get();
  const byUid = new Map<string, SendTarget>();
  for (const doc of snap.docs) {
    const uid = doc.data()?.authorUid;
    if (typeof uid !== "string" || !uid) continue;
    if (!byUid.has(uid)) {
      byUid.set(uid, {
        uid,
        data: { type: "game_start", gameId, postId: doc.id },
      });
    }
  }
  return [...byUid.values()];
}

export async function runNotifyGameStartCron(): Promise<void> {
  const firestore = getFirestore();
  const now = new Date();
  const until = new Date(now.getTime() + LOOKAHEAD_MS);

  const leagueSnaps = await Promise.all(
    PUSH_LEAGUES.map((league) =>
      firestore
        .collection("games")
        .where("league", "==", league)
        .where("startAtJst", ">=", Timestamp.fromDate(now))
        .where("startAtJst", "<=", Timestamp.fromDate(until))
        .limit(LOOKAHEAD_LIMIT)
        .get()
    )
  );
  const gameDocs = leagueSnaps.flatMap((snap) => snap.docs);

  for (const gameDoc of gameDocs) {
    const gameData = gameDoc.data();
    if (gameData.final === true) continue;
    if (gameData.pushNotifiedStartAt) continue;

    const gameId = gameDoc.id;
    const predictorUids = [
      ...((
        await loadGamePredictorUids(firestore, [{ id: gameId, data: gameData }])
      ).get(gameId) ?? []),
    ];
    let targets = targetsFromPredictorUids(gameId, predictorUids);
    if (targets.length === 0) {
      targets = await legacyTargetsFromPosts(gameId);
      if (targets.length > 0) {
        await firestore
          .collection(GAME_PREDICTORS_COLLECTION)
          .doc(gameId)
          .set(
            { uids: FieldValue.arrayUnion(...targets.map((t) => t.uid)) },
            { merge: true }
          );
      }
    }

    if (targets.length === 0) {
      await markGamePushNotified(gameId, "pushNotifiedStartAt");
      continue;
    }

    const matchup = resolveGameMatchupCopy(gameData);
    const result = await sendExpoPushToUids({
      type: "game_start",
      targets,
      matchup,
    });

    if (result.sent > 0 || targets.length === 0) {
      await markGamePushNotified(gameId, "pushNotifiedStartAt");
    }

    console.log(
      `[notifyGameStartCron] game=${gameId} sent=${result.sent} targets=${targets.length}`
    );
  }
}
