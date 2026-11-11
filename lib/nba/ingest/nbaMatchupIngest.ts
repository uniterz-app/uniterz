/**
 * BDL `/nba/v1/matchups` → `nbaGameMatchups/{bdlGameId}` → `nbaAceGuard/{season}`。
 * 未処理の終了試合だけ。エースは今季の得点がチーム最多の選手。
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

type StoredPair = { d: string; o: string; s: number; m: number; a: number };

function isFinal(g: BdlGame): boolean {
  return String(g.status ?? "").trim().toLowerCase() === "final";
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export async function ingestNbaMatchupsFromBdl(
  db: Firestore,
  input: { seasonKey?: string; maxGames?: number } = {}
): Promise<{ seasonKey: string; processedGames: number; remainingGames: number; defenders: number }> {
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const seasonYear = bdlSeasonYearFromSeasonKey(seasonKey);
  const games = (await fetchBdlGames({ seasonYears: [seasonYear] })).filter((g) => {
    if (!isFinal(g)) return false;
    const phase = String(g.season_type ?? "regular");
    return phase === "regular" || phase === "";
  });
  const done = await db
    .collection(NBA_GAME_MATCHUPS_COLLECTION)
    .where("seasonKey", "==", seasonKey)
    .select()
    .get();
  const doneIds = new Set(done.docs.map((d) => d.id));
  const pending = games
    .filter((g) => !doneIds.has(String(g.id)))
    .sort((a, b) => String(a.date ?? "").localeCompare(String(b.date ?? "")));
  const limit = Math.max(1, Math.min(500, input.maxGames ?? 20));
  const batch = pending.slice(0, limit);

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
        await db.collection(NBA_GAME_MATCHUPS_COLLECTION).doc(String(game.id)).set({
          seasonKey,
          pairs,
          builtAtMs: Date.now(),
        });
      } catch (e) {
        console.error(`[nba-matchup-ingest] game=${game.id}`, e);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, batch.length) }, () => worker()));

  const defenders = await rebuildAceGuard(db, seasonKey);
  return {
    seasonKey,
    processedGames: batch.length,
    remainingGames: Math.max(0, pending.length - batch.length),
    defenders,
  };
}

async function rebuildAceGuard(db: Firestore, seasonKey: string): Promise<number> {
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
  const aceOfTeam = new Map<string, string>();
  for (const [id, teamId] of playerTeam) {
    const cur = aceOfTeam.get(teamId);
    if (!cur || (pts.get(id) ?? 0) > (pts.get(cur) ?? 0)) aceOfTeam.set(teamId, id);
  }
  const aces = new Set(aceOfTeam.values());
  const acc = new Map<string, { sec: number; fgm: number; fga: number; baseFga: number; baseFg: number }>();
  for (const d of gamesSnap.docs) {
    const pairs = (d.data().pairs ?? []) as StoredPair[];
    for (const pair of pairs) {
      if (!aces.has(pair.o)) continue;
      const offTeam = playerTeam.get(pair.o);
      const defTeam = playerTeam.get(pair.d);
      if (!offTeam || offTeam === defTeam) continue;
      const row = acc.get(pair.d) ?? { sec: 0, fgm: 0, fga: 0, baseFga: 0, baseFg: 0 };
      row.sec += pair.s;
      row.fgm += pair.m;
      row.fga += pair.a;
      const base = efg.get(pair.o);
      if (base != null && pair.a > 0) {
        row.baseFga += pair.a;
        row.baseFg += base * pair.a;
      }
      acc.set(pair.d, row);
    }
  }
  const players: Record<string, NbaAceGuardEntry> = {};
  for (const [id, row] of acc) {
    if (row.sec < 60) continue;
    const allowed = row.fga > 0 ? row.fgm / row.fga : 0;
    const base = row.baseFga > 0 ? row.baseFg / row.baseFga : allowed;
    players[id] = {
      minutes: Math.round((row.sec / 60) * 10) / 10,
      suppress: Math.round((base - allowed) * 1000) / 1000,
      fga: row.fga,
    };
  }
  await db.collection(NBA_ACE_GUARD_COLLECTION).doc(seasonKey).set({
    seasonKey,
    players,
    builtAtMs: Date.now(),
  });
  return Object.keys(players).length;
}
