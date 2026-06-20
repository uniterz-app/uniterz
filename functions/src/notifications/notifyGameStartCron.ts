import { getFirestore, Timestamp } from "firebase-admin/firestore";
import {
  markGamePushNotified,
  sendExpoPushToUids,
  uniqueAuthorTargetsFromPosts,
} from "./sendExpoPush";
import { resolveGameMatchupCopy } from "./pushNotificationCopy";

const LOOKAHEAD_MS = 15 * 60 * 1000;

export async function runNotifyGameStartCron(): Promise<void> {
  const firestore = getFirestore();
  const now = new Date();
  const until = new Date(now.getTime() + LOOKAHEAD_MS);

  const gamesSnap = await firestore
    .collection("games")
    .where("startAtJst", ">=", Timestamp.fromDate(now))
    .where("startAtJst", "<=", Timestamp.fromDate(until))
    .get();

  for (const gameDoc of gamesSnap.docs) {
    const gameData = gameDoc.data();
    if (gameData.final === true) continue;
    if (gameData.pushNotifiedStartAt) continue;

    const gameId = gameDoc.id;
    const postsSnap = await firestore
      .collection("posts")
      .where("gameId", "==", gameId)
      .where("schemaVersion", "==", 2)
      .get();

    const targets = uniqueAuthorTargetsFromPosts(
      postsSnap.docs,
      "game_start",
      gameId
    );
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
