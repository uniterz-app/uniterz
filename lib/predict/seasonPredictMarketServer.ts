/**
 * シーズン予想マーケット — Firestore スナップショット读写 + 集計ジョブ。
 * コレクション: `seasonPredictMarkets/{season}`
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import {
  predictionFromSeasonAwardsDoc,
  SEASON_AWARDS_COLLECTION,
} from "@/lib/predict/seasonAwardsServer";
import {
  predictionFromSeasonStandingsDoc,
  SEASON_STANDINGS_COLLECTION,
} from "@/lib/predict/seasonStandingsServer";
import {
  isSeasonPredictSubmitOpen,
  SEASON_PREDICT_SUBMIT_DEADLINE_AT_MS,
} from "@/lib/predict/seasonPredictDeadline";
import {
  aggregateAwardsMarket,
  aggregateStandingsMarket,
  type AwardsMarketSubmission,
} from "@/lib/predict/seasonPredictMarketAggregate";
import type {
  SeasonAwardsMarketSnapshot,
  SeasonStandingsMarketSnapshot,
} from "@/lib/predict/seasonPredictMarket";

export const SEASON_PREDICT_MARKETS_COLLECTION = "seasonPredictMarkets";

export type SeasonPredictMarketDoc = {
  season: string;
  standings: SeasonStandingsMarketSnapshot;
  awards: SeasonAwardsMarketSnapshot;
  builtAtMs: number;
  updatedAt?: unknown;
};

export function seasonPredictMarketDocRef(db: Firestore, season: string) {
  return db.collection(SEASON_PREDICT_MARKETS_COLLECTION).doc(season);
}

export async function loadSeasonPredictMarketDoc(
  db: Firestore,
  season: string
): Promise<SeasonPredictMarketDoc | null> {
  const snap = await seasonPredictMarketDocRef(db, season).get();
  if (!snap.exists) return null;
  const data = snap.data() as Partial<SeasonPredictMarketDoc> | undefined;
  if (!data?.standings || !data?.awards) return null;
  if (typeof data.season !== "string") return null;
  return {
    season: data.season,
    standings: data.standings,
    awards: data.awards,
    builtAtMs:
      typeof data.builtAtMs === "number" ? data.builtAtMs : Date.now(),
    updatedAt: data.updatedAt,
  };
}

async function loadSubmittedStandings(
  db: Firestore,
  season: string
) {
  const snap = await db
    .collection(SEASON_STANDINGS_COLLECTION)
    .where("season", "==", season)
    .where("isSubmitted", "==", true)
    .get();

  const predictions = [];
  for (const doc of snap.docs) {
    const p = predictionFromSeasonStandingsDoc(
      (doc.data() ?? {}) as Record<string, unknown>
    );
    if (p) predictions.push(p);
  }
  return predictions;
}

async function loadSubmittedAwards(
  db: Firestore,
  season: string
): Promise<AwardsMarketSubmission[]> {
  const snap = await db
    .collection(SEASON_AWARDS_COLLECTION)
    .where("season", "==", season)
    .where("isSubmitted", "==", true)
    .get();

  const out: AwardsMarketSubmission[] = [];
  for (const doc of snap.docs) {
    const parsed = predictionFromSeasonAwardsDoc(
      (doc.data() ?? {}) as Record<string, unknown>
    );
    if (!parsed) continue;
    out.push({
      picks: parsed.prediction.picks,
      candidates: parsed.candidates,
    });
  }
  return out;
}

export type SeasonPredictMarketIngestResult = {
  ok: true;
  season: string;
  skipped?: "submit_still_open";
  standingsSubmissions: number;
  awardsSubmissions: number;
  builtAtMs: number;
};

/**
 * 締切後に提出を走査してマーケットスナップショットを書く。
 * `force: true` なら締切前でも実行（admin テスト用）。
 */
export async function ingestSeasonPredictMarket(
  db: Firestore,
  opts: { season: string; force?: boolean; nowMs?: number }
): Promise<SeasonPredictMarketIngestResult> {
  const season = opts.season.trim();
  const nowMs = opts.nowMs ?? Date.now();

  if (!opts.force && isSeasonPredictSubmitOpen(nowMs)) {
    return {
      ok: true,
      season,
      skipped: "submit_still_open",
      standingsSubmissions: 0,
      awardsSubmissions: 0,
      builtAtMs: nowMs,
    };
  }

  const [standingsPreds, awardsSubs] = await Promise.all([
    loadSubmittedStandings(db, season),
    loadSubmittedAwards(db, season),
  ]);

  const builtAtMs = Date.now();
  const standings = aggregateStandingsMarket({
    season,
    predictions: standingsPreds,
    builtAtMs,
  });
  const awards = aggregateAwardsMarket({
    season,
    submissions: awardsSubs,
    builtAtMs,
  });

  await seasonPredictMarketDocRef(db, season).set(
    {
      season,
      standings,
      awards,
      builtAtMs,
      deadlineAtMs: SEASON_PREDICT_SUBMIT_DEADLINE_AT_MS,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return {
    ok: true,
    season,
    standingsSubmissions: standingsPreds.length,
    awardsSubmissions: awardsSubs.length,
    builtAtMs,
  };
}
