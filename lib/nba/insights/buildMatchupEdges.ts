/**
 * MATCHUP edges — 型衝突スコア上位 + 欠場折り込み。
 */
import type { ProBriefEdgeItem } from "@/lib/predict/predictProBrief";
import type { ProBriefPhase } from "@/lib/predict/predictProBrief";
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import {
  findTeamRow,
  rankTeamsByMetric,
  type RankedMetricKey,
} from "@/lib/nba/insights/rankTeamMetrics";
import { TEAM_SHORT } from "@/lib/team-short";
import {
  formatWl,
  h2hFromPerspective,
  h2hPairKey,
  wlTotal,
  type NbaTeamSeasonRecordsBundle,
} from "@/lib/nba/insights/priorSeasonRecordTypes";
import type { NbaTeamAceOutRecordsBundle } from "@/lib/nba/insights/aceOutRecordTypes";
import {
  aceOutSuffix,
  findAceOutForInjuryWithTeam,
} from "@/lib/nba/insights/aceOutInsight";

type EdgeCandidate = ProBriefEdgeItem & { score: number; kind: string };

type InjuryFoldOpts = {
  teamId: string;
  aceOut?: NbaTeamAceOutRecordsBundle | null;
  aceOutPhaseLabel: "前季" | "今季";
};

function shortName(entry: NbaTeamInjuryEntry): string {
  const raw = entry.name.trim();
  const m = raw.match(/^([A-Za-z])\.(.+)$/);
  if (m) return `${m[1]}.${m[2]}`.replace(/\s+/g, " ");
  const parts = raw.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]!.charAt(0)}.${parts.slice(1).join(" ")}`;
  }
  return raw;
}

function outOrGtd(injuries: NbaTeamInjuryEntry[]): NbaTeamInjuryEntry[] {
  return injuries.filter((i) => i.status === "out" || i.status === "gtd");
}

function statusWord(entry: NbaTeamInjuryEntry): string {
  return entry.status === "out" ? "OUT" : "QUES";
}

/** 衝突: 自分の良い順位 + 相手の悪い順位 */
function clashScore(myRank: number | undefined, oppWeakRank: number | undefined): number {
  if (myRank == null || oppWeakRank == null) return 0;
  // 自分 Top10 かつ相手 Bottom10 寄り
  const myBoost = Math.max(0, 16 - myRank);
  const oppBoost = Math.max(0, oppWeakRank - 15);
  return myBoost + oppBoost;
}

function pickTopInjuries(
  injuries: NbaTeamInjuryEntry[],
  max = 1
): NbaTeamInjuryEntry[] {
  const list = outOrGtd(injuries);
  const outs = list.filter((i) => i.status === "out");
  const pool = outs.length > 0 ? outs : list;
  return pool.slice(0, max);
}

function withInjurySuffix(
  baseJa: string,
  baseEn: string,
  injuries: NbaTeamInjuryEntry[],
  fold?: InjuryFoldOpts
): { detailJa: string; detailEn: string; injuryBoost: number } {
  const pick = pickTopInjuries(injuries, 1)[0];
  if (!pick) {
    return { detailJa: baseJa, detailEn: baseEn, injuryBoost: 0 };
  }
  const name = shortName(pick);
  const st = statusWord(pick);
  let ja =
    st === "OUT"
      ? `${baseJa} · ${name} OUT`
      : `${baseJa} · ${name} QUES`;
  let en =
    st === "OUT"
      ? `${baseEn} · ${name} OUT`
      : `${baseEn} · ${name} QUES`;

  if (fold) {
    const hit = findAceOutForInjuryWithTeam(
      fold.aceOut,
      fold.teamId,
      pick
    );
    if (hit) {
      const suf = aceOutSuffix(hit.player, fold.aceOutPhaseLabel, hit.team);
      ja = `${ja} · ${suf.ja}`;
      en = `${en} · ${suf.en}`;
    }
  }

  return {
    detailJa: ja,
    detailEn: en,
    injuryBoost: st === "OUT" ? 8 : 5,
  };
}

type ClashDef = {
  kind: string;
  label: string;
  myKey: RankedMetricKey;
  oppKey: RankedMetricKey;
  ja: (my: number, opp: number) => string;
  en: (my: number, opp: number) => string;
};

const CLASH_DEFS: ClashDef[] = [
  {
    kind: "paint",
    label: "PAINT ATTACK",
    myKey: "ptsPaint",
    oppKey: "oppEfgPct",
    ja: (my, opp) => `ペイント得点 #${my} · 相手守備 #${opp}`,
    en: (my, opp) => `Paint PPG #${my} · Opp defense #${opp}`,
  },
  {
    kind: "three",
    label: "3-POINT VOLUME",
    myKey: "fg3a",
    oppKey: "oppFg3Pct",
    ja: (my, opp) => `3PA率 #${my} · 相手被3P #${opp}`,
    en: (my, opp) => `3PA rate #${my} · Opp 3P% allowed #${opp}`,
  },
  {
    kind: "glass",
    label: "GLASS",
    myKey: "orebPct",
    oppKey: "oppOrebPct",
    ja: (my, opp) => `OREB% #${my} · 相手 DREB側 #${opp}`,
    en: (my, opp) => `OREB% #${my} · Opp OREB allowed #${opp}`,
  },
  {
    kind: "tov",
    label: "TURNOVER",
    myKey: "tovPct",
    oppKey: "oppTov",
    ja: (my, opp) => `TOV% #${my} · 相手強制TO #${opp}`,
    en: (my, opp) => `TOV% #${my} · Opp TO forced #${opp}`,
  },
  {
    kind: "fta",
    label: "FREE THROW",
    myKey: "ftaRate",
    oppKey: "oppEfgPct",
    ja: (my, opp) => `FTA率 #${my} · 相手守備 #${opp}`,
    en: (my, opp) => `FTA rate #${my} · Opp defense #${opp}`,
  },
  {
    kind: "trans",
    label: "TRANSITION",
    myKey: "ptsFb",
    oppKey: "oppEfgPct",
    ja: (my, opp) => `FB得点 #${my} · 相手守備 #${opp}`,
    en: (my, opp) => `FB points #${my} · Opp defense #${opp}`,
  },
  {
    kind: "net",
    label: "NET RATING",
    myKey: "netrtg",
    oppKey: "drtg",
    ja: (my, opp) => `NET #${my} · 相手 DRTG #${opp}`,
    en: (my, opp) => `NET #${my} · Opp DRTG #${opp}`,
  },
  {
    kind: "ortg",
    label: "OFFENSE",
    myKey: "ortg",
    oppKey: "drtg",
    ja: (my, opp) => `ORTG #${my} · 相手 DRTG #${opp}`,
    en: (my, opp) => `ORTG #${my} · Opp DRTG #${opp}`,
  },
];

