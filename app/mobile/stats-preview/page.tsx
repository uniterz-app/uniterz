"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import LeagueStatsHubPanel from "@/app/component/stats/LeagueStatsHubPanel";

function StatsPreviewInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const tab = sp.get("tab");
  const initialTab = tab === "player" ? "player" : "team";
  return (
    <LeagueStatsHubPanel
      initialTab={initialTab}
      shell
      onClose={() => router.back()}
    />
  );
}

/** STATS ハブ（Team 既定 · Player タブ切替） */
export default function MobileStatsPreviewPage() {
  return (
    <Suspense fallback={null}>
      <StatsPreviewInner />
    </Suspense>
  );
}
