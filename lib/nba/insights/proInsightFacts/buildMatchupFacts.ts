/**
 * MATCHUP ファクト候補（試合全体で競合 → 後段で cap 2）。
 * Tier1 脆い → Tier2 多く許す → Tier3 いちばん差（試合単位カスケード）。
 * 欠場は型オーナー（leaders Top2）× mpg≥25 のみ。攻め weakening / 守り amplify。
 */
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import {
  rankTeamsByMetric,
  type RankedMetricKey,
} from "@/lib/nba/insights/rankTeamMetrics";
import type { NbaTeamAceOutRecordsBundle } from "@/lib/nba/insights/aceOutRecordTypes";
import {
  aceOutOffDefDeltas,
  findAceOutForInjuryWithTeam,
} from "@/lib/nba/insights/aceOutInsight";
import {
  clashScore,
  nearClashScore,
  edgeClashScore,
  edgeGap,
  classifyClashTier,
  type ClashTier,
} from "@/lib/nba/insights/proInsightFacts/clashScore";
import { findStyleOwnerInjury } from "@/lib/nba/insights/proInsightFacts/clashStyleOwner";
import { MATCHUP_INJURY_MIN_MPG } from "@/lib/nba/insights/proInsightFacts/matchupInjuryMpg";
import type { ProInsightFact } from "@/lib/nba/insights/proInsightFacts/types";
import type { ProBriefPhase } from "@/lib/predict/predictProBrief";
import type { NbaPlayerStatLeadersBundle } from "@/lib/predict/nbaPlayerStatLeadersMocks";
import { proInsightTeamAbbr } from "@/lib/nba/insights/proInsightFacts/teamAbbr";

export { MATCHUP_INJURY_MIN_MPG };

type ClashDef = {
  kind: string;
  label: string;
  myKey: RankedMetricKey;
  oppKey: RankedMetricKey;
};

const CLASH_DEFS: ClashDef[] = [
  { kind: "paint", label: "PAINT", myKey: "ptsPaint", oppKey: "oppPtsPaint" },
  { kind: "fb", label: "FAST BREAK", myKey: "ptsFb", oppKey: "oppPtsFb" },
  {
    kind: "off_tov",
    label: "PTS OFF TO",
    myKey: "ptsTov",
    oppKey: "oppPtsOffTov",
  },
  {
    kind: "second",
    label: "SECOND CHANCE",
    myKey: "ptsSecondChance",
    oppKey: "oppPtsSecondChance",
  },
  { kind: "three", label: "THREE", myKey: "fg3a", oppKey: "oppFg3Pct" },
  { kind: "glass", label: "GLASS", myKey: "orebPct", oppKey: "oppOrebPct" },
  { kind: "tov", label: "TOV", myKey: "tovPct", oppKey: "oppTov" },
  { kind: "fta", label: "FTA", myKey: "ftaRate", oppKey: "oppFtaRate" },
];

const PLAYTYPE_DEFS = [
  { kind: "iso", label: "ISO", freqKey: "isoFreq", pppKey: "isoPpp" },
  { kind: "pnr", label: "PNR", freqKey: "pnrBhFreq", pppKey: "pnrBhPpp" },
  { kind: "post", label: "POST", freqKey: "postFreq", pppKey: "postPpp" },
  { kind: "spotup", label: "SPOTUP", freqKey: "spotupFreq", pppKey: "spotupPpp" },
] as const;

