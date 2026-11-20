import { useIsFocused } from "@react-navigation/native";
import { useEffect } from "react";
import { trackPageViewNative } from "./appAnalyticsNative";

/** 読み込み中の一瞬だけ出る表示（プラン判定前のロック等）を数えない */
const SETTLE_MS = 600;

/**
 * 画面の中で切り替わる表示（タブ・モーダル）を page_view として記録する。
 * 画面にフォーカスが戻ったときと `title` が変わったときに 1 回。`title` が null のあいだは記録しない。
 */
export function useTrackViewNative(title: string | null, path: string): void {
  const isFocused = useIsFocused();
  useEffect(() => {
    if (!isFocused || !title) return;
    const timer = setTimeout(() => trackPageViewNative(title, path), SETTLE_MS);
    return () => clearTimeout(timer);
  }, [isFocused, title, path]);
}
