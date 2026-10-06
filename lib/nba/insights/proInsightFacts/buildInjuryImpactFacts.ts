/**
 * INJURY IMPACT ファクト（試合全体 cap 2）。
 * 材料: ace-out（当該 teamId）OR shape（leaders Top2）OR 欠場の影響（nbaPlayerOutImpact）が −1.5 点以下。ただの OUT は出さない。
 * 队友バンプ／役割増加の予測はしない。
 */
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import { isOutOrQuestionableInjury } from "@/lib/nba/teamInjuries/injuryStatusDisplay";
import type { NbaTeamAceOutRecordsBundle } from "@/lib/nba/insights/aceOutRecordTypes";
import {
  aceOutOffDefDeltas,
  findAceOutForInjuryWithTeam,
  ACE_OUT_MIN_GAMES,
  ACE_OUT_DELTA_MIN,
} from "@/lib/nba/insights/aceOutInsight";
import { formatWl } from "@/lib/nba/insights/priorSeasonRecordTypes";
import type { NbaPlayerStatLeadersBundle } from "@/lib/predict/nbaPlayerStatLeadersMocks";
import {
  resolveInjuryShapeImpact,
  type InjuryShapeImpact,
} from "@/lib/nba/insights/proInsightFacts/injuryShapeRoles";
import { MATCHUP_INJURY_MIN_MPG } from "@/lib/nba/insights/proInsightFacts/matchupInjuryMpg";
import type { ProInsightFact } from "@/lib/nba/insights/proInsightFacts/types";
import type { ProBriefPhase } from "@/lib/predict/predictProBrief";
import { proInsightTeamAbbr } from "@/lib/nba/insights/proInsightFacts/teamAbbr";
import type { NbaInjuryOutImpact } from "@/lib/nba/matchupDifficulty/injuryAdjustedDifficulty";
import type { NbaPlayerOutImpactBundle } from "@/lib/nba/injuryImpact/playerOutImpactTypes";
import {
  resolvePlayerOutImpact,
  type ResolvedPlayerOutImpact,
} from "@/lib/nba/injuryImpact/resolvePlayerOutImpact";
import { isLongTermInjury } from "@/lib/nba/insights/proInsightFacts/longTermInjury";

/** ace-out / shape が無くても、この点以上チームが弱くなる欠場は INJURY IMPACT に出す */
const OUT_IMPACT_FACT_MIN = -1.5;

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

function statusOf(
  entry: NbaTeamInjuryEntry
): NonNullable<ProInsightFact["players"][number]["status"]> {
  if (entry.status === "out" || entry.status === "doubtful") return "out";
  if (entry.status === "questionable") return "questionable";
  return String(entry.status);
}

function cleanStyleKind(kind: string): string {
  return kind
    .replace(/^clash_/, "")
    .replace(/^playtype_/, "")
    .replace(/_(weak|amp)$/, "")
    .replace(/_(near|edge)$/, "");
}

function formatSignedDelta(n: number): string {
  if (n > 0) return `+${n}`;
  return String(n);
}

function shapeHasTeamRank1(shape: InjuryShapeImpact): boolean {
  return shape.metrics.some(
    (m) => m.key.endsWith("TeamRank") && String(m.value) === "#1"
  );
}

/**
 * shape のみ経路: mpg ≥ 25。不明時は team rank #1 があるときだけ。
 * ace 付きのときは呼び出し側でゲートしない。
 */
function shapeForShapeOnlyPath(
  shape: InjuryShapeImpact | null,
  mpgByPlayerId: Record<string, number> | null | undefined,
  playerId: string
): InjuryShapeImpact | null {
  if (!shape) return null;
  const m = playerId ? mpgByPlayerId?.[playerId] : undefined;
  if (m != null && Number.isFinite(m)) {
    return m >= MATCHUP_INJURY_MIN_MPG ? shape : null;
  }
  return shapeHasTeamRank1(shape) ? shape : null;
}

