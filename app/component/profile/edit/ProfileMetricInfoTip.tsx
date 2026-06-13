"use client";

import { Info } from "lucide-react";
import faqStyles from "@/app/component/profile/ui/profileChartInfoFaq.module.css";

type Props = {
  label: string;
  compact?: boolean;
};

export default function ProfileMetricInfoTip({ label, compact = false }: Props) {
  return (
    <span className={faqStyles.wrap}>
      <button
        type="button"
        className={faqStyles.faqButton}
        aria-label={label}
        style={compact ? { padding: 0 } : undefined}
      >
        <Info
          className={compact ? "h-3 w-3" : undefined}
          aria-hidden
        />
      </button>
      <span className={faqStyles.tooltip} role="tooltip">
        {label}
      </span>
    </span>
  );
}
