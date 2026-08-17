/**
 * NBA プレーオフ: `games.topScorerMarket` を既存投稿から埋める。
 *
 *   npx tsx scripts/backfill-nba-playoff-top-scorer-market.ts --dry-run
 *   npx tsx scripts/backfill-nba-playoff-top-scorer-market.ts
 *   npx tsx scripts/backfill-nba-playoff-top-scorer-market.ts --force
 */

// @ts-ignore
import adminPkg from "firebase-admin";
import fs from "fs";
import path from "path";
import { buildTopScorerMarketEmbed } from "../lib/result/buildTopScorerMarketEmbed";

const admin = adminPkg as typeof import("firebase-admin");

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : Infinity;

function loadDotEnvLocal(): void {
  const p = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  const raw = fs.readFileSync(p, "utf8");
  for (const line of raw.split(/\r?\n/)) {
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
    if (!process.env[key]) process.env[key] = val;
  }
}

function initAdmin() {
  if (admin.apps.length > 0) return;
  loadDotEnvLocal();
  const saPath = path.resolve(process.cwd(), "service-account.json");
  if (fs.existsSync(saPath)) {
    admin.initializeApp({
      credential: admin.credential.cert(
        JSON.parse(fs.readFileSync(saPath, "utf8"))
      ),
    });
    return;
  }
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

function isNbaLeague(v: unknown) {
  return String(v ?? "").toLowerCase() === "nba";
}

function isPlayoffsPhase(v: unknown) {
  return String(v ?? "").toLowerCase() === "playoffs";
}

function hasTopScorerMarket(raw: unknown) {
  return (
    raw != null &&
    typeof raw === "object" &&
    (raw as { v?: unknown }).v === 1 &&
    Array.isArray((raw as { slices?: unknown }).slices) &&
    ((raw as { slices: unknown[] }).slices?.length ?? 0) > 0
  );
}

async function main() {
  initAdmin();
  const db = admin.firestore();

  console.log("=== backfill NBA playoff games.topScorerMarket ===");
  if (DRY_RUN) console.log(">>> DRY RUN\n");

  const playoffsSnap = await db
    .collection("games")
    .where("seasonPhase", "==", "playoffs")
    .get();

  const nbaGames = playoffsSnap.docs.filter((d) => {
    const data = d.data() as Record<string, unknown>;
    if (!isNbaLeague(data.league)) return false;
    if (!isPlayoffsPhase(data.seasonPhase)) return false;
    if (data.final === true) return true;
    const status =
      data.status ??
      (data.game !== null && typeof data.game === "object"
        ? (data.game as Record<string, unknown>).status
        : null);
    return String(status ?? "").toLowerCase() === "final";
  });

  let scanned = 0;
  let skipped = 0;
  let updated = 0;
  let empty = 0;

  for (const gameDoc of nbaGames) {
    if (scanned >= LIMIT) break;
    scanned += 1;
    const gameId = gameDoc.id;
    const game = gameDoc.data() as Record<string, unknown>;

    if (!FORCE && hasTopScorerMarket(game.topScorerMarket)) {
      skipped += 1;
      continue;
    }

    const postsSnap = await db
      .collection("posts")
      .where("gameId", "==", gameId)
      .where("schemaVersion", "==", 2)
      .get();

    const posts = postsSnap.docs.map((d) => d.data() as { prediction?: unknown });
    const embed = buildTopScorerMarketEmbed({
      league: game.league,
      posts,
      leadingScorers: game.leadingScorers,
      topScorerCandidates: game.topScorerCandidates,
    });

    if (!embed) {
      empty += 1;
      console.log(`[skip empty] ${gameId} posts=${postsSnap.size}`);
      continue;
    }

    console.log(
      `[${DRY_RUN ? "dry" : "write"}] ${gameId} n=${embed.n} slices=${embed.slices.length} hitRate=${embed.hitRatePct ?? "—"}`
    );

    if (!DRY_RUN) {
      await gameDoc.ref.set({ topScorerMarket: embed }, { merge: true });
    }
    updated += 1;
  }

  console.log(
    `\ndone scanned=${scanned} updated=${updated} skipped=${skipped} empty=${empty}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
