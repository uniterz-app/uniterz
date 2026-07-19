/**
 * WC 確定投稿の連勝ボーナス / activeWinStreak / pointsV3 が
 * キックオフ順タイムラインと一致しているか一括監査する。
 *
 * 使い方（プロジェクトルート、service-account.json 必須）:
 *   npx tsx scripts/audit-wc-streak-drift.ts
 *   npx tsx scripts/audit-wc-streak-drift.ts --game-ids=wc-2026-K-prt-cod,wc-2026-L-eng-hrv
 *   npx tsx scripts/audit-wc-streak-drift.ts --only-mismatches
 */

import adminPkg from "firebase-admin";
import fs from "fs";
import { Timestamp } from "firebase-admin/firestore";

const admin = adminPkg as typeof import("firebase-admin");

const ONLY_MISMATCHES = process.argv.includes("--only-mismatches");
const gameIdsArg = process.argv.find((a) => a.startsWith("--game-ids="));
const FILTER_GAME_IDS = gameIdsArg
  ? gameIdsArg
      .slice("--game-ids=".length)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : null;

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
  postId: string;
};

type PostRow = {
  postId: string;
  uid: string;
  gameId: string;
  stats: Record<string, unknown>;
  detail: Record<string, unknown>;
  startAtJst: unknown;
  startAt: unknown;
  createdAt: unknown;
};

function calcStreakBonus(activeWinStreak: number): number {
  if (!Number.isFinite(activeWinStreak) || activeWinStreak < 3) return 0;
  if (activeWinStreak >= 7) return 3;
  if (activeWinStreak >= 5) return 2;
  return 1;
}

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

function resolveKickoffMs(
  post: Record<string, unknown>,
  game?: Record<string, unknown>
): number {
  return (
    toMs(game?.startAtJst) ||
    toMs(game?.startAt) ||
    toMs(post.startAtJst) ||
    toMs(post.startAt) ||
    toMs(post.createdAt)
  );
}

function replayStreakAfterGame(
  events: StreakEvent[],
  targetGameId: string
): number {
  let curF = 0;
  for (const ev of events) {
    if (ev.isWin) curF = curF > 0 ? curF + 1 : 1;
    else curF = curF < 0 ? curF - 1 : -1;
    if (ev.gameId === targetGameId) return curF > 0 ? curF : 0;
  }
  throw new Error(`game ${targetGameId} not in timeline`);
}

function readBasketballState(data: Record<string, unknown> | undefined) {
  const sb = data?.streakBySport as { basketball?: number; football?: number } | undefined;
  const mb = data?.maxWinStreakBySport as
    | { basketball?: number; football?: number }
    | undefined;
  return {
    basketball:
      typeof sb?.basketball === "number"
        ? sb.basketball
        : typeof data?.currentStreak === "number"
          ? data.currentStreak
          : 0,
    football:
      typeof sb?.football === "number"
        ? sb.football
        : typeof data?.streakFootball === "number"
          ? data.streakFootball
          : 0,
    maxBasketball:
      typeof mb?.basketball === "number"
        ? mb.basketball
        : typeof data?.maxWinStreak === "number"
          ? data.maxWinStreak
          : 0,
  };
}

