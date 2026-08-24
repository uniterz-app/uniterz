/**
 * BDL season averages → Player Stat Leaders。
 *
 * - 全選手 averages を取り、資格で絞ってから各チップ上位 30
 * - FG% / FT% / 3P% / TS% / eFG% 等: NBA.com Statistical Minimums（決め本数）
 * - counting / その他 Advanced: チーム試合数の 70% 出場
 * - last10 は未接続（空）
 */
import {
  fetchBdlActivePlayerTeamMap,
  type BdlPlayerTeamRef,
} from "@/lib/nba/bdl/fetchBdlActivePlayers";
import {
  fetchBdlPlayerSeasonAverages,
  type BdlPlayerSeasonAverageRow,
} from "@/lib/nba/bdl/fetchBdlPlayerSeasonAverages";
import { fetchBdlPlayerLeaders } from "@/lib/nba/bdl/fetchBdlPlayerLeaders";
import { fetchBdlTeamSeasonAverages } from "@/lib/nba/bdl/fetchBdlTeamSeasonAverages";
import {
  appTeamIdFromBdlAbbreviation,
  rememberBdlTeamId,
} from "@/lib/nba/bdl/bdlNbaTeamIdMap";
import { nbaConferenceForTeam } from "@/lib/nba/nbaConferenceTeams";
import {
  qualifiesForFg3PctLeaders,
  qualifiesForFgPctLeaders,
  qualifiesForFtPctLeaders,
  qualifiesForNonPctLeaders,
} from "@/lib/nba/nbaOfficialLeaderMinimums";
import {
  NBA_BDL_PLAYER_LEADER_STAT_TYPES,
  type NbaPlayerLeaderBdlStatType,
  type NbaPlayerLeaderMetricId,
  type NbaPlayerStatLeaderRow,
  type NbaPlayerStatLeadersBundle,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";
import {
  NBA_PLAYER_ADVANCED_LEADER_METRICS,
  type NbaPlayerAdvancedLeaderMetric,
} from "@/lib/predict/nbaPlayerStatLeadersAdvanced";

/** リーグ表チップ: 全選手から資格絞り → ソート後の上位 */
const LEADER_BOARD_LIMIT = 30;

type MergedPlayer = {
  ref: BdlPlayerTeamRef;
  gp: number;
  teamGames: number;
  base: Record<string, number>;
  advanced: Record<string, number>;
  scoring: Record<string, number>;
  misc: Record<string, number>;
  hustle: Record<string, number>;
  drives: Record<string, number>;
  catchShoot: Record<string, number>;
  pullUp: Record<string, number>;
  paintTouch: Record<string, number>;
  speed: Record<string, number>;
  passing: Record<string, number>;
  playtype: Record<string, Record<string, number>>;
  clutchBase: Record<string, number>;
  clutchAdvanced: Record<string, number>;
  shootingZone: Record<string, number>;
  defOverall: Record<string, number>;
  def2p: Record<string, number>;
  def3p: Record<string, number>;
  defLt6: Record<string, number>;
};

function emptyBoard(): Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]> {
  const board: Partial<
    Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]>
  > = {};
  for (const id of NBA_BDL_PLAYER_LEADER_STAT_TYPES) board[id] = [];
  for (const m of NBA_PLAYER_ADVANCED_LEADER_METRICS) board[m.id] = [];
  return board as Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]>;
}

function toStats(
  row: BdlPlayerSeasonAverageRow | undefined
): Record<string, number> {
  const out: Record<string, number> = {};
  if (!row?.stats) return out;
  for (const [k, v] of Object.entries(row.stats)) {
    if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
  }
  return out;
}

function indexRows(
  rows: BdlPlayerSeasonAverageRow[]
): Map<string, BdlPlayerSeasonAverageRow> {
  const m = new Map<string, BdlPlayerSeasonAverageRow>();
  for (const row of rows) {
    if (row?.player?.id == null) continue;
    m.set(String(row.player.id), row);
  }
  return m;
}

