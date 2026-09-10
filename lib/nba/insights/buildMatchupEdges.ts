/**
 * MATCHUP edges — 型衝突スコア上位 + 欠場折り込み。
 */
import type { ProBriefEdgeItem } from "@/lib/predict/predictProBrief";
import type { ProBriefPhase } from "@/lib/predict/predictProBrief";
import { proBriefEdge } from "@/lib/predict/predictProBrief";
import type { UiStrings } from "@/lib/i18n/ui";
import { joinUiStrings } from "@/lib/i18n/uiCompose";
import {
  PHASE_WORD,
  injuryStatusPhrase,
  venueWord,
  vsConfTopLine,
  vsOver500Line,
  vsUnder500Line,
  type InsightPhase,
} from "@/lib/nba/insights/insightPhrases";
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import { isOutOrQuestionableInjury } from "@/lib/nba/teamInjuries/injuryStatusDisplay";
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
  aceOutPhase: InsightPhase;
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
  return injuries.filter((i) => isOutOrQuestionableInjury(i.status));
}

function isOutStatus(entry: NbaTeamInjuryEntry): boolean {
  return entry.status === "out" || entry.status === "doubtful";
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
  base: UiStrings,
  injuries: NbaTeamInjuryEntry[],
  fold?: InjuryFoldOpts
): { detail: UiStrings; injuryBoost: number } {
  const pick = pickTopInjuries(injuries, 1)[0];
  if (!pick) {
    return { detail: base, injuryBoost: 0 };
  }
  const isOut = isOutStatus(pick);
  const parts: Array<UiStrings | null> = [
    base,
    injuryStatusPhrase(shortName(pick), isOut),
  ];

  if (fold) {
    const hit = findAceOutForInjuryWithTeam(fold.aceOut, fold.teamId, pick);
    if (hit) {
      parts.push(aceOutSuffix(hit.player, fold.aceOutPhase, hit.team));
    }
  }

  return {
    detail: joinUiStrings(parts),
    injuryBoost: isOut ? 8 : 5,
  };
}

type ClashDef = {
  kind: string;
  label: string;
  myKey: RankedMetricKey;
  oppKey: RankedMetricKey;
  text: (my: number, opp: number) => UiStrings;
};

