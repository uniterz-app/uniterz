import type { PlayerUsageStripCell } from "@/lib/nba/detailInsights/detailInsightTypes";
import { isPlayerDetailRankShown } from "@/lib/predict/nbaPlayerDetailHowTheyPlay";

type Props = {
  cells: PlayerUsageStripCell[];
  accent: string;
};

export function DetailUsageStrip({ cells, accent }: Props) {
  const hasData = cells.some((c) => c.display !== "—");
  if (!hasData) return null;
  return (
    <div
      className="grid grid-cols-3 overflow-hidden border bg-black/45"
      style={{ borderColor: `${accent}66` }}
    >
      {cells.map((cell) => (
        <div
          key={cell.key}
          className="border-b border-r px-2 py-2.5"
          style={{ borderColor: `${accent}26` }}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] font-bold uppercase tracking-wide text-white/40">
              {cell.label}
            </span>
            {cell.rank != null && isPlayerDetailRankShown(cell.rank) ? (
              <span className="text-[10px] font-extrabold" style={{ color: accent }}>
                #{cell.rank}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[15px] font-extrabold tabular-nums text-white">
            {cell.display}
          </p>
        </div>
      ))}
    </div>
  );
}
