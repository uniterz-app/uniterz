/**
 * `nbaTeamCleanRatings/{season}` をリーグ表の bundle に重ねる（公開 API の読み時・レギュラーのみ）。
 *
 * 表示値 = 公式（BDL）のレーティング + play-by-play で測ったガベージ抜きとの差。
 * play-by-play のポゼッション推定は公式より 2〜3% 多く、ORTG / DRTG の絶対値が公式より約 3 低く出る。
 * 差だけ足すことで BASIC の公式 NET / ORTG / DRTG と並べたときの違いがガベージタイムの影響だけになる。
 */
import type { Firestore } from "firebase-admin/firestore";
import {
  NBA_TEAM_CLEAN_RATINGS_COLLECTION,
  type NbaTeamCleanRatingsDoc,
} from "@/lib/nba/cleanRatings/nbaCleanRatingsTypes";
import type {
  NbaLeagueTeamStatRow,
  NbaLeagueTeamStatsBundle,
} from "@/lib/predict/nbaLeagueTeamStatsMocks";

export async function loadNbaTeamCleanRatings(
  db: Firestore,
  seasonKey: string
): Promise<NbaTeamCleanRatingsDoc | null> {
  const snap = await db.collection(NBA_TEAM_CLEAN_RATINGS_COLLECTION).doc(seasonKey).get();
  if (!snap.exists) return null;
  const doc = snap.data() as NbaTeamCleanRatingsDoc;
  return doc?.teams ? doc : null;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function applyRow(row: NbaLeagueTeamStatRow, doc: NbaTeamCleanRatingsDoc): NbaLeagueTeamStatRow {
  const t = doc.teams[row.teamId];
  if (!t || t.games <= 0 || !(row.ortg > 0) || !(row.drtg > 0)) return row;
  const cleanOrtg = round1(row.ortg + (t.clean.ortg - t.all.ortg));
  const cleanDrtg = round1(row.drtg + (t.clean.drtg - t.all.drtg));
  const cleanNet = round1(cleanOrtg - cleanDrtg);
  return {
    ...row,
    cleanOrtg,
    cleanDrtg,
    cleanNet,
    ...(typeof t.sosAdj === "number" ? { cleanAdjNet: round1(cleanNet + t.sosAdj) } : {}),
    ...(typeof t.sosOffAdj === "number" && typeof t.sosDefAdj === "number"
      ? {
          cleanAdjOrtg: round1(cleanOrtg + t.sosOffAdj),
          cleanAdjDrtg: round1(cleanDrtg + t.sosDefAdj),
        }
      : {}),
    ...(t.last10 ? { cleanNetL10: t.last10.net } : {}),
  };
}

export function applyCleanRatingsToLeagueTeamBundle(
  bundle: NbaLeagueTeamStatsBundle,
  doc: NbaTeamCleanRatingsDoc | null
): NbaLeagueTeamStatsBundle {
  if (!doc) return bundle;
  return { ...bundle, season: bundle.season.map((row) => applyRow(row, doc)) };
}