"use client";

const CANDLE_COUNT = 18;

type CandleChartLoaderProps = {
  className?: string;
  /** スクリーンリーダー用 */
  label?: string;
};

/** Uiverse.io by bilal_9731 — ローソク足チャート風ローディング */
export default function CandleChartLoader({
  className = "",
  label = "読み込み中",
}: CandleChartLoaderProps) {
  return (
    <div
      className={["candle-wrapper", className].filter(Boolean).join(" ")}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="candle-chart">
        {Array.from({ length: CANDLE_COUNT }, (_, i) => (
          <div key={i} className="candle" />
        ))}
      </div>
    </div>
  );
}