function injuryOutImpactOf(input: {
  injury: NbaTeamInjuryEntry;
  teamId: string;
  outImpact: ResolvedPlayerOutImpact;
  tipAtMs?: number;
  whenOutWl?: string;
}): NbaInjuryOutImpact | null {
  const status = statusOf(input.injury);
  if (status !== "out" && status !== "questionable") return null;
  const longTerm =
    input.tipAtMs != null && isLongTermInjury(input.injury, input.tipAtMs);
  return {
    teamId: input.teamId,
    playerName: shortName(input.injury),
    status,
    // 欠場でチームが強くなる方向はノイズとみなし 0 止まり
    netDelta: Math.min(0, input.outImpact.impact),
    fullDelta: Math.min(0, input.outImpact.fullImpact),
    gamesOut: input.outImpact.gamesOut,
    seasonKey: input.outImpact.seasonKey,
    ...(longTerm ? { longTerm } : {}),
    ...(input.whenOutWl ? { whenOutWl: input.whenOutWl } : {}),
  };
}

/**
 * LLM 用ファクトから外した長期離脱（チームが 3 試合以上彼抜き）も、
 * 厳しさテンプレには織り込み済みを除いた影響で残す。
 */
export function buildLongTermOutImpacts(input: {
  phase: ProBriefPhase;
  teamId: string;
  staleInjuries: NbaTeamInjuryEntry[];
  tipAtMs: number;
  outImpact?: NbaPlayerOutImpactBundle | null;
  priorOutImpact?: NbaPlayerOutImpactBundle | null;
}): NbaInjuryOutImpact[] {
  const out: NbaInjuryOutImpact[] = [];
  for (const injury of input.staleInjuries) {
    const resolved = resolvePlayerOutImpact({
      phase: input.phase,
      teamId: input.teamId,
      playerId: String(injury.playerId ?? "").trim(),
      current: input.outImpact,
      prior: input.priorOutImpact,
    });
    if (!resolved || resolved.impact >= 0) continue;
    const impact = injuryOutImpactOf({
      injury,
      teamId: input.teamId,
      outImpact: resolved,
      tipAtMs: input.tipAtMs,
    });
    if (impact) out.push({ ...impact, longTerm: true });
  }
  return out;
}

type AceHit = NonNullable<ReturnType<typeof findAceOutForInjuryWithTeam>>;

function qualifyingAceHit(
  bundle: NbaTeamAceOutRecordsBundle | null | undefined,
  teamId: string,
  injury: NbaTeamInjuryEntry
): AceHit | null {
  const hit = findAceOutForInjuryWithTeam(bundle, teamId, injury);
  if (!hit) return null;
  if (hit.player.gamesOut < ACE_OUT_MIN_GAMES) return null;
  return hit;
}

/**
 * opening → primary（prior）のみ。
 * early → 同 teamId の前季 → 今季（数試合の今季 W–L より前季を優先）。
 * full → 今季 → 同 teamId の前季フォールバック（移籍先に prior 行が無ければ null）。
 */
function resolveAceOutForInjury(input: {
  phase: ProBriefPhase;
  teamId: string;
  injury: NbaTeamInjuryEntry;
  aceOut: NbaTeamAceOutRecordsBundle | null | undefined;
  priorAceOut: NbaTeamAceOutRecordsBundle | null | undefined;
}): { hit: AceHit; season: "prior" | "current" } | null {
  if (input.phase === "early") {
    const prior = qualifyingAceHit(input.priorAceOut, input.teamId, input.injury);
    if (prior) return { hit: prior, season: "prior" };
    const current = qualifyingAceHit(input.aceOut, input.teamId, input.injury);
    return current ? { hit: current, season: "current" } : null;
  }
  const primary = qualifyingAceHit(input.aceOut, input.teamId, input.injury);
  if (primary) {
    return {
      hit: primary,
      season: input.phase === "opening" ? "prior" : "current",
    };
  }
  if (input.phase === "opening") return null;
  const prior = qualifyingAceHit(
    input.priorAceOut,
    input.teamId,
    input.injury
  );
  if (!prior) return null;
  return { hit: prior, season: "prior" };
}

