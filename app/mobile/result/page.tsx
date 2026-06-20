"use client";

import { useCallback, useEffect, useState } from "react";
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
  } = useResultPagePosts(leagueTab ?? LEAGUES.WC, {
    waitForLeagueFlags: true,
    enabled: leagueTab !== null,
  });

  useEffect(() => {
    if (!flagsReady || !uid || leagueTab !== null) return;
    setLeagueTab(defaultLeagueTab);
  }, [flagsReady, uid, defaultLeagueTab, leagueTab]);

  const handleLeagueTabChange = useCallback((tab: ResultListLeagueTab) => {
    setLeagueTab(tab);
  }, []);

  if (!authReady) {
    return (
      <div className="px-[18px] py-4 pb-bottom-nav">
        <ResultPageSkeleton />
      </div>
    );
  }

  if (!uid) return null;

  const listLoading = leagueTab === null || (loading && grouped.length === 0);

  return (
    <div className="px-[18px] py-4 pb-bottom-nav">
      <ResultListWithOverlay
        leagueTab={leagueTab ?? defaultLeagueTab}
        onLeagueTabChange={handleLeagueTabChange}
        showResultLeagueTabs={showResultLeagueTabs}
        grouped={grouped}
        loading={listLoading}
        hasMore={hasMore}
        postsCacheCapped={postsCacheCapped}
        sentinelRef={sentinelRef}
        setInfiniteScrollEnabled={setInfiniteScrollEnabled}
        refreshResultPosts={refreshPosts}
        language={language}
        platform="mobile"
        viewerUid={uid}
      />
    </div>
  );
}

/** 初回ロード時の骨組み（タブ → フィルタバー → カード枠）。真っ白回避で体感速度を上げる */
function ResultPageSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <div className="h-10 w-full rounded-2xl border border-white/10 bg-white/5 skeleton-scan" />
      <div className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 skeleton-scan" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-9 w-2/3 rounded-xl border border-white/10 bg-white/5 skeleton-scan" />
            <div className="h-28 w-full rounded-2xl border border-white/10 bg-white/5 skeleton-scan" />
          </div>
        ))}
      </div>
    </div>
  );
}
