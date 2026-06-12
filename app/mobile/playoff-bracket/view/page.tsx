"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  loadPlayoffBracket,
  type BracketState,
} from "@/lib/playoff-bracket-firestore";
import { buildPlayoffDisplayData } from "@/lib/playoff-bracket-display";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import PlayoffFullBracketMobile from "@/app/component/predict/PlayoffFullBracketMobile";
import { getCurrentPlayoffSeason } from "@/lib/playoff-bracket-config";
import { usePlayoffOfficialResults } from "@/lib/playoff/usePlayoffOfficialResults";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";

export default function MobilePlayoffBracketViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fallbackSeason =
    searchParams.get("season") ?? getCurrentPlayoffSeason();

  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState(fallbackSeason);
  const [display, setDisplay] = useState<any | null>(null);
  const [savedBracket, setSavedBracket] = useState<BracketState | null>(null);
  const [viewerUid, setViewerUid] = useState<string | null>(null);

  const { language } = useUserLanguage(viewerUid);
  const officialResults = usePlayoffOfficialResults(season);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const me = auth.currentUser;

      if (!me) {
        router.replace("/mobile/signup");
        return;
      }

      if (!cancelled) setViewerUid(me.uid);

      try {
        const saved = await loadPlayoffBracket(me.uid, fallbackSeason);

        if (!saved) {
          router.replace(
            `/mobile/playoff?season=${encodeURIComponent(fallbackSeason)}`
          );
          return;
        }

        const resolvedSeason = saved.season ?? fallbackSeason;

        const nextDisplay = buildPlayoffDisplayData(
          saved.bracket,
          resolvedSeason
        );

        if (cancelled) return;

        setSavedBracket(saved.bracket);
        setSeason(resolvedSeason);
        setDisplay(nextDisplay);
        setLoading(false);
      } catch (e) {
        console.error("failed to load playoff bracket view", e);
        router.replace(
          `/mobile/playoff?season=${encodeURIComponent(fallbackSeason)}`
        );
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [router, fallbackSeason]);

  if (loading || !display) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050b14] text-white">
        <CandleChartLoader />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050b14] px-4 py-4 text-white">
      <div className="relative mt-4">
        <div className="pointer-events-none absolute left-1/2 top-0 h-full w-[calc(100vw-10px)] -translate-x-1/2 rounded-[18px] bg-[#020611]" />

        <div className="relative overflow-visible">
          <PlayoffFullBracketMobile
            league="nba"
            season={season}
            score={display.score ?? 0}
            leftRound1={display.leftRound1}
            leftRound2={display.leftRound2}
            leftRound3={display.leftRound3}
            leftRound4={display.leftRound4}
            rightRound1={display.rightRound1}
            rightRound2={display.rightRound2}
            rightRound3={display.rightRound3}
            rightRound4={display.rightRound4}
            champion={display.champion}
            bracket={savedBracket ?? undefined}
            results={officialResults ?? undefined}
            hitLegend={{ language }}
          />
        </div>
      </div>
    </main>
  );
}