function teamInjuryFacts(input: {
  teamId: string;
  injuries: NbaTeamInjuryEntry[];
  aceOut: NbaTeamAceOutRecordsBundle | null | undefined;
  priorAceOut: NbaTeamAceOutRecordsBundle | null | undefined;
  leaders: NbaPlayerStatLeadersBundle | null | undefined;
  phase: ProBriefPhase;
  mpgByPlayerId?: Record<string, number> | null;
  /** 型オーナーとして MATCHUP 候補に折り込まれた型（選手単位） */
  stylesByPlayerId: Record<string, string[]>;
  outImpact: NbaPlayerOutImpactBundle | null | undefined;
  priorOutImpact: NbaPlayerOutImpactBundle | null | undefined;
  tipAtMs?: number;
}): ProInsightFact[] {
  const list = input.injuries.filter((i) =>
    isOutOrQuestionableInjury(i.status)
  );
  if (list.length === 0) return [];

  const outs = list.filter(
    (i) => i.status === "out" || i.status === "doubtful"
  );
  const impactOf = (injury: NbaTeamInjuryEntry) =>
    resolvePlayerOutImpact({
      phase: input.phase,
      teamId: input.teamId,
      playerId: String(injury.playerId ?? "").trim(),
      current: input.outImpact,
      prior: input.priorOutImpact,
    });
  // 影響の大きい欠場から見る
  const pool = (outs.length > 0 ? outs : list)
    .map((injury) => ({ injury, outImpact: impactOf(injury) }))
    .sort((a, b) => (a.outImpact?.impact ?? 0) - (b.outImpact?.impact ?? 0));
  const facts: ProInsightFact[] = [];

  for (const { injury, outImpact } of pool.slice(0, 3)) {
    const playerId = String(injury.playerId ?? "").trim();
    const resolved = resolveAceOutForInjury({
      phase: input.phase,
      teamId: input.teamId,
      injury,
      aceOut: input.aceOut,
      priorAceOut: input.priorAceOut,
    });
    const hit = resolved?.hit ?? null;
    const aceSeason = resolved?.season ?? null;

    const rawShape = resolveInjuryShapeImpact({
      teamId: input.teamId,
      playerId,
      leaders: input.leaders,
    });

    // ace あり → shape は mpg ゲートなし。shape のみ → mpg / #1 ゲート
    const shape = hit
      ? rawShape
      : shapeForShapeOnlyPath(rawShape, input.mpgByPlayerId, playerId);

    const impactQualifies =
      outImpact != null && outImpact.impact <= OUT_IMPACT_FACT_MIN;
    if (!hit && !shape && !impactQualifies) continue;

    const metrics: ProInsightFact["metrics"] = [
      {
        key: "status",
        value: statusOf(injury) ?? "out",
        teamId: input.teamId,
      },
    ];
    let score = statusOf(injury) === "out" ? 16 : 12;
    const status = statusOf(injury);
    const name = shortName(injury);
    const team = proInsightTeamAbbr(input.teamId);

    let impactClause = "";
    if (outImpact && outImpact.impact < 0) {
      metrics.push({
        key: "outImpact",
        value: String(outImpact.impact),
        teamId: input.teamId,
      });
      metrics.push({
        key: "outImpactSeason",
        value: outImpact.seasonKey,
        teamId: input.teamId,
      });
      score += Math.round(Math.abs(outImpact.impact) * 2);
      impactClause = ` Model (${outImpact.seasonKey}): ${team} about ${Math.abs(outImpact.impact)} pts/game weaker without him.`;
    }

    let whenOutClause = "";
    if (hit && aceSeason) {
      metrics.push({
        key: "aceOutWl",
        value: formatWl(hit.player.whenOut),
        teamId: input.teamId,
      });
      metrics.push({
        key: "aceOutPts",
        value: `${hit.player.whenOutPtsFor}-${hit.player.whenOutPtsAgainst}`,
        teamId: input.teamId,
      });
      metrics.push({
        key: "aceOutSeason",
        value: aceSeason,
        teamId: input.teamId,
      });
      const deltas = aceOutOffDefDeltas(hit.player, hit.team);
      const deltaBits: string[] = [];
      if (deltas) {
        if (Math.abs(deltas.off) >= ACE_OUT_DELTA_MIN) {
          metrics.push({
            key: "aceOutOffDelta",
            value: String(deltas.off),
            teamId: input.teamId,
          });
          deltaBits.push(`OFF ${formatSignedDelta(deltas.off)}`);
        }
        if (Math.abs(deltas.def) >= ACE_OUT_DELTA_MIN) {
          metrics.push({
            key: "aceOutDefDelta",
            value: String(deltas.def),
            teamId: input.teamId,
          });
          deltaBits.push(`DEF ${formatSignedDelta(deltas.def)}`);
        }
      }
      score += 6;
      const verb = aceSeason === "prior" ? "were" : "are";
      const seasonBit = aceSeason === "prior" ? " last season" : "";
      const deltaSuffix =
        deltaBits.length > 0 ? `, ${deltaBits.join("/")} vs season` : "";
      whenOutClause = ` ${team} ${verb} ${formatWl(hit.player.whenOut)} when he was out${seasonBit} (${hit.player.whenOutPtsFor}-${hit.player.whenOutPtsAgainst})${deltaSuffix}.`;
    }

    if (shape) {
      metrics.push(...shape.metrics);
      score += shape.scoreBoost;
    }

    const weakenedStyles = [
      ...new Set((input.stylesByPlayerId[playerId] ?? []).map(cleanStyleKind)),
    ];
    if (weakenedStyles.length > 0) {
      metrics.push({
        key: "weakenedStyles",
        value: weakenedStyles.slice(0, 3).join(","),
        teamId: input.teamId,
      });
      score += 3;
    }

    let kind = "out_impact";
    if (hit && shape) kind = "ace_out_shape_impact";
    else if (hit) kind = "ace_out_impact";
    else if (shape) kind = "shape_leader_out";

    const shapeLead = (() => {
      if (!shape?.hintBits.length) return "";
      return ` ${shape.hintBits.slice(0, 2).join("; ")}.`;
    })();

    const injuryOut = outImpact
      ? injuryOutImpactOf({
          injury,
          teamId: input.teamId,
          outImpact,
          tipAtMs: input.tipAtMs,
          whenOutWl: hit ? formatWl(hit.player.whenOut) : undefined,
        })
      : null;

    facts.push({
      ...(injuryOut ? { injuryOut } : {}),
      id: `inj:${input.teamId}:${playerId || name}`,
      section: "INJURY IMPACT",
      kind,
      score,
      teamIds: [input.teamId],
      label: "INJURY",
      metrics,
      players: [
        {
          playerId,
          playerName: name,
          status,
        },
      ],
      mode: "weakening",
      dedupeKeys: [`injury:${playerId || name}`],
      hintEn: `${name} is ${status}.${shapeLead}${whenOutClause}${impactClause}`
        .replace(/\s+/g, " ")
        .trim(),
    });
  }

  return facts;
}

