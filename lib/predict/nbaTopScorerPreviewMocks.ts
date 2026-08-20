/**
 * NBA 予想 TOP SCORER 候補。試合ドキュメント未投入時は Roster モックから起こす。
 */

import type { NbaTopScorerCandidate } from "@/lib/nba/topScorer";
import { sortNbaTopScorerCandidatesByPpg } from "@/lib/nba/topScorer";
import { playerCardName } from "@/lib/predict/nbaRoster";
import { rosterForMatchup } from "@/lib/predict/nbaRosterPreviewMocks";

/** 得点市場に載せる下限。ベンチの低得点は出さない */
const MIN_PPG = 8;

export function topScorerCandidatesForMatchup(
  homeTeamId?: string | null,
  awayTeamId?: string | null
): NbaTopScorerCandidate[] {
  const report = rosterForMatchup(homeTeamId ?? undefined, awayTeamId ?? undefined);
  if (!report) return [];
  const out: NbaTopScorerCandidate[] = [];
  for (const side of [report.home, report.away]) {
    for (const p of side.players) {
      if (p.dimmed) continue;
      if (!Number.isFinite(p.ppg) || p.ppg < MIN_PPG) continue;
      out.push({
        playerId: String(p.id),
        teamId: side.teamId,
        name: playerCardName(p),
        ppg: p.ppg,
        gp: p.gp,
        position: p.position,
        jerseyNumber: p.jerseyNumber ?? null,
      });
    }
  }
  return sortNbaTopScorerCandidatesByPpg(out);
}
