"use client";

import LeaderboardsTabbedView from "@/app/component/leaderboards/LeaderboardsTabbedView";

export default function LeaderboardsPage() {
  return (
    <div className="min-h-dvh">
      <main className="pb-bottom-nav">
        <LeaderboardsTabbedView variant="mobile" />
      </main>
    </div>
  );
}
