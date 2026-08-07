"use client";

import NbaLeaguePlayerStatLeadersPanel from "@/app/component/playerStats/NbaLeaguePlayerStatLeadersPanel";

/** Dev: リーグ Player Stats プレビュー */
export default function DevPlayerStatsPreviewPage() {
  return (
    <main className="min-h-dvh bg-app px-4 pb-24 pt-4 text-white">
      <NbaLeaguePlayerStatLeadersPanel />
    </main>
  );
}
