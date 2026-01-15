"use client";

type Row = {
  label: string;
  format: (v: number) => string;
  self: number;
  avg: number;
  top10: number;
};

type Props = {
  monthLabel: string;
  userCount?: number;        // 平均の母集団
  top10UserCount?: number;   // ★ 上位10%の母集団
  rows: Row[];
};

export default function MonthlyComparisonCard({
  monthLabel,
  userCount,
  top10UserCount, // ★ これを受け取る
  rows,
}: Props) {
  return (
    <div className="rounded-2xl border border-white/15 bg-[#050814]/80 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.55)]">
      <div className="mb-3">
        <div className="text-sm font-semibold text-white">
          月間パフォーマンス比較
        </div>
        <div className="text-xs text-white/50">
          {monthLabel}
          {typeof userCount === "number" && (
            <span className="ml-2">
              （対象 {userCount.toLocaleString()} 人）
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-y-3 text-xs">
        {/* header */}
        <div />
        <div className="text-center text-white/60">自分</div>
        <div className="text-center text-white/40">平均</div>
        <div className="text-center font-semibold text-emerald-400">
          上位10%
        </div>

        {rows.map((r) => (
          <div key={r.label} className="contents">
            <div className="text-white/70">{r.label}</div>
            <div className="text-center font-semibold text-white">
              {r.format(r.self)}
            </div>
            <div className="text-center text-white/60">
              {r.format(r.avg)}
            </div>
            <div className="text-center font-semibold text-emerald-400">
              {r.format(r.top10)}
            </div>
          </div>
        ))}
      </div>

      {/* ★ ここに追加 */}
      {typeof userCount === "number" &&
        typeof top10UserCount === "number" && (
          <div className="mt-3 text-[11px] leading-relaxed text-white/40">
            平均値は {userCount.toLocaleString()} 人を対象に算出。<br />
            上位10%は、投稿数30以上の{" "}
            {top10UserCount.toLocaleString()} 人を対象に算出。
          </div>
        )}
    </div>
  );
}
