"use client";

import LeaderboardsTabbedView from "@/app/component/leaderboards/LeaderboardsTabbedView";

export default function WebLeaderboardsPage() {
  return (
    <div className="min-h-dvh bg-app text-white">
      <main className="mx-auto w-full max-w-7xl px-6 pb-bottom-nav pt-6 lg:px-10">
        <LeaderboardsTabbedView variant="web" />
      </main>
    </div>
  );
}
