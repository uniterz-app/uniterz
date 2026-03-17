"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { stats } from "./lp-data";
import PhoneMock from "./PhoneMock";

type HeroView = "ranking" | "games" | "predict";

const HERO_VIEWS: Array<{
  key: HeroView;
  label: string;
  title: string;
  desc: string;
  src: string;
  chip: string;
}> = [
  {
    key: "ranking",
    label: "Ranking",
    title: "実力が、立体的に見える。",
    desc: "勝率だけでなく、5指標で予想の強さを可視化。結果を見る場所ではなく、競い合う場所になる。",
    src: "/lp/ranking.png",
    chip: "5 Metrics",
  },
  {
    key: "games",
    label: "Games",
    title: "試合選択から予想までが速い。",
    desc: "日付ごとに試合を確認し、そのままテンポよく予想投稿。迷わない導線で体験が途切れない。",
    src: "/lp/games.png",
    chip: "Schedule Flow",
  },
  {
    key: "predict",
    label: "Predict",
    title: "予想を、入力体験ごと磨く。",
    desc: "勝敗だけでなく、信頼度とスコアまで入力。予想の質そのものをデータとして積み上げられる。",
    src: "/lp/predict.png",
    chip: "Confidence Input",
  },
];

export default function LPHero() {
  const [activeView, setActiveView] = useState<HeroView>("ranking");

  const activeIndex = HERO_VIEWS.findIndex((v) => v.key === activeView);
  const active = HERO_VIEWS[activeIndex];
  const left =
    HERO_VIEWS[(activeIndex + HERO_VIEWS.length - 1) % HERO_VIEWS.length];
  const right = HERO_VIEWS[(activeIndex + 1) % HERO_VIEWS.length];

  const mobileTitle = useMemo(() => active.title, [active]);
  const mobileDesc = useMemo(() => active.desc, [active]);

  return (
    <section className="relative w-full overflow-hidden pb-24 pt-3 lg:pb-28 lg:pt-4">
      <style>{`
        @keyframes lp-grid-drift {
          0% { transform: translate3d(0,0,0); }
          100% { transform: translate3d(0,24px,0); }
        }

        @keyframes lp-float-main {
          0%, 100% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(0,-10px,0); }
        }

        @keyframes lp-float-left {
          0%, 100% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(0,-6px,0); }
        }

        @keyframes lp-float-right {
          0%, 100% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(0,-6px,0); }
        }

        @keyframes lp-fade-up {
          0% { opacity: 0; transform: translate3d(0,18px,0); }
          100% { opacity: 1; transform: translate3d(0,0,0); }
        }

        @keyframes lp-glow-pulse {
          0%, 100% { opacity: .34; transform: scale(1); }
          50% { opacity: .58; transform: scale(1.03); }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:120px_120px] opacity-[0.08]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:120px_120px] opacity-[0.05] [animation:lp-grid-drift_10s_linear_infinite_alternate]" />
        </div>

        <div className="absolute inset-y-0 left-0 w-[24vw] min-w-[120px] bg-gradient-to-r from-cyan-400/8 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-[28vw] min-w-[160px] bg-gradient-to-l from-emerald-300/7 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-[680px] bg-[radial-gradient(circle_at_18%_22%,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_78%_18%,rgba(16,185,129,0.14),transparent_30%),radial-gradient(circle_at_58%_78%,rgba(59,130,246,0.10),transparent_32%)]" />
        <div className="absolute left-[6%] top-[18%] h-[360px] w-[360px] rounded-full bg-cyan-400/8 blur-3xl" />
        <div className="absolute right-[6%] top-[10%] h-[300px] w-[300px] rounded-full bg-emerald-300/8 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <header className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 shrink-0">
              <Image
                src="/logo/logo.png"
                alt="Uniterz logo"
                fill
                priority
                className="object-contain drop-shadow-[0_0_18px_rgba(44,244,255,0.38)]"
              />
            </div>

            <div className="text-[24px] font-black tracking-[0.28em] text-white/95">
              UNITERZ
            </div>
          </div>

          <div className="hidden rounded-full border border-cyan-300/20 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/85 backdrop-blur-xl sm:block">
            Sports Prediction Platform
          </div>
        </header>

        <div className="relative z-10 grid items-center gap-12 pt-8 lg:grid-cols-[0.96fr_1.04fr] lg:gap-8 lg:pt-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/72 backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.95)]" />
              Predict. Analyze. Rank.
            </div>

            <div className="mt-7 flex items-center gap-4">
              <div className="relative h-14 w-14 shrink-0 sm:h-16 sm:w-16">
                <Image
                  src="/logo/logo.png"
                  alt="Uniterz symbol"
                  fill
                  className="object-contain drop-shadow-[0_0_26px_rgba(44,244,255,0.34)]"
                />
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-cyan-300/40 to-transparent" />
            </div>

            <h1 className="mt-6 max-w-5xl text-5xl font-black leading-[0.92] tracking-[-0.04em] sm:text-6xl lg:text-7xl xl:text-[92px]">
              スポーツ予想を
              <span className="block bg-gradient-to-r from-cyan-300 via-sky-400 to-emerald-300 bg-clip-text text-transparent">
                競技体験へ。
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
              Uniterzは、予想投稿、結果反映、ランキング、分析までを一体化したスポーツ予想プラットフォーム。
              当てたかどうかだけではなく、どれだけ上手いかまで見える。
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="#signup"
                className="rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-400 to-emerald-300 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-[0_0_36px_rgba(34,211,238,0.28)] transition duration-200 hover:scale-[1.02]"
              >
                無料で始める
              </Link>

              <Link
                href="#features"
                className="rounded-2xl border border-white/14 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white/88 backdrop-blur-xl transition duration-200 hover:bg-white/[0.07]"
              >
                機能を見る
              </Link>
            </div>

            <div className="mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl"
                >
                  <div className="text-[28px] font-black leading-none text-white">
                    {item.value}
                  </div>
                  <div className="mt-2 text-[11px] uppercase tracking-[0.22em] text-white/42">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[650px] sm:min-h-[720px] lg:min-h-[780px]">
            <div className="absolute inset-x-0 top-4 z-40 flex items-center justify-center">
              <div className="rounded-full border border-white/10 bg-[#08111d]/72 p-1.5 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <div className="flex items-center gap-1.5">
                  {HERO_VIEWS.map((view) => {
                    const isActive = view.key === activeView;
                    return (
                      <button
                        key={view.key}
                        type="button"
                        onClick={() => setActiveView(view.key)}
                        className={`rounded-full px-4 py-2.5 text-[12px] font-semibold tracking-[0.08em] transition ${
                          isActive
                            ? "bg-gradient-to-r from-cyan-300 via-sky-400 to-emerald-300 text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.20)]"
                            : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        {view.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="absolute inset-x-0 top-[72px] bottom-0 overflow-hidden">
              <div className="absolute left-1/2 top-[43%] z-0 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl [animation:lp-glow-pulse_6.5s_ease-in-out_infinite]" />

              <div className="pointer-events-none absolute left-1/2 top-[70%] z-0 h-[108px] w-[420px] -translate-x-1/2 rounded-[999px] bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.07),rgba(0,0,0,0)_72%)] blur-xl" />
              <div className="pointer-events-none absolute left-1/2 top-[72.2%] z-0 h-[92px] w-[360px] -translate-x-1/2 rounded-[999px] border border-white/6 bg-white/[0.02] [transform:perspective(1200px)_rotateX(78deg)]" />

              <div className="absolute inset-0 [perspective:1800px]">
                <div className="relative h-full w-full [transform-style:preserve-3d]">
                  <button
                    type="button"
                    onClick={() => setActiveView(left.key)}
                    aria-label={`Show ${left.label}`}
                    className="absolute left-[8%] top-[29%] z-10 hidden lg:block"
                  >
                    <div className="[animation:lp-float-left_7.2s_ease-in-out_infinite] transition duration-300 hover:scale-[1.03] [transform-style:preserve-3d] [transform:translate3d(0,0,-56px)_rotateY(24deg)_rotateX(6deg)_rotateZ(-4deg)]">
                      <PhoneMock
                        src={left.src}
                        alt={`${left.label} UI`}
                        widthClassName="w-[158px]"
                        glowClassName="from-transparent via-transparent to-transparent"
                        imageClassName="brightness-[0.84] saturate-[0.88]"
                        hideStatusBar
                      />
                    </div>
                  </button>

                  <div className="absolute left-1/2 top-[46.5%] z-30 -translate-x-1/2 -translate-y-1/2">
                    <div
                      key={active.key}
                      className="[animation:lp-fade-up_.35s_ease-out] [animation-fill-mode:both]"
                    >
                      <div className="[animation:lp-float-main_7.2s_ease-in-out_infinite] [transform-style:preserve-3d] [transform:translateZ(32px)]">
                        <PhoneMock
                          src={active.src}
                          alt={`${active.label} UI`}
                          widthClassName="w-[214px] sm:w-[244px] lg:w-[268px]"
                          glowClassName="from-transparent via-transparent to-transparent"
                          imageClassName="brightness-[0.98] saturate-[1.02]"
                          tiltClassName="[transform:rotateY(-5deg)_rotateX(5deg)_rotateZ(1deg)]"
                          hideStatusBar
                          priority
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveView(right.key)}
                    aria-label={`Show ${right.label}`}
                    className="absolute right-[8%] top-[37%] z-10 hidden lg:block"
                  >
                    <div className="[animation:lp-float-right_7.5s_ease-in-out_infinite] transition duration-300 hover:scale-[1.03] [transform-style:preserve-3d] [transform:translate3d(0,0,-56px)_rotateY(-24deg)_rotateX(6deg)_rotateZ(4deg)]">
                      <PhoneMock
                        src={right.src}
                        alt={`${right.label} UI`}
                        widthClassName="w-[168px]"
                        glowClassName="from-transparent via-transparent to-transparent"
                        imageClassName="brightness-[0.84] saturate-[0.88]"
                        hideStatusBar
                      />
                    </div>
                  </button>
                </div>
              </div>

              <div className="absolute bottom-1 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 px-2 sm:px-0">
                <div className="rounded-[24px] border border-white/10 bg-[#07111d]/76 px-5 py-4 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200/66">
                        Experience
                      </div>
                      <div className="mt-2 text-lg font-black tracking-[-0.03em] text-white sm:text-xl">
                        {mobileTitle}
                      </div>
                    </div>

                    <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/56 sm:block">
                      {active.chip}
                    </div>
                  </div>

                  <div className="mt-3 max-w-[360px] text-sm leading-6 text-white/64">
                    {mobileDesc}
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-10 block lg:hidden">
              <div className="mx-auto h-[220px] w-[220px] rounded-full bg-cyan-400/10 blur-3xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}