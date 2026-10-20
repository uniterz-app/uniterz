import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { sendExpoPushToUids, type SendTarget } from "./sendExpoPush";
import { resolveGameMatchupCopy } from "./pushNotificationCopy";
import type { GameMatchupCopyInput } from "./pushNotificationCopy";
import { loadGamePredictorUids } from "./gamePredictors";
import { loadUidsWhoPredictedOnDateFromDaily } from "./loadUidsWhoPredictedOnDateFromDaily";

const PUSH_LEAGUES = ["nba", "bj", "j1", "pl", "wc"] as const;

/** lib/predict/seasonPredictDeadline.ts と同じ開幕ティップ */
const SEASON_PREDICT_SUBMIT_DEADLINE_AT_MS = Date.parse(
  "2026-10-21T04:00:00+09:00"
);

function jstDateKey(ms: number): string {
  const j = new Date(ms + 9 * 60 * 60 * 1000);
  const y = j.getUTCFullYear();
  const m = String(j.getUTCMonth() + 1).padStart(2, "0");
  const d = String(j.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addJstDays(dateKey: string, days: number): string {
  const ms = Date.parse(`${dateKey}T00:00:00+09:00`) + days * 24 * 60 * 60 * 1000;
  return jstDateKey(ms);
}

function nbaSeasonKeyFromMs(ms: number): string {
  const j = new Date(ms + 9 * 60 * 60 * 1000);
  const y = j.getUTCFullYear();
  const month = j.getUTCMonth() + 1;
  const startYear = month >= 7 ? y : y - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

async function claimDispatch(id: string): Promise<boolean> {
  const ref = getFirestore().doc(`pushDispatch/${id}`);
  try {
    await ref.create({
      createdAt: FieldValue.serverTimestamp(),
    });
    return true;
  } catch (err: unknown) {
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as { code?: number | string }).code
        : null;
    if (code === 6 || code === "already-exists" || code === "ALREADY_EXISTS") {
      return false;
    }
    throw err;
  }
}

async function recentPredictorUids(todayKey: string): Promise<string[]> {
  const keys = [];
  for (let i = 0; i < 7; i++) keys.push(addJstDays(todayKey, -i));
  const lists = await Promise.all(
    keys.map((key) => loadUidsWhoPredictedOnDateFromDaily(key))
  );
  return [...new Set(lists.flat())];
}

/**
 * 毎日 21:00 JST。
 * - 翌日の未予想がある人へ「明日の予想をしましょう」
 * - シーズン予想の締切日が翌日なら、未提出者へ「明日締め切りです」
 * 対象は直近7日に予想した人。予想締切通知の設定がオフなら送らない。
 */
export async function runNotifyEveningPredictNudgesCron(
  nowMs: number = Date.now()
): Promise<void> {
  const firestore = getFirestore();
  const todayKey = jstDateKey(nowMs);
  const tomorrowKey = addJstDays(todayKey, 1);
  const tomorrowStart = Date.parse(`${tomorrowKey}T00:00:00+09:00`);
  const tomorrowEnd = tomorrowStart + 24 * 60 * 60 * 1000 - 1;

  const uids = await recentPredictorUids(todayKey);
  if (uids.length === 0) {
    console.log("[eveningPredictNudges] no recent predictors");
    return;
  }

  try {
    await sendTomorrowSlateNudge({
      firestore,
      uids,
      tomorrowKey,
      tomorrowStart,
      tomorrowEnd,
      nowMs,
    });
  } catch (err) {
    console.error("[eveningPredictNudges] slate failed", err);
  }
  try {
    await sendSeasonDeadlineNudge({
      firestore,
      uids,
      tomorrowKey,
      nowMs,
    });
  } catch (err) {
    console.error("[eveningPredictNudges] season failed", err);
  }
}

async function sendTomorrowSlateNudge(input: {
  firestore: FirebaseFirestore.Firestore;
  uids: string[];
  tomorrowKey: string;
  tomorrowStart: number;
  tomorrowEnd: number;
  nowMs: number;
}): Promise<void> {
  const snaps = await Promise.all(
    PUSH_LEAGUES.map((league) =>
      input.firestore
        .collection("games")
        .where("league", "==", league)
        .where("startAtJst", ">=", Timestamp.fromMillis(input.tomorrowStart))
        .where("startAtJst", "<=", Timestamp.fromMillis(input.tomorrowEnd))
        .limit(40)
        .get()
    )
  );
  const games = snaps
    .flatMap((snap) => snap.docs)
    .map((doc) => ({ id: doc.id, data: doc.data() }))
    .filter((game) => {
      if (game.data.final === true) return false;
      const start = game.data.startAtJst;
      const ms =
        start instanceof Timestamp
          ? start.toMillis()
          : typeof start?.toMillis === "function"
            ? start.toMillis()
            : 0;
      return ms > input.nowMs;
    });
  if (games.length === 0) {
    console.log("[eveningPredictNudges] no games tomorrow");
    return;
  }

  const predictors = await loadGamePredictorUids(input.firestore, games);
  const byUid = new Map<string, { count: number; lead: GameMatchupCopyInput; gameId: string }>();
  for (const uid of input.uids) {
    const open = games.filter((game) => !predictors.get(game.id)?.has(uid));
    if (open.length === 0) continue;
    const lead = open[0]!;
    byUid.set(uid, {
      count: open.length,
      lead: resolveGameMatchupCopy(lead.data),
      gameId: lead.id,
    });
  }
  if (byUid.size === 0) {
    console.log("[eveningPredictNudges] slate already picked");
    return;
  }

  const claimed = await claimDispatch(`predictionSlateNudge_${input.tomorrowKey}`);
  if (!claimed) {
    console.log("[eveningPredictNudges] slate already sent", input.tomorrowKey);
    return;
  }

  const targets: SendTarget[] = [];
  const matchupByUid = new Map<string, GameMatchupCopyInput>();
  for (const [uid, row] of byUid) {
    targets.push({
      uid,
      data: { type: "prediction_slate_nudge", gameId: row.gameId },
    });
    matchupByUid.set(uid, { ...row.lead, pendingCount: row.count });
  }
  const { sent } = await sendExpoPushToUids({
    type: "prediction_slate_nudge",
    targets,
    matchupByUid,
  });
  console.log(
    `[eveningPredictNudges] slate sent=${sent} users=${targets.length} tomorrow=${input.tomorrowKey}`
  );
}

async function sendSeasonDeadlineNudge(input: {
  firestore: FirebaseFirestore.Firestore;
  uids: string[];
  tomorrowKey: string;
  nowMs: number;
}): Promise<void> {
  if (input.nowMs >= SEASON_PREDICT_SUBMIT_DEADLINE_AT_MS) return;
  const deadlineKey = jstDateKey(SEASON_PREDICT_SUBMIT_DEADLINE_AT_MS);
  if (deadlineKey !== input.tomorrowKey) return;

  const season = nbaSeasonKeyFromMs(SEASON_PREDICT_SUBMIT_DEADLINE_AT_MS);
  const pending = new Map<string, "awards" | "standings" | "both">();
  const chunkSize = 50;
  for (let i = 0; i < input.uids.length; i += chunkSize) {
    const chunk = input.uids.slice(i, i + chunkSize);
    const refs = chunk.flatMap((uid) => [
      input.firestore.doc(`seasonAwardsPredictions/${season}_${uid}`),
      input.firestore.doc(`seasonStandingsPredictions/${season}_${uid}`),
    ]);
    const snaps = await input.firestore.getAll(...refs);
    for (let j = 0; j < chunk.length; j++) {
      const uid = chunk[j]!;
      const awards = snaps[j * 2]?.data()?.isSubmitted === true;
      const standings = snaps[j * 2 + 1]?.data()?.isSubmitted === true;
      if (awards && standings) continue;
      pending.set(
        uid,
        !awards && !standings ? "both" : awards ? "standings" : "awards"
      );
    }
  }
  if (pending.size === 0) {
    console.log("[eveningPredictNudges] season picks complete");
    return;
  }

  const claimed = await claimDispatch(`seasonPredictLastCall_${season}`);
  if (!claimed) {
    console.log("[eveningPredictNudges] season last call already sent");
    return;
  }

  const targets: SendTarget[] = [];
  const matchupByUid = new Map<string, GameMatchupCopyInput>();
  for (const [uid, gap] of pending) {
    targets.push({
      uid,
      data: {
        type: "season_predict_last_call",
        label: gap,
      },
    });
    matchupByUid.set(uid, { seasonGap: gap });
  }
  const { sent } = await sendExpoPushToUids({
    type: "season_predict_last_call",
    targets,
    matchupByUid,
  });
  console.log(`[eveningPredictNudges] season sent=${sent} users=${targets.length}`);
}
