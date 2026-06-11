"use client";

import dynamic from "next/dynamic";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { useProfileSettledTodayResults } from "@/lib/profile/useProfileSettledTodayResults";
import type { ProfileStatsStreakContext } from "@/lib/profile/profileStreakScope";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";
import { CYBER_GLASS_PANEL_XL } from "@/lib/ui/matchOverlayGlass";
import { jp, nameRajdhani } from "@/lib/fonts";

const ResultCard = dynamic(
  () => import("@/app/component/result/ResultCard"),
  { ssr: false }
);

type Props = {
  uid: string | null | undefined;
  language?: Language;
  layout?: "web" | "mobile";
  profileStatsContext: ProfileStatsStreakContext;
  viewerUid?: string | null;
  gamesRoutePrefix?: "/web" | "/mobile";
};

export default function ProfileSettledTodayResults({
  uid,
  language = "ja",
  layout = "web",
  profileStatsContext,
  viewerUid = null,
  gamesRoutePrefix = "/web",
}: Props) {
  const msg = t(language);
  const isMobile = layout === "mobile";
  const { posts, loading } = useProfileSettledTodayResults(
    uid,
    profileStatsContext,
    !!uid
  );

  const title = msg.profile.settledTodayResults;
  const empty = msg.profile.settledTodayEmpty;
  const loadingMsg = msg.common.loading;

  return (
    <section className={`${CYBER_GLASS_PANEL_XL} min-w-0 shadow-[0_10px_30px_rgba(0,0,0,0.45)]`}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.36]"
        style={PROFILE_SHELL_GRID_STYLE}
        aria-hidden
      />
      <div className="relative z-1 p-4 md:p-5">
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
          <p className="mt-4 text-sm text-white/50">{loadingMsg}</p>
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
            {posts.map((post) => (
              <ResultCard
                key={post.id}
                post={post}
                language={language}
                platform={isMobile ? "mobile" : "web"}
                scheduleDense={isMobile}
                ratingBarsImmediate={posts.length === 1}
                viewerUid={viewerUid}
                gamesRoutePrefix={gamesRoutePrefix}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
