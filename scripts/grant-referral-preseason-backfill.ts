/**
 * 開幕前の紹介特典（紹介者 +20 / 招待された人 +20）を、特典の導入前にシーズン予想を提出済みの招待関係へ後追い付与する（冪等）。
 * 導入後の提出は /api/me/season-standings・season-awards の保存時に自動付与される。
 *
 *   DRY_RUN=1 npx tsx --tsconfig tsconfig.json scripts/grant-referral-preseason-backfill.ts
 *   npx tsx --tsconfig tsconfig.json scripts/grant-referral-preseason-backfill.ts
 */
import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";
import { CURRENT_NBA_SEASON_KEY } from "../lib/rankings/nbaSeason";
import { grantReferralPreseasonBonus } from "../lib/referral/referralPreseasonBonusServer";

const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

async function main() {
  const db = getAdminDb();
  const season = CURRENT_NBA_SEASON_KEY;
  const relations = await db.collection("referralRelations").get();
  let eligible = 0;
  let invitee = 0;
  let referrer = 0;
  for (const rel of relations.docs) {
    const uid = rel.id;
    const [standings, awards] = await Promise.all([
      db.collection("seasonStandingsPredictions").doc(`${season}_${uid}`).get(),
      db.collection("seasonAwardsPredictions").doc(`${season}_${uid}`).get(),
    ]);
    const submitted =
      standings.get("isSubmitted") === true || awards.get("isSubmitted") === true;
    if (!submitted) continue;
    eligible++;
    if (DRY_RUN) continue;
    const result = await grantReferralPreseasonBonus(db, uid);
    if (result.invitee) invitee++;
    if (result.referrer) referrer++;
  }
  console.log({ dryRun: DRY_RUN, relations: relations.size, eligible, invitee, referrer });
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
