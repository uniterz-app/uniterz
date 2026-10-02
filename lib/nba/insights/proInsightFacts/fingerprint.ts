/**
 * facts 指紋 — patch 時に再 LLM するか判定。
 */
import { createHash } from "node:crypto";
import type { ProInsightFact } from "@/lib/nba/insights/proInsightFacts/types";
import type { ProInsightFactSection } from "@/lib/nba/insights/proInsightFacts/types";
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import {
  isOutOrQuestionableInjury,
  normalizeTeamInjurySnapshotStatus,
} from "@/lib/nba/teamInjuries/injuryStatusDisplay";

function stableFact(f: ProInsightFact): unknown {
  return {
    id: f.id,
    section: f.section,
    kind: f.kind,
    mode: f.mode ?? null,
    teamIds: [...f.teamIds].sort(),
    metrics: f.metrics.map((m) => ({
      key: m.key,
      value: m.value,
      rank: m.rank ?? null,
      teamId: m.teamId ?? null,
    })),
    players: f.players.map((p) => ({
      playerId: p.playerId,
      playerName: p.playerName,
      status: p.status ?? null,
    })),
  };
}

export function fingerprintProInsightFacts(
  sections: Record<ProInsightFactSection, ProInsightFact[]>,
  meta: { homeTeamId: string; awayTeamId: string; tipAtMs: number; phase: string }
): string {
  const payload = {
    ...meta,
    sections: {
      MATCHUP: sections.MATCHUP.map(stableFact),
      SCHEDULE: sections.SCHEDULE.map(stableFact),
      CONTEXT: sections.CONTEXT.map(stableFact),
      "INJURY IMPACT": sections["INJURY IMPACT"].map(stableFact),
    },
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 24);
}

/**
 * tip 1h 前パッチ用 — OUT/QUES 等のステータス一覧だけを指紋化。
 * 変わっていなければ再 LLM しない。
 */
export function fingerprintInjuryStatus(input: {
  homeTeamId: string;
  awayTeamId: string;
  homeInjuries: NbaTeamInjuryEntry[];
  awayInjuries: NbaTeamInjuryEntry[];
}): string {
  const side = (teamId: string, injuries: NbaTeamInjuryEntry[]) =>
    injuries
      .map((inj) => {
        const status = normalizeTeamInjurySnapshotStatus(inj.status);
        if (!status || !isOutOrQuestionableInjury(status)) return null;
        const playerId = String(inj.playerId ?? "").trim();
        const name = String(inj.name ?? "").trim();
        return {
          teamId,
          playerId: playerId || name,
          status,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
      .sort((a, b) =>
        `${a.teamId}:${a.playerId}`.localeCompare(`${b.teamId}:${b.playerId}`)
      );

  const payload = {
    homeTeamId: input.homeTeamId,
    awayTeamId: input.awayTeamId,
    players: [
      ...side(input.homeTeamId, input.homeInjuries),
      ...side(input.awayTeamId, input.awayInjuries),
    ],
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 24);
}
