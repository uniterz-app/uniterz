/**
 * 予想プレビュー用。本番パスは `useNbaTopScorerCandidates` / roster API を使う。
 */
import type { NbaTopScorerCandidate } from "@/lib/nba/topScorer";
import { topScorerCandidatesFromRoster } from "@/lib/nba/topScorerCandidatesFromRoster";
import { rosterForMatchup } from "@/lib/predict/nbaRosterPreviewMocks";

export function topScorerCandidatesForMatchup(
  homeTeamId?: string | null,
  awayTeamId?: string | null
): NbaTopScorerCandidate[] {
  const report = rosterForMatchup(
    homeTeamId ?? undefined,
    awayTeamId ?? undefined
  );
  return topScorerCandidatesFromRoster(report);
}
