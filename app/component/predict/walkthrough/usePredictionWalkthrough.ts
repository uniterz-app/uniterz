"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { predictionWalkthroughSteps } from "./stepDefinitions";
import type { WalkthroughStep } from "./stepDefinitions";

/** PredictionForm で使う ref 群の型（★ 最小構成に変更） */
type PredictionRefs = {
  mainOption: React.RefObject<HTMLSelectElement | null>;
  mainOdds: React.RefObject<HTMLInputElement | null>;
  mainPct: React.RefObject<HTMLInputElement | null>;
  secondaryOption: React.RefObject<HTMLSelectElement | null>;
};

export function usePredictionWalkthrough() {
  /** ref（★ 必要な4つだけ） */
  const refs: PredictionRefs = {
    mainOption: useRef(null),
    mainOdds: useRef(null),
    mainPct: useRef(null),
    secondaryOption: useRef(null),
  };

  const [running, setRunning] = useState(false);
  const [index, setIndex] = useState(0);

  /** ハイライト対象 rect */
  const [targetRect, setTargetRect] = useState<DOMRect>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    toJSON() {},
  });

  const step: WalkthroughStep = predictionWalkthroughSteps[index];

  /** rect 読み取り */
  const updateRect = useCallback(() => {
    if (!step || !step.target) return;

    const el = refs[step.target]?.current;
    if (!el) return;

    setTargetRect(el.getBoundingClientRect());
  }, [step, refs]);

  /** 次へ */
  const next = useCallback(() => {
    if (index + 1 >= predictionWalkthroughSteps.length) setRunning(false);
    else setIndex((v) => v + 1);
  }, [index]);

  /** 閉じる */
  const close = useCallback(() => {
    setRunning(false);
  }, []);

  /** start(): 任意ステップから実行 */
  const start = useCallback(
    (stepKey: WalkthroughStep["key"]) => {
      const idx = predictionWalkthroughSteps.findIndex((s) => s.key === stepKey);
      if (idx < 0) return;

      setIndex(idx);
      setRunning(true);

      // iPhone 対策：3フレーム後に rect 読む
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            updateRect();
          });
        });
      });
    },
    [updateRect]
  );

  /** step 変更で rect 再計算 */
  useEffect(() => {
    if (!running) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => updateRect());
      });
    });
  }, [step, running, updateRect]);

  /** スクロール・リサイズ時に再計算 */
  useEffect(() => {
    if (!running) return;

    const sync = () => updateRect();

    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, { passive: true });

    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync);
    };
  }, [running, updateRect]);

  return {
    running,
    step,
    targetRect,
    refs,
    next,
    close,
    start,
  };
}
