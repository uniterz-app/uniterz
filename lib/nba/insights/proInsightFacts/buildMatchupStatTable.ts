/**
 * MATCHUP 表 — 攻め × 相手の守りの順位差が大きい順に最大 5 行（文章は作らない）。
 * 衝突の定義は MATCHUP ファクトと同じ CLASH_DEFS。担い手（leaders 上位 · mpg≥25）の OUT / QUES は行の注記にする。
 */
import type { UiStrings } from "@/lib/i18n/ui";
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import type { NbaPlayerStatLeadersBundle } from "@/lib/predict/nbaPlayerStatLeadersMocks";
import type { ProBriefPhase } from "@/lib/predict/predictProBrief";
import {
  PRO_INSIGHT_MATCHUP_TABLE_MAX_ROWS,
  type ProInsightMatchupStatRow,
  type ProInsightMatchupStatSide,
  type ProInsightMatchupStatTable,
  type ProInsightNarrativeItem,
} from "@/lib/predict/proInsightNarrativeTypes";
import {
  rankTeamsByMetric,
  type RankedMetricKey,
} from "@/lib/nba/insights/rankTeamMetrics";
import {
  CLASH_DEFS,
  toMatchupOwner,
  type ClashDef,
} from "@/lib/nba/insights/proInsightFacts/buildMatchupFacts";
import { findStyleOwnerInjury } from "@/lib/nba/insights/proInsightFacts/clashStyleOwner";
import type { ProInsightMatchupOwner } from "@/lib/nba/insights/proInsightFacts/types";
import { proInsightTeamAbbr } from "@/lib/nba/insights/proInsightFacts/teamAbbr";

/** 順位差がこれ未満の行は出さない（担い手の欠場がある行は差 1 以上で出す） */
const MIN_RANK_GAP = 6;
/** 担い手の欠場がある行を差が小さくても上に寄せる */
const OWNER_INJURY_BONUS = 6;

type Pair = { ja: string; en: string };

const ROW_LABELS: Record<string, Pair> = {
  paint: { ja: "ペイント", en: "Paint" },
  fb: { ja: "速攻", en: "Fast break" },
  off_tov: { ja: "TO後の得点", en: "Points off TO" },
  second: { ja: "セカンドチャンス", en: "Second chance" },
  three: { ja: "3P", en: "Three-point" },
  glass: { ja: "オフェンスリバウンド", en: "Offensive glass" },
  tov: { ja: "ターンオーバー", en: "Turnovers" },
  fta: { ja: "フリースロー", en: "Free throws" },
};

/** チーム指標 → 表の指標名（opp* は「被」= 許した側） */
const METRIC_LABELS: Record<string, Pair> = {
  ptsPaint: { ja: "ペイント得点", en: "Paint PTS" },
  oppPtsPaint: { ja: "被ペイント得点", en: "Opp paint PTS" },
  ptsFb: { ja: "速攻得点", en: "Fast-break PTS" },
  oppPtsFb: { ja: "被速攻得点", en: "Opp fast-break PTS" },
  ptsTov: { ja: "TO後得点", en: "PTS off TO" },
  oppPtsOffTov: { ja: "被TO後得点", en: "Opp PTS off TO" },
  ptsSecondChance: { ja: "2nd得点", en: "2nd-chance PTS" },
  oppPtsSecondChance: { ja: "被2nd得点", en: "Opp 2nd-chance PTS" },
  fg3a: { ja: "3PA", en: "3PA" },
  oppFg3Pct: { ja: "被3P%", en: "Opp 3P%" },
  orebPct: { ja: "OREB%", en: "OREB%" },
  oppOrebPct: { ja: "被OREB%", en: "Opp OREB%" },
  tovPct: { ja: "TOV%", en: "TOV%" },
  oppTov: { ja: "強制TO", en: "Forced TO" },
  ftaRate: { ja: "FTA率", en: "FTA rate" },
  oppFtaRate: { ja: "被FTA率", en: "Opp FTA rate" },
};

/** 0–1 で入っている率 */
const PCT_KEYS = new Set<string>([
  "oppFg3Pct",
  "orebPct",
  "oppOrebPct",
  "tovPct",
  "ftaRate",
  "oppFtaRate",
]);

