"use client";

import type { Language } from "@/lib/i18n/language";
import { formatPredictTimingAdvice } from "@/lib/predict/formatPredictTimingAdvice";
import type { PredictTimingAdvice } from "@/lib/predict/predictTimingAdviceTypes";

type Props = {
  advice: PredictTimingAdvice;
  language?: Language;
};

export default function PredictTimingAdviceLine({
  advice,
  language = "ja",
}: Props) {
  const line = formatPredictTimingAdvice(advice, language);
  if (!line) return null;

  return (
    <p className="relative z-1 text-xs font-medium leading-relaxed text-cyan-200/78">
      {line}
    </p>
  );
}
