import type { DetailTrendDelta } from "@/lib/nba/detailInsights/detailInsightTypes";
import {
  formatTeamTrendDelta,
  isTrendImproved,
} from "@/lib/nba/detailInsights/buildTeamDetailInsights";

const POSITIVE = "#5FE1A8";
const NEGATIVE = "#FF6B6B";

type Props = {
  trends: DetailTrendDelta[];
};

export function DetailTrendTable({ trends }: Props) {
  if (!trends.length) return null;
  return (
    <div className="mt-2 space-y-1.5 border-t border-white/10 pt-2">
      {trends.map((row) => {
        const improved = isTrendImproved(row);
        const deltaColor = improved ? POSITIVE : NEGATIVE;
        return (
          <div
            key={row.id}
            className="flex items-center justify-between gap-2 text-[11px] font-bold tabular-nums"
          >
            <span className="w-10 text-white/45">{row.label}</span>
            <span className="flex-1 text-white/75">
              {row.seasonDisplay} → {row.last10Display}
            </span>
            <span style={{ color: deltaColor }}>{formatTeamTrendDelta(row)}</span>
          </div>
        );
      })}
    </div>
  );
}
