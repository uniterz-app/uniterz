/**
 * 候補をランク → 枠 cap → 重複除去して ProInsightFactPack にする。
 */
import type {
  ProInsightFact,
  ProInsightFactPack,
  ProInsightFactSection,
} from "@/lib/nba/insights/proInsightFacts/types";
import { PRO_INSIGHT_FACT_CAPS } from "@/lib/nba/insights/proInsightFacts/types";
import { fingerprintProInsightFacts } from "@/lib/nba/insights/proInsightFacts/fingerprint";
import { buildMatchupFactCandidates } from "@/lib/nba/insights/proInsightFacts/buildMatchupFacts";
import {
  buildScheduleFactCandidates,
  type HighMinutePlayer,
  type SchedulePriorGame,
  type ScheduleNextGame,
} from "@/lib/nba/insights/proInsightFacts/buildScheduleFacts";
import {
  buildContextFactCandidates,
  type TeamStreakFactInput,
} from "@/lib/nba/insights/proInsightFacts/buildContextFacts";
import { buildInjuryImpactFactCandidates } from "@/lib/nba/insights/proInsightFacts/buildInjuryImpactFacts";
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import type { NbaTeamAceOutRecordsBundle } from "@/lib/nba/insights/aceOutRecordTypes";
import type { NbaTeamSeasonRecordsBundle } from "@/lib/nba/insights/priorSeasonRecordTypes";
import type { NbaTeamShapeRecordsBundle } from "@/lib/nba/teamShapes/teamShapeTypes";
import type { NbaPlayerStatLeadersBundle } from "@/lib/predict/nbaPlayerStatLeadersMocks";
import type { ProBriefPhase } from "@/lib/predict/predictProBrief";

const SECTION_ORDER: ProInsightFactSection[] = [
  "MATCHUP",
  "SCHEDULE",
  "CONTEXT",
  "INJURY IMPACT",
];

export type AssembleProInsightFactsInput = {
  phase: ProBriefPhase;
  homeTeamId: string;
  awayTeamId: string;
  tipAtMs: number;
  tonightVenueTeamId?: string;
  seasonRows: NbaLeagueTeamStatRow[];
  priorRows?: NbaLeagueTeamStatRow[] | null;
  last10Rows?: NbaLeagueTeamStatRow[] | null;
  homeInjuries: NbaTeamInjuryEntry[];
  awayInjuries: NbaTeamInjuryEntry[];
  homePriorGames?: SchedulePriorGame[];
  awayPriorGames?: SchedulePriorGame[];
  homeNextGame?: ScheduleNextGame | null;
  awayNextGame?: ScheduleNextGame | null;
  highMinutePlayers?: HighMinutePlayer[];
  homeRecentOppWinPcts?: number[];
  awayRecentOppWinPcts?: number[];
  seasonRecords?: NbaTeamSeasonRecordsBundle | null;
  priorRecords?: NbaTeamSeasonRecordsBundle | null;
  aceOutRecords?: NbaTeamAceOutRecordsBundle | null;
  /** early/full: 今季サンプル不足時の同 teamId 前季フォールバック */
  priorAceOutRecords?: NbaTeamAceOutRecordsBundle | null;
  /** USG/AST リーダー欠場の形変化用 */
  playerLeaders?: NbaPlayerStatLeadersBundle | null;
  streaks?: TeamStreakFactInput[];
  /** カンファ内順位（opening は前季） */
  confRankByTeamId?: Record<string, number> | null;
  /** ロスター平均出場（MATCHUP 欠場ゲート用） */
  mpgByPlayerId?: Record<string, number> | null;
  /** 条件付き得意／苦手形（中盤以降に効く） */
  shapeRecords?: NbaTeamShapeRecordsBundle | null;
};

/**
 * 同一 dedupeKey は試合全体で1回。先に高 score を残す。
 * INJURY IMPACT は injury:* を優先確保（MATCHUP weakening より後に pack するが
 * 先に injury キーを予約して MATCHUP から削る）。
 */
export function rankAndPackFacts(
  candidates: ProInsightFact[],
  caps: Record<ProInsightFactSection, number> = PRO_INSIGHT_FACT_CAPS
): Record<ProInsightFactSection, ProInsightFact[]> {
  const bySection: Record<ProInsightFactSection, ProInsightFact[]> = {
    MATCHUP: [],
    SCHEDULE: [],
    CONTEXT: [],
    "INJURY IMPACT": [],
  };

  const sorted = [...candidates].sort(
    (a, b) => b.score - a.score || a.id.localeCompare(b.id)
  );

  // injury キーは IMPACT 側を優先
  const reservedInjuryKeys = new Set<string>();
  const injurySorted = sorted.filter((f) => f.section === "INJURY IMPACT");
  for (const f of injurySorted) {
    if (bySection["INJURY IMPACT"].length >= caps["INJURY IMPACT"]) break;
    const blocked = f.dedupeKeys.some((k) => reservedInjuryKeys.has(k));
    if (blocked) continue;
    bySection["INJURY IMPACT"].push(f);
    for (const k of f.dedupeKeys) reservedInjuryKeys.add(k);
  }

  const usedKeys = new Set<string>(reservedInjuryKeys);

  // MATCHUP: weakening を最大1本確保（案2がスコア負けで消えないように）
  {
    const matchupSorted = sorted.filter((f) => f.section === "MATCHUP");
    const bestWeak = matchupSorted.find((f) => f.mode === "weakening");
    if (bestWeak) {
      const otherKeys = bestWeak.dedupeKeys.filter(
        (k) => !k.startsWith("injury:")
      );
      if (!otherKeys.some((k) => usedKeys.has(k))) {
        bySection.MATCHUP.push(bestWeak);
        for (const k of otherKeys) usedKeys.add(k);
      }
    }
  }

  for (const section of SECTION_ORDER) {
    if (section === "INJURY IMPACT") continue;
    for (const f of sorted) {
      if (f.section !== section) continue;
      if (bySection[section].length >= caps[section]) break;
      if (bySection[section].some((x) => x.id === f.id)) continue;
      if (f.dedupeKeys.some((k) => usedKeys.has(k))) continue;
      const injuryOnly = f.dedupeKeys.filter((k) => k.startsWith("injury:"));
      const otherKeys = f.dedupeKeys.filter((k) => !k.startsWith("injury:"));
      if (otherKeys.some((k) => usedKeys.has(k))) continue;
      if (
        section !== "MATCHUP" &&
        injuryOnly.some((k) => reservedInjuryKeys.has(k))
      ) {
        continue;
      }
      bySection[section].push(f);
      for (const k of otherKeys) usedKeys.add(k);
      if (section !== "MATCHUP") {
        for (const k of injuryOnly) usedKeys.add(k);
      }
    }
  }

  // MATCHUP は score 順に並べ直し
  bySection.MATCHUP.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  return bySection;
}

