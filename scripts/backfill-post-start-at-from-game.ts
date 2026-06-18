/**
 * posts_v2 の kickoff フィールドが games ドキュメントとズレている投稿を監査・修正。
 *
 * 予想の編集可否は投稿側の startAtMillis で判定するため、
 * 試合日時修正後も古い投稿だけロックされたままになることがある。
 *
 * 使い方（プロジェクトルート、service-account.json 必須）:
 *
 *   # 全投稿を監査（差分レポートのみ）
 *   npx tsx scripts/backfill-post-start-at-from-game.ts --audit
 *
 *   # 特定試合のみ監査
 *   npx tsx scripts/backfill-post-start-at-from-game.ts --audit \
 *     --game-id=wc-2026-D-aus-tur
 *
 *   # 全ズレを修正（dry-run）
 *   npx tsx scripts/backfill-post-start-at-from-game.ts --fix --dry-run
 *
 *   # 全ズレを修正（本番）
 *   npx tsx scripts/backfill-post-start-at-from-game.ts --fix
 *
 *   # 特定試合のみ修正
 *   npx tsx scripts/backfill-post-start-at-from-game.ts --fix \
 *     --game-id=wc-2026-D-aus-tur
 */

import adminPkg from "firebase-admin";
import fs from "fs";
import {
  FieldPath,
  FieldValue,
  Timestamp,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";

const admin = adminPkg as typeof import("firebase-admin");

const DRY_RUN = process.argv.includes("--dry-run");
const AUDIT = process.argv.includes("--audit");
const FIX = process.argv.includes("--fix");
const gameIdArg = process.argv.find((a) => a.startsWith("--game-id="));
const GAME_ID_FILTER = gameIdArg?.slice("--game-id=".length).trim() ?? "";

if (!AUDIT && !FIX) {
  console.error(
    "Usage: --audit | --fix [--dry-run] [--game-id=...]"
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const PAGE_SIZE = 500;

type GameKickoff = {
  startAtTs: Timestamp;
  startAtMillis: number;
  startAtIso: string;
  status: string;
  league: string;
};

type MismatchRow = {
  postId: string;
  gameId: string;
  authorUid: string;
  postMillis: number | null;
  gameMillis: number;
  postJst: string;
  gameJst: string;
};

function toTimestamp(v: unknown): Timestamp | null {
  if (v instanceof Timestamp) return v;
  if (v && typeof (v as { toDate?: unknown }).toDate === "function") {
    return v as Timestamp;
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return Timestamp.fromMillis(v);
  }
  if (typeof v === "string") {
    const ms = Date.parse(v);
    if (!Number.isNaN(ms)) return Timestamp.fromMillis(ms);
  }
  return null;
}

function resolveGameStartAt(game: Record<string, unknown>): Timestamp | null {
  return toTimestamp(game.startAtJst) ?? toTimestamp(game.startAt);
}

function formatJstFromMillis(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms)) return "(missing)";
  return new Date(ms).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

function formatJst(ts: Timestamp): string {
  return formatJstFromMillis(ts.toMillis());
}

type GameCacheEntry =
  | { kind: "ok"; kickoff: GameKickoff }
  | { kind: "missing" }
  | { kind: "no_start" };

const gameCache = new Map<string, GameCacheEntry>();

async function loadGameKickoff(gameId: string): Promise<GameCacheEntry> {
  const cached = gameCache.get(gameId);
  if (cached) return cached;

  const snap = await db.collection("games").doc(gameId).get();
  if (!snap.exists) {
    const entry: GameCacheEntry = { kind: "missing" };
    gameCache.set(gameId, entry);
    return entry;
  }

  const game = snap.data() as Record<string, unknown>;
  const startAtTs = resolveGameStartAt(game);
  if (!startAtTs) {
    const entry: GameCacheEntry = { kind: "no_start" };
    gameCache.set(gameId, entry);
    return entry;
  }

  const startAtMillis = startAtTs.toMillis();
  const entry: GameCacheEntry = {
    kind: "ok",
    kickoff: {
      startAtTs,
      startAtMillis,
      startAtIso: new Date(startAtMillis).toISOString(),
      status: String(game.status ?? "?"),
      league: String(game.league ?? "?"),
    },
  };
  gameCache.set(gameId, entry);
  return entry;
}

async function* iteratePostsV2(
  gameIdFilter: string
): AsyncGenerator<QueryDocumentSnapshot> {
  if (gameIdFilter) {
    const snap = await db
      .collection("posts")
      .where("gameId", "==", gameIdFilter)
      .where("schemaVersion", "==", 2)
      .get();
    for (const doc of snap.docs) yield doc;
    return;
  }

  let last: QueryDocumentSnapshot | undefined;
  while (true) {
    let q = db
      .collection("posts")
      .where("schemaVersion", "==", 2)
      .orderBy(FieldPath.documentId())
      .limit(PAGE_SIZE);
    if (last) q = q.startAfter(last);
    const snap = await q.get();
    if (snap.empty) break;
    for (const doc of snap.docs) yield doc;
    last = snap.docs[snap.docs.length - 1];
    if (snap.size < PAGE_SIZE) break;
  }
}

async function collectMismatches(): Promise<{
  mismatches: MismatchRow[];
  scanned: number;
  skippedNoGameId: number;
  skippedNoGame: number;
  skippedNoGameStart: number;
  alreadyCorrect: number;
}> {
  const mismatches: MismatchRow[] = [];
  let scanned = 0;
  let skippedNoGameId = 0;
  let skippedNoGame = 0;
  let skippedNoGameStart = 0;
  let alreadyCorrect = 0;

  for await (const docSnap of iteratePostsV2(GAME_ID_FILTER)) {
    scanned++;
    const post = docSnap.data() as Record<string, unknown>;
    const gameId = typeof post.gameId === "string" ? post.gameId.trim() : "";
    if (!gameId) {
      skippedNoGameId++;
      continue;
    }

    const gameEntry = await loadGameKickoff(gameId);
    if (gameEntry.kind === "missing") {
      skippedNoGame++;
      continue;
    }
    if (gameEntry.kind === "no_start") {
      skippedNoGameStart++;
      continue;
    }
    const kickoff = gameEntry.kickoff;

    const postMillis =
      typeof post.startAtMillis === "number" &&
      Number.isFinite(post.startAtMillis)
        ? post.startAtMillis
        : null;

    const postStartTs = toTimestamp(post.startAtJst) ?? toTimestamp(post.startAt);
    const postStartMillisFromTs = postStartTs?.toMillis() ?? null;

    const millisMismatch = postMillis !== kickoff.startAtMillis;
    const tsMismatch =
      postStartMillisFromTs != null &&
      postStartMillisFromTs !== kickoff.startAtMillis;

    if (!millisMismatch && !tsMismatch) {
      alreadyCorrect++;
      continue;
    }

    mismatches.push({
      postId: docSnap.id,
      gameId,
      authorUid: String(post.authorUid ?? "?"),
      postMillis: postMillis ?? postStartMillisFromTs,
      gameMillis: kickoff.startAtMillis,
      postJst: formatJstFromMillis(postMillis ?? postStartMillisFromTs),
      gameJst: formatJst(kickoff.startAtTs),
    });
  }

  return {
    mismatches,
    scanned,
    skippedNoGameId,
    skippedNoGame,
    skippedNoGameStart,
    alreadyCorrect,
  };
}

function printSummary(mismatches: MismatchRow[]) {
  const byGame = new Map<string, number>();
  for (const row of mismatches) {
    byGame.set(row.gameId, (byGame.get(row.gameId) ?? 0) + 1);
  }

  const sorted = [...byGame.entries()].sort((a, b) => b[1] - a[1]);
  console.log("\n--- mismatches by gameId ---");
  for (const [gameId, count] of sorted) {
    const cached = gameCache.get(gameId);
    const meta =
      cached?.kind === "ok"
        ? `${cached.kickoff.league} / ${cached.kickoff.status} / ${formatJst(cached.kickoff.startAtTs)}`
        : "(game meta unavailable)";
    console.log(`  ${gameId}: ${count} posts — ${meta}`);
  }
}

(async () => {
  console.log("=== post startAt audit / fix ===");
  console.log(`mode: ${AUDIT ? "audit" : "fix"}`);
  if (GAME_ID_FILTER) console.log(`filter gameId: ${GAME_ID_FILTER}`);
  if (DRY_RUN) console.log(">>> DRY RUN\n");

  const {
    mismatches,
    scanned,
    skippedNoGameId,
    skippedNoGame,
    skippedNoGameStart,
    alreadyCorrect,
  } = await collectMismatches();

  console.log(`Scanned posts:        ${scanned}`);
  console.log(`Already correct:      ${alreadyCorrect}`);
  console.log(`Mismatches:           ${mismatches.length}`);
  console.log(`No gameId on post:    ${skippedNoGameId}`);
  console.log(`Game doc missing:     ${skippedNoGame}`);
  console.log(`Game has no startAt:  ${skippedNoGameStart}`);

  if (mismatches.length > 0) {
    printSummary(mismatches);

    const sample = mismatches.slice(0, 20);
    console.log("\n--- sample rows (max 20) ---");
    for (const row of sample) {
      console.log(
        `  ${row.postId} | ${row.gameId} | post ${row.postJst} → game ${row.gameJst}`
      );
    }
    if (mismatches.length > 20) {
      console.log(`  ... and ${mismatches.length - 20} more`);
    }
  }

  if (AUDIT) {
    if (mismatches.length > 0) {
      console.log("\nRun with --fix [--dry-run] to update mismatched posts.");
    }
    process.exit(0);
  }

  let updated = 0;
  for (const row of mismatches) {
    const cached = gameCache.get(row.gameId);
    if (cached?.kind !== "ok") continue;
    const kickoff = cached.kickoff;

    if (!DRY_RUN) {
      await db.collection("posts").doc(row.postId).update({
        startAt: kickoff.startAtTs,
        startAtJst: kickoff.startAtTs,
        startAtMillis: kickoff.startAtMillis,
        startAtIso: kickoff.startAtIso,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    updated++;
  }

  console.log(`\n=== fix done: ${updated} posts ${DRY_RUN ? "would be " : ""}updated ===`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
