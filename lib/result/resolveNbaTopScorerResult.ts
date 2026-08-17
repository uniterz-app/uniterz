/**
 * リザルトカード用: NBA 最多得点者予想の表示データ。
 */
import {
  nbaTopScorerPredictionHit,
  normalizeNbaLeadingScorers,
  normalizeNbaTopScorerCandidates,
  normalizeNbaTopScorerPick,
  type NbaTopScorerCandidate,
  type NbaLeadingScorer,
} from "@/lib/nba/topScorer";
import { TEAM_SHORT } from "@/lib/team-short";
import {
  extractResultSettlementBreakdown,
} from "@/lib/result/buildResultStatRows";

export type NbaTopScorerResultInfo = {
  playerName: string;
  teamTag: string;
  teamId: string;
  /** final 後のみ true/false。未確定は null */
  hit: boolean | null;
};

function teamTagFromId(teamId: string): string {
  return (TEAM_SHORT[teamId] ?? teamId.replace(/^nba-/i, "").slice(0, 3)).toUpperCase();
}

function resolvePlayerName(
  pick: { playerId: string; teamId: string; name?: string | null },
  candidates: NbaTopScorerCandidate[],
  leaders: NbaLeadingScorer[]
): string {
  if (pick.name && pick.name.trim()) return pick.name.trim();
  const fromCand = candidates.find(
    (c) => c.playerId === pick.playerId && c.teamId === pick.teamId
  );
  if (fromCand?.name) return fromCand.name;
  const fromLeader = leaders.find(
    (c) => c.playerId === pick.playerId && c.teamId === pick.teamId
  );
  if (fromLeader?.name) return fromLeader.name;
  return "—";
}

type PostLike = {
  league?: unknown;
  status?: unknown;
  prediction?: { goalScorer?: unknown } | null;
  stats?: unknown;
  home?: { teamId?: string | null; name?: string | null } | null;
  away?: { teamId?: string | null; name?: string | null } | null;
};

/**
 * NBA で最多得点者予想があるときだけ返す。
 * `candidates` / `leadingScorers` は名前解決の補助（任意）。
 */
export function resolveNbaTopScorerResultInfo(
  post: PostLike,
  options?: {
    candidates?: unknown;
    leadingScorers?: unknown;
  }
): NbaTopScorerResultInfo | null {
  if (String(post.league ?? "").toLowerCase() !== "nba") return null;
  const pick = normalizeNbaTopScorerPick(post.prediction?.goalScorer);
  if (!pick) return null;

  const candidates = normalizeNbaTopScorerCandidates(options?.candidates);
  const leaders = normalizeNbaLeadingScorers(options?.leadingScorers);
  const breakdown = extractResultSettlementBreakdown(post.stats);
  const status = String(post.status ?? "");
  const isFinal = status === "final";

  let hit: boolean | null = null;
  if (isFinal) {
    if (leaders.length > 0) {
      hit = nbaTopScorerPredictionHit(pick, leaders);
    } else {
      hit = breakdown.goalScorerBonus > 0;
    }
  }

  return {
    playerName: resolvePlayerName(pick, candidates, leaders),
    teamTag: teamTagFromId(pick.teamId),
    teamId: pick.teamId,
    hit,
  };
}
