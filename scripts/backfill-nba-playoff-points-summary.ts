/**
 * NBA プレーオフ試合向け: リザルト詳細用 `games.pointsSummary` を既存投稿スコアから埋める。
 * 精算・ユーザー統計は触らない（読み取り + summary 書き込み + 任意で scoreRel / marketMeta %）。
 *
 * 使い方（リポジトリルート、.env.local の FIREBASE_* または service-account.json）:
 *   npx tsx scripts/backfill-nba-playoff-points-summary.ts --dry-run
 *   npx tsx scripts/backfill-nba-playoff-points-summary.ts --dry-run --limit=5
 *   npx tsx scripts/backfill-nba-playoff-points-summary.ts
 *   npx tsx scripts/backfill-nba-playoff-points-summary.ts --force
 *   npx tsx scripts/backfill-nba-playoff-points-summary.ts --skip-score-rel
 */

// @ts-ignore
import adminPkg from "firebase-admin";
import fs from "fs";
import path from "path";
import { buildGamePointsSummaryFromScores } from "../lib/results/gamePointsSummary";
import { authorMetaFromResultPost } from "../lib/results/gamePointsTop";
import {
  enrichGamePointsTopEntries,
  profileLiteFromUserDoc,
} from "../lib/results/enrichGamePointsTopProfiles";
import { resolveResultScoreRelative } from "../lib/result/resultScoreRelative";
import type { GamePointsTopEntryV1 } from "../lib/results/gamePointsTop";

