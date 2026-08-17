"use client";

import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import ResultCard from "@/app/component/result/ResultCard";
import { useProfileSettledTodayResults } from "@/lib/profile/useProfileSettledTodayResults";
import {
  resolveResultPostGameMarket,
  useResultPostsGameMarkets,
} from "@/lib/games/useResultPostsGameMarkets";
import type { ProfileStatsStreakContext } from "@/lib/profile/profileStreakScope";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import ProfileKinetikPanelFrame from "@/app/component/profile/ui/ProfileKinetikPanelFrame";
import ProfileOverviewLineFrame from "@/app/component/profile/ui/ProfileOverviewLineFrame";
import { jp } from "@/lib/fonts";
import {
  type ProfileVisualEffects,
  isProfileVisualLite,
} from "@/lib/profile/profileVisualEffects";

type Props = {
  uid: string | null | undefined;
  language?: Language;
  layout?: "web" | "mobile";
  profileStatsContext: ProfileStatsStreakContext;
  viewerUid?: string | null;
  gamesRoutePrefix?: "/web" | "/mobile";
  visualEffects?: ProfileVisualEffects;
};

/** モバイルプロフィールで「今日の確定」に載せる上限（Safari のメモリ対策） */
const MOBILE_SETTLED_TODAY_MAX = 6;

export default function ProfileSettledTodayResults({
  uid,
  language = "ja",
  layout = "web",
  profileStatsContext,
  viewerUid = null,
  gamesRoutePrefix = "/web",
  visualEffects = "full",
}: Props) {
  const msg = t(language);
  const isMobile = layout === "mobile";
  const visualEffectsLite = isProfileVisualLite(visualEffects);
  const { posts, loading } = useProfileSettledTodayResults(
    uid,
    profileStatsContext,
    !!uid
  );

  const title = msg.profile.settledTodayResults;
  const empty = msg.profile.settledTodayEmpty;
  const visiblePosts =
    isMobile && posts.length > MOBILE_SETTLED_TODAY_MAX
      ? posts.slice(0, MOBILE_SETTLED_TODAY_MAX)
      : posts;
  const marketsFromGames = useResultPostsGameMarkets(visiblePosts);

  return (
    <ProfileOverviewLineFrame title={title}>
    <ProfileKinetikPanelFrame as="section" className="profile-kinetik-panel--line-frame block w-full min-w-0 p-3">
      <div>
          <p
            className={[
              language === "ja" ? jp.className : "",
              "max-w-[520px] text-xs leading-relaxed text-slate-400 sm:text-[14px]",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {msg.profile.settledTodayResultsDesc}
          </p>
        </div>

        {loading ? (
          <CandleChartLoader className="mt-4" label={msg.common.loading} />
        ) : posts.length === 0 ? (
          <p className="mt-4 text-sm text-white/45">{empty}</p>
        ) : (
          <div
            className={
              isMobile
                ? "mt-4 flex flex-col gap-3 overflow-visible"
                : "mt-4 grid grid-cols-1 gap-4 overflow-visible sm:grid-cols-2"
            }
          >
            {visiblePosts.map((post) => (
              <ResultCard
                key={post.id}
                post={post}
                language={language}
                platform={isMobile ? "mobile" : "web"}
                scheduleDense={isMobile}
                ratingBarsImmediate={visiblePosts.length === 1}
                viewerUid={viewerUid}
                gamesRoutePrefix={gamesRoutePrefix}
                visualEffectsLite={visualEffectsLite}
                gameMarket={resolveResultPostGameMarket(post, marketsFromGames)}
                href={`${gamesRoutePrefix}/result/${post.id}`}
              />
            ))}
          </div>
        )}
    </ProfileKinetikPanelFrame>
    </ProfileOverviewLineFrame>
  );
}
