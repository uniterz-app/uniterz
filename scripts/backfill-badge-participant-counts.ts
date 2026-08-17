/**
 * 既存 user_badges / master_badges に participantCount を埋める。
 * 付与時点の母数が無い旧データ向け。スナップショット（または live count）から推定する。
 *
 * リポジトリルート・service-account.json:
 *   npx tsx scripts/backfill-badge-participant-counts.ts --dry-run
 *   npx tsx scripts/backfill-badge-participant-counts.ts
 */

import adminPkg from "firebase-admin";
import fs from "fs";
import { readGrantParticipantCount } from "../lib/badges/badgeGrant";
import { loadBadgeParticipantCounts } from "../lib/badges/server/loadBadgeParticipantCounts";
import { stampMasterBadgeParticipantCount } from "../lib/badges/server/stampMasterBadgeParticipantCount";

const admin = adminPkg;
const DRY_RUN = process.argv.includes("--dry-run");

if (!fs.existsSync("service-account.json")) {
  console.error("service-account.json がリポジトリルートに必要です");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(fs.readFileSync("service-account.json", "utf8")),
  ),
});

const db = admin.firestore();

async function main() {
  console.log("=== backfill badge participantCount ===");
  if (DRY_RUN) console.log("(DRY_RUN: no writes)");

  const masterSnap = await db.collection("master_badges").get();
  const masterIds = masterSnap.docs.map((d) => d.id);
  const counts = await loadBadgeParticipantCounts(db, masterIds);
  console.log(`lookup hits: ${counts.size} / ${masterIds.length} master badges`);

  const byBadge = new Map<string, number>();
  for (const [id, n] of counts) byBadge.set(id, n);

  for (const doc of masterSnap.docs) {
    const stored = readGrantParticipantCount(doc.data());
    if (stored != null && !byBadge.has(doc.id)) byBadge.set(doc.id, stored);
  }

  let scanned = 0;
  let skipped = 0;
  let wouldWrite = 0;
  let written = 0;
  let missing = 0;
  let batch = db.batch();
  let ops = 0;

  const flush = async () => {
    if (ops === 0) return;
    if (!DRY_RUN) await batch.commit();
    batch = db.batch();
    ops = 0;
  };

  const userDocs = await db.collection("user_badges").listDocuments();
  for (const userRef of userDocs) {
    const badgesSnap = await userRef.collection("badges").get();
    for (const badgeDoc of badgesSnap.docs) {
      scanned++;
      const data = badgeDoc.data();
      const badgeId = String(data.badgeId ?? badgeDoc.id);
      if (readGrantParticipantCount(data) != null) {
        skipped++;
        continue;
      }
      const count = byBadge.get(badgeId);
      if (count == null) {
        missing++;
        continue;
      }
      wouldWrite++;
      if (DRY_RUN) continue;
      batch.set(
        badgeDoc.ref,
        { "meta.participantCount": count },
        { merge: true },
      );
      ops++;
      written++;
      if (ops >= 400) await flush();
    }
  }
  await flush();

  if (!DRY_RUN) {
    const stampIds = new Map<number, string[]>();
    for (const [id, n] of byBadge) {
      const list = stampIds.get(n) ?? [];
      list.push(id);
      stampIds.set(n, list);
    }
    for (const [n, ids] of stampIds) {
      await stampMasterBadgeParticipantCount(db, ids, n);
    }
  }

  console.log(`user badge docs scanned: ${scanned}`);
  console.log(`already had participantCount: ${skipped}`);
  console.log(`no lookup for badgeId: ${missing}`);
  console.log(
    DRY_RUN
      ? `dry-run would write: ${wouldWrite}`
      : `wrote user_badges meta: ${written}`,
  );
  console.log("=== done ===");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
