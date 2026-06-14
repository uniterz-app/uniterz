// app/component/games/LiveMatchMark.tsx
"use client";

import { memo } from "react";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import {
  liveMatchMarkClasses,
  type LiveMatchMarkDensity,
} from "@/lib/ui/liveMatchMark";

export type { LiveMatchMarkDensity };

type Props = {
  density: LiveMatchMarkDensity;
  language?: Language;
  className?: string;
};

function LiveMatchMarkImpl({ density, language = "en", className = "" }: Props) {
  const m = t(language);
  const wrap = liveMatchMarkClasses(density, className);
  return (
    <span className={wrap} aria-label={m.games.liveAriaLabel}>
      LIVE
    </span>
  );
}

export const LiveMatchMark = memo(LiveMatchMarkImpl);
LiveMatchMark.displayName = "LiveMatchMark";
