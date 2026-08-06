"use client";

import NbaLeagueTeamStatsPanel from "@/app/component/teamStats/NbaLeagueTeamStatsPanel";

/** リーグ視点 Team Stats（モック）— 予想内の 2 チーム比較とは別画面 */
export default function MobileTeamStatsPreviewPage() {
  return (
    <main className="min-h-dvh bg-app px-4 pb-bottom-nav pt-4 text-white">
      <NbaLeagueTeamStatsPanel />
    </main>
  );
}