/** 担い手の leaders 指標 → 注記の指標名 */
const OWNER_METRIC_LABELS: Record<string, Pair> = {
  pts_paint: { ja: "ペイント得点", en: "paint PTS" },
  pct_pts_paint: { ja: "ペイント得点比率", en: "paint PTS share" },
  restricted_pts: { ja: "リム付近の得点", en: "restricted-area PTS" },
  paint_touch_pts: { ja: "ペイントタッチ得点", en: "paint-touch PTS" },
  drive_pts: { ja: "ドライブ得点", en: "drive PTS" },
  pts_fb: { ja: "速攻得点", en: "fast-break PTS" },
  trans_pts: { ja: "トランジション得点", en: "transition PTS" },
  trans_freq: { ja: "トランジション頻度", en: "transition freq" },
  pts_tov: { ja: "TO後得点", en: "PTS off TO" },
  stl: { ja: "スティール", en: "STL" },
  oreb: { ja: "オフェンスリバウンド", en: "OREB" },
  oreb_pts: { ja: "プットバック得点", en: "putback PTS" },
  fg3m: { ja: "3P 成功数", en: "3PM" },
  fg3a: { ja: "3P 試投数", en: "3PA" },
  pts_3: { ja: "3P 得点", en: "3P PTS" },
  cns_pts: { ja: "キャッチ&シュート得点", en: "catch-and-shoot PTS" },
  oreb_pct: { ja: "OREB%", en: "OREB%" },
  ast: { ja: "アシスト", en: "AST" },
  ast_pct: { ja: "AST%", en: "AST%" },
  fta: { ja: "FT 試投数", en: "FTA" },
  pts_ft: { ja: "FT 得点", en: "FT PTS" },
  fta_rate: { ja: "FTA率", en: "FTA rate" },
  blk: { ja: "ブロック", en: "BLK" },
  contested_shots: { ja: "コンテスト数", en: "contested shots" },
  dreb: { ja: "ディフェンスリバウンド", en: "DREB" },
  reb: { ja: "リバウンド", en: "REB" },
  reb_pct: { ja: "REB%", en: "REB%" },
  deflections: { ja: "ディフレクション", en: "deflections" },
};

function pair(p: Pair): UiStrings {
  return { ja: p.ja, en: p.en };
}

