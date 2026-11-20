/**
 * BDL play-by-play → `nbaGameCleanRatings/{bdlGameId}` → `nbaTeamCleanRatings/{seasonKey}`。
 * 未処理のレギュラー終了試合だけ取りに行く（日次・試合後は数試合、今季の初回は全試合）。
 */
import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { bdlSeasonYearFromSeasonKey } from "@/lib/nba/bdl/bdlNbaEnv";
import { fetchBdlGames, type BdlGame } from "@/lib/nba/bdl/fetchBdlGames";
import { fetchBdlPlaysForGame } from "@/lib/nba/bdl/fetchBdlPlays";
import { rememberBdlTeamId } from "@/lib/nba/bdl/bdlNbaTeamIdMap";
import {
  aggregateNbaTeamCleanRatings,
  computeNbaGameCleanRatings,
} from "@/lib/nba/cleanRatings/computeNbaCleanRatings";
import {
  NBA_GAME_CLEAN_RATINGS_COLLECTION,
  NBA_TEAM_CLEAN_RATINGS_COLLECTION,
  type NbaGameCleanRatingsDoc,
  type NbaTeamCleanRatingsDoc,
} from "@/lib/nba/cleanRatings/nbaCleanRatingsTypes";

export type NbaCleanRatingsIngestInput = {
  seasonKey?: string;
  /** 処理済みの試合も取り直す */
  force?: boolean;
  /** 1 回で処理する最大試合数（タイムアウト対策。未指定は全件） */
  maxGames?: number;
  concurrency?: number;
};

export type NbaCleanRatingsIngestResult = {
  ok: true;
  seasonKey: string;
  finalGames: number;
  processedGames: number;
  /** play-by-play がまだ最終スコアに届いていない試合（次回また取りに行く） */
  notReadyGames: number;
  /** 諦めて集計から外した試合 */
  incompleteGames: number;
  remainingGames: number;
  failedGameIds: number[];
  snapshotTeams: number;
  snapshotGames: number;
};

/** 終了からこれだけ経っても play-by-play が最終スコアと合わなければ集計から外し、取り直さない */
const GIVE_UP_MS = 3 * 24 * 60 * 60 * 1000;
const MAX_SCORE_DRIFT = 5;

function isFinal(g: BdlGame): boolean {
  return String(g.status ?? "").trim().toLowerCase() === "final";
}

/** カップ決勝はレギュラーの成績に入らない */
function countsAsRegular(g: BdlGame): boolean {
  return !g.postseason && !/champ/i.test(String(g.ist_stage ?? ""));
}

async function processGame(
  db: Firestore,
  seasonKey: string,
  game: BdlGame,
  nowMs: number
): Promise<"ok" | "not_ready" | "incomplete" | "skipped"> {
  const homeBdl = game.home_team?.id;
  const awayBdl = game.visitor_team?.id;
  const homeTeamId =
    typeof homeBdl === "number" ? rememberBdlTeamId(homeBdl, game.home_team?.abbreviation) : null;
  const awayTeamId =
    typeof awayBdl === "number"
      ? rememberBdlTeamId(awayBdl, game.visitor_team?.abbreviation)
      : null;
  if (typeof homeBdl !== "number" || typeof awayBdl !== "number" || !homeTeamId || !awayTeamId) {
    return "skipped";
  }

  const plays = await fetchBdlPlaysForGame(game.id);
  const calc = computeNbaGameCleanRatings({
    plays,
    homeBdlTeamId: homeBdl,
    awayBdlTeamId: awayBdl,
  });
  const finalHome = game.home_team_score ?? 0;
  const finalAway = game.visitor_team_score ?? 0;
  const driftHome = calc.pbpHome - finalHome;
  const driftAway = calc.pbpAway - finalAway;
  const lastPeriod = plays.reduce((m, p) => Math.max(m, p.period ?? 0), 0);
  /** 4Q まで揃っていて数点だけずれる試合はずっと直らない。ずれた分は通常時間の得点から引いて公式スコアに合わせる */
  const matches =
    plays.length > 0 &&
    lastPeriod >= 4 &&
    Math.abs(driftHome) <= MAX_SCORE_DRIFT &&
    Math.abs(driftAway) <= MAX_SCORE_DRIFT;
  if (matches) {
    calc.home.all.pts -= driftHome;
    calc.home.clean.pts = Math.max(0, calc.home.clean.pts - driftHome);
    calc.away.all.pts -= driftAway;
    calc.away.clean.pts = Math.max(0, calc.away.clean.pts - driftAway);
  }
  const date = String(game.date ?? "").slice(0, 10);
  if (!matches) {
    const gameMs = Date.parse(date);
    if (!Number.isFinite(gameMs) || nowMs - gameMs < GIVE_UP_MS) return "not_ready";
  }

  const doc: NbaGameCleanRatingsDoc = {
    seasonKey,
    date,
    homeTeamId,
    awayTeamId,
    home: calc.home,
    away: calc.away,
    ...(matches ? {} : { incomplete: true as const }),
    builtAtMs: nowMs,
  };
  await db.collection(NBA_GAME_CLEAN_RATINGS_COLLECTION).doc(String(game.id)).set(doc);
  return matches ? "ok" : "incomplete";
}

