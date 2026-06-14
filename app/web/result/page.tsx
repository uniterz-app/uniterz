"use client";

import { useCallback, useEffect, useState } from "react";
import ResultListWithOverlay from "@/app/component/result/ResultListWithOverlay";
import { useResultPagePosts } from "@/lib/hooks/useResultPagePosts";
import { LEAGUES } from "@/lib/leagues";
import type { ResultListLeagueTab } from "@/lib/result/result-page-data";
import {
  readLastResultLeagueTab,
  writeLastResultLeagueTab,
} from "@/lib/result/resultLastLeagueTab";

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
    // フラグ取得（users/{uid}）を待たず、タブ確定後すぐ投稿取得を開始する
    waitForLeagueFlags: false,
    enabled: leagueTab !== null,
  });

  // 直近に選んだタブを即時採用 → フラグ取得と並行で初回投稿を取得（ウォーターフォール短縮）
  useEffect(() => {
    if (leagueTab !== null) return;
    const saved = readLastResultLeagueTab();
    if (saved) setLeagueTab(saved);
  }, [leagueTab]);

  // 保存タブが無い初回ユーザーは、フラグ確定後のデフォルトを使う
  useEffect(() => {
    if (!flagsReady) return;
    setLeagueTab((prev) => prev ?? defaultLeagueTab);
  }, [flagsReady, defaultLeagueTab]);

  const handleLeagueTabChange = useCallback((tab: ResultListLeagueTab) => {
    setLeagueTab(tab);
    writeLastResultLeagueTab(tab);
  }, []);

  // 認証確定前・タブ未確定の間はスケルトン（真っ白を出さない）
  if (!authReady || leagueTab === null) {
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
