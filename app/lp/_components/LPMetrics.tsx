import { metricRadar, metrics, trendBars } from "./lp-data";

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number
) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

export default function LPMetrics() {
  const center = 160;
  const radius = 108;
  const levels = [0.25, 0.5, 0.75, 1];

  const metricPoints = metricRadar.map((item, index) => {
    const angle = (360 / metricRadar.length) * index;
    const point = polarToCartesian(center, center, radius, angle);
    const valuePoint = polarToCartesian(
      center,
      center,
      radius * (item.value / 100),
      angle
    );

    return {
      ...item,
      angle,
      point,
      valuePoint,
    };
  });

  const radarPath = metricPoints
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.valuePoint.x} ${point.valuePoint.y}`
    )
    .join(" ")
    .concat(" Z");

  const totalValue =
    Math.round(
      metricRadar.reduce((sum, item) => sum + item.value, 0) / metricRadar.length
    ) || 0;

  return (
    <section
      id="metrics"
      data-lp-animate="right"
      className="lp-section-shell"
    >
      <div className="lp-section-rail">
        <div className="mx-auto h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-cyan-300/38 to-transparent" />
        <div className="mx-auto h-24 w-[68%] max-w-4xl bg-cyan-300/7 blur-3xl" />
      </div>

      <div className="relative grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-3">
            <div className="h-px w-10 bg-gradient-to-r from-cyan-300/70 to-transparent" />
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300/82">
              How We Measure
            </div>
          </div>

          <h2 className="lp-section-title">
            予想力を、4つの指標で分解する。
          </h2>

          <p className="lp-section-desc">
            順位だけでは見えない差を、4つの視点で可視化する。勝率だけでなく、スコア精度、アップセット得点、総合得点まで含めて予想の質を評価する。
          </p>

          <div className="mt-8 overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-[1px] backdrop-blur-xl">
            <div className="relative rounded-[29px] bg-[linear-gradient(180deg,rgba(8,18,30,0.90),rgba(6,16,26,0.84))] p-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/38 to-transparent" />
              <div className="pointer-events-none absolute inset-x-[10%] top-0 h-24 rounded-full bg-cyan-300/8 blur-3xl" />
              <div className="pointer-events-none absolute inset-[1px] rounded-[28px] ring-1 ring-inset ring-white/6" />

              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/74">
                    Prediction Skill
                  </div>
                  <div className="mt-2 text-[24px] font-black leading-none tracking-[-0.04em] text-white">
                    4 Metrics System
                  </div>
                </div>

                <div className="rounded-full border border-cyan-300/18 bg-cyan-300/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/74">
                  Layered Evaluation
                </div>
              </div>

              <div className="mt-5 h-px w-full bg-gradient-to-r from-cyan-300/24 via-white/10 to-transparent" />

              <div
                className="mt-5 grid gap-3"
                data-lp-stagger-group
                data-lp-stagger-variant="up"
                data-lp-stagger-step="0.08"
              >
                {metrics.map((item, index) => (
                  <div
                    key={item.key}
                    className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4"
                    data-lp-stagger-item
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/70">
                          {item.short}
                        </div>
                        <div className="mt-2 text-[18px] font-black tracking-[-0.03em] text-white">
                          {item.title}
                        </div>
                      </div>

                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/18 bg-cyan-300/8 text-[10px] font-bold text-cyan-200">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-7 text-white/62">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative grid gap-5">
          <div className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.022))] p-[1px] backdrop-blur-xl">
            <div className="relative rounded-[33px] bg-[linear-gradient(180deg,rgba(8,18,30,0.90),rgba(6,16,26,0.84))] p-6 sm:p-7">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/38 to-transparent" />
              <div className="pointer-events-none absolute inset-x-[12%] top-0 h-24 rounded-full bg-cyan-300/8 blur-3xl" />
              <div className="pointer-events-none absolute inset-[1px] rounded-[32px] ring-1 ring-inset ring-white/6" />
              <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(120,220,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(120,220,255,0.18)_1px,transparent_1px)] [background-size:34px_34px]" />

              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/74">
                    Radar View
                  </div>
                  <div className="mt-2 text-[24px] font-black tracking-[-0.04em] text-white">
                    4指標のバランス
                  </div>
                </div>

                <div className="rounded-full border border-cyan-300/18 bg-cyan-300/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/74">
                  Visual Breakdown
                </div>
              </div>

              <div className="relative mt-6 flex justify-center">
                <div className="relative h-[320px] w-[320px]">
                  <div className="pointer-events-none absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/8 blur-3xl" />

                  <svg
                    viewBox="0 0 320 320"
                    className="relative h-full w-full"
                    aria-hidden="true"
                  >
                    {levels.map((level) => {
                      const levelPath = metricPoints
                        .map((point, index) => {
                          const p = polarToCartesian(
                            center,
                            center,
                            radius * level,
                            point.angle
                          );
                          return `${index === 0 ? "M" : "L"} ${p.x} ${p.y}`;
                        })
                        .join(" ")
                        .concat(" Z");

                      return (
                        <path
                          key={level}
                          d={levelPath}
                          fill="none"
                          stroke="rgba(148, 163, 184, 0.18)"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {metricPoints.map((point) => (
                      <line
                        key={point.label}
                        x1={center}
                        y1={center}
                        x2={point.point.x}
                        y2={point.point.y}
                        stroke="rgba(125, 211, 252, 0.20)"
                        strokeWidth="1"
                      />
                    ))}

                    <path
                      d={radarPath}
                      fill="rgba(34, 211, 238, 0.14)"
                      stroke="rgba(103, 232, 249, 0.85)"
                      strokeWidth="2.2"
                    />

                    {metricPoints.map((point) => (
                      <circle
                        key={point.label}
                        cx={point.valuePoint.x}
                        cy={point.valuePoint.y}
                        r="4.5"
                        fill="rgba(186,230,253,1)"
                        stroke="rgba(34,211,238,0.9)"
                        strokeWidth="2"
                      />
                    ))}
                  </svg>

                  <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-[96px] w-[96px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(8,18,30,0.92),rgba(6,16,26,0.86))] shadow-[0_0_30px_rgba(34,211,238,0.10)]">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/70">
                      Total
                    </div>
                    <div className="mt-1 text-[28px] font-black leading-none tracking-[-0.05em] text-white">
                      {totalValue}
                    </div>
                  </div>

                  {metricPoints.map((point) => (
                    <div
                      key={point.label}
                      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-[rgba(8,18,30,0.82)] px-3 py-1.5 text-[11px] font-semibold text-white/84 backdrop-blur-xl"
                      style={{
                        left: `${point.point.x}px`,
                        top: `${point.point.y}px`,
                      }}
                    >
                      {point.label}
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"
                data-lp-stagger-group
                data-lp-stagger-variant="up"
                data-lp-stagger-step="0.06"
              >
                {metricRadar.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[20px] border border-white/8 bg-white/[0.03] px-3 py-3 text-center"
                    data-lp-stagger-item
                  >
                    <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                      {item.label}
                    </div>
                    <div className="mt-2 text-[18px] font-black leading-none text-white">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.022))] p-[1px] backdrop-blur-xl">
            <div className="relative rounded-[29px] bg-[linear-gradient(180deg,rgba(8,18,30,0.90),rgba(6,16,26,0.84))] p-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/38 to-transparent" />
              <div className="pointer-events-none absolute inset-x-[10%] top-0 h-20 rounded-full bg-cyan-300/8 blur-3xl" />
              <div className="pointer-events-none absolute inset-[1px] rounded-[28px] ring-1 ring-inset ring-white/6" />

              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/74">
                    Trend View
                  </div>
                  <div className="mt-2 text-[22px] font-black tracking-[-0.04em] text-white">
                    推移も合わせて見る
                  </div>
                </div>

                <div className="rounded-full border border-cyan-300/18 bg-cyan-300/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/74">
                  Weekly Growth
                </div>
              </div>

              <div
                className="mt-6 flex items-end gap-3"
                data-lp-stagger-group
                data-lp-stagger-variant="up"
                data-lp-stagger-step="0.06"
              >
                {trendBars.map((bar) => (
                  <div
                    key={bar.label}
                    className="flex flex-1 flex-col items-center"
                    data-lp-stagger-item
                  >
                    <div className="flex h-[180px] w-full items-end justify-center rounded-[18px] border border-white/6 bg-white/[0.02] px-2 pb-2">
                      <div
                        className="w-full rounded-[14px] bg-gradient-to-t from-cyan-300 via-sky-400 to-emerald-300 shadow-[0_0_22px_rgba(34,211,238,0.14)]"
                        style={{
                          height: `${bar.value}%`,
                          minHeight: "18px",
                        }}
                      />
                    </div>
                    <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/54">
                      {bar.label}
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="mt-5 grid gap-3 sm:grid-cols-3"
                data-lp-stagger-group
                data-lp-stagger-variant="up"
                data-lp-stagger-step="0.08"
              >
                <div
                  className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4"
                  data-lp-stagger-item
                >
                  <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                    Current
                  </div>
                  <div className="mt-2 text-[20px] font-black text-white">
                    83
                  </div>
                </div>
                <div
                  className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4"
                  data-lp-stagger-item
                >
                  <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                    Best Week
                  </div>
                  <div className="mt-2 text-[20px] font-black text-white">
                    W5
                  </div>
                </div>
                <div
                  className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4"
                  data-lp-stagger-item
                >
                  <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                    Direction
                  </div>
                  <div className="mt-2 text-[20px] font-black text-white">
                    Up
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}