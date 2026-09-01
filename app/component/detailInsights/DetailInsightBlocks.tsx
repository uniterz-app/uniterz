"use client";

import { useState } from "react";
import type {
  DetailChipExplainPayload,
  DetailInsightChip,
} from "@/lib/nba/detailInsights/detailInsightTypes";
import { DetailChipExplainModal } from "@/app/component/detailInsights/DetailChipExplainModal";

type Props = {
  text: string;
  className?: string;
};

export function DetailInsightSummary({ text, className = "" }: Props) {
  if (!text.trim()) return null;
  return (
    <p
      className={`text-[13px] font-medium leading-[1.45] text-white/82 ${className}`}
    >
      {text}
    </p>
  );
}

type ChipRowProps = {
  chips: DetailInsightChip[];
  accent: string;
  title?: string;
  isJa?: boolean;
};

export function DetailIdentityChipRow({
  chips,
  accent,
  title,
  isJa = true,
}: ChipRowProps) {
  const [explain, setExplain] = useState<DetailChipExplainPayload | null>(
    null
  );

  if (!chips.length) return null;
  return (
    <>
      <div className="space-y-2">
        {title ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
            {title}
          </p>
        ) : null}
        <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() =>
                setExplain({
                  label: chip.label,
                  hintJa: chip.hintJa,
                  hintEn: chip.hintEn,
                })
              }
              className="shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide transition-opacity hover:opacity-90 active:opacity-75"
              style={{ borderColor: accent, color: accent }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
      <DetailChipExplainModal
        open={explain != null}
        payload={explain}
        isJa={isJa}
        accent={accent}
        onClose={() => setExplain(null)}
      />
    </>
  );
}
