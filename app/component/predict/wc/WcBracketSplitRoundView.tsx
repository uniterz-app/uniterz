"use client";

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import type { WcBracketPredictMatchId } from "@/lib/wc/wc-knockout-bracket";
import type { WcBracketState } from "@/lib/wc/wc-knockout-bracket";
import type { WcKnockoutAdvancement } from "@/lib/wc/wc-knockout-bracket-utils";
import { buildWcInputMatchView } from "@/lib/wc/wc-bracket-input-display";
import {
  WC_BRACKET_INPUT_PHASES,
  type WcBracketInputPhase,
  canOpenWcBracketPhase,
} from "@/lib/wc/wc-bracket-input-phases";
import {
  getWcNextMatchFeederIndices,
  wcBracketMidpointY,
} from "@/lib/wc/wc-bracket-input-layout";
import WcBracketAppleMatchRow from "@/app/component/predict/wc/WcBracketAppleMatchRow";
import type { Language } from "@/lib/i18n/language";

type Props = {
  activePhase: WcBracketInputPhase;
  bracket: WcBracketState;
  advancement: WcKnockoutAdvancement;
  language?: Language;
  onPick: (matchId: WcBracketPredictMatchId, teamId: string) => void;
};

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

  if (!open) {
    return (
      <p className="px-1 py-6 text-center text-[10px] leading-relaxed text-white/40">
        {language === "ja" ? "前のラウンドを完了" : "Complete prior round"}
      </p>
    );
  }

  if (rows.every((r) => !r.match)) {
    return <p className="px-1 py-6 text-center text-[10px] text-white/40">—</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row, index) => (
        <div
          key={row.id}
          ref={(el) => registerRowRef(index, el)}
          className={row.match ? undefined : "h-0 overflow-hidden"}
          aria-hidden={row.match ? undefined : true}
        >
          {row.match ? (
            <WcBracketAppleMatchRow
              match={row.match}
              language={language}
              compact
              onPick={onPick}
            />
          ) : null}
        </div>
      ))}
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
}: {
  currentMatchIds: readonly WcBracketPredictMatchId[];
  nextPhaseId: WcBracketInputPhase;
  bracket: WcBracketState;
  advancement: WcKnockoutAdvancement;
  language: Language;
  onPick: (matchId: WcBracketPredictMatchId, teamId: string) => void;
  rowRefs: MutableRefObject<(HTMLDivElement | null)[]>;
}) {
  const previewColRef = useRef<HTMLDivElement>(null);
  const [cardTops, setCardTops] = useState<Record<string, number>>({});
  const [colHeight, setColHeight] = useState(0);

  const phaseDef = WC_BRACKET_INPUT_PHASES.find((p) => p.id === nextPhaseId)!;

  const previewItems = useMemo(
    () =>
      phaseDef.matchIds
        .map((id) => {
          const feeders = getWcNextMatchFeederIndices(id, currentMatchIds);
          const match = buildWcInputMatchView(id, bracket, advancement);
          return feeders && match
            ? { matchId: id, feeders, match }
            : null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null),
    [phaseDef.matchIds, currentMatchIds, bracket, advancement]
  );

  const measure = useCallback(() => {
    const container = previewColRef.current;
    if (!container) return;

    const containerTop = container.getBoundingClientRect().top;
    const nextTops: Record<string, number> = {};

    for (const item of previewItems) {
      const [topIdx, bottomIdx] = item.feeders;
      const topEl = rowRefs.current[topIdx];
      const bottomEl = rowRefs.current[bottomIdx];
      if (!topEl || !bottomEl) continue;
      nextTops[item.matchId] = wcBracketMidpointY(
        topEl,
        bottomEl,
        containerTop
      );
    }

    setCardTops(nextTops);
    const leftCol = container.parentElement?.firstElementChild;
    setColHeight(
      leftCol instanceof HTMLElement ? leftCol.offsetHeight : container.offsetHeight
    );
  }, [previewItems, rowRefs]);

  useLayoutEffect(() => {
    measure();
    const leftCol = previewColRef.current?.parentElement?.firstElementChild;
    if (!(leftCol instanceof HTMLElement)) return;

    const ro = new ResizeObserver(() => measure());
    ro.observe(leftCol);
    rowRefs.current.forEach((el) => {
      if (el) ro.observe(el);
    });

    return () => ro.disconnect();
  }, [measure, rowRefs, previewItems]);

  return (
    <div
      ref={previewColRef}
      className="relative min-w-0 flex-1"
      style={{ minHeight: colHeight || undefined }}
    >
      {previewItems.map(({ matchId, match }) => {
        const top = cardTops[matchId];
        if (top === undefined) return null;
        return (
          <div
            key={matchId}
            className="absolute right-0 left-0 -translate-y-1/2"
            style={{ top }}
          >
            <WcBracketAppleMatchRow
              match={match}
              language={language}
              compact
              onPick={onPick}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function WcBracketSplitRoundView({
  activePhase,
  bracket,
  advancement,
  language = "ja",
  onPick,
}: Props) {
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeIdx = WC_BRACKET_INPUT_PHASES.findIndex((p) => p.id === activePhase);
  const currentPhase = WC_BRACKET_INPUT_PHASES[activeIdx]!;
  const nextPhase = WC_BRACKET_INPUT_PHASES[activeIdx + 1];

  useLayoutEffect(() => {
    rowRefs.current = [];
  }, [activePhase]);

  const registerRowRef = useCallback((index: number, el: HTMLDivElement | null) => {
    rowRefs.current[index] = el;
  }, []);

  if (!nextPhase) {
    const matches = currentPhase.matchIds
      .map((id) => buildWcInputMatchView(id, bracket, advancement))
      .filter((m): m is NonNullable<typeof m> => m !== null);

    return (
      <div className="mx-auto w-full max-w-[50%] px-2">
        <div className="space-y-1.5">
          {matches.map((m) => (
            <WcBracketAppleMatchRow
              key={m.matchId}
              match={m}
              language={language}
              compact
              onPick={onPick}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-start gap-2 overflow-x-hidden px-2">
      <div className="min-w-0 flex-1">
        <ActiveRoundColumn
          phaseId={currentPhase.id}
          bracket={bracket}
          advancement={advancement}
          language={language}
          onPick={onPick}
          registerRowRef={registerRowRef}
        />
      </div>
      <BracketAlignedPreviewColumn
        currentMatchIds={currentPhase.matchIds}
        nextPhaseId={nextPhase.id}
        bracket={bracket}
        advancement={advancement}
        language={language}
        onPick={onPick}
        rowRefs={rowRefs}
      />
    </div>
  );
}