function replayFootballStreak(events: StreakEvent[]) {
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

(async () => {
  console.log("=== audit WC streak drift (kickoff-order replay) ===");
  if (FILTER_GAME_IDS?.length) {
    console.log("filter gameIds:", FILTER_GAME_IDS.join(", "));
  }
  console.log("");

  const postsSnap = await db
    .collection("posts")
    .where("league", "==", "wc")
    .where("status", "==", "final")
    .where("schemaVersion", "==", 2)
    .get();

  const gameIds = new Set<string>();
  const postsByUid = new Map<string, PostRow[]>();

  for (const doc of postsSnap.docs) {
    const p = doc.data() as Record<string, unknown>;
    const stats = p.stats as Record<string, unknown> | undefined;
    if (!stats || stats.countedForRanking === false) continue;
    if (typeof stats.isWin !== "boolean") continue;

    const uid = String(p.authorUid ?? "").trim();
    const gameId = String(p.gameId ?? "").trim();
    if (!uid || !gameId) continue;

    if (FILTER_GAME_IDS && !FILTER_GAME_IDS.includes(gameId)) continue;

    gameIds.add(gameId);
    const row: PostRow = {
      postId: doc.id,
      uid,
      gameId,
      stats,
      detail: (stats.pointsV3Detail as Record<string, unknown>) ?? {},
      startAtJst: p.startAtJst,
      startAt: p.startAt,
      createdAt: p.createdAt,
    };
    if (!postsByUid.has(uid)) postsByUid.set(uid, []);
    postsByUid.get(uid)!.push(row);
  }

  const gameById = new Map<string, Record<string, unknown>>();
  const gameIdList = [...gameIds];
  for (let i = 0; i < gameIdList.length; i += 300) {
    const chunk = gameIdList.slice(i, i + 300);
    const snaps = await db.getAll(...chunk.map((id) => db.doc(`games/${id}`)));
    for (const snap of snaps) {
      if (snap.exists) gameById.set(snap.id, snap.data() as Record<string, unknown>);
    }
  }

  // 全 WC 投稿でタイムラインを組む（フィルタ試合だけだと連勝が欠けるため）
  const allPostsSnap = FILTER_GAME_IDS
    ? await db
        .collection("posts")
        .where("league", "==", "wc")
        .where("status", "==", "final")
        .where("schemaVersion", "==", 2)
        .get()
    : postsSnap;

  const allGameIds = new Set<string>();
  const allPostsByUid = new Map<string, PostRow[]>();

  for (const doc of allPostsSnap.docs) {
    const p = doc.data() as Record<string, unknown>;
    const stats = p.stats as Record<string, unknown> | undefined;
    if (!stats || stats.countedForRanking === false) continue;
    if (typeof stats.isWin !== "boolean") continue;

    const uid = String(p.authorUid ?? "").trim();
    const gameId = String(p.gameId ?? "").trim();
    if (!uid || !gameId) continue;

    allGameIds.add(gameId);
    const row: PostRow = {
      postId: doc.id,
      uid,
      gameId,
      stats,
      detail: (stats.pointsV3Detail as Record<string, unknown>) ?? {},
      startAtJst: p.startAtJst,
      startAt: p.startAt,
      createdAt: p.createdAt,
    };
    if (!allPostsByUid.has(uid)) allPostsByUid.set(uid, []);
    allPostsByUid.get(uid)!.push(row);
  }

  for (const gid of allGameIds) {
    if (!gameById.has(gid)) {
      const snap = await db.doc(`games/${gid}`).get();
      if (snap.exists) gameById.set(gid, snap.data() as Record<string, unknown>);
    }
  }

  type Mismatch = {
    uid: string;
    gameId: string;
    postId: string;
    isWin: boolean;
    activeWinStreak: { stored: number; expected: number };
    streakBonus: { stored: number; expected: number };
    pointsV3: { stored: number; expected: number; delta: number };
  };

  const mismatches: Mismatch[] = [];
  let usersChecked = 0;
  let postsChecked = 0;

  for (const [uid, rows] of postsByUid) {
    usersChecked++;
    const timelineRows = allPostsByUid.get(uid) ?? rows;
    const perGame = new Map<string, StreakEvent>();

    for (const row of timelineRows) {
      const game = gameById.get(row.gameId);
      const atMs = resolveKickoffMs(row, game);
      const ev: StreakEvent = {
        gameId: row.gameId,
        atMs,
        isWin: row.stats.isWin === true,
        postId: row.postId,
      };
      const prev = perGame.get(row.gameId);
      if (!prev || ev.atMs >= prev.atMs) perGame.set(row.gameId, ev);
    }

    const events = [...perGame.values()].sort((a, b) => a.atMs - b.atMs);

    for (const row of rows) {
      postsChecked++;
      const expectedActive = replayStreakAfterGame(events, row.gameId);
      const expectedBonus = calcStreakBonus(expectedActive);
      const basePoints = Number(row.detail.basePoints ?? 0);
      const upsetBonus = Number(row.detail.upsetBonus ?? row.stats.upsetBonus ?? 0);
      const goalScorerBonus = Number(
        row.detail.goalScorerBonus ?? row.stats.goalScorerBonus ?? 0
      );
      const expectedPoints =
        basePoints + upsetBonus + expectedBonus + goalScorerBonus;

      const storedActive = Number(row.detail.activeWinStreak ?? 0);
      const storedBonus = Number(row.stats.streakBonus ?? 0);
      const storedPoints = Number(row.stats.pointsV3 ?? 0);

      const activeMismatch = storedActive !== expectedActive;
      const bonusMismatch = storedBonus !== expectedBonus;
      const pointsMismatch = storedPoints !== expectedPoints;

      if (!activeMismatch && !bonusMismatch && !pointsMismatch) {
        if (!ONLY_MISMATCHES) {
          console.log(`OK  ${uid}  ${row.gameId}`);
        }
        continue;
      }

      mismatches.push({
        uid,
        gameId: row.gameId,
        postId: row.postId,
        isWin: row.stats.isWin === true,
        activeWinStreak: { stored: storedActive, expected: expectedActive },
        streakBonus: { stored: storedBonus, expected: expectedBonus },
        pointsV3: {
          stored: storedPoints,
          expected: expectedPoints,
          delta: expectedPoints - storedPoints,
        },
      });

      console.log(
        [
          "DRIFT",
          uid,
          row.gameId,
          row.stats.isWin ? "W" : "L",
          `streak ${storedActive}→${expectedActive}`,
          `bonus ${storedBonus}→${expectedBonus}`,
          `pts ${storedPoints}→${expectedPoints} (Δ${expectedPoints - storedPoints})`,
        ].join("  ")
      );
    }
  }

  const userStreakDrift: string[] = [];
  for (const uid of postsByUid.keys()) {
    const timelineRows = allPostsByUid.get(uid) ?? [];
    const perGame = new Map<string, StreakEvent>();
    for (const row of timelineRows) {
      const game = gameById.get(row.gameId);
      const atMs = resolveKickoffMs(row, game);
      perGame.set(row.gameId, {
        gameId: row.gameId,
        atMs,
        isWin: row.stats.isWin === true,
        postId: row.postId,
      });
    }
    const events = [...perGame.values()].sort((a, b) => a.atMs - b.atMs);
    const expected = replayFootballStreak(events);

    const userSnap = await db.doc(`user_stats_v2/${uid}`).get();
    const { football } = readBasketballState(
      userSnap.data() as Record<string, unknown> | undefined
    );
    if (football !== expected.football) {
      userStreakDrift.push(
        `${uid}  user_stats football ${football}→${expected.football}`
      );
    }
  }

  console.log("\n--- summary ---");
  console.log(`users checked: ${usersChecked}`);
  console.log(`posts checked: ${postsChecked}`);
  console.log(`post mismatches: ${mismatches.length}`);
  console.log(`user streak mismatches: ${userStreakDrift.length}`);

  if (mismatches.length > 0) {
    const byUid = new Map<string, number>();
    let totalDelta = 0;
    for (const m of mismatches) {
      byUid.set(m.uid, (byUid.get(m.uid) ?? 0) + 1);
      totalDelta += m.pointsV3.delta;
    }
    console.log(`unique users with post drift: ${byUid.size}`);
    console.log(`total pointsV3 delta if fixed: ${totalDelta}`);
    console.log("\nbulk fix:");
    const ids =
      FILTER_GAME_IDS?.join(",") ??
      "wc-2026-K-prt-cod,wc-2026-L-eng-hrv,wc-2026-L-gha-pan,wc-2026-K-uzb-col";
    console.log(
      `  npx tsx scripts/fix-wc-streak-drift-all.ts --dry-run --game-ids=${ids}`
    );
    console.log(`  npx tsx scripts/fix-wc-streak-drift-all.ts --game-ids=${ids}`);
  }

  if (userStreakDrift.length > 0) {
    console.log("\nuser_stats_v2 football drift:");
    for (const line of userStreakDrift.slice(0, 20)) {
      console.log(`  ${line}`);
    }
    if (userStreakDrift.length > 20) {
      console.log(`  ... +${userStreakDrift.length - 20} more`);
    }
    console.log("\nafter post fixes, run:");
    console.log("  npx tsx scripts/backfill-wc-football-streak.ts");
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
