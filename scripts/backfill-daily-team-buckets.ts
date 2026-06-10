/**
 * user_stats_v2_daily の teams.* バケットと applied_posts マーカーを既存投稿から backfill。
 *
 * 対象: status=final, schemaVersion=2, stats あり, countedForRanking !== false
 * 既に homeTeamId 付きマーカーがある投稿はスキップ。
 *
 * 使い方（プロジェクトルート、service-account.json 必須）:
 *   npx tsx scripts/backfill-daily-team-buckets.ts --dry-run
 *   npx tsx scripts/backfill-daily-team-buckets.ts
 *   npx tsx scripts/backfill-daily-team-buckets.ts --since=2026-01-01
 */

// @ts-ignore
import adminPkg from "firebase-admin";
import fs from "fs";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const admin = adminPkg as typeof import("firebase-admin");

const DRY_RUN = process.argv.includes("--dry-run");
const sinceArg = process.argv.find((a) => a.startsWith("--since="));
const sinceKey = sinceArg?.split("=")[1]?.trim() ?? null;

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function toDateKeyJST(ts: Timestamp): string {
  const d = ts.toDate();
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = j.getUTCFullYear();
  const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(j.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function teamIdFromSide(side: unknown): string | null {
  if (!side || typeof side !== "object") return null;
  const id = (side as { teamId?: unknown }).teamId;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

function uniqueGameTeamIds(home?: string | null, away?: string | null): string[] {
  return [...new Set([home, away].map((v) => v?.trim()).filter(Boolean))] as string[];
}

function normalizeLeague(raw: unknown): string | null {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "bj" || v === "b1") return "bj";
  if (v === "j1" || v === "j") return "j1";
  if (v === "nba") return "nba";
  if (v === "pl") return "pl";
  if (v === "wc" || v === "fifa") return "wc";
  return null;
}

function teamIncrementAtPath(
  teamId: string,
  o: {
    isWin: boolean;
    scoreError: number;
    scorePrecision: number;
    hadUpsetGame: boolean;
    points: number;
    upsetHit: boolean;
    upsetPoints: number;
    upsetBonus: number;
    streakBonus: number;
  }
): Record<string, unknown> {
  const prefix = `teams.${teamId}`;
  return {
    [`${prefix}.posts`]: FieldValue.increment(1),
    [`${prefix}.wins`]: FieldValue.increment(o.isWin ? 1 : 0),
    [`${prefix}.scoreErrorSum`]: FieldValue.increment(o.scoreError),
    [`${prefix}.upsetOpportunityCount`]: FieldValue.increment(
      o.hadUpsetGame ? 1 : 0
    ),
    [`${prefix}.upsetHitCount`]: FieldValue.increment(o.upsetHit ? 1 : 0),
    [`${prefix}.upsetPickCount`]: FieldValue.increment(o.hadUpsetGame ? 1 : 0),
    [`${prefix}.scorePrecisionSum`]: FieldValue.increment(o.scorePrecision),
    [`${prefix}.pointsSumV3`]: FieldValue.increment(o.points),
    [`${prefix}.upsetPointsSum`]: FieldValue.increment(o.upsetPoints),
    [`${prefix}.upsetBonusSum`]: FieldValue.increment(o.upsetBonus),
    [`${prefix}.streakBonusSum`]: FieldValue.increment(o.streakBonus),
  };
}

function toTimestamp(v: unknown): Timestamp | null {
  if (v instanceof Timestamp) return v;
  if (v && typeof (v as { toDate?: unknown }).toDate === "function") {
    return v as Timestamp;
  }
  return null;
}

(async () => {
  console.log("=== backfill daily team buckets ===");
  if (DRY_RUN) console.log(">>> DRY RUN\n");
  if (sinceKey) console.log(`since (startAt JST): ${sinceKey}\n`);

  const snap = await db
    .collection("posts")
    .where("schemaVersion", "==", 2)
    .where("status", "==", "final")
    .get();

  let scanned = 0;
  let skipped = 0;
  let updated = 0;
  let noTeams = 0;
  let noMarker = 0;

  for (const doc of snap.docs) {
    scanned++;
    const p = doc.data();
    const stats = p.stats as Record<string, unknown> | undefined;
    if (!stats || stats.countedForRanking === false) {
      skipped++;
      continue;
    }

    const uid = String(p.authorUid ?? "").trim();
    const startAt = toTimestamp(p.startAtJst ?? p.startAt);
    if (!uid || !startAt) {
      skipped++;
      continue;
    }

    const dateKey = toDateKeyJST(startAt);
    if (sinceKey && dateKey < sinceKey) {
      skipped++;
      continue;
    }

    const homeTeamId = teamIdFromSide(p.home);
    const awayTeamId = teamIdFromSide(p.away);
    const gameTeamIds = uniqueGameTeamIds(homeTeamId, awayTeamId);
    if (gameTeamIds.length === 0) {
      noTeams++;
      continue;
    }

    const dailyRef = db.doc(`user_stats_v2_daily/${uid}_${dateKey}`);
    const markerRef = dailyRef.collection("applied_posts").doc(doc.id);
    const markerSnap = await markerRef.get();

    if (!markerSnap.exists) {
      noMarker++;
      continue;
    }

    const marker = markerSnap.data() ?? {};
    if (
      typeof marker.homeTeamId === "string" ||
      typeof marker.awayTeamId === "string"
    ) {
      skipped++;
      continue;
    }

    const isWin = stats.isWin === true;
    const scoreError = Number(stats.scoreError ?? 0);
    const scorePrecision = Number(stats.scorePrecision ?? 0);
    const hadUpsetGame = stats.hadUpsetGame === true;
    const upsetHit = stats.upsetHit === true;
    const upsetPoints = Number(stats.upsetPoints ?? 0);
    const upsetBonus = Number(stats.upsetBonus ?? 0);
    const streakBonus = Number(stats.streakBonus ?? 0);
    const points = Number(stats.pointsV3 ?? 0);
    const leagueKey = normalizeLeague(p.league);

    const teamOpts = {
      isWin,
      scoreError,
      scorePrecision,
      hadUpsetGame,
      points,
      upsetHit,
      upsetPoints,
      upsetBonus,
      streakBonus,
    };

    if (DRY_RUN) {
      console.log(
        `[dry-run] ${doc.id} uid=${uid} date=${dateKey} teams=${gameTeamIds.join(",")}`
      );
      updated++;
      continue;
    }

    await db.runTransaction(async (tx) => {
      const m = await tx.get(markerRef);
      if (!m.exists) return;
      const md = m.data() ?? {};
      if (
        typeof md.homeTeamId === "string" ||
        typeof md.awayTeamId === "string"
      ) {
        return;
      }

      let patch: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp(),
      };
      for (const teamId of gameTeamIds) {
        patch = { ...patch, ...teamIncrementAtPath(teamId, teamOpts) };
      }
      tx.set(dailyRef, patch, { merge: true });
      tx.set(
        markerRef,
        {
          league: leagueKey,
          homeTeamId: homeTeamId ?? null,
          awayTeamId: awayTeamId ?? null,
          posts: 1,
          wins: isWin ? 1 : 0,
          scoreErrorSum: scoreError,
          scorePrecisionSum: scorePrecision,
          pointsSumV3: points,
          upsetPointsSum: upsetPoints,
          upsetHitCount: upsetHit ? 1 : 0,
          upsetOpportunityCount: hadUpsetGame ? 1 : 0,
          countedForRanking: true,
        },
        { merge: true }
      );
    });

    updated++;
    if (updated % 100 === 0) {
      console.log(`... ${updated} updated`);
    }
  }

  console.log("\n=== done ===");
  console.log({
    scanned,
    updated,
    skipped,
    noTeams,
    noMarker,
  });
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