/** フォールバック用。正はチーム season averages の gp。 */
function teamGamesOfPlayerWl(stats: Record<string, number>): number {
  const sum = (stats.w ?? 0) + (stats.l ?? 0);
  return sum > 0 ? sum : (stats.gp ?? 0);
}

async function fetchTeamGamesByAppTeamId(
  seasonYear: number
): Promise<Map<string, number>> {
  const rows = await fetchBdlTeamSeasonAverages({
    seasonYear,
    type: "base",
  });
  const out = new Map<string, number>();
  for (const row of rows) {
    const abbr = row.team?.abbreviation;
    const appId =
      (row.team?.id != null
        ? rememberBdlTeamId(row.team.id, abbr)
        : null) ?? appTeamIdFromBdlAbbreviation(abbr);
    if (!appId) continue;
    const gp = row.stats?.gp;
    const n =
      typeof gp === "number" && Number.isFinite(gp)
        ? gp
        : (typeof row.stats?.w === "number" ? row.stats.w : 0) +
          (typeof row.stats?.l === "number" ? row.stats.l : 0);
    if (n > 0) out.set(appId, n);
  }
  return out;
}

function makesTotal(perGame: number | null, gp: number): number {
  if (perGame == null || !Number.isFinite(perGame) || gp <= 0) return 0;
  return perGame * gp;
}

