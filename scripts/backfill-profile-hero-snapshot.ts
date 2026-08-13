/**
 * users.profileHeroSnapshot を 26-27 正データで上書き。
 * 現時点 26-27 は全ユーザー空 — rankingBySeason / rankingByNbaPlayoffs のみ（WC・ルート flat 禁止）。
 * 誤 legacy backfill 分は profileHeroSnapshot 保有 users を全件リセット。
 *
 *   npx tsx scripts/backfill-profile-hero-snapshot.ts --dry-run
 *   npx tsx scripts/backfill-profile-hero-snapshot.ts --limit=100
 */
import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";
import { buildProfileHeroSnapshotFromCumulative } from "../lib/profile/profileHeroSnapshot";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { FieldPath } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "../lib/rankings/nbaSeason";

const DRY_RUN = process.argv.includes("--dry-run");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : Infinity;
const ONLY_UID = process.argv.find((a) => a.startsWith("--uid="))?.split("=")[1];

const db = getAdminDb();

async function buildHeroForUid(uid: string) {
  const cumSnap = await db.collection("cumulative_stats").doc(uid).get();
  const cumulative = cumSnap.exists
    ? (cumSnap.data() as Record<string, unknown>)
    : null;
  return buildProfileHeroSnapshotFromCumulative(cumulative, CURRENT_NBA_SEASON_KEY);
}

async function writeHero(uid: string) {
  const hero = await buildHeroForUid(uid);
  if (!DRY_RUN) {
    await db.collection("users").doc(uid).set(
      { profileHeroSnapshot: hero },
      { merge: true }
    );
  }
  return hero;
}

async function main() {
  let processed = 0;
  let written = 0;

  if (ONLY_UID?.trim()) {
    const hero = await writeHero(ONLY_UID);
    console.log(
      "done",
      ONLY_UID,
      "seasonPosts=",
      hero.season.posts,
      "playoffPosts=",
      hero.playoffs.posts
    );
    return;
  }

  /** 誤 legacy が載った users を直接走査（cumulative 活動有無は見ない） */
  let last: QueryDocumentSnapshot | undefined;
  while (processed < LIMIT) {
    let q = db
      .collection("users")
      .where("profileHeroSnapshot.v", "==", 1)
      .orderBy(FieldPath.documentId())
      .limit(200);
    if (last) q = q.startAfter(last);
    const snap = await q.get();
    if (snap.empty) break;

    let batch = db.batch();
    let batchOps = 0;

    for (const userDoc of snap.docs) {
      if (processed >= LIMIT) break;
      processed += 1;
      const uid = userDoc.id;
      const hero = await buildHeroForUid(uid);
      written += 1;
      if (!DRY_RUN) {
        batch.set(
          db.collection("users").doc(uid),
          { profileHeroSnapshot: hero },
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
    console.log(`processed=${processed} written=${written}`);
  }

  console.log(
    DRY_RUN ? "[dry-run] " : "",
    `complete written=${written} season=${CURRENT_NBA_SEASON_KEY} (26-27 all-zero expected)`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
