import Link from "next/link";
import { plans } from "./lp-data";

export default function LPPlans() {
  return (
    <section
      id="plans"
      data-lp-animate="zoom"
      className="lp-section-shell"
    >
      <div className="lp-section-rail">
        <div className="mx-auto h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-cyan-300/38 to-transparent" />
        <div className="mx-auto h-24 w-[68%] max-w-4xl bg-cyan-300/7 blur-3xl" />
      </div>

      <div className="relative grid gap-10 lg:grid-cols-[0.84fr_1.16fr] lg:items-start">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-3">
            <div className="h-px w-10 bg-gradient-to-r from-cyan-300/70 to-transparent" />
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300/82">
              Plans
            </div>
          </div>

          <h2 className="lp-section-title">
            Freeで始めて、必要ならProで深く見る。
          </h2>

          <p className="lp-section-desc">
            まずは無料で参加し、ランキングや基本成績を確認できる。さらに詳しく振り返りたい人向けに、Proで分析機能を広げる。
          </p>

          <div className="mt-8 overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-[1px] backdrop-blur-xl">
            <div className="relative rounded-[31px] bg-[linear-gradient(180deg,rgba(8,18,30,0.92),rgba(6,16,26,0.86))] p-6 sm:p-7">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/38 to-transparent" />
              <div className="pointer-events-none absolute inset-x-[10%] top-0 h-24 rounded-full bg-cyan-300/8 blur-3xl" />
              <div className="pointer-events-none absolute inset-[1px] rounded-[30px] ring-1 ring-inset ring-white/6" />
              <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(120,220,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(120,220,255,0.18)_1px,transparent_1px)] [background-size:34px_34px]" />

              <div className="relative">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/74">
                  Comparison
                </div>

                <div className="mt-3 text-[24px] font-black leading-[1.08] tracking-[-0.04em] text-white">
                  見える深さが変わる。
                </div>

                <p className="mt-3 max-w-[34rem] text-sm leading-7 text-white/58">
                  Freeは参加と確認の入口。Proは推移、比較、詳細分析まで広げて、自分の予想力をより深く見返せる。
                </p>

                <div className="relative mt-6 space-y-4">
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[18px] font-black tracking-tight text-white">
                          Free
                        </div>
                        <div className="mt-1 text-sm leading-6 text-white/56">
                          参加して、順位と基本成績を見る
                        </div>
                      </div>

                      <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
                        Entry
                      </div>
                    </div>

                    <div className="mt-4 h-2 rounded-full bg-white/8">
                      <div className="h-2 w-[42%] rounded-full bg-gradient-to-r from-white/70 to-cyan-300/70" />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                          View
                        </div>
                        <div className="mt-2 text-sm font-bold text-white">
                          ランキング
                        </div>
                      </div>
                      <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                          Base
                        </div>
                        <div className="mt-2 text-sm font-bold text-white">
                          基本成績
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-cyan-300/16 bg-cyan-300/[0.04] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[18px] font-black tracking-tight text-white">
                          Pro
                        </div>
                        <div className="mt-1 text-sm leading-6 text-white/56">
                          トレンドや比較まで含めて深く分析する
                        </div>
                      </div>

                      <div className="rounded-full border border-cyan-300/18 bg-cyan-300/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/78">
                        Deep Analysis
                      </div>
                    </div>

                    <div className="mt-4 h-2 rounded-full bg-white/8">
                      <div className="h-2 w-[88%] rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-emerald-300 shadow-[0_0_18px_rgba(34,211,238,0.18)]" />
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-[18px] border border-cyan-300/12 bg-cyan-300/[0.04] px-4 py-3">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                          Trend
                        </div>
                        <div className="mt-2 text-sm font-bold text-white">
                          推移
                        </div>
                      </div>
                      <div className="rounded-[18px] border border-cyan-300/12 bg-cyan-300/[0.04] px-4 py-3">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                          Compare
                        </div>
                        <div className="mt-2 text-sm font-bold text-white">
                          比較
                        </div>
                      </div>
                      <div className="rounded-[18px] border border-cyan-300/12 bg-cyan-300/[0.04] px-4 py-3">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                          Analyze
                        </div>
                        <div className="mt-2 text-sm font-bold text-white">
                          詳細分析
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                      Start
                    </div>
                    <div className="mt-2 text-[20px] font-black text-white">
                      Free
                    </div>
                  </div>
                  <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                      Expand
                    </div>
                    <div className="mt-2 text-[20px] font-black text-white">
                      Pro
                    </div>
                  </div>
                  <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                      Goal
                    </div>
                    <div className="mt-2 text-[20px] font-black text-white">
                      Analysis
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative grid gap-5 lg:grid-cols-2">
          {plans.map((plan, index) => {
            const isPro = plan.name === "Pro";

            return (
              <div
                key={plan.name}
                className={`group relative overflow-hidden rounded-[32px] border p-[1px] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.22)] ${
                  isPro
                    ? "border-cyan-300/22 bg-[linear-gradient(180deg,rgba(34,211,238,0.10),rgba(255,255,255,0.03))] hover:border-cyan-300/30"
                    : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] hover:border-white/16"
                }`}
                style={{
                  animation: "lp-plans-fade-up .7s ease-out both",
                  animationDelay: `${index * 0.09}s`,
                }}
              >
                <div
                  className={`relative flex h-full flex-col rounded-[31px] p-7 ${
                    isPro
                      ? "bg-[linear-gradient(180deg,rgba(8,20,32,0.94),rgba(5,16,26,0.90))]"
                      : "bg-[linear-gradient(180deg,rgba(8,18,30,0.90),rgba(6,16,26,0.84))]"
                  }`}
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent" />
                  <div
                    className={`pointer-events-none absolute inset-x-[12%] top-0 h-24 rounded-full blur-3xl ${
                      isPro ? "bg-cyan-300/10" : "bg-cyan-300/7"
                    }`}
                  />
                  <div className="pointer-events-none absolute inset-[1px] rounded-[30px] ring-1 ring-inset ring-white/6" />

                  {isPro ? (
                    <div className="relative mb-5 inline-flex w-fit items-center rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/78">
                      Recommended for analysis
                    </div>
                  ) : (
                    <div className="relative mb-5 inline-flex w-fit items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/68">
                      Best for getting started
                    </div>
                  )}

                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[30px] font-black tracking-tight text-white">
                        {plan.name}
                      </div>
                      <div className="mt-2 text-sm font-medium text-white/72">
                        {plan.price}
                      </div>
                      <div className="mt-2 text-sm leading-6 text-white/54">
                        {plan.caption}
                      </div>
                    </div>

                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm font-black ${
                        isPro
                          ? "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100"
                          : "border-white/10 bg-white/[0.05] text-white/82"
                      }`}
                    >
                      {plan.name === "Free" ? "F" : "P"}
                    </div>
                  </div>

                  <div className="relative mt-6 h-px w-full bg-gradient-to-r from-cyan-300/22 via-white/10 to-transparent" />

                  <div className="relative mt-6 space-y-3">
                    {plan.items.map((item, itemIndex) => (
                      <div
                        key={item}
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
                          isPro
                            ? "border-cyan-300/12 bg-cyan-300/[0.04] text-white/80"
                            : "border-white/8 bg-white/[0.03] text-white/76"
                        }`}
                      >
                        <div
                          className={`h-2 w-2 rounded-full ${
                            isPro
                              ? "bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.55)]"
                              : "bg-white/46"
                          }`}
                        />
                        <span>{item}</span>
                        <div className="ml-auto text-[10px] font-semibold uppercase tracking-[0.16em] text-white/34">
                          {String(itemIndex + 1).padStart(2, "0")}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto">
                    <div className="relative mt-6">
                      <Link
                        href="#signup"
                        className={`inline-flex min-h-[50px] w-full items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition duration-200 ${
                          isPro
                            ? "border-cyan-300/18 bg-cyan-300/[0.08] text-cyan-50 hover:bg-cyan-300/[0.12]"
                            : "border-white/12 bg-white/[0.05] text-white/86 hover:bg-white/[0.08]"
                        }`}
                      >
                        {plan.button}
                      </Link>
                    </div>

                    <div className="relative mt-5 flex items-center gap-3">
                      <div
                        className={`h-[7px] w-[7px] rounded-full ${
                          isPro
                            ? "bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.85)]"
                            : "bg-white/46"
                        }`}
                      />
                      <div
                        className={`h-px flex-1 ${
                          isPro
                            ? "bg-gradient-to-r from-cyan-300/55 to-transparent"
                            : "bg-gradient-to-r from-white/24 to-transparent"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes lp-plans-fade-up {
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