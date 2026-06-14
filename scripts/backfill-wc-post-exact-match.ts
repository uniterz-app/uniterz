/**
 * 確定済み WC 投稿に stats.exactMatch / stats.pointsV3Detail.exactMatch を付与する。
 * finalizePost と同じ calcPointsFootball（予想スコア vs 試合ラインスコア）で判定。
 *
 * 使い方（プロジェクトルート、service-account.json 必須）:
 *   cd functions && npm run build && cd ..
 *   npx tsx scripts/backfill-wc-post-exact-match.ts --dry-run
 *   npx tsx scripts/backfill-wc-post-exact-match.ts --uid=<UID>
 *   npx tsx scripts/backfill-wc-post-exact-match.ts
 *   npx tsx scripts/backfill-wc-post-exact-match.ts --force   # 既存値も再計算
 *
 * その後（完全的中ランキング反映）:
 *   npx tsx scripts/backfill-wc-exact-hit-counts.ts
 *   npx tsx scripts/backfill-wc-cumulative-from-daily.ts
 *   cd functions && npm run build && cd ..
 *   npx tsx scripts/run-cumulative-ranking-snapshot.ts
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import adminPkg from "firebase-admin";

const require = createRequire(import.meta.url);
const { calcPointsFootball } = require(
  "../functions/lib/footballTotalScore.js"
) as {
  calcPointsFootball: (
    prediction: { winner: string; score: { home: number; away: number } },
    g: SettlementGameInput
  ) => { exactMatch: boolean };
};

const admin = adminPkg as typeof import("firebase-admin");

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");
const uidArg = process.argv.find((a) => a.startsWith("--uid="));
const targetUid = uidArg ? uidArg.slice("--uid=".length).trim() : "";

const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ??
  (existsSync("service-account.json")
    ? resolve("service-account.json")
    : resolve("serviceAccount.json"));

if (!existsSync(keyPath)) {
  console.error(`サービスアカウントが見つかりません: ${keyPath}`);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(readFileSync(keyPath, "utf-8"))),
});

const db = admin.firestore();

type SettlementGameInput = {
  homeScore: number;
  awayScore: number;
  league?: string | null;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  regulationEtScore?: { home: number; away: number } | null;
  advancingTeamId?: string | null;
  knockout?: boolean;
};

function normalizeLeague(raw: unknown): string | null {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "wc" || v === "fifa") return "wc";
  return null;
}

function safeInt(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.floor(n) : null;
}

function settlementGameFromDoc(
  game: Record<string, unknown>
): SettlementGameInput | null {
  const homeScore = safeInt(game.homeScore);
  const awayScore = safeInt(game.awayScore);
  if (homeScore == null || awayScore == null) return null;

  const r = game.regulationEtScore as
    | { home?: unknown; away?: unknown }
    | null
    | undefined;
  const regHome = safeInt(r?.home);
  const regAway = safeInt(r?.away);
  const regulationEtScore =
    regHome != null && regAway != null
      ? { home: regHome, away: regAway }
      : null;

  return {
    homeScore,
    awayScore,
    league: game.league,
    homeTeamId:
      typeof game.homeTeamId === "string" ? game.homeTeamId : null,
    awayTeamId:
      typeof game.awayTeamId === "string" ? game.awayTeamId : null,
    regulationEtScore,
    advancingTeamId:
      typeof game.advancingTeamId === "string"
        ? game.advancingTeamId
        : null,
    knockout: game.knockout === true,
  };
}

function exactMatchFromPost(
  post: Record<string, unknown>,
  game: Record<string, unknown>
): boolean | null {
  const pred = post.prediction as
    | { winner?: string; score?: { home?: unknown; away?: unknown } }
    | undefined;
  const predHome = safeInt(pred?.score?.home);
  const predAway = safeInt(pred?.score?.away);
  if (predHome == null || predAway == null) return null;

  const settlementGame = settlementGameFromDoc(game);
  if (!settlementGame) return null;

  const winner =
    pred?.winner === "home" || pred?.winner === "away" || pred?.winner === "draw"
      ? pred.winner
      : "home";

  const scored = calcPointsFootball(
    { winner, score: { home: predHome, away: predAway } },
    settlementGame
  );
  return scored.exactMatch === true;
}

function hasExactMatchField(post: Record<string, unknown>): boolean {
  const stats = post.stats as Record<string, unknown> | undefined;
  return typeof stats?.exactMatch === "boolean";
}

(async () => {
  console.log("=== backfill WC posts: stats.exactMatch ===");
  if (DRY_RUN) console.log(">>> DRY RUN\n");
  if (FORCE) console.log(">>> FORCE: 既存 exactMatch も再計算\n");

  const postsSnap = await db
    .collection("posts")
    .where("schemaVersion", "==", 2)
    .where("status", "==", "final")
    .get();

  const gameIds = new Set<string>();
  for (const doc of postsSnap.docs) {
    const p = doc.data();
    if (normalizeLeague(p.league) !== "wc") continue;
    const uid = String(p.authorUid ?? "").trim();
    if (targetUid && uid !== targetUid) continue;
    const gameId = String(p.gameId ?? "").trim();
    if (gameId) gameIds.add(gameId);
  }

  const gameById = new Map<string, Record<string, unknown>>();
  const gameIdList = [...gameIds];
  for (let i = 0; i < gameIdList.length; i += 300) {
    const chunk = gameIdList.slice(i, i + 300);
    const refs = chunk.map((id) => db.doc(`games/${id}`));
    const snaps = await db.getAll(...refs);
    for (const snap of snaps) {
      if (snap.exists) gameById.set(snap.id, snap.data() as Record<string, unknown>);
    }
  }

  let scanned = 0;
  let skippedHas = 0;
  let skippedNoGame = 0;
  let skippedNoPred = 0;
  let updated = 0;
  let exactTrue = 0;

  let batch = db.batch();
  let batchOps = 0;

  const flush = async () => {
    if (batchOps === 0) return;
    if (!DRY_RUN) await batch.commit();
    batch = db.batch();
    batchOps = 0;
  };

  for (const doc of postsSnap.docs) {
    const p = doc.data() as Record<string, unknown>;
    if (normalizeLeague(p.league) !== "wc") continue;
    scanned++;

    const uid = String(p.authorUid ?? "").trim();
    if (targetUid && uid !== targetUid) continue;

    if (!FORCE && hasExactMatchField(p)) {
      skippedHas++;
      continue;
    }

    const gameId = String(p.gameId ?? "").trim();
    const game = gameId ? gameById.get(gameId) : undefined;
    if (!game) {
      skippedNoGame++;
      console.warn(`[skip] ${doc.id}: game missing (${gameId || "no gameId"})`);
      continue;
    }

    const exactMatch = exactMatchFromPost(p, game);
    if (exactMatch == null) {
      skippedNoPred++;
      console.warn(`[skip] ${doc.id}: prediction score or game line score missing`);
      continue;
    }

    if (exactMatch) exactTrue++;

    const prev =
      (p.stats as { exactMatch?: boolean } | undefined)?.exactMatch ?? null;
    if (!FORCE && prev === exactMatch) {
      skippedHas++;
      continue;
    }

    console.log(
      `${doc.id} uid=${uid} game=${gameId} exactMatch=${exactMatch}${prev != null ? ` (was ${prev})` : ""}`
    );

    if (!DRY_RUN) {
      batch.update(doc.ref, {
        "stats.exactMatch": exactMatch,
        "stats.pointsV3Detail.exactMatch": exactMatch,
      });
      batchOps++;
      if (batchOps >= 400) await flush();
    }
    updated++;
  }

  await flush();

  console.log(`
Done.
  scanned WC final posts: ${scanned}
  updated: ${updated}${DRY_RUN ? " (dry-run)" : ""}
  exactMatch=true among updated: ${exactTrue}
  skipped (already set): ${skippedHas}
  skipped (no game): ${skippedNoGame}
  skipped (no prediction score): ${skippedNoPred}
`);

  if (!DRY_RUN && updated > 0) {
    console.log(
      "次の順で実行してください:\n" +
        "  1. npx tsx scripts/backfill-wc-exact-hit-counts.ts\n" +
        "  2. npx tsx scripts/backfill-wc-cumulative-from-daily.ts\n" +
        "  3. npx tsx scripts/run-cumulative-ranking-snapshot.ts"
    );
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
