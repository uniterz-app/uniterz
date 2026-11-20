/**
 * ポゼッションシミュレーションの入力を Firestore のスナップショットだけで組む（BDL なし）。
 * - ペース / ORtg / DRtg / TOV% … `nbaLeagueTeamStats/{season}` の season 行
 * - 5 人組 … `nbaLineupSeason/{season}.teams[].lineups`（無いチームはチーム平均で回る）
 * - 選手（ポジション・分・打数の割合・3P 率・FT）… `nbaTeamRosters/{season}`
 * - ポジション別失点 … `nbaTeamGameLogs/{season}/teams/*` の `positionDefense`
 */
import type { Firestore } from "firebase-admin/firestore";
import { NBA_LEAGUE_TEAM_STATS_COLLECTION } from "@/lib/nba/leagueTeamStats/loadLeagueTeamStatsSnapshot";
import type { SimLineup, SimOutPlayer, SimPlayer, SimPos, SimTeamInput } from "@/lib/nba/sim/nbaPossessionSim";

type TeamStatRow = { pace: number; ortg: number; drtg: number; tovPct: number };
type RosterPlayer = {
  id: string;
  name: string;
  pos: SimPos;
  min: number;
  fga: number;
  fg3a: number;
  fta: number;
  ftPct: number;
  tpg: number;
  /** 今季の出場試合数・平均得点（今季未出場で前季の平均が載っている行は gp 0 で priorPpg に回す） */
  gp: number;
  ppg: number;
  priorPpg: number | null;
};

/** 5 人組の攻守をチーム平均へ寄せる強さ（分）。この分数でちょうど半々 */
const LINEUP_SHRINK_MIN = 250;

export type NbaSimContext = {
  seasonKey: string;
  leagueOrtg: number;
  stats: Record<string, TeamStatRow>;
  lineups: Record<string, SimLineup[]>;
  rosters: Record<string, RosterPlayer[]>;
  posPtsVsAvg: Record<string, Record<SimPos, number>>;
};

const num = (x: unknown, fallback = 0) => (typeof x === "number" && Number.isFinite(x) ? x : fallback);

function simPos(position: unknown): SimPos {
  const p = String(position ?? "").trim().toUpperCase();
  if (p.startsWith("C")) return "C";
  if (p.startsWith("F")) return "F";
  return "G";
}

