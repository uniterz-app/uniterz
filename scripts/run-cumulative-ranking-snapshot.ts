/**
 * buildCumulativeRankingSnapshot を手動実行（NBA 上位20 + snapshotRanks）。
 * 16:00 cron と同じ処理。修正後の cumulative_stats を反映する。
 *
 * 使い方（プロジェクトルート、service-account.json 必須）:
 *   npx tsx scripts/run-cumulative-ranking-snapshot.ts
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

const { buildCumulativeRankingSnapshot } = require(
  "../functions/lib/rankings/buildCumulativeRankingSnapshot.js"
) as {
  buildCumulativeRankingSnapshot: (opts?: {
    streakAllEligible?: boolean;
  }) => Promise<{
    ok: boolean;
    ranksWritten: number;
    historyDateKey: string;
  }>;
};

(async () => {
  console.log("=== run buildCumulativeRankingSnapshot (NBA) ===\n");
  const result = await buildCumulativeRankingSnapshot();
  console.log("result:", result);
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
