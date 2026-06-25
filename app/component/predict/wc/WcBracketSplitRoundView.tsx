"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
} from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import type { WcBracketPredictMatchId } from "@/lib/wc/wc-knockout-bracket";
import type { WcBracketState } from "@/lib/wc/wc-knockout-bracket";
import type { WcKnockoutAdvancement } from "@/lib/wc/wc-knockout-bracket-utils";
import {
  buildWcInputMatchView,
  isWcBracketRoundInputReady,
} from "@/lib/wc/wc-bracket-input-display";
import {
  WC_BRACKET_INPUT_PHASES,
  type WcBracketInputPhase,
  canOpenWcBracketPhase,
  isWcBracketPhaseComplete,
} from "@/lib/wc/wc-bracket-input-phases";
import {
  getWcNextMatchFeederIndices,
  WC_BRACKET_INPUT_COL_GAP_PX,
  WC_BRACKET_INPUT_HPAD,
  wcBracketInputColWidthCss,
  wcBracketInputFinalColWidthCss,
  wcBracketInputSplitCardsOuterClass,
  wcBracketMidpointY,
} from "@/lib/wc/wc-bracket-input-layout";
import WcBracketAppleMatchRow from "@/app/component/predict/wc/WcBracketAppleMatchRow";
import WcBracketAppleMatchRowSkeleton from "@/app/component/predict/wc/WcBracketAppleMatchRowSkeleton";
import type { Language } from "@/lib/i18n/language";

const SLIDE_MS = 480;
const SETTLE_MS = 420;
const ALIGN_MEASURE_FRAMES = 16;
const SETTLE_EASE = [0.25, 0.1, 0.25, 1] as const;

type Props = {
  activePhase: WcBracketInputPhase;
  bracket: WcBracketState;
  advancement: WcKnockoutAdvancement;
  language?: Language;
  onPick: (matchId: WcBracketPredictMatchId, teamId: string) => void;
  onPromotePhase?: (next: WcBracketInputPhase) => void;
};

function captureCardCenterTops(root: HTMLElement): Record<string, number> {
  const containerTop = root.getBoundingClientRect().top;
  const tops: Record<string, number> = {};

  root.querySelectorAll("[data-wc-match-row]").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const matchId = node.dataset.wcMatchRow;
    if (!matchId) return;
    const rect = node.getBoundingClientRect();
    tops[matchId] = rect.top + rect.height / 2 - containerTop;
  });

  return tops;
}

