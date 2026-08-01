"use client";

/**
 * /dev/season-awards-preview · /mobile/season-awards-preview
 * NBA シーズンアワード予想
 */

import { useState } from "react";
import GamesNbaSubpageShell from "@/app/component/games/GamesNbaSubpageShell";
import NbaSeasonAwardsPredictPanel from "@/app/component/predict/season/NbaSeasonAwardsPredictPanel";
import {
  emptySeasonAwardsPrediction,
  type NbaSeasonAwardsPrediction,
} from "@/lib/predict/nbaSeasonAwardsPredict";

const SEASON = "2026-27";

export default function SeasonAwardsPreviewPage() {
  const [value, setValue] = useState<NbaSeasonAwardsPrediction>(() =>
    emptySeasonAwardsPrediction(SEASON)
  );

  return (
    <GamesNbaSubpageShell
      eyebrow="NBA · SEASON"
      title="AWARDS"
      subtitle="MVP・DPOY など主要アワードを予想。候補は人気ピックから選び、名前検索でも絞り込めます。"
    >
      <NbaSeasonAwardsPredictPanel value={value} onChange={setValue} />
    </GamesNbaSubpageShell>
  );
}
