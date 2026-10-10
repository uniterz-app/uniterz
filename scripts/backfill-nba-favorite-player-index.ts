/**
 * `nbaFavoritePlayerIndex/all` を既存ユーザーの `favoriteNbaPlayerIds` から作る（一度だけ）。
 * 以後は `/api/me/nba-favorites` が保存時に追記する。
 *
 *   npx tsx scripts/backfill-nba-favorite-player-index.ts
 *
 * 認証: `.env.local` の FIREBASE_*
 */
import fs from "fs";
import path from "path";

function loadEnvLocal(): void {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const raw of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    const i = line.indexOf("=");
    if (!line || line.startsWith("#") || i <= 0) continue;
    let val = line.slice(i + 1).trim();
    if (/^(["']).*\1$/.test(val)) val = val.slice(1, -1);
    process.env[line.slice(0, i).trim()] ??= val;
  }
}

async function main() {
  loadEnvLocal();
  const { getAdminDb } = await import("../lib/firebaseAdmin");
  const { addNbaFavoritePlayerIdsToIndex } = await import(
    "../lib/nba/discipline/nbaFavoritePlayerIndex"
  );
  const db = getAdminDb();
  const snap = await db.collection("users").select("favoriteNbaPlayerIds").get();
  const ids = new Set<string>();
  for (const doc of snap.docs) {
    const list = doc.get("favoriteNbaPlayerIds");
    if (Array.isArray(list)) for (const id of list) if (typeof id === "string" && id) ids.add(id);
  }
  await addNbaFavoritePlayerIdsToIndex(db, [...ids]);
  console.log(JSON.stringify({ users: snap.size, playerIds: ids.size }));
}

void main().then(() => process.exit(0));
