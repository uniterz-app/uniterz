/**
 * チーム順位表を再計算（teams の rank / winRate / points を更新）
 *
 * `updateTeamRankings()` を直接実行（本番 Cron は JST 当日に NBA 試合がある日の 16:00 のみ）。
 *
 * 前提:
 * - リポジトリルートで実行
 * - service-account.json をルートに配置
 * - 先に functions をビルド済みであること:
 *     cd functions && npm run build
 *
 * 実行:
 *   npx tsx scripts/run-update-team-rankings.ts
 */

import { createRequire } from "module";
import { readFileSync } from "fs";
import { join } from "path";

const require = createRequire(import.meta.url);

/** functions と同じ firebase-admin インスタンスを使う（ルートの別バージョンだと initialize が効かない） */
const admin = require(join(
  process.cwd(),
  "functions/node_modules/firebase-admin"
)) as typeof import("firebase-admin");

const saPath = join(process.cwd(), "service-account.json");
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(readFileSync(saPath, "utf8"))),
});

const { updateTeamRankings } = require(
  join(process.cwd(), "functions/lib/team-standing/updateTeamRankings.js")
) as { updateTeamRankings: () => Promise<{ ok: boolean }> };

updateTeamRankings()
  .then((r) => {
    console.log("OK team rankings updated:", r);
    process.exit(0);
  })
  .catch((e) => {
    console.error("run-update-team-rankings failed:", e);
    process.exit(1);
  });
