/**
 * cumulative_stats.profileCharts を一括 backfill。
 * 26-27 活動ゼロのユーザーは空バンドルだけ書いて ensure の重い読みを避ける。
 * 活動ありは /api/profile/ensure-overview-charts を叩く（本番 API）。
 *
 * 使い方（リポジトリルート、service-account.json 必須）:
 *   npx tsx scripts/backfill-profile-charts.ts --dry-run
 *   npx tsx scripts/backfill-profile-charts.ts --limit=50
 *   npx tsx scripts/backfill-profile-charts.ts
 *   npx tsx scripts/backfill-profile-charts.ts --api=https://uniterz.app
 */

// @ts-ignore
import adminPkg from "firebase-admin";
import fs from "fs";

const admin = adminPkg as typeof import("firebase-admin");

const DRY_RUN = process.argv.includes("--dry-run");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : Infinity;
const apiArg = process.argv.find((a) => a.startsWith("--api="));
const API_BASE = (apiArg?.split("=")[1] ?? "https://uniterz.app").replace(
  /\/+$/,
  ""
);

const SEASON_KEY = "2026-27";
const BUNDLE_V = 1;

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function seasonPosts(data: FirebaseFirestore.DocumentData): number {
  const bySeason = (data.rankingBySeason ?? {}) as Record<
    string,
    { totalPosts?: unknown; posts?: unknown }
  >;
  const bucket = bySeason[SEASON_KEY];
  if (!bucket || typeof bucket !== "object") return 0;
  const n = Number(bucket.totalPosts ?? bucket.posts ?? 0);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function isComplete(data: FirebaseFirestore.DocumentData): boolean {
  const charts = data.profileCharts as Record<string, unknown> | undefined;
  if (!charts || charts.v !== BUNDLE_V) return false;
  if (charts.seasonKey !== SEASON_KEY) return false;
  return (
    Array.isArray(charts.dailyTrend) &&
    Array.isArray(charts.rankTrend) &&
    Array.isArray(charts.last20)
  );
}

async function writeEmpty(uid: string): Promise<void> {
  if (DRY_RUN) return;
  await db.collection("cumulative_stats").doc(uid).set(
    {
      "profileCharts.v": BUNDLE_V,
      "profileCharts.seasonKey": SEASON_KEY,
      "profileCharts.dailyTrend": [],
      "profileCharts.rankTrend": [],
      "profileCharts.last20": [],
      "profileCharts.builtAtMs": Date.now(),
    },
    { merge: true }
  );
}

async function ensureViaApi(uid: string): Promise<boolean> {
  if (DRY_RUN) return true;
  const url = `${API_BASE}/api/profile/ensure-overview-charts?uid=${encodeURIComponent(uid)}&seasonKey=${SEASON_KEY}`;
  const secret = process.env.INTERNAL_JOB_SECRET?.trim();
  const headers: HeadersInit = {};
  if (secret) headers["x-internal-job-secret"] = secret;
  const res = await fetch(url, { cache: "no-store", headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn(`ensure fail ${uid}: ${res.status} ${text.slice(0, 120)}`);
    return false;
  }
  return true;
}

async function main() {
  console.log(
    `backfill profileCharts season=${SEASON_KEY} dryRun=${DRY_RUN} api=${API_BASE}`
  );

  let scanned = 0;
  let skippedComplete = 0;
  let wroteEmpty = 0;
  let ensuredActive = 0;
  let failed = 0;

  let query: FirebaseFirestore.Query = db
    .collection("cumulative_stats")
    .orderBy(admin.firestore.FieldPath.documentId())
    .limit(200);

  let last: FirebaseFirestore.QueryDocumentSnapshot | null = null;

  while (scanned < LIMIT) {
    const page = last ? query.startAfter(last) : query;
    const snap = await page.get();
    if (snap.empty) break;

    for (const doc of snap.docs) {
      if (scanned >= LIMIT) break;
      scanned += 1;
      last = doc;
      const uid = doc.id;
      const data = doc.data();

      if (isComplete(data)) {
        skippedComplete += 1;
        continue;
      }

      const posts = seasonPosts(data);
      if (posts <= 0) {
        await writeEmpty(uid);
        wroteEmpty += 1;
        if (wroteEmpty % 50 === 0) {
          console.log(`… empty ${wroteEmpty} (scanned ${scanned})`);
        }
        continue;
      }

      const ok = await ensureViaApi(uid);
      if (ok) ensuredActive += 1;
      else failed += 1;
      if ((ensuredActive + failed) % 10 === 0) {
        console.log(
          `… active ensure ok=${ensuredActive} fail=${failed} (scanned ${scanned})`
        );
      }
    }

    if (snap.size < 200) break;
  }

  console.log(
    JSON.stringify(
      {
        scanned,
        skippedComplete,
        wroteEmpty,
        ensuredActive,
        failed,
        dryRun: DRY_RUN,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
