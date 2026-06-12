/**
 * WC 投稿ユーザーだけを対象に、確定済み WC 投稿から football 連勝を再計算する。
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
import { Timestamp } from "firebase-admin/firestore";

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

type StreakEvent = {
  gameId: string;
  atMs: number;
  isWin: boolean;
};

function toTimestamp(v: unknown): Timestamp | null {
  if (v instanceof Timestamp) return v;
  if (v && typeof (v as { toDate?: unknown }).toDate === "function") {
    return v as Timestamp;
  }
  return null;
}

function toMs(v: unknown): number {
  const ts = toTimestamp(v);
  return ts ? ts.toDate().getTime() : 0;
}

function normalizeLeague(raw: unknown): string | null {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "wc" || v === "fifa") return "wc";
  return null;
}

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

function replayFootballStreak(events: StreakEvent[]): {
  football: number;
  maxFootball: number;
  activeWinStreakFootball: number;
} {
  let curF = 0;
  let maxF = 0;

  for (const ev of events) {
    if (ev.isWin) {
      curF = curF > 0 ? curF + 1 : 1;
      if (curF > maxF) maxF = curF;
    } else {
      curF = curF < 0 ? curF - 1 : -1;
    }
  }

  return {
    football: curF,
    maxFootball: maxF,
    activeWinStreakFootball: curF > 0 ? curF : 0,
  };
}

async function loadWcStreakEvents(): Promise<Map<string, StreakEvent[]>> {
  const snap = await db
    .collection("posts")
    .where("league", "==", "wc")
    .where("status", "==", "final")
    .get();

  const byUid = new Map<string, Map<string, StreakEvent>>();

  for (const doc of snap.docs) {
    const p = doc.data() as Record<string, unknown>;
    if (p.schemaVersion !== 2) continue;

    const uid = String(p.authorUid ?? "").trim();
    if (!uid || (targetUid && uid !== targetUid)) continue;

    const stats = p.stats as Record<string, unknown> | undefined;
    if (!stats || stats.countedForRanking === false) continue;
    if (typeof stats.isWin !== "boolean") continue;

    const gameId = String(p.gameId ?? "").trim();
    if (!gameId) continue;

    const atMs =
      toMs(p.settledAt) ||
      toMs(p.updatedAt) ||
      toMs(p.startAtJst) ||
      toMs(p.startAt) ||
      toMs(p.createdAt);

    const ev: StreakEvent = {
      gameId,
      atMs,
      isWin: stats.isWin === true,
    };

    if (!byUid.has(uid)) byUid.set(uid, new Map());
    const perGame = byUid.get(uid)!;
    const prev = perGame.get(gameId);
    if (!prev || ev.atMs >= prev.atMs) {
      perGame.set(gameId, ev);
    }
  }

  const out = new Map<string, StreakEvent[]>();
  for (const [uid, perGame] of byUid) {
    const events = [...perGame.values()].sort((a, b) => a.atMs - b.atMs);
    out.set(uid, events);
  }
  return out;
}

(async () => {
  console.log(
    "=== backfill WC football streak (WC posters only, NBA untouched) ==="
  );
  if (DRY_RUN) console.log(">>> DRY RUN\n");

  const eventsByUid = await loadWcStreakEvents();
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
        wcFootballStreakBackfilledAt: admin.firestore.FieldValue.serverTimestamp(),
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
        wcFootballStreakBackfilledAt: admin.firestore.FieldValue.serverTimestamp(),
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