const CLASH_DEFS: ClashDef[] = [
  {
    kind: "paint",
    label: "PAINT ATTACK",
    myKey: "ptsPaint",
    oppKey: "oppEfgPct",
    text: (my, opp) => ({
      ja: `ペイント得点 #${my} · 相手守備 #${opp}`,
      en: `Paint PPG #${my} · Opp defense #${opp}`,
      ko: `페인트 득점 #${my} · 상대 수비 #${opp}`,
      zh: `油漆区得分 #${my} · 对手防守 #${opp}`,
      es: `PTS en pintura #${my} · Defensa rival #${opp}`,
      pt: `PTS no garrafão #${my} · Defesa adv. #${opp}`,
      fr: `Pts dans la raquette #${my} · Défense adv. #${opp}`,
    }),
  },
  {
    kind: "three",
    label: "3-POINT VOLUME",
    myKey: "fg3a",
    oppKey: "oppFg3Pct",
    text: (my, opp) => ({
      ja: `3PA率 #${my} · 相手被3P #${opp}`,
      en: `3PA rate #${my} · Opp 3P% allowed #${opp}`,
      ko: `3PA 비율 #${my} · 상대 3P% 허용 #${opp}`,
      zh: `三分出手占比 #${my} · 对手三分被命中率 #${opp}`,
      es: `Tasa de 3PA #${my} · 3P% permitido rival #${opp}`,
      pt: `Taxa de 3PA #${my} · 3P% cedido adv. #${opp}`,
      fr: `Taux de 3PA #${my} · 3P% concédé adv. #${opp}`,
    }),
  },
  {
    kind: "glass",
    label: "GLASS",
    myKey: "orebPct",
    oppKey: "oppOrebPct",
    text: (my, opp) => ({
      ja: `OREB% #${my} · 相手 DREB側 #${opp}`,
      en: `OREB% #${my} · Opp OREB allowed #${opp}`,
      ko: `OREB% #${my} · 상대 OREB 허용 #${opp}`,
      zh: `进攻篮板率 #${my} · 对手进攻篮板被抢 #${opp}`,
      es: `OREB% #${my} · OREB permitido rival #${opp}`,
      pt: `OREB% #${my} · OREB cedido adv. #${opp}`,
      fr: `OREB% #${my} · OREB concédé adv. #${opp}`,
    }),
  },
  {
    kind: "tov",
    label: "TURNOVER",
    myKey: "tovPct",
    oppKey: "oppTov",
    text: (my, opp) => ({
      ja: `TOV% #${my} · 相手強制TO #${opp}`,
      en: `TOV% #${my} · Opp TO forced #${opp}`,
      ko: `TOV% #${my} · 상대 턴오버 유발 #${opp}`,
      zh: `失误率 #${my} · 对手制造失误 #${opp}`,
      es: `TOV% #${my} · Pérdidas forzadas rival #${opp}`,
      pt: `TOV% #${my} · Erros forçados adv. #${opp}`,
      fr: `TOV% #${my} · Pertes provoquées adv. #${opp}`,
    }),
  },
  {
    kind: "fta",
    label: "FREE THROW",
    myKey: "ftaRate",
    oppKey: "oppEfgPct",
    text: (my, opp) => ({
      ja: `FTA率 #${my} · 相手守備 #${opp}`,
      en: `FTA rate #${my} · Opp defense #${opp}`,
      ko: `FTA 비율 #${my} · 상대 수비 #${opp}`,
      zh: `罚球出手率 #${my} · 对手防守 #${opp}`,
      es: `Tasa de TL #${my} · Defensa rival #${opp}`,
      pt: `Taxa de LL #${my} · Defesa adv. #${opp}`,
      fr: `Taux de LF #${my} · Défense adv. #${opp}`,
    }),
  },
  {
    kind: "trans",
    label: "TRANSITION",
    myKey: "ptsFb",
    oppKey: "oppEfgPct",
    text: (my, opp) => ({
      ja: `FB得点 #${my} · 相手守備 #${opp}`,
      en: `FB points #${my} · Opp defense #${opp}`,
      ko: `속공 득점 #${my} · 상대 수비 #${opp}`,
      zh: `快攻得分 #${my} · 对手防守 #${opp}`,
      es: `Pts al contraataque #${my} · Defensa rival #${opp}`,
      pt: `Pts em contra-ataque #${my} · Defesa adv. #${opp}`,
      fr: `Pts en contre-attaque #${my} · Défense adv. #${opp}`,
    }),
  },
  {
    kind: "net",
    label: "NET RATING",
    myKey: "netrtg",
    oppKey: "drtg",
    text: (my, opp) => ({
      ja: `NET #${my} · 相手 DRTG #${opp}`,
      en: `NET #${my} · Opp DRTG #${opp}`,
      ko: `NET #${my} · 상대 DRTG #${opp}`,
      zh: `NET #${my} · 对手 DRTG #${opp}`,
      es: `NET #${my} · DRTG rival #${opp}`,
      pt: `NET #${my} · DRTG adv. #${opp}`,
      fr: `NET #${my} · DRTG adv. #${opp}`,
    }),
  },
  {
    kind: "ortg",
    label: "OFFENSE",
    myKey: "ortg",
    oppKey: "drtg",
    text: (my, opp) => ({
      ja: `ORTG #${my} · 相手 DRTG #${opp}`,
      en: `ORTG #${my} · Opp DRTG #${opp}`,
      ko: `ORTG #${my} · 상대 DRTG #${opp}`,
      zh: `ORTG #${my} · 对手 DRTG #${opp}`,
      es: `ORTG #${my} · DRTG rival #${opp}`,
      pt: `ORTG #${my} · DRTG adv. #${opp}`,
      fr: `ORTG #${my} · DRTG adv. #${opp}`,
    }),
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

  const phase: InsightPhase = input.priorPrefix ? "prior" : "current";
  const fold: InjuryFoldOpts = {
    teamId: input.teamId,
    aceOut: input.aceOut,
    aceOutPhase: phase,
  };

  const out: EdgeCandidate[] = [];
  for (const def of CLASH_DEFS) {
    const myRank = ranks.get(def.myKey)?.get(input.teamId);
    const oppRank = ranks.get(def.oppKey)?.get(input.opponentId);
    let score = clashScore(myRank, oppRank);
    if (myRank == null || oppRank == null) continue;
    if (score < 6 && pickTopInjuries(input.injuries).length === 0) continue;

    const base = input.priorPrefix
      ? joinUiStrings([PHASE_WORD.prior, def.text(myRank, oppRank)], " ")
      : def.text(myRank, oppRank);
    const folded = withInjurySuffix(base, input.injuries, fold);
    score += folded.injuryBoost;
    if (score < 6) continue;

    out.push({
      kind: def.kind,
      score,
      ...proBriefEdge(def.label, folded.detail),
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
  phase: InsightPhase;
  aceOut?: NbaTeamAceOutRecordsBundle | null;
}): EdgeCandidate[] {
  const split = input.records?.teams[input.teamId];
  const venue = input.isHome ? split?.home : split?.away;
  const netRank = rankTeamsByMetric(input.seasonRows, "netrtg").get(input.teamId);
  const label = input.isHome ? "HOME COURT" : "ROAD FORM";
  const minGames = input.phase === "current" ? 2 : 5;
  const netPart = netRank != null ? `NetRtg #${netRank}` : null;
  const fold: InjuryFoldOpts = {
    teamId: input.teamId,
    aceOut: input.aceOut,
    aceOutPhase: input.phase,
  };

  if (venue && wlTotal(venue) >= minGames) {
    const base = joinUiStrings([
      joinUiStrings(
        [PHASE_WORD[input.phase], venueWord(input.isHome), formatWl(venue)],
        " "
      ),
      netPart,
    ]);
    const folded = withInjurySuffix(base, input.injuries, fold);
    return [
      {
        kind: "venue",
        score: 14 + folded.injuryBoost,
        ...proBriefEdge(label, folded.detail),
      },
    ];
  }

  if (input.phase === "prior") {
    const row = findTeamRow(input.seasonRows, input.teamId);
    if (!row) return [];
    const base = joinUiStrings([
      joinUiStrings([PHASE_WORD.prior, `${row.wins}-${row.losses}`], " "),
      netPart,
    ]);
    const folded = withInjurySuffix(base, input.injuries, fold);
    return [
      {
        kind: "venue",
        score: 10 + folded.injuryBoost,
        ...proBriefEdge(label, folded.detail),
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
  phase: InsightPhase;
}): EdgeCandidate | null {
  if (!input.records) return null;
  const pair = input.records.h2h[h2hPairKey(input.teamId, input.opponentId)];
  const from = h2hFromPerspective(pair, input.teamId);
  if (!from || wlTotal(from.overall) <= 0) return null;

  const overall = formatWl(from.overall);
  const venue = input.isHome ? from.atHome : from.atAway;
  if (wlTotal(venue) > 0) {
    const here = formatWl(venue);
    return {
      kind: "h2h",
      score: 16,
      ...proBriefEdge(
        "H2H",
        joinUiStrings([
          PHASE_WORD[input.phase],
          {
            ja: `この会場 ${here} · シリーズ ${overall}`,
            en: `here ${here} · series ${overall}`,
            ko: `이 경기장 ${here} · 시리즈 ${overall}`,
            zh: `该球馆 ${here} · 系列赛 ${overall}`,
            es: `aquí ${here} · serie ${overall}`,
            pt: `aqui ${here} · série ${overall}`,
            fr: `ici ${here} · série ${overall}`,
          },
        ], " ")
      ),
    };
  }
  return {
    kind: "h2h",
    score: 15,
    ...proBriefEdge(
      "H2H",
      joinUiStrings([PHASE_WORD[input.phase], `H2H ${overall}`], " ")
    ),
  };
}

function buildVsTopEdge(input: {
  records: NbaTeamSeasonRecordsBundle | null;
  seasonRows: NbaLeagueTeamStatRow[];
  teamId: string;
  isHome: boolean;
  phase: InsightPhase;
}): EdgeCandidate | null {
  const split = input.records?.teams[input.teamId];
  const row = findTeamRow(input.seasonRows, input.teamId);
  const conf = row?.conference === "west" ? "WEST" : "EAST";
  const minGames = input.phase === "current" ? 2 : 3;

  if (split) {
    const venueTop = input.isHome ? split.vsConfTop6Home : split.vsConfTop6Away;
    const use = wlTotal(venueTop) >= minGames ? venueTop : split.vsConfTop6;
    if (wlTotal(use) >= minGames) {
      return {
        kind: "vsTop",
        score: 13,
        ...proBriefEdge(
          "VS TOP",
          vsConfTopLine({
            phase: input.phase,
            conference: conf,
            isHome: input.isHome,
            record: formatWl(use),
          })
        ),
      };
    }
  }
  return null;
}

function buildVs500Edges(input: {
  records: NbaTeamSeasonRecordsBundle | null;
  teamId: string;
  phase: InsightPhase;
}): EdgeCandidate[] {
  const split = input.records?.teams[input.teamId];
  if (!split) return [];
  const out: EdgeCandidate[] = [];
  const minGames = input.phase === "current" ? 3 : 5;

  if (wlTotal(split.vsOver500) >= minGames) {
    const pct = Math.round(
      (split.vsOver500.wins / wlTotal(split.vsOver500)) * 100
    );
    out.push({
      kind: "vsOver500",
      score: 11 + Math.max(0, pct - 45) / 5,
      ...proBriefEdge(
        "VS .500+",
        vsOver500Line({
          phase: input.phase,
          record: formatWl(split.vsOver500),
          winPct: pct,
        })
      ),
    });
  }

  if (wlTotal(split.vsUnder500) >= minGames) {
    const pct = Math.round(
      (split.vsUnder500.wins / wlTotal(split.vsUnder500)) * 100
    );
    out.push({
      kind: "vsUnder500",
      score: 10 + Math.max(0, pct - 60) / 5,
      ...proBriefEdge(
        "VS SUB-.500",
        vsUnder500Line({
          phase: input.phase,
          record: formatWl(split.vsUnder500),
          winPct: pct,
        })
      ),
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
      phase: "prior",
    });
    if (h2h) candidates.push(h2h);
    candidates.push(
      ...buildVenueRecordEdge({
        seasonRows: prior,
        records,
        teamId: input.teamId,
        isHome: input.isHome,
        injuries: input.injuries,
        phase: "prior",
        aceOut,
      }),
      ...buildVs500Edges({
        records,
        teamId: input.teamId,
        phase: "prior",
      })
    );
    const vsTop = buildVsTopEdge({
      records,
      seasonRows: prior,
      teamId: input.teamId,
      isHome: input.isHome,
      phase: "prior",
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
      phase: "current",
    });
    if (h2h) candidates.push(h2h);
    candidates.push(
      ...buildVenueRecordEdge({
        seasonRows: input.seasonRows,
        records,
        teamId: input.teamId,
        isHome: input.isHome,
        injuries: input.injuries,
        phase: "current",
        aceOut,
      }),
      ...buildVs500Edges({
        records,
        teamId: input.teamId,
        phase: "current",
      })
    );
    const vsTop = buildVsTopEdge({
      records,
      seasonRows: input.seasonRows,
      teamId: input.teamId,
      isHome: input.isHome,
      phase: "current",
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
    .map(({ label, detailJa, detailEn, detail }) => ({
      label,
      detailJa,
      detailEn,
      detail,
    }));
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
