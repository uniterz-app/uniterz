"use client";

type Props = {
  homeName: string;
  awayName: string;
  homeCount: number;
  awayCount: number;
  total: number;
  myPickSide?: "home" | "away" | null;
};

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

export default function MarketBiasBar({
  homeName,
  awayName,
  homeCount,
  awayCount,
  total,
  myPickSide = null,
}: Props) {
  const homePct = total > 0 ? clamp((homeCount / total) * 100) : 50;
  const awayPct = total > 0 ? clamp((awayCount / total) * 100) : 50;

  const majority =
    Math.abs(homePct - awayPct) < 0.0001 ? "none" : homePct > awayPct ? "home" : "away";

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-white">
      <div className="mb-2 flex items-center justify-between text-xs">
        <div className="font-semibold text-white/85">みんなの予想</div>
        <div className="text-white/60">総分析数: {total}</div>
      </div>

      <div className="mb-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
          <span className="truncate text-white/80">{homeName}</span>
          <span className="tabular-nums font-bold text-blue-300">{homePct.toFixed(1)}%</span>
          {myPickSide === "home" && (
            <span className="rounded-full border border-blue-300/40 px-1.5 py-0.5 text-[10px] text-blue-200">
              あなた
            </span>
          )}
        </div>

        <div className="text-white/40">VS</div>

        <div className="flex items-center justify-end gap-2 min-w-0">
          {myPickSide === "away" && (
            <span className="rounded-full border border-rose-300/40 px-1.5 py-0.5 text-[10px] text-rose-200">
              あなた
            </span>
          )}
          <span className="tabular-nums font-bold text-rose-300">{awayPct.toFixed(1)}%</span>
          <span className="truncate text-white/80">{awayName}</span>
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
        </div>
      </div>

      <div className="relative h-4 overflow-hidden rounded-full border border-white/10 bg-white/10">
        <div
          className={[
            "absolute left-0 top-0 h-full transition-all duration-300",
            majority === "home" ? "shadow-[0_0_14px_rgba(59,130,246,0.35)]" : "",
          ].join(" ")}
          style={{
            width: `${homePct}%`,
            background: "linear-gradient(90deg, rgba(59,130,246,.95), rgba(56,189,248,.55))",
          }}
        />
        <div
          className={[
            "absolute right-0 top-0 h-full transition-all duration-300",
            majority === "away" ? "shadow-[0_0_14px_rgba(244,63,94,0.35)]" : "",
          ].join(" ")}
          style={{
            width: `${awayPct}%`,
            background: "linear-gradient(270deg, rgba(244,63,94,.95), rgba(251,113,133,.55))",
          }}
        />
        <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-white/30" />
      </div>

      <div className="mt-2 text-[11px] text-white/55">
        {majority === "none"
          ? "拮抗"
          : majority === "home"
          ? `${homeName} 優勢`
          : `${awayName} 優勢`}
      </div>
    </div>
  );
}