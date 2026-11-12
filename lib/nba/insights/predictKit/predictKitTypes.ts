/**
 * Pro Insight「予想の材料」の保存・表示用の形（WINNER / SCORING / OUT）。
 */
import {
  PREDICT_KIT_TOTAL_BAND_PTS,
  type PredictKit,
  type PredictKitLeanTier,
  type PredictKitPaceTier,
  type PredictKitTeamLine,
} from "@/lib/nba/insights/predictKit/predictKit";

/**
 * teamId は要因の主語（strength = 実力が上・home = ホーム・b2b = 連戦・rested = 休養十分・injury = 欠場のあるチーム）。
 * pts は得をする側（b2b / injury は相手、それ以外は主語）の期待点差の上積み（正・小数 1 桁）。
 */
export type ProInsightPredictKitFactor = {
  kind: "strength" | "home" | "b2b" | "rested" | "injury";
  teamId: string;
  pts: number;
};

export type ProInsightPredictKitAbsence = {
  teamId: string;
  /** ローテ選手の OUT（"S.Barnes" 形式） */
  out: string[];
  /** 出場未定（questionable） */
  questionable: string[];
};

export type ProInsightPredictKitTeam = PredictKitTeamLine & { teamId: string };

export type ProInsightPredictKit = {
  v: 2;
  /** 互角のときも確率が高い側 */
  favoredTeamId: string;
  lean: PredictKitLeanTier;
  /** 有利側が勝つ確率（%・整数） */
  winPct: number;
  /** 有利側から見た予想点差（小数 1 桁） */
  margin: number;
  pace: PredictKitPaceTier;
  /** 予想スコア（整数）とレンジ（合計 ± PREDICT_KIT_TOTAL_BAND_PTS） */
  score: { home: number; away: number; total: number; low: number; high: number; leagueTotal: number };
  /** [ホーム, アウェイ] の試合前の今季成績（平均は小数 1 桁） */
  teams: [ProInsightPredictKitTeam, ProInsightPredictKitTeam];
  /** 期待点差を 1 点以上動かした要因（大きい順） */
  factors: ProInsightPredictKitFactor[];
  absences: ProInsightPredictKitAbsence[];
  /** 実力差の今季分の出どころ。cleanSos = ガベージタイム抜き + 相手補正（無ければ平均得失点差） */
  strengthBasis?: "cleanSos";
  /** 得点王の候補（確率の高い順・最大 3 人） */
  scorers?: ProInsightPredictKitScorer[];
  /** 今季この予想の材料を出した試合の成績（作った時点。20 試合未満は付けない） */
  record?: ProInsightPredictKitRecord;
};

export type ProInsightPredictKitScorer = {
  playerId: string;
  teamId: string;
  /** "J.BRUNSON" 形式 */
  name: string;
  /** 得点王になる確率（%・整数） */
  pct: number;
  /** 平均得点（小数 1 桁。今季未出場なら前季） */
  ppg: number;
  /** 出場未定 */
  doubtful?: boolean;
};

export type ProInsightPredictKitRecord = {
  /** 勝敗: 確率が高い側が勝った試合 / 採点した試合 */
  games: number;
  hits: number;
  /** 勝つ確率 70% 以上と出した試合だけ */
  strongGames: number;
  strongHits: number;
  /** 得点王の候補 1 番手が得点王だった試合 / 候補を出した試合 */
  scorerGames: number;
  scorerHits: number;
  /** 本番の採点が 20 試合たまるまでの代わり: 今季の終わった試合をその日までのデータだけで予想し直した成績 */
  basis?: "backtest";
};

export const PREDICT_KIT_RECORD_MIN_GAMES = 20;
export const PREDICT_KIT_RECORD_STRONG_PCT = 70;

const r1 = (x: number) => Math.round(x * 10) / 10;

const isNum = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const strList = (x: unknown) => (Array.isArray(x) ? x.filter((s): s is string => typeof s === "string") : []);
const FACTOR_KINDS = new Set(["strength", "home", "b2b", "rested", "injury"]);
const LEAN_TIERS = new Set(["even", "slight", "clear"]);
const PACE_TIERS = new Set(["low", "mid", "high"]);