function buildSeasonClashEdges(input: {
  rows: NbaLeagueTeamStatRow[];
  teamId: string;
  opponentId: string;
  injuries: NbaTeamInjuryEntry[];
  priorPrefix: boolean;
  aceOut?: NbaTeamAceOutRecordsBundle | null;
}): EdgeCandidate[] {
  const ranks = new Map<RankedMetricKey, Map<string, number>>();
  for (const def of CLASH_DEFS) {
    if (!ranks.has(def.myKey)) ranks.set(def.myKey, rankTeamsByMetric(input.rows, def.myKey));
    if (!ranks.has(def.oppKey)) ranks.set(def.oppKey, rankTeamsByMetric(input.rows, def.oppKey));
  }

  const fold: InjuryFoldOpts = {
    teamId: input.teamId,
    aceOut: input.aceOut,
    aceOutPhaseLabel: input.priorPrefix ? "前季" : "今季",
  };

  const out: EdgeCandidate[] = [];
  for (const def of CLASH_DEFS) {
    const myRank = ranks.get(def.myKey)?.get(input.teamId);
    const oppRank = ranks.get(def.oppKey)?.get(input.opponentId);
    let score = clashScore(myRank, oppRank);
    if (myRank == null || oppRank == null) continue;
    if (score < 6 && pickTopInjuries(input.injuries).length === 0) continue;

    const prefixJa = input.priorPrefix ? "前季" : "";
    const prefixEn = input.priorPrefix ? "Last season " : "";
    const baseJa = `${prefixJa}${def.ja(myRank, oppRank)}`;
    const baseEn = `${prefixEn}${def.en(myRank, oppRank)}`;
    const folded = withInjurySuffix(baseJa, baseEn, input.injuries, fold);
    score += folded.injuryBoost;
    if (score < 6) continue;

    out.push({
      kind: def.kind,
      label: def.label,
      detailJa: folded.detailJa,
      detailEn: folded.detailEn,
      score,
    });
  }
  return out;
}

