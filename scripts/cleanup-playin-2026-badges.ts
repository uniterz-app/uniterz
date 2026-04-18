/**
 * Remove play-in 2026 total-points badges: master_badges docs + all user grants (collectionGroup).
 *
 * Dry-run: DRY_RUN=1 npx tsx scripts/cleanup-playin-2026-badges.ts
 * Run:     npx tsx scripts/cleanup-playin-2026-badges.ts
 */

import adminPkg from "firebase-admin";
const admin = adminPkg;
import fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const DRY_RUN =
  process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

const PLAYIN_BADGE_IDS = [
  "playin_2026_total_points_rank1",
  "playin_2026_total_points_rank2",
  "playin_2026_total_points_rank3",
  "playin_2026_total_points_rank4_20",
] as const;

async function deleteUserBadgeGrants() {
  let total = 0;
  for (const badgeId of PLAYIN_BADGE_IDS) {
    // documentId() on collectionGroup requires a full path, not the leaf id — use badgeId field.
    const snap = await db
      .collectionGroup("badges")
      .where("badgeId", "==", badgeId)
      .get();

    if (snap.empty) {
      console.log(`user grants: none for ${badgeId}`);
      continue;
    }

    console.log(`user grants: ${snap.size} docs for ${badgeId}`);
    let batch = db.batch();
    let ops = 0;

    for (const doc of snap.docs) {
      if (!doc.ref.path.startsWith("user_badges/")) {
        console.warn(`  skip (not user_badges): ${doc.ref.path}`);
        continue;
      }
      if (DRY_RUN) {
        console.log(`  [dry-run] would delete ${doc.ref.path}`);
        total++;
        continue;
      }
      batch.delete(doc.ref);
      ops++;
      total++;
      if (ops >= 450) {
        await batch.commit();
        batch = db.batch();
        ops = 0;
      }
    }
    if (!DRY_RUN && ops > 0) {
      await batch.commit();
    }
  }
  return total;
}

async function deleteMasters() {
  let batch = db.batch();
  let ops = 0;
  let count = 0;

  for (const id of PLAYIN_BADGE_IDS) {
    const ref = db.collection("master_badges").doc(id);
    if (DRY_RUN) {
      console.log(`[dry-run] would delete master_badges/${id}`);
      count++;
      continue;
    }
    batch.delete(ref);
    ops++;
    count++;
    if (ops >= 450) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }
  if (!DRY_RUN && ops > 0) {
    await batch.commit();
  }
  return count;
}

async function main() {
  console.log("=== cleanup play-in 2026 badges ===");
  if (DRY_RUN) console.log("DRY_RUN: no deletes");

  const masters = await deleteMasters();
  console.log(`master_badges removed (or dry-run listed): ${masters}`);

  const grants = await deleteUserBadgeGrants();
  console.log(`user_badges grant docs removed (or dry-run): ${grants}`);

  console.log("=== done ===");
  console.log(
    "Next: replace PNGs in public/play-in2026badge/, then seed-playin-2026-total-points-badges.ts again."
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  const msg = String(e?.message ?? e);
  const code = e?.code;
  const needsIndex =
    msg.includes("index") ||
    String(code ?? "").includes("failed-precondition") ||
    code === 9;
  if (needsIndex) {
    console.error(
      "\nFirestore needs a collection group index on `badges` for field `badgeId`."
    );
    console.error(
      "Deploy: firebase deploy --only firestore:indexes  (see firestore.indexes.json), wait until the index finishes building, then re-run this script."
    );
  }
  process.exit(1);
});
