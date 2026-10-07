"use client";

import type { Language } from "@/lib/i18n/language";
import { resolveLocalizedLang } from "@/lib/i18n/localize";
import { t } from "@/lib/i18n/t";
import ResultCard from "@/app/component/result/ResultCard";
import { ResultDayPipeGroup } from "@/app/component/result/ResultDayPipeGroup";
import { dayPointsHeaderForList } from "@/lib/result/resultDayPointsHeader";
import { formatNbaSlateDateLabel } from "@/lib/games/latestNbaSlate";
import { useProfileSettledTodayResults } from "@/lib/profile/useProfileSettledTodayResults";
import {
  resolveResultPostGameMarket,
  resolveResultPostGameRoundMeta,
  useResultPostsGameMarkets,
  useResultPostsGameRoundMeta,
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
  const lang = resolveLocalizedLang(language);
  const isCjk = lang === "ja" || lang === "ko" || lang === "zh";
  const isMobile = layout === "mobile";
  const visualEffectsLite = isProfileVisualLite(visualEffects);
  const { posts, loading, slateDateKey } = useProfileSettledTodayResults(
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
  const dayPoints = dayPointsHeaderForList(posts, [], language);
  const marketsFromGames = useResultPostsGameMarkets(visiblePosts);
  const roundMetaFromGames = useResultPostsGameRoundMeta(visiblePosts);

  return (
    <ProfileOverviewLineFrame title={title}>
    <ProfileKinetikPanelFrame as="section" className="profile-kinetik-panel--line-frame block w-full min-w-0 p-3">
      <div>
          <p
            className={[
              isCjk ? jp.className : "",
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
          <div className="mt-4">
          <ResultDayPipeGroup
            dateLabel={formatNbaSlateDateLabel(slateDateKey)}
            isMobile={isMobile}
            reducedMotion={visualEffectsLite}
            dayPoints={dayPoints}
            cardsClassName={
              isMobile
                ? "flex flex-col gap-3 overflow-visible"
                : "grid grid-cols-1 gap-4 overflow-visible sm:grid-cols-2"
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
                gameRoundMeta={resolveResultPostGameRoundMeta(
                  post,
                  roundMetaFromGames
                )}
                href={`${gamesRoutePrefix}/result/${post.id}`}
              />
            ))}
          </ResultDayPipeGroup>
          </div>
        )}
    </ProfileKinetikPanelFrame>
    </ProfileOverviewLineFrame>
  );
}
