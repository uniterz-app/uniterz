"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { predictionWalkthroughSteps } from "./stepDefinitions";
import type { WalkthroughStep } from "./stepDefinitions";

/** PredictionForm で使う ref 群の型 */
type PredictionRefs = {
  mainOption: React.RefObject<HTMLSelectElement | null>;
  mainOdds: React.RefObject<HTMLInputElement | null>;
  mainPct: React.RefObject<HTMLInputElement | null>;
  mainUnits: React.RefObject<HTMLInputElement | null>;

  secondaryOption: React.RefObject<HTMLSelectElement | null>;
  secondaryOdds: React.RefObject<HTMLInputElement | null>;
  secondaryPct: React.RefObject<HTMLInputElement | null>;
  secondaryUnits: React.RefObject<HTMLInputElement | null>;

  tertiaryOption: React.RefObject<HTMLSelectElement | null>;
  tertiaryOdds: React.RefObject<HTMLInputElement | null>;
  tertiaryPct: React.RefObject<HTMLInputElement | null>;
  tertiaryUnits: React.RefObject<HTMLInputElement | null>;

  reason: React.RefObject<HTMLTextAreaElement | null>;
  autoUpdateInfo: React.RefObject<HTMLElement | null>;
};

export function usePredictionWalkthrough() {
  /** 各フォーム要素の ref */
  const refs: PredictionRefs = {
    mainOption: useRef(null),
    mainOdds: useRef(null),
    mainPct: useRef(null),
    mainUnits: useRef(null),

    secondaryOption: useRef(null),
    secondaryOdds: useRef(null),
    secondaryPct: useRef(null),
    secondaryUnits: useRef(null),

    tertiaryOption: useRef(null),
    tertiaryOdds: useRef(null),
    tertiaryPct: useRef(null),
    tertiaryUnits: useRef(null),

    reason: useRef(null),
    autoUpdateInfo: useRef(null),
  };

  const [running, setRunning] = useState(false);
  const [index, setIndex] = useState(0);

  /** ハイライト対象の rect */
  const [targetRect, setTargetRect] = useState<DOMRect>({
    x: 0, y: 0, width: 0, height: 0,
    left: 0, top: 0, right: 0, bottom: 0,
    toJSON() {},
  });

  const step: WalkthroughStep = predictionWalkthroughSteps[index];

  /** rect を読む関数（refs は依存に入れない） */
  const updateRect = useCallback(() => {
    if (!step || !step.target) return;

    const el = refs[step.target as keyof PredictionRefs]?.current;
    if (!el) return;

    setTargetRect(el.getBoundingClientRect());
  }, [step]);

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

      // 3フレーム待って rect を読む（iPhone / select 安定対策）
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

  /** step 変更時に rect 再計算（無限ループしない） */
  useEffect(() => {
    if (!running) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          updateRect();
        });
      });
    });
  }, [step, running, updateRect]);

  /** スクロール / リサイズで再計算 */
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
