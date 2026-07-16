import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import type { PredictTimingAdvice } from "@/lib/predict/predictTimingAdviceTypes";

export function formatPredictTimingAdvice(
  advice: PredictTimingAdvice,
  language: Language
): string {
  const p = t(language).predict.timing;
  const params = advice.params;

  switch (advice.id) {
    case "teamStrong":
      return p.teamStrong
        .replace("{team}", String(params.team))
        .replace("{userPct}", String(params.userPct))
        .replace("{avgPct}", String(params.avgPct));
    case "teamWeak":
      return p.teamWeak
        .replace("{team}", String(params.team))
        .replace("{userPct}", String(params.userPct));
    case "teamUpsetContext":
      return p.teamUpsetContext
        .replace("{team}", String(params.team))
        .replace("{upset}", String(params.upset))
        .replace("{total}", String(params.total));
    case "awayWeak":
      return p.awayWeak.replace("{userPct}", String(params.userPct));
    case "underdogStrong":
      return p.underdogStrong
        .replace("{hits}", String(params.hits))
        .replace("{picks}", String(params.picks));
    case "shadowExact":
      return p.shadowExact;
    case "knockoutFocus":
      return p.knockoutFocus;
    default:
      return "";
  }
}
