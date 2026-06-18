/**
 * WC 投稿ユーザーだけを対象に、確定済み WC 投稿から football 連勝を再計算する。
 * タイムラインはキックオフ順（games.startAtJst）。
 * user_stats_v2 全件は走査しない。NBA（basketball）の連勝は既存値を維持する。
 *
 * 対象: league=wc かつ status=final の投稿がある authorUid
 *
 * 使い方（プロジェクトルート、service-account.json 必須）:
 *   npx tsx scripts/backfill-wc-football-streak.ts --dry-run
 *   npx tsx scripts/backfill-wc-football-streak.ts --uid=<UID>
 *   npx tsx scripts/backfill-wc-football-streak.ts
 */

import adminPkg from "firebase-admin";
import fs from "fs";
import {
  buildKickoffTimeline,
  loadGamesById,
  loadWcPostRowsForUid,
  replayFootballStreak,
} from "./lib/wcStreakReplay";

const admin = adminPkg as typeof import("firebase-admin");

const DRY_RUN = process.argv.includes("--dry-run");
const uidArg = process.argv.find((a) => a.startsWith("--uid="));
const targetUid = uidArg ? uidArg.slice("--uid=".length).trim() : "";

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function readBasketballState(data: Record<string, unknown> | undefined) {
  const sb = data?.streakBySport as
    | { basketball?: unknown; football?: unknown }
    | undefined;
  const mb = data?.maxWinStreakBySport as
    | { basketball?: unknown; football?: unknown }
    | undefined;

  const basketball =
    typeof sb?.basketball === "number"
      ? sb.basketball
      : typeof data?.currentStreak === "number"
        ? data.currentStreak
        : 0;
  const maxBasketball =
    typeof mb?.basketball === "number"
      ? mb.basketball
      : typeof data?.maxWinStreak === "number"
        ? data.maxWinStreak
        : 0;

  return { basketball, maxBasketball };
}

async function loadWcStreakEventsByUid(): Promise<
  Map<string, ReturnType<typeof buildKickoffTimeline>>
> {
  const snap = await db
    .collection("posts")
    .where("league", "==", "wc")
    .where("status", "==", "final")
    .where("schemaVersion", "==", 2)
    .get();

  const rowsByUid = new Map<
    string,
    Awaited<ReturnType<typeof loadWcPostRowsForUid>>
  >();
  const allGameIds = new Set<string>();

  for (const doc of snap.docs) {
    const p = doc.data() as Record<string, unknown>;
    const uid = String(p.authorUid ?? "").trim();
    if (!uid || (targetUid && uid !== targetUid)) continue;

    const stats = p.stats as Record<string, unknown> | undefined;
    if (!stats || stats.countedForRanking === false) continue;
    if (typeof stats.isWin !== "boolean") continue;

    const gameId = String(p.gameId ?? "").trim();
    if (!gameId) continue;

    allGameIds.add(gameId);
    const row = {
      postId: doc.id,
      uid,
      gameId,
      stats,
      detail: (stats.pointsV3Detail as Record<string, unknown>) ?? {},
      startAtJst: p.startAtJst,
      startAt: p.startAt,
      createdAt: p.createdAt,
    };
    if (!rowsByUid.has(uid)) rowsByUid.set(uid, []);
    rowsByUid.get(uid)!.push(row);
  }

  const gameById = await loadGamesById(db, allGameIds);
  const out = new Map<string, ReturnType<typeof buildKickoffTimeline>>();
  for (const [uid, rows] of rowsByUid) {
    out.set(uid, buildKickoffTimeline(rows, gameById));
  }
  return out;
}

(async () => {
  console.log(
    "=== backfill WC football streak (kickoff-order, WC posters only) ==="
  );
  if (DRY_RUN) console.log(">>> DRY RUN\n");

  const eventsByUid = await loadWcStreakEventsByUid();
  console.log(
    `targets: ${eventsByUid.size} user(s) with finalized WC posts (league=wc)\n`
  );

  let updated = 0;
  for (const [uid, events] of eventsByUid) {
    const replay = replayFootballStreak(events);
    const userSnap = await db.doc(`user_stats_v2/${uid}`).get();
    const userData = userSnap.data() as Record<string, unknown> | undefined;
    const { basketball, maxBasketball } = readBasketballState(userData);

    const prevFootball =
      typeof (userData?.streakBySport as { football?: number } | undefined)
        ?.football === "number"
        ? (userData!.streakBySport as { football: number }).football
        : typeof userData?.streakFootball === "number"
          ? userData.streakFootball
          : 0;

    console.log(
      [
        uid,
        `wcGames=${events.length}`,
        `football ${prevFootball} → ${replay.football}`,
        `activeWin=${replay.activeWinStreakFootball}`,
        `maxWin=${replay.maxFootball}`,
        `basketball kept=${basketball}`,
      ].join(" | ")
    );

    if (DRY_RUN) {
      updated++;
      continue;
    }

    const streakBySport = { basketball, football: replay.football };
    const maxWinStreakBySport = {
      basketball: maxBasketball,
      football: replay.maxFootball,
    };

    const batch = db.batch();

    batch.set(
      db.doc(`user_stats_v2/${uid}`),
      {
        streakBySport,
        maxWinStreakBySport,
        streakFootball: replay.football,
        maxWinStreakFootball: replay.maxFootball,
        currentStreak: basketball,
        maxWinStreak: maxBasketball,
        wcFootballStreakBackfilledAt:
          admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    batch.set(
      db.doc(`users/${uid}`),
      {
        streakBySport,
        streakFootball: replay.football,
        currentStreak: basketball,
        maxStreak: maxBasketball,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    batch.set(
      db.doc(`cumulative_stats/${uid}`),
      {
        streakBySport,
        streakFootball: replay.football,
        currentStreak: basketball,
        activeWinStreakFootball: replay.activeWinStreakFootball,
        activeWinStreakBasketball: basketball > 0 ? basketball : 0,
        wcFootballStreakBackfilledAt:
          admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await batch.commit();
    updated++;
  }

  console.log(
    `\nDone. ${updated} user(s) ${DRY_RUN ? "would be " : ""}updated.`
  );
  if (!DRY_RUN && updated > 0) {
    console.log(
      "WC ランキングの連勝順位を更新するには buildCumulativeRankingSnapshot の再実行が必要です。"
    );
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
