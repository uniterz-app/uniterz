"use client";

import ResultListWithOverlay from "@/app/component/result/ResultListWithOverlay";
import { useResultPagePosts } from "@/lib/hooks/useResultPagePosts";

export default function ResultPage() {
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
  } = useResultPagePosts();

  if (!authReady || !uid) return null;

  return (
    <div className="px-4 py-4 pb-bottom-nav">
      <ResultListWithOverlay
        grouped={grouped}
        loading={loading}
        hasMore={hasMore}
        postsCacheCapped={postsCacheCapped}
        sentinelRef={sentinelRef}
        setInfiniteScrollEnabled={setInfiniteScrollEnabled}
        refreshResultPosts={refreshPosts}
        language={language}
        platform="web"
      />
    </div>
  );
}
