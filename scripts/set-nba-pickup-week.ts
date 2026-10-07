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

import { existsSync, readFileSync } from "node:fs";
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

/** service-account.json（または GOOGLE_APPLICATION_CREDENTIALS）→ 無ければ .env.local の FIREBASE_* */
function loadServiceAccount(): Record<string, string> {
  const jsonPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ??
    resolve(process.cwd(), "service-account.json");
  if (existsSync(jsonPath)) {
    return JSON.parse(readFileSync(jsonPath, "utf8"));
  }
  const envPath = resolve(process.cwd(), ".env.local");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m || process.env[m[1]]) continue;
      let v = m[2].trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  }
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } =
    process.env;
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error(
      "Firebase Admin の認証情報がありません（service-account.json か .env.local の FIREBASE_*）"
    );
  }
  return {
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
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

  const admin = (await import("firebase-admin")).default;
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(loadServiceAccount()),
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
