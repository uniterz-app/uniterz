"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { jp } from "@/lib/fonts";

type Props = {
  month: string;
  onPrev: () => void;
  onNext: () => void;
  disableNext?: boolean;
};

function formatMonthLabel(month: string) {
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match) return month;

  const [, y, m] = match;
  return `${y}.${m}`;
}

export default function MonthlySelector({
  month,
  onPrev,
  onNext,
  disableNext = false,
}: Props) {
  return (
    <div className="flex items-center justify-center px-3">
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous month"
          className="flex h-[30px] w-[30px] items-center justify-center text-white/78 transition active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>

        <div
          className={[
            "min-w-[90px] text-center text-[15px] font-black tracking-[0.06em] text-white",
            jp.className,
          ].join(" ")}
          style={{
            textShadow: "0 0 14px rgba(0,255,255,0.10)",
          }}
        >
          {formatMonthLabel(month)}
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={disableNext}
          aria-label="Next month"
          className={[
            "flex h-[30px] w-[30px] items-center justify-center transition active:scale-95",
            disableNext ? "cursor-not-allowed text-white/25" : "text-white/78",
          ].join(" ")}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}