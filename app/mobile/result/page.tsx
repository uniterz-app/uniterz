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

  if (!authReady) return null;
  if (!uid) return null;

  return (
    <div className="px-[18px] py-4 pb-bottom-nav">
      <ResultListWithOverlay
        grouped={grouped}
        loading={loading}
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