function metricValue(row: NbaLeagueTeamStatRow | undefined, key: string): number | null {
  const v = row ? (row as Record<string, unknown>)[key] : null;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function formatValue(key: string, v: number): string {
  return PCT_KEYS.has(key) ? `${(v * 100).toFixed(1)}%` : v.toFixed(1);
}

function statusWord(status: string): string {
  return status.toLowerCase() === "out" ? "OUT" : status.toLowerCase();
}

function ownerNote(
  teamId: string,
  owner: ProInsightMatchupOwner,
  side: "attack" | "defend"
): UiStrings {
  const T = proInsightTeamAbbr(teamId);
  const l = OWNER_METRIC_LABELS[owner.metricId] ?? { ja: owner.label, en: owner.label };
  const st = statusWord(owner.status);
  return side === "attack"
    ? {
        ja: `${T} はこの武器の担い手 ${owner.playerName}（${l.ja}チーム${owner.teamRank}位）が ${st}`,
        en: `${T}: ${owner.playerName} (#${owner.teamRank} on team in ${l.en}) is ${st}`,
      }
    : {
        ja: `${T} はこの守りの柱 ${owner.playerName}（${l.ja}チーム${owner.teamRank}位）が ${st}`,
        en: `${T}: ${owner.playerName} (#${owner.teamRank} on team in ${l.en}) is ${st} on defense`,
      };
}

type Candidate = {
  row: ProInsightMatchupStatRow;
  score: number;
  attackRank: number;
};

function sideOf(input: {
  teamId: string;
  key: RankedMetricKey;
  rank: number;
  rowsById: Map<string, NbaLeagueTeamStatRow>;
}): ProInsightMatchupStatSide | null {
  const v = metricValue(input.rowsById.get(input.teamId), input.key);
  if (v == null) return null;
  return {
    teamId: input.teamId,
    metric: pair(METRIC_LABELS[input.key] ?? { ja: input.key, en: input.key }),
    value: formatValue(input.key, v),
    rank: input.rank,
  };
}

function candidateFor(input: {
  def: ClashDef;
  attackTeamId: string;
  defendTeamId: string;
  homeTeamId: string;
  ranks: Map<RankedMetricKey, Map<string, number>>;
  rowsById: Map<string, NbaLeagueTeamStatRow>;
  injuriesOf: (teamId: string) => NbaTeamInjuryEntry[];
  leaders: NbaPlayerStatLeadersBundle | null;
  mpgByPlayerId: Record<string, number> | null;
}): Candidate | null {
  const { def } = input;
  const myRank = input.ranks.get(def.myKey)?.get(input.attackTeamId);
  const oppRank = input.ranks.get(def.oppKey)?.get(input.defendTeamId);
  if (myRank == null || oppRank == null) return null;
  const gap = oppRank - myRank;
  if (gap <= 0) return null;

  const attackOwner = findStyleOwnerInjury({
    kind: def.kind,
    side: "attack",
    teamId: input.attackTeamId,
    injuries: input.injuriesOf(input.attackTeamId),
    leaders: input.leaders,
    mpgByPlayerId: input.mpgByPlayerId,
  });
  const defendOwner = findStyleOwnerInjury({
    kind: def.kind,
    side: "defend",
    teamId: input.defendTeamId,
    injuries: input.injuriesOf(input.defendTeamId),
    leaders: input.leaders,
    mpgByPlayerId: input.mpgByPlayerId,
  });
  const injured = attackOwner != null || defendOwner != null;
  if (gap < MIN_RANK_GAP && !injured) return null;

  const attack = sideOf({
    teamId: input.attackTeamId,
    key: def.myKey,
    rank: myRank,
    rowsById: input.rowsById,
  });
  const defend = sideOf({
    teamId: input.defendTeamId,
    key: def.oppKey,
    rank: oppRank,
    rowsById: input.rowsById,
  });
  if (!attack || !defend) return null;

  const notes: UiStrings[] = [];
  if (attackOwner) {
    notes.push(ownerNote(input.attackTeamId, toMatchupOwner(attackOwner), "attack"));
  }
  if (defendOwner) {
    notes.push(ownerNote(input.defendTeamId, toMatchupOwner(defendOwner), "defend"));
  }

  const attackIsHome = input.attackTeamId === input.homeTeamId;
  return {
    row: {
      kind: def.kind,
      label: pair(ROW_LABELS[def.kind] ?? { ja: def.label, en: def.label }),
      edgeTeamId: input.attackTeamId,
      away: attackIsHome ? defend : attack,
      home: attackIsHome ? attack : defend,
      ...(notes.length ? { notes } : {}),
    },
    score: gap + (injured ? OWNER_INJURY_BONUS : 0),
    attackRank: myRank,
  };
}

export function buildMatchupStatTable(input: {
  phase: ProBriefPhase;
  seasonRows: NbaLeagueTeamStatRow[];
  /** opening / early は前季行を使う（MATCHUP ファクトと同じ） */
  priorRows?: NbaLeagueTeamStatRow[] | null;
  seasonKey?: string | null;
  priorSeasonKey?: string | null;
  homeTeamId: string;
  awayTeamId: string;
  homeInjuries: NbaTeamInjuryEntry[];
  awayInjuries: NbaTeamInjuryEntry[];
  playerLeaders?: NbaPlayerStatLeadersBundle | null;
  mpgByPlayerId?: Record<string, number> | null;
}): ProInsightMatchupStatTable | null {
  const usePrior =
    input.phase !== "full" && input.priorRows != null && input.priorRows.length > 0;
  const rows = usePrior ? input.priorRows! : input.seasonRows;
  if (rows.length === 0) return null;

  const ranks = new Map<RankedMetricKey, Map<string, number>>();
  for (const def of CLASH_DEFS) {
    for (const key of [def.myKey, def.oppKey]) {
      if (!ranks.has(key)) ranks.set(key, rankTeamsByMetric(rows, key));
    }
  }
  const rowsById = new Map(rows.map((r) => [r.teamId, r]));
  const injuriesOf = (teamId: string) =>
    teamId === input.homeTeamId
      ? input.homeInjuries
      : teamId === input.awayTeamId
        ? input.awayInjuries
        : [];

  const bestByKind = new Map<string, Candidate>();
  for (const def of CLASH_DEFS) {
    for (const [attackTeamId, defendTeamId] of [
      [input.awayTeamId, input.homeTeamId],
      [input.homeTeamId, input.awayTeamId],
    ] as const) {
      const c = candidateFor({
        def,
        attackTeamId,
        defendTeamId,
        homeTeamId: input.homeTeamId,
        ranks,
        rowsById,
        injuriesOf,
        leaders: input.playerLeaders ?? null,
        mpgByPlayerId: input.mpgByPlayerId ?? null,
      });
      if (!c) continue;
      const prev = bestByKind.get(def.kind);
      if (!prev || c.score > prev.score) bestByKind.set(def.kind, c);
    }
  }

  const picked = [...bestByKind.values()]
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.attackRank - b.attackRank ||
        a.row.kind.localeCompare(b.row.kind)
    )
    .slice(0, PRO_INSIGHT_MATCHUP_TABLE_MAX_ROWS)
    .map((c) => c.row);
  if (picked.length === 0) return null;

  return {
    rows: picked,
    seasonKey: (usePrior ? input.priorSeasonKey : input.seasonKey) ?? null,
    teamCount: rows.length,
  };
}

/** 表を描けない旧クライアント向けに 1 行ずつの文にする */
export function matchupTableCompatItems(
  table: ProInsightMatchupStatTable
): ProInsightNarrativeItem[] {
  return table.rows.map((r) => {
    const [atk, def] =
      r.edgeTeamId === r.home.teamId ? [r.home, r.away] : [r.away, r.home];
    const A = proInsightTeamAbbr(atk.teamId);
    const B = proInsightTeamAbbr(def.teamId);
    return {
      body: {
        ja: `${r.label.ja}：${A} ${atk.metric.ja} ${atk.rank}位 × ${B} ${def.metric.ja} ${def.rank}位`,
        en: `${r.label.en}: ${A} ${atk.metric.en} #${atk.rank} vs ${B} ${def.metric.en} #${def.rank}`,
      },
      evidence: r.notes ?? [],
    };
  });
}
