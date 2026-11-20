/**
 * BDL `/nba/v1/matchups` → `nbaGameMatchups/{bdlGameId}` → `nbaAceGuard/{season}`。
 * 未処理の終了試合だけ。エースは今季の得点がチーム最多の選手。
 * BDL がまだ空の試合は確定しない（ショットチャートと同じく最大 3 日待つ）。
 */
import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { bdlSeasonYearFromSeasonKey } from "@/lib/nba/bdl/bdlNbaEnv";
import { fetchBdlGames, type BdlGame } from "@/lib/nba/bdl/fetchBdlGames";
import { fetchBdlMatchupsForGame } from "@/lib/nba/bdl/fetchBdlMatchups";
import { NBA_PLAYER_SEASON_METRICS_COLLECTION } from "@/lib/nba/playerSeasonMetrics/playerSeasonMetricsTypes";

export const NBA_GAME_MATCHUPS_COLLECTION = "nbaGameMatchups";
export const NBA_ACE_GUARD_COLLECTION = "nbaAceGuard";

export type NbaAceGuardEntry = { minutes: number; suppress: number; fga: number };

/** ある守備側が付いた相手。s は秒、m / a は成功と試投 */
export type NbaDefenderMatchup = { o: string; s: number; m: number; a: number };

type StoredPair = { d: string; o: string; s: number; m: number; a: number };

/** 終了からこれだけ経っても空なら空として保存し、取り直さない */
const EMPTY_GIVE_UP_MS = 3 * 24 * 60 * 60 * 1000;

function isFinal(g: BdlGame): boolean {
  return String(g.status ?? "").trim().toLowerCase() === "final";
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export type NbaMatchupIngestInput = {
  seasonKey?: string;
  /** 1 回で処理する最大試合数（タイムアウト対策。未指定は 20） */
  maxGames?: number;
  /** 処理済みの試合も取り直す */
  force?: boolean;
};

export type NbaMatchupIngestResult = {
  seasonKey: string;
  processedGames: number;
  /** BDL がまだ返さない試合（次回また取りに行く） */
  notReadyGames: number;
  remainingGames: number;
  defenders: number;
};

export async function ingestNbaMatchupsFromBdl(
  db: Firestore,
  input: NbaMatchupIngestInput = {}
): Promise<NbaMatchupIngestResult> {
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const seasonYear = bdlSeasonYearFromSeasonKey(seasonKey);
  const force = input.force === true;
  const games = (await fetchBdlGames({ seasonYears: [seasonYear] })).filter((g) => {
    if (!isFinal(g)) return false;
    const phase = String(g.season_type ?? "regular");
    return phase === "regular" || phase === "";
  });
  const existing = await db
    .collection(NBA_GAME_MATCHUPS_COLLECTION)
    .where("seasonKey", "==", seasonKey)
    .select("pairs", "empty")
    .get();
  /** pairs があるか、空確定したものだけ完了。空のまま書いた古い doc は再取得対象 */
  const doneIds = new Set<string>();
  if (!force) {
    for (const d of existing.docs) {
      const data = d.data() as { pairs?: StoredPair[]; empty?: boolean };
      const pairs = data.pairs ?? [];
      if (pairs.length > 0 || data.empty === true) doneIds.add(d.id);
    }
  }
  const pending = games
    .filter((g) => !doneIds.has(String(g.id)))
    .sort((a, b) => String(a.date ?? "").localeCompare(String(b.date ?? "")));
  const limit = Math.max(1, Math.min(500, input.maxGames ?? 20));
  const batch = pending.slice(0, limit);
  const nowMs = Date.now();
  let notReadyGames = 0;

  let cursor = 0;
  const worker = async () => {
    while (cursor < batch.length) {
      const game = batch[cursor++]!;
      try {
        const rows = await fetchBdlMatchupsForGame(game.id);
        const pairs: StoredPair[] = [];
        for (const row of rows) {
          if (row.player_id == null || row.opponent_player_id == null) continue;
          const s = num(row.stats?.matchup_seconds);
          const a = num(row.stats?.matchup_field_goals_attempted);
          if (s < 20 && a <= 0) continue;
          pairs.push({
            d: String(row.opponent_player_id),
            o: String(row.player_id),
            s,
            m: num(row.stats?.matchup_field_goals_made),
            a,
          });
        }
        if (pairs.length === 0) {
          const gameMs = Date.parse(String(game.date ?? "").slice(0, 10));
          if (!Number.isFinite(gameMs) || nowMs - gameMs < EMPTY_GIVE_UP_MS) {
            notReadyGames += 1;
            continue;
          }
          await db.collection(NBA_GAME_MATCHUPS_COLLECTION).doc(String(game.id)).set({
            seasonKey,
            pairs: [],
            empty: true,
            builtAtMs: nowMs,
          });
          continue;
        }
        await db.collection(NBA_GAME_MATCHUPS_COLLECTION).doc(String(game.id)).set({
          seasonKey,
          pairs,
          builtAtMs: nowMs,
        });
      } catch (e) {
        console.error(`[nba-matchup-ingest] game=${game.id}`, e);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, batch.length || 1) }, () => worker()));

  const defenders = await rebuildNbaAceGuard(db, seasonKey);
  return {
    seasonKey,
    processedGames: batch.length - notReadyGames,
    notReadyGames,
    remainingGames: Math.max(0, pending.length - batch.length),
    defenders,
  };
}

