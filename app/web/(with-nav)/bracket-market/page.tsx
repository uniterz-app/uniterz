"use client";

import PlayoffBracketMarket from "@/app/component/predict/market/PlayoffBracketMarket";
import { getCurrentPlayoffSeason } from "@/lib/playoff-bracket-config";

export default function WebPlayoffBracketMarketPage() {
  const season = getCurrentPlayoffSeason();

  return (
    <main className="min-h-screen bg-[#050b14] px-4 py-6 text-white">
      <PlayoffBracketMarket season={season} />
    </main>
  );
}