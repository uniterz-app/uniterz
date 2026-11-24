/**
 * 12月お知らせをアプリから外す（visible: false）。ドキュメントは残す。
 *
 *   npx tsx --tsconfig tsconfig.json scripts/hide-december-2026-notice.ts
 */
import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";
import { hideDecember2026Notice } from "../lib/campaigns/loadChallengeMetrics";

async function main() {
  const r = await hideDecember2026Notice(getAdminDb());
  console.log(
    r.hidden
      ? `hid ${r.id}`
      : `${r.id} was not in Firestore`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
