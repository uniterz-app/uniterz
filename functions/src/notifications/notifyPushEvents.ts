import type { QuerySnapshot } from "firebase-admin/firestore";
import {
  markGamePushNotified,
  sendExpoPushToUids,
  uniqueAuthorTargetsFromPosts,
} from "./sendExpoPush";
import { resolveGameMatchupCopy } from "./pushNotificationCopy";

export async function notifyGameFinalPush(input: {
  gameId: string;
  after: Record<string, unknown>;
  postsSnap: QuerySnapshot;
  homeScore: number;
  awayScore: number;
}): Promise<void> {
  if (input.after.pushNotifiedFinalAt) return;

  const targets = uniqueAuthorTargetsFromPosts(
    input.postsSnap.docs,
    "game_final",
    input.gameId
  );
  if (targets.length === 0) {
    await markGamePushNotified(input.gameId, "pushNotifiedFinalAt");
    return;
  }

  const matchup = resolveGameMatchupCopy(input.after, {
    home: input.homeScore,
    away: input.awayScore,
  });

  const result = await sendExpoPushToUids({
    type: "game_final",
    targets,
    matchup,
  });

  if (result.sent > 0 || targets.length === 0) {
    await markGamePushNotified(input.gameId, "pushNotifiedFinalAt");
  }

  console.log(
    `[notifyGameFinalPush] game=${input.gameId} sent=${result.sent} targets=${targets.length}`
  );
}

export async function notifyRankingUpdatedPush(uids: string[]): Promise<void> {
  const unique = [...new Set(uids.filter(Boolean))];
  if (unique.length === 0) return;

  const targets = unique.map((uid) => ({
    uid,
    data: { type: "ranking_updated" as const },
  }));

  const result = await sendExpoPushToUids({
    type: "ranking_updated",
    targets,
  });

  console.log(
    `[notifyRankingUpdatedPush] sent=${result.sent} targets=${targets.length}`
  );
}
