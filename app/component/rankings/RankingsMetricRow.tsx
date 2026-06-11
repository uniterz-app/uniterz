"use client";

import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";
import type { Language } from "@/lib/i18n/language";
import { metricLabel, upsetShortLabel } from "@/lib/i18n/rankings";
import { t } from "@/lib/i18n/t";
import { motion, useReducedMotion } from "framer-motion";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";

const tabFadeEase: [number, number, number, number] = [0.16, 0.82, 0.32, 1];

type Props = {
  metrics: { key: MobileMetric; label: string }[];
  metric: MobileMetric;
  setMetric: (v: MobileMetric) => void;
  language?: Language;
  /** @deprecated モバイルも斜めタブに統一 */
  compactMobile?: boolean;
};

function formatLabel(key: MobileMetric, lang: Language) {
  if (key === "upsetScore") return upsetShortLabel(lang);
  return metricLabel(key, lang);
}

export default function RankingsMetricRow({
  metrics,
  metric,
  setMetric,
  language = "ja",
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
      <CyberSlantedTabBar aria-label={msgs.rankings.metricTabsLabel}>
        {metrics.map((item) => (
          <CyberSlantedTab
            key={item.key}
            role="tab"
            label={formatLabel(item.key, language)}
            active={item.key === metric}
            onClick={() => setMetric(item.key)}
            compact
          />
        ))}
      </CyberSlantedTabBar>
    </motion.div>
  );
}