/** 保存値（Firestore / API）を表示できる形か確かめる。v 違い・欠けがあれば null */
export function sanitizeProInsightPredictKit(raw: unknown): ProInsightPredictKit | null {
  if (!raw || typeof raw !== "object") return null;
  const k = raw as Record<string, unknown>;
  if (k.v !== 2 || typeof k.favoredTeamId !== "string") return null;
  if (!LEAN_TIERS.has(String(k.lean)) || !PACE_TIERS.has(String(k.pace))) return null;
  if (!isNum(k.winPct) || !isNum(k.margin)) return null;
  const s = k.score as Record<string, unknown> | undefined;
  if (!s || !["home", "away", "total", "low", "high", "leagueTotal"].every((f) => isNum(s[f]))) return null;
  const teams = Array.isArray(k.teams) ? (k.teams as Record<string, unknown>[]) : [];
  const team = (t: Record<string, unknown> | undefined): ProInsightPredictKitTeam | null =>
    t && typeof t.teamId === "string" && ["wins", "losses", "margin", "pf", "pa"].every((f) => isNum(t[f]))
      ? {
          teamId: t.teamId,
          wins: t.wins as number,
          losses: t.losses as number,
          margin: t.margin as number,
          pf: t.pf as number,
          pa: t.pa as number,
        }
      : null;
  const home = team(teams[0]);
  const away = team(teams[1]);
  if (!home || !away) return null;
  const factors = (Array.isArray(k.factors) ? (k.factors as Record<string, unknown>[]) : []).flatMap((f) =>
    f && FACTOR_KINDS.has(String(f.kind)) && typeof f.teamId === "string" && isNum(f.pts)
      ? [{ kind: f.kind as ProInsightPredictKitFactor["kind"], teamId: f.teamId, pts: f.pts }]
      : []
  );
  const absences = (Array.isArray(k.absences) ? (k.absences as Record<string, unknown>[]) : []).flatMap((a) =>
    a && typeof a.teamId === "string"
      ? [{ teamId: a.teamId, out: strList(a.out), questionable: strList(a.questionable) }]
      : []
  );
  const scorers = (Array.isArray(k.scorers) ? (k.scorers as Record<string, unknown>[]) : []).flatMap((x) =>
    x &&
    typeof x.playerId === "string" &&
    typeof x.teamId === "string" &&
    typeof x.name === "string" &&
    isNum(x.pct) &&
    isNum(x.ppg)
      ? [
          {
            playerId: x.playerId,
            teamId: x.teamId,
            name: x.name,
            pct: x.pct,
            ppg: x.ppg,
            ...(x.doubtful === true ? { doubtful: true } : {}),
          },
        ]
      : []
  );
  const record = sanitizePredictKitRecord(k.record);
  return {
    v: 2,
    favoredTeamId: k.favoredTeamId,
    lean: k.lean as PredictKitLeanTier,
    winPct: k.winPct,
    margin: k.margin,
    pace: k.pace as PredictKitPaceTier,
    score: {
      home: s.home as number,
      away: s.away as number,
      total: s.total as number,
      low: s.low as number,
      high: s.high as number,
      leagueTotal: s.leagueTotal as number,
    },
    teams: [home, away],
    factors,
    absences,
    ...(k.strengthBasis === "cleanSos" ? { strengthBasis: "cleanSos" as const } : {}),
    ...(scorers.length ? { scorers } : {}),
    ...(record ? { record } : {}),
  };
}

/** 成績だけ（無料にも出す）。20 試合未満は null */
export function sanitizePredictKitRecord(raw: unknown): ProInsightPredictKitRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  if (!["games", "hits", "strongGames", "strongHits", "scorerGames", "scorerHits"].every((f) => isNum(rec[f]))) {
    return null;
  }
  const record = rec as unknown as ProInsightPredictKitRecord;
  return record.games >= PREDICT_KIT_RECORD_MIN_GAMES
    ? {
        games: record.games,
        hits: record.hits,
        strongGames: record.strongGames,
        strongHits: record.strongHits,
        scorerGames: record.scorerGames,
        scorerHits: record.scorerHits,
        ...(rec.basis === "backtest" ? { basis: "backtest" as const } : {}),
      }
    : null;
}

