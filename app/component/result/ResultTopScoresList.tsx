"use client";

import { useState } from "react";
import Link from "next/link";
import DailyScoreRankRow from "@/app/component/rankings/DailyScoreRankRow";
import type { Language } from "@/lib/i18n/language";
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import { t } from "@/lib/i18n/t";
import { profilePathKeyFromRow } from "@/lib/profile/profilePathKey";
import {
  GAME_POINTS_TOP_INITIAL_VISIBLE,
  type GamePointsTopEntryV1,
} from "@/lib/results/gamePointsTop";
import { warmPublicProfileFromListEntry } from "@/app/component/profile/useProfile";

type Props = {
  entries: GamePointsTopEntryV1[];
  language?: Language;
  gamesRoutePrefix?: "/web" | "/mobile";
};

/** リザルト詳細 — この試合の得点上位。見た目は TODAY UNITERZ の行。 */
export default function ResultTopScoresList({
  entries,
  language = "en",
  gamesRoutePrefix = "/mobile",
}: Props) {
  const [expanded, setExpanded] = useState(false);
  if (entries.length === 0) return null;
  const canExpand = entries.length > GAME_POINTS_TOP_INITIAL_VISIBLE;
  const visible =
    expanded || !canExpand
      ? entries
      : entries.slice(0, GAME_POINTS_TOP_INITIAL_VISIBLE);
  const loc = resolveLocalizedLang(language);
  const title = L(loc, {
    ja: "得点上位",
    en: "TOP SCORES",
    ko: "득점 상위",
    zh: "得分前列",
    es: "MÁX. PUNTOS",
    pt: "MAIORES PONTOS",
    fr: "MEILLEURS SCORES",
  });

  return (
    <section className="mt-4">
      <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/70">
        {title}
      </p>
      <div className="space-y-1.5">
        {visible.map((entry) => {
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
            <DailyScoreRankRow
              rank={entry.rank}
              name={entry.displayName || entry.handle || "—"}
              photoURL={entry.photoURL}
              isPro={entry.isPro}
              proLabel={t(language).common.proMember}
              planProBgVariant={entry.planProBgVariant}
              countryCode={entry.countryCode}
              value={entry.points.toFixed(1)}
              valueUnit="PTS"
              solid
              smallName
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
      {canExpand ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-2 w-full border border-cyan-300/35 bg-cyan-300/5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300/90 transition-opacity active:opacity-70"
        >
          {expanded ? "CLOSE" : `MORE · TOP ${entries.length}`}
        </button>
      ) : null}
    </section>
  );
}