function buildVenueRecordEdge(input: {
  seasonRows: NbaLeagueTeamStatRow[];
  records: NbaTeamSeasonRecordsBundle | null;
  teamId: string;
  isHome: boolean;
  injuries: NbaTeamInjuryEntry[];
  labelPrefixJa: "前季" | "今季";
  labelPrefixEn: "Last season" | "This season";
  aceOut?: NbaTeamAceOutRecordsBundle | null;
}): EdgeCandidate[] {
  const split = input.records?.teams[input.teamId];
  const venue = input.isHome ? split?.home : split?.away;
  const netRank = rankTeamsByMetric(input.seasonRows, "netrtg").get(input.teamId);
  const label = input.isHome ? "HOME COURT" : "ROAD FORM";
  const minGames = input.labelPrefixJa === "今季" ? 2 : 5;
  const fold: InjuryFoldOpts = {
    teamId: input.teamId,
    aceOut: input.aceOut,
    aceOutPhaseLabel: input.labelPrefixJa,
  };

  if (venue && wlTotal(venue) >= minGames) {
    const baseJa = input.isHome
      ? `${input.labelPrefixJa}ホーム ${formatWl(venue)}${netRank != null ? ` · NetRtg #${netRank}` : ""}`
      : `${input.labelPrefixJa}アウェイ ${formatWl(venue)}${netRank != null ? ` · NetRtg #${netRank}` : ""}`;
    const baseEn = input.isHome
      ? `${input.labelPrefixEn} home ${formatWl(venue)}${netRank != null ? ` · NetRtg #${netRank}` : ""}`
      : `${input.labelPrefixEn} road ${formatWl(venue)}${netRank != null ? ` · NetRtg #${netRank}` : ""}`;
    const folded = withInjurySuffix(baseJa, baseEn, input.injuries, fold);
    return [
      {
        kind: "venue",
        label,
        detailJa: folded.detailJa,
        detailEn: folded.detailEn,
        score: 14 + folded.injuryBoost,
      },
    ];
  }

  if (input.labelPrefixJa === "前季") {
    const row = findTeamRow(input.seasonRows, input.teamId);
    if (!row) return [];
    const baseJa = `前季 ${row.wins}-${row.losses}${netRank != null ? ` · NetRtg #${netRank}` : ""}`;
    const baseEn = `Last season ${row.wins}-${row.losses}${netRank != null ? ` · NetRtg #${netRank}` : ""}`;
    const folded = withInjurySuffix(baseJa, baseEn, input.injuries, fold);
    return [
      {
        kind: "venue",
        label,
        detailJa: folded.detailJa,
        detailEn: folded.detailEn,
        score: 10 + folded.injuryBoost,
      },
    ];
  }
  return [];
}

function buildH2HEdge(input: {
  records: NbaTeamSeasonRecordsBundle | null;
  teamId: string;
  opponentId: string;
  isHome: boolean;
  labelPrefixJa: "前季" | "今季";
  labelPrefixEn: "Last season" | "This season";
}): EdgeCandidate | null {
  if (!input.records) return null;
  const pair = input.records.h2h[h2hPairKey(input.teamId, input.opponentId)];
  const from = h2hFromPerspective(pair, input.teamId);
  if (!from || wlTotal(from.overall) <= 0) return null;

  const venue = input.isHome ? from.atHome : from.atAway;
  if (wlTotal(venue) > 0) {
    return {
      kind: "h2h",
      label: "H2H",
      detailJa: `${input.labelPrefixJa}この会場 ${formatWl(venue)} · シリーズ ${formatWl(from.overall)}`,
      detailEn: `${input.labelPrefixEn} here ${formatWl(venue)} · series ${formatWl(from.overall)}`,
      score: 16,
    };
  }
  return {
    kind: "h2h",
    label: "H2H",
    detailJa: `${input.labelPrefixJa} H2H ${formatWl(from.overall)}`,
    detailEn: `${input.labelPrefixEn} H2H ${formatWl(from.overall)}`,
    score: 15,
  };
}

