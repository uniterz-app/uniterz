/**
 * SEASON ZERO バッジを、Web版で遊んだ人に付与する。
 *
 * 対象: 試合予想・シーズン順位予想・シーズン賞予想を1件以上出した uid。
 * 投稿に端末の区別は無い。App Store 未公開のため、いまの投稿者は Web で遊んだ人。
 *
 *   npm run badges:season-zero:seed
 *   npm run badges:season-zero:grant:dry
 *   npm run badges:season-zero:grant
 */

import adminPkg from "firebase-admin";
const admin = adminPkg;
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import fs from "fs";
import { userBadgeGrantFields } from "../lib/badges/badgeGrant";
import { stampMasterBadgeParticipantCount } from "../lib/badges/server/stampMasterBadgeParticipantCount";

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const { FieldPath, FieldValue } = admin.firestore;

const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
const BADGE_ID = "season_zero_web";
const PAGE = 500;

function readUid(data: Record<string, unknown>, docId: string): string | null {
  const uid = typeof data.uid === "string" ? data.uid.trim() : "";
  if (uid) return uid;
  const author = typeof data.authorUid === "string" ? data.authorUid.trim() : "";
  if (author) return author;
  const sep = docId.lastIndexOf("_");
  if (sep > 0) {
    const fromId = docId.slice(sep + 1).trim();
    if (fromId) return fromId;
  }
  return null;
}

async function collectField(
  collectionName: string,
  field: "authorUid" | "uid",
  into: Set<string>,
  onlySubmitted: boolean
): Promise<number> {
  let last: QueryDocumentSnapshot | null = null;
  let docs = 0;
  for (;;) {
    let q = db
      .collection(collectionName)
      .orderBy(FieldPath.documentId())
      .select(field, "isSubmitted")
      .limit(PAGE);
    if (last) q = q.startAfter(last);
    const snap = await q.get();
    if (snap.empty) break;
    docs += snap.size;
    for (const doc of snap.docs) {
      const data = doc.data() as Record<string, unknown>;
      if (onlySubmitted && data.isSubmitted !== true) continue;
      const uid = readUid(data, doc.id);
      if (uid) into.add(uid);
    }
    last = snap.docs[snap.docs.length - 1] ?? null;
    if (snap.size < PAGE) break;
  }
  return docs;
}

async function missingGrantUids(uids: string[]): Promise<string[]> {
  const missing: string[] = [];
  for (let i = 0; i < uids.length; i += 100) {
    const slice = uids.slice(i, i + 100);
    const refs = slice.map((uid) =>
      db.collection("user_badges").doc(uid).collection("badges").doc(BADGE_ID)
    );
    const snaps = await db.getAll(...refs);
    snaps.forEach((snap, idx) => {
      if (!snap.exists) missing.push(slice[idx]!);
    });
  }
  return missing;
}

async function grant() {
  const uids = new Set<string>();
  const postDocs = await collectField("posts", "authorUid", uids, false);
  const afterPosts = uids.size;
  const standingsDocs = await collectField(
    "seasonStandingsPredictions",
    "uid",
    uids,
    true
  );
  const afterStandings = uids.size;
  const awardsDocs = await collectField(
    "seasonAwardsPredictions",
    "uid",
    uids,
    true
  );

  const all = [...uids];
  console.log(
    JSON.stringify(
      {
        dryRun: DRY_RUN,
        postDocs,
        standingsDocs,
        awardsDocs,
        players: all.length,
        fromPosts: afterPosts,
        addedByStandings: afterStandings - afterPosts,
        addedByAwards: uids.size - afterStandings,
      },
      null,
      2
    )
  );

  if (all.length === 0) {
    console.log("対象なし");
    process.exit(0);
  }

  const toGrant = DRY_RUN ? all : await missingGrantUids(all);
  console.log(`付与対象 ${toGrant.length} / 遊んだ人 ${all.length}`);

  if (DRY_RUN) {
    console.log("DRY_RUN のため書き込みなし");
    process.exit(0);
  }

  const fields = userBadgeGrantFields({
    badgeId: BADGE_ID,
    meta: {
      participantCount: all.length,
      source: "web_era",
    },
  });

  let batch = db.batch();
  let ops = 0;
  let written = 0;
  for (const uid of toGrant) {
    batch.set(
      db.collection("user_badges").doc(uid).collection("badges").doc(BADGE_ID),
      { ...fields, grantedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    ops++;
    written++;
    if (ops >= 400) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }
  if (ops > 0) await batch.commit();

  await stampMasterBadgeParticipantCount(db, [BADGE_ID], all.length);
  console.log(`✔ granted ${BADGE_ID} to ${written} users (players ${all.length})`);
  process.exit(0);
}

grant().catch((e) => {
  console.error(e);
  process.exit(1);
});
