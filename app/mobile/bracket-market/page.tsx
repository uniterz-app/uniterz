"use client";

import PlayoffBracketMarket from "@/app/component/predict/market/PlayoffBracketMarket";
import { getCurrentPlayoffSeason } from "@/lib/playoff-bracket-config";

export default function MobilePlayoffBracketMarketPage() {
  const season = getCurrentPlayoffSeason();

  return (
    <main className="min-h-screen px-3 py-5 text-white">
      <div className="mx-auto max-w-md">
        <PlayoffBracketMarket season={season} />
      </div>
    </main>
  );
}
