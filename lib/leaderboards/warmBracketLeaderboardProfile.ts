import { primeProfileCacheFromRankingRow } from "@/app/component/profile/useProfile";
import { prefetchProfileStatsFromRoute } from "@/app/component/profile/useUserStatsV2";
import type { RankingRowWithCountry } from "@/app/component/rankings/_data/mockRows";
import type { BracketLeaderboardRow } from "@/lib/leaderboards/useBracketLeaderboard";
import type { WcBracketLeaderboardRow } from "@/lib/leaderboards/useWcBracketLeaderboard";
import {
  profileHrefWithRankingsReturn,
  RANKINGS_TAB_CATEGORY_PARAM,
  stashRankingsTabForReturn,
} from "@/lib/navigation/rankingsProfileFrom";
import { profilePathKeyFromRow } from "@/lib/profile/profilePathKey";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";

type BracketProfileRow = BracketLeaderboardRow | WcBracketLeaderboardRow;

function bracketRowToRankingRow(row: BracketProfileRow): RankingRowWithCountry {
  const totalScore =
    "totalScore" in row && typeof row.totalScore === "number"
      ? row.totalScore
      : undefined;
  const streak =
    "survivedRounds" in row && typeof row.survivedRounds === "number"
      ? row.survivedRounds
      : 0;

  return {
    uid: row.uid,
    displayName: row.displayName,
    handle: row.handle ?? "",
    photoURL: row.photoURL ?? undefined,
    plan: row.plan,
    rank: row.rank,
    posts: 0,
    streak,
    totalScore,
  };
}

/** ブラケットリスト→プロフィール遷移を速くする（RankingCard と同系の先読み） */
export function warmBracketLeaderboardProfile(params: {
  router: { prefetch: (href: string) => void };
  pathname: string;
  base: "/mobile" | "/web";
  row: BracketProfileRow;
  totalCount?: number;
  league: RankingLeagueSource;
  wcStage?: WcRankingStage;
  /** WC サバイバー / NBA プレーオフブラケットタブからの復帰用 */
  rankingsCategory?: "bracket" | "playoffs";
}): string {
  const {
    router,
    pathname,
    base,
    row,
    totalCount,
    league,
    wcStage,
    rankingsCategory = "bracket",
  } = params;

  const profileKey = profilePathKeyFromRow(row);
  const statsContext = {
    rankingLeague: league,
    wcStage:
      league === "worldcup" ? (wcStage ?? ("overall" as const)) : undefined,
  };

  primeProfileCacheFromRankingRow(
    profileKey,
    bracketRowToRankingRow(row),
    statsContext,
    {
      metric: "totalScore",
      rank: row.rank,
      participantCount: totalCount,
    },
    { skipStatsPrime: true }
  );
  prefetchProfileStatsFromRoute(profileKey, statsContext);
  stashRankingsTabForReturn("totalScore", "playoffs");

  let href = profileHrefWithRankingsReturn(pathname, base, profileKey, {
    metric: "totalScore",
    phase: "playoffs",
    rankingLeague: league,
    wcStage: statsContext.wcStage,
  });

  if (pathname.includes("/rankings") && rankingsCategory === "bracket") {
    const sep = href.includes("?") ? "&" : "?";
    href = `${href}${sep}${RANKINGS_TAB_CATEGORY_PARAM}=bracket`;
  }

  router.prefetch(href);
  return href;
}
