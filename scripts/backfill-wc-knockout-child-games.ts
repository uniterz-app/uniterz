/**
 * 既存の wcBracketResults.winners から、作成可能な子 knockout 試合を一括生成。
 *
 *   npx tsx scripts/backfill-wc-knockout-child-games.ts
 *   npx tsx scripts/backfill-wc-knockout-child-games.ts --dry-run
 *
 * Functions デプロイ前に final 済みの親試合がある場合の backfill 用。
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
// @ts-ignore
import adminPkg from "firebase-admin";
import { WC_KNOCKOUT_CHILD_MATCHES } from "../functions/lib/wc-bracket/wcKnockoutBracketStructure";
import { maybeCreateChildKnockoutGames } from "../functions/lib/wc-bracket/createChildKnockoutGames";

const admin = adminPkg;
const dryRun = process.argv.includes("--dry-run");
const SEASON = "2025-26";

const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ??
  (existsSync("service-account.json")
    ? resolve("service-account.json")
    : resolve("serviceAccount.json"));
const serviceAccount = JSON.parse(readFileSync(keyPath, "utf-8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
});

const db = admin.firestore();

(async () => {
  console.log(
    `=== WC knockout child games backfill${dryRun ? " [DRY RUN]" : ""} ===`
  );

  const resultsSnap = await db.collection("wcBracketResults").doc(SEASON).get();
  const winners = (resultsSnap.data()?.winners ?? {}) as Record<string, string>;
  const winnerCount = Object.keys(winners).length;

  console.log(`  wcBracketResults/${SEASON}: ${winnerCount} winner(s)`);
  if (winnerCount === 0) {
    console.log("  nothing to backfill (no finals recorded yet)");
    process.exit(0);
  }

  if (dryRun) {
    for (const def of WC_KNOCKOUT_CHILD_MATCHES) {
      const [a, b] = def.feedsFrom;
      const useRu = def.useRunnerUpFeeders === true;
      const homeOk = useRu ? `(SF final check)` : winners[a] ?? "—";
      const awayOk = useRu ? `(SF final check)` : winners[b] ?? "—";
      const ready = !useRu && winners[a] && winners[b];
      console.log(
        `  ${def.id}: ${a}=${homeOk} vs ${b}=${awayOk}${ready ? " → would create" : ""}`
      );
    }
    process.exit(0);
  }

  const allCreated = new Set<string>();
  for (const matchId of Object.keys(winners)) {
    const created = await maybeCreateChildKnockoutGames(db, {
      season: SEASON,
      finishedMatchId: matchId,
      winners,
    });
    for (const id of created) allCreated.add(id);
  }

  console.log(
    allCreated.size
      ? `  created/updated: ${[...allCreated].join(", ")}`
      : "  no new child games (feeders incomplete or already exist)"
  );
  console.log("=== done ===");
  process.exit(0);
})().catch((e) => {
  console.error("backfill failed:", e);
  process.exit(1);
});
