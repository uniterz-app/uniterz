"use client";

import NbaLeagueTeamStatsPanel from "@/app/component/teamStats/NbaLeagueTeamStatsPanel";

/** Dev mirror of `/mobile/team-stats-preview` */
export default function DevTeamStatsPreviewPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-lg bg-app px-4 pb-10 pt-4 text-white">
      <NbaLeagueTeamStatsPanel />
    </main>
  );
}
