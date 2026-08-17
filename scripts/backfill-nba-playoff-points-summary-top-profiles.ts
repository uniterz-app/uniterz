/**
 * NBA プレーオフ games.pointsSummary.top の displayName / photoURL を
 * users から補完し直す（posts に author が無く handle だけ埋まっている問題）。
 *
 *   npx tsx scripts/backfill-nba-playoff-points-summary-top-profiles.ts --dry-run
 *   npx tsx scripts/backfill-nba-playoff-points-summary-top-profiles.ts
 */

// @ts-ignore
import adminPkg from "firebase-admin";
import fs from "fs";
import path from "path";
import {
  enrichGamePointsTopEntries,
  profileLiteFromUserDoc,
} from "../lib/results/enrichGamePointsTopProfiles";
import {
  parseGamePointsSummaryV1,
} from "../lib/results/gamePointsSummary";
import type { GamePointsTopEntryV1 } from "../lib/results/gamePointsTop";

const admin = adminPkg as typeof import("firebase-admin");

const DRY_RUN = process.argv.includes("--dry-run");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : Infinity;

function loadDotEnvLocal(): void {
  const p = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

function normalizePrivateKey(raw: string): string {
  return raw.trim().replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim();
}

function initAdmin(): void {
  loadDotEnvLocal();
  if (admin.apps.length) return;
  const saPath = path.resolve(process.cwd(), "service-account.json");
  if (fs.existsSync(saPath)) {
    admin.initializeApp({
      credential: admin.credential.cert(
        JSON.parse(fs.readFileSync(saPath, "utf8"))
      ),
    });
    return;
  }
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = normalizePrivateKey(
    process.env.FIREBASE_PRIVATE_KEY ?? ""
  );
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing credentials: service-account.json or FIREBASE_* in .env.local"
    );
  }
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

function topChanged(
  before: GamePointsTopEntryV1[],
  after: GamePointsTopEntryV1[]
): boolean {
  if (before.length !== after.length) return true;
  for (let i = 0; i < before.length; i++) {
    const a = before[i];
    const b = after[i];
    if (
      a.displayName !== b.displayName ||
      a.handle !== b.handle ||
      a.photoURL !== b.photoURL ||
      a.isPro !== b.isPro
    ) {
      return true;
    }
  }
  return false;
}

async function main() {
  initAdmin();
  const db = admin.firestore();

  console.log("=== enrich NBA playoff pointsSummary.top from users ===");
  if (DRY_RUN) console.log(">>> DRY RUN\n");

  const playoffsSnap = await db
    .collection("games")
    .where("seasonPhase", "==", "playoffs")
    .get();

  const nbaGames = playoffsSnap.docs.filter((d) => {
    const league = String(d.data()?.league ?? "")
      .trim()
      .toLowerCase();
    return league === "nba";
  });

  let scanned = 0;
  let updated = 0;
  let skippedNoSummary = 0;
  let unchanged = 0;
  let usersFetched = 0;

  let batch = db.batch();
  let ops = 0;

  for (const gameDoc of nbaGames) {
    if (scanned >= LIMIT) break;
    scanned += 1;
    const summary = parseGamePointsSummaryV1(gameDoc.data()?.pointsSummary);
    if (!summary || summary.top.length === 0) {
      skippedNoSummary += 1;
      continue;
    }

    const uids = [
      ...new Set(
        summary.top
          .map((r) => r.uid?.trim() || "")
          .filter(Boolean)
      ),
    ];
    const profiles = new Map();
    if (uids.length > 0) {
      const refs = uids.map((uid) => db.collection("users").doc(uid));
      const snaps = await db.getAll(...refs);
      usersFetched += snaps.length;
      for (const snap of snaps) {
        if (!snap.exists) continue;
        const lite = profileLiteFromUserDoc(
          snap.data() as Record<string, unknown>
        );
        if (lite) profiles.set(snap.id, lite);
      }
    }

    const nextTop = enrichGamePointsTopEntries(summary.top, profiles);
    if (!topChanged(summary.top, nextTop)) {
      unchanged += 1;
      continue;
    }

    updated += 1;
    console.log(
      `[${DRY_RUN ? "dry" : "write"}] ${gameDoc.id} e.g. ${summary.top[0]?.displayName} → ${nextTop[0]?.displayName} photo=${Boolean(nextTop[0]?.photoURL)}`
    );

    if (!DRY_RUN) {
      batch.set(
        gameDoc.ref,
        {
          pointsSummary: {
            ...summary,
            top: nextTop,
            updatedAtMillis: Date.now(),
          },
        },
        { merge: true }
      );
      ops += 1;
      if (ops >= 400) {
        await batch.commit();
        batch = db.batch();
        ops = 0;
      }
    }
  }

  if (!DRY_RUN && ops > 0) {
    await batch.commit();
  }

  console.log("\n=== done ===");
  console.log(
    JSON.stringify(
      { scanned, updated, unchanged, skippedNoSummary, usersFetched, dryRun: DRY_RUN },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
