"use client";

/**
 * /dev/season-standings-preview · /mobile/season-standings-preview
 * NBA シーズン順位予想
 */

import { useState } from "react";
import GamesNbaSubpageShell from "@/app/component/games/GamesNbaSubpageShell";
import NbaSeasonStandingsPredictPanel from "@/app/component/predict/season/NbaSeasonStandingsPredictPanel";
import {
  emptySeasonStandingsPrediction,
  isSeasonStandingsComplete,
  type NbaSeasonStandingsPrediction,
} from "@/lib/predict/nbaSeasonStandingsPredict";
import { nameOxanium } from "@/lib/fonts";

const SEASON = "2026-27";

export default function SeasonStandingsPreviewPage() {
  const [pred, setPred] = useState<NbaSeasonStandingsPrediction>(() =>
    emptySeasonStandingsPrediction(SEASON)
  );
  const [submitted, setSubmitted] = useState(false);

  return (
    <GamesNbaSubpageShell
      eyebrow="NBA · SEASON"
      title="STANDINGS"
      subtitle="East / West 各 1〜15 位を予想。同じチームは同じカンファレンス内で一度だけ使えます。"
    >
      <NbaSeasonStandingsPredictPanel
        value={pred}
        onChange={(next) => {
          setPred(next);
          setSubmitted(false);
        }}
        onSubmit={() => {
          if (!isSeasonStandingsComplete(pred)) return;
          setSubmitted(true);
        }}
      />

      {submitted ? (
        <p
          className={[
            nameOxanium.className,
            "mt-3 border border-[#2DFF6E]/35 bg-[#2DFF6E]/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#2DFF6E]/90",
          ].join(" ")}
          style={{
            clipPath:
              "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
          }}
        >
          Submit locked in · preview mode
        </p>
      ) : null}
    </GamesNbaSubpageShell>
  );
}