/** 保存済みの試合行だけを読み直す。相手の得点源（チーム内得点上位3人）と、守備側ごとの相手一覧も作る。 */
export async function rebuildNbaAceGuard(db: Firestore, seasonKey: string): Promise<number> {
  const [metricsSnap, gamesSnap] = await Promise.all([
    db.collection(NBA_PLAYER_SEASON_METRICS_COLLECTION).doc(seasonKey).collection("players").select("teamId", "gamesPlayed", "metrics").get(),
    db.collection(NBA_GAME_MATCHUPS_COLLECTION).where("seasonKey", "==", seasonKey).select("pairs").get(),
  ]);
  const playerTeam = new Map<string, string>();
  const pts = new Map<string, number>();
  const efg = new Map<string, number>();
  for (const d of metricsSnap.docs) {
    const data = d.data();
    const teamId = typeof data.teamId === "string" ? data.teamId : "";
    const gp = num(data.gamesPlayed);
    const metrics = data.metrics as Record<string, { value?: number }> | undefined;
    const p = num(metrics?.pts?.value);
    const e = num(metrics?.efg_pct?.value);
    if (!teamId || gp < 8 || p <= 0) continue;
    playerTeam.set(d.id, teamId);
    pts.set(d.id, p);
    if (e > 0) efg.set(d.id, e);
  }
  const byTeam = new Map<string, string[]>();
  for (const [id, teamId] of playerTeam) {
    const ids = byTeam.get(teamId) ?? [];
    ids.push(id);
    byTeam.set(teamId, ids);
  }
  const aces = new Set<string>();
  const tough = new Set<string>();
  for (const ids of byTeam.values()) {
    ids.sort((a, b) => (pts.get(b) ?? 0) - (pts.get(a) ?? 0));
    if (ids[0]) aces.add(ids[0]);
    for (const id of ids.slice(0, 3)) tough.add(id);
  }
  type Acc = { sec: number; fgm: number; fga: number; baseFga: number; baseFg: number };
  const aceAcc = new Map<string, Acc>();
  const toughAcc = new Map<string, Acc>();
  const oppAcc = new Map<string, Map<string, { sec: number; fgm: number; fga: number }>>();
  const guardedAcc = new Map<string, Map<string, { sec: number; fgm: number; fga: number }>>();
  const add = (map: Map<string, Acc>, id: string, pair: StoredPair) => {
    const row = map.get(id) ?? { sec: 0, fgm: 0, fga: 0, baseFga: 0, baseFg: 0 };
    row.sec += pair.s;
    row.fgm += pair.m;
    row.fga += pair.a;
    const base = efg.get(pair.o);
    if (base != null && pair.a > 0) {
      row.baseFga += pair.a;
      row.baseFg += base * pair.a;
    }
    map.set(id, row);
  };
  for (const d of gamesSnap.docs) {
    const pairs = (d.data().pairs ?? []) as StoredPair[];
    for (const pair of pairs) {
      const offTeam = playerTeam.get(pair.o);
      const defTeam = playerTeam.get(pair.d);
      if (!offTeam || offTeam === defTeam) continue;
      const opp = oppAcc.get(pair.d) ?? new Map();
      const row = opp.get(pair.o) ?? { sec: 0, fgm: 0, fga: 0 };
      row.sec += pair.s;
      row.fgm += pair.m;
      row.fga += pair.a;
      opp.set(pair.o, row);
      oppAcc.set(pair.d, opp);
      const guarded = guardedAcc.get(pair.o) ?? new Map();
      const marked = guarded.get(pair.d) ?? { sec: 0, fgm: 0, fga: 0 };
      marked.sec += pair.s;
      marked.fgm += pair.m;
      marked.fga += pair.a;
      guarded.set(pair.d, marked);
      guardedAcc.set(pair.o, guarded);
      if (aces.has(pair.o)) add(aceAcc, pair.d, pair);
      if (tough.has(pair.o)) add(toughAcc, pair.d, pair);
    }
  }
  const finish = (map: Map<string, Acc>): Record<string, NbaAceGuardEntry> => {
    const out: Record<string, NbaAceGuardEntry> = {};
    for (const [id, row] of map) {
      if (row.sec < 60) continue;
      const allowed = row.fga > 0 ? row.fgm / row.fga : 0;
      const base = row.baseFga > 0 ? row.baseFg / row.baseFga : allowed;
      out[id] = {
        minutes: Math.round((row.sec / 60) * 10) / 10,
        suppress: Math.round((base - allowed) * 1000) / 1000,
        fga: row.fga,
      };
    }
    return out;
  };
  const players = finish(aceAcc);
  const toughPlayers = finish(toughAcc);
  const topOpponents = (map: Map<string, Map<string, { sec: number; fgm: number; fga: number }>>) => {
    const out: Record<string, NbaDefenderMatchup[]> = {};
    for (const [id, opp] of map) {
      const rows = [...opp.entries()]
        .filter(([, row]) => row.sec >= 60)
        .sort((a, b) => b[1].sec - a[1].sec)
        .slice(0, 8)
        .map(([o, row]) => ({ o, s: row.sec, m: row.fgm, a: row.fga }));
      if (rows.length > 0) out[id] = rows;
    }
    return out;
  };
  const matchups = topOpponents(oppAcc);
  const guardedBy = topOpponents(guardedAcc);
  await db.collection(NBA_ACE_GUARD_COLLECTION).doc(seasonKey).set({
    seasonKey,
    players,
    tough: toughPlayers,
    matchups,
    guardedBy,
    builtAtMs: Date.now(),
  });
  return Object.keys(players).length;
}
