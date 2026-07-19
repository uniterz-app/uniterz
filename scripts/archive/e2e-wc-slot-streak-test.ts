/**
 * WC 同時キックオフ・スロット連勝の E2E 検証。
 *
 * 1. 同じ startAtJst のダミー試合 3 件を投入
 * 2. 指定ユーザーの予想投稿 3 件
 * 3. 試合を順に final 化（Cloud Functions onGameFinalV2 待ち）
 * 4. 連勝・投稿の streakBonus / activeWinStreak を検証
 *
 * 使い方:
 *   npx tsx scripts/e2e-wc-slot-streak-test.ts --dry-run
 *   npx tsx scripts/e2e-wc-slot-streak-test.ts --uid=YOUR_UID
 *   npx tsx scripts/e2e-wc-slot-streak-test.ts --uid=YOUR_UID --cleanup
 *   npx tsx scripts/e2e-wc-slot-streak-test.ts --uid=YOUR_UID --scenario=loss
 *
 * 前提:
 *   - service-account.json（プロジェクトルート）
 *   - onGameFinalV2 がデプロイ済み
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import adminPkg from "firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { computeWcSlotStreakOutcome } from "../lib/wc/wcKickoffSlot";
import { calcStreakBonus } from "./lib/wcStreakReplay";

const admin = adminPkg as typeof import("firebase-admin");

const DRY_RUN = process.argv.includes("--dry-run");
const CLEANUP = process.argv.includes("--cleanup");
const uidArg = process.argv.find((a) => a.startsWith("--uid="));
const UID = uidArg?.slice("--uid=".length).trim() || process.env.E2E_TEST_UID || "";
const scenarioArg = process.argv.find((a) => a.startsWith("--scenario="));
const SCENARIO = scenarioArg?.slice("--scenario=".length).trim() || "all-win";
const waitArg = process.argv.find((a) => a.startsWith("--wait-ms="));
const POLL_MS = Number(waitArg?.slice("--wait-ms=".length) ?? 2500);
const MAX_WAIT_ROUNDS = 40;

const TEST_PREFIX = "wc-slot-e2e";
const EXTRA_TEST_GAME_IDS = ["wc-test-jpn-bra-001"];
const SEASON = "2025-26";
const ENTRY_STREAK = 3;

const GAME_DEFS = [
  {
    id: `${TEST_PREFIX}-a`,
    home: { teamId: "wc-jpn", name: "Japan" },
    away: { teamId: "wc-bra", name: "Brazil" },
    result: { home: 2, away: 1 },
    prediction: { winner: "home" as const, score: { home: 2, away: 1 } },
  },
  {
    id: `${TEST_PREFIX}-b`,
    home: { teamId: "wc-arg", name: "Argentina" },
    away: { teamId: "wc-mex", name: "Mexico" },
    prediction: { winner: "draw" as const, score: { home: 1, away: 1 } },
    result: { home: 1, away: 1 },
  },
  {
    id: `${TEST_PREFIX}-c`,
    home: { teamId: "wc-fra", name: "France" },
    away: { teamId: "wc-deu", name: "Germany" },
    prediction: { winner: "away" as const, score: { home: 0, away: 2 } },
    result: { home: 0, away: 2 },
  },
];

function kickoffTodayPlusMinutes(minutesFromNow: number): Timestamp {
  const d = new Date(Date.now() + minutesFromNow * 60 * 1000);
  return Timestamp.fromDate(d);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function initAdmin() {
  const keyPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ??
    (existsSync("service-account.json")
      ? resolve("service-account.json")
      : resolve("serviceAccount.json"));
  if (!existsSync(keyPath)) {
    console.error(`サービスアカウントが見つかりません: ${keyPath}`);
    process.exit(1);
  }
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(readFileSync(keyPath, "utf8"))
    ),
  });
  return admin.firestore();
}

async function purgeGameArtifacts(
  db: FirebaseFirestore.Firestore,
  gameId: string
) {
  const gameRef = db.doc(`games/${gameId}`);
  const gameSnap = await gameRef.get();
  if (!gameSnap.exists) return null;

  const markers = await gameRef.collection("streak_apply_v2").get();
  for (const m of markers.docs) {
    if (!DRY_RUN) await m.ref.delete();
  }
  const posts = await db.collection("posts").where("gameId", "==", gameId).get();
  for (const p of posts.docs) {
    if (!DRY_RUN) await p.ref.delete();
  }
  if (!DRY_RUN) await gameRef.delete();
  return { gameId, posts: posts.size, markers: markers.size };
}

async function cleanupTestArtifacts(db: FirebaseFirestore.Firestore) {
  console.log("\n--- cleanup ---");
  const purged = new Set<string>();

  for (const g of GAME_DEFS) {
    const result = await purgeGameArtifacts(db, g.id);
    if (result) {
      purged.add(g.id);
      console.log(
        `  removed ${result.gameId} (+ ${result.posts} posts, ${result.markers} markers)`
      );
    }
  }

  for (const id of EXTRA_TEST_GAME_IDS) {
    if (purged.has(id)) continue;
    const result = await purgeGameArtifacts(db, id);
    if (result) {
      purged.add(id);
      console.log(
        `  removed ${result.gameId} (+ ${result.posts} posts, ${result.markers} markers)`
      );
    }
  }

  const wcSnap = await db.collection("games").where("league", "==", "wc").limit(500).get();
  for (const doc of wcSnap.docs) {
    if (purged.has(doc.id)) continue;
    const d = doc.data();
    const venue = String(d.venue ?? "");
    const round = String(d.roundLabel ?? "");
    const isTestMeta =
      venue.includes("Test Stadium") ||
      round.includes("Group TEST") ||
      doc.id.includes("e2e") ||
      doc.id.startsWith("wc-test-");
    if (!isTestMeta) continue;
    const result = await purgeGameArtifacts(db, doc.id);
    if (result) {
      console.log(
        `  removed ${result.gameId} (+ ${result.posts} posts, ${result.markers} markers)`
      );
    }
  }
}

async function seedGames(
  db: FirebaseFirestore.Firestore,
  kickoff: Timestamp
) {
  console.log("\n--- seed games (same kickoff) ---");
  for (const g of GAME_DEFS) {
    const payload = {
      id: g.id,
      league: "wc",
      season: SEASON,
      status: "scheduled",
      startAt: kickoff,
      startAtJst: kickoff,
      venue: "E2E Test Stadium",
      roundLabel: "Group TEST",
      wcStage: "qualifying",
      knockout: false,
      countsForRanking: false,
      home: g.home,
      away: g.away,
      homeTeamId: g.home.teamId,
      awayTeamId: g.away.teamId,
      final: false,
      homeScore: null,
      awayScore: null,
      regulationEtScore: null,
      advancingTeamId: null,
      suppressStreakIncrementV2: false,
    };
    console.log(`  ${g.id}`);
    if (!DRY_RUN) {
      await db.doc(`games/${g.id}`).set(payload, { merge: true });
    }
  }
}

async function setEntryStreak(
  db: FirebaseFirestore.Firestore,
  uid: string
) {
  console.log(`\n--- set entry streak = ${ENTRY_STREAK} ---`);
  const patch = {
    streakBySport: { basketball: 0, football: ENTRY_STREAK },
    streakFootball: ENTRY_STREAK,
    maxWinStreakFootball: Math.max(ENTRY_STREAK, 0),
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (!DRY_RUN) {
    await db.doc(`user_stats_v2/${uid}`).set(patch, { merge: true });
    await db.doc(`cumulative_stats/${uid}`).set(
      {
        streakBySport: { basketball: 0, football: ENTRY_STREAK },
        streakFootball: ENTRY_STREAK,
        activeWinStreakFootball: ENTRY_STREAK,
        activeWinStreak: ENTRY_STREAK,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
}

async function createPosts(
  db: FirebaseFirestore.Firestore,
  uid: string,
  kickoff: Timestamp
) {
  console.log("\n--- create posts ---");
  const userSnap = await db.doc(`users/${uid}`).get();
  const u = userSnap.data() ?? {};
  const postIds: string[] = [];

  for (const g of GAME_DEFS) {
    const existing = await db
      .collection("posts")
      .where("authorUid", "==", uid)
      .where("gameId", "==", g.id)
      .where("schemaVersion", "==", 2)
      .limit(1)
      .get();
    if (!existing.empty) {
      postIds.push(existing.docs[0]!.id);
      console.log(`  reuse post ${existing.docs[0]!.id} for ${g.id}`);
      continue;
    }

    const data = {
      schemaVersion: 2,
      authorUid: uid,
      authorDisplayName: u.displayName ?? "E2E Tester",
      authorPhotoURL: u.photoURL ?? null,
      authorHandle: u.handle ?? u.slug ?? "e2e",
      gameId: g.id,
      league: "wc",
      seasonPhase: null,
      seasonRound: null,
      wcStage: "qualifying",
      home: g.home,
      away: g.away,
      status: "scheduled",
      startAt: kickoff,
      startAtJst: kickoff,
      prediction: g.prediction,
      comment: "",
      result: null,
      stats: null,
      likeCount: 0,
      saveCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (DRY_RUN) {
      postIds.push(`dry-${g.id}`);
      console.log(`  [dry] post for ${g.id}`);
    } else {
      const ref = await db.collection("posts").add(data);
      postIds.push(ref.id);
      console.log(`  created ${ref.id} for ${g.id}`);
    }
  }
  return postIds;
}

async function readFootballStreak(db: FirebaseFirestore.Firestore, uid: string) {
  const snap = await db.doc(`user_stats_v2/${uid}`).get();
  const sb = snap.get("streakBySport") as { football?: number } | undefined;
  const cur =
    typeof sb?.football === "number"
      ? sb.football
      : typeof snap.get("streakFootball") === "number"
        ? snap.get("streakFootball")
        : 0;
  return cur > 0 ? cur : 0;
}

async function finalizeGame(
  db: FirebaseFirestore.Firestore,
  gameId: string,
  result: { home: number; away: number }
) {
  console.log(`\n--- finalize ${gameId} → ${result.home}-${result.away} ---`);
  if (DRY_RUN) return;
  await db.doc(`games/${gameId}`).set(
    {
      final: true,
      status: "final",
      homeScore: result.home,
      awayScore: result.away,
      regulationEtScore: { home: result.home, away: result.away },
      "game.status": "final",
      "game.finalScore": result,
    },
    { merge: true }
  );
}

async function waitForPostSettled(
  db: FirebaseFirestore.Firestore,
  gameId: string,
  uid: string
) {
  for (let i = 0; i < MAX_WAIT_ROUNDS; i++) {
    const snap = await db
      .collection("posts")
      .where("gameId", "==", gameId)
      .where("authorUid", "==", uid)
      .where("schemaVersion", "==", 2)
      .limit(1)
      .get();
    const post = snap.docs[0]?.data();
    if (post?.settledAt) return post;
    await sleep(POLL_MS);
  }
  throw new Error(`timeout waiting settlement: ${gameId}`);
}

function expectedPerGameStreaks(
  scenario: string
): Map<string, number> {
  const outcomes = GAME_DEFS.map((g) => ({
    gameId: g.id,
    didWin: scenario === "all-win" || (scenario === "loss" && g.id !== `${TEST_PREFIX}-c`),
  }));
  const slot = computeWcSlotStreakOutcome(ENTRY_STREAK, outcomes);
  return slot.perGameActiveWinStreak;
}

function expectedFinalStreak(scenario: string): number {
  const outcomes = GAME_DEFS.map((g) => ({
    gameId: g.id,
    didWin: scenario === "all-win" || (scenario === "loss" && g.id !== `${TEST_PREFIX}-c`),
  }));
  return computeWcSlotStreakOutcome(ENTRY_STREAK, outcomes).finalActiveWinStreak;
}

async function assertPostStreaks(
  db: FirebaseFirestore.Firestore,
  uid: string,
  expected: Map<string, number>
) {
  console.log("\n--- verify posts ---");
  let ok = true;
  for (const g of GAME_DEFS) {
    const snap = await db
      .collection("posts")
      .where("gameId", "==", g.id)
      .where("authorUid", "==", uid)
      .where("schemaVersion", "==", 2)
      .limit(1)
      .get();
    const post = snap.docs[0]?.data();
    if (!post?.settledAt) {
      console.error(`  ✗ ${g.id}: not settled`);
      ok = false;
      continue;
    }
    const stats = post.stats as Record<string, unknown>;
    const detail = (stats?.pointsV3Detail ?? {}) as Record<string, unknown>;
    const active = Number(detail.activeWinStreak ?? 0);
    const bonus = Number(stats.streakBonus ?? 0);
    const expActive = expected.get(g.id) ?? 0;
    const expBonus = calcStreakBonus(expActive);
    const match = active === expActive && bonus === expBonus;
    console.log(
      `  ${match ? "✓" : "✗"} ${g.id}: active ${active} (exp ${expActive}), bonus ${bonus} (exp ${expBonus})`
    );
    if (!match) ok = false;
  }
  return ok;
}

(async () => {
  console.log("=== WC slot streak E2E ===");
  if (DRY_RUN) console.log(">>> DRY RUN");
  if (!UID) {
    console.error("UID が必要です: --uid=... または E2E_TEST_UID");
    process.exit(1);
  }
  console.log("uid:", UID);
  console.log("scenario:", SCENARIO);

  const db = initAdmin();

  if (CLEANUP) {
    await cleanupTestArtifacts(db);
    if (!DRY_RUN) {
      console.log("\n✓ cleanup done");
    }
    process.exit(0);
  }

  const kickoff = kickoffTodayPlusMinutes(180);
  console.log("kickoff:", kickoff.toDate().toISOString());

  await cleanupTestArtifacts(db);
  await seedGames(db, kickoff);
  await setEntryStreak(db, UID);
  await createPosts(db, UID, kickoff);

  if (DRY_RUN) {
    console.log("\n[dry-run] stop before finalize");
    process.exit(0);
  }

  // loss シナリオ: 3 試合目だけ外す（予想 0-2、結果 1-0）
  const results = GAME_DEFS.map((g) => {
    if (SCENARIO === "loss" && g.id === `${TEST_PREFIX}-c`) {
      return { home: 1, away: 0 };
    }
    return g.result;
  });

  for (let i = 0; i < GAME_DEFS.length; i++) {
    const g = GAME_DEFS[i]!;
    const res = results[i]!;
    await finalizeGame(db, g.id, res);
    await waitForPostSettled(db, g.id, UID);
    const streakNow = await readFootballStreak(db, UID);
    const slotComplete = i === GAME_DEFS.length - 1;
    console.log(
      `  after ${g.id}: user active streak = ${streakNow} (slot complete: ${slotComplete})`
    );
    if (!slotComplete && streakNow !== ENTRY_STREAK) {
      console.warn(
        `  ⚠ expected streak to stay ${ENTRY_STREAK} until slot complete (got ${streakNow})`
      );
    }
  }

  const finalStreak = await readFootballStreak(db, UID);
  const expFinal = expectedFinalStreak(SCENARIO);
  console.log(`\n--- final user streak: ${finalStreak} (expected ${expFinal}) ---`);

  const expPerGame = expectedPerGameStreaks(SCENARIO);
  const postsOk = await assertPostStreaks(db, UID, expPerGame);

  const pass = finalStreak === expFinal && postsOk;
  if (pass) {
    console.log("\n✅ PASS — WC slot streak behaves as expected");
    process.exit(0);
  }
  console.error("\n❌ FAIL — see mismatches above");
  process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
