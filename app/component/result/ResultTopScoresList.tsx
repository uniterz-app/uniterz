"use client";

import Link from "next/link";
import {
  ProCyberBadge,
  proBadgeStaticMotion,
} from "@/app/component/common/ProCyberBadge";
import {
  CyberRankingListRow,
  CyberRankingScore,
} from "@/app/component/rankings/CyberRankingListParts";
import { cyberMetricTag } from "@/lib/rankings/cyberRankVisual";
import { t } from "@/lib/i18n/t";
import type { Language } from "@/lib/i18n/language";
import { profilePathKeyFromRow } from "@/lib/profile/profilePathKey";
import type { GamePointsTopEntryV1 } from "@/lib/results/gamePointsTop";
import { warmPublicProfileFromListEntry } from "@/app/component/profile/useProfile";

type Props = {
  entries: GamePointsTopEntryV1[];
  language?: Language;
  gamesRoutePrefix?: "/web" | "/mobile";
};

/** リザルト詳細 — この試合の得点上位。見た目は本番 CyberRankingListRow。 */
export default function ResultTopScoresList({
  entries,
  language = "ja",
  gamesRoutePrefix = "/mobile",
}: Props) {
  if (entries.length === 0) return null;
  const metricTag = cyberMetricTag("totalScore", language);
  const title = language === "en" ? "TOP SCORES" : "得点上位";

  return (
    <section className="-mx-3 mt-4 sm:-mx-4">
      <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/70">
        {title}
      </p>
      <div>
        {entries.map((entry) => {
          const profileKey = profilePathKeyFromRow({
            uid: entry.uid,
            handle: entry.handle === "—" ? "" : entry.handle,
          });
          const warm = () => {
            if (!profileKey) return;
            warmPublicProfileFromListEntry({
              routeKey: profileKey,
              uid: entry.uid,
              handle: entry.handle === "—" ? "" : entry.handle,
              displayName: entry.displayName,
              photoURL: entry.photoURL,
              plan: entry.isPro ? "pro" : "free",
              countryCode: entry.countryCode,
            });
          };
          const row = (
            <CyberRankingListRow
              rank={entry.rank}
              displayName={entry.displayName}
              photoURL={entry.photoURL}
              metric="totalScore"
              metricTag={metricTag}
              countryCode={entry.countryCode}
              compact
              hideListMeta
              showFirstPlaceFrame
              nameExtra={
                entry.isPro ? (
                  <ProCyberBadge
                    {...proBadgeStaticMotion}
                    compact
                    ariaLabel={t(language).common.proMember}
                  />
                ) : null
              }
              language={language}
              scoreSlot={
                <CyberRankingScore
                  rank={entry.rank}
                  metric="totalScore"
                  counted={entry.points}
                  compact
                />
              }
            />
          );
          if (!profileKey) return <div key={`${entry.rank}-${entry.postId}`}>{row}</div>;
          return (
            <Link
              key={`${entry.rank}-${entry.postId}`}
              href={`${gamesRoutePrefix}/u/${encodeURIComponent(profileKey)}`}
              className="block min-w-0 origin-center transition-[transform,opacity] duration-100 ease-out active:scale-[0.99] active:opacity-95"
              onPointerDown={warm}
              onFocus={warm}
            >
              {row}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
