"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PhoneMock from "./PhoneMock";
import { heroMediaViews } from "./lp-data";

type HeroView = (typeof heroMediaViews)[number]["key"];

function pickVideoBackdrop(
  m: (typeof heroMediaViews)[number]["media"]
): string | undefined {
  return "videoBackdropSrc" in m ? m.videoBackdropSrc : undefined;
}

const FLOW_STEPS = [
  "試合を選ぶ",
  "予想を投稿",
  "結果を自動集計",
  "ランキング反映",
] as const;

export default function LPHero() {
  const pathname = usePathname();
  const isMobileLp = pathname?.includes("/mobile/lp") ?? false;
  const [activeView, setActiveView] = useState<HeroView>("ranking");

  const activeIndex = heroMediaViews.findIndex((v) => v.key === activeView);
  const active = heroMediaViews[activeIndex];
  const left =
    heroMediaViews[
      (activeIndex + heroMediaViews.length - 1) % heroMediaViews.length
    ];
  const right = heroMediaViews[(activeIndex + 1) % heroMediaViews.length];

  const mobileTitle = useMemo(() => active.title, [active]);
  const mobileDesc = useMemo(() => active.desc, [active]);

  const handlePrev = () => setActiveView(left.key);
  const handleNext = () => setActiveView(right.key);

  return (
    <section
      id="top"
      data-lp-animate="up"
      className="relative w-full overflow-hidden pb-16 pt-6 sm:pb-20 sm:pt-8 lg:pb-24 lg:pt-10"
    >
      <style>{`
        @keyframes lp-grid-drift {
          0% { transform: translate3d(0,0,0); }
          100% { transform: translate3d(0,18px,0); }
        }

        @keyframes lp-fade-up {
          0% { opacity: 0; transform: translate3d(0,16px,0); }
          100% { opacity: 1; transform: translate3d(0,0,0); }
        }

        @keyframes lp-glow-pulse {
          0%, 100% { opacity: .22; transform: scale(1); }
          50% { opacity: .36; transform: scale(1.03); }
        }

        @keyframes lp-float-main {
          0%, 100% { transform: translateY(0px) rotate(-1.5deg); }
          50% { transform: translateY(-8px) rotate(-1.5deg); }
        }

        @keyframes lp-float-side-left {
          0%, 100% { transform: translate(-10px,16px) rotate(-9deg); }
          50% { transform: translate(-10px,8px) rotate(-9deg); }
        }

        @keyframes lp-float-side-right {
          0%, 100% { transform: translate(8px,10px) rotate(8deg); }
          50% { transform: translate(8px,2px) rotate(8deg); }
        }

        @keyframes lp-float-mobile-left {
          0%, 100% { transform: rotate(-9deg) translateY(0px); }
          50% { transform: rotate(-9deg) translateY(-5px); }
        }

        @keyframes lp-float-mobile-right {
          0%, 100% { transform: rotate(8deg) translateY(0px); }
          50% { transform: rotate(8deg) translateY(-5px); }
        }

        @keyframes lp-title-float {
          0%, 100% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(0,-2px,0); }
        }

        @keyframes lp-title-shine {
          0% { background-position: -160% 50%; }
          100% { background-position: 220% 50%; }
        }
        @keyframes lp-enter-soft {
          0% { opacity: 0; transform: translate3d(0, 18px, 0); }
          100% { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes lp-enter-phone {
          0% { opacity: 0; transform: translate3d(0, 24px, 0) scale(0.92); filter: blur(3px); }
          100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0); }
        }
        @keyframes lp-impact-ring {
          0% { transform: scale(0.7); opacity: 0.75; }
          100% { transform: scale(1.22); opacity: 0; }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 overflow-hidden">
        </div>

        <div className="absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.05),transparent_34%),radial-gradient(circle_at_78%_16%,rgba(56,189,248,0.04),transparent_28%),radial-gradient(circle_at_58%_72%,rgba(59,130,246,0.03),transparent_32%)]" />
        <div className="absolute left-[6%] top-[16%] h-[300px] w-[300px] rounded-full bg-cyan-400/3 blur-3xl" />
        <div className="absolute right-[8%] top-[10%] h-[260px] w-[260px] rounded-full bg-sky-400/3 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
        <div className="relative z-10 grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-10">
          <div className="min-w-0 pt-2 lg:pt-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/18 bg-cyan-300/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/76 [animation:lp-enter-soft_.55s_ease-out_.06s_both]">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.7)]" />
              Daily Ranking Battle
            </div>
            <div className="mt-3 flex items-center gap-3 sm:gap-4 [animation:lp-enter-soft_.55s_ease-out_.18s_both]">
              <div className="relative h-11 w-11 shrink-0 sm:h-14 sm:w-14">
                <Image
                  src="/logo/logo.png"
                  alt="Uniterz symbol"
                  fill
                  priority
                  className="object-contain drop-shadow-[0_0_22px_rgba(44,244,255,0.24)]"
                />
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-cyan-300/30 to-transparent" />
            </div>

            <h1 className="mt-6 max-w-5xl sm:mt-7 [animation:lp-enter-soft_.65s_ease-out_.34s_both]">
              <span
                className="block text-[42px] font-black leading-[0.98] tracking-[-0.05em] text-white min-[390px]:text-[48px] sm:text-[72px] sm:leading-[0.95] sm:tracking-[-0.065em] lg:text-[84px] xl:text-[96px]"
                style={{
                  animation: "lp-title-float 6s ease-in-out infinite",
                }}
              >
                観戦して
              </span>

              <span
                className="relative block bg-gradient-to-r from-cyan-300 via-sky-400 to-cyan-100 bg-clip-text text-[42px] font-black leading-[0.98] tracking-[-0.05em] text-transparent min-[390px]:text-[48px] sm:text-[72px] sm:leading-[0.95] sm:tracking-[-0.065em] lg:text-[84px] xl:text-[96px]"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, rgba(125,211,252,1) 0%, rgba(56,189,248,1) 36%, rgba(34,211,238,1) 64%, rgba(207,250,254,0.98) 100%)",
                  backgroundSize: "180% 100%",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  animation:
                    "lp-title-float 6s ease-in-out infinite, lp-title-shine 7s linear infinite",
                }}
              >
                世界と競え。
              </span>
            </h1>

            <p className="mt-5 max-w-[34rem] text-[15px] leading-7 text-white/68 sm:mt-7 sm:max-w-2xl sm:text-lg sm:leading-8 [animation:lp-enter-soft_.65s_ease-out_.52s_both]">
              Uniterzは、ランキングを主役にした予想プラットフォーム。
              予想投稿から結果反映、毎日更新ランキングまでを一つにつなぎ、世界順位を狙える。
            </p>

            <div
              className={`mt-5 flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 text-[11px] font-semibold tracking-[0.08em] text-white/64 scrollbar-none lg:flex-wrap lg:overflow-visible lg:pb-0 ${
                isMobileLp
                  ? "[animation:lp-enter-soft_.65s_ease-out_.62s_both]"
                  : "md:[animation:none]"
              }`}
              data-lp-stagger-group
              data-lp-stagger-variant="up"
              data-lp-stagger-step="0.11"
            >
              {FLOW_STEPS.map((step, index) => (
                <div
                  key={step}
                  className="inline-flex shrink-0 items-center gap-2"
                  data-lp-stagger-item
                >
                  <span className="whitespace-nowrap rounded-full border border-cyan-300/14 bg-cyan-300/[0.05] px-3 py-1.5 text-cyan-100/80">
                    {step}
                  </span>
                  {index < FLOW_STEPS.length - 1 ? (
                    <span className="shrink-0 text-cyan-200/56">→</span>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:gap-4 [animation:lp-enter-soft_.65s_ease-out_.72s_both]">
              <Link
                href="#signup"
                className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-400 to-cyan-100 px-5 py-3.5 text-sm font-bold text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.20)] transition duration-200 hover:scale-[1.02] whitespace-nowrap sm:px-6"
              >
                無料でランキング参戦
              </Link>

              <Link
                href="#features"
                className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04] px-5 py-3.5 text-sm font-semibold text-white/88 backdrop-blur-xl transition duration-200 hover:bg-white/[0.07] whitespace-nowrap sm:px-6"
              >
                デモを見る
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[430px] min-h-[590px] sm:max-w-[560px] sm:min-h-[660px] lg:max-w-none lg:min-h-[740px] [animation:lp-enter-phone_.8s_cubic-bezier(.2,.8,.2,1)_.36s_both]">
            <div className="absolute inset-x-0 bottom-0 top-[-20px] z-20 sm:top-[-12px] lg:top-[-6px]">
              <div className="pointer-events-none absolute left-1/2 top-[41%] h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/35 [animation:lp-impact-ring_1s_ease-out_.18s_both]" />
              <div className="absolute left-1/2 top-[38%] h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/7 blur-3xl [animation:lp-glow-pulse_6.5s_ease-in-out_infinite] sm:h-[320px] sm:w-[320px] lg:top-[41%] lg:h-[380px] lg:w-[380px]" />
              <div className="absolute left-1/2 top-[41%] h-[190px] w-[190px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/6 blur-[72px] sm:h-[240px] sm:w-[240px] lg:h-[270px] lg:w-[270px]" />
              <div className="pointer-events-none absolute bottom-[128px] left-1/2 h-[88px] w-[280px] -translate-x-1/2 rounded-[999px] bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.05),rgba(0,0,0,0)_72%)] blur-xl sm:w-[340px] lg:bottom-[156px] lg:h-[108px] lg:w-[420px]" />

              <button
                type="button"
                onClick={handlePrev}
                aria-label={`Show ${left.label}`}
                className="absolute left-[8%] top-[188px] z-10 hidden xl:block"
              >
                <div className="transition duration-300 hover:scale-[1.02]">
                  <div className="[animation:lp-float-side-left_7.2s_ease-in-out_infinite]">
                    <PhoneMock
                      src={left.media.src}
                      mediaType={left.media.type}
                      posterSrc={left.media.poster}
                      videoBackdropSrc={pickVideoBackdrop(left.media)}
                      alt={`${left.label} UI`}
                      widthClassName="w-[132px]"
                      glowClassName="from-transparent via-transparent to-transparent"
                      imageClassName="brightness-[0.88] saturate-[0.92]"
                      frameClassName="rounded-[30px] p-[7px] opacity-[0.82]"
                      screenClassName="rounded-[21px]"
                      bezelClassName="rounded-[29px]"
                      notchClassName="top-[5px] h-[18px] w-[35%]"
                      tiltClassName="opacity-[0.52]"
                      imagePosition={left.media.imagePosition}
                      maskScreenshotStatusBar
                    />
                  </div>
                </div>
              </button>

              <div className="absolute left-1/2 top-[116px] z-30 -translate-x-1/2 sm:top-[140px] lg:top-[86px]">
                {/* key を付けない: PhoneMock を毎回アンマウントすると動画が黒く点滅する */}
                <div className="[animation:lp-float-main_7.2s_ease-in-out_infinite]">
                  <PhoneMock
                    src={active.media.src}
                    mediaType={active.media.type}
                    posterSrc={active.media.poster}
                    videoBackdropSrc={pickVideoBackdrop(active.media)}
                    alt={`${active.label} UI`}
                    widthClassName="w-[224px] sm:w-[248px] lg:w-[246px] xl:w-[262px]"
                    glowClassName="from-cyan-400/8 via-sky-400/5 to-cyan-200/4"
                    imageClassName="brightness-[1] saturate-[1.02]"
                    priority
                    imagePosition={active.media.imagePosition}
                    maskScreenshotStatusBar
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleNext}
                aria-label={`Show ${right.label}`}
                className="absolute right-[8%] top-[196px] z-10 hidden xl:block"
              >
                <div className="transition duration-300 hover:scale-[1.02]">
                  <div className="[animation:lp-float-side-right_7.5s_ease-in-out_infinite]">
                    <PhoneMock
                      src={right.media.src}
                      mediaType={right.media.type}
                      posterSrc={right.media.poster}
                      videoBackdropSrc={pickVideoBackdrop(right.media)}
                      alt={`${right.label} UI`}
                      widthClassName="w-[132px]"
                      glowClassName="from-transparent via-transparent to-transparent"
                      imageClassName="brightness-[0.88] saturate-[0.92]"
                      frameClassName="rounded-[30px] p-[7px] opacity-[0.82]"
                      screenClassName="rounded-[21px]"
                      bezelClassName="rounded-[29px]"
                      notchClassName="top-[5px] h-[18px] w-[35%]"
                      tiltClassName="opacity-[0.52]"
                      imagePosition={right.media.imagePosition}
                      maskScreenshotStatusBar
                    />
                  </div>
                </div>
              </button>

              <div className="absolute left-[7%] top-[236px] z-10 lg:hidden">
                <div className="[animation:lp-float-mobile-left_7.2s_ease-in-out_infinite]">
                  <PhoneMock
                    src={left.media.src}
                    mediaType={left.media.type}
                    posterSrc={left.media.poster}
                    videoBackdropSrc={pickVideoBackdrop(left.media)}
                    alt={`${left.label} UI`}
                    widthClassName="w-[80px] sm:w-[96px]"
                    glowClassName="from-transparent via-transparent to-transparent"
                    imageClassName="brightness-[0.90] saturate-[0.94]"
                    frameClassName="rounded-[22px] p-[5px] opacity-[0.78]"
                    screenClassName="rounded-[15px]"
                    bezelClassName="rounded-[21px]"
                    notchClassName="top-[4px] h-[12px] w-[34%]"
                    tiltClassName="opacity-[0.48]"
                    imagePosition={left.media.imagePosition}
                    maskScreenshotStatusBar
                  />
                </div>
              </div>

              <div className="absolute right-[7%] top-[248px] z-10 lg:hidden">
                <div className="[animation:lp-float-mobile-right_7.5s_ease-in-out_infinite]">
                  <PhoneMock
                    src={right.media.src}
                    mediaType={right.media.type}
                    posterSrc={right.media.poster}
                    videoBackdropSrc={pickVideoBackdrop(right.media)}
                    alt={`${right.label} UI`}
                    widthClassName="w-[84px] sm:w-[100px]"
                    glowClassName="from-transparent via-transparent to-transparent"
                    imageClassName="brightness-[0.90] saturate-[0.94]"
                    frameClassName="rounded-[22px] p-[5px] opacity-[0.78]"
                    screenClassName="rounded-[15px]"
                    bezelClassName="rounded-[21px]"
                    notchClassName="top-[4px] h-[12px] w-[34%]"
                    tiltClassName="opacity-[0.48]"
                    imagePosition={right.media.imagePosition}
                    maskScreenshotStatusBar
                  />
                </div>
              </div>

              <div className="absolute bottom-[18px] left-1/2 z-40 w-[min(90%,470px)] -translate-x-1/2 sm:bottom-[18px] sm:w-[min(88%,470px)]">
                <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,18,28,0.56),rgba(5,14,24,0.34))] px-5 py-4 backdrop-blur-[18px] shadow-[0_18px_40px_rgba(0,0,0,0.20)] ring-1 ring-cyan-300/5">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/24 to-transparent" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.26em] text-cyan-200/58">
                        {active.label}
                      </div>
                      <div className="mt-2 max-w-[340px] text-[18px] font-black leading-[1.08] tracking-[-0.045em] text-white sm:text-[22px]">
                        {mobileTitle}
                      </div>
                    </div>

                    <div className="hidden shrink-0 rounded-full border border-cyan-300/12 bg-cyan-300/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/62 backdrop-blur-xl sm:block">
                      {active.chip}
                    </div>
                  </div>

                  <div className="relative mt-3 h-px w-full bg-gradient-to-r from-cyan-300/16 via-white/8 to-transparent" />

                  <p className="relative mt-3 max-w-[430px] text-[13px] leading-6 text-white/56 sm:text-[14px]">
                    {mobileDesc}
                  </p>

                  <div className="relative mt-4 flex items-center justify-between gap-3">
                    <div
                      className="flex items-center gap-2"
                      role="tablist"
                      aria-label="Hero views"
                    >
                      {heroMediaViews.map((view) => {
                        const isActive = view.key === activeView;
                        return (
                          <button
                            key={view.key}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-label={`Show ${view.label}`}
                            onClick={() => setActiveView(view.key)}
                            className={`h-2.5 rounded-full transition-all ${
                              isActive
                                ? "w-8 bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.36)]"
                                : "w-2.5 bg-white/18 hover:bg-white/28"
                            }`}
                          />
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePrev}
                        aria-label={`Previous ${left.label}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition hover:bg-white/[0.07]"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        aria-label={`Next ${right.label}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition hover:bg-white/[0.07]"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-10 block lg:hidden">
              <div className="mx-auto h-[180px] w-[180px] rounded-full bg-cyan-400/7 blur-3xl sm:h-[220px] sm:w-[220px]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}