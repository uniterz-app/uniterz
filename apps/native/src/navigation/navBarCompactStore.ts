/** 下部タブピルを縮めるかどうか（縦スクロールとタップが書き、AppTabBar が読む） */
import { useCallback, useRef } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

/** タブを触ってから、通常サイズを見せておく時間 */
const SHRINK_AFTER_TOUCH_MS = 3000;

let compact = false;
/** 触って縮めたあとは、リスト先頭でも勝手に大きく戻さない */
let holdCompactUntilScrollUp = false;
let shrinkTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

export function getNavBarCompact(): boolean {
  return compact;
}

export function setNavBarCompact(next: boolean) {
  if (compact === next) return;
  compact = next;
  listeners.forEach((l) => l());
}

function cancelNavBarShrinkTimer() {
  if (shrinkTimer == null) return;
  clearTimeout(shrinkTimer);
  shrinkTimer = null;
}

/** ナビを触った、または画面を移った。いったん通常サイズにして、数秒後に縮める */
export function noteNavBarTouched() {
  cancelNavBarShrinkTimer();
  holdCompactUntilScrollUp = false;
  setNavBarCompact(false);
  shrinkTimer = setTimeout(() => {
    shrinkTimer = null;
    holdCompactUntilScrollUp = true;
    setNavBarCompact(true);
  }, SHRINK_AFTER_TOUCH_MS);
}

export function subscribeNavBarCompact(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 方向が揃った移動量がこれを超えたら切り替える */
const TOGGLE_DISTANCE = 12;
/** 先頭付近では通常サイズ。触ったあとの縮小待ち・縮小中は戻さない */
const TOP_ZONE = 8;

/** 縦スクロール 1 本ぶんの判定。下へで縮め、上へ戻すか先頭で通常サイズ */
export function useNavBarCompactScrollHandler() {
  const lastY = useRef(0);
  const acc = useRef(0);

  return useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    /** 中身が画面に収まる（スクロールしない）ものは触らない */
    if (contentSize.height <= layoutMeasurement.height + 1) return;
    const y = contentOffset.y;
    const dy = y - lastY.current;
    lastY.current = y;
    if (y <= TOP_ZONE) {
      acc.current = 0;
      if (holdCompactUntilScrollUp || shrinkTimer != null) return;
      setNavBarCompact(false);
      return;
    }
    /** 末尾のバウンスで戻さない */
    if (y >= contentSize.height - layoutMeasurement.height - 1) return;
    acc.current =
      Math.sign(dy) === Math.sign(acc.current) ? acc.current + dy : dy;
    if (acc.current > TOGGLE_DISTANCE) setNavBarCompact(true);
    else if (acc.current < -TOGGLE_DISTANCE) {
      /** 上方向のスクロールは「大きく戻す」意思なので、触ったあとの縮小は取り消す */
      holdCompactUntilScrollUp = false;
      cancelNavBarShrinkTimer();
      setNavBarCompact(false);
    }
  }, []);
}
