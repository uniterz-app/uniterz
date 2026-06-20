"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  hasRankingsCountUpIntroPlayed,
  markRankingsCountUpIntroPlayed,
} from "@/lib/rankings/rankingsCountUpIntro";

/** ポディウムのカウント完了後にリストを表示するゲート */
export function useRankingsTopDone(pageKey: string) {
  const [introPlayed, setIntroPlayed] = useState(false);
  const [topDone, setTopDone] = useState(false);
  const pageKeyRef = useRef(pageKey);
  pageKeyRef.current = pageKey;

  useLayoutEffect(() => {
    if (hasRankingsCountUpIntroPlayed()) {
      setIntroPlayed(true);
      setTopDone(true);
    }
  }, []);

  useEffect(() => {
    if (introPlayed) {
      setTopDone(true);
      return;
    }
    setTopDone(false);
  }, [pageKey, introPlayed]);

  const handleTopCountDone = useCallback(() => {
    if (pageKeyRef.current !== pageKey) return;
    markRankingsCountUpIntroPlayed();
    setIntroPlayed(true);
    setTopDone(true);
  }, [pageKey]);

  return {
    /** カウントアップ演出をスキップする（初回以降・プロフィールからの復帰） */
    skipCountUp: introPlayed,
    topDone,
    handleTopCountDone,
  };
}
