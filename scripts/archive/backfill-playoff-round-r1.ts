/**
 * seasonPhase=playoffs の games 全件に playoffRound="r1" を付与/上書きする。
 *
 * Usage:
 *   npx tsx scripts/backfill-playoff-round-r1.ts
 *   npx tsx scripts/backfill-playoff-round-r1.ts --dry-run
 */

import adminPkg from "firebase-admin";
import fs from "node:fs";
import path from "node:path";

const admin = adminPkg;

function resolveServiceAccountPath(): string {
  const fromEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;

  const candidates = [
    path.resolve(process.cwd(), "service-account.json"),
    path.resolve(process.cwd(), "serviceAccount.json"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    "service account json not found. Set GOOGLE_APPLICATION_CREDENTIALS or place service-account.json at repo root."
  );
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const keyPath = resolveServiceAccountPath();
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  const db = admin.firestore();
  const playoffsSnap = await db
    .collection("games")
    .where("seasonPhase", "==", "playoffs")
    .get();

  if (playoffsSnap.empty) {
    console.log("No playoffs games found.");
    return;
  }

  let changed = 0;
  let already = 0;
  let batch = db.batch();
  let ops = 0;

  for (const doc of playoffsSnap.docs) {
    const cur = doc.get("playoffRound");
    if (cur === "r1") {
      already += 1;
      continue;
    }
    changed += 1;
    if (!dryRun) {
      batch.set(
        doc.ref,
        {
          playoffRound: "r1",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      ops += 1;
      if (ops >= 450) {
        await batch.commit();
        batch = db.batch();
        ops = 0;
      }
    }
  }

  if (!dryRun && ops > 0) {
    await batch.commit();
  }

  console.log(
    `[backfill playoffRound=r1] total=${playoffsSnap.size} changed=${changed} already_r1=${already} dryRun=${dryRun}`
  );
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});

