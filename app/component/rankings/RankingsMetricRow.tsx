"use client";

import type { MobileMetric } from "@/lib/rankings/rankingMetrics";
import type { Language } from "@/lib/i18n/language";
import { metricLabel, upsetShortLabel } from "@/lib/i18n/rankings";
import { t } from "@/lib/i18n/t";
import { motion, useReducedMotion } from "framer-motion";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
  type CyberSlantedTabTheme,
} from "@/app/component/rankings/CyberSlantedTab";

const tabFadeEase: [number, number, number, number] = [0.16, 0.82, 0.32, 1];

type Props = {
  metrics: { key: MobileMetric; label: string }[];
  metric: MobileMetric;
  setMetric: (v: MobileMetric) => void;
  language?: Language;
  rankingLeague?: "nba" | "worldcup";
  gridColumns?: 3;
  /** @deprecated モバイルも斜めタブに統一 */
  compactMobile?: boolean;
  /** PRO LEAGUE など画面固有のタブ色 */
  tabTheme?: CyberSlantedTabTheme;
};

function formatLabel(
  key: MobileMetric,
  lang: Language,
  rankingLeague?: "nba" | "worldcup"
) {
  if (key === "upsetScore") return upsetShortLabel(lang);
  return metricLabel(key, lang, rankingLeague);
}

export default function RankingsMetricRow({
  metrics,
  metric,
  setMetric,
  language = "ja",
  rankingLeague,
  gridColumns,
  tabTheme,
}: Props) {
  const reduceMotion = useReducedMotion();
  const msgs = t(language);

  return (
    <motion.div
      className="w-full"
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              duration: 0.38,
              delay: 0.08,
              ease: tabFadeEase,
            }
      }
    >
      <CyberSlantedTabBar
        fill
        gridColumns={gridColumns}
        aria-label={msgs.rankings.metricTabsLabel}
      >
        {metrics.map((item) => (
          <CyberSlantedTab
            key={item.key}
            role="tab"
            label={formatLabel(item.key, language, rankingLeague)}
            active={item.key === metric}
            onClick={() => setMetric(item.key)}
            compact
            theme={tabTheme}
          />
        ))}
      </CyberSlantedTabBar>
    </motion.div>
  );
}
