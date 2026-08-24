import type { BdlTeamSeasonAverageRow } from "@/lib/nba/bdl/fetchBdlTeamSeasonAverages";
import {
  NBA_LEAGUE_TEAM_ADVANCED_METRIC_DEFS,
  type NbaLeagueTeamAdvancedFields,
  type NbaLeagueTeamAdvancedMetric,
} from "@/lib/predict/nbaLeagueTeamStatsAdvanced";

function num(
  stats: Record<string, number | string | null | undefined> | undefined,
  ...keys: string[]
): number | null {
  if (!stats) return null;
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

function ppp(n: number): number {
  return Math.round(n * 100) / 100;
}

/** 0–100 / 0–1 どちらでも 0–1 に正規化 */
function rate(v: number | null): number | null {
  if (v == null || !Number.isFinite(v)) return null;
  if (v > 1 && v <= 100) return round3(v / 100);
  return round3(v);
}

function set(
  out: NbaLeagueTeamAdvancedFields,
  key: NbaLeagueTeamAdvancedMetric,
  value: number | null
): void {
  if (value == null || !Number.isFinite(value)) return;
  out[key] = value;
}

export function zeroBdlTeamAdvancedFields(): NbaLeagueTeamAdvancedFields {
  const out = {} as NbaLeagueTeamAdvancedFields;
  for (const d of NBA_LEAGUE_TEAM_ADVANCED_METRIC_DEFS) {
    out[d.id] = 0;
  }
  return out;
}

const PLAYTYPE_DEFS: ReadonlyArray<{
  bdlType: string;
  ppp: NbaLeagueTeamAdvancedMetric;
  freq: NbaLeagueTeamAdvancedMetric;
  pts: NbaLeagueTeamAdvancedMetric;
}> = [
  { bdlType: "isolation", ppp: "isoPpp", freq: "isoFreq", pts: "isoPts" },
  {
    bdlType: "prballhandler",
    ppp: "pnrBhPpp",
    freq: "pnrBhFreq",
    pts: "pnrBhPts",
  },
  {
    bdlType: "prrollman",
    ppp: "pnrRollPpp",
    freq: "pnrRollFreq",
    pts: "pnrRollPts",
  },
  { bdlType: "spotup", ppp: "spotupPpp", freq: "spotupFreq", pts: "spotupPts" },
  {
    bdlType: "transition",
    ppp: "transPpp",
    freq: "transFreq",
    pts: "transPts",
  },
  { bdlType: "cut", ppp: "cutPpp", freq: "cutFreq", pts: "cutPts" },
  { bdlType: "postup", ppp: "postPpp", freq: "postFreq", pts: "postPts" },
];

/** bundle / 既存 import 互換 */
export const BDL_TEAM_PLAYTYPE_TYPES = PLAYTYPE_DEFS.map((d) => d.bdlType);

/** BDL team tracking `type`（実測で 200 を返すもの） */
export const BDL_TEAM_TRACKING_TYPES = [
  "Drives",
  "CatchShoot",
  "PullUpShot",
  "PaintTouch",
  "SpeedDistance",
  "Passing",
] as const;

export type BdlTeamTrackingType = (typeof BDL_TEAM_TRACKING_TYPES)[number];

/**
 * BDL team season averages → リーグ Team Stats advanced。
 *
 * 取る: base / advanced / opponent / scoring / hustle / tracking / clutch / playtype
 * 取らない: team shooting/by_zone（BDL 400）→ rimFgPct / corner3Pct は 0 のまま
 */
export function mapBdlTeamAdvancedFields(input: {
  base?: BdlTeamSeasonAverageRow;
  advanced?: BdlTeamSeasonAverageRow;
  opponent?: BdlTeamSeasonAverageRow;
  scoring?: BdlTeamSeasonAverageRow;
  hustle?: BdlTeamSeasonAverageRow;
  trackingByType?: Partial<
    Record<BdlTeamTrackingType, BdlTeamSeasonAverageRow | undefined>
  >;
  clutchBase?: BdlTeamSeasonAverageRow;
  clutchAdvanced?: BdlTeamSeasonAverageRow;
  playtypeByType: Record<string, BdlTeamSeasonAverageRow | undefined>;
  pace: number;
  ppg?: number;
}): NbaLeagueTeamAdvancedFields {
  const out = zeroBdlTeamAdvancedFields();
  const pace = input.pace > 0 ? input.pace : 100;
  const ppg = input.ppg ?? num(input.base?.stats, "pts", "ppg") ?? 0;

  const s = input.base?.stats ?? {};
  const a = input.advanced?.stats ?? {};
  const o = input.opponent?.stats ?? {};
  const sc = input.scoring?.stats ?? {};
  const h = input.hustle?.stats ?? {};
  const tr = input.trackingByType ?? {};

  // --- basic / four factors ---
  set(out, "fgPct", rate(num(s, "fg_pct")));
  set(out, "ftPct", rate(num(s, "ft_pct")));
  set(out, "tsPct", rate(num(a, "ts_pct")));

  const fga = num(s, "fga");
  const fta = num(s, "fta");
  set(
    out,
    "ftaRate",
    rate(num(a, "ft_rate", "fta_rate")) ??
      (fga != null && fga > 0 && fta != null ? round3(fta / fga) : null)
  );
  set(out, "orebPct", rate(num(a, "oreb_pct")));

  const oppFgm = num(o, "opp_fgm", "fgm");
  const oppFg3m = num(o, "opp_fg3m", "fg3m");
  const oppFga = num(o, "opp_fga", "fga");
  const oppFta = num(o, "opp_fta", "fta");
  const oppTov = num(o, "opp_tov", "tov");

  set(
    out,
    "oppEfgPct",
    rate(num(o, "opp_efg_pct", "e_fg_pct", "efg_pct")) ??
      (oppFga != null && oppFga > 0
        ? round3(((oppFgm ?? 0) + 0.5 * (oppFg3m ?? 0)) / oppFga)
        : null)
  );

  set(
    out,
    "oppTovPct",
    rate(num(o, "opp_tov_pct", "tm_tov_pct", "tov_pct")) ??
      (oppFga != null && oppTov != null
        ? (() => {
            const den = oppFga + 0.44 * (oppFta ?? 0) + oppTov;
            return den > 0 ? round3(oppTov / den) : null;
          })()
        : null)
  );

  set(
    out,
    "oppFtaRate",
    rate(num(o, "opp_ft_rate", "opp_fta_rate")) ??
      (oppFga != null && oppFga > 0 && oppFta != null
        ? round3(oppFta / oppFga)
        : null)
  );

  // 定義: opp OREB% ≈ 1 − 自 DREB%
  const drebPct = rate(num(a, "dreb_pct"));
  set(
    out,
    "oppOrebPct",
    rate(num(o, "opp_oreb_pct", "oreb_pct")) ??
      (drebPct != null ? round3(Math.max(0, Math.min(1, 1 - drebPct))) : null)
  );

  // --- scoring ---
  const pct3 = rate(num(sc, "pct_pts_3pt", "pct_pts_3"));
  const pctPaint = rate(num(sc, "pct_pts_paint"));
  const pctFt = rate(num(sc, "pct_pts_ft"));
  const pctFb = rate(num(sc, "pct_pts_fb"));
  const pctTov = rate(num(sc, "pct_pts_off_tov", "pct_pts_tov"));
  set(out, "pctPts3", pct3);
  set(out, "pctPtsPaint", pctPaint);
  set(out, "pctPtsFt", pctFt);
  set(out, "pctPtsFb", pctFb);
  set(out, "pctPtsTov", pctTov);
  if (ppg > 0) {
    if (pct3 != null) set(out, "pts3", round1(ppg * pct3));
    if (pctPaint != null) set(out, "ptsPaint", round1(ppg * pctPaint));
    if (pctFt != null) set(out, "ptsFt", round1(ppg * pctFt));
    if (pctFb != null) set(out, "ptsFb", round1(ppg * pctFb));
    if (pctTov != null) set(out, "ptsTov", round1(ppg * pctTov));
  }

  // --- defense allowed ---
  set(out, "fgPctAllowed", rate(num(o, "opp_fg_pct", "fg_pct")));
  set(out, "fg3PctAllowed", rate(num(o, "opp_fg3_pct", "fg3_pct")));
  const rebAllowed = num(o, "opp_reb", "reb");
  const astAllowed = num(o, "opp_ast", "ast");
  if (rebAllowed != null) set(out, "rebAllowed", round1(rebAllowed));
  if (astAllowed != null) set(out, "astAllowed", round1(astAllowed));
  if (oppTov != null) set(out, "tovForced", round1(oppTov));

  // --- clutch ---
  const ca = input.clutchAdvanced?.stats ?? {};
  const cb = input.clutchBase?.stats ?? {};
  const clutchOrtg = num(ca, "off_rating", "offensive_rating", "ortg");
  const clutchDrtg = num(ca, "def_rating", "defensive_rating", "drtg");
  const clutchNet =
    num(ca, "net_rating", "netrtg") ??
    (clutchOrtg != null && clutchDrtg != null ? clutchOrtg - clutchDrtg : null);
  set(out, "clutchNet", clutchNet != null ? round1(clutchNet) : null);
  set(out, "clutchOrtg", clutchOrtg != null ? round1(clutchOrtg) : null);
  set(out, "clutchDrtg", clutchDrtg != null ? round1(clutchDrtg) : null);
  set(
    out,
    "clutchEfg",
    rate(
      num(ca, "e_fg_pct", "efg_pct") ?? num(cb, "e_fg_pct", "efg_pct", "fg_pct")
    )
  );

  // --- playtype ---
  for (const def of PLAYTYPE_DEFS) {
    const row = input.playtypeByType[def.bdlType];
    const ps = row?.stats ?? {};
    const pppVal = num(ps, "ppp");
    const freqVal = rate(num(ps, "freq", "poss_pct", "pct", "frequency"));
    set(out, def.ppp, pppVal != null ? ppp(pppVal) : null);
    set(out, def.freq, freqVal);

    const ptsRaw = num(ps, "pts");
    const gp = num(ps, "gp", "games", "games_played") ?? 0;
    if (ptsRaw != null) {
      set(out, def.pts, round1(ptsRaw > 40 && gp > 0 ? ptsRaw / gp : ptsRaw));
    } else if (pppVal != null && freqVal != null) {
      set(out, def.pts, round1(ppp(pppVal) * pace * freqVal));
    }
  }

  // --- hustle ---
  const deflections = num(h, "deflections");
  const charges = num(h, "charges_drawn", "charges");
  const loose = num(h, "loose_balls_recovered", "loose_balls");
  const screenAst = num(h, "screen_assists", "screen_ast");
  const contested = num(h, "contested_shots");
  if (deflections != null) set(out, "deflections", round1(deflections));
  if (charges != null) set(out, "charges", round1(charges));
  if (loose != null) set(out, "looseBalls", round1(loose));
  if (screenAst != null) set(out, "screenAst", round1(screenAst));
  if (contested != null) set(out, "contestedShots", round1(contested));

  // --- tracking ---
  const drives = tr.Drives?.stats ?? {};
  const drivesN = num(drives, "drives");
  const drivePts = num(drives, "drive_pts");
  if (drivesN != null) set(out, "drives", round1(drivesN));
  if (drivePts != null) set(out, "drivePts", round1(drivePts));

  const cns = tr.CatchShoot?.stats ?? {};
  set(
    out,
    "cnsFgPct",
    rate(num(cns, "catch_shoot_fg_pct", "catch_shoot_efg_pct"))
  );
  const cnsPts = num(cns, "catch_shoot_pts");
  if (cnsPts != null) set(out, "cnsPts", round1(cnsPts));

  const pull = tr.PullUpShot?.stats ?? {};
  set(
    out,
    "pullupFgPct",
    rate(num(pull, "pull_up_fg_pct", "pull_up_efg_pct"))
  );
  const pullPts = num(pull, "pull_up_pts");
  if (pullPts != null) set(out, "pullupPts", round1(pullPts));

  const paint = tr.PaintTouch?.stats ?? {};
  const paintTouches = num(paint, "paint_touches");
  const paintTouchPts = num(paint, "paint_touch_pts");
  if (paintTouches != null) set(out, "paintTouches", round1(paintTouches));
  if (paintTouchPts != null) set(out, "paintTouchPts", round1(paintTouchPts));

  const speed = tr.SpeedDistance?.stats ?? {};
  const avgSpeed = num(speed, "avg_speed", "avg_speed_off");
  if (avgSpeed != null) set(out, "speed", round1(avgSpeed));

  const passing = tr.Passing?.stats ?? {};
  const passes = num(passing, "passes_made", "passes");
  if (passes != null) set(out, "passes", round1(passes));

  return out;
}
