"use client";

import PlayoffBracketMarket from "@/app/component/predict/market/PlayoffBracketMarket";
import { getCurrentPlayoffSeason } from "@/lib/playoff-bracket-config";

export default function WebPlayoffBracketMarketPage() {
  const season = getCurrentPlayoffSeason();

  return (
    <main className="min-h-screen px-4 py-6 text-white">
      <PlayoffBracketMarket season={season} />
    </main>
  );
}