export function assembleProInsightFactPack(
  input: AssembleProInsightFactsInput
): ProInsightFactPack {
  const tonightVenue = input.tonightVenueTeamId ?? input.homeTeamId;

  const matchup = buildMatchupFactCandidates({
    phase: input.phase,
    seasonRows: input.seasonRows,
    priorRows: input.priorRows,
    homeTeamId: input.homeTeamId,
    awayTeamId: input.awayTeamId,
    homeInjuries: input.homeInjuries,
    awayInjuries: input.awayInjuries,
    aceOutRecords: input.aceOutRecords,
    mpgByPlayerId: input.mpgByPlayerId,
    playerLeaders: input.playerLeaders,
  });

  const weakeningKinds = matchup
    .filter((f) => f.mode === "weakening" || f.mode === "amplify")
    .map((f) => f.kind);

  const matchupWeakeningByTeam: Record<string, string[]> = {};
  for (const f of matchup) {
    if (f.mode !== "weakening" && f.mode !== "amplify") continue;
    const teamIds = new Set<string>();
    if (f.mode === "weakening") {
      if (f.teamIds[0]) teamIds.add(f.teamIds[0]);
      // weakening + amplify 同時（players 2）→ 守り側も
      if (f.players.length >= 2 && f.teamIds[1]) teamIds.add(f.teamIds[1]);
    } else if (f.mode === "amplify") {
      if (f.teamIds[1]) teamIds.add(f.teamIds[1]);
    }
    for (const teamId of teamIds) {
      const list = matchupWeakeningByTeam[teamId] ?? [];
      list.push(f.kind);
      matchupWeakeningByTeam[teamId] = list;
    }
  }

  const schedule = buildScheduleFactCandidates({
    phase: input.phase,
    homeTeamId: input.homeTeamId,
    awayTeamId: input.awayTeamId,
    tipAtMs: input.tipAtMs,
    tonightVenueTeamId: tonightVenue,
    homePriorGames: input.homePriorGames ?? [],
    awayPriorGames: input.awayPriorGames ?? [],
    homeNextGame: input.homeNextGame,
    awayNextGame: input.awayNextGame,
    highMinutePlayers: input.highMinutePlayers,
  });

  const context = buildContextFactCandidates({
    phase: input.phase,
    homeTeamId: input.homeTeamId,
    awayTeamId: input.awayTeamId,
    seasonRows: input.seasonRows,
    last10Rows: input.last10Rows,
    homeRecentOppWinPcts: input.homeRecentOppWinPcts,
    awayRecentOppWinPcts: input.awayRecentOppWinPcts,
    homePriorGames: input.homePriorGames,
    awayPriorGames: input.awayPriorGames,
    seasonRecords: input.seasonRecords,
    priorRecords: input.priorRecords,
    streaks: input.streaks,
    confRankByTeamId: input.confRankByTeamId,
    shapeRecords: input.shapeRecords,
  });

  const injury = buildInjuryImpactFactCandidates({
    phase: input.phase,
    homeTeamId: input.homeTeamId,
    awayTeamId: input.awayTeamId,
    homeInjuries: input.homeInjuries,
    awayInjuries: input.awayInjuries,
    aceOutRecords: input.aceOutRecords,
    priorAceOutRecords: input.priorAceOutRecords,
    playerLeaders: input.playerLeaders,
    mpgByPlayerId: input.mpgByPlayerId,
    matchupWeakeningKinds: weakeningKinds,
    matchupWeakeningByTeam,
  });

  const candidates = [...matchup, ...schedule, ...context, ...injury];
  const sections = rankAndPackFacts(candidates);
  const fingerprint = fingerprintProInsightFacts(sections, {
    homeTeamId: input.homeTeamId,
    awayTeamId: input.awayTeamId,
    tipAtMs: input.tipAtMs,
    phase: input.phase,
  });

  return {
    homeTeamId: input.homeTeamId,
    awayTeamId: input.awayTeamId,
    tipAtMs: input.tipAtMs,
    phase: input.phase,
    sections,
    candidates,
    fingerprint,
  };
}
