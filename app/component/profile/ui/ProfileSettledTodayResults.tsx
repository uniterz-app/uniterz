"use client";

import { useState } from "react";
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
  PROFILE_SETTLED_TODAY_COLLAPSED_MAX,
  profileSettledTodayShowAllLabel,
} from "@/lib/profile/profileSettledTodayShowAll";
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
  const expandKey = `${uid ?? ""}|${slateDateKey}`;
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const collapsed =
    isMobile &&
    expandedKey !== expandKey &&
    posts.length > PROFILE_SETTLED_TODAY_COLLAPSED_MAX;
  const visiblePosts = collapsed
    ? posts.slice(0, PROFILE_SETTLED_TODAY_COLLAPSED_MAX)
    : posts;
  const hiddenCount = posts.length - visiblePosts.length;
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
          {hiddenCount > 0 ? (
            <button
              type="button"
              onClick={() => setExpandedKey(expandKey)}
              className="mt-3 w-full border border-[#00F5FF]/35 bg-[#00F5FF]/[0.06] py-2.5 text-xs font-extrabold tracking-wide text-[#00F5FF] active:opacity-75"
            >
              {profileSettledTodayShowAllLabel(language, hiddenCount)}
            </button>
          ) : null}
          </div>
        )}
    </ProfileKinetikPanelFrame>
    </ProfileOverviewLineFrame>
  );
}