export function buildInjuryImpactFactCandidates(input: {
  phase: ProBriefPhase;
  homeTeamId: string;
  awayTeamId: string;
  homeInjuries: NbaTeamInjuryEntry[];
  awayInjuries: NbaTeamInjuryEntry[];
  aceOutRecords?: NbaTeamAceOutRecordsBundle | null;
  /** early/full で今季サンプル不足時の同 teamId フォールバック */
  priorAceOutRecords?: NbaTeamAceOutRecordsBundle | null;
  playerLeaders?: NbaPlayerStatLeadersBundle | null;
  mpgByPlayerId?: Record<string, number> | null;
  /** MATCHUP 候補で型オーナーとして折り込まれた型（playerId → kinds） */
  matchupStylesByPlayerId?: Record<string, string[]>;
  /** 選手欠場の影響（今季。opening は使わない） */
  outImpact?: NbaPlayerOutImpactBundle | null;
  priorOutImpact?: NbaPlayerOutImpactBundle | null;
  /** 長期離脱の判定用 */
  tipAtMs?: number;
}): ProInsightFact[] {
  const stylesByPlayerId = input.matchupStylesByPlayerId ?? {};
  const shared = {
    tipAtMs: input.tipAtMs,
    aceOut: input.aceOutRecords,
    priorAceOut: input.priorAceOutRecords,
    leaders: input.playerLeaders,
    phase: input.phase,
    mpgByPlayerId: input.mpgByPlayerId,
    stylesByPlayerId,
    outImpact: input.outImpact,
    priorOutImpact: input.priorOutImpact,
  };

  return [
    ...teamInjuryFacts({
      ...shared,
      teamId: input.homeTeamId,
      injuries: input.homeInjuries,
    }),
    ...teamInjuryFacts({
      ...shared,
      teamId: input.awayTeamId,
      injuries: input.awayInjuries,
    }),
  ];
}
