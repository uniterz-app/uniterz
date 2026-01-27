"use client";

import StreakSummaryWithComment from "@/app/component/pro/analysis/StreakSummaryWithComment";

export default function ProUpsetPreviewPage() {
  return (
    <div className="p-6 space-y-6 text-white">
      <StreakSummaryWithComment
        maxWinStreak={6}
        maxLoseStreak={3}
        lastMaxWinStreak={4}
        lastMaxLoseStreak={2}
        periodLabel="2026年1月"
      />
    </div>
  );
}
