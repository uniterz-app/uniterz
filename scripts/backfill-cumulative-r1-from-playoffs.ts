/**
 * cumulative_stats の rankingByPhase.playoffs を rankingByPlayoffRound.r1 にコピーする。
 * 既存プレーオフ集計がすべて 1st ラウンド相当である前提の一回限りの再集計用。
 *
 * Usage:
 *   npx tsx scripts/backfill-cumulative-r1-from-playoffs.ts
 *   npx tsx scripts/backfill-cumulative-r1-from-playoffs.ts --dry-run
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

type RankingTotals = {
  totalPosts: number;
  totalWins: number;
  totalPoints: number;
  totalUpset: number;
  totalPrecision: number;
  winRate: number;
};

function playoffsToR1(playoffs: unknown): RankingTotals | null {
  if (!playoffs || typeof playoffs !== "object") return null;
  const o = playoffs as Record<string, unknown>;
  const tp = Number(o.totalPosts ?? 0);
  const tw = Number(o.totalWins ?? 0);
  return {
    totalPosts: tp,
    totalWins: tw,
    totalPoints: Number(o.totalPoints ?? 0),
    totalUpset: Number(o.totalUpset ?? 0),
    totalPrecision: Number(o.totalPrecision ?? 0),
    winRate: tp > 0 ? tw / tp : 0,
  };
}

function r1EqualsPlayoffs(
  r1: unknown,
  playoffs: RankingTotals
): boolean {
  if (!r1 || typeof r1 !== "object") return false;
  const x = r1 as Record<string, unknown>;
  const tp = Number(x.totalPosts ?? 0);
  const tw = Number(x.totalWins ?? 0);
  if (tp !== playoffs.totalPosts || tw !== playoffs.totalWins) return false;
  if (Number(x.totalPoints ?? 0) !== playoffs.totalPoints) return false;
  if (Number(x.totalUpset ?? 0) !== playoffs.totalUpset) return false;
  if (Number(x.totalPrecision ?? 0) !== playoffs.totalPrecision) return false;
  return true;
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
  const PAGE = 400;
  let last: FirebaseFirestore.DocumentSnapshot | undefined;
  let scanned = 0;
  let updated = 0;
  let skippedNoPlayoffs = 0;
  let skippedAlready = 0;

  let batch = db.batch();
  let ops = 0;

  for (;;) {
    let q: FirebaseFirestore.Query = db
      .collection("cumulative_stats")
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(PAGE);
    if (last) q = q.startAfter(last);

    const snap = await q.get();
    if (snap.empty) break;

    for (const doc of snap.docs) {
      scanned += 1;
      const data = doc.data();
      const playoffs = data.rankingByPhase?.playoffs;
      const r1 = playoffsToR1(playoffs);
      if (!r1) {
        skippedNoPlayoffs += 1;
        continue;
      }
      const curR1 = data.rankingByPlayoffRound?.r1;
      if (r1EqualsPlayoffs(curR1, r1)) {
        skippedAlready += 1;
        continue;
      }
      updated += 1;
      if (!dryRun) {
        batch.update(doc.ref, {
          "rankingByPlayoffRound.r1": r1,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        ops += 1;
        if (ops >= 450) {
          await batch.commit();
          batch = db.batch();
          ops = 0;
        }
      }
    }

    last = snap.docs[snap.docs.length - 1];
    if (snap.size < PAGE) break;
  }

  if (!dryRun && ops > 0) {
    await batch.commit();
  }

  console.log(
    `[backfill cumulative r1 from playoffs] scanned=${scanned} updated=${updated} skipped_no_playoffs=${skippedNoPlayoffs} skipped_already_match=${skippedAlready} dryRun=${dryRun}`
  );
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
