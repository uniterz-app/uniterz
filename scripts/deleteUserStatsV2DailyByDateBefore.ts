/**
 * user_stats_v2_daily の date（JST 暦日キー YYYY-MM-DD）が --through 以下のドキュメントを削除する。
 * 各ドキュメントの applied_posts サブコレクションを先に空にしてから親を削除する。
 *
 * 認証: リポジトリ直下の service-account.json
 *
 * 使い方:
 *   npx tsx scripts/deleteUserStatsV2DailyByDateBefore.ts
 *   npx tsx scripts/deleteUserStatsV2DailyByDateBefore.ts --through 2026-04-12 --execute
 *
 * --execute が無い場合は親ドキュメント件数のみ数える（サブコレクションは触らない）
 */

import adminPkg from "firebase-admin";
import type {
  DocumentReference,
  Query,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

const admin = adminPkg;

const SERVICE_ACCOUNT_PATH = path.join(
  process.cwd(),
  "service-account.json"
);

function parseArgs() {
  const argv = process.argv.slice(2);
  const execute = argv.includes("--execute");
  let through = "2026-04-12";
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a.startsWith("--through=")) through = a.slice("--through=".length);
    else if (a === "--through" && argv[i + 1]) {
      through = argv[i + 1]!;
      i++;
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(through)) {
    throw new Error(`--through は YYYY-MM-DD 形式で指定してください: ${through}`);
  }
  return { execute, through };
}

const BATCH_SIZE = 400;
const SUB_BATCH = 450;

async function deleteAppliedPostsMarkers(parentRef: DocumentReference): Promise<number> {
  const db = parentRef.firestore;
  const sub = parentRef.collection("applied_posts");
  let removed = 0;
  for (;;) {
    const snap = await sub.limit(SUB_BATCH).get();
    if (snap.empty) break;
    const batch = db.batch();
    for (const d of snap.docs) {
      batch.delete(d.ref);
    }
    await batch.commit();
    removed += snap.size;
    if (snap.size < SUB_BATCH) break;
  }
  return removed;
}

(async () => {
  const { execute, through } = parseArgs();

  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`service-account.json が見つかりません: ${SERVICE_ACCOUNT_PATH}`);
    process.exit(1);
  }

  const serviceAccount = JSON.parse(
    fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8")
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  const db = admin.firestore();

  console.log(
    execute ? "=== DELETE MODE (--execute) ===" : "=== DRY RUN（削除しません）==="
  );
  console.log(
    `対象: user_stats_v2_daily で date <= ${through}（4/13 以降の date はクエリに含まれません）`
  );
  console.log(`バッチサイズ: ${BATCH_SIZE}`);

  let total = 0;
  let markersRemoved = 0;
  let lastDoc: QueryDocumentSnapshot | undefined;

  for (;;) {
    let q: Query = db
      .collection("user_stats_v2_daily")
      .where("date", "<=", through)
      .orderBy("date", "asc")
      .limit(BATCH_SIZE);

    if (lastDoc) q = q.startAfter(lastDoc);

    const snap = await q.get();
    if (snap.empty) break;

    total += snap.size;
    lastDoc = snap.docs[snap.docs.length - 1]!;

    if (execute) {
      let batchMarkers = 0;
      for (const doc of snap.docs) {
        batchMarkers += await deleteAppliedPostsMarkers(doc.ref);
      }
      markersRemoved += batchMarkers;
      const batch = db.batch();
      for (const doc of snap.docs) {
        batch.delete(doc.ref);
      }
      await batch.commit();
      console.log(
        `deleted ${snap.size} parents, ${batchMarkers} markers (parents cumulative ${total}, markers cumulative ${markersRemoved})`
      );
    } else {
      console.log(`would delete ${snap.size} parents (cumulative ${total})`);
    }

    if (snap.size < BATCH_SIZE) break;
  }

  console.log(
    execute
      ? `=== 完了: 親 ${total} 件削除、applied_posts 合計 ${markersRemoved} 件削除 ===`
      : `=== ドライラン完了: 対象親 ${total} 件（--execute で削除）===`
  );
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
