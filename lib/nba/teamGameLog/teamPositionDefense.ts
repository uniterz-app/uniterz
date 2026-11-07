/**
 * ポジション別の失点（相手のそのポジションの選手が取った 1 試合平均）。
 * `games.liveStats.box` の選手 `position`（BDL）を G / F / C の 3 区分に寄せる。
 * 兼任表記（G-F / F-C など）は先頭で振り分ける。空欄は数えない。
 *
 * マッチアップ（誰がマークしたか）ではない。レギュラーシーズンのみ。
 * リーグ平均・順位は 30 チームの 1 試合平均から（順位 1 = 最少失点）。
 */

export const NBA_POSITION_GROUPS = ["G", "F", "C"] as const;
export type NbaPositionGroup = (typeof NBA_POSITION_GROUPS)[number];

export const NBA_POSITION_DEFENSE_STATS = ["pts", "reb", "ast", "fg3m"] as const;
export type NbaPositionDefenseStat = (typeof NBA_POSITION_DEFENSE_STATS)[number];

export type NbaPositionDefenseCell = {
  value: number;
  leagueAvg: number;
  /** 1 = 最少失点 */
  rank: number;
};

export type NbaTeamPositionDefense = {
  /** 集計に使った box ありのレギュラー試合数 */
  games: number;
  /** 順位を付けたチーム数 */
  teams: number;
  groups: Record<
    NbaPositionGroup,
    Record<NbaPositionDefenseStat, NbaPositionDefenseCell>
  >;
};

type StatTotals = Record<NbaPositionDefenseStat, number>;
export type NbaPositionTotals = Record<NbaPositionGroup, StatTotals>;

export type NbaPositionDefenseAcc = {
  games: number;
  allowed: NbaPositionTotals;
};

function emptyStats(): StatTotals {
  return { pts: 0, reb: 0, ast: 0, fg3m: 0 };
}

function emptyTotals(): NbaPositionTotals {
  return { G: emptyStats(), F: emptyStats(), C: emptyStats() };
}

export function emptyPositionDefenseAcc(): NbaPositionDefenseAcc {
  return { games: 0, allowed: emptyTotals() };
}

export function nbaPositionGroup(raw: unknown): NbaPositionGroup | null {
  if (typeof raw !== "string") return null;
  const head = raw.trim().toUpperCase().split(/[-/\s]/)[0] ?? "";
  if (head === "G" || head === "PG" || head === "SG") return "G";
  if (head === "F" || head === "SF" || head === "PF") return "F";
  if (head === "C") return "C";
  return null;
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function made(raw: unknown): number {
  if (typeof raw !== "string") return 0;
  const hit = raw.trim().match(/^(\d+)\s*-\s*\d+$/);
  return hit ? Number(hit[1]) : 0;
}

/** box 片側の選手 → ポジション別合計。選手が居なければ null */
export function sumPositionTotals(
  players: Array<Record<string, unknown>> | null
): NbaPositionTotals | null {
  if (!players || players.length === 0) return null;
  const t = emptyTotals();
  for (const p of players) {
    const group = nbaPositionGroup(p.position);
    if (!group) continue;
    t[group].pts += num(p.pts);
    t[group].reb += num(p.reb);
    t[group].ast += num(p.ast);
    t[group].fg3m += made(p.fg3);
  }
  return t;
}

export function addPositionAllowed(
  acc: NbaPositionDefenseAcc,
  oppTotals: NbaPositionTotals
): void {
  acc.games += 1;
  for (const g of NBA_POSITION_GROUPS) {
    for (const s of NBA_POSITION_DEFENSE_STATS) {
      acc.allowed[g][s] += oppTotals[g][s];
    }
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** 全チームの累計 → チームごとの 1 試合平均・リーグ平均・順位。試合 0 のチームは null */
export function finalizePositionDefense(
  accs: Map<string, NbaPositionDefenseAcc>
): Map<string, NbaTeamPositionDefense | null> {
  const ranked = [...accs.entries()].filter(([, a]) => a.games > 0);
  const perGame = new Map(
    ranked.map(([teamId, a]) => [
      teamId,
      Object.fromEntries(
        NBA_POSITION_GROUPS.map((g) => [
          g,
          Object.fromEntries(
            NBA_POSITION_DEFENSE_STATS.map((s) => [s, a.allowed[g][s] / a.games])
          ),
        ])
      ) as NbaPositionTotals,
    ])
  );

  const leagueAvg = emptyTotals();
  const sorted = {} as Record<NbaPositionGroup, Record<NbaPositionDefenseStat, number[]>>;
  for (const g of NBA_POSITION_GROUPS) {
    sorted[g] = {} as Record<NbaPositionDefenseStat, number[]>;
    for (const s of NBA_POSITION_DEFENSE_STATS) {
      const vals = [...perGame.values()].map((v) => v[g][s]);
      leagueAvg[g][s] = vals.length
        ? vals.reduce((sum, v) => sum + v, 0) / vals.length
        : 0;
      sorted[g][s] = vals.map(round1).sort((a, b) => a - b);
    }
  }

  const out = new Map<string, NbaTeamPositionDefense | null>();
  for (const [teamId, a] of accs) {
    const v = perGame.get(teamId);
    if (!v) {
      out.set(teamId, null);
      continue;
    }
    const groups = {} as NbaTeamPositionDefense["groups"];
    for (const g of NBA_POSITION_GROUPS) {
      groups[g] = {} as Record<NbaPositionDefenseStat, NbaPositionDefenseCell>;
      for (const s of NBA_POSITION_DEFENSE_STATS) {
        const value = round1(v[g][s]);
        groups[g][s] = {
          value,
          leagueAvg: round1(leagueAvg[g][s]),
          rank: sorted[g][s].indexOf(value) + 1,
        };
      }
    }
    out.set(teamId, { games: a.games, teams: ranked.length, groups });
  }
  return out;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}

function finite(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Firestore / API の生データ → 型。欠けていれば null（ingest 前の doc） */
export function resolveTeamPositionDefense(
  raw: unknown
): NbaTeamPositionDefense | null {
  if (!isRecord(raw) || !isRecord(raw.groups)) return null;
  const games = finite(raw.games);
  const teams = finite(raw.teams);
  if (!games || !teams) return null;
  const groups = {} as NbaTeamPositionDefense["groups"];
  for (const g of NBA_POSITION_GROUPS) {
    const gRaw = raw.groups[g];
    if (!isRecord(gRaw)) return null;
    groups[g] = {} as Record<NbaPositionDefenseStat, NbaPositionDefenseCell>;
    for (const s of NBA_POSITION_DEFENSE_STATS) {
      const cell = gRaw[s];
      if (!isRecord(cell)) return null;
      const value = finite(cell.value);
      const leagueAvg = finite(cell.leagueAvg);
      const rank = finite(cell.rank);
      if (value == null || leagueAvg == null || rank == null) return null;
      groups[g][s] = { value, leagueAvg, rank };
    }
  }
  return { games, teams, groups };
}
