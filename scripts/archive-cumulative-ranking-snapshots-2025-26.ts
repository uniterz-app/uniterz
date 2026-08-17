/**
 * 2025-26 プレーオフ期の cumulative_ranking_snapshots 全 doc を
 * cumulative_ranking_snapshots_archive/2025-26-playoffs/docs/{docId} にコピーする一発スクリプト。
 *
 * - 元 doc は削除しない（26-27 以降は s2026-27_* の新 doc ID を使うため衝突しない）
 * - cumulative_stats はそのまま残す（生データのアーカイブ・バッジに影響なし）
 *
 * 使い方（プロジェクトルート、service-account.json 必須）:
 *   npx tsx scripts/archive-cumulative-ranking-snapshots-2025-26.ts           # dry-run
 *   npx tsx scripts/archive-cumulative-ranking-snapshots-2025-26.ts --apply   # 実行
 */

import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
/** functions と同じ firebase-admin インスタンスを使う（二重 initialize 防止） */
const admin = require("../functions/node_modules/firebase-admin") as typeof import("firebase-admin");

if (!fs.existsSync("service-account.json")) {
  console.error("service-account.json が見つかりません（プロジェクトルートで実行）");
  process.exit(1);
}

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const ARCHIVE_PARENT = "cumulative_ranking_snapshots_archive";
const ARCHIVE_SEASON = "2025-26-playoffs";

(async () => {
  const apply = process.argv.includes("--apply");
  const db = admin.firestore();

  const srcCol = db.collection("cumulative_ranking_snapshots");
  const snap = await srcCol.get();
  console.log(
    `=== archive cumulative_ranking_snapshots -> ${ARCHIVE_PARENT}/${ARCHIVE_SEASON}/docs ===`
  );
  console.log(`source docs: ${snap.size}${apply ? "" : "（dry-run: --apply で実行）"}\n`);

  const parentRef = db
    .collection(ARCHIVE_PARENT)
    .doc(ARCHIVE_SEASON);
  const destCol = parentRef.collection("docs");

  if (apply) {
    await parentRef.set(
      {
        season: "2025-26",
        note: "25-26 playoffs final snapshots (play_in / playoffs / rounds / wc)",
        sourceCollection: "cumulative_ranking_snapshots",
        docCount: snap.size,
        archivedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  let copied = 0;
  let batch = db.batch();
  let inBatch = 0;
  for (const doc of snap.docs) {
    console.log(`  ${doc.id}`);
    if (!apply) continue;
    batch.set(destCol.doc(doc.id), doc.data(), { merge: false });
    inBatch++;
    copied++;
    if (inBatch >= 400) {
      await batch.commit();
      batch = db.batch();
      inBatch = 0;
    }
  }
  if (apply && inBatch > 0) await batch.commit();

  console.log(
    apply
      ? `\ndone: copied ${copied}/${snap.size} docs`
      : `\ndry-run only（コピーなし）。--apply を付けて実行してください`
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
