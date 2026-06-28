/**
 * 指定ユーザーに WC Group J の予想投稿を2件作成する。
 *
 * - wc-2026-J-dza-aut: アルジェリア 0–1 オーストリア（得点者: aut-schmid）
 * - wc-2026-J-jor-arg: ヨルダン 0–1 アルゼンチン（得点者: arg-messi）
 *
 *   npx tsx scripts/create-user-wc-predictions-dza-aut-jor-arg.ts --dry-run
 *   npx tsx scripts/create-user-wc-predictions-dza-aut-jor-arg.ts
 */

import adminPkg from "firebase-admin";
import fs from "fs";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { validateWcGoalScorerPickForGame } from "@/lib/wc/goalScorer";

const admin = adminPkg as typeof import("firebase-admin");

const UID = "Rb3vF67NTLeCxSvrR15brCbiQSD2";
const DRY_RUN = process.argv.includes("--dry-run");

const PREDICTIONS = [
  {
    gameId: "wc-2026-J-dza-aut",
    prediction: {
      winner: "away" as const,
      score: { home: 0, away: 1 },
      goalScorer: { playerId: "aut-schmid", teamId: "wc-aut" },
    },
  },
  {
    gameId: "wc-2026-J-jor-arg",
    prediction: {
      winner: "away" as const,
      score: { home: 0, away: 1 },
      goalScorer: { playerId: "arg-messi", teamId: "wc-arg" },
    },
  },
] as const;

if (!fs.existsSync("service-account.json")) {
  console.error("service-account.json が見つかりません");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(fs.readFileSync("service-account.json", "utf8"))
  ),
});

const db = admin.firestore();

function readStartAt(game: Record<string, unknown>): Timestamp {
  const raw = game.startAt;
  if (raw instanceof Timestamp) return raw;
  if (raw && typeof raw === "object" && "_seconds" in raw) {
    const sec = Number((raw as { _seconds: number })._seconds);
    const ns = Number((raw as { _nanoseconds?: number })._nanoseconds ?? 0);
    return new Timestamp(sec, ns);
  }
  throw new Error("games.startAt が不正です");
}

(async () => {
  console.log(`=== create WC predictions for ${UID} ===`);
  if (DRY_RUN) console.log(">>> DRY RUN\n");

  const userSnap = await db.doc(`users/${UID}`).get();
  if (!userSnap.exists) {
    console.error("ユーザーが見つかりません:", UID);
    process.exit(1);
  }
  const u = userSnap.data()!;

  for (const { gameId, prediction } of PREDICTIONS) {
    const gameSnap = await db.doc(`games/${gameId}`).get();
    if (!gameSnap.exists) {
      console.error("試合が見つかりません:", gameId);
      process.exit(1);
    }
    const game = gameSnap.data() as Record<string, unknown>;
    const home = game.home as { teamId: string; name: string; nameJa?: string };
    const away = game.away as { teamId: string; name: string; nameJa?: string };

    const pickCheck = validateWcGoalScorerPickForGame(
      prediction.goalScorer,
      home.teamId,
      away.teamId,
      prediction.score
    );
    if (!pickCheck.ok) {
      console.error(`${gameId}: invalid goalScorer — ${pickCheck.error}`);
      process.exit(1);
    }

    const existing = await db
      .collection("posts")
      .where("authorUid", "==", UID)
      .where("gameId", "==", gameId)
      .where("schemaVersion", "==", 2)
      .limit(1)
      .get();

    if (!existing.empty) {
      const doc = existing.docs[0]!;
      console.log(`skip (already exists): ${gameId} postId=${doc.id}`);
      continue;
    }

    const startAt = readStartAt(game);
    const startAtDate = startAt.toDate();
    const data = {
      schemaVersion: 2,
      authorUid: UID,
      authorDisplayName: u.displayName ?? "user",
      authorPhotoURL: u.photoURL ?? null,
      authorHandle: u.handle ?? u.slug ?? "",
      gameId,
      league: "wc",
      seasonPhase: game.seasonPhase ?? null,
      seasonRound: game.seasonRound ?? null,
      wcStage: game.wcStage ?? "qualifying",
      home,
      away,
      status: game.status ?? "scheduled",
      startAt,
      startAtJst: startAt,
      startAtMillis: startAtDate.getTime(),
      startAtIso: startAtDate.toISOString(),
      prediction,
      comment: "",
      result: null,
      stats: null,
      likeCount: 0,
      saveCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    console.log(`${gameId}:`, prediction);

    if (!DRY_RUN) {
      const ref = await db.collection("posts").add(data);
      console.log(`  ✓ created ${ref.id}`);
    }
  }

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