export async function loadNbaSimContext(db: Firestore, seasonKey: string): Promise<NbaSimContext> {
  const [statsSnap, lineupSnap, rosterSnap, logSnap] = await Promise.all([
    db.getAll(db.collection(NBA_LEAGUE_TEAM_STATS_COLLECTION).doc(seasonKey), { fieldMask: ["season"] }),
    db.getAll(db.collection("nbaLineupSeason").doc(seasonKey), { fieldMask: ["teams"] }),
    db.getAll(db.collection("nbaTeamRosters").doc(seasonKey), { fieldMask: ["teams"] }),
    db.collection("nbaTeamGameLogs").doc(seasonKey).collection("teams").select("positionDefense").get(),
  ]);

  const stats: NbaSimContext["stats"] = {};
  for (const row of ((statsSnap[0]?.data()?.season ?? []) as Record<string, unknown>[])) {
    const teamId = String(row.teamId ?? "");
    if (!teamId) continue;
    const tov = num(row.tovPct, 0.14);
    stats[teamId] = {
      pace: num(row.pace, 99),
      ortg: num(row.ortg, 114),
      drtg: num(row.drtg, 114),
      tovPct: tov > 1 ? tov / 100 : tov,
    };
  }

  const lineups: NbaSimContext["lineups"] = {};
  const lineupTeams = (lineupSnap[0]?.data()?.teams ?? {}) as Record<string, { lineups?: Record<string, unknown>[] }>;
  for (const [teamId, t] of Object.entries(lineupTeams)) {
    const team = stats[teamId];
    if (!team) continue;
    lineups[teamId] = (t.lineups ?? [])
      .map((u) => {
        const min = num(u.min);
        const w = min / (min + LINEUP_SHRINK_MIN);
        return {
          ids: Array.isArray(u.ids) ? u.ids.map(String) : [],
          min,
          off: team.ortg + w * (num(u.off, team.ortg) - team.ortg),
          def: team.drtg + w * (num(u.def, team.drtg) - team.drtg),
        };
      })
      .filter((u) => u.ids.length === 5 && u.min > 0);
  }
  const ortgs = Object.values(stats).map((s) => s.ortg);
  const leagueOrtg = ortgs.length ? ortgs.reduce((a, b) => a + b, 0) / ortgs.length : 114;

  const rosters: NbaSimContext["rosters"] = {};
  const rosterTeams = (rosterSnap[0]?.data()?.teams ?? {}) as Record<string, { players?: Record<string, unknown>[] }>;
  for (const [teamId, t] of Object.entries(rosterTeams)) {
    rosters[teamId] = (t.players ?? []).map((p) => {
      const priorRow = typeof p.averagesSeasonKey === "string" && p.averagesSeasonKey !== seasonKey;
      return {
        id: String(p.id ?? ""),
        name: `${String(p.firstName ?? "").charAt(0)}.${String(p.lastName ?? "")}`.toUpperCase(),
        pos: simPos(p.position),
        min: num(p.mpg),
        fga: num(p.fga),
        fg3a: num(p.fg3a),
        fta: num(p.fta),
        ftPct: num(p.ftPct, 0.75),
        tpg: num(p.tpg),
        gp: priorRow ? 0 : num(p.gp),
        ppg: priorRow ? 0 : num(p.ppg),
        priorPpg: priorRow && num(p.gp) > 0 ? num(p.ppg) : null,
      };
    });
  }

  const posPtsVsAvg: NbaSimContext["posPtsVsAvg"] = {};
  for (const d of logSnap.docs) {
    const groups = (d.data().positionDefense?.groups ?? null) as Record<
      string,
      { pts?: { value?: number; leagueAvg?: number } }
    > | null;
    if (!groups) continue;
    const vs = (g: SimPos) => num(groups[g]?.pts?.value) - num(groups[g]?.pts?.leagueAvg);
    posPtsVsAvg[d.id] = { G: vs("G"), F: vs("F"), C: vs("C") };
  }

  return { seasonKey, leagueOrtg, stats, lineups, rosters, posPtsVsAvg };
}

/** そのチームの入力。リーグ表の行が無ければ null（開幕直後など） */
export function buildNbaSimTeamInput(
  ctx: NbaSimContext,
  teamId: string,
  restDays: number | null
): SimTeamInput | null {
  const s = ctx.stats[teamId];
  if (!s) return null;
  const players: SimPlayer[] = (ctx.rosters[teamId] ?? [])
    .filter((p) => p.id && p.min > 0)
    .map((p) => ({
      id: p.id,
      name: p.name,
      pos: p.pos,
      min: p.min,
      usage: (p.fga + 0.44 * p.fta + p.tpg) / Math.max(1, p.min),
      fg3Rate: p.fga > 0 ? p.fg3a / p.fga : 0.35,
      fta: p.fta,
      ftPct: p.ftPct,
    }));
  return {
    teamId,
    pace: s.pace,
    ortg: s.ortg,
    drtg: s.drtg,
    tovPct: s.tovPct,
    players,
    lineups: ctx.lineups[teamId] ?? [],
    posPtsVsAvg: ctx.posPtsVsAvg[teamId] ?? { G: 0, F: 0, C: 0 },
    restDays,
  };
}

export function simOutsFrom(
  side: "home" | "away",
  injuries: Array<{ playerId: string; netDelta: number }>
): SimOutPlayer[] {
  return injuries.map((i) => ({ side, playerId: i.playerId, impact: i.netDelta }));
}
