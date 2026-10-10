/**
 * BDL play-by-play → `nbaGameDiscipline/{bdlGameId}` → `nbaDiscipline/{seasonKey}`。
 * 未処理の終了試合だけ取りに行く（日次は数試合、過去季の初回は全試合）。
 */
import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { bdlSeasonYearFromSeasonKey } from "@/lib/nba/bdl/bdlNbaEnv";
import { fetchBdlGames, type BdlGame } from "@/lib/nba/bdl/fetchBdlGames";
import {
  fetchBdlGamePlayerRefs,
  fetchBdlPlaysForGame,
} from "@/lib/nba/bdl/fetchBdlPlays";
import { parseBdlPlaysDiscipline } from "@/lib/nba/discipline/parseBdlPlaysDiscipline";
import {
  NBA_GAME_DISCIPLINE_COLLECTION,
  rebuildNbaDisciplineSnapshot,
} from "@/lib/nba/discipline/nbaDisciplineSnapshot";
import type { NbaGameDisciplineDoc } from "@/lib/nba/discipline/disciplineTypes";

export type NbaDisciplineIngestInput = {
  seasonKey?: string;
  /** 処理済みの試合も取り直す */
  force?: boolean;
  /** 1 回で処理する最大試合数（タイムアウト対策。未指定は全件） */
  maxGames?: number;
  concurrency?: number;
};

export type NbaDisciplineIngestResult = {
  ok: true;
  seasonKey: string;
  finalGames: number;
  processedGames: number;
  remainingGames: number;
  events: number;
  unresolved: number;
  failedGameIds: number[];
  snapshotPlayers: number;
  builtAtMs: number;
};

function isFinal(g: BdlGame): boolean {
  return String(g.status ?? "").trim().toLowerCase() === "final";
}

async function processGame(
  db: Firestore,
  seasonKey: string,
  game: BdlGame
): Promise<{ events: number; unresolved: number }> {
  const plays = await fetchBdlPlaysForGame(game.id);
  const hasCandidate = plays.some((p) => {
    const t = String(p.type ?? "").toLowerCase();
    return t.includes("technical foul") || t.startsWith("flagrant foul type") || t === "ejection";
  });
  const players = hasCandidate
    ? ((await fetchBdlGamePlayerRefs([game.id])).get(game.id) ?? [])
    : [];
  const parsed = parseBdlPlaysDiscipline(plays, players);
  const doc: NbaGameDisciplineDoc = {
    seasonKey,
    seasonType: game.postseason ? "playoffs" : "regular",
    date: String(game.date ?? "").slice(0, 10),
    events: parsed.events,
    unresolved: parsed.unresolved,
    names: parsed.names,
    builtAtMs: Date.now(),
  };
  await db
    .collection(NBA_GAME_DISCIPLINE_COLLECTION)
    .doc(String(game.id))
    .set(doc);
  return { events: parsed.events.length, unresolved: parsed.unresolved.length };
}

export async function ingestNbaDisciplineFromBdl(
  db: Firestore,
  input: NbaDisciplineIngestInput = {}
): Promise<NbaDisciplineIngestResult> {
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const seasonYear = bdlSeasonYearFromSeasonKey(seasonKey);
  const games = (await fetchBdlGames({ seasonYears: [seasonYear] })).filter(isFinal);

  let pending = games;
  if (!input.force) {
    const done = await db
      .collection(NBA_GAME_DISCIPLINE_COLLECTION)
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

  const concurrency = Math.max(1, Math.min(12, input.concurrency ?? 6));
  let events = 0;
  let unresolved = 0;
  const failedGameIds: number[] = [];
  let cursor = 0;
  const worker = async () => {
    while (cursor < batch.length) {
      const game = batch[cursor++]!;
      try {
        const r = await processGame(db, seasonKey, game);
        events += r.events;
        unresolved += r.unresolved;
      } catch (e) {
        console.error(`[nba-discipline-ingest] game=${game.id}`, e);
        failedGameIds.push(game.id);
      }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));

  const snapshot = await rebuildNbaDisciplineSnapshot(db, seasonKey);
  return {
    ok: true,
    seasonKey,
    finalGames: games.length,
    processedGames: batch.length - failedGameIds.length,
    remainingGames: pending.length - batch.length + failedGameIds.length,
    events,
    unresolved,
    failedGameIds,
    snapshotPlayers: Object.keys(snapshot.players).length,
    builtAtMs: snapshot.builtAtMs,
  };
}