function buildVsTopEdge(input: {
  records: NbaTeamSeasonRecordsBundle | null;
  seasonRows: NbaLeagueTeamStatRow[];
  teamId: string;
  isHome: boolean;
  labelPrefixJa: "前季" | "今季";
  labelPrefixEn: "Last season" | "This season";
}): EdgeCandidate | null {
  const split = input.records?.teams[input.teamId];
  const row = findTeamRow(input.seasonRows, input.teamId);
  const conf = row?.conference === "west" ? "WEST" : "EAST";
  const minGames = input.labelPrefixJa === "今季" ? 2 : 3;

  if (split) {
    const venueTop = input.isHome ? split.vsConfTop6Home : split.vsConfTop6Away;
    const use = wlTotal(venueTop) >= minGames ? venueTop : split.vsConfTop6;
    if (wlTotal(use) >= minGames) {
      const venueJa = input.isHome ? "ホーム" : "アウェイ";
      const venueEn = input.isHome ? "home" : "road";
      return {
        kind: "vsTop",
        label: "VS TOP",
        detailJa: `${input.labelPrefixJa} ${conf} 上位との${venueJa} ${formatWl(use)}`,
        detailEn: `${input.labelPrefixEn} vs ${conf} top-6 (${venueEn}) ${formatWl(use)}`,
        score: 13,
      };
    }
  }
  return null;
}

function buildVs500Edges(input: {
  records: NbaTeamSeasonRecordsBundle | null;
  teamId: string;
  labelPrefixJa: "前季" | "今季";
  labelPrefixEn: "Last season" | "This season";
}): EdgeCandidate[] {
  const split = input.records?.teams[input.teamId];
  if (!split) return [];
  const out: EdgeCandidate[] = [];
  const minGames = input.labelPrefixJa === "今季" ? 3 : 5;

  if (wlTotal(split.vsOver500) >= minGames) {
    const pct = Math.round(
      (split.vsOver500.wins / wlTotal(split.vsOver500)) * 100
    );
    out.push({
      kind: "vsOver500",
      label: "VS .500+",
      detailJa: `${input.labelPrefixJa} 勝率5割以上相手 ${formatWl(split.vsOver500)}（${pct}%）`,
      detailEn: `${input.labelPrefixEn} vs .500+ ${formatWl(split.vsOver500)} (${pct}%)`,
      score: 11 + Math.max(0, pct - 45) / 5,
    });
  }

  if (wlTotal(split.vsUnder500) >= minGames) {
    const pct = Math.round(
      (split.vsUnder500.wins / wlTotal(split.vsUnder500)) * 100
    );
    out.push({
      kind: "vsUnder500",
      label: "VS SUB-.500",
      detailJa: `${input.labelPrefixJa} 勝率5割未満相手 ${formatWl(split.vsUnder500)}（${pct}%）`,
      detailEn: `${input.labelPrefixEn} vs sub-.500 ${formatWl(split.vsUnder500)} (${pct}%)`,
      score: 10 + Math.max(0, pct - 60) / 5,
    });
  }

  return out;
}

