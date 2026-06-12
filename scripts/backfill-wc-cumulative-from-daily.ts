/**
 * user_stats_v2_daily の WC ステージ別集計を cumulative_stats.rankingByWcStage に再構築する。
 * legacy dot-path 形式の daily も readDailyWcStageBuckets で読み取る。
 *
 * 使い方（service-account.json 必須）:
 *   npx tsx scripts/backfill-wc-cumulative-from-daily.ts --dry-run
 *   npx tsx scripts/backfill-wc-cumulative-from-daily.ts --uid=<UID>
 *   npx tsx scripts/backfill-wc-cumulative-from-daily.ts
 */

import adminPkg from "firebase-admin";
import fs from "fs";
import {
  readDailyWcStageBuckets,
  WC_RANKING_STAGES,
  type WcRankingStageBucket,
} from "../lib/rankings/dailyWcStageBuckets";

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

type RankingTotals = {
  totalPosts: number;
  totalWins: number;
  totalPoints: number;
  totalUpset: number;
  totalPrecision: number;
  totalGoalScorerHits: number;
  winRate: number;
};

function safeNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function addRankingTotals(
  base: Omit<RankingTotals, "winRate">,
  inc: Record<string, unknown>
): Omit<RankingTotals, "winRate"> {
  return {
    totalPosts: base.totalPosts + safeNum(inc.posts),
    totalWins: base.totalWins + safeNum(inc.wins),
    totalPoints: base.totalPoints + safeNum(inc.pointsSumV3),
    totalUpset: base.totalUpset + safeNum(inc.upsetPointsSum),
    totalPrecision: base.totalPrecision + safeNum(inc.scorePrecisionSum),
    totalGoalScorerHits:
      base.totalGoalScorerHits + safeNum(inc.goalScorerHitCount),
  };
}

function emptyTotals(): Omit<RankingTotals, "winRate"> {
  return {
    totalPosts: 0,
    totalWins: 0,
    totalPoints: 0,
    totalUpset: 0,
    totalPrecision: 0,
    totalGoalScorerHits: 0,
  };
}

function finalizeTotals(
  raw: Omit<RankingTotals, "winRate">
): RankingTotals {
  return {
    ...raw,
    winRate: raw.totalPosts > 0 ? raw.totalWins / raw.totalPosts : 0,
  };
}

async function recomputeWcStagesForUid(
  uid: string
): Promise<Record<WcRankingStageBucket, RankingTotals>> {
  const snap = await db
    .collection("user_stats_v2_daily")
    .where(admin.firestore.FieldPath.documentId(), ">=", `${uid}_`)
    .where(admin.firestore.FieldPath.documentId(), "<", `${uid}_\uf8ff`)
    .get();

  const acc: Record<WcRankingStageBucket, Omit<RankingTotals, "winRate">> = {
    overall: emptyTotals(),
    qualifying: emptyTotals(),
    main: emptyTotals(),
  };

  for (const doc of snap.docs) {
    const buckets = readDailyWcStageBuckets(doc.data() as Record<string, unknown>);
    for (const stage of WC_RANKING_STAGES) {
      acc[stage] = addRankingTotals(acc[stage], buckets[stage]);
    }
  }

  return {
    overall: finalizeTotals(acc.overall),
    qualifying: finalizeTotals(acc.qualifying),
    main: finalizeTotals(acc.main),
  };
}

(async () => {
  console.log("=== backfill cumulative_stats.rankingByWcStage from daily ===");
  if (DRY_RUN) console.log(">>> DRY RUN\n");

  const uids: string[] = [];
  if (targetUid) {
    uids.push(targetUid);
  } else {
    const userSnap = await db.collection("user_stats_v2").select().get();
    userSnap.docs.forEach((d) => uids.push(d.id));
  }

  let updated = 0;
  for (const uid of uids) {
    const rankingByWcStage = await recomputeWcStagesForUid(uid);
    const hasAny = WC_RANKING_STAGES.some(
      (s) => rankingByWcStage[s].totalPosts > 0
    );
    if (!hasAny) continue;

    console.log(
      `${uid}: overall=${rankingByWcStage.overall.totalPosts} qualifying=${rankingByWcStage.qualifying.totalPosts} main=${rankingByWcStage.main.totalPosts}`
    );

    if (!DRY_RUN) {
      await db.doc(`cumulative_stats/${uid}`).set(
        {
          rankingByWcStage,
          wcRankingBackfilledAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
    updated += 1;
  }

  console.log(`\nDone. ${updated} user(s) ${DRY_RUN ? "would be " : ""}updated.`);
  if (!DRY_RUN && updated > 0) {
    console.log(
      "次: Cloud Functions の buildCumulativeRankingSnapshot を手動実行するか、翌日 15:55 の cron を待ってください。"
    );
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