function ActiveRoundColumn({
  phaseId,
  bracket,
  advancement,
  language,
  onPick,
  registerRowRef,
}: {
  phaseId: WcBracketInputPhase;
  bracket: WcBracketState;
  advancement: WcKnockoutAdvancement;
  language: Language;
  onPick: (matchId: WcBracketPredictMatchId, teamId: string) => void;
  registerRowRef: (index: number, el: HTMLDivElement | null) => void;
}) {
  const phaseDef = WC_BRACKET_INPUT_PHASES.find((p) => p.id === phaseId)!;
  const open = canOpenWcBracketPhase(phaseId, bracket);

  const rows = useMemo(
    () =>
      phaseDef.matchIds.map((id) => ({
        id,
        match: buildWcInputMatchView(id, bracket, advancement),
      })),
    [phaseDef.matchIds, bracket, advancement]
  );

  if (!open || rows.every((r) => !r.match)) {
    return (
      <div className="flex flex-col gap-1.5" aria-hidden>
        {phaseDef.matchIds.map((id) => (
          <WcBracketAppleMatchRowSkeleton key={id} compact />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row, index) => (
        <div key={row.id} ref={(el) => registerRowRef(index, el)}>
          {row.match?.ready ? (
            <WcBracketAppleMatchRow
              match={row.match}
              language={language}
              compact
              onPick={onPick}
            />
          ) : (
            <WcBracketAppleMatchRowSkeleton compact />
          )}
        </div>
      ))}
    </div>
  );
}

function SettlingPromotedColumn({
  phaseId,
  alignedTops,
  bracket,
  advancement,
  language,
  onPick,
  registerRowRef,
  columnRef,
  onSettled,
}: {
  phaseId: WcBracketInputPhase;
  alignedTops: Record<string, number>;
  bracket: WcBracketState;
  advancement: WcKnockoutAdvancement;
  language: Language;
  onPick: (matchId: WcBracketPredictMatchId, teamId: string) => void;
  registerRowRef: (index: number, el: HTMLDivElement | null) => void;
  columnRef: RefObject<HTMLDivElement | null>;
  onSettled: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const measureColRef = useRef<HTMLDivElement>(null);
  const [stackTops, setStackTops] = useState<Record<string, number> | null>(
    null
  );
  const [colHeight, setColHeight] = useState(0);

  const phaseDef = WC_BRACKET_INPUT_PHASES.find((p) => p.id === phaseId)!;

  const rows = useMemo(
    () =>
      phaseDef.matchIds.map((id) => ({
        id,
        match: buildWcInputMatchView(id, bracket, advancement),
      })),
    [phaseDef.matchIds, bracket, advancement]
  );

  const measureStackTops = useCallback(() => {
    const col = measureColRef.current;
    if (!col) return;

    const containerTop = col.getBoundingClientRect().top;
    const nextTops: Record<string, number> = {};

    col.querySelectorAll("[data-wc-stack-measure]").forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      const matchId = node.dataset.wcStackMeasure;
      if (!matchId) return;
      const rect = node.getBoundingClientRect();
      nextTops[matchId] = rect.top + rect.height / 2 - containerTop;
    });

    if (Object.keys(nextTops).length > 0) {
      setStackTops(nextTops);
      setColHeight(col.offsetHeight);
    }
  }, []);

  useLayoutEffect(() => {
    measureStackTops();
    let frame = 0;
    let raf = 0;

    const tick = () => {
      measureStackTops();
      frame += 1;
      if (frame < 4) {
        raf = requestAnimationFrame(tick);
      }
    };
    tick();

    return () => cancelAnimationFrame(raf);
  }, [measureStackTops, rows]);

  useEffect(() => {
    if (reduceMotion) {
      onSettled();
      return;
    }
    if (!stackTops) return;

    const timer = setTimeout(onSettled, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [stackTops, reduceMotion, onSettled]);

  if (reduceMotion) {
    return (
      <div
        ref={columnRef}
        className="min-w-0 shrink-0"
        style={{ width: wcBracketInputColWidthCss(phaseId) }}
      >
        <ActiveRoundColumn
          phaseId={phaseId}
          bracket={bracket}
          advancement={advancement}
          language={language}
          onPick={onPick}
          registerRowRef={registerRowRef}
        />
      </div>
    );
  }

  return (
    <div
      ref={columnRef}
      className="relative min-w-0 shrink-0"
      style={{
        width: wcBracketInputColWidthCss(phaseId),
        minHeight: colHeight || undefined,
      }}
    >
      <div
        ref={measureColRef}
        className="invisible flex flex-col gap-1.5"
        aria-hidden
      >
        {rows.map((row, index) => (
          <div
            key={row.id}
            data-wc-stack-measure={row.id}
            ref={(el) => registerRowRef(index, el)}
          >
            {row.match?.ready ? (
              <WcBracketAppleMatchRow
                match={row.match}
                language={language}
                compact
                onPick={onPick}
              />
            ) : (
              <WcBracketAppleMatchRowSkeleton compact />
            )}
          </div>
        ))}
      </div>
      {rows.map((row) => {
        const endTop = stackTops?.[row.id];
        const startTop = alignedTops[row.id];
        if (startTop === undefined) return null;

        return (
          <motion.div
            key={row.id}
            data-wc-match-row={row.id}
            className="absolute right-0 left-0 -translate-y-1/2"
            initial={{ top: startTop }}
            animate={{ top: endTop ?? startTop }}
            transition={{
              duration: endTop !== undefined ? SETTLE_MS / 1000 : 0,
              ease: SETTLE_EASE,
            }}
          >
            {row.match?.ready ? (
              <WcBracketAppleMatchRow
                match={row.match}
                language={language}
                compact
                onPick={onPick}
              />
            ) : (
              <WcBracketAppleMatchRowSkeleton compact />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function BracketAlignedPreviewColumn({
  currentMatchIds,
  nextPhaseId,
  bracket,
  advancement,
  language,
  onPick,
  rowRefs,
  alignSourceRef,
  columnRef,
}: {
  currentMatchIds: readonly WcBracketPredictMatchId[];
  nextPhaseId: WcBracketInputPhase;
  bracket: WcBracketState;
  advancement: WcKnockoutAdvancement;
  language: Language;
  onPick: (matchId: WcBracketPredictMatchId, teamId: string) => void;
  rowRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  alignSourceRef: RefObject<HTMLElement | null>;
  columnRef?: RefObject<HTMLDivElement | null>;
}) {
  const previewColRef = useRef<HTMLDivElement>(null);
  const [cardTops, setCardTops] = useState<Record<string, number>>({});
  const [colHeight, setColHeight] = useState(0);

  const phaseDef = WC_BRACKET_INPUT_PHASES.find((p) => p.id === nextPhaseId)!;

  const previewItems = useMemo(
    () =>
      phaseDef.matchIds.map((id) => {
        const feeders = getWcNextMatchFeederIndices(id, currentMatchIds);
        const match = buildWcInputMatchView(id, bracket, advancement);
        return { matchId: id, feeders, match };
      }),
    [phaseDef.matchIds, currentMatchIds, bracket, advancement]
  );

  const measure = useCallback(() => {
    const container = previewColRef.current;
    const sourceEl = alignSourceRef.current;
    if (!container || !sourceEl) return false;

    const containerTop = container.getBoundingClientRect().top;
    const nextTops: Record<string, number> = {};
    let aligned = 0;

    for (const item of previewItems) {
      if (!item.feeders) continue;
      const [topIdx, bottomIdx] = item.feeders;
      const topEl = rowRefs.current[topIdx];
      const bottomEl = rowRefs.current[bottomIdx];
      if (!topEl || !bottomEl) continue;
      nextTops[item.matchId] = wcBracketMidpointY(
        topEl,
        bottomEl,
        containerTop
      );
      aligned += 1;
    }

    if (aligned > 0) {
      setCardTops(nextTops);
      setColHeight(sourceEl.offsetHeight);
      return true;
    }

    return false;
  }, [previewItems, rowRefs, alignSourceRef]);

  const hasAlignedTops = previewItems.some(
    (item) => item.feeders && cardTops[item.matchId] !== undefined
  );

  useLayoutEffect(() => {
    let cancelled = false;
    let frame = 0;
    let raf = 0;

    const tick = () => {
      if (cancelled) return;
      measure();
      frame += 1;
      if (frame < ALIGN_MEASURE_FRAMES) {
        raf = requestAnimationFrame(tick);
      }
    };
    tick();

    const sourceEl = alignSourceRef.current;
    if (!(sourceEl instanceof HTMLElement)) {
      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
      };
    }

    const ro = new ResizeObserver(() => measure());
    ro.observe(sourceEl);
    for (const el of rowRefs.current) {
      if (el) ro.observe(el);
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [measure, rowRefs, previewItems, alignSourceRef]);

  const setPreviewRef = useCallback(
    (el: HTMLDivElement | null) => {
      previewColRef.current = el;
      if (columnRef) {
        (columnRef as MutableRefObject<HTMLDivElement | null>).current = el;
      }
    },
    [columnRef]
  );

  return (
    <div
      ref={setPreviewRef}
      className="relative min-w-0 shrink-0"
      style={{
        width: wcBracketInputColWidthCss(nextPhaseId),
        minHeight: colHeight || undefined,
      }}
    >
      {hasAlignedTops ? (
        previewItems.map(({ matchId, match, feeders }) => {
          const top = cardTops[matchId];
          if (!feeders || top === undefined) return null;
          return (
            <div
              key={matchId}
              data-wc-match-row={matchId}
              className="absolute right-0 left-0 -translate-y-1/2"
              style={{ top }}
            >
              {match?.ready ? (
                <WcBracketAppleMatchRow
                  match={match}
                  language={language}
                  compact
                  onPick={onPick}
                />
              ) : (
                <WcBracketAppleMatchRowSkeleton compact />
              )}
            </div>
          );
        })
      ) : (
        <div className="flex flex-col gap-1.5" aria-hidden>
          {previewItems.map(({ matchId, match }) =>
            match?.ready ? (
              <WcBracketAppleMatchRow
                key={matchId}
                match={match}
                language={language}
                compact
                onPick={onPick}
              />
            ) : (
              <WcBracketAppleMatchRowSkeleton key={matchId} compact />
            )
          )}
        </div>
      )}
    </div>
  );
}

function SplitRoundColumns({
  currentPhaseId,
  nextPhaseId,
  bracket,
  advancement,
  language,
  onPick,
  rowRefs,
  registerRowRef,
  activeColRef,
}: {
  currentPhaseId: WcBracketInputPhase;
  nextPhaseId: WcBracketInputPhase;
  bracket: WcBracketState;
  advancement: WcKnockoutAdvancement;
  language: Language;
  onPick: (matchId: WcBracketPredictMatchId, teamId: string) => void;
  rowRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  registerRowRef: (index: number, el: HTMLDivElement | null) => void;
  activeColRef: RefObject<HTMLDivElement | null>;
}) {
  const currentPhase = WC_BRACKET_INPUT_PHASES.find(
    (p) => p.id === currentPhaseId
  )!;

  return (
    <div className={wcBracketInputSplitCardsOuterClass()}>
      <div
        ref={activeColRef}
        className="min-w-0 shrink-0"
        style={{ width: wcBracketInputColWidthCss(currentPhaseId) }}
      >
        <ActiveRoundColumn
          phaseId={currentPhaseId}
          bracket={bracket}
          advancement={advancement}
          language={language}
          onPick={onPick}
          registerRowRef={registerRowRef}
        />
      </div>
      <BracketAlignedPreviewColumn
        currentMatchIds={currentPhase.matchIds}
        nextPhaseId={nextPhaseId}
        bracket={bracket}
        advancement={advancement}
        language={language}
        onPick={onPick}
        rowRefs={rowRefs}
        alignSourceRef={activeColRef}
      />
    </div>
  );
}

type SlideSnapshot = {
  fromId: WcBracketInputPhase;
  toId: WcBracketInputPhase;
  afterId: WcBracketInputPhase;
};

type SettleSnapshot = {
  promotedId: WcBracketInputPhase;
  nextPreviewId: WcBracketInputPhase;
  alignedTops: Record<string, number>;
};

export default function WcBracketSplitRoundView({
  activePhase,
  bracket,
  advancement,
  language = "ja",
  onPick,
  onPromotePhase,
}: Props) {
  const reduceMotion = useReducedMotion();
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeColRef = useRef<HTMLDivElement>(null);
  const slideActiveColRef = useRef<HTMLDivElement>(null);
  const slidePreviewColRef = useRef<HTMLDivElement>(null);
  const slidingRef = useRef(false);
  const settleResolveRef = useRef<(() => void) | null>(null);
  const promotedPhasesRef = useRef<Set<WcBracketInputPhase>>(new Set());
  const wasPhaseCompleteRef = useRef(
    isWcBracketPhaseComplete(activePhase, bracket)
  );

  const [slideSnapshot, setSlideSnapshot] = useState<SlideSnapshot | null>(null);
  const [settleSnapshot, setSettleSnapshot] = useState<SettleSnapshot | null>(
    null
  );
  const slideX = useMotionValue(0);
  const leftOpacity = useMotionValue(1);
  const incomingOpacity = useMotionValue(0);

  const activeIdx = WC_BRACKET_INPUT_PHASES.findIndex((p) => p.id === activePhase);
  const currentPhase = WC_BRACKET_INPUT_PHASES[activeIdx]!;
  const nextPhase = WC_BRACKET_INPUT_PHASES[activeIdx + 1];
  const phaseAfterNext = WC_BRACKET_INPUT_PHASES[activeIdx + 2];

  useLayoutEffect(() => {
    const count = currentPhase.matchIds.length;
    if (rowRefs.current.length > count) {
      rowRefs.current.length = count;
    }
  }, [activePhase, currentPhase.matchIds.length]);

  const registerRowRef = useCallback((index: number, el: HTMLDivElement | null) => {
    rowRefs.current[index] = el;
  }, []);

  const handleSettled = useCallback(() => {
    setSettleSnapshot(null);
    settleResolveRef.current?.();
    settleResolveRef.current = null;
  }, []);

  const nextRoundReady =
    nextPhase !== undefined &&
    isWcBracketRoundInputReady(nextPhase.id, bracket, advancement);

  useEffect(() => {
    wasPhaseCompleteRef.current = isWcBracketPhaseComplete(activePhase, bracket);
    // タブ切り替え時のみ同期（bracket 更新で justCompleted を潰さない）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePhase]);

  useEffect(() => {
    const nowComplete = isWcBracketPhaseComplete(activePhase, bracket);
    const justCompleted = nowComplete && !wasPhaseCompleteRef.current;
    wasPhaseCompleteRef.current = nowComplete;

    if (!justCompleted || !nextRoundReady || !nextPhase || !onPromotePhase) return;
    if (promotedPhasesRef.current.has(activePhase)) return;
    if (slidingRef.current) return;

    const runPromotion = async () => {
      slidingRef.current = true;
      promotedPhasesRef.current.add(activePhase);

      if (reduceMotion || !phaseAfterNext) {
        onPromotePhase(nextPhase.id);
        slidingRef.current = false;
        return;
      }

      const shift = activeColRef.current
        ? activeColRef.current.offsetWidth + WC_BRACKET_INPUT_COL_GAP_PX
        : 0;

      if (shift <= 0) {
        onPromotePhase(nextPhase.id);
        slidingRef.current = false;
        return;
      }

      incomingOpacity.set(0);
      leftOpacity.set(1);
      slideX.set(0);
      setSlideSnapshot({
        fromId: activePhase,
        toId: nextPhase.id,
        afterId: phaseAfterNext.id,
      });

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

      const shiftWidth = activeColRef.current
        ? activeColRef.current.offsetWidth + WC_BRACKET_INPUT_COL_GAP_PX
        : shift;

      await Promise.all([
        animate(slideX, -shiftWidth, {
          duration: SLIDE_MS / 1000,
          ease: SETTLE_EASE,
        }),
        animate(leftOpacity, 0, { duration: (SLIDE_MS / 1000) * 0.5 }),
        animate(incomingOpacity, 1, {
          duration: (SLIDE_MS / 1000) * 0.6,
          delay: (SLIDE_MS / 1000) * 0.18,
        }),
      ]);

      const alignedTops = slidePreviewColRef.current
        ? captureCardCenterTops(slidePreviewColRef.current)
        : {};

      onPromotePhase(nextPhase.id);
      slideX.set(0);
      leftOpacity.set(1);
      incomingOpacity.set(0);
      setSlideSnapshot(null);

      if (Object.keys(alignedTops).length === 0) {
        slidingRef.current = false;
        return;
      }

      const settleDone = new Promise<void>((resolve) => {
        settleResolveRef.current = resolve;
      });

      setSettleSnapshot({
        promotedId: nextPhase.id,
        nextPreviewId: phaseAfterNext.id,
        alignedTops,
      });

      await settleDone;
      slidingRef.current = false;
    };

    void runPromotion();
  }, [
    activePhase,
    bracket,
    nextRoundReady,
    nextPhase,
    phaseAfterNext,
    onPromotePhase,
    reduceMotion,
    slideX,
    leftOpacity,
    incomingOpacity,
  ]);

  useEffect(() => {
    if (!isWcBracketPhaseComplete(activePhase, bracket)) {
      promotedPhasesRef.current.delete(activePhase);
    }
  }, [activePhase, bracket]);

  if (!nextPhase) {
    const matches = currentPhase.matchIds
      .map((id) => buildWcInputMatchView(id, bracket, advancement))
      .filter((m): m is NonNullable<typeof m> => m !== null);

    return (
      <div className={WC_BRACKET_INPUT_HPAD}>
        <div
          className="mx-auto min-w-0"
          style={{ width: wcBracketInputFinalColWidthCss() }}
        >
          <div className="space-y-1.5">
            {matches.length > 0 && matches[0]?.ready ? (
              matches.map((m) => (
                <WcBracketAppleMatchRow
                  key={m.matchId}
                  match={m}
                  language={language}
                  compact
                  onPick={onPick}
                />
              ))
            ) : (
              <WcBracketAppleMatchRowSkeleton compact />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (settleSnapshot) {
    const promotedPhase = WC_BRACKET_INPUT_PHASES.find(
      (p) => p.id === settleSnapshot.promotedId
    )!;

    return (
      <div className={wcBracketInputSplitCardsOuterClass()}>
        <SettlingPromotedColumn
          phaseId={settleSnapshot.promotedId}
          alignedTops={settleSnapshot.alignedTops}
          bracket={bracket}
          advancement={advancement}
          language={language}
          onPick={onPick}
          registerRowRef={registerRowRef}
          columnRef={activeColRef}
          onSettled={handleSettled}
        />
        <BracketAlignedPreviewColumn
          currentMatchIds={promotedPhase.matchIds}
          nextPhaseId={settleSnapshot.nextPreviewId}
          bracket={bracket}
          advancement={advancement}
          language={language}
          onPick={onPick}
          rowRefs={rowRefs}
          alignSourceRef={activeColRef}
        />
      </div>
    );
  }

  if (slideSnapshot) {
    const fromPhase = WC_BRACKET_INPUT_PHASES.find(
      (p) => p.id === slideSnapshot.fromId
    )!;
    const slideColWidth = wcBracketInputColWidthCss(slideSnapshot.fromId);

    return (
      <div className={`${WC_BRACKET_INPUT_HPAD} overflow-hidden`}>
        <motion.div
          className="flex min-w-0 items-start gap-2"
          style={{ x: slideX }}
        >
          <motion.div
            ref={slideActiveColRef}
            className="min-w-0 shrink-0"
            style={{ width: slideColWidth, opacity: leftOpacity }}
          >
            <ActiveRoundColumn
              phaseId={slideSnapshot.fromId}
              bracket={bracket}
              advancement={advancement}
              language={language}
              onPick={onPick}
              registerRowRef={registerRowRef}
            />
          </motion.div>
          <BracketAlignedPreviewColumn
            currentMatchIds={fromPhase.matchIds}
            nextPhaseId={slideSnapshot.toId}
            bracket={bracket}
            advancement={advancement}
            language={language}
            onPick={onPick}
            rowRefs={rowRefs}
            alignSourceRef={slideActiveColRef}
            columnRef={slidePreviewColRef}
          />
          <motion.div
            className="min-w-0 shrink-0"
            style={{ width: slideColWidth, opacity: incomingOpacity }}
          >
            <ActiveRoundColumn
              phaseId={slideSnapshot.afterId}
              bracket={bracket}
              advancement={advancement}
              language={language}
              onPick={onPick}
              registerRowRef={() => {}}
            />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <SplitRoundColumns
      currentPhaseId={currentPhase.id}
      nextPhaseId={nextPhase.id}
      bracket={bracket}
      advancement={advancement}
      language={language}
      onPick={onPick}
      rowRefs={rowRefs}
      registerRowRef={registerRowRef}
      activeColRef={activeColRef}
    />
  );
}