function n(bag: Record<string, number>, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = bag[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

function rate(v: number | null): number | null {
  if (v == null) return null;
  return v > 1.5 ? v / 100 : v;
}

function rowOf(
  p: MergedPlayer,
  value: number
): NbaPlayerStatLeaderRow | null {
  if (!Number.isFinite(value)) return null;
  const conference = nbaConferenceForTeam(p.ref.teamId);
  if (!conference) return null;
  return {
    playerId: p.ref.playerId,
    playerName: p.ref.playerName,
    teamId: p.ref.teamId,
    conference,
    gamesPlayed: p.gp,
    value,
  };
}

function sorted(
  rows: NbaPlayerStatLeaderRow[],
  higherIsBetter: boolean,
  limit: number
): NbaPlayerStatLeaderRow[] {
  return [...rows]
    .sort((a, b) => (higherIsBetter ? b.value - a.value : a.value - b.value))
    .slice(0, limit);
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function averages(input: {
  seasonYear: number;
  category?: string;
  type?: string;
}): Promise<BdlPlayerSeasonAverageRow[]> {
  try {
    return await fetchBdlPlayerSeasonAverages(input);
  } catch {
    return [];
  }
}

export async function buildPlayerStatLeadersBundleFromBdl(input: {
  seasonKey: string;
  seasonYear: number;
}): Promise<NbaPlayerStatLeadersBundle> {
  const season = emptyBoard();
  const [teamMap, teamGamesByTeamId] = await Promise.all([
    fetchBdlActivePlayerTeamMap(),
    fetchTeamGamesByAppTeamId(input.seasonYear),
  ]);

  const baseRows = await averages({ seasonYear: input.seasonYear, type: "base" });
  await sleep(120);
  const advRows = await averages({
    seasonYear: input.seasonYear,
    type: "advanced",
  });
  await sleep(120);
  const scoringRows = await averages({
    seasonYear: input.seasonYear,
    type: "scoring",
  });
  await sleep(120);
  const miscRows = await averages({
    seasonYear: input.seasonYear,
    type: "misc",
  });
  await sleep(120);
  const hustleRows = await averages({
    seasonYear: input.seasonYear,
    category: "hustle",
  });
  await sleep(120);
  const drivesRows = await averages({
    seasonYear: input.seasonYear,
    category: "tracking",
    type: "Drives",
  });
  await sleep(120);
  const catchRows = await averages({
    seasonYear: input.seasonYear,
    category: "tracking",
    type: "CatchShoot",
  });
  await sleep(120);
  const pullRows = await averages({
    seasonYear: input.seasonYear,
    category: "tracking",
    type: "PullUpShot",
  });
  await sleep(120);
  const paintRows = await averages({
    seasonYear: input.seasonYear,
    category: "tracking",
    type: "PaintTouch",
  });
  await sleep(120);
  const speedRows = await averages({
    seasonYear: input.seasonYear,
    category: "tracking",
    type: "SpeedDistance",
  });
  await sleep(120);
  const passingRows = await averages({
    seasonYear: input.seasonYear,
    category: "tracking",
    type: "Passing",
  });
  await sleep(120);
  const clutchBaseRows = await averages({
    seasonYear: input.seasonYear,
    category: "clutch",
    type: "base",
  });
  await sleep(120);
  const clutchAdvRows = await averages({
    seasonYear: input.seasonYear,
    category: "clutch",
    type: "advanced",
  });
  await sleep(120);
  const shootingZoneRows = await averages({
    seasonYear: input.seasonYear,
    category: "shooting",
    type: "by_zone",
  });
  await sleep(120);
  const defOverallRows = await averages({
    seasonYear: input.seasonYear,
    category: "defense",
    type: "overall",
  });
  await sleep(120);
  const def2pRows = await averages({
    seasonYear: input.seasonYear,
    category: "defense",
    type: "2_pointers",
  });
  await sleep(120);
  const def3pRows = await averages({
    seasonYear: input.seasonYear,
    category: "defense",
    type: "3_pointers",
  });
  await sleep(120);
  const defLt6Rows = await averages({
    seasonYear: input.seasonYear,
    category: "defense",
    type: "less_than_6ft",
  });

  const playtypeTypes = [
    "Isolation",
    "PRBallHandler",
    "PRRollman",
    "Spotup",
    "Transition",
    "Cut",
    "Postup",
    "HandOff",
    "OffScreen",
    "OffRebound",
  ] as const;
  const playtypeByType = new Map<string, Map<string, BdlPlayerSeasonAverageRow>>();
  for (const pt of playtypeTypes) {
    await sleep(120);
    playtypeByType.set(
      pt,
      indexRows(
        await averages({
          seasonYear: input.seasonYear,
          category: "playtype",
          type: pt,
        })
      )
    );
  }

  const baseBy = indexRows(baseRows);
  const advBy = indexRows(advRows);
  const scoringBy = indexRows(scoringRows);
  const miscBy = indexRows(miscRows);
  const hustleBy = indexRows(hustleRows);
  const drivesBy = indexRows(drivesRows);
  const catchBy = indexRows(catchRows);
  const pullBy = indexRows(pullRows);
  const paintBy = indexRows(paintRows);
  const speedBy = indexRows(speedRows);
  const passingBy = indexRows(passingRows);
  const clutchBaseBy = indexRows(clutchBaseRows);
  const clutchAdvBy = indexRows(clutchAdvRows);
  const shootingZoneBy = indexRows(shootingZoneRows);
  const defOverallBy = indexRows(defOverallRows);
  const def2pBy = indexRows(def2pRows);
  const def3pBy = indexRows(def3pRows);
  const defLt6By = indexRows(defLt6Rows);

  const merged: MergedPlayer[] = [];
  for (const [playerId, ref] of teamMap) {
    const base = toStats(baseBy.get(playerId));
    const advanced = toStats(advBy.get(playerId));
    if (!Object.keys(base).length && !Object.keys(advanced).length) continue;
    const gp = Math.max(
      0,
      Math.round(n(base, "gp") ?? n(advanced, "gp") ?? 0)
    );
    const teamGames =
      teamGamesByTeamId.get(ref.teamId) ??
      teamGamesOfPlayerWl(Object.keys(base).length ? base : advanced);
    const playtype: Record<string, Record<string, number>> = {};
    for (const [pt, map] of playtypeByType) {
      playtype[pt] = toStats(map.get(playerId));
    }
    merged.push({
      ref,
      gp,
      teamGames,
      base,
      advanced,
      scoring: toStats(scoringBy.get(playerId)),
      misc: toStats(miscBy.get(playerId)),
      hustle: toStats(hustleBy.get(playerId)),
      drives: toStats(drivesBy.get(playerId)),
      catchShoot: toStats(catchBy.get(playerId)),
      pullUp: toStats(pullBy.get(playerId)),
      paintTouch: toStats(paintBy.get(playerId)),
      speed: toStats(speedBy.get(playerId)),
      passing: toStats(passingBy.get(playerId)),
      playtype,
      clutchBase: toStats(clutchBaseBy.get(playerId)),
      clutchAdvanced: toStats(clutchAdvBy.get(playerId)),
      shootingZone: toStats(shootingZoneBy.get(playerId)),
      defOverall: toStats(defOverallBy.get(playerId)),
      def2p: toStats(def2pBy.get(playerId)),
      def3p: toStats(def3pBy.get(playerId)),
      defLt6: toStats(defLt6By.get(playerId)),
    });
  }

  const counting: {
    id: NbaPlayerLeaderBdlStatType;
    higherIsBetter: boolean;
    value: (p: MergedPlayer) => number | null;
  }[] = [
    { id: "pts", higherIsBetter: true, value: (p) => n(p.base, "pts") },
    { id: "reb", higherIsBetter: true, value: (p) => n(p.base, "reb") },
    { id: "ast", higherIsBetter: true, value: (p) => n(p.base, "ast") },
    { id: "oreb", higherIsBetter: true, value: (p) => n(p.base, "oreb") },
    { id: "dreb", higherIsBetter: true, value: (p) => n(p.base, "dreb") },
    { id: "stl", higherIsBetter: true, value: (p) => n(p.base, "stl") },
    { id: "blk", higherIsBetter: true, value: (p) => n(p.base, "blk") },
    { id: "fg3m", higherIsBetter: true, value: (p) => n(p.base, "fg3m") },
    { id: "tov", higherIsBetter: false, value: (p) => n(p.base, "tov") },
    { id: "min", higherIsBetter: true, value: (p) => n(p.base, "min") },
    { id: "fg3a", higherIsBetter: true, value: (p) => n(p.base, "fg3a") },
    { id: "fga", higherIsBetter: true, value: (p) => n(p.base, "fga") },
    { id: "fgm", higherIsBetter: true, value: (p) => n(p.base, "fgm") },
    { id: "fta", higherIsBetter: true, value: (p) => n(p.base, "fta") },
    { id: "ftm", higherIsBetter: true, value: (p) => n(p.base, "ftm") },
  ];

  for (const metric of counting) {
    const rows: NbaPlayerStatLeaderRow[] = [];
    for (const p of merged) {
      if (
        !qualifiesForNonPctLeaders({
          teamGamesPlayed: p.teamGames,
          gamesPlayed: p.gp,
        })
      ) {
        continue;
      }
      const v = metric.value(p);
      if (v == null) continue;
      const row = rowOf(p, v);
      if (row) rows.push(row);
    }
    season[metric.id] = sorted(rows, metric.higherIsBetter, LEADER_BOARD_LIMIT);
  }

  {
    const rows: NbaPlayerStatLeaderRow[] = [];
    for (const p of merged) {
      const fgm =
        n(p.advanced, "fgm") ?? makesTotal(n(p.base, "fgm"), p.gp);
      const pct = n(p.base, "fg_pct") ?? n(p.advanced, "fg_pct");
      if (pct == null) continue;
      if (
        !qualifiesForFgPctLeaders({
          teamGamesPlayed: p.teamGames,
          fieldGoalsMade: fgm,
        })
      ) {
        continue;
      }
      const row = rowOf(p, pct);
      if (row) rows.push(row);
    }
    season.fg_pct = sorted(rows, true, LEADER_BOARD_LIMIT);
  }

  {
    const rows: NbaPlayerStatLeaderRow[] = [];
    for (const p of merged) {
      const ftm = makesTotal(n(p.base, "ftm"), p.gp);
      const pct = n(p.base, "ft_pct");
      if (pct == null) continue;
      if (
        !qualifiesForFtPctLeaders({
          teamGamesPlayed: p.teamGames,
          freeThrowsMade: ftm,
        })
      ) {
        continue;
      }
      const row = rowOf(p, pct);
      if (row) rows.push(row);
    }
    season.ft_pct = sorted(rows, true, LEADER_BOARD_LIMIT);
  }

  {
    const rows: NbaPlayerStatLeaderRow[] = [];
    for (const p of merged) {
      const fg3m = makesTotal(n(p.base, "fg3m"), p.gp);
      const pct = n(p.base, "fg3_pct");
      if (pct == null) continue;
      if (
        !qualifiesForFg3PctLeaders({
          teamGamesPlayed: p.teamGames,
          threesMade: fg3m,
        })
      ) {
        continue;
      }
      const row = rowOf(p, pct);
      if (row) rows.push(row);
    }
    season.fg3_pct = sorted(rows, true, LEADER_BOARD_LIMIT);
  }

  try {
    const effLeaders = await fetchBdlPlayerLeaders({
      seasonYear: input.seasonYear,
      statType: "eff",
    });
    const byId = new Map(merged.map((p) => [p.ref.playerId, p] as const));
    const rows: NbaPlayerStatLeaderRow[] = [];
    for (const r of effLeaders) {
      const p = byId.get(String(r.player.id));
      if (!p) continue;
      const gp = Math.max(p.gp, Math.round(r.games_played ?? 0));
      if (
        !qualifiesForNonPctLeaders({
          teamGamesPlayed: p.teamGames,
          gamesPlayed: gp,
        })
      ) {
        continue;
      }
      const row = rowOf(p, Number(r.value) || 0);
      if (row) rows.push(row);
    }
    season.eff = sorted(rows, true, LEADER_BOARD_LIMIT);
  } catch {
    season.eff = [];
  }

  /**
   * Advanced も BASIC と同じく「全選手 → NBA 出場資格 → 上位 30」。
   * 試投%系（TS% / eFG% / C&S FG% / Pull-up FG%）は FG% と同型の決め本数。
   */
  const fillAdv = (
    metric: NbaPlayerAdvancedLeaderMetric,
    higherIsBetter: boolean,
    pick: (p: MergedPlayer) => number | null,
    opts?: {
      limit?: number;
      /** true: FG% 最低決め本数。それ以外はチーム試合の 70% 出場 */
      shootingPct?: boolean;
    }
  ) => {
    const limit = opts?.limit ?? LEADER_BOARD_LIMIT;
    const shootingPct = opts?.shootingPct === true;
    const rows: NbaPlayerStatLeaderRow[] = [];
    for (const p of merged) {
      if (shootingPct) {
        const fgm =
          n(p.advanced, "fgm") ?? makesTotal(n(p.base, "fgm"), p.gp);
        if (
          fgm == null ||
          !qualifiesForFgPctLeaders({
            teamGamesPlayed: p.teamGames,
            fieldGoalsMade: fgm,
          })
        ) {
          continue;
        }
      } else if (
        !qualifiesForNonPctLeaders({
          teamGamesPlayed: p.teamGames,
          gamesPlayed: p.gp,
        })
      ) {
        continue;
      }
      const v = pick(p);
      if (v == null) continue;
      const row = rowOf(p, v);
      if (row) rows.push(row);
    }
    season[metric] = sorted(rows, higherIsBetter, limit);
  };

  fillAdv("ts_pct", true, (p) => rate(n(p.advanced, "ts_pct")), {
    shootingPct: true,
  });
  fillAdv("usg", true, (p) => rate(n(p.advanced, "usg_pct")));
  fillAdv("pie", true, (p) => rate(n(p.advanced, "pie")));
  fillAdv("ast_pct", true, (p) => rate(n(p.advanced, "ast_pct")));
  fillAdv("reb_pct", true, (p) => rate(n(p.advanced, "reb_pct")));
  fillAdv("ast_to", true, (p) => n(p.advanced, "ast_to"));
  fillAdv("ortg", true, (p) => n(p.advanced, "off_rating", "offensive_rating"));
  fillAdv("drtg", false, (p) => n(p.advanced, "def_rating", "defensive_rating"));
  fillAdv("efg_pct", true, (p) => rate(n(p.advanced, "efg_pct")), {
    shootingPct: true,
  });
  fillAdv("oreb_pct", true, (p) => rate(n(p.advanced, "oreb_pct")));
  fillAdv("tov_pct", false, (p) =>
    rate(n(p.advanced, "tm_tov_pct", "e_tov_pct", "tov_pct"))
  );
  fillAdv("fta_rate", true, (p) => {
    const fta = n(p.base, "fta");
    const fga = n(p.base, "fga");
    if (fta == null || fga == null || fga <= 0) return null;
    return fta / fga;
  });

  fillAdv("pct_pts_3", true, (p) =>
    rate(n(p.scoring, "pct_pts_3pt", "pct_pts_3"))
  );
  fillAdv("pct_pts_paint", true, (p) => rate(n(p.scoring, "pct_pts_paint")));
  fillAdv("pct_pts_mid", true, (p) =>
    rate(n(p.scoring, "pct_pts_2pt_mr", "pct_pts_mid"))
  );
  fillAdv("pct_pts_ft", true, (p) => rate(n(p.scoring, "pct_pts_ft")));
  fillAdv("pct_pts_fb", true, (p) => rate(n(p.scoring, "pct_pts_fb")));
  fillAdv("pct_pts_tov", true, (p) =>
    rate(n(p.scoring, "pct_pts_off_tov", "pct_pts_tov"))
  );

  const ptsShare = (
    metric: NbaPlayerAdvancedLeaderMetric,
    shareKeys: string[],
    miscKey?: string
  ) => {
    fillAdv(metric, true, (p) => {
      if (miscKey) {
        const direct = n(p.misc, miscKey);
        if (direct != null) return direct;
      }
      const share = rate(n(p.scoring, ...shareKeys));
      const pts = n(p.base, "pts");
      if (share == null || pts == null) return null;
      return Math.round(share * pts * 10) / 10;
    });
  };
  ptsShare("pts_3", ["pct_pts_3pt", "pct_pts_3"]);
  ptsShare("pts_paint", ["pct_pts_paint"], "pts_paint");
  ptsShare("pts_mid", ["pct_pts_2pt_mr", "pct_pts_mid"]);
  ptsShare("pts_ft", ["pct_pts_ft"]);
  ptsShare("pts_fb", ["pct_pts_fb"], "pts_fb");
  ptsShare("pts_tov", ["pct_pts_off_tov", "pct_pts_tov"], "pts_off_tov");

  const hustlePg = (
    metric: NbaPlayerAdvancedLeaderMetric,
    ...keys: string[]
  ) => {
    fillAdv(metric, true, (p) => {
      const v = n(p.hustle, ...keys);
      const g = n(p.hustle, "g", "gp") ?? p.gp;
      if (v == null || !g) return null;
      if (v <= 20) return Math.round(v * 10) / 10;
      return Math.round((v / g) * 10) / 10;
    });
  };
  hustlePg("deflections", "deflections");
  hustlePg("charges", "charges_drawn", "charges");
  hustlePg("loose_balls", "loose_balls_recovered", "loose_balls");
  hustlePg("screen_ast", "screen_assists", "screen_ast");
  hustlePg("contested_shots", "contested_shots");

  fillAdv("drives", true, (p) => n(p.drives, "drives"));
  fillAdv("drive_pts", true, (p) => n(p.drives, "drive_pts"));
  fillAdv(
    "cns_fg_pct",
    true,
    (p) => rate(n(p.catchShoot, "catch_shoot_fg_pct")),
    { shootingPct: true }
  );
  fillAdv("cns_pts", true, (p) => n(p.catchShoot, "catch_shoot_pts"));
  fillAdv(
    "pullup_fg_pct",
    true,
    (p) => rate(n(p.pullUp, "pull_up_fg_pct")),
    { shootingPct: true }
  );
  fillAdv("pullup_pts", true, (p) => n(p.pullUp, "pull_up_pts"));
  fillAdv("paint_touches", true, (p) => n(p.paintTouch, "paint_touches"));
  fillAdv("paint_touch_pts", true, (p) => n(p.paintTouch, "paint_touch_pts"));
  fillAdv("speed", true, (p) => n(p.speed, "avg_speed", "avg_speed_off"));
  fillAdv("passes", true, (p) => n(p.passing, "passes_made", "passes"));

  const playtype = (
    ppp: NbaPlayerAdvancedLeaderMetric,
    pts: NbaPlayerAdvancedLeaderMetric,
    typeKey: string
  ) => {
    fillAdv(ppp, true, (p) => n(p.playtype[typeKey] ?? {}, "ppp"));
    fillAdv(pts, true, (p) => {
      const bag = p.playtype[typeKey] ?? {};
      const points = n(bag, "pts");
      const gp = n(bag, "gp") ?? p.gp;
      if (points == null || !gp) return null;
      return points > 40 ? Math.round((points / gp) * 10) / 10 : points;
    });
  };
  playtype("iso_ppp", "iso_pts", "Isolation");
  playtype("pnr_bh_ppp", "pnr_bh_pts", "PRBallHandler");
  playtype("pnr_roll_ppp", "pnr_roll_pts", "PRRollman");
  playtype("spotup_ppp", "spotup_pts", "Spotup");
  playtype("trans_ppp", "trans_pts", "Transition");
  playtype("cut_ppp", "cut_pts", "Cut");
  playtype("post_ppp", "post_pts", "Postup");
  playtype("handoff_ppp", "handoff_pts", "HandOff");
  playtype("offscreen_ppp", "offscreen_pts", "OffScreen");
  playtype("oreb_ppp", "oreb_pts", "OffRebound");

  // PER: BDL に無いので box から近似 → リーグ平均 15 に正規化
  {
    const raws: { p: MergedPlayer; raw: number }[] = [];
    for (const p of merged) {
      if (
        !qualifiesForNonPctLeaders({
          teamGamesPlayed: p.teamGames,
          gamesPlayed: p.gp,
        })
      ) {
        continue;
      }
      const min = n(p.base, "min");
      if (min == null || min < 5) continue;
      const stl = n(p.base, "stl") ?? 0;
      const blk = n(p.base, "blk") ?? 0;
      const tov = n(p.base, "tov") ?? 0;
      const fgm = n(p.base, "fgm") ?? 0;
      const fga = n(p.base, "fga") ?? 0;
      const ftm = n(p.base, "ftm") ?? 0;
      const fta = n(p.base, "fta") ?? 0;
      const fg3m = n(p.base, "fg3m") ?? 0;
      const oreb = n(p.base, "oreb") ?? 0;
      const dreb = n(p.base, "dreb") ?? 0;
      const ast = n(p.base, "ast") ?? 0;
      const pf = n(p.base, "pf", "personal_fouls") ?? 0;
      const raw =
        (fgm * 85.91 +
          stl * 53.897 +
          fg3m * 51.757 +
          ftm * 46.845 +
          blk * 39.19 +
          oreb * 39.19 +
          ast * 34.677 +
          dreb * 14.707 -
          pf * 17.174 -
          (fta - ftm) * 20.091 -
          (fga - fgm) * 39.19 -
          tov * 53.897) /
        min;
      if (!Number.isFinite(raw)) continue;
      raws.push({ p, raw });
    }
    const mean =
      raws.length > 0
        ? raws.reduce((s, x) => s + x.raw, 0) / raws.length
        : 0;
    const scale = mean > 0 ? 15 / mean : 1;
    const rows: NbaPlayerStatLeaderRow[] = [];
    for (const { p, raw } of raws) {
      const row = rowOf(p, Math.round(raw * scale * 10) / 10);
      if (row) rows.push(row);
    }
    season.per = sorted(rows, true, LEADER_BOARD_LIMIT);
  }

  fillAdv("clutch_pts", true, (p) => n(p.clutchBase, "pts"));
  fillAdv("clutch_fg_pct", true, (p) => rate(n(p.clutchBase, "fg_pct")), {
    shootingPct: true,
  });
  fillAdv("clutch_usg", true, (p) =>
    rate(n(p.clutchAdvanced, "usg_pct", "usage_percentage"))
  );

  // RIM% / C3%: ゾーン試投で絞る（全体 FG/3P 決め本数はゾーンに厳しすぎる）
  {
    const rows: NbaPlayerStatLeaderRow[] = [];
    for (const p of merged) {
      if (
        !qualifiesForNonPctLeaders({
          teamGamesPlayed: p.teamGames,
          gamesPlayed: p.gp,
        })
      ) {
        continue;
      }
      const fgaPg = n(
        p.shootingZone,
        "restricted_area_fga",
        "restricted_fga"
      );
      const fga = makesTotal(fgaPg, p.gp);
      const need = Math.ceil((50 * Math.min(82, Math.max(0, p.teamGames))) / 82);
      if (fga < need) continue;
      const pct = rate(
        n(p.shootingZone, "restricted_area_fg_pct", "restricted_fg_pct")
      );
      if (pct == null) continue;
      const row = rowOf(p, pct);
      if (row) rows.push(row);
    }
    season.restricted_fg_pct = sorted(rows, true, LEADER_BOARD_LIMIT);
  }
  fillAdv("restricted_pts", true, (p) => {
    const fgm = n(
      p.shootingZone,
      "restricted_area_fgm",
      "restricted_fgm"
    );
    return fgm == null ? null : Math.round(fgm * 2 * 10) / 10;
  });
  {
    const rows: NbaPlayerStatLeaderRow[] = [];
    for (const p of merged) {
      if (
        !qualifiesForNonPctLeaders({
          teamGamesPlayed: p.teamGames,
          gamesPlayed: p.gp,
        })
      ) {
        continue;
      }
      const fgaPg = n(p.shootingZone, "corner_3_fga", "corner3_fga");
      const fga = makesTotal(fgaPg, p.gp);
      const need = Math.ceil((25 * Math.min(82, Math.max(0, p.teamGames))) / 82);
      if (fga < need) continue;
      const pct = rate(
        n(p.shootingZone, "corner_3_fg_pct", "corner3_fg_pct")
      );
      if (pct == null) continue;
      const row = rowOf(p, pct);
      if (row) rows.push(row);
    }
    season.corner3_pct = sorted(rows, true, LEADER_BOARD_LIMIT);
  }
  fillAdv("corner3_pts", true, (p) => {
    const fgm = n(p.shootingZone, "corner_3_fgm", "corner3_fgm");
    return fgm == null ? null : Math.round(fgm * 3 * 10) / 10;
  });

  // 守備%は低いほど良い
  fillAdv("matchup_fg_pct", false, (p) =>
    rate(n(p.defOverall, "d_fg_pct", "def_fg_pct", "fg_pct"))
  );
  fillAdv("matchup_3pt_pct", false, (p) =>
    rate(n(p.def3p, "fg3_pct", "d_fg3_pct", "fg_pct"))
  );
  fillAdv("opp_2p_pct", false, (p) =>
    rate(n(p.def2p, "fg2_pct", "d_fg2_pct", "fg_pct"))
  );
  fillAdv("opp_3p_pct", false, (p) =>
    rate(n(p.def3p, "fg3_pct", "d_fg3_pct", "fg_pct"))
  );
  fillAdv("opp_lt6_pct", false, (p) =>
    rate(n(p.defLt6, "lt_06_pct", "lt_6_pct", "fg_pct", "d_fg_pct"))
  );

  return {
    season,
    last10: emptyBoard(),
    asOfLabel: `BDL · ${input.seasonKey} · NBA mins · season (last10 pending)`,
  };
}
