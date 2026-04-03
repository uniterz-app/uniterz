"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  loadPlayoffBracket,
  type BracketState,
} from "@/lib/playoff-bracket-firestore";
import { buildPlayoffDisplayData } from "@/lib/playoff-bracket-display";
import PlayoffFullBracketWeb from "@/app/component/predict/PlayoffFullBracketWeb";
import { getCurrentPlayoffSeason } from "@/lib/playoff-bracket-config";
import { usePlayoffOfficialResults } from "@/lib/playoff/usePlayoffOfficialResults";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";

export default function WebPlayoffBracketViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fallbackSeason =
    searchParams.get("season") ?? getCurrentPlayoffSeason();

  const [loading, setLoading] = useState(true);
  const [display, setDisplay] = useState<any | null>(null);
  const [savedBracket, setSavedBracket] = useState<BracketState | null>(null);
  const [resolvedSeason, setResolvedSeason] = useState(fallbackSeason);
  const [viewerUid, setViewerUid] = useState<string | null>(null);

  const { language } = useUserLanguage(viewerUid);
  const officialResults = usePlayoffOfficialResults(resolvedSeason);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const me = auth.currentUser;

      if (!me) {
        router.replace("/web/signup");
        return;
      }

      if (!cancelled) setViewerUid(me.uid);

      try {
        const saved = await loadPlayoffBracket(me.uid, fallbackSeason);

        if (!saved) {
          router.replace(`/web/playoff-bracket?season=${encodeURIComponent(fallbackSeason)}`);
          return;
        }

        const season = saved.season ?? fallbackSeason;
        const nextDisplay = buildPlayoffDisplayData(saved.bracket, season);

        if (cancelled) return;

        setSavedBracket(saved.bracket);
        setResolvedSeason(season);
        setDisplay(nextDisplay);
        setLoading(false);
      } catch (e) {
        console.error("failed to load playoff bracket view", e);
        router.replace(`/web/playoff-bracket?season=${encodeURIComponent(fallbackSeason)}`);
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
        読み込み中...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050b14] px-4 py-6">
      <PlayoffFullBracketWeb
        league="nba"
        season={display.season}
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
    </main>
  );
}