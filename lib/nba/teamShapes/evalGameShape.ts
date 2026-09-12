/**
 * 1 試合・1 チーム視点で shape が発火するか。
 */
import { estimatePossessions } from "@/lib/nba/leagueTeamStats/buildLast10RowsFromGames";
import {
  TEAM_SHAPE_DEFS,
  TEAM_SHAPE_THRESHOLDS,
  type TeamShapeId,
} from "@/lib/nba/teamShapes/shapeDefs";

export type TeamBoxTotals = {
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  tov: number;
};

/** 相対条件用（リーグ表シーズン行から） */
export type TeamShapeSeasonRates = {
  ortg: number;
  papg: number;
};

export type TeamGameShapeInput = {
  ptsFor: number;
  ptsAgainst: number;
  /** box 合計。無ければ needsBox shape は発火しない */
  box: TeamBoxTotals | null;
  oppBox: TeamBoxTotals | null;
  /** 自チームのシーズン平均（相対型） */
  selfSeason?: TeamShapeSeasonRates | null;
  /** 相手チームのシーズン平均（相対型） */
  oppSeason?: TeamShapeSeasonRates | null;
};

function parseMakesAttempts(raw: unknown): { m: number; a: number } | null {
  if (typeof raw !== "string") return null;
  const m = raw.trim().match(/^(\d+)\s*-\s*(\d+)$/);
  if (!m) return null;
  const made = Number(m[1]);
  const att = Number(m[2]);
  if (!Number.isFinite(made) || !Number.isFinite(att) || att < 0) return null;
  return { m: made, a: att };
}

