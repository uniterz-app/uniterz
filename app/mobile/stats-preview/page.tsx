"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import LeagueStatsHubPanel from "@/app/component/stats/LeagueStatsHubPanel";

function StatsPreviewInner() {
  const sp = useSearchParams();
  const initialTab = sp.get("tab") === "player" ? "player" : "team";
  return <LeagueStatsHubPanel initialTab={initialTab} />;
}

/** STATS ハブ（Team 既定 · Player タブ切替） */
export default function MobileStatsPreviewPage() {
  return (
    <main className="min-h-dvh bg-app px-4 pb-bottom-nav pt-4 text-white">
      <Suspense fallback={null}>
        <StatsPreviewInner />
      </Suspense>
    </main>
  );
}
