/**
 * 既存 WC 確定投稿から daily の exactHitCount を再集計し、
 * scorePrecisionSum を 0 に揃える（完全的中メトリクス移行用）。
 *
 * 前提: scripts/backfill-wc-post-exact-match.ts で stats.exactMatch を付与済み
 *
 * 使い方:
 *   npx tsx scripts/backfill-wc-exact-hit-counts.ts --dry-run
 *   npx tsx scripts/backfill-wc-exact-hit-counts.ts --uid=<UID>
 */

import adminPkg from "firebase-admin";
import fs from "fs";
import { Timestamp } from "firebase-admin/firestore";
import {
  WC_RANKING_STAGES,
  type WcRankingStageBucket,
} from "../lib/rankings/dailyWcStageBuckets";
import { resolveWcStageFromGame } from "../lib/wc/resolveWcStage";

const admin = adminPkg as typeof import("firebase-admin");

const DRY_RUN = process.argv.includes("--dry-run");
const uidArg = process.argv.find((a) => a.startsWith("--uid="));
const targetUid = uidArg ? uidArg.slice("--uid=".length).trim() : "";

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

type StageBucket = {
  posts: number;
  exactHitCount: number;
  scorePrecisionSum: number;
};

function emptyStage(): StageBucket {
  return { posts: 0, exactHitCount: 0, scorePrecisionSum: 0 };
}

function emptyStages(): Record<WcRankingStageBucket, StageBucket> {
  return {
    overall: emptyStage(),
    qualifying: emptyStage(),
    main: emptyStage(),
  };
}

function toDateKeyJST(ts: Timestamp): string {
  const d = ts.toDate();
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = j.getUTCFullYear();
  const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(j.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toTimestamp(v: unknown): Timestamp | null {
  if (v instanceof Timestamp) return v;
  if (v && typeof (v as { toDate?: unknown }).toDate === "function") {
    return v as Timestamp;
  }
  return null;
}

function resolveStatsStartAt(
  post: Record<string, unknown>,
  game?: Record<string, unknown>
): Timestamp | null {
  return (
    toTimestamp(game?.startAtJst) ??
    toTimestamp(game?.startAt) ??
    toTimestamp(post.startAtJst) ??
    toTimestamp(post.startAt) ??
    toTimestamp(post.createdAt)
  );
}

function normalizeLeague(raw: unknown): string | null {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "wc" || v === "fifa") return "wc";
  return null;
}

function applyToStages(
  buckets: Record<WcRankingStageBucket, StageBucket>,
  exactHit: boolean,
  stage: ReturnType<typeof resolveWcStageFromGame>
) {
  buckets.overall.posts += 1;
  buckets.overall.exactHitCount += exactHit ? 1 : 0;
  if (stage === "qualifying") {
    buckets.qualifying.posts += 1;
    buckets.qualifying.exactHitCount += exactHit ? 1 : 0;
  } else if (stage === "main") {
    buckets.main.posts += 1;
    buckets.main.exactHitCount += exactHit ? 1 : 0;
  }
}

function stagePatch(
  bucket: StageBucket
): Record<string, number> {
  return {
    exactHitCount: bucket.exactHitCount,
    scorePrecisionSum: 0,
  };
}

(async () => {
  console.log("=== backfill WC exactHitCount on user_stats_v2_daily ===");
  if (DRY_RUN) console.log(">>> DRY RUN\n");

  const postsSnap = await db
    .collection("posts")
    .where("schemaVersion", "==", 2)
    .where("status", "==", "final")
    .get();

  const gameIds = new Set<string>();
  for (const doc of postsSnap.docs) {
    const p = doc.data();
    if (normalizeLeague(p.league) !== "wc") continue;
    const stats = p.stats as Record<string, unknown> | undefined;
    if (!stats || stats.countedForRanking === false) continue;
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

  const dailyByKey = new Map<string, Record<WcRankingStageBucket, StageBucket>>();

  for (const doc of postsSnap.docs) {
    const p = doc.data();
    if (normalizeLeague(p.league) !== "wc") continue;
    const stats = p.stats as Record<string, unknown> | undefined;
    if (!stats || stats.countedForRanking === false) continue;

    const uid = String(p.authorUid ?? "").trim();
    if (!uid || (targetUid && uid !== targetUid)) continue;

    const gameId = String(p.gameId ?? "").trim();
    const game = gameId ? gameById.get(gameId) : undefined;
    const startAt = resolveStatsStartAt(p, game);
    if (!startAt) continue;

    const stage = resolveWcStageFromGame({
      knockout: game?.knockout === true,
      roundLabel:
        typeof game?.roundLabel === "string" ? game.roundLabel : null,
      wcStage: typeof game?.wcStage === "string" ? game.wcStage : null,
    });

    const exactHit =
      stats.exactMatch === true ||
      (p.pointsV3Detail as { exactMatch?: boolean } | undefined)?.exactMatch ===
        true;

    const dailyKey = `${uid}_${toDateKeyJST(startAt)}`;
    if (!dailyByKey.has(dailyKey)) {
      dailyByKey.set(dailyKey, emptyStages());
    }
    applyToStages(dailyByKey.get(dailyKey)!, exactHit, stage);
  }

  console.log(`daily docs to patch: ${dailyByKey.size}`);

  let patched = 0;
  for (const [dailyKey, buckets] of dailyByKey) {
    const hasAny = WC_RANKING_STAGES.some((s) => buckets[s].posts > 0);
    if (!hasAny) continue;

    const patch: Record<string, unknown> = {
      rankingByWcStage: {
        overall: stagePatch(buckets.overall),
        ...(buckets.qualifying.posts > 0
          ? { qualifying: stagePatch(buckets.qualifying) }
          : {}),
        ...(buckets.main.posts > 0 ? { main: stagePatch(buckets.main) } : {}),
      },
    };

    console.log(
      `${dailyKey}: overall exact=${buckets.overall.exactHitCount}/${buckets.overall.posts}`
    );

    if (!DRY_RUN) {
      await db.doc(`user_stats_v2_daily/${dailyKey}`).set(patch, { merge: true });
    }
    patched += 1;
  }

  console.log(
    `\nDone. ${patched} daily doc(s) ${DRY_RUN ? "would be " : ""}patched.`
  );
  if (!DRY_RUN && patched > 0) {
    console.log(
      "次: scripts/backfill-wc-cumulative-from-daily.ts を実行して cumulative を再構築してください。"
    );
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