const admin = adminPkg as typeof import("firebase-admin");

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");
const SKIP_SCORE_REL = process.argv.includes("--skip-score-rel");
const SKIP_MARKET_META = process.argv.includes("--skip-market-meta");
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
    const serviceAccount = JSON.parse(fs.readFileSync(saPath, "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
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

function isNbaLeague(raw: unknown): boolean {
  return String(raw ?? "")
    .trim()
    .toLowerCase() === "nba";
}

function isPlayoffsPhase(raw: unknown): boolean {
  return String(raw ?? "")
    .trim()
    .toLowerCase() === "playoffs";
}

function isFiniteNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** 既存 settle 済み投稿の得点（再計算しない） */
function postPoints(data: Record<string, unknown>): number | null {
  const stats =
    data.stats !== null && typeof data.stats === "object"
      ? (data.stats as Record<string, unknown>)
      : null;
  if (!stats) return null;
  if (isFiniteNum(stats.pointsV3)) return stats.pointsV3;
  const detail =
    stats.pointsV3Detail !== null && typeof stats.pointsV3Detail === "object"
      ? (stats.pointsV3Detail as Record<string, unknown>)
      : null;
  if (detail && isFiniteNum(detail.totalPoints)) return detail.totalPoints;
  return null;
}

function hasModernPointsSummary(raw: unknown): boolean {
  if (raw == null || typeof raw !== "object") return false;
  const o = raw as Record<string, unknown>;
  return o.v === 1 && isFiniteNum(o.n) && o.n > 0;
}

function hasEmbeddedMarketPct(meta: unknown): boolean {
  if (meta == null || typeof meta !== "object") return false;
  const m = meta as Record<string, unknown>;
  return (
    (isFiniteNum(m.homePct) && isFiniteNum(m.awayPct)) ||
    (isFiniteNum(m.homeRate) && isFiniteNum(m.awayRate))
  );
}

function marketPctPatchFromGame(
  game: Record<string, unknown>
): { homePct: number; awayPct: number; drawPct: number | null } | null {
  const mkt =
    game.market !== null && typeof game.market === "object"
      ? (game.market as Record<string, unknown>)
      : null;
  if (!mkt) return null;
  const homeRate = isFiniteNum(mkt.homeRate) ? mkt.homeRate : null;
  const awayRate = isFiniteNum(mkt.awayRate) ? mkt.awayRate : null;
  if (homeRate == null || awayRate == null) return null;
  const drawRate = isFiniteNum(mkt.drawRate) ? mkt.drawRate : null;
  return {
    homePct: Math.round(homeRate * 1000) / 10,
    awayPct: Math.round(awayRate * 1000) / 10,
    drawPct:
      drawRate == null ? null : Math.round(drawRate * 1000) / 10,
  };
}

async function commitBatches(
  db: FirebaseFirestore.Firestore,
  writes: Array<{
    ref: FirebaseFirestore.DocumentReference;
    data: Record<string, unknown>;
  }>
): Promise<number> {
  if (writes.length === 0) return 0;
  let batch = db.batch();
  let ops = 0;
  let committed = 0;
  for (const w of writes) {
    batch.set(w.ref, w.data, { merge: true });
    ops += 1;
    if (ops >= 400) {
      await batch.commit();
      committed += ops;
      batch = db.batch();
      ops = 0;
    }
  }
  if (ops > 0) {
    await batch.commit();
    committed += ops;
  }
  return committed;
}

async function main() {
  initAdmin();
  const db = admin.firestore();

  console.log("=== backfill NBA playoff games.pointsSummary ===");
  if (DRY_RUN) console.log(">>> DRY RUN\n");
  console.log(
    `force=${FORCE} skipScoreRel=${SKIP_SCORE_REL} skipMarketMeta=${SKIP_MARKET_META} limit=${
      Number.isFinite(LIMIT) ? LIMIT : "∞"
    }\n`
  );

  const playoffsSnap = await db
    .collection("games")
    .where("seasonPhase", "==", "playoffs")
    .get();

  const nbaGames = playoffsSnap.docs.filter((d) => {
    const data = d.data() as Record<string, unknown>;
    if (!isNbaLeague(data.league)) return false;
    if (!isPlayoffsPhase(data.seasonPhase)) return false;
    // final 済み（boolean または status）
    if (data.final === true) return true;
    const status =
      data.status ??
      (data.game !== null && typeof data.game === "object"
        ? (data.game as Record<string, unknown>).status
        : null);
    return String(status ?? "").toLowerCase() === "final";
  });

  console.log(
    `playoffs games total=${playoffsSnap.size}, nba final=${nbaGames.length}`
  );

  let scanned = 0;
  let skippedHasSummary = 0;
  let skippedNoPosts = 0;
  let skippedNoScores = 0;
  let gamesUpdated = 0;
  let postsScoreRel = 0;
  let postsMarketMeta = 0;
  let postsRead = 0;
  let writeOps = 0;

  const pendingWrites: Array<{
    ref: FirebaseFirestore.DocumentReference;
    data: Record<string, unknown>;
  }> = [];

  for (const gameDoc of nbaGames) {
    if (scanned >= LIMIT) break;
    scanned += 1;
    const gameId = gameDoc.id;
    const game = gameDoc.data() as Record<string, unknown>;

    if (!FORCE && hasModernPointsSummary(game.pointsSummary)) {
      skippedHasSummary += 1;
      continue;
    }

    const postsSnap = await db
      .collection("posts")
      .where("gameId", "==", gameId)
      .where("schemaVersion", "==", 2)
      .get();
    postsRead += postsSnap.size;

    if (postsSnap.empty) {
      skippedNoPosts += 1;
      continue;
    }

    const scores: number[] = [];
    const scoredRows: GamePointsTopEntryV1[] = [];

    for (const postDoc of postsSnap.docs) {
      const p = postDoc.data() as Record<string, unknown>;
      const pts = postPoints(p);
      if (pts == null) continue;
      scores.push(pts);
      const author = authorMetaFromResultPost(p);
      scoredRows.push({
        rank: 0,
        postId: postDoc.id,
        uid: author.uid,
        handle: author.handle,
        displayName: author.displayName,
        photoURL: author.photoURL,
        isPro: author.isPro,
        points: pts,
      });
    }

    if (scores.length === 0) {
      skippedNoScores += 1;
      console.log(`[skip no scores] ${gameId} posts=${postsSnap.size}`);
      continue;
    }

    const topRaw = scoredRows
      .sort((a, b) => b.points - a.points || a.postId.localeCompare(b.postId))
      .slice(0, 10)
      .map((row, i) => ({ ...row, rank: i + 1 }));

    const topUids = [
      ...new Set(topRaw.map((r) => r.uid?.trim() || "").filter(Boolean)),
    ];
    const profiles = new Map();
    if (topUids.length > 0) {
      const refs = topUids.map((uid) => db.collection("users").doc(uid));
      const snaps = await db.getAll(...refs);
      for (const snap of snaps) {
        if (!snap.exists) continue;
        const lite = profileLiteFromUserDoc(
          snap.data() as Record<string, unknown>
        );
        if (lite) profiles.set(snap.id, lite);
      }
    }
    const top = enrichGamePointsTopEntries(topRaw, profiles);

    const summary = {
      ...buildGamePointsSummaryFromScores(scores, top),
      updatedAtMillis: Date.now(),
    };

    gamesUpdated += 1;
    console.log(
      `[${DRY_RUN ? "dry" : "write"}] ${gameId} n=${summary.n} median=${summary.median} max=${summary.max} top=${top.length}`
    );

    if (!DRY_RUN) {
      pendingWrites.push({
        ref: gameDoc.ref,
        data: { pointsSummary: summary },
      });
    }

    const marketPct = marketPctPatchFromGame(game);

    for (const postDoc of postsSnap.docs) {
      const p = postDoc.data() as Record<string, unknown>;
      const pts = postPoints(p);
      const patch: Record<string, unknown> = {};

      if (!SKIP_SCORE_REL && pts != null) {
        const stats =
          p.stats !== null && typeof p.stats === "object"
            ? (p.stats as Record<string, unknown>)
            : {};
        const nextRel = resolveResultScoreRelative(pts, summary);
        if (stats.scoreRel !== nextRel) {
          patch["stats.scoreRel"] = nextRel;
          postsScoreRel += 1;
        }
      }

      if (!SKIP_MARKET_META && marketPct && !hasEmbeddedMarketPct(p.marketMeta)) {
        const existing =
          p.marketMeta !== null && typeof p.marketMeta === "object"
            ? (p.marketMeta as Record<string, unknown>)
            : {};
        patch.marketMeta = {
          ...existing,
          homePct: marketPct.homePct,
          awayPct: marketPct.awayPct,
          drawPct: marketPct.drawPct,
        };
        postsMarketMeta += 1;
      }

      if (Object.keys(patch).length === 0) continue;
      if (!DRY_RUN) {
        pendingWrites.push({ ref: postDoc.ref, data: patch });
      }
    }

    if (!DRY_RUN && pendingWrites.length >= 350) {
      writeOps += await commitBatches(db, pendingWrites.splice(0));
    }
  }

  if (!DRY_RUN && pendingWrites.length > 0) {
    writeOps += await commitBatches(db, pendingWrites);
  }

  console.log("\n=== done ===");
  console.log(
    JSON.stringify(
      {
        scanned,
        gamesUpdated,
        skippedHasSummary,
        skippedNoPosts,
        skippedNoScores,
        postsRead,
        postsScoreRelTouched: postsScoreRel,
        postsMarketMetaTouched: postsMarketMeta,
        writeOps,
        dryRun: DRY_RUN,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
