/**
 * posts の updatedAt が「指定暦日（JST）の翌日 0:00 未満」のドキュメントをバッチ削除する。
 * 例: --through 2026-04-12 → 2026-04-12 23:59:59 JST まで（含む）を削除対象にしたい場合の上限は
 *      updatedAt < 2026-04-13 00:00:00+09:00
 *
 * 認証: リポジトリ直下の service-account.json（他スクリプトと同様）
 *
 * 使い方:
 *   npx tsx scripts/deletePostsByUpdatedBefore.ts
 *   npx tsx scripts/deletePostsByUpdatedBefore.ts --through 2026-04-12 --execute
 *
 * --execute が無い場合は削除せず、バッチを読み進めて件数だけ数える（大量時は時間がかかる）
 */

import adminPkg from "firebase-admin";
import type { Query, QueryDocumentSnapshot } from "firebase-admin/firestore";
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

/** through の「翌日 0:00 JST」= updatedAt 上限（未満で削除） */
function exclusiveUpperBoundJst(throughYmd: string): Date {
  const [ys, ms, ds] = throughYmd.split("-");
  const startJst = new Date(`${ys}-${ms}-${ds}T00:00:00+09:00`);
  return new Date(startJst.getTime() + 24 * 60 * 60 * 1000);
}

const BATCH_SIZE = 400;

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

  const cutoff = exclusiveUpperBoundJst(through);
  const cutoffTs = admin.firestore.Timestamp.fromDate(cutoff);

  console.log(
    execute ? "=== DELETE MODE (--execute) ===" : "=== DRY RUN（削除しません）==="
  );
  console.log(`JST 暦日 ${through} まで（含む）を対象: updatedAt < ${cutoff.toISOString()}`);
  console.log(`バッチサイズ: ${BATCH_SIZE}`);

  let total = 0;
  let lastDoc: QueryDocumentSnapshot | undefined;

  for (;;) {
    let q: Query = db
      .collection("posts")
      .where("updatedAt", "<", cutoffTs)
      .orderBy("updatedAt", "asc")
      .limit(BATCH_SIZE);

    if (lastDoc) q = q.startAfter(lastDoc);

    const snap = await q.get();
    if (snap.empty) break;

    total += snap.size;
    lastDoc = snap.docs[snap.docs.length - 1]!;

    if (execute) {
      const batch = db.batch();
      for (const doc of snap.docs) {
        batch.delete(doc.ref);
      }
      await batch.commit();
      console.log(`deleted ${snap.size} (cumulative ${total})`);
    } else {
      console.log(`would delete ${snap.size} (cumulative ${total})`);
    }

    if (snap.size < BATCH_SIZE) break;
  }

  console.log(
    execute
      ? `=== 完了: 合計 ${total} 件を削除しました ===`
      : `=== ドライラン完了: 対象 ${total} 件（--execute で削除）===`
  );
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
