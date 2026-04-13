/**
 * NBA 30チームの得点・失点・勝敗（wins/losses）を一括で上書きする。
 *
 * 使い方（リポジトリルートで、service-account.json があること）:
 *   npx tsx scripts/sync-nba-team-point-totals.ts
 * ドライラン:
 *   npx tsx scripts/sync-nba-team-point-totals.ts --dry-run
 */

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { join } from "path";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { TEAM_IDS } from "../lib/team-ids";

type Row = {
  name: string;
  wins: number;
  losses: number;
  pointsForTotal: number;
  pointsAgainstTotal: number;
  homePointsForTotal: number;
  homePointsAgainstTotal: number;
  awayPointsForTotal: number;
  awayPointsAgainstTotal: number;
};

/** 正しい集計値（勝敗 + 得点系） */
const ROWS: Row[] = [
  {
    name: "Atlanta Hawks",
    wins: 46,
    losses: 36,
    pointsForTotal: 9713,
    pointsAgainstTotal: 9516,
    homePointsForTotal: 4830,
    homePointsAgainstTotal: 4674,
    awayPointsForTotal: 4883,
    awayPointsAgainstTotal: 4842,
  },
  {
    name: "Boston Celtics",
    wins: 56,
    losses: 26,
    pointsForTotal: 9418,
    pointsAgainstTotal: 8786,
    homePointsForTotal: 4707,
    homePointsAgainstTotal: 4387,
    awayPointsForTotal: 4711,
    awayPointsAgainstTotal: 4399,
  },
  {
    name: "Brooklyn Nets",
    wins: 20,
    losses: 62,
    pointsForTotal: 8688,
    pointsAgainstTotal: 9504,
    homePointsForTotal: 4444,
    homePointsAgainstTotal: 4715,
    awayPointsForTotal: 4244,
    awayPointsAgainstTotal: 4789,
  },
  {
    name: "Charlotte Hornets",
    wins: 44,
    losses: 38,
    pointsForTotal: 9512,
    pointsAgainstTotal: 9114,
    homePointsForTotal: 4715,
    homePointsAgainstTotal: 4555,
    awayPointsForTotal: 4797,
    awayPointsAgainstTotal: 4559,
  },
  {
    name: "Chicago Bulls",
    wins: 31,
    losses: 51,
    pointsForTotal: 9537,
    pointsAgainstTotal: 9963,
    homePointsForTotal: 4711,
    homePointsAgainstTotal: 4863,
    awayPointsForTotal: 4826,
    awayPointsAgainstTotal: 5100,
  },
  {
    name: "Cleveland Cavaliers",
    wins: 52,
    losses: 30,
    pointsForTotal: 9801,
    pointsAgainstTotal: 9463,
    homePointsForTotal: 4887,
    homePointsAgainstTotal: 4699,
    awayPointsForTotal: 4914,
    awayPointsAgainstTotal: 4764,
  },
  {
    name: "Dallas Mavericks",
    wins: 26,
    losses: 56,
    pointsForTotal: 9354,
    pointsAgainstTotal: 9799,
    homePointsForTotal: 4768,
    homePointsAgainstTotal: 4916,
    awayPointsForTotal: 4586,
    awayPointsAgainstTotal: 4883,
  },
  {
    name: "Denver Nuggets",
    wins: 54,
    losses: 28,
    pointsForTotal: 10011,
    pointsAgainstTotal: 9586,
    homePointsForTotal: 4953,
    homePointsAgainstTotal: 4723,
    awayPointsForTotal: 5058,
    awayPointsAgainstTotal: 4863,
  },
  {
    name: "Detroit Pistons",
    wins: 60,
    losses: 22,
    pointsForTotal: 9658,
    pointsAgainstTotal: 8987,
    homePointsForTotal: 4863,
    homePointsAgainstTotal: 4436,
    awayPointsForTotal: 4795,
    awayPointsAgainstTotal: 4551,
  },
  {
    name: "Golden State Warriors",
    wins: 37,
    losses: 45,
    pointsForTotal: 9397,
    pointsAgainstTotal: 9475,
    homePointsForTotal: 4801,
    homePointsAgainstTotal: 4748,
    awayPointsForTotal: 4596,
    awayPointsAgainstTotal: 4727,
  },
  {
    name: "Houston Rockets",
    wins: 52,
    losses: 30,
    pointsForTotal: 9449,
    pointsAgainstTotal: 9020,
    homePointsForTotal: 4707,
    homePointsAgainstTotal: 4399,
    awayPointsForTotal: 4742,
    awayPointsAgainstTotal: 4621,
  },
  {
    name: "Indiana Pacers",
    wins: 19,
    losses: 63,
    pointsForTotal: 9216,
    pointsAgainstTotal: 9873,
    homePointsForTotal: 4666,
    homePointsAgainstTotal: 4887,
    awayPointsForTotal: 4550,
    awayPointsAgainstTotal: 4986,
  },
  {
    name: "LA Clippers",
    wins: 42,
    losses: 40,
    pointsForTotal: 9329,
    pointsAgainstTotal: 9239,
    homePointsForTotal: 4715,
    homePointsAgainstTotal: 4563,
    awayPointsForTotal: 4614,
    awayPointsAgainstTotal: 4676,
  },
  {
    name: "Los Angeles Lakers",
    wins: 53,
    losses: 29,
    pointsForTotal: 9538,
    pointsAgainstTotal: 9401,
    homePointsForTotal: 4838,
    homePointsAgainstTotal: 4674,
    awayPointsForTotal: 4700,
    awayPointsAgainstTotal: 4727,
  },
  {
    name: "Memphis Grizzlies",
    wins: 25,
    losses: 57,
    pointsForTotal: 9407,
    pointsAgainstTotal: 9881,
    homePointsForTotal: 4748,
    homePointsAgainstTotal: 4916,
    awayPointsForTotal: 4659,
    awayPointsAgainstTotal: 4965,
  },
  {
    name: "Miami Heat",
    wins: 43,
    losses: 39,
    pointsForTotal: 9914,
    pointsAgainstTotal: 9717,
    homePointsForTotal: 5064,
    homePointsAgainstTotal: 4850,
    awayPointsForTotal: 4850,
    awayPointsAgainstTotal: 4867,
  },
  {
    name: "Milwaukee Bucks",
    wins: 32,
    losses: 50,
    pointsForTotal: 9072,
    pointsAgainstTotal: 9582,
    homePointsForTotal: 4682,
    homePointsAgainstTotal: 4846,
    awayPointsForTotal: 4390,
    awayPointsAgainstTotal: 4736,
  },
  {
    name: "Minnesota Timberwolves",
    wins: 49,
    losses: 33,
    pointsForTotal: 9675,
    pointsAgainstTotal: 9405,
    homePointsForTotal: 4707,
    homePointsAgainstTotal: 4555,
    awayPointsForTotal: 4968,
    awayPointsAgainstTotal: 4850,
  },
  {
    name: "New Orleans Pelicans",
    wins: 26,
    losses: 56,
    pointsForTotal: 9475,
    pointsAgainstTotal: 9840,
    homePointsForTotal: 4846,
    homePointsAgainstTotal: 4900,
    awayPointsForTotal: 4629,
    awayPointsAgainstTotal: 4940,
  },
  {
    name: "New York Knicks",
    wins: 53,
    losses: 29,
    pointsForTotal: 9575,
    pointsAgainstTotal: 9024,
    homePointsForTotal: 4879,
    homePointsAgainstTotal: 4469,
    awayPointsForTotal: 4696,
    awayPointsAgainstTotal: 4555,
  },
  {
    name: "Oklahoma City Thunder",
    wins: 64,
    losses: 18,
    pointsForTotal: 9760,
    pointsAgainstTotal: 8840,
    homePointsForTotal: 4883,
    homePointsAgainstTotal: 4399,
    awayPointsForTotal: 4877,
    awayPointsAgainstTotal: 4441,
  },
  {
    name: "Orlando Magic",
    wins: 45,
    losses: 37,
    pointsForTotal: 9490,
    pointsAgainstTotal: 9438,
    homePointsForTotal: 4756,
    homePointsAgainstTotal: 4682,
    awayPointsForTotal: 4734,
    awayPointsAgainstTotal: 4756,
  },
  {
    name: "Philadelphia 76ers",
    wins: 45,
    losses: 37,
    pointsForTotal: 9504,
    pointsAgainstTotal: 9557,
    homePointsForTotal: 4731,
    homePointsAgainstTotal: 4777,
    awayPointsForTotal: 4773,
    awayPointsAgainstTotal: 4780,
  },
  {
    name: "Phoenix Suns",
    wins: 45,
    losses: 37,
    pointsForTotal: 9231,
    pointsAgainstTotal: 9110,
    homePointsForTotal: 4592,
    homePointsAgainstTotal: 4444,
    awayPointsForTotal: 4639,
    awayPointsAgainstTotal: 4666,
  },
  {
    name: "Portland Trail Blazers",
    wins: 42,
    losses: 40,
    pointsForTotal: 9473,
    pointsAgainstTotal: 9483,
    homePointsForTotal: 4850,
    homePointsAgainstTotal: 4707,
    awayPointsForTotal: 4623,
    awayPointsAgainstTotal: 4776,
  },
  {
    name: "Sacramento Kings",
    wins: 22,
    losses: 60,
    pointsForTotal: 9099,
    pointsAgainstTotal: 9922,
    homePointsForTotal: 4617,
    homePointsAgainstTotal: 4912,
    awayPointsForTotal: 4482,
    awayPointsAgainstTotal: 5010,
  },
  {
    name: "San Antonio Spurs",
    wins: 62,
    losses: 20,
    pointsForTotal: 9821,
    pointsAgainstTotal: 9145,
    homePointsForTotal: 4941,
    homePointsAgainstTotal: 4588,
    awayPointsForTotal: 4880,
    awayPointsAgainstTotal: 4557,
  },
  {
    name: "Toronto Raptors",
    wins: 46,
    losses: 36,
    pointsForTotal: 9401,
    pointsAgainstTotal: 9178,
    homePointsForTotal: 4727,
    homePointsAgainstTotal: 4543,
    awayPointsForTotal: 4674,
    awayPointsAgainstTotal: 4635,
  },
  {
    name: "Utah Jazz",
    wins: 22,
    losses: 60,
    pointsForTotal: 9641,
    pointsAgainstTotal: 10332,
    homePointsForTotal: 4969,
    homePointsAgainstTotal: 5182,
    awayPointsForTotal: 4672,
    awayPointsAgainstTotal: 5150,
  },
  {
    name: "Washington Wizards",
    wins: 17,
    losses: 65,
    pointsForTotal: 9255,
    pointsAgainstTotal: 10238,
    homePointsForTotal: 4662,
    homePointsAgainstTotal: 5104,
    awayPointsForTotal: 4593,
    awayPointsAgainstTotal: 5134,
  },
];