/** 検証スクリプトが保存した成績（`nbaPredictShadowMeta/{season}.kitBacktest`）。得点王が無ければ 0 */
export function predictKitBacktestRecordOf(raw: unknown): ProInsightPredictKitRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  if (!isNum(b.games) || !isNum(b.hits) || b.games < PREDICT_KIT_RECORD_MIN_GAMES) return null;
  return {
    games: b.games,
    hits: b.hits,
    strongGames: isNum(b.strongGames) ? b.strongGames : 0,
    strongHits: isNum(b.strongHits) ? b.strongHits : 0,
    scorerGames: isNum(b.scorerGames) ? b.scorerGames : 0,
    scorerHits: isNum(b.scorerHits) ? b.scorerHits : 0,
    basis: "backtest",
  };
}

/** 採点済みの試合ごとの結果（`nbaPredictShadowMeta/{season}.kitResults`）から成績を組む */
export function predictKitRecordOf(
  results: Record<string, { p?: number; h?: number; s?: number }> | null | undefined
): ProInsightPredictKitRecord | null {
  const rows = Object.values(results ?? {}).filter((r) => isNum(r?.p) && (r.h === 0 || r.h === 1));
  if (rows.length < PREDICT_KIT_RECORD_MIN_GAMES) return null;
  const strong = rows.filter((r) => (r.p as number) >= PREDICT_KIT_RECORD_STRONG_PCT);
  const scorer = rows.filter((r) => r.s === 0 || r.s === 1);
  return {
    games: rows.length,
    hits: rows.filter((r) => r.h === 1).length,
    strongGames: strong.length,
    strongHits: strong.filter((r) => r.h === 1).length,
    scorerGames: scorer.length,
    scorerHits: scorer.filter((r) => r.s === 1).length,
  };
}

export function toProInsightPredictKit(input: {
  kit: PredictKit;
  homeTeamId: string;
  awayTeamId: string;
  absences: ProInsightPredictKitAbsence[];
  strengthBasis?: "cleanSos";
  scorers?: ProInsightPredictKitScorer[];
  record?: ProInsightPredictKitRecord | null;
}): ProInsightPredictKit {
  const { kit, homeTeamId, awayTeamId } = input;
  const factors = kit.factors.map((f): ProInsightPredictKitFactor => {
    // 得をする側は kind で決まる（f.pts の符号は有利側から見た向き）
    const pts = r1(Math.abs(f.pts));
    if (f.kind === "rest") return { kind: f.rest === "0" ? "b2b" : "rested", teamId: f.teamId, pts };
    return { kind: f.kind, teamId: f.teamId, pts };
  });
  const line = (teamId: string, t: PredictKitTeamLine): ProInsightPredictKitTeam => ({
    teamId,
    wins: t.wins,
    losses: t.losses,
    margin: r1(t.margin),
    pf: r1(t.pf),
    pa: r1(t.pa),
  });
  const total = Math.round(kit.score.total);
  return {
    v: 2,
    favoredTeamId: kit.favoredTeamId,
    lean: kit.lean,
    winPct: Math.round(kit.favoredWinP * 100),
    margin: r1(Math.abs(kit.homeMargin)),
    pace: kit.pace,
    score: {
      home: Math.round(kit.score.home),
      away: Math.round(kit.score.away),
      total,
      low: total - PREDICT_KIT_TOTAL_BAND_PTS,
      high: total + PREDICT_KIT_TOTAL_BAND_PTS,
      leagueTotal: Math.round(kit.score.leagueTotal),
    },
    teams: [line(homeTeamId, kit.teams.home), line(awayTeamId, kit.teams.away)],
    factors,
    absences: input.absences,
    ...(input.strengthBasis ? { strengthBasis: input.strengthBasis } : {}),
    ...(input.scorers?.length ? { scorers: input.scorers } : {}),
    ...(input.record ? { record: input.record } : {}),
  };
}
