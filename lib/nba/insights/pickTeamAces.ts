/**
 * チームエース = そのシーズンにそのチームで出場した選手のうち最高 PPG。
 *
 * BDL leaders の `player.team_id` は **現所属** を返すことがある（オフシーズン移籍後）。
 * そのため leaders の PPG は使い、所属チームは season stats の出場チーム多数決で決める。
 */
import type { Firestore } from "firebase-admin/firestore";
import {
  fetchBdlPlayerLeaders,
} from "@/lib/nba/bdl/fetchBdlPlayerLeaders";
import { bdlSeasonYearFromSeasonKey } from "@/lib/nba/bdl/bdlNbaEnv";
import {
  fetchBdlPlayerGameLogs,
  parseBdlStatMinutes,
  type BdlPlayerGameLogStatRow,
} from "@/lib/nba/bdl/fetchBdlPlayerGameLogs";
import { appTeamIdFromBdlAbbreviation } from "@/lib/nba/bdl/bdlNbaTeamIdMap";
import {
  forEachWithConcurrency,
  NBA_INGEST_CONCURRENCY,
} from "@/lib/async/forEachWithConcurrency";
import { loadTeamRostersSnapshot } from "@/lib/nba/teamRosters/loadTeamRostersSnapshot";
import type { AceCandidate } from "@/lib/nba/insights/buildAceOutRecords";
import { TEAM_SHORT } from "@/lib/team-short";
import { NBA_ACE_OUT_CURATED_BY_TEAM } from "@/lib/nba/insights/aceOutCuratedPlayers";

const DEFAULT_MIN_GP = 20;
/** leaders から stats を取る上限（上位 PPG から埋める） */
const MAX_LEADER_LOOKUPS = 120;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function ppgGpFromStatRows(rows: BdlPlayerGameLogStatRow[]): {
  ppg: number;
  gp: number;
} {
  let gp = 0;
  let pts = 0;
  for (const row of rows) {
    if (parseBdlStatMinutes(row.min) <= 0) continue;
    gp += 1;
    const p = row.pts;
    pts += typeof p === "number" && Number.isFinite(p) ? p : 0;
  }
  if (gp <= 0) return { ppg: 0, gp: 0 };
  return { ppg: round1(pts / gp), gp };
}