function numField(p: Record<string, unknown>, key: string): number {
  const v = p[key];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/** liveStats.box 片側プレイヤー配列 → チーム合計。ショット行が無ければ null */
export function sumBoxPlayers(
  players: ReadonlyArray<Record<string, unknown>> | undefined | null
): TeamBoxTotals | null {
  if (!Array.isArray(players) || players.length === 0) return null;
  let fgm = 0;
  let fga = 0;
  let fg3m = 0;
  let fg3a = 0;
  let ftm = 0;
  let fta = 0;
  let oreb = 0;
  let dreb = 0;
  let reb = 0;
  let ast = 0;
  let tov = 0;
  let hasShot = false;
  for (const p of players) {
    const fg = parseMakesAttempts(p.fg);
    const fg3 = parseMakesAttempts(p.fg3);
    const ft = parseMakesAttempts(p.ft);
    if (fg) {
      fgm += fg.m;
      fga += fg.a;
      if (fg.a > 0) hasShot = true;
    }
    if (fg3) {
      fg3m += fg3.m;
      fg3a += fg3.a;
      if (fg3.a > 0) hasShot = true;
    }
    if (ft) {
      ftm += ft.m;
      fta += ft.a;
      if (ft.a > 0) hasShot = true;
    }
    oreb += numField(p, "oreb");
    dreb += numField(p, "dreb");
    reb += numField(p, "reb");
    ast += numField(p, "ast");
    tov += numField(p, "tov");
  }
  if (!hasShot) return null;
  // oreb/dreb が無く reb だけの古い box は効率系が弱いが、V1 は動かす
  if (oreb === 0 && dreb === 0 && reb > 0) {
    // 分割不明 → oreb=0 のまま（poss はやや過大になり得る）
  }
  return { fgm, fga, fg3m, fg3a, ftm, fta, oreb, dreb, reb, ast, tov };
}

export function estimateTeamPossessions(box: TeamBoxTotals): number {
  return estimatePossessions({
    fga: box.fga,
    fta: box.fta,
    oreb: box.oreb,
    tov: box.tov,
  });
}

/** 100 possessions あたり得点。poss 不正なら null */
export function estimateOrtg(pts: number, box: TeamBoxTotals): number | null {
  const poss = estimateTeamPossessions(box);
  if (poss < TEAM_SHAPE_THRESHOLDS.minPoss) return null;
  return (pts / poss) * 100;
}

export function estimateEfgPct(box: TeamBoxTotals): number | null {
  if (box.fga <= 0) return null;
  return (box.fgm + 0.5 * box.fg3m) / box.fga;
}

/** DREB% = DREB / (DREB + opp OREB) */
export function estimateDrebPct(
  box: TeamBoxTotals,
  oppBox: TeamBoxTotals
): number | null {
  const den = box.dreb + oppBox.oreb;
  if (den <= 0) return null;
  return box.dreb / den;
}

function seasonOk(r: TeamShapeSeasonRates | null | undefined): boolean {
  return (
    !!r &&
    typeof r.ortg === "number" &&
    r.ortg >= 80 &&
    typeof r.papg === "number" &&
    r.papg >= 80
  );
}

function fires(id: TeamShapeId, g: TeamGameShapeInput): boolean {
  const margin = g.ptsFor - g.ptsAgainst;
  const total = g.ptsFor + g.ptsAgainst;
  const T = TEAM_SHAPE_THRESHOLDS;
  const selfOrtg =
    g.box != null ? estimateOrtg(g.ptsFor, g.box) : null;
  const oppOrtg =
    g.oppBox != null ? estimateOrtg(g.ptsAgainst, g.oppBox) : null;
  const oppEfg = g.oppBox != null ? estimateEfgPct(g.oppBox) : null;
  const drebPct =
    g.box != null && g.oppBox != null
      ? estimateDrebPct(g.box, g.oppBox)
      : null;

  switch (id) {
    case "reb_margin_plus5":
      return (
        g.box != null &&
        g.oppBox != null &&
        g.box.reb - g.oppBox.reb >= 5
      );
    case "fg3m_15":
      return g.box != null && g.box.fg3m >= 15;
    case "fta_25":
      return g.box != null && g.box.fta >= 25;
    case "tov_le_10":
      return g.box != null && g.box.tov <= 10;
    case "opp_tov_ge_15":
      return g.oppBox != null && g.oppBox.tov >= 15;
    case "ast_28":
      return g.box != null && g.box.ast >= 28;
    case "pts_ge_120":
      return g.ptsFor >= 120;
    case "opp_pts_le_110":
      return g.ptsAgainst <= 110;
    case "margin_abs_le_5":
      return Math.abs(margin) <= 5;
    case "total_pts_lt_220":
      return total < 220;
    case "ortg_ge_118":
      return selfOrtg != null && selfOrtg >= T.ortgFire;
    case "ortg_vs_self_plus5":
      return (
        selfOrtg != null &&
        seasonOk(g.selfSeason) &&
        selfOrtg >= g.selfSeason!.ortg + T.ortgSelfPlus
      );
    case "pts_vs_opp_papg_plus8":
      return (
        seasonOk(g.oppSeason) &&
        g.ptsFor - g.oppSeason!.papg >= T.ptsVsOppPapg
      );
    case "opp_ortg_le_110":
      return oppOrtg != null && oppOrtg <= T.oppOrtgHold;
    case "opp_ortg_vs_opp_minus5":
      return (
        oppOrtg != null &&
        seasonOk(g.oppSeason) &&
        oppOrtg <= g.oppSeason!.ortg - T.oppOrtgSuppress
      );
    case "opp_efg_le_52":
      return oppEfg != null && oppEfg <= T.oppEfgMax;
    case "opp_ortg_le_110_dreb_high":
      return (
        oppOrtg != null &&
        oppOrtg <= T.oppOrtgHold &&
        drebPct != null &&
        drebPct >= T.drebPctHigh
      );
    default:
      return false;
  }
}

/** 発火した shapeId 一覧 */
export function evalGameShapes(g: TeamGameShapeInput): TeamShapeId[] {
  const out: TeamShapeId[] = [];
  for (const def of TEAM_SHAPE_DEFS) {
    if (def.needsBox && (g.box == null || g.oppBox == null)) continue;
    if (fires(def.id, g)) out.push(def.id);
  }
  return out;
}
