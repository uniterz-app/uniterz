/**
 * シーズン予想マーケット（みんなの予想）を作り直す。締切前の途中集計も force で上書き。
 *
 *   npx tsx --tsconfig tsconfig.json scripts/rebuild-season-predict-market.ts [season]
 */
import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";
import { ingestSeasonPredictMarket } from "../lib/predict/seasonPredictMarketServer";
import { CURRENT_NBA_SEASON_KEY } from "../lib/rankings/nbaSeason";

(async () => {
  const season = process.argv[2]?.trim() || CURRENT_NBA_SEASON_KEY;
  const res = await ingestSeasonPredictMarket(getAdminDb(), { season, force: true });
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
