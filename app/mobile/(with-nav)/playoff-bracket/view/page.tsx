"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { loadPlayoffBracket } from "@/lib/playoff-bracket-firestore";
import { buildPlayoffDisplayData } from "@/lib/playoff-bracket-display";
import PlayoffFullBracketMobile from "@/app/component/predict/PlayoffFullBracketMobile";

const FALLBACK_SEASON = "2026";

export default function MobilePlayoffBracketViewPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState(FALLBACK_SEASON);
  const [display, setDisplay] = useState<any | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const me = auth.currentUser;

      if (!me) {
        router.replace("/mobile/signup");
        return;
      }

      try {
        const saved = await loadPlayoffBracket(me.uid);

        if (!saved) {
          router.replace("/mobile/playoff");
          return;
        }

        const resolvedSeason = saved.season ?? FALLBACK_SEASON;

        const nextDisplay = buildPlayoffDisplayData(
          saved.bracket,
          resolvedSeason
        );

        if (cancelled) return;

        setSeason(resolvedSeason);
        setDisplay(nextDisplay);
        setLoading(false);
      } catch (e) {
        console.error("failed to load playoff bracket view", e);
        router.replace("/mobile/playoff");
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading || !display) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050b14] text-white">
        読み込み中...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050b14] px-4 py-4 text-white">
      <div className="relative mt-4">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-full w-[calc(100vw-10px)] -translate-x-1/2 rounded-[18px] bg-[#020611]"
        />

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
          />
        </div>
      </div>
    </main>
  );
}