type RawClashHit = {
  tier: ClashTier;
  def: ClashDef;
  attackTeamId: string;
  defendTeamId: string;
  myRank: number;
  oppRank: number;
  gap: number;
  baseScore: number;
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

function injuryStatus(
  entry: NbaTeamInjuryEntry
): ProInsightFact["players"][number]["status"] {
  if (entry.status === "out" || entry.status === "doubtful") return "out";
  if (entry.status === "questionable") return "questionable";
  return String(entry.status);
}

function skillWord(def: ClashDef): string {
  return def.label.toLowerCase();
}

/** 守備側・失点側の言い方（攻めの LABEL と混同しない） */
function defendSkillPhrase(def: ClashDef): string {
  switch (def.kind) {
    case "paint":
      return "paint defense";
    case "fb":
      return "fast-break defense";
    case "off_tov":
      return "points off turnovers allowed";
    case "second":
      return "second-chance defense";
    case "three":
      return "three-point defense";
    case "glass":
      return "offensive-glass defense";
    case "tov":
      return "turnover forcing";
    case "fta":
      return "free-throw rate defense";
    default:
      return `${skillWord(def)} defense`;
  }
}

function strengthHintEn(input: {
  tier: ClashTier;
  attackAbbr: string;
  defendAbbr: string;
  def: ClashDef;
  myRank: number;
  oppRank: number;
}): string {
  const defendSkill = defendSkillPhrase(input.def);
  if (input.tier === 1) {
    return `${input.attackAbbr} ${input.def.label} (#${input.myRank}) looks like a good matchup against ${input.defendAbbr}'s vulnerable ${defendSkill} (#${input.oppRank}).`;
  }
  if (input.tier === 2) {
    return `${input.attackAbbr} ${input.def.label} (#${input.myRank}) looks like a good matchup against a ${input.defendAbbr} side that gives up a lot on ${defendSkill} (#${input.oppRank}).`;
  }
  return `Clearest favorable matchup: ${input.attackAbbr} ${input.def.label} (#${input.myRank}) vs ${input.defendAbbr} ${defendSkill} (#${input.oppRank}).`;
}

function weakenSuffix(injury: NbaTeamInjuryEntry): string {
  return ` ${shortName(injury)} is ${injuryStatus(injury)} — treat as uncertain edge.`;
}

function amplifySuffix(input: {
  tier: ClashTier;
  injury: NbaTeamInjuryEntry;
  skill: string;
}): string {
  const st = injuryStatus(input.injury);
  const name = shortName(input.injury);
  if (input.tier === 1) {
    return ` Even more vulnerable with ${name} ${st}.`;
  }
  if (input.tier === 2) {
    return ` Even weaker on ${input.skill} with ${name} ${st}.`;
  }
  return ` Edge widens with ${name} ${st}.`;
}

function appendAceMetrics(input: {
  metrics: ProInsightFact["metrics"];
  attackTeamId: string;
  injury: NbaTeamInjuryEntry;
  aceOut: NbaTeamAceOutRecordsBundle | null | undefined;
}): void {
  const aceHit = findAceOutForInjuryWithTeam(
    input.aceOut,
    input.attackTeamId,
    input.injury
  );
  if (!aceHit) return;
  const deltas = aceOutOffDefDeltas(aceHit.player, aceHit.team);
  if (deltas) {
    if (Math.abs(deltas.off) >= 1) {
      input.metrics.push({
        key: "aceOutOffDelta",
        value: String(deltas.off),
        rank: null,
        teamId: input.attackTeamId,
      });
    }
    if (Math.abs(deltas.def) >= 1) {
      input.metrics.push({
        key: "aceOutDefDelta",
        value: String(deltas.def),
        rank: null,
        teamId: input.attackTeamId,
      });
    }
  }
  input.metrics.push({
    key: "aceOutWl",
    value: `${aceHit.player.whenOut.wins}-${aceHit.player.whenOut.losses}`,
    rank: null,
    teamId: input.attackTeamId,
  });
}

function materializeClashFact(input: {
  hit: RawClashHit;
  attackInjuries: NbaTeamInjuryEntry[];
  defendInjuries: NbaTeamInjuryEntry[];
  aceOut: NbaTeamAceOutRecordsBundle | null | undefined;
  leaders: NbaPlayerStatLeadersBundle | null | undefined;
  mpgByPlayerId?: Record<string, number> | null;
}): ProInsightFact {
  const { hit } = input;
  const attackAbbr = proInsightTeamAbbr(hit.attackTeamId);
  const defendAbbr = proInsightTeamAbbr(hit.defendTeamId);
  const skill = defendSkillPhrase(hit.def);

  const attackInjury = findStyleOwnerInjury({
    kind: hit.def.kind,
    teamId: hit.attackTeamId,
    injuries: input.attackInjuries,
    leaders: input.leaders,
    mpgByPlayerId: input.mpgByPlayerId,
  });
  const defendInjury = findStyleOwnerInjury({
    kind: hit.def.kind,
    teamId: hit.defendTeamId,
    injuries: input.defendInjuries,
    leaders: input.leaders,
    mpgByPlayerId: input.mpgByPlayerId,
  });

  let score = hit.baseScore;
  let hint = strengthHintEn({
    tier: hit.tier,
    attackAbbr,
    defendAbbr,
    def: hit.def,
    myRank: hit.myRank,
    oppRank: hit.oppRank,
  });

  const metrics: ProInsightFact["metrics"] = [
    {
      key: hit.def.myKey,
      value: `#${hit.myRank}`,
      rank: hit.myRank,
      teamId: hit.attackTeamId,
    },
    {
      key: hit.def.oppKey,
      value: `#${hit.oppRank}`,
      rank: hit.oppRank,
      teamId: hit.defendTeamId,
    },
  ];

  const players: ProInsightFact["players"] = [];
  const dedupeKeys = [`clash:${hit.def.kind}`];
  let mode: NonNullable<ProInsightFact["mode"]> = "strength";
  let kindSuffix = "";
  let idPrefix = "str";

  if (attackInjury) {
    const isOut =
      attackInjury.status === "out" || attackInjury.status === "doubtful";
    score += isOut ? 8 : 5;
    hint += weakenSuffix(attackInjury);
    players.push({
      playerId: String(attackInjury.playerId ?? ""),
      playerName: shortName(attackInjury),
      status: injuryStatus(attackInjury),
    });
    dedupeKeys.push(
      `injury:${attackInjury.playerId ?? shortName(attackInjury)}`
    );
    appendAceMetrics({
      metrics,
      attackTeamId: hit.attackTeamId,
      injury: attackInjury,
      aceOut: input.aceOut,
    });
    mode = "weakening";
    kindSuffix = "_weak";
    idPrefix = "weak";
  }

  if (defendInjury) {
    const isOut =
      defendInjury.status === "out" || defendInjury.status === "doubtful";
    score += isOut ? 6 : 4;
    hint += amplifySuffix({
      tier: hit.tier,
      injury: defendInjury,
      skill,
    });
    players.push({
      playerId: String(defendInjury.playerId ?? ""),
      playerName: shortName(defendInjury),
      status: injuryStatus(defendInjury),
    });
    dedupeKeys.push(
      `injury:${defendInjury.playerId ?? shortName(defendInjury)}`
    );
    if (mode === "strength") {
      mode = "amplify";
      kindSuffix = "_amp";
      idPrefix = "amp";
    }
  }

  const tierTag = hit.tier === 1 ? "" : hit.tier === 2 ? "_near" : "_edge";

  return {
    id: `matchup:${idPrefix}:${hit.def.kind}:${hit.attackTeamId}`,
    section: "MATCHUP",
    kind: `clash_${hit.def.kind}${tierTag}${kindSuffix}`,
    score,
    teamIds: [hit.attackTeamId, hit.defendTeamId],
    label: hit.def.label,
    metrics,
    players,
    mode,
    dedupeKeys,
    hintEn: hint,
  };
}

function collectClashHits(input: {
  rows: NbaLeagueTeamStatRow[];
  attackTeamId: string;
  defendTeamId: string;
}): RawClashHit[] {
  const ranks = new Map<RankedMetricKey, Map<string, number>>();
  for (const def of CLASH_DEFS) {
    if (!ranks.has(def.myKey)) {
      ranks.set(def.myKey, rankTeamsByMetric(input.rows, def.myKey));
    }
    if (!ranks.has(def.oppKey)) {
      ranks.set(def.oppKey, rankTeamsByMetric(input.rows, def.oppKey));
    }
  }

  const out: RawClashHit[] = [];
  for (const def of CLASH_DEFS) {
    const myRank = ranks.get(def.myKey)?.get(input.attackTeamId);
    const oppRank = ranks.get(def.oppKey)?.get(input.defendTeamId);
    if (myRank == null || oppRank == null) continue;
    const tier = classifyClashTier(myRank, oppRank);
    if (tier == null) continue;
    const baseScore =
      tier === 1
        ? clashScore(myRank, oppRank) + 20
        : tier === 2
          ? nearClashScore(myRank, oppRank) + 10
          : edgeClashScore(myRank, oppRank);
    out.push({
      tier,
      def,
      attackTeamId: input.attackTeamId,
      defendTeamId: input.defendTeamId,
      myRank,
      oppRank,
      gap: edgeGap(myRank, oppRank),
      baseScore,
    });
  }
  return out;
}

function rankPlaytype(
  rows: NbaLeagueTeamStatRow[],
  key: string,
  higherIsBetter: boolean
): Map<string, number> {
  const scored = rows
    .map((r) => {
      const v = (r as Record<string, unknown>)[key];
      if (typeof v !== "number" || !Number.isFinite(v)) return null;
      return { teamId: r.teamId, value: v };
    })
    .filter((x): x is { teamId: string; value: number } => x != null);
  scored.sort((a, b) =>
    higherIsBetter ? b.value - a.value : a.value - b.value
  );
  const out = new Map<string, number>();
  let prev: number | null = null;
  let rank = 0;
  scored.forEach((row, i) => {
    if (prev == null || row.value !== prev) {
      rank = i + 1;
      prev = row.value;
    }
    out.set(row.teamId, rank);
  });
  return out;
}

function playtypeFactsForTeam(input: {
  rows: NbaLeagueTeamStatRow[];
  teamId: string;
  opponentId: string;
  injuries: NbaTeamInjuryEntry[];
  leaders: NbaPlayerStatLeadersBundle | null | undefined;
  mpgByPlayerId?: Record<string, number> | null;
}): ProInsightFact[] {
  const out: ProInsightFact[] = [];

  for (const def of PLAYTYPE_DEFS) {
    const freqRanks = rankPlaytype(input.rows, def.freqKey, true);
    const pppRanks = rankPlaytype(input.rows, def.pppKey, true);
    const freqRank = freqRanks.get(input.teamId);
    const pppRank = pppRanks.get(input.teamId);
    if (freqRank == null || pppRank == null) continue;
    if (freqRank > 8 || pppRank > 16) continue;

    const injury = findStyleOwnerInjury({
      kind: def.kind,
      teamId: input.teamId,
      injuries: input.injuries,
      leaders: input.leaders,
      mpgByPlayerId: input.mpgByPlayerId,
    });
    if (!injury) continue;
    const isOut =
      injury.status === "out" || injury.status === "doubtful";
    if (!isOut && injury.status !== "questionable") continue;

    let score =
      Math.max(0, 12 - freqRank) +
      Math.max(0, 10 - Math.floor(pppRank / 2));
    score += isOut ? 6 : 3;

    out.push({
      id: `matchup:pt:weak:${def.kind}:${input.teamId}`,
      section: "MATCHUP",
      kind: `playtype_${def.kind}_weak`,
      score,
      teamIds: [input.teamId, input.opponentId],
      label: def.label,
      metrics: [
        {
          key: def.freqKey,
          value: `#${freqRank}`,
          rank: freqRank,
          teamId: input.teamId,
        },
        {
          key: def.pppKey,
          value: `#${pppRank}`,
          rank: pppRank,
          teamId: input.teamId,
        },
      ],
      players: [
        {
          playerId: String(injury.playerId ?? ""),
          playerName: shortName(injury),
          status: injuryStatus(injury),
        },
      ],
      mode: "weakening",
      dedupeKeys: [
        `playtype:${def.kind}`,
        `injury:${injury.playerId ?? shortName(injury)}`,
      ],
      hintEn: `${proInsightTeamAbbr(input.teamId)} leans on ${def.label} (freq #${freqRank}, PPP #${pppRank}) but ${shortName(injury)} is ${injuryStatus(injury)} — style may thin vs ${proInsightTeamAbbr(input.opponentId)}.`,
    });
  }
  return out;
}

function injuriesForTeam(
  homeTeamId: string,
  awayTeamId: string,
  homeInjuries: NbaTeamInjuryEntry[],
  awayInjuries: NbaTeamInjuryEntry[],
  teamId: string
): NbaTeamInjuryEntry[] {
  if (teamId === homeTeamId) return homeInjuries;
  if (teamId === awayTeamId) return awayInjuries;
  return [];
}

export function buildMatchupFactCandidates(input: {
  phase: ProBriefPhase;
  seasonRows: NbaLeagueTeamStatRow[];
  /** opening は前季行を渡す */
  priorRows?: NbaLeagueTeamStatRow[] | null;
  homeTeamId: string;
  awayTeamId: string;
  homeInjuries: NbaTeamInjuryEntry[];
  awayInjuries: NbaTeamInjuryEntry[];
  aceOutRecords?: NbaTeamAceOutRecordsBundle | null;
  /** ロスター平均出場。MATCHUP 欠場は mpg ≥ 25 のみ */
  mpgByPlayerId?: Record<string, number> | null;
  /** 型オーナー判定用（無ければ欠場は MATCHUP に折り込まない） */
  playerLeaders?: NbaPlayerStatLeadersBundle | null;
}): ProInsightFact[] {
  const rows =
    input.phase === "opening" && input.priorRows && input.priorRows.length > 0
      ? input.priorRows
      : input.seasonRows;
  const mpg = input.mpgByPlayerId ?? null;
  const leaders = input.playerLeaders ?? null;

  const allHits = [
    ...collectClashHits({
      rows,
      attackTeamId: input.homeTeamId,
      defendTeamId: input.awayTeamId,
    }),
    ...collectClashHits({
      rows,
      attackTeamId: input.awayTeamId,
      defendTeamId: input.homeTeamId,
    }),
  ];

  const tier1 = allHits.filter((h) => h.tier === 1);
  const tier2 = allHits.filter((h) => h.tier === 2);
  const tier3 = allHits.filter((h) => h.tier === 3);

  let selected: RawClashHit[] = [];
  if (tier1.length > 0) {
    selected = tier1;
  } else if (tier2.length > 0) {
    selected = tier2;
  } else if (tier3.length > 0) {
    tier3.sort((a, b) => {
      if (b.gap !== a.gap) return b.gap - a.gap;
      if (a.myRank !== b.myRank) return a.myRank - b.myRank;
      return a.def.kind.localeCompare(b.def.kind);
    });
    selected = [tier3[0]!];
  }

  const clashFacts = selected.map((hit) =>
    materializeClashFact({
      hit,
      attackInjuries: injuriesForTeam(
        input.homeTeamId,
        input.awayTeamId,
        input.homeInjuries,
        input.awayInjuries,
        hit.attackTeamId
      ),
      defendInjuries: injuriesForTeam(
        input.homeTeamId,
        input.awayTeamId,
        input.homeInjuries,
        input.awayInjuries,
        hit.defendTeamId
      ),
      aceOut: input.aceOutRecords,
      leaders,
      mpgByPlayerId: mpg,
    })
  );

  const playtype = [
    ...playtypeFactsForTeam({
      rows,
      teamId: input.homeTeamId,
      opponentId: input.awayTeamId,
      injuries: input.homeInjuries,
      leaders,
      mpgByPlayerId: mpg,
    }),
    ...playtypeFactsForTeam({
      rows,
      teamId: input.awayTeamId,
      opponentId: input.homeTeamId,
      injuries: input.awayInjuries,
      leaders,
      mpgByPlayerId: mpg,
    }),
  ];

  return [...clashFacts, ...playtype];
}
