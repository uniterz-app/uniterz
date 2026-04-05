import { steps } from "./lp-data";

export default function LPHowItWorks() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 pb-24 pt-16 sm:px-8 sm:pt-18 lg:px-10 lg:pt-20">
      <div className="pointer-events-none absolute inset-x-6 top-0 sm:inset-x-8 lg:inset-x-10">
        <div className="mx-auto h-px w-full max-w-6xl bg-linear-to-r from-transparent via-cyan-300/38 to-transparent" />
        <div className="mx-auto h-24 w-[68%] max-w-4xl bg-cyan-300/7 blur-3xl" />
      </div>

      <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.022))] p-px backdrop-blur-2xl">
        <div className="relative rounded-[35px] bg-[linear-gradient(180deg,rgba(8,18,30,0.90),rgba(6,16,26,0.84))] p-7 sm:p-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-200/40 to-transparent" />
          <div className="pointer-events-none absolute inset-x-[12%] top-0 h-28 rounded-full bg-cyan-300/8 blur-3xl" />
          <div className="pointer-events-none absolute inset-px rounded-[34px] ring-1 ring-inset ring-white/6" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(120,220,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(120,220,255,0.18)_1px,transparent_1px)] bg-size-[34px_34px] opacity-[0.06]" />

          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-3">
              <div className="h-px w-10 bg-linear-to-r from-cyan-300/70 to-transparent" />
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300/82">
                How It Works
              </div>
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-[42px] lg:leading-[1.05]">
              予想して終わりではなく、その先までつながる。
            </h2>

            <p className="mt-4 max-w-2xl text-base leading-7 text-white/68">
              使い方はシンプル。試合を予想すると、結果が自動で反映され、順位や分析までそのまま一つの流れでつながっていく。
            </p>
          </div>

          <div className="relative mt-10">
            <div className="pointer-events-none absolute left-[8%] right-[8%] top-10 hidden h-px bg-linear-to-r from-cyan-300/0 via-cyan-300/38 to-cyan-300/0 lg:block" />

            <div className="grid gap-5 lg:grid-cols-3">
              {steps.map((step, index) => (
                <div
                  key={step.no}
                  className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-px transition duration-300 hover:-translate-y-1 hover:border-cyan-300/18 hover:shadow-[0_20px_50px_rgba(0,0,0,0.22)]"
                  style={{
                    animation: "lp-steps-fade-up .7s ease-out both",
                    animationDelay: `${index * 0.09}s`,
                  }}
                >
                  <div className="relative h-full rounded-[27px] bg-[linear-gradient(180deg,rgba(7,17,34,0.94),rgba(6,16,28,0.88))] p-6">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-200/36 to-transparent" />
                    <div className="pointer-events-none absolute inset-x-[10%] top-0 h-20 rounded-full bg-cyan-300/7 blur-3xl" />
                    <div className="pointer-events-none absolute inset-px rounded-[26px] ring-1 ring-inset ring-white/6" />

                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/22 bg-cyan-300/10 text-sm font-black tracking-[0.18em] text-cyan-200">
                          {step.no}
                        </div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300/74">
                          Step
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-cyan-200/70 shadow-[0_0_12px_rgba(103,232,249,0.65)]" />
                        {index < steps.length - 1 ? (
                          <div className="hidden h-px w-10 bg-linear-to-r from-cyan-300/55 to-transparent lg:block" />
                        ) : null}
                      </div>
                    </div>

                    <div className="relative mt-5 text-[22px] font-black leading-[1.12] tracking-[-0.03em] text-white">
                      {step.title}
                    </div>

                    <p className="relative mt-3 text-sm leading-7 text-white/66">
                      {step.text}
                    </p>

                    <div className="relative mt-6">
                      {index === 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-2xl border border-white/8 bg-white/3 px-3 py-3 text-center">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                              Pick
                            </div>
                            <div className="mt-2 text-sm font-bold text-white">
                              勝敗
                            </div>
                          </div>
                          <div className="rounded-2xl border border-white/8 bg-white/3 px-3 py-3 text-center">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                              Score
                            </div>
                            <div className="mt-2 text-sm font-bold text-white">
                              スコア
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {index === 1 ? (
                        <div className="rounded-[20px] border border-white/8 bg-white/3 p-4">
                          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/72">
                            <span>Auto Sync</span>
                            <span>Live</span>
                          </div>
                          <div className="mt-4 h-2 rounded-full bg-white/8">
                            <div className="h-2 w-[82%] rounded-full bg-linear-to-r from-cyan-300 via-sky-400 to-emerald-300" />
                          </div>
                          <div className="mt-3 flex items-center justify-between text-xs text-white/54">
                            <span>予想投稿</span>
                            <span>結果反映</span>
                            <span>集計完了</span>
                          </div>
                        </div>
                      ) : null}

                      {index === 2 ? (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-2xl border border-white/8 bg-white/3 px-3 py-3">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                              Rank
                            </div>
                            <div className="mt-2 text-sm font-bold text-white">
                              #12
                            </div>
                          </div>
                          <div className="rounded-2xl border border-white/8 bg-white/3 px-3 py-3">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                              Metrics
                            </div>
                            <div className="mt-2 text-sm font-bold text-white">
                              4種
                            </div>
                          </div>
                          <div className="rounded-2xl border border-white/8 bg-white/3 px-3 py-3">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                              Trend
                            </div>
                            <div className="mt-2 text-sm font-bold text-white">
                              推移
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="relative mt-6 flex items-center gap-3">
                      <div className="h-[7px] w-[7px] rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.85)]" />
                      <div className="h-px flex-1 bg-linear-to-r from-cyan-300/55 to-transparent" />
                    </div>

                    <div className="relative mt-5 h-1 w-0 rounded-full bg-linear-to-r from-cyan-300 to-emerald-300 transition-all duration-300 group-hover:w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes lp-steps-fade-up {
          0% {
            opacity: 0;
            transform: translate3d(0, 18px, 0);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
      `}</style>
    </section>
  );
}