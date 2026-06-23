import { primeProfileCacheFromRankingRow } from "@/app/component/profile/useProfile";
import type { CommunityGroupLeaderboardRow } from "@/app/component/communities/communityGroupDetailCache";
import type { CommunityMetric } from "@/lib/communities/types";
import {
  communityLeagueForProfile,
  communityMetricToMobile,
  communityRowToRankingCardRow,
} from "@/lib/communities/leaderboardDisplayRow";
import { profileHrefWithRankingsReturn } from "@/lib/navigation/rankingsProfileFrom";
import { profilePathKeyFromRow } from "@/lib/profile/profilePathKey";

/** グループランキング表示後にプロフィール遷移を速くする先読み（上位 N 件） */
export function warmGroupLeaderboardProfiles(
  router: { prefetch: (href: string) => void },
  pathname: string,
  variant: "web" | "mobile",
  groupId: string,
  rows: CommunityGroupLeaderboardRow[],
  metric: CommunityMetric,
  rankingLeague: string | null | undefined,
  limit = 12
): void {
  if (!rows.length) return;
  const base = variant === "mobile" ? "/mobile" : "/web";
  const mobileMetric = communityMetricToMobile(metric);
  const statsLeague = communityLeagueForProfile(rankingLeague);
  const participantCount = rows.length;

  for (let i = 0; i < Math.min(rows.length, limit); i++) {
    const raw = rows[i]!;
    const rank = raw.rank ?? i + 1;
    const row = communityRowToRankingCardRow(raw, metric);
    const profileKey = profilePathKeyFromRow(row);
    const href = profileHrefWithRankingsReturn(pathname, base, profileKey, {
      metric: mobileMetric,
      phase: "playoffs",
      rankingLeague: statsLeague.rankingLeague,
      wcStage: statsLeague.wcStage,
      groupId,
    });
    primeProfileCacheFromRankingRow(profileKey, row, statsLeague, {
      metric: mobileMetric,
      rank,
      participantCount,
    });
    router.prefetch(href);
  }
}
