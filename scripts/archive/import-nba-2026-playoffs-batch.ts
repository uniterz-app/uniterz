/**
 * tools/ 配下の NBA 2026 プレーオフ JSON を Firestore games に一括投入
 *
 *   npx tsx scripts/import-nba-2026-playoffs-batch.ts
 *   npx tsx scripts/import-nba-2026-playoffs-batch.ts --dry-run
 */

import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const dryRun = process.argv.includes("--dry-run");

const JSON_GLOBS = [
  /^nba-2026-playoffs-.+\.json$/,
  /^nba-games-import-.+\.json$/,
];

type GameImport = {
  id: string;
  startAtJstIso: string;
  [key: string]: unknown;
};

function toJstTimestamp(isoString: string) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const admin = require("firebase-admin");
  return admin.firestore.Timestamp.fromDate(new Date(isoString));
}

function collectGamesFromTools(): GameImport[] {
  const toolsDir = resolve(process.cwd(), "tools");
  const files = readdirSync(toolsDir).filter((name) =>
    JSON_GLOBS.some((re) => re.test(name))
  );

  const byId = new Map<string, GameImport>();

  for (const file of files.sort()) {
    const path = resolve(toolsDir, file);
    const rows = JSON.parse(readFileSync(path, "utf8")) as GameImport[];
    if (!Array.isArray(rows)) {
      console.warn(`skip ${file}: not an array`);
      continue;
    }
    for (const row of rows) {
      if (!row.id || !row.startAtJstIso) {
        console.warn(`skip row in ${file}: missing id or startAtJstIso`);
        continue;
      }
      byId.set(row.id, row);
    }
    console.log(`read ${file}: ${rows.length} rows`);
  }

  return Array.from(byId.values());
}

async function main() {
  const games = collectGamesFromTools();
  console.log(`\n合計 ${games.length} 試合（id 重複除去後）\n`);

  if (dryRun) {
    const months = new Set(
      games.map((g) => g.startAtJstIso.slice(0, 7)).sort()
    );
    console.log("対象月:", [...months].join(", "));
    console.log("dry-run のため書き込みはしません");
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const admin = require("firebase-admin");
  const serviceAccountPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ??
    resolve(process.cwd(), "service-account.json");
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  const db = admin.firestore();
  let ok = 0;
  for (const g of games) {
    const { startAtJstIso, ...rest } = g;
    const startAtTs = toJstTimestamp(startAtJstIso);
    await db
      .collection("games")
      .doc(g.id)
      .set(
        {
          ...rest,
          startAt: startAtTs,
          startAtJst: startAtTs,
        },
        { merge: true }
      );
    ok += 1;
    console.log(`ok ${g.id} (${startAtJstIso})`);
  }

  console.log(`\n=== done: ${ok} games ===`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
