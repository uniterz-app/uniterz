"use client";

import { useMemo } from "react";
import type { RankingPeriod } from "@/lib/rankings/rankingPeriod";
import type { Language } from "@/lib/i18n/language";

type Props = {
  period: Exclude<RankingPeriod, "season">;
  /** 表示中の期間ラベル（API が返す label） */
  activeLabel: string | null;
  /** 選択可能なラベル一覧（新しい順） */
  availableLabels: string[];
  onChange: (label: string | null) => void;
  language?: Language;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function weekEndLabel(startKey: string): string {
  const [y, m, d] = startKey.split("-").map(Number);
  const end = new Date(Date.UTC(y, m - 1, d + 6));
  return `${end.getUTCFullYear()}-${pad2(end.getUTCMonth() + 1)}-${pad2(
    end.getUTCDate()
  )}`;
}

function formatLabel(
  period: Exclude<RankingPeriod, "season">,
  label: string,
  language: Language
): string {
  if (period === "weekly") {
    const [, m1, d1] = label.split("-");
    const [, m2, d2] = weekEndLabel(label).split("-");
    return `${Number(m1)}/${Number(d1)} – ${Number(m2)}/${Number(d2)}`;
  }
  const [y, m] = label.split("-").map(Number);
  if (language === "ja") return `${y}年${m}月`;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[m - 1]} ${y}`;
}

/** Weekly / Monthly の過去期間切り替え（‹ 期間ラベル ›） */
export default function RankingsPeriodLabelNav({
  period,
  activeLabel,
  availableLabels,
  onChange,
  language = "ja",
}: Props) {
  const { prevLabel, nextLabel, display } = useMemo(() => {
    if (!activeLabel || availableLabels.length === 0) {
      return { prevLabel: null, nextLabel: null, display: null };
    }
    const idx = availableLabels.indexOf(activeLabel);
    // availableLabels は新しい順: prev = より古い / next = より新しい
    const prev =
      idx >= 0 && idx + 1 < availableLabels.length
        ? availableLabels[idx + 1]
        : null;
    const next = idx > 0 ? availableLabels[idx - 1] : null;
    return {
      prevLabel: prev,
      nextLabel: next,
      display: formatLabel(period, activeLabel, language),
    };
  }, [activeLabel, availableLabels, period, language]);

  if (!display) return null;

  const isCurrent = activeLabel === availableLabels[0];

  return (
    <div className="flex items-center justify-center gap-3 py-1">
      <button
        type="button"
        aria-label="previous period"
        disabled={!prevLabel}
        onClick={() => prevLabel && onChange(prevLabel)}
        className="px-2 py-0.5 text-[13px] text-white/60 transition-colors enabled:hover:text-white disabled:opacity-25"
      >
        ‹
      </button>
      <span className="min-w-28 text-center font-mono text-[12px] tracking-wide text-white/80 tabular-nums">
        {display}
      </span>
      <button
        type="button"
        aria-label="next period"
        disabled={!nextLabel}
        onClick={() =>
          nextLabel &&
          onChange(nextLabel === availableLabels[0] ? null : nextLabel)
        }
        className="px-2 py-0.5 text-[13px] text-white/60 transition-colors enabled:hover:text-white disabled:opacity-25"
      >
        ›
      </button>
      {!isCurrent ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="rounded-sm border border-white/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/55 transition-colors hover:text-white"
        >
          {language === "ja" ? "今" : "Now"}
        </button>
      ) : null}
    </div>
  );
}
