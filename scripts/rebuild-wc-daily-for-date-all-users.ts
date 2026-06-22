/**
 * 指定日（JST）に WC 確定投稿がある全ユーザーの user_stats_v2_daily を再構築する。
 *
 * Usage:
 *   npx tsx scripts/rebuild-wc-daily-for-date-all-users.ts --date=2026-06-17 --dry-run
 *   npx tsx scripts/rebuild-wc-daily-for-date-all-users.ts --date=2026-06-17
 *   npx tsx scripts/rebuild-wc-daily-for-date-all-users.ts --date=2026-06-17 --uid=<UID>
 */

import { execSync } from "child_process";
import adminPkg from "firebase-admin";
import fs from "fs";

const admin = adminPkg as typeof import("firebase-admin");
const DRY_RUN = process.argv.includes("--dry-run");
const dateArg = process.argv.find((a) => a.startsWith("--date="));
const uidArg = process.argv.find((a) => a.startsWith("--uid="));
const DATE_KEY =
  dateArg?.slice("--date=".length).trim() ?? toDateKeyJST(new Date());
const SINGLE_UID = uidArg?.slice("--uid=".length).trim() ?? "";

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

function toDateKeyJST(d: Date): string {
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = j.getUTCFullYear();
  const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(j.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function uidsWithWcFinalPostsOnDate(dateKey: string): Promise<string[]> {
  const posts = await db
    .collection("posts")
    .where("league", "==", "wc")
    .where("status", "==", "final")
    .where("schemaVersion", "==", 2)
    .get();

  const uids = new Set<string>();
  for (const doc of posts.docs) {
    const p = doc.data();
    const uid = String(p.authorUid ?? "").trim();
    if (!uid) continue;
    const startAt =
      p.startAt?.toDate?.() ??
      p.gameStartAt?.toDate?.() ??
      p.startAtJst?.toDate?.();
    if (!startAt) continue;
    if (toDateKeyJST(startAt) !== dateKey) continue;
    uids.add(uid);
  }
  return [...uids].sort();
}

async function main() {
  const uids = SINGLE_UID
    ? [SINGLE_UID]
    : await uidsWithWcFinalPostsOnDate(DATE_KEY);

  console.log(`=== rebuild WC daily for ${DATE_KEY} ===`);
  console.log(`users: ${uids.length}`);
  if (DRY_RUN) console.log(">>> DRY RUN\n");

  let ok = 0;
  let failed = 0;

  for (const uid of uids) {
    const cmd = [
      "npx",
      "tsx",
      "scripts/rebuild-user-daily-stats-for-date.ts",
      `--uid=${uid}`,
      `--date=${DATE_KEY}`,
      ...(DRY_RUN ? ["--dry-run"] : []),
    ].join(" ");

    try {
      console.log(`\n--- ${uid} ---`);
      execSync(cmd, { stdio: "inherit", cwd: process.cwd() });
      ok += 1;
    } catch {
      console.error(`FAILED: ${uid}`);
      failed += 1;
    }
  }

  console.log(`\nDone. ok=${ok} failed=${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
