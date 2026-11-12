/**
 * lineup_stats を集計し、公開中の順位ハブへ 2〜5 人のベスト / ワーストだけ足す。
 * ハブ全体は作り直さない。
 */
import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";
import { formatNbaPlayerListName } from "../lib/nba/formatNbaPlayerListName";
import { ingestNbaLineupsFromBdl, type NbaLineupBoard } from "../lib/nba/ingest/nbaLineupIngest";
import { NBA_TEAM_ROSTERS_COLLECTION } from "../lib/nba/teamRosters/loadTeamRostersSnapshot";

const seasonKey = "2026-27";

function namesOf(ids: string[], roster: Map<string, string>, size: number): string[] | null {
  const names = ids.flatMap((id) => {
    const name = roster.get(id);
    return name ? [name] : [];
  });
  return names.length === size ? names : null;
}

async function main() {
  const db = getAdminDb();
  const ingested = await ingestNbaLineupsFromBdl(db, { seasonKey });
  const season = await db.collection("nbaLineupSeason").doc(seasonKey).get();
  const teamsRaw = (season.data()?.teams ?? {}) as Record<string, { lineups?: { ids: string[]; min: number; net: number; pm?: number }[]; boards?: NbaLineupBoard[] }>;
  const rosterSnap = await db.collection(NBA_TEAM_ROSTERS_COLLECTION).doc(seasonKey).get();
  const roster = new Map<string, string>();
  const rosterTeams = (rosterSnap.data()?.teams ?? {}) as Record<string, { players?: { id?: string; firstName?: string; lastName?: string }[] }>;
  for (const team of Object.values(rosterTeams)) {
    for (const player of team.players ?? []) {
      const id = String(player.id ?? "");
      if (!id) continue;
      roster.set(id, formatNbaPlayerListName(`${player.firstName ?? ""} ${player.lastName ?? ""}`.trim(), id));
    }
  }
  const hubRef = db.collection("nbaLeagueHub").doc(seasonKey);
  const hub = await hubRef.get();
  const teams = (hub.data()?.teams ?? []) as { teamId: string; lineups?: unknown; lineupBoards?: unknown }[];
  let patched = 0;
  for (const team of teams) {
    const row = teamsRaw[team.teamId];
    if (!row) continue;
    team.lineups = (row.lineups ?? []).flatMap((unit) => {
      const names = namesOf(unit.ids, roster, 5);
      return names ? [{ names, min: unit.min, net: unit.net, pm: unit.pm }] : [];
    });
    const named = (units: { ids: string[]; min: number; net: number; pm: number; off?: number; def?: number; games?: number }[] | undefined, size: number) =>
      (units ?? []).flatMap((unit) => {
        const names = namesOf(unit.ids, roster, size);
        return names ? [{ names, min: unit.min, net: unit.net, pm: unit.pm, off: unit.off, def: unit.def, games: unit.games }] : [];
      });
    team.lineupBoards = (row.boards ?? []).flatMap((board) => {
      const most = named(board.most, board.size);
      const best = named(board.best, board.size);
      const worst = named(board.worst, board.size);
      return most.length || best.length || worst.length ? [{ size: board.size, most, best, worst }] : [];
    });
    patched += 1;
  }
  const onOffRaw = (season.data()?.players ?? {}) as Record<string, { onNet?: number; offNet?: number; onMin?: number; offMin?: number }>;
  const players = (hub.data()?.players ?? []) as { playerId?: string; onOff?: unknown }[];
  let onOffCount = 0;
  for (const player of players) {
    const row = player.playerId ? onOffRaw[player.playerId] : undefined;
    if (!row || typeof row.onNet !== "number" || typeof row.offNet !== "number") continue;
    player.onOff = {
      onNet: row.onNet,
      offNet: row.offNet,
      onMin: row.onMin ?? 0,
      offMin: row.offMin ?? 0,
    };
    onOffCount += 1;
  }
  await hubRef.update({ teams, players });
  console.log(JSON.stringify({ ingested, patched, roster: roster.size, onOff: onOffCount }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
