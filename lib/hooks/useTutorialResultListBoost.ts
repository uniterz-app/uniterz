/**
 * リザルト一覧にチュートリアル投稿を差し込み、NBA タブへ寄せる
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { LEAGUES } from "@/lib/leagues";
import type { Language } from "@/lib/i18n/language";
import type {
  ResultDayGroup,
  ResultListLeagueTab,
} from "@/lib/result/result-page-data";
import { readTutorialLivePhase } from "@/lib/tutorial/tutorialLivePhase";
import {
  readTutorialLivePick,
  type TutorialLivePickPayload,
} from "@/lib/tutorial/tutorialLivePick";
import { buildTutorialResultPost } from "@/lib/tutorial/tutorialNbaUi";
import { prependTutorialResultPost } from "@/lib/tutorial/prependTutorialResultPost";

function readBoostPayload(): TutorialLivePickPayload | null {
  const phase = readTutorialLivePhase();
  if (
    phase !== "results" &&
    phase !== "gotoResults" &&
    phase !== "resultDetail"
  ) {
    return null;
  }
  return readTutorialLivePick();
}

export function useTutorialResultListBoost(
  language: Language,
  grouped: ResultDayGroup[],
  setLeagueTab: (tab: ResultListLeagueTab) => void
): {
  grouped: ResultDayGroup[];
  active: boolean;
} {
  const pathname = usePathname();
  const [payload, setPayload] = useState<TutorialLivePickPayload | null>(null);

  useEffect(() => {
    const next = readBoostPayload();
    setPayload(next);
    if (next) setLeagueTab(LEAGUES.NBA);
    /** gotoResults → results の書き込み直後に再読取 */
    const t = window.setTimeout(() => {
      const again = readBoostPayload();
      setPayload(again);
      if (again) setLeagueTab(LEAGUES.NBA);
    }, 120);
    return () => window.clearTimeout(t);
  }, [pathname, setLeagueTab]);

  const boosted = useMemo(() => {
    if (!payload) return grouped;
    return prependTutorialResultPost(
      grouped,
      buildTutorialResultPost(payload.pick, payload.grade),
      language
    );
  }, [payload, grouped, language]);

  return { grouped: boosted, active: payload != null };
}
