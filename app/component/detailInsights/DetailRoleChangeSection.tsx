"use client";

import { useState } from "react";
import type {
  DetailChipExplainPayload,
  PlayerRoleChangeSignal,
} from "@/lib/nba/detailInsights/detailInsightTypes";
import { DetailChipExplainModal } from "@/app/component/detailInsights/DetailChipExplainModal";

type Props = {
  signals: PlayerRoleChangeSignal[];
  detailText: string | null;
  accent: string;
  title?: string;
  isJa?: boolean;
};

export function DetailRoleChangeSection({
  signals,
  detailText,
  accent,
  title = "RECENT ROLE CHANGE",
  isJa = true,
}: Props) {
  const [explain, setExplain] = useState<DetailChipExplainPayload | null>(
    null
  );

  if (!signals.length) return null;
  return (
    <>
      <section className="space-y-2">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
          {title}
        </h2>
        <div className="flex flex-wrap gap-2">
          {signals.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() =>
                setExplain({
                  label: s.label,
                  hintJa: s.hintJa,
                  hintEn: s.hintEn,
                })
              }
              className="rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide"
              style={{ borderColor: accent, color: accent }}
            >
              {s.label}
            </button>
          ))}
        </div>
        {detailText ? (
          <p className="text-[12px] font-medium text-white/65">{detailText}</p>
        ) : null}
      </section>
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
