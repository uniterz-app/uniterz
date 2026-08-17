"use client";

import LeaderboardsTabbedView from "@/app/component/leaderboards/LeaderboardsTabbedView";
import TutorialLiveHost from "@/app/component/tutorial/TutorialLiveHost";

export default function LeaderboardsPage() {
  return (
    <div className="min-h-dvh">
      <main className="pb-bottom-nav">
        <LeaderboardsTabbedView variant="mobile" />
      </main>
      <TutorialLiveHost page="groups" />
    </div>
  );
}