function assertConsistent(r: Row) {
  const pf = r.homePointsForTotal + r.awayPointsForTotal;
  const pa = r.homePointsAgainstTotal + r.awayPointsAgainstTotal;
  if (pf !== r.pointsForTotal || pa !== r.pointsAgainstTotal) {
    throw new Error(
      `[${r.name}] 合計と H/A の和が一致しません: PF ${r.pointsForTotal} vs ${pf}, PA ${r.pointsAgainstTotal} vs ${pa}`
    );
  }
  if (r.wins + r.losses !== 82) {
    throw new Error(
      `[${r.name}] wins+losses が82 ではありません: ${r.wins}+${r.losses}`
    );
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  for (const r of ROWS) {
    assertConsistent(r);
  }

  if (ROWS.length !== 30) {
    throw new Error(`期待するチーム数は 30 ですが ${ROWS.length} 件です`);
  }

  let db: Firestore | null = null;
  if (!dryRun) {
    const saPath = join(process.cwd(), "service-account.json");
    const serviceAccount = JSON.parse(readFileSync(saPath, "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    db = admin.firestore();
  }

  const batch = db ? db.batch() : null;
  for (const r of ROWS) {
    const teamId = TEAM_IDS[r.name as keyof typeof TEAM_IDS];
    if (!teamId || !teamId.startsWith("nba-")) {
      throw new Error(`TEAM_IDS にないか NBA ではありません: ${r.name}`);
    }
    const patch = {
      wins: r.wins,
      losses: r.losses,
      pointsForTotal: r.pointsForTotal,
      pointsAgainstTotal: r.pointsAgainstTotal,
      homePointsForTotal: r.homePointsForTotal,
      homePointsAgainstTotal: r.homePointsAgainstTotal,
      awayPointsForTotal: r.awayPointsForTotal,
      awayPointsAgainstTotal: r.awayPointsAgainstTotal,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (dryRun) {
      console.log("[dry-run]", teamId, r.name, patch);
    } else {
      const ref = db!.doc(`teams/${teamId}`);
      batch!.set(ref, patch, { merge: true });
    }
  }

  if (!dryRun && batch) {
    await batch.commit();
  }

  console.log(
    dryRun
      ? `OK dry-run: ${ROWS.length} teams (no writes)`
      : `OK updated ${ROWS.length} NBA teams (wins/losses + point totals)`
  );
  process.exit(0);
}

main().catch((e) => {
  console.error("sync-nba-team-point-totals failed:", e);
  process.exit(1);
});
