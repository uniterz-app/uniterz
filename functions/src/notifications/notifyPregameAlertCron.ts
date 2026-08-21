import { createHash } from "crypto";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import {
  sendExpoPushToUids,
  type SendTarget,
} from "./sendExpoPush";
import {
  resolveGameMatchupCopy,
  type PushNotificationType,
} from "./pushNotificationCopy";

const PUSH_LEAGUES = ["nba", "bj", "j1", "pl", "wc"] as const;
const LOOKAHEAD_MS = 12 * 60 * 60 * 1000;
const LOOKAHEAD_LIMIT = 80;

type PregameKind = "injury_status" | "starter_change" | "pro_insight_update";

function fingerprint(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "object" && !Array.isArray(value) && Object.keys(value as object).length === 0) {
    return null;
  }
  if (Array.isArray(value) && value.length === 0) return null;
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 32);
}

function targetsFromPredictorUids(
  gameId: string,
  type: PushNotificationType,
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
    out.push({ uid, data: { type, gameId, postId: "" } });
  }
  return out;
}

/**
 * 試合 doc に injuryReport / starters / proBrief が入ったあと、差分があれば Pro に送る。
 * 初回はベースラインだけ書いて送らない（取り込み開始時の一斉配信を避ける）。
 * フィールドが無い試合は何もしない。
 */
export async function runNotifyPregameAlertCron(): Promise<void> {
  const firestore = getFirestore();
  const now = Date.now();
  const until = new Date(now + LOOKAHEAD_MS);

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

    const injuryFp = fingerprint(gameData.injuryReport ?? null);
    const starterFp = fingerprint(
      gameData.starters ?? gameData.startingLineup ?? gameData.lineup ?? null
    );
    const insightFp = fingerprint(gameData.proBrief ?? null);

    const prev = (gameData.pushPregame as
      | {
          injuryFp?: string | null;
          starterFp?: string | null;
          insightFp?: string | null;
        }
      | undefined) ?? {};

    const changed: PregameKind[] = [];
    const next = {
      injuryFp: prev.injuryFp ?? null,
      starterFp: prev.starterFp ?? null,
      insightFp: prev.insightFp ?? null,
    };

    if (injuryFp) {
      if (prev.injuryFp && prev.injuryFp !== injuryFp) {
        changed.push("injury_status");
      }
      next.injuryFp = injuryFp;
    }
    if (starterFp) {
      if (prev.starterFp && prev.starterFp !== starterFp) {
        changed.push("starter_change");
      }
      next.starterFp = starterFp;
    }
    if (insightFp) {
      if (prev.insightFp && prev.insightFp !== insightFp) {
        changed.push("pro_insight_update");
      }
      next.insightFp = insightFp;
    }

    const fingerprintChanged =
      next.injuryFp !== (prev.injuryFp ?? null) ||
      next.starterFp !== (prev.starterFp ?? null) ||
      next.insightFp !== (prev.insightFp ?? null);

    if (changed.length === 0) {
      if (fingerprintChanged) {
        await gameDoc.ref.set(
          {
            pushPregame: {
              ...next,
              baselinedAt: Timestamp.now(),
            },
          },
          { merge: true }
        );
      }
      continue;
    }

    const gameId = gameDoc.id;
    const matchup = resolveGameMatchupCopy(gameData);
    const types: PushNotificationType[] =
      changed.length >= 2 ? ["pregame_digest"] : changed;

    for (const type of types) {
      const targets = targetsFromPredictorUids(
        gameId,
        type,
        gameData.predictorUids
      );
      if (targets.length === 0) continue;
      const result = await sendExpoPushToUids({ type, targets, matchup });
      console.log(
        `[notifyPregameAlertCron] game=${gameId} type=${type} sent=${result.sent} targets=${targets.length}`
      );
    }

    await gameDoc.ref.set(
      {
        pushPregame: {
          ...next,
          notifiedAt: Timestamp.now(),
          lastKinds: changed,
        },
      },
      { merge: true }
    );
  }
}
