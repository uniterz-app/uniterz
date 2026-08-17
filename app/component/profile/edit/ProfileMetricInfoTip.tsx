"use client";

import { useCallback, useState } from "react";
import { Info } from "lucide-react";
import Tooltip from "@/app/component/common/Tooltip";
import faqStyles from "@/app/component/profile/ui/profileChartInfoFaq.module.css";

type Props = {
  /** ツールチップ本文 */
  label: string;
  /** ボタンの aria-label（省略時は label） */
  ariaLabel?: string;
  compact?: boolean;
  planPro?: boolean;
};

export default function ProfileMetricInfoTip({
  label,
  ariaLabel,
  compact = false,
  planPro = false,
}: Props) {
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
        className={[
          faqStyles.faqButton,
          planPro ? "profile-plan-pro-metric-card__info" : "",
        ].join(" ")}
        aria-label={ariaLabel ?? label}
        aria-expanded={tooltip != null}
        onClick={openTooltip}
        style={compact ? { padding: 0 } : undefined}
      >
        <Info className={compact ? "h-3.5 w-3.5" : undefined} aria-hidden />
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
