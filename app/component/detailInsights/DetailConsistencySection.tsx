import type { PlayerConsistencyInsight } from "@/lib/nba/detailInsights/detailInsightTypes";
import { volatilityLabel } from "@/lib/nba/detailInsights/buildPlayerDetailInsights";

type Props = {
  data: PlayerConsistencyInsight;
  accent: string;
};

export function DetailConsistencySection({ data, accent }: Props) {
  return (
    <section className="space-y-2">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
        CONSISTENCY
      </h2>
      <div
        className="space-y-1.5 border bg-black/40 px-3 py-2.5 text-[11px] font-bold tabular-nums"
        style={{ borderColor: `${accent}66` }}
      >
        {data.milestones.map((m) => (
          <div key={m.label} className="flex justify-between gap-2">
            <span className="text-white/45">{m.label}</span>
            <span className="text-white/85">
              {m.count}/{m.games} ({m.pct}%)
            </span>
          </div>
        ))}
        <div className="flex justify-between gap-2 border-t border-white/10 pt-1.5">
          <span className="text-white/45">L10 PTS</span>
          <span className="text-white/85">
            {data.last10PtsMin}–{data.last10PtsMax} · {volatilityLabel(data.volatility)}
          </span>
        </div>
      </div>
    </section>
  );
}
