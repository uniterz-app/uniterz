"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { loadPlayoffBracket } from "@/lib/playoff-bracket-firestore";
import { buildPlayoffDisplayData } from "@/lib/playoff-bracket-display";
import PlayoffFullBracketWeb from "@/app/component/predict/PlayoffFullBracketWeb";

const FALLBACK_SEASON = "2026";

export default function WebPlayoffBracketViewPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [display, setDisplay] = useState<any | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const me = auth.currentUser;

      if (!me) {
        router.replace("/web/signup");
        return;
      }

      try {
        const saved = await loadPlayoffBracket(me.uid);

        if (!saved) {
          router.replace("/web/playoff-bracket");
          return;
        }

        const nextDisplay = buildPlayoffDisplayData(
          saved.bracket,
          saved.season ?? FALLBACK_SEASON
        );

        if (cancelled) return;

        setDisplay(nextDisplay);
        setLoading(false);
      } catch (e) {
        console.error("failed to load playoff bracket view", e);
        router.replace("/web/playoff-bracket");
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading || !display) {
    return (
      <div className="min-h-screen bg-[#050b14] text-white flex items-center justify-center">
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
/>
    </main>
  );
}