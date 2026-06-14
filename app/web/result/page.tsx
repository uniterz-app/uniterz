"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ResultListWithOverlay from "@/app/component/result/ResultListWithOverlay";
import { useResultPagePosts } from "@/lib/hooks/useResultPagePosts";
import { LEAGUES } from "@/lib/leagues";
import type { ResultListLeagueTab } from "@/lib/result/result-page-data";

export default function ResultPage() {
  const [leagueTab, setLeagueTab] = useState<ResultListLeagueTab>(LEAGUES.WC);
  const leagueDefaultAppliedRef = useRef(false);

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
  } = useResultPagePosts(leagueTab, {
    waitForLeagueFlags: false,
  });

  // フラグ確定後に 1 回だけ補正（NBA のみのユーザーだけ NBA へ）
  useEffect(() => {
    if (!flagsReady || !uid || leagueDefaultAppliedRef.current) return;
    leagueDefaultAppliedRef.current = true;
    setLeagueTab(defaultLeagueTab);
  }, [flagsReady, uid, defaultLeagueTab]);

  const handleLeagueTabChange = useCallback((tab: ResultListLeagueTab) => {
    setLeagueTab(tab);
  }, []);

  if (!authReady) {
    return (
      <div className="px-4 py-4 pb-bottom-nav">
        <ResultPageSkeleton />
      </div>
    );
  }

  if (!uid) return null;

  return (
    <div className="px-4 py-4 pb-bottom-nav">
      <ResultListWithOverlay
        leagueTab={leagueTab}
        onLeagueTabChange={handleLeagueTabChange}
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

/** 初回ロード時の骨組み（タブ → フィルタバー → カード枠）。真っ白回避で体感速度を上げる */
function ResultPageSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 skeleton-scan" />
      <div className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 skeleton-scan" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-9 w-2/3 rounded-xl border border-white/10 bg-white/5 skeleton-scan" />
            <div className="h-28 w-full rounded-2xl border border-white/10 bg-white/5 skeleton-scan" />
          </div>
        ))}
      </div>
    </div>
  );
}
