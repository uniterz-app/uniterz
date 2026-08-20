"use client";

import { useMemo, useState } from "react";
import NbaTopScorerPicker from "@/app/component/predict/nba/NbaTopScorerPicker";
import {
  calcNbaTopScorerBonus,
  normalizeNbaLeadingScorers,
  type NbaTopScorerPick,
} from "@/lib/nba/topScorer";
import { topScorerCandidatesForMatchup } from "@/lib/predict/nbaTopScorerPreviewMocks";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { auth } from "@/lib/firebase";
import { t } from "@/lib/i18n/t";

const HOME_ID = "nba-pistons";
const AWAY_ID = "nba-celtics";

export default function NbaTopScorerPreviewPage() {
  const { language } = useUserLanguage(auth.currentUser?.uid ?? null);
  const m = t(language);
  const candidates = useMemo(
    () => topScorerCandidatesForMatchup(HOME_ID, AWAY_ID),
    []
  );
  const [pick, setPick] = useState<NbaTopScorerPick | null>(null);

  const demoLeaders = useMemo(
    () =>
      normalizeNbaLeadingScorers([
        {
          playerId: "1628369",
          teamId: AWAY_ID,
          points: 34,
          name: "J.TATUM",
        },
        {
          playerId: "1630595",
          teamId: HOME_ID,
          points: 31,
          name: "C.CUNNINGHAM",
        },
      ]),
    []
  );
  const bonus = calcNbaTopScorerBonus(
    "nba",
    { goalScorer: pick },
    demoLeaders
  );

  return (
    <main className="mx-auto min-h-dvh max-w-lg bg-[#07090f] px-4 py-6 text-white">
      <h1 className="text-lg font-bold tracking-wide">
        NBA Top Scorer Preview
      </h1>
      <p className="mt-1 text-xs text-white/50">
        Pistons vs Celtics · 最多得点者予想 · 的中 +2
      </p>

      <div className="mt-5">
        <NbaTopScorerPicker
          homeTeamId={HOME_ID}
          awayTeamId={AWAY_ID}
          homeLabel="Pistons"
          awayLabel="Celtics"
          candidates={candidates}
          value={pick}
          onChange={setPick}
          language={language}
          isMobile
        />
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm">
        <div className="text-white/55">{m.predict.nbaTopScorerBonusHint}</div>
        <div className="mt-1 font-mono text-xs text-white/80">
          pick: {pick ? JSON.stringify(pick) : "null"}
        </div>
        <div className="mt-1 font-mono text-xs text-cyan-200/90">
          demo leaders (max pts): {JSON.stringify(demoLeaders)}
        </div>
        <div className="mt-2 text-base font-semibold text-cyan-100">
          bonus = {bonus}
        </div>
      </div>
    </main>
  );
}
