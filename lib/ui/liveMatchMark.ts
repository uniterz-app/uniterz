import { resultLiveBadgeClass } from "@/lib/result/resultGlass";

export const LIVE_MATCH_MARK_PULSE_CLASS = "live-match-mark--pulse";

/** ResultCard 右上 / MatchCard 中央など、配置先に合わせたサイズ */
export type LiveMatchMarkDensity =
  | "resultMobile"
  | "resultDesktop"
  | "matchDense"
  | "matchComfortable";

function densityToBadgeOpts(density: LiveMatchMarkDensity): {
  compact: boolean;
  subtle: boolean;
} {
  switch (density) {
    case "resultMobile":
      return { compact: true, subtle: true };
    case "resultDesktop":
      return { compact: false, subtle: true };
    case "matchDense":
      return { compact: true, subtle: false };
    case "matchComfortable":
      return { compact: false, subtle: false };
  }
}

export function liveMatchMarkClasses(
  density: LiveMatchMarkDensity,
  extra = ""
): string {
  const { compact, subtle } = densityToBadgeOpts(density);
  return [
    resultLiveBadgeClass(compact, { subtle }),
    LIVE_MATCH_MARK_PULSE_CLASS,
    "inline-flex items-center justify-center",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}
