"use client";

import { useCallback, useState } from "react";
import { Info } from "lucide-react";
import Tooltip from "@/app/component/common/Tooltip";
import faqStyles from "@/app/component/profile/ui/profileChartInfoFaq.module.css";

type Props = {
  label: string;
  compact?: boolean;
};

export default function ProfileMetricInfoTip({ label, compact = false }: Props) {
  const [tooltip, setTooltip] = useState<{
    rect: DOMRect;
    message: string;
  } | null>(null);

  const openTooltip = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      setTooltip({
        rect: e.currentTarget.getBoundingClientRect(),
        message: label,
      });
    },
    [label]
  );

  return (
    <>
      <button
        type="button"
        className={faqStyles.faqButton}
        aria-label={label}
        aria-expanded={tooltip != null}
        onClick={openTooltip}
        style={compact ? { padding: 0 } : undefined}
      >
        <Info className={compact ? "h-3 w-3" : undefined} aria-hidden />
      </button>

      {tooltip ? (
        <Tooltip
          anchorRect={tooltip.rect}
          message={tooltip.message}
          placement="auto"
          onClose={() => setTooltip(null)}
        />
      ) : null}
    </>
  );
}
