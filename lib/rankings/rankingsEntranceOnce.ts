"use client";

import { useRef } from "react";

/** 最初の画面に並ぶ行がマウントし終わるまでの窓 */
const ENTRANCE_WINDOW_MS = 1500;

const startedAt = new Map<string, number>();
const completed = new Set<string>();
let latestKey: string | null = null;

/**
 * 同じ項目の IN は最初の一度だけ。
 * 別の項目へ移った時点で前の項目は打ち切り、戻っても流さない。
 * 同じ入場の途中（窓のあいだ）に遅れてマウントされた行だけは流す。
 */
export function rankingsEntranceShouldPlay(key: string): boolean {
  if (!key) return false;
  if (completed.has(key)) return false;

  const now = Date.now();
  const started = startedAt.get(key);
  if (started == null) {
    if (latestKey != null && latestKey !== key) completed.add(latestKey);
    startedAt.set(key, now);
    latestKey = key;
    return true;
  }

  if (latestKey !== key) {
    completed.add(key);
    return false;
  }

  if (now - started > ENTRANCE_WINDOW_MS) {
    completed.add(key);
    return false;
  }

  return true;
}

/** 項目キーごとに、最初に見たときの再生可否を固定する */
export function useRankingsEntrancePlay(pageKey: string): boolean {
  const decisionRef = useRef<{ key: string; play: boolean } | null>(null);
  if (decisionRef.current?.key !== pageKey) {
    decisionRef.current = {
      key: pageKey,
      play: rankingsEntranceShouldPlay(pageKey),
    };
  }
  return decisionRef.current.play;
}
