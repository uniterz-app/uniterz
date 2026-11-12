import { useEffect, useState } from "react";

/** 縦スクロール中は右端 BACK を隠す。止まったら戻す。 */
const IDLE_MS = 220;

let scrolling = false;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function notifyBackEdgeScroll() {
  if (timer) clearTimeout(timer);
  if (!scrolling) {
    scrolling = true;
    emit();
  }
  timer = setTimeout(() => {
    scrolling = false;
    timer = null;
    emit();
  }, IDLE_MS);
}

export function useBackEdgeScrolling(): boolean {
  const [on, setOn] = useState(scrolling);
  useEffect(() => {
    const listener = () => setOn(scrolling);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return on;
}
