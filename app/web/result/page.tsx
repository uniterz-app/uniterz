"use client";

import { useEffect, useState } from "react";
import ResultListWithOverlay from "@/app/component/result/ResultListWithOverlay";
import { useResultPagePosts } from "@/lib/hooks/useResultPagePosts";
import { LEAGUES } from "@/lib/leagues";
import type { ResultListLeagueTab } from "@/lib/result/result-page-data";

export default function ResultPage() {
  const [leagueTab, setLeagueTab] = useState<ResultListLeagueTab | null>(null);

  const {
    authReady,
    uid,
    language,
    grouped,
    loading,
    hasMore,
    postsCacheCapped,
    sentinelRef,
    setInfiniteScrollEnabled,
    refreshPosts,
    flagsReady,
    showResultLeagueTabs,
    defaultLeagueTab,
  } = useResultPagePosts(leagueTab ?? LEAGUES.NBA, {
    waitForLeagueFlags: true,
    enabled: leagueTab !== null,
  });

  useEffect(() => {
    if (!flagsReady) return;
    setLeagueTab((prev) => prev ?? defaultLeagueTab);
  }, [flagsReady, defaultLeagueTab]);

  if (!authReady || !uid || !flagsReady || leagueTab === null) return null;

  return (
    <div className="px-4 py-4 pb-bottom-nav">
      <ResultListWithOverlay
        leagueTab={leagueTab}
        onLeagueTabChange={setLeagueTab}
        showResultLeagueTabs={showResultLeagueTabs}
        grouped={grouped}
        loading={loading}
        hasMore={hasMore}
        postsCacheCapped={postsCacheCapped}
        sentinelRef={sentinelRef}
        setInfiniteScrollEnabled={setInfiniteScrollEnabled}
        refreshResultPosts={refreshPosts}
        language={language}
        platform="web"
        viewerUid={uid}
      />
    </div>
  );
}
