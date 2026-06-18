/**
 * 同一バッチで確定した WC 試合の settledAt をキックオフ順に揃える。
 * リザルト一覧は settledAt 降順（新しい確定が上）のため、
 * 後のキックオフ試合ほど settledAt を遅くする。
 *
 * 使い方:
 *   npx tsx scripts/backfill-post-settled-at-kickoff-order.ts --dry-run \
 *     --before-game=wc-2026-L-eng-hrv --after-game=wc-2026-K-prt-cod
 *   npx tsx scripts/backfill-post-settled-at-kickoff-order.ts \
 *     --before-game=wc-2026-L-eng-hrv --after-game=wc-2026-K-prt-cod
 */

import adminPkg from "firebase-admin";
import fs from "fs";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const admin = adminPkg as typeof import("firebase-admin");

const DRY_RUN = process.argv.includes("--dry-run");
const beforeArg = process.argv.find((a) => a.startsWith("--before-game="));
const afterArg = process.argv.find((a) => a.startsWith("--after-game="));
const BEFORE_GAME = beforeArg?.slice("--before-game=".length).trim() ?? "";
const AFTER_GAME = afterArg?.slice("--after-game=".length).trim() ?? "";
const OFFSET_MS = 120_000;

if (!BEFORE_GAME || !AFTER_GAME) {
  console.error(
    "Usage: --before-game=<later-kickoff-id> --after-game=<earlier-kickoff-id> [--dry-run]"
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

function toMs(v: unknown): number | null {
  if (v instanceof Timestamp) return v.toDate().getTime();
  if (v && typeof (v as { toDate?: () => Date }).toDate === "function") {
    return (v as { toDate: () => Date }).toDate().getTime();
  }
  return null;
}

async function minSettledAt(gameId: string): Promise<number> {
  const snap = await db
    .collection("posts")
    .where("gameId", "==", gameId)
    .where("status", "==", "final")
    .get();
  const times = snap.docs
    .map((d) => toMs(d.data().settledAt))
    .filter((t): t is number => typeof t === "number");
  if (!times.length) throw new Error(`no final posts for ${gameId}`);
  return Math.min(...times);
}

(async () => {
  console.log("=== backfill post settledAt for kickoff display order ===");
  console.log(`later kickoff (stays later settledAt): ${BEFORE_GAME}`);
  console.log(`earlier kickoff (move settledAt earlier): ${AFTER_GAME}`);
  if (DRY_RUN) console.log(">>> DRY RUN\n");

  const beforeMs = await minSettledAt(BEFORE_GAME);
  const targetMs = beforeMs - OFFSET_MS;

  const snap = await db
    .collection("posts")
    .where("gameId", "==", AFTER_GAME)
    .where("status", "==", "final")
    .get();

  console.log(`${AFTER_GAME}: ${snap.size} posts`);
  console.log(`  ${BEFORE_GAME} min settledAt: ${new Date(beforeMs).toISOString()}`);
  console.log(`  target settledAt:       ${new Date(targetMs).toISOString()}`);

  let updated = 0;
  const batchSize = 400;
  let batch = db.batch();
  let ops = 0;

  for (const doc of snap.docs) {
    const cur = toMs(doc.data().settledAt);
    if (cur != null && cur < beforeMs) {
      continue;
    }

    if (!DRY_RUN) {
      batch.update(doc.ref, {
        settledAt: Timestamp.fromMillis(targetMs),
        updatedAt: FieldValue.serverTimestamp(),
      });
      ops++;
      if (ops >= batchSize) {
        await batch.commit();
        batch = db.batch();
        ops = 0;
      }
    }
    updated++;
  }

  if (!DRY_RUN && ops > 0) await batch.commit();

  console.log(`\n${DRY_RUN ? "would update" : "updated"}: ${updated} post(s)`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
