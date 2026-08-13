/**
 * cumulative_stats.profileCharts を subcollection へコピー（Tier 3 dual-write 移行）。
 *
 *   npx tsx scripts/backfill-profile-charts-subcol.ts --dry-run
 *   npx tsx scripts/backfill-profile-charts-subcol.ts --limit=100
 */
import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

const DRY_RUN = process.argv.includes("--dry-run");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : Infinity;

const db = getAdminDb();

async function main() {
  let processed = 0;
  let copied = 0;
  let last: QueryDocumentSnapshot | undefined;

  while (processed < LIMIT) {
    let q = db.collection("cumulative_stats").orderBy("__name__").limit(200);
    if (last) q = q.startAfter(last);
    const snap = await q.get();
    if (snap.empty) break;

    let batch = db.batch();
    let batchOps = 0;

    for (const doc of snap.docs) {
      if (processed >= LIMIT) break;
      processed += 1;
      const data = doc.data();
      const charts = data.profileCharts as Record<string, unknown> | undefined;
      if (!charts || charts.v !== 1) continue;
      const seasonKey =
        typeof charts.seasonKey === "string" ? charts.seasonKey : "";
      if (!seasonKey) continue;

      copied += 1;
      if (!DRY_RUN) {
        batch.set(
          doc.ref.collection("profileCharts").doc(seasonKey),
          {
            v: charts.v,
            seasonKey,
            dailyTrend: charts.dailyTrend ?? [],
            rankTrend: charts.rankTrend ?? [],
            last20: charts.last20 ?? [],
            builtAtMs:
              typeof charts.builtAtMs === "number"
                ? charts.builtAtMs
                : Date.now(),
          },
          { merge: true }
        );
        batchOps += 1;
        if (batchOps >= 400) {
          await batch.commit();
          batch = db.batch();
          batchOps = 0;
        }
      }
    }

    if (!DRY_RUN && batchOps > 0) await batch.commit();
    last = snap.docs[snap.docs.length - 1];
    console.log(`processed=${processed} copied=${copied}`);
  }

  console.log(DRY_RUN ? "[dry-run] " : "", `complete copied=${copied}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
