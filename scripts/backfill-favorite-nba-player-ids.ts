/**
 * 既存 users の favoriteNbaPlayers から favoriteNbaPlayerIds を埋める（選手お気に入り数の集計用）。
 * 差分がある文書だけ書く。
 *
 * リポジトリルート・.env.local の FIREBASE_*:
 *   npx tsx scripts/backfill-favorite-nba-player-ids.ts --dry-run
 *   npx tsx scripts/backfill-favorite-nba-player-ids.ts
 */

import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";
import {
  nbaFavoritePlayerIdsOf,
  parseNbaFavorites,
} from "../lib/profile/nbaFavorites";

const DRY_RUN = process.argv.includes("--dry-run");

const db = getAdminDb();

function sameIds(a: unknown, b: string[]): boolean {
  if (!Array.isArray(a) || a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

async function main() {
  console.log("=== backfill users.favoriteNbaPlayerIds ===");
  if (DRY_RUN) console.log("(DRY_RUN: no writes)");

  const snap = await db
    .collection("users")
    .select("favoriteNbaPlayers", "favoriteNbaPlayerIds")
    .get();

  let scanned = 0;
  let toWrite = 0;
  let batch = db.batch();
  let pending = 0;

  for (const doc of snap.docs) {
    scanned++;
    const data = doc.data() as Record<string, unknown>;
    const hasPlayersField = "favoriteNbaPlayers" in data;
    const hasIdsField = "favoriteNbaPlayerIds" in data;
    if (!hasPlayersField && !hasIdsField) continue;

    const ids = nbaFavoritePlayerIdsOf(
      parseNbaFavorites(data).favoriteNbaPlayers,
    );
    if (sameIds(data.favoriteNbaPlayerIds, ids)) continue;

    toWrite++;
    console.log(`${doc.id}: ${JSON.stringify(data.favoriteNbaPlayerIds ?? null)} -> ${JSON.stringify(ids)}`);
    if (DRY_RUN) continue;
    batch.update(doc.ref, { favoriteNbaPlayerIds: ids });
    pending++;
    if (pending >= 400) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }
  if (!DRY_RUN && pending > 0) await batch.commit();

  console.log(`scanned=${scanned} ${DRY_RUN ? "wouldWrite" : "written"}=${toWrite}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
