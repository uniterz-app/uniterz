"use client";

import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import ResultCard from "@/app/component/result/ResultCard";
import { useProfileSettledTodayResults } from "@/lib/profile/useProfileSettledTodayResults";
import type { ProfileStatsStreakContext } from "@/lib/profile/profileStreakScope";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import ProfileKinetikPanelFrame from "@/app/component/profile/ui/ProfileKinetikPanelFrame";
import { jp, nameRajdhani } from "@/lib/fonts";
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
const MOBILE_SETTLED_TODAY_MAX = 4;

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

  return (
    <ProfileKinetikPanelFrame as="section" className="p-4 md:p-5">
      <div>
          <h3
            className={[
              nameRajdhani.className,
              "font-semibold tracking-wide text-white/95",
              isMobile ? "text-lg" : "text-xl sm:text-[1.72rem]",
            ].join(" ")}
          >
            {title}
          </h3>
          <p
            className={[
              language === "ja" ? jp.className : "",
              "mt-1.5 max-w-[520px] text-xs leading-relaxed text-slate-400 sm:text-[14px]",
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
                ? "mt-4 flex flex-col gap-3"
                : "mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
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
              />
            ))}
          </div>
        )}
    </ProfileKinetikPanelFrame>
  );
}
