"use client";

import { useMemo, useState } from "react";
import NbaTopScorerPicker from "@/app/component/predict/nba/NbaTopScorerPicker";
import {
  calcNbaTopScorerBonus,
  normalizeNbaLeadingScorers,
  type NbaTopScorerCandidate,
  type NbaTopScorerPick,
} from "@/lib/nba/topScorer";
import { NBA_ROSTER_BY_PRESET } from "@/lib/predict/nbaRosterPreviewMocks";
import { playerCardName } from "@/lib/predict/nbaRoster";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { auth } from "@/lib/firebase";
import { t } from "@/lib/i18n/t";

function candidatesFromRoster(): NbaTopScorerCandidate[] {
  const report = NBA_ROSTER_BY_PRESET["both-teams-rich"]!;
  const out: NbaTopScorerCandidate[] = [];
  for (const side of [report.home, report.away]) {
    for (const p of side.players) {
      out.push({
        playerId: String(p.id),
        teamId: side.teamId,
        name: playerCardName(p),
        ppg: p.ppg,
        position: p.position,
        jerseyNumber: p.jerseyNumber ?? null,
      });
    }
  }
  return out;
}

export default function NbaTopScorerPreviewPage() {
  const { language } = useUserLanguage(auth.currentUser?.uid ?? null);
  const m = t(language);
  const candidates = useMemo(() => candidatesFromRoster(), []);
  const [pick, setPick] = useState<NbaTopScorerPick | null>(null);

  const demoLeaders = useMemo(
    () =>
      normalizeNbaLeadingScorers([
        { playerId: "15", teamId: "nba-lakers", points: 32, name: "A.DAVIS" },
        { playerId: "237", teamId: "nba-lakers", points: 28, name: "L.JAMES" },
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
        試合ごとの最多得点者予想 · 的中 +2 · mock roster
      </p>

      <div className="mt-5">
        <NbaTopScorerPicker
          homeTeamId="nba-lakers"
          awayTeamId="nba-celtics"
          homeLabel="Lakers"
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
