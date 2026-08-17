"use client";

import { useRouter } from "next/navigation";
import PlayoffBracketMarket from "@/app/component/predict/market/PlayoffBracketMarket";
import MobilePageShell from "@/app/component/common/MobilePageShell";
import { getCurrentPlayoffSeason } from "@/lib/playoff-bracket-config";

export default function MobilePlayoffBracketMarketPage() {
  const router = useRouter();
  const season = getCurrentPlayoffSeason();

  return (
    <MobilePageShell
      eyebrow="GAMES"
      title="MARKET"
      onClose={() => router.back()}
    >
      <PlayoffBracketMarket season={season} />
    </MobilePageShell>
  );
}
