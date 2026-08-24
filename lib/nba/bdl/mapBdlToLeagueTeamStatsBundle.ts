import {
  fetchBdlTeamSeasonAverages,
  type BdlTeamSeasonAverageRow,
} from "@/lib/nba/bdl/fetchBdlTeamSeasonAverages";
import {
  BDL_TEAM_PLAYTYPE_TYPES,
  BDL_TEAM_TRACKING_TYPES,
  mapBdlTeamAdvancedFields,
  type BdlTeamTrackingType,
} from "@/lib/nba/bdl/mapBdlTeamAdvancedFields";
import { appTeamIdFromBdlAbbreviation } from "@/lib/nba/bdl/bdlNbaTeamIdMap";
import { nbaConferenceForTeam } from "@/lib/nba/nbaConferenceTeams";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import type {
  NbaLeagueTeamStatCoreRow,
  NbaLeagueTeamStatRow,
  NbaLeagueTeamStatsBundle,
} from "@/lib/predict/nbaLeagueTeamStatsMocks";

function num(
  stats: Record<string, number | string | null | undefined>,
  ...keys: string[]
): number | null {
  for (const k of keys) {
    const v = stats[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function indexByAppTeamId(
  rows: BdlTeamSeasonAverageRow[]
): Map<string, BdlTeamSeasonAverageRow> {
  const map = new Map<string, BdlTeamSeasonAverageRow>();
  for (const row of rows) {
    const id = appTeamIdFromBdlAbbreviation(row.team?.abbreviation);
    if (!id) continue;
    map.set(id, row);
  }
  return map;
}

function buildRow(
  teamId: string,
  base: BdlTeamSeasonAverageRow | undefined,
  advanced: BdlTeamSeasonAverageRow | undefined,
  opponent: BdlTeamSeasonAverageRow | undefined,
  scoring: BdlTeamSeasonAverageRow | undefined,
  hustle: BdlTeamSeasonAverageRow | undefined,
  trackingByType: Partial<
    Record<BdlTeamTrackingType, BdlTeamSeasonAverageRow | undefined>
  >,
  clutchBase: BdlTeamSeasonAverageRow | undefined,
  clutchAdvanced: BdlTeamSeasonAverageRow | undefined,
  playtypeByType: Record<string, BdlTeamSeasonAverageRow | undefined>
): NbaLeagueTeamStatRow | null {
  if (!base?.stats) return null;
  const s = base.stats;
  const a = advanced?.stats ?? {};
  const o = opponent?.stats ?? {};

  const wins = Math.round(num(s, "w", "wins") ?? 0);
  const losses = Math.round(num(s, "l", "losses") ?? 0);
  const winPct =
    num(s, "w_pct", "win_pct") ??
    (wins + losses > 0 ? wins / (wins + losses) : 0);
  const ppg = num(s, "pts", "ppg") ?? 0;
  const papg =
    num(o, "opp_pts", "pts", "ppg") ??
    num(s, "opp_pts") ??
    ppg - (num(s, "plus_minus") ?? 0);
  const diff = num(s, "plus_minus") ?? ppg - papg;
  const ortg = num(a, "off_rating", "offensive_rating", "ortg") ?? ppg * 1.05;
  const drtg = num(a, "def_rating", "defensive_rating", "drtg") ?? papg * 1.05;
  const netrtg = num(a, "net_rating", "netrtg") ?? ortg - drtg;
  const pace = num(a, "pace") ?? 100;
  const efgPct =
    num(a, "e_fg_pct", "efg_pct") ??
    (() => {
      const fgm = num(s, "fgm") ?? 0;
      const fg3m = num(s, "fg3m") ?? 0;
      const fga = num(s, "fga") ?? 0;
      return fga > 0 ? (fgm + 0.5 * fg3m) / fga : 0;
    })();
  const fg3Pct = num(s, "fg3_pct", "fg3Pct") ?? 0;
  const fg3a = num(s, "fg3a") ?? 0;
  const tovPct =
    num(a, "tm_tov_pct", "tov_pct", "turnover_pct") ??
    (() => {
      const tov = num(s, "tov") ?? 0;
      const fga = num(s, "fga") ?? 0;
      const fta = num(s, "fta") ?? 0;
      const den = fga + 0.44 * fta + tov;
      return den > 0 ? tov / den : 0;
    })();

  const oppFgPct = num(o, "opp_fg_pct", "fg_pct", "fgPct") ?? 0;
  const oppFg3Pct = num(o, "opp_fg3_pct", "fg3_pct", "fg3Pct") ?? 0;
  const oppFtPct = num(o, "opp_ft_pct", "ft_pct", "ftPct") ?? 0;
  const oppReb = num(o, "opp_reb", "reb") ?? 0;
  const oppAst = num(o, "opp_ast", "ast") ?? 0;
  const oppTov = num(o, "opp_tov", "tov") ?? 0;
  const oppOreb = num(o, "opp_oreb", "oreb") ?? 0;
  const oppEfgPct =
    num(o, "opp_efg_pct", "e_fg_pct", "efg_pct") ??
    (() => {
      const fgm = num(o, "opp_fgm", "fgm") ?? 0;
      const fg3m = num(o, "opp_fg3m", "fg3m") ?? 0;
      const fga = num(o, "opp_fga", "fga") ?? 0;
      return fga > 0 ? (fgm + 0.5 * fg3m) / fga : 0;
    })();

  const conference = nbaConferenceForTeam(teamId);
  if (!conference) return null;

  const core: NbaLeagueTeamStatCoreRow = {
    teamId,
    teamName: NBA_TEAM_NAME_BY_ID[teamId] ?? teamId,
    conference,
    wins,
    losses,
    winPct: round3(winPct),
    ppg: round1(ppg),
    papg: round1(papg),
    diff: round1(diff),
    ortg: round1(ortg),
    drtg: round1(drtg),
    netrtg: round1(netrtg),
    pace: round1(pace),
    efgPct: round3(efgPct),
    fg3Pct: round3(fg3Pct),
    fg3a: round1(fg3a),
    tovPct: round3(tovPct),
    oppFgPct: round3(oppFgPct),
    oppFg3Pct: round3(oppFg3Pct),
    oppFtPct: round3(oppFtPct),
    oppReb: round1(oppReb),
    oppAst: round1(oppAst),
    oppTov: round1(oppTov),
    oppOreb: round1(oppOreb),
    oppEfgPct: round3(oppEfgPct),
  };

  const advancedFields = mapBdlTeamAdvancedFields({
    base,
    advanced,
    opponent,
    scoring,
    hustle,
    trackingByType,
    clutchBase,
    clutchAdvanced,
    playtypeByType,
    pace,
    ppg,
  });

  return { ...core, ...advancedFields };
}

/**
 * BDL team season averages → リーグ Team Stats bundle。
 * last10 は BDL に専用口がないため空（あとで試合集計）。
 *
 * HOW THEY PLAY 用に scoring / hustle / tracking も取得する。
 * team shooting/by_zone は BDL 400 のため rimFgPct / corner3Pct は未配線。
 */
export async function buildLeagueTeamStatsBundleFromBdl(input: {
  seasonKey: string;
  seasonYear: number;
}): Promise<NbaLeagueTeamStatsBundle> {
  const playtypeFetches = BDL_TEAM_PLAYTYPE_TYPES.map((type) =>
    fetchBdlTeamSeasonAverages({
      seasonYear: input.seasonYear,
      category: "playtype",
      type,
    }).then((rows) => ["playtype", type, indexByAppTeamId(rows)] as const)
  );

  const trackingFetches = BDL_TEAM_TRACKING_TYPES.map((type) =>
    fetchBdlTeamSeasonAverages({
      seasonYear: input.seasonYear,
      category: "tracking",
      type,
    }).then((rows) => ["tracking", type, indexByAppTeamId(rows)] as const)
  );

  const [
    baseRows,
    advancedRows,
    opponentRows,
    scoringRows,
    hustleRows,
    clutchBaseRows,
    clutchAdvancedRows,
    ...rest
  ] = await Promise.all([
    fetchBdlTeamSeasonAverages({
      seasonYear: input.seasonYear,
      type: "base",
    }),
    fetchBdlTeamSeasonAverages({
      seasonYear: input.seasonYear,
      type: "advanced",
    }),
    fetchBdlTeamSeasonAverages({
      seasonYear: input.seasonYear,
      type: "opponent",
    }),
    fetchBdlTeamSeasonAverages({
      seasonYear: input.seasonYear,
      type: "scoring",
    }),
    fetchBdlTeamSeasonAverages({
      seasonYear: input.seasonYear,
      category: "hustle",
      type: "base",
    }),
    fetchBdlTeamSeasonAverages({
      seasonYear: input.seasonYear,
      category: "clutch",
      type: "base",
    }),
    fetchBdlTeamSeasonAverages({
      seasonYear: input.seasonYear,
      category: "clutch",
      type: "advanced",
    }),
    ...playtypeFetches,
    ...trackingFetches,
  ]);

  const playtypeIndexed = rest.filter((r) => r[0] === "playtype") as Array<
    ["playtype", string, Map<string, BdlTeamSeasonAverageRow>]
  >;
  const trackingIndexed = rest.filter((r) => r[0] === "tracking") as Array<
    ["tracking", BdlTeamTrackingType, Map<string, BdlTeamSeasonAverageRow>]
  >;

  const baseMap = indexByAppTeamId(baseRows);
  const advMap = indexByAppTeamId(advancedRows);
  const oppMap = indexByAppTeamId(opponentRows);
  const scoringMap = indexByAppTeamId(scoringRows);
  const hustleMap = indexByAppTeamId(hustleRows);
  const clutchBaseMap = indexByAppTeamId(clutchBaseRows);
  const clutchAdvMap = indexByAppTeamId(clutchAdvancedRows);
  const playtypeMaps = new Map(
    playtypeIndexed.map(([, type, map]) => [type, map])
  );
  const trackingMaps = new Map(
    trackingIndexed.map(([, type, map]) => [type, map])
  );

  const season: NbaLeagueTeamStatRow[] = [];
  for (const teamId of baseMap.keys()) {
    const playtypeByType: Record<string, BdlTeamSeasonAverageRow | undefined> =
      {};
    for (const type of BDL_TEAM_PLAYTYPE_TYPES) {
      playtypeByType[type] = playtypeMaps.get(type)?.get(teamId);
    }
    const trackingByType: Partial<
      Record<BdlTeamTrackingType, BdlTeamSeasonAverageRow | undefined>
    > = {};
    for (const type of BDL_TEAM_TRACKING_TYPES) {
      trackingByType[type] = trackingMaps.get(type)?.get(teamId);
    }

    const row = buildRow(
      teamId,
      baseMap.get(teamId),
      advMap.get(teamId),
      oppMap.get(teamId),
      scoringMap.get(teamId),
      hustleMap.get(teamId),
      trackingByType,
      clutchBaseMap.get(teamId),
      clutchAdvMap.get(teamId),
      playtypeByType
    );
    if (row) season.push(row);
  }

  season.sort((a, b) => b.netrtg - a.netrtg);

  return {
    season,
    last10: [],
    asOfLabel: `BDL · ${input.seasonKey} · season (last10 pending)`,
  };
}
