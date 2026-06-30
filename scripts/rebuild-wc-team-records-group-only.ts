/**
 * WC チームの wins / losses / draws をグループリーグ確定試合のみから再計算する。
 * ノックアウトの勝敗はチーム成績に含めない。
 *
 * 使い方（service-account.json 必須）:
 *   npx tsx scripts/rebuild-wc-team-records-group-only.ts --dry-run
 *   npx tsx scripts/rebuild-wc-team-records-group-only.ts
 */

import adminPkg from "firebase-admin";
import fs from "fs";
import { resolveWcStageFromGame } from "../lib/wc/resolveWcStage";

const admin = adminPkg as typeof import("firebase-admin");

const DRY_RUN = process.argv.includes("--dry-run");

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

type Tallies = { wins: number; draws: number; losses: number };

function isGroupLeagueGame(data: Record<string, unknown>): boolean {
  return resolveWcStageFromGame({
    knockout: data.knockout === true,
    roundLabel:
      typeof data.roundLabel === "string" ? data.roundLabel : null,
    wcStage: typeof data.wcStage === "string" ? data.wcStage : null,
  }) === "qualifying";
}

function applyResult(
  tallies: Map<string, Tallies>,
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number,
  awayScore: number
) {
  const home = tallies.get(homeTeamId) ?? { wins: 0, draws: 0, losses: 0 };
  const away = tallies.get(awayTeamId) ?? { wins: 0, draws: 0, losses: 0 };

  if (homeScore === awayScore) {
    home.draws += 1;
    away.draws += 1;
  } else if (homeScore > awayScore) {
    home.wins += 1;
    away.losses += 1;
  } else {
    away.wins += 1;
    home.losses += 1;
  }

  tallies.set(homeTeamId, home);
  tallies.set(awayTeamId, away);
}

(async () => {
  console.log("=== rebuild WC team records (group stage only) ===");
  if (DRY_RUN) console.log(">>> DRY RUN（Firestore は更新しません）\n");

  const gamesSnap = await db.collection("games").where("league", "==", "wc").get();
  const tallies = new Map<string, Tallies>();
  let gamesUsed = 0;

  for (const doc of gamesSnap.docs) {
    const data = doc.data() as Record<string, unknown>;
    if (!data.final) continue;
    if (!isGroupLeagueGame(data)) continue;

    const homeTeamId = String(
      (data.home as { teamId?: string } | undefined)?.teamId ?? ""
    ).trim();
    const awayTeamId = String(
      (data.away as { teamId?: string } | undefined)?.teamId ?? ""
    ).trim();
    const homeScore = Number(data.homeScore);
    const awayScore = Number(data.awayScore);

    if (!homeTeamId || !awayTeamId) continue;
    if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) continue;

    applyResult(tallies, homeTeamId, awayTeamId, homeScore, awayScore);
    gamesUsed += 1;
  }

  const teamsSnap = await db.collection("teams").where("league", "==", "wc").get();
  let teamsUpdated = 0;
  let teamsUnchanged = 0;

  for (const doc of teamsSnap.docs) {
    const next = tallies.get(doc.id) ?? { wins: 0, draws: 0, losses: 0 };
    const cur = doc.data();
    const curWins = Number(cur.wins ?? 0);
    const curDraws = Number(cur.draws ?? cur.d ?? 0);
    const curLosses = Number(cur.losses ?? 0);

    if (
      curWins === next.wins &&
      curDraws === next.draws &&
      curLosses === next.losses
    ) {
      teamsUnchanged += 1;
      continue;
    }

    teamsUpdated += 1;
    console.log(
      `[team] ${doc.id}  ${curWins}-${curDraws}-${curLosses} → ${next.wins}-${next.draws}-${next.losses}`
    );

    if (!DRY_RUN) {
      await doc.ref.set(
        {
          wins: next.wins,
          draws: next.draws,
          d: next.draws,
          losses: next.losses,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  }

  console.log("\n--- サマリー ---");
  console.log(`確定グループ試合: ${gamesUsed}`);
  console.log(`WC チーム走査: ${teamsSnap.size}`);
  console.log(`更新対象: ${teamsUpdated}`);
  console.log(`変更なし: ${teamsUnchanged}`);

  if (DRY_RUN) {
    console.log("\nDRY RUN のため未更新。本番は --dry-run を外して再実行。");
  } else {
    console.log("\n更新完了。");
  }

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
