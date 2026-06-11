"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** ポディウムのカウント完了後にリストを表示するゲート */
export function useRankingsTopDone(pageKey: string) {
  const introRef = useRef(true);
  const intro = introRef.current;

  useEffect(() => {
    introRef.current = false;
  }, []);

  const [topDone, setTopDone] = useState(false);
  const pageKeyRef = useRef(pageKey);
  pageKeyRef.current = pageKey;

  useEffect(() => {
    setTopDone(false);
  }, [pageKey]);

  const handleTopCountDone = useCallback(() => {
    if (pageKeyRef.current !== pageKey) return;
    setTopDone(true);
  }, [pageKey]);

  return { intro, topDone, handleTopCountDone };
}