/** 試合 doc を足し直して `nbaTeamCleanRatings/{seasonKey}` を作る */
export async function rebuildNbaTeamCleanRatings(
  db: Firestore,
  seasonKey: string
): Promise<NbaTeamCleanRatingsDoc> {
  const snap = await db
    .collection(NBA_GAME_CLEAN_RATINGS_COLLECTION)
    .where("seasonKey", "==", seasonKey)
    .select("homeTeamId", "awayTeamId", "home", "away", "date", "incomplete")
    .get();
  const games = snap.docs
    .map((d) => d.data() as NbaGameCleanRatingsDoc)
    .filter((g) => !g.incomplete && g.home && g.away);
  const doc: NbaTeamCleanRatingsDoc = {
    seasonKey,
    games: games.length,
    teams: aggregateNbaTeamCleanRatings(games),
    builtAtMs: Date.now(),
  };
  await db.collection(NBA_TEAM_CLEAN_RATINGS_COLLECTION).doc(seasonKey).set(doc);
  return doc;
}

export async function ingestNbaCleanRatingsFromBdl(
  db: Firestore,
  input: NbaCleanRatingsIngestInput = {}
): Promise<NbaCleanRatingsIngestResult> {
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const seasonYear = bdlSeasonYearFromSeasonKey(seasonKey);
  const games = (await fetchBdlGames({ seasonYears: [seasonYear], postseason: false }))
    .filter(isFinal)
    .filter(countsAsRegular);

  let pending = games;
  if (!input.force) {
    const done = await db
      .collection(NBA_GAME_CLEAN_RATINGS_COLLECTION)
      .where("seasonKey", "==", seasonKey)
      .select()
      .get();
    const doneIds = new Set(done.docs.map((d) => d.id));
    pending = games.filter((g) => !doneIds.has(String(g.id)));
  }
  pending.sort((a, b) => String(a.date ?? "").localeCompare(String(b.date ?? "")));
  const limit =
    typeof input.maxGames === "number" && input.maxGames > 0
      ? Math.trunc(input.maxGames)
      : pending.length;
  const batch = pending.slice(0, limit);

  const nowMs = Date.now();
  const concurrency = Math.max(1, Math.min(12, input.concurrency ?? 6));
  let processed = 0;
  let notReady = 0;
  let incomplete = 0;
  const failedGameIds: number[] = [];
  let cursor = 0;
  const worker = async () => {
    while (cursor < batch.length) {
      const game = batch[cursor++]!;
      try {
        const r = await processGame(db, seasonKey, game, nowMs);
        if (r === "ok") processed++;
        else if (r === "not_ready") notReady++;
        else if (r === "incomplete") incomplete++;
      } catch (e) {
        console.error(`[nba-clean-ratings-ingest] game=${game.id}`, e);
        failedGameIds.push(game.id);
      }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));

  let snapshot: NbaTeamCleanRatingsDoc | null = null;
  if (processed + incomplete === 0) {
    const existing = await db.collection(NBA_TEAM_CLEAN_RATINGS_COLLECTION).doc(seasonKey).get();
    if (existing.exists) snapshot = existing.data() as NbaTeamCleanRatingsDoc;
  }
  snapshot ??= await rebuildNbaTeamCleanRatings(db, seasonKey);
  return {
    ok: true,
    seasonKey,
    finalGames: games.length,
    processedGames: processed,
    notReadyGames: notReady,
    incompleteGames: incomplete,
    remainingGames: pending.length - batch.length + failedGameIds.length + notReady,
    failedGameIds,
    snapshotTeams: Object.keys(snapshot.teams).length,
    snapshotGames: snapshot.games,
  };
}
