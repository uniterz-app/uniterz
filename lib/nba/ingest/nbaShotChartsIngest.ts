/**
 * BDL shot_charts → `nbaGameShotCharts/{bdlGameId}` → `nbaPlayerShotAreas/{seasonKey}`。
 * 未処理の終了試合だけ取りに行く（日次・試合後は数試合、今季の初回は全試合）。
 */
import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { bdlSeasonYearFromSeasonKey } from "@/lib/nba/bdl/bdlNbaEnv";
import { fetchBdlGames, type BdlGame } from "@/lib/nba/bdl/fetchBdlGames";
import { fetchBdlShotChartsForGame } from "@/lib/nba/bdl/fetchBdlShotCharts";
import {
  NBA_GAME_SHOT_CHARTS_COLLECTION,
  NBA_PLAYER_SHOT_AREAS_COLLECTION,
  isNbaRegularShotSeasonType,
  nbaShotAreaIdOf,
  type NbaGameShot,
  type NbaGameShotChartsDoc,
  type NbaPlayerShotAreasDoc,
  type NbaShotAreaCounts,
} from "@/lib/nba/shotCharts/shotChartTypes";

export type NbaShotChartsIngestInput = {
  seasonKey?: string;
  /** 処理済みの試合も取り直す */
  force?: boolean;
  /** 1 回で処理する最大試合数（タイムアウト対策。未指定は全件） */
  maxGames?: number;
  concurrency?: number;
};

export type NbaShotChartsIngestResult = {
  ok: true;
  seasonKey: string;
  finalGames: number;
  processedGames: number;
  /** BDL がまだ返さない試合（次回また取りに行く） */
  notReadyGames: number;
  remainingGames: number;
  failedGameIds: number[];
  shots: number;
  snapshotPlayers: number;
  snapshotGames: number;
};

/** 終了からこれだけ経っても空なら空として保存し、取り直さない */
const EMPTY_GIVE_UP_MS = 3 * 24 * 60 * 60 * 1000;

function isFinal(g: BdlGame): boolean {
  return String(g.status ?? "").trim().toLowerCase() === "final";
}

function round1(v: number | null | undefined): number | null {
  return typeof v === "number" && Number.isFinite(v) ? Math.round(v * 10) / 10 : null;
}

async function processGame(
  db: Firestore,
  seasonKey: string,
  game: BdlGame,
  nowMs: number
): Promise<{ shots: number; ready: boolean }> {
  const rows = await fetchBdlShotChartsForGame(game.id);
  const date = String(game.date ?? "").slice(0, 10);
  if (rows.length === 0) {
    const gameMs = Date.parse(date);
    if (!Number.isFinite(gameMs) || nowMs - gameMs < EMPTY_GIVE_UP_MS) {
      return { shots: 0, ready: false };
    }
  }
  const shots: NbaGameShot[] = [];
  const agg: Record<string, NbaShotAreaCounts> = {};
  for (const r of rows) {
    if (r.player_id == null) continue;
    const p = String(r.player_id);
    const z = nbaShotAreaIdOf(r.shot_zone_basic, r.shot_zone_area);
    const m: 0 | 1 = r.made ? 1 : 0;
    shots.push({
      p,
      m,
      v: r.shot_value === 3 ? 3 : 2,
      x: round1(r.coordinate_x),
      y: round1(r.coordinate_y),
      d: round1(r.shot_distance),
      z,
    });
    if (!z) continue;
    const counts = (agg[p] ??= {});
    const c = (counts[z] ??= [0, 0]);
    c[0] += m;
    c[1] += 1;
  }
  const doc: NbaGameShotChartsDoc = {
    seasonKey,
    seasonType: rows[0]?.season_type ?? (game.postseason ? "playoffs" : "regular"),
    date,
    shots,
    agg,
    ...(rows.length === 0 ? { empty: true } : {}),
    builtAtMs: nowMs,
  };
  await db.collection(NBA_GAME_SHOT_CHARTS_COLLECTION).doc(String(game.id)).set(doc);
  return { shots: shots.length, ready: true };
}

/** 試合ごとの agg を足し直して `nbaPlayerShotAreas/{seasonKey}` を作る */
export async function rebuildNbaPlayerShotAreas(
  db: Firestore,
  seasonKey: string
): Promise<NbaPlayerShotAreasDoc> {
  const snap = await db
    .collection(NBA_GAME_SHOT_CHARTS_COLLECTION)
    .where("seasonKey", "==", seasonKey)
    .select("seasonType", "agg")
    .get();
  const players: Record<string, NbaShotAreaCounts> = {};
  let games = 0;
  for (const d of snap.docs) {
    const data = d.data() as Pick<NbaGameShotChartsDoc, "seasonType" | "agg">;
    if (!isNbaRegularShotSeasonType(data.seasonType)) continue;
    const agg = data.agg ?? {};
    if (Object.keys(agg).length === 0) continue;
    games++;
    for (const [pid, counts] of Object.entries(agg)) {
      const out = (players[pid] ??= {});
      for (const [zone, c] of Object.entries(counts) as Array<[keyof NbaShotAreaCounts, [number, number]]>) {
        const cur = (out[zone] ??= [0, 0]);
        cur[0] += c[0];
        cur[1] += c[1];
      }
    }
  }
  const doc: NbaPlayerShotAreasDoc = { seasonKey, games, players, builtAtMs: Date.now() };
  await db.collection(NBA_PLAYER_SHOT_AREAS_COLLECTION).doc(seasonKey).set(doc);
  return doc;
}

export async function ingestNbaShotChartsFromBdl(
  db: Firestore,
  input: NbaShotChartsIngestInput = {}
): Promise<NbaShotChartsIngestResult> {
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const seasonYear = bdlSeasonYearFromSeasonKey(seasonKey);
  const games = (await fetchBdlGames({ seasonYears: [seasonYear] })).filter(isFinal);

  let pending = games;
  if (!input.force) {
    const done = await db
      .collection(NBA_GAME_SHOT_CHARTS_COLLECTION)
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
  let shots = 0;
  let notReady = 0;
  const failedGameIds: number[] = [];
  let cursor = 0;
  const worker = async () => {
    while (cursor < batch.length) {
      const game = batch[cursor++]!;
      try {
        const r = await processGame(db, seasonKey, game, nowMs);
        shots += r.shots;
        if (!r.ready) notReady++;
      } catch (e) {
        console.error(`[nba-shot-charts-ingest] game=${game.id}`, e);
        failedGameIds.push(game.id);
      }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));

  const snapshot = await rebuildNbaPlayerShotAreas(db, seasonKey);
  return {
    ok: true,
    seasonKey,
    finalGames: games.length,
    processedGames: batch.length - failedGameIds.length - notReady,
    notReadyGames: notReady,
    remainingGames: pending.length - batch.length + failedGameIds.length + notReady,
    failedGameIds,
    shots,
    snapshotPlayers: Object.keys(snapshot.players).length,
    snapshotGames: snapshot.games,
  };
}
