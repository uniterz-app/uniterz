"use client";

import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import RankShadowBandHeader from "@/app/component/rankings/gap/RankShadowBandHeader";
import RankShadowMovementList from "@/app/component/rankings/gap/RankShadowMovementList";
import RankShadowCompareSection from "@/app/component/rankings/gap/RankShadowCompareSection";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { nameOxanium, summaryMetricNumClass } from "@/lib/fonts";
import type { RankShadowAnalysis } from "@/lib/rankings/rankShadowAnalysis";
import {
  RANK_GAP_CYBER,
} from "@/lib/rankings/rankGapDonut";

type Props = {
  analysis: RankShadowAnalysis | null;
  loading?: boolean;
  errorCode?: string | null;
  language?: Language;
  layout?: "mobile" | "web";
  onRetry?: () => void;
};

export default function RankShadowView({
  analysis,
  loading = false,
  errorCode = null,
  language = "ja",
  layout = "mobile",
  onRetry,
}: Props) {
  const m = t(language);
  const s = m.rankings.rankShadow;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center py-16">
        <CandleChartLoader label={s.loading} />
      </div>
    );
  }

  if (!analysis) {
    const message =
      errorCode === "pro_required"
        ? s.errorProRequired
        : errorCode === "unauthorized"
          ? s.errorSignIn
          : errorCode === "shadow_history_unavailable"
            ? s.errorHistory
            : s.errorGeneric;
    return (
      <div className="rounded-2xl border border-white/10 bg-black/50 px-5 py-10 text-center">
        <p className="text-sm text-white/65">{message}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-xl border border-cyan-400/35 bg-cyan-500/12 px-4 py-2 text-xs font-semibold text-cyan-100"
          >
            {m.common.retry}
          </button>
        ) : null}
      </div>
    );
  }

  const shellMax = layout === "web" ? "max-w-[720px]" : "max-w-full";

  return (
    <div className={["mx-auto w-full space-y-4", shellMax].join(" ")}>
      <header className="space-y-1">
        <h1 className="text-xl font-extrabold tracking-tight text-white">
          {s.title}
        </h1>
        <p className="text-xs leading-relaxed text-white/50">{s.subtitle}</p>
      </header>

      <div className="space-y-1 px-0.5 text-[11px] leading-relaxed text-white/38">
        <p>{s.weekBoundNote}</p>
        <p>{s.bonusMetricNote}</p>
      </div>

      <RankShadowBandHeader analysis={analysis} language={language} />

      <div className="space-y-2">
        <h2
          className={[
            nameOxanium.className,
            "px-0.5 text-[13px] font-bold uppercase tracking-[0.14em]",
          ].join(" ")}
          style={{ color: RANK_GAP_CYBER.cyan }}
        >
          {s.movementSection}
        </h2>
        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              {
                key: "rose",
                value: analysis.movement.rose,
                label: s.moveRose,
                footnote:
                  analysis.movement.roseToTop30 > 0
                    ? s.moveRoseToTop30Note.replace(
                        "{n}",
                        String(analysis.movement.roseToTop30)
                      )
                    : null,
                theme: {
                  borderColor: "rgba(57,255,136,0.38)",
                  backgroundColor: "rgba(12, 30, 20, 0.92)",
                  valueColor: "#8ef0b8",
                  labelColor: "rgba(180,255,210,0.75)",
                  trendSymbol: "▲",
                },
              },
              {
                key: "flat",
                value: analysis.movement.flat,
                label: s.moveStayed,
                footnote: null,
                theme: {
                  borderColor: "rgba(255,255,255,0.14)",
                  backgroundColor: RANK_GAP_CYBER.cardBgElevated,
                  valueColor: "rgba(255,255,255,0.92)",
                  labelColor: "rgba(255,255,255,0.5)",
                  trendSymbol: "—",
                },
              },
              {
                key: "fell",
                value: analysis.movement.fell,
                label: s.moveFell,
                footnote: null,
                theme: {
                  borderColor: "rgba(255,0,255,0.34)",
                  backgroundColor: "rgba(24, 8, 24, 0.88)",
                  valueColor: RANK_GAP_CYBER.magenta,
                  labelColor: "rgba(255,180,255,0.68)",
                  trendSymbol: "▼",
                },
              },
            ] as const
          ).map((item) => (
            <div
              key={item.key}
              className="border px-2 py-3 text-center"
              style={{
                borderColor: item.theme.borderColor,
                backgroundColor: item.theme.backgroundColor,
              }}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span
                  className="text-sm leading-none"
                  style={{ color: item.theme.valueColor }}
                  aria-hidden
                >
                  {item.theme.trendSymbol}
                </span>
                <div
                  className={[
                    nameOxanium.className,
                    summaryMetricNumClass,
                    "text-2xl font-black tabular-nums leading-none",
                  ].join(" ")}
                  style={{ color: item.theme.valueColor }}
                >
                  {item.value}
                </div>
              </div>
              <div
                className="mt-1 text-[10px] leading-snug"
                style={{ color: item.theme.labelColor }}
              >
                {item.label}
              </div>
              {item.footnote ? (
                <div
                  className="mt-1 text-[8px] leading-snug"
                  style={{ color: "rgba(120,255,180,0.55)" }}
                >
                  {item.footnote}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <RankShadowMovementList
          rivals={analysis.rivalRoster}
          language={language}
        />
      </div>

      <RankShadowCompareSection
        rows={analysis.compareRows}
        compareAdvice={analysis.compareAdvice}
        language={language}
      />
    </div>
  );
}