export function buildMatchupEdgesForTeam(input: {
  phase: ProBriefPhase;
  seasonRows: NbaLeagueTeamStatRow[];
  priorRows: NbaLeagueTeamStatRow[] | null;
  priorRecords?: NbaTeamSeasonRecordsBundle | null;
  /** 今季（26-27 等）の games 集計 */
  seasonRecords?: NbaTeamSeasonRecordsBundle | null;
  /** opening → 前季エース欠場、early/full → 今季 */
  aceOutRecords?: NbaTeamAceOutRecordsBundle | null;
  teamId: string;
  opponentId: string;
  isHome: boolean;
  injuries: NbaTeamInjuryEntry[];
}): ProBriefEdgeItem[] {
  const candidates: EdgeCandidate[] = [];
  const aceOut = input.aceOutRecords ?? null;

  if (input.phase === "opening") {
    const prior = input.priorRows ?? input.seasonRows;
    const records = input.priorRecords ?? null;
    const h2h = buildH2HEdge({
      records,
      teamId: input.teamId,
      opponentId: input.opponentId,
      isHome: input.isHome,
      labelPrefixJa: "前季",
      labelPrefixEn: "Last season",
    });
    if (h2h) candidates.push(h2h);
    candidates.push(
      ...buildVenueRecordEdge({
        seasonRows: prior,
        records,
        teamId: input.teamId,
        isHome: input.isHome,
        injuries: input.injuries,
        labelPrefixJa: "前季",
        labelPrefixEn: "Last season",
        aceOut,
      }),
      ...buildVs500Edges({
        records,
        teamId: input.teamId,
        labelPrefixJa: "前季",
        labelPrefixEn: "Last season",
      })
    );
    const vsTop = buildVsTopEdge({
      records,
      seasonRows: prior,
      teamId: input.teamId,
      isHome: input.isHome,
      labelPrefixJa: "前季",
      labelPrefixEn: "Last season",
    });
    if (vsTop) candidates.push(vsTop);

    candidates.push(
      ...buildSeasonClashEdges({
        rows: prior,
        teamId: input.teamId,
        opponentId: input.opponentId,
        injuries: input.injuries,
        priorPrefix: true,
        aceOut,
      })
    );
  } else {
    const records = input.seasonRecords ?? null;
    const h2h = buildH2HEdge({
      records,
      teamId: input.teamId,
      opponentId: input.opponentId,
      isHome: input.isHome,
      labelPrefixJa: "今季",
      labelPrefixEn: "This season",
    });
    if (h2h) candidates.push(h2h);
    candidates.push(
      ...buildVenueRecordEdge({
        seasonRows: input.seasonRows,
        records,
        teamId: input.teamId,
        isHome: input.isHome,
        injuries: input.injuries,
        labelPrefixJa: "今季",
        labelPrefixEn: "This season",
        aceOut,
      }),
      ...buildVs500Edges({
        records,
        teamId: input.teamId,
        labelPrefixJa: "今季",
        labelPrefixEn: "This season",
      })
    );
    const vsTop = buildVsTopEdge({
      records,
      seasonRows: input.seasonRows,
      teamId: input.teamId,
      isHome: input.isHome,
      labelPrefixJa: "今季",
      labelPrefixEn: "This season",
    });
    if (vsTop) candidates.push(vsTop);

    candidates.push(
      ...buildSeasonClashEdges({
        rows: input.seasonRows,
        teamId: input.teamId,
        opponentId: input.opponentId,
        injuries: input.injuries,
        priorPrefix: false,
        aceOut,
      })
    );
  }

  // 同系統は 1 本（kind）
  const byKind = new Map<string, EdgeCandidate>();
  for (const c of candidates) {
    const prev = byKind.get(c.kind);
    if (!prev || c.score > prev.score) byKind.set(c.kind, c);
  }
  return [...byKind.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(({ label, detailJa, detailEn }) => ({ label, detailJa, detailEn }));
}

export function injuryNamesUsedInEdges(edges: ProBriefEdgeItem[]): Set<string> {
  const used = new Set<string>();
  for (const e of edges) {
    const blob = `${e.detailJa ?? ""} ${e.detailEn ?? ""}`;
    for (const m of blob.matchAll(/\b([A-Z]\.[A-Za-z][A-Za-z.' -]+)\s+(OUT|QUES)\b/g)) {
      used.add(m[1]!.trim().toLowerCase());
    }
  }
  return used;
}

export function teamAbbr(teamId: string): string {
  return (TEAM_SHORT[teamId] ?? teamId.replace(/^nba-/, "")).toUpperCase();
}
