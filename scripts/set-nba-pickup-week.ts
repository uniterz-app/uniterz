/**
 * NBA 週次ピックアップを Firestore に反映する（Cursor / 運用スクリプト）。
 *
 * 使い方:
 *   1. scripts/data/nba-pickup-{weekKey}.json を用意（または --file）
 *   2. dry-run で確認 → 本番書き込み
 *
 *   npx tsx scripts/set-nba-pickup-week.ts --file scripts/data/nba-pickup-2026-10-26.json --dry-run
 *   npx tsx scripts/set-nba-pickup-week.ts --file scripts/data/nba-pickup-2026-10-26.json
 *
 * JSON 例:
 *   {
 *     "weekKey": "2026-10-26",
 *     "gameIds": ["nba-2026-10-26-lal-bos", "nba-2026-10-27-gsw-nyk"],
 *     "status": "final",
 *     "note": "指定: ユーザー指示 2026-10-21"
 *   }
 *
 * 動作:
 *   - nba_pickup_weeks/{weekKey} を upsert
 *   - 旧 gameIds から外れた試合の pickupWeekKey を消す
 *   - 新 gameIds に pickupWeekKey を付与
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertWeekKey,
  nbaPickupWeekDocPath,
  weekRangeFromMondayKey,
  type NbaPickupWeekStatus,
} from "@/lib/pickup/nbaPickupWeek";

type PickupFile = {
  weekKey: string;
  gameIds: string[];
  status?: NbaPickupWeekStatus;
  note?: string;
  decidedBy?: string;
};

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  if (i < 0) return null;
  return process.argv[i + 1] ?? null;
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const fileArg = argValue("--file");
  if (!fileArg) {
    console.error(
      "Usage: npx tsx scripts/set-nba-pickup-week.ts --file scripts/data/nba-pickup-YYYY-MM-DD.json [--dry-run]"
    );
    process.exit(1);
  }

  const filePath = resolve(process.cwd(), fileArg);
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as PickupFile;
  const weekKey = assertWeekKey(raw.weekKey);
  const gameIds = uniqueIds(raw.gameIds ?? []);
  const status: NbaPickupWeekStatus = raw.status ?? "final";
  const note = raw.note ?? null;
  const decidedBy = raw.decidedBy ?? "cursor-ops";
  const { rangeStartJst, rangeEndJst } = weekRangeFromMondayKey(weekKey);

  console.log("weekKey:", weekKey);
  console.log("range:", rangeStartJst, "→", rangeEndJst);
  console.log("status:", status);
  console.log("gameIds:", gameIds.length);
  for (const id of gameIds) console.log("  -", id);
  if (note) console.log("note:", note);

  if (dryRun) {
    console.log("\ndry-run: 書き込みしません");
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const admin = require("firebase-admin");
  const serviceAccountPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ??
    resolve(process.cwd(), "service-account.json");
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  const db = admin.firestore();
  const FieldValue = admin.firestore.FieldValue;
  const weekRef = db.doc(nbaPickupWeekDocPath(weekKey));
  const prevSnap = await weekRef.get();
  const prevIds: string[] = Array.isArray(prevSnap.data()?.gameIds)
    ? (prevSnap.data()!.gameIds as string[])
    : [];

  const nextSet = new Set(gameIds);
  const removed = prevIds.filter((id) => !nextSet.has(id));
  const added = gameIds.filter((id) => !prevIds.includes(id));

  const batch = db.batch();
  batch.set(
    weekRef,
    {
      league: "nba",
      weekKey,
      rangeStartJst,
      rangeEndJst,
      status,
      gameIds,
      note,
      decidedBy: status === "final" ? decidedBy : null,
      decidedAt:
        status === "final" ? FieldValue.serverTimestamp() : null,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  for (const id of removed) {
    batch.set(
      db.doc(`games/${id}`),
      { pickupWeekKey: null, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }
  for (const id of gameIds) {
    batch.set(
      db.doc(`games/${id}`),
      { pickupWeekKey: weekKey, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }

  await batch.commit();
  console.log("\nok wrote", nbaPickupWeekDocPath(weekKey));
  console.log("synced games: +", added.length, "/ -", removed.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
