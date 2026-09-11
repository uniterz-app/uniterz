/**
 * INJURY IMPACT ファクト（試合全体 cap 2）。
 * 材料: ace-out（当該 teamId）OR shape（leaders Top2）。ただの OUT は出さない。
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
    .replace(/_weak$/, "");
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
 * early/full → 今季 → 同 teamId の前季フォールバック（移籍先に prior 行が無ければ null）。
 */
function resolveAceOutForInjury(input: {
  phase: ProBriefPhase;
  teamId: string;
  injury: NbaTeamInjuryEntry;
  aceOut: NbaTeamAceOutRecordsBundle | null | undefined;
  priorAceOut: NbaTeamAceOutRecordsBundle | null | undefined;
}): { hit: AceHit; season: "prior" | "current" } | null {
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
  weakenedStyles: string[];
}): ProInsightFact[] {
  const list = input.injuries.filter((i) =>
    isOutOrQuestionableInjury(i.status)
  );
  if (list.length === 0) return [];

  const outs = list.filter(
    (i) => i.status === "out" || i.status === "doubtful"
  );
  const pool = outs.length > 0 ? outs : list;
  const facts: ProInsightFact[] = [];

  for (const injury of pool.slice(0, 3)) {
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

    if (!hit && !shape) continue;

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

    if (input.weakenedStyles.length > 0) {
      metrics.push({
        key: "weakenedStyles",
        value: input.weakenedStyles.slice(0, 3).join(","),
        teamId: input.teamId,
      });
      score += 3;
    }

    let kind = "shape_leader_out";
    if (hit && shape) kind = "ace_out_shape_impact";
    else if (hit) kind = "ace_out_impact";

    const shapeLead = (() => {
      if (!shape?.hintBits.length) return "";
      return ` ${shape.hintBits.slice(0, 2).join("; ")}.`;
    })();

    facts.push({
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
      hintEn: `${name} is ${status}.${shapeLead}${whenOutClause}`
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
  matchupWeakeningKinds?: string[];
  matchupWeakeningByTeam?: Record<string, string[]>;
}): ProInsightFact[] {
  const byTeam = input.matchupWeakeningByTeam ?? {};
  const fallback = (input.matchupWeakeningKinds ?? []).map(cleanStyleKind);

  return [
    ...teamInjuryFacts({
      teamId: input.homeTeamId,
      injuries: input.homeInjuries,
      aceOut: input.aceOutRecords,
      priorAceOut: input.priorAceOutRecords,
      leaders: input.playerLeaders,
      phase: input.phase,
      mpgByPlayerId: input.mpgByPlayerId,
      weakenedStyles: (byTeam[input.homeTeamId] ?? fallback).map(
        cleanStyleKind
      ),
    }),
    ...teamInjuryFacts({
      teamId: input.awayTeamId,
      injuries: input.awayInjuries,
      aceOut: input.aceOutRecords,
      priorAceOut: input.priorAceOutRecords,
      leaders: input.playerLeaders,
      phase: input.phase,
      mpgByPlayerId: input.mpgByPlayerId,
      weakenedStyles: (byTeam[input.awayTeamId] ?? []).map(cleanStyleKind),
    }),
  ];
}
