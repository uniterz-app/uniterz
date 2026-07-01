/**
 * World Cup ランキングだけ buildCumulativeRankingSnapshot を手動実行。
 * NBA の snapshotRanks / 一覧 doc は触らない。
 *
 * 使い方（プロジェクトルート、service-account.json 必須）:
 *   npx tsx scripts/run-cumulative-ranking-snapshot-wc.ts
 */

import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const admin = require("../functions/node_modules/firebase-admin") as typeof import("firebase-admin");

if (!fs.existsSync("service-account.json")) {
  console.error("service-account.json が見つかりません（プロジェクトルートで実行）");
  process.exit(1);
}

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const { buildCumulativeRankingSnapshot } = require(
  "../functions/lib/rankings/buildCumulativeRankingSnapshot.js"
) as {
  buildCumulativeRankingSnapshot: (opts?: {
    scope?: "all" | "wc";
  }) => Promise<{
    ok: boolean;
    scope: string;
    wcRanksWritten: number;
    historyDateKey: string;
  }>;
};

const WC_STAGES = ["overall", "qualifying", "main"] as const;
const WC_METRICS = [
  "winRate",
  "totalPoints",
  "totalExactHits",
  "totalUpset",
  "activeWinStreak",
  "totalGoalScorerHits",
] as const;

const STREAK_ALL = process.argv.includes("--streak-all");

(async () => {
  console.log("=== run buildCumulativeRankingSnapshot (WC only) ===");
  if (STREAK_ALL) {
    console.log("(streak-all: 当日確定フィルタなしで連勝 Top20 を生成)\n");
  }
  const result = await buildCumulativeRankingSnapshot({
    scope: "wc",
    streakAllEligible: STREAK_ALL,
  });
  console.log("result:", result);

  const revalidateUrl = process.env.REVALIDATE_CUMULATIVE_RANKING_URL?.trim();
  const revalidateSecret = process.env.INTERNAL_REVALIDATE_SECRET?.trim();
  if (revalidateUrl && revalidateSecret) {
    console.log("\n--- revalidate Next.js cache ---");
    try {
      const res = await fetch(revalidateUrl, {
        method: "POST",
        headers: { "x-revalidate-token": revalidateSecret },
      });
      const body = await res.text();
      console.log(res.ok ? `ok: ${body}` : `failed ${res.status}: ${body}`);
    } catch (e) {
      console.warn("revalidate error:", e);
    }
  } else {
    console.log(
      "\n(skip revalidate — set REVALIDATE_CUMULATIVE_RANKING_URL + INTERNAL_REVALIDATE_SECRET)"
    );
  }

  const db = admin.firestore();
  console.log("\n--- WC snapshots ---");
  for (const stage of WC_STAGES) {
    for (const metric of WC_METRICS) {
      const id = `wc_${stage}_${metric}`;
      const snap = await db.doc(`cumulative_ranking_snapshots/${id}`).get();
      if (!snap.exists) {
        console.log(`${id}: (missing)`);
        continue;
      }
      const d = snap.data()!;
      const rows = (d.rows ?? []) as Array<{
        rank?: number;
        uid?: string;
        displayName?: string;
        totalPoints?: number;
        winRate?: number;
        activeWinStreak?: number;
      }>;
      console.log(
        `${id}: totalCount=${d.totalCount} rows=${rows.length}` +
          (rows[0]
            ? ` #1=${rows[0].displayName ?? rows[0].uid}` +
              (metric === "activeWinStreak"
                ? ` streak=${rows[0].activeWinStreak ?? "?"}`
                : "")
            : "")
      );
    }
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