export function primaryTeamIdFromStatRows(
  rows: BdlPlayerGameLogStatRow[]
): string | null {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (parseBdlStatMinutes(row.min) <= 0) continue;
    const abbr = String(row.team?.abbreviation ?? "")
      .trim()
      .toUpperCase();
    if (!abbr) continue;
    const teamId = appTeamIdFromBdlAbbreviation(abbr);
    if (!teamId) continue;
    counts.set(teamId, (counts.get(teamId) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestN = 0;
  for (const [teamId, n] of counts) {
    if (n > bestN) {
      best = teamId;
      bestN = n;
    }
  }
  return best;
}

export function playedGameIdsForTeam(
  rows: BdlPlayerGameLogStatRow[],
  teamId: string
): Set<string> {
  const wantAbbr = teamAbbrForAce(teamId);
  const out = new Set<string>();
  for (const row of rows) {
    if (parseBdlStatMinutes(row.min) <= 0) continue;
    const abbr = String(row.team?.abbreviation ?? "")
      .trim()
      .toUpperCase();
    if (abbr) {
      const rowTeamId = appTeamIdFromBdlAbbreviation(abbr);
      if (rowTeamId && rowTeamId !== teamId) continue;
      if (!rowTeamId && abbr !== wantAbbr) continue;
    }
    const gid = row.game?.id;
    if (typeof gid === "number") out.add(String(gid));
  }
  return out;
}

export type AcePickResult = {
  aces: AceCandidate[];
  /** playerId → その季の stats 行（エースのみ埋まる） */
  statsByPlayerId: Record<string, BdlPlayerGameLogStatRow[]>;
};

export async function pickTeamAcesForIngest(
  db: Firestore,
  seasonKey: string,
  opts?: { minGp?: number }
): Promise<AcePickResult> {
  const minGp = opts?.minGp ?? DEFAULT_MIN_GP;
  const seasonYear = bdlSeasonYearFromSeasonKey(seasonKey);
  const leaders = await fetchBdlPlayerLeaders({
    seasonYear,
    statType: "pts",
  });

  const ranked = leaders
    .map((row) => {
      const playerId = String(row.player?.id ?? "").trim();
      const gp = Number(row.games_played) || 0;
      const ppg = Number(row.value) || 0;
      const name =
        `${row.player?.first_name ?? ""} ${row.player?.last_name ?? ""}`.trim() ||
        playerId;
      return { playerId, name, ppg, gp, bdlId: Number(row.player?.id) };
    })
    .filter(
      (r) =>
        r.playerId &&
        Number.isFinite(r.bdlId) &&
        r.gp >= minGp &&
        r.ppg > 0
    )
    .sort((a, b) => b.ppg - a.ppg || b.gp - a.gp);

  const lookup = ranked.slice(0, MAX_LEADER_LOOKUPS);
  const statsByPlayerId: Record<string, BdlPlayerGameLogStatRow[]> = {};

  await forEachWithConcurrency(lookup, NBA_INGEST_CONCURRENCY, async (row) => {
    try {
      statsByPlayerId[row.playerId] = await fetchBdlPlayerGameLogs({
        bdlPlayerId: row.bdlId,
        seasonYear,
        seasonType: "regular",
      });
    } catch (e) {
      console.warn(
        `[ace-out] leader stats failed player=${row.playerId}`,
        e instanceof Error ? e.message : e
      );
      statsByPlayerId[row.playerId] = [];
    }
  });

  const byTeam = new Map<string, AceCandidate>();
  for (const row of lookup) {
    const rows = statsByPlayerId[row.playerId] ?? [];
    const teamId = primaryTeamIdFromStatRows(rows);
    if (!teamId) continue;
    const prev = byTeam.get(teamId);
    if (!prev || row.ppg > prev.ppg || (row.ppg === prev.ppg && row.gp > prev.gp)) {
      byTeam.set(teamId, {
        teamId,
        playerId: row.playerId,
        playerName: row.name,
        ppg: row.ppg,
        gp: row.gp,
        source: "auto",
      });
    }
  }

  let aces: AceCandidate[] = [...byTeam.values()];
  if (aces.length < 28) {
    aces = (await fillMissingAcesFromRosters(db, seasonKey, aces, { minGp })).map(
      (a) => ({ ...a, source: a.source ?? "auto" })
    );
  }

  // curated キー選手をマージ（同 team に複数可）
  const leaderPpg = new Map(
    ranked.map((r) => [r.playerId, { ppg: r.ppg, gp: r.gp, name: r.name }])
  );
  for (const [teamId, curated] of Object.entries(NBA_ACE_OUT_CURATED_BY_TEAM)) {
    for (const c of curated) {
      const existing = aces.find(
        (a) => a.teamId === teamId && a.playerId === c.playerId
      );
      if (existing) {
        if (c.preferAsAce) existing.preferAsAce = true;
        continue;
      }
      const fromLeaders = leaderPpg.get(c.playerId);
      aces.push({
        teamId,
        playerId: c.playerId,
        playerName: fromLeaders?.name || c.playerName,
        ppg: fromLeaders?.ppg ?? 0,
        gp: fromLeaders?.gp ?? 0,
        source: "curated",
        preferAsAce: c.preferAsAce === true,
      });
    }
  }

  // curated など stats 未取得の選手を取る
  const needStats = aces.filter((a) => !statsByPlayerId[a.playerId]);
  await forEachWithConcurrency(needStats, NBA_INGEST_CONCURRENCY, async (ace) => {
    const bdlId = Number(ace.playerId);
    if (!Number.isFinite(bdlId)) {
      statsByPlayerId[ace.playerId] = [];
      return;
    }
    try {
      statsByPlayerId[ace.playerId] = await fetchBdlPlayerGameLogs({
        bdlPlayerId: bdlId,
        seasonYear,
        seasonType: "regular",
      });
    } catch (e) {
      console.warn(
        `[ace-out] curated stats failed player=${ace.playerId}`,
        e instanceof Error ? e.message : e
      );
      statsByPlayerId[ace.playerId] = [];
    }
  });

  // PPG/GP が空の curated は stats から埋める。所属が違う curated は落とす
  const filtered: AceCandidate[] = [];
  for (const ace of aces) {
    const rows = statsByPlayerId[ace.playerId] ?? [];
    const primary = primaryTeamIdFromStatRows(rows);
    if (ace.source === "curated" && primary && primary !== ace.teamId) {
      // その季は別チーム（移籍後の現所属指定など）→ スキップ
      console.warn(
        `[ace-out] curated skip ${ace.playerName} expected ${ace.teamId} got ${primary}`
      );
      continue;
    }
    if (ace.ppg <= 0 || ace.gp <= 0) {
      const fromStats = ppgGpFromStatRows(rows);
      if (fromStats.gp > 0) {
        ace.ppg = fromStats.ppg;
        ace.gp = fromStats.gp;
      }
    }
    filtered.push(ace);
  }
  aces = filtered;

  const keep = new Set(aces.map((a) => a.playerId));
  for (const id of Object.keys(statsByPlayerId)) {
    if (!keep.has(id)) delete statsByPlayerId[id];
  }

  return {
    aces: aces.sort(
      (a, b) =>
        a.teamId.localeCompare(b.teamId) || b.ppg - a.ppg
    ),
    statsByPlayerId,
  };
}

async function fillMissingAcesFromRosters(
  db: Firestore,
  seasonKey: string,
  existing: AceCandidate[],
  opts?: { minGp?: number }
): Promise<AceCandidate[]> {
  const minGp = opts?.minGp ?? DEFAULT_MIN_GP;
  const have = new Set(existing.map((a) => a.teamId));
  const out = [...existing];
  const roster = await loadTeamRostersSnapshot(db, seasonKey);
  for (const team of Object.values(roster.bundle.teams)) {
    if (have.has(team.teamId)) continue;
    let best: AceCandidate | null = null;
    for (const p of team.players) {
      const playerId = String(p.id ?? "").trim();
      if (!playerId) continue;
      const gp = Number(p.gp) || 0;
      const ppg = Number(p.ppg) || 0;
      if (gp < minGp) continue;
      const name = `${p.firstName} ${p.lastName}`.trim() || playerId;
      if (!best || ppg > best.ppg) {
        best = {
          teamId: team.teamId,
          playerId,
          playerName: name,
          ppg,
          gp,
        };
      }
    }
    if (best) out.push(best);
  }
  return out;
}

export function teamAbbrForAce(teamId: string): string {
  return (TEAM_SHORT[teamId] ?? teamId.replace(/^nba-/, "")).toUpperCase();
}
