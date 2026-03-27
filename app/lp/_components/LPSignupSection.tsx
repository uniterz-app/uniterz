import Image from "next/image";
import SignupForm from "@/app/component/auth/SignupForm";
import { signupPoints } from "./lp-data";

const FOCUS_POINTS = signupPoints.slice(0, 3);

export default function LPSignupSection() {
  return (
    <section
      id="signup"
      data-lp-animate="up"
      className="lp-section-shell pb-14 lg:pb-16"
    >
      <div className="lp-section-rail">
        <div className="mx-auto h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
        <div className="mx-auto h-24 w-[72%] max-w-4xl bg-cyan-300/8 blur-3xl" />
      </div>

      <div className="relative overflow-hidden rounded-[40px] border border-cyan-300/16 bg-[linear-gradient(135deg,rgba(34,211,238,0.10),rgba(255,255,255,0.03),rgba(16,185,129,0.08))] px-6 py-8 backdrop-blur-2xl sm:px-8 sm:py-10 lg:px-10 lg:py-10">
        <div className="pointer-events-none absolute right-[-120px] top-[38%] z-[1] hidden h-[320px] w-[320px] rounded-full bg-cyan-300/14 blur-3xl lg:block" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/42 to-transparent" />
        <div className="pointer-events-none absolute inset-x-[10%] top-0 h-28 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 right-[8%] h-32 w-40 rounded-full bg-emerald-300/8 blur-3xl" />
        <div className="pointer-events-none absolute left-[6%] top-[24%] h-40 w-40 rounded-full bg-cyan-300/6 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(120,220,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(120,220,255,0.18)_1px,transparent_1px)] [background-size:34px_34px]" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
            <div className="relative h-6 w-6 shrink-0">
              <Image
                src="/logo/logo.png"
                alt="Uniterz icon"
                fill
                className="object-contain"
              />
            </div>
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/82">
              Create Account
            </div>
          </div>

          <h2 className="mx-auto mt-3 max-w-3xl text-center text-3xl font-black tracking-tight text-white sm:text-[44px]">
            ここから、予想を実力として積み上げる。
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-6 text-white/68 sm:text-base sm:leading-7">
            無料で始めて、投稿から分析までをひと続きで記録。最後に登録して、今すぐ始めよう。
          </p>

          <div className="mx-auto mt-4 w-fit rounded-full border border-cyan-300/14 bg-cyan-300/[0.05] px-4 py-2 text-xs font-medium tracking-[0.06em] text-cyan-100/78">
            無料で始めて、予想を記録する。
          </div>

          <div className="relative mt-7 grid items-stretch gap-5 lg:grid-cols-[1.02fr_410px]">
            <div className="pointer-events-none absolute left-[50%] top-1/2 z-20 hidden h-px w-[120px] -translate-y-1/2 bg-gradient-to-r from-cyan-300/0 via-cyan-300/40 to-cyan-300/0 lg:block" />
            <div className="pointer-events-none absolute left-[55%] top-1/2 z-20 hidden h-16 w-16 -translate-y-1/2 rounded-full bg-cyan-300/10 blur-2xl lg:block" />

            <div className="relative overflow-hidden rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(7,17,34,0.84),rgba(6,16,28,0.78))] p-5 sm:p-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/26 to-transparent" />
              <div className="pointer-events-none absolute inset-x-[10%] top-0 h-20 rounded-full bg-cyan-300/6 blur-3xl" />
              <div className="pointer-events-none absolute inset-[1px] rounded-[29px] ring-1 ring-inset ring-white/5" />

              <div className="relative flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/72">
                  Why Join
                </div>
                <div className="h-2 w-2 rounded-full bg-cyan-200/65 shadow-[0_0_12px_rgba(103,232,249,0.55)]" />
              </div>

              <div className="relative mt-4 rounded-[24px] border border-white/8 bg-white/[0.03] p-3.5 sm:p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/72">
                  Connected Value
                </div>

                <div className="relative mt-3">
                  <div className="pointer-events-none absolute bottom-0 left-5 top-0 w-px bg-gradient-to-b from-cyan-300/55 via-cyan-300/22 to-transparent" />

                  <div
                    className="space-y-3"
                    data-lp-stagger-group
                    data-lp-stagger-variant="up"
                    data-lp-stagger-step="0.08"
                  >
                    {FOCUS_POINTS.map((item, index) => (
                      <div
                        key={item.title}
                        className="relative pl-7"
                        data-lp-stagger-item
                      >
                        <div className="absolute left-[14px] top-[8px] h-3 w-3 -translate-x-1/2 rounded-full border border-cyan-300/30 bg-[rgba(8,18,30,0.92)]" />
                        <div
                          className={`absolute left-[14px] top-[8px] h-1.5 w-1.5 -translate-x-1/2 translate-y-[3px] rounded-full ${
                            index === 0
                              ? "bg-cyan-200 shadow-[0_0_12px_rgba(103,232,249,0.82)]"
                              : "bg-cyan-200/80 shadow-[0_0_8px_rgba(103,232,249,0.55)]"
                          }`}
                        />

                        <div
                          className={`group relative overflow-hidden rounded-[20px] border p-[1px] transition duration-300 ${
                            index === 0
                              ? "border-cyan-300/18 bg-[linear-gradient(180deg,rgba(34,211,238,0.08),rgba(255,255,255,0.02))]"
                              : "border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]"
                          }`}
                        >
                          <div className="relative rounded-[19px] bg-[linear-gradient(180deg,rgba(10,22,40,0.88),rgba(8,18,34,0.82))] px-4 py-2.5">
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/22 to-transparent" />
                            <div
                              className={`pointer-events-none absolute left-0 top-0 h-full w-[3px] rounded-l-[19px] bg-gradient-to-b from-cyan-300 via-sky-400 to-emerald-300 ${
                                index === 0 ? "opacity-90" : "opacity-55"
                              }`}
                            />
                            <div className="pointer-events-none absolute left-4 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-cyan-300/6 blur-2xl transition duration-300 group-hover:bg-cyan-300/10" />

                            <div className="relative flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div
                                  className={`text-sm ${
                                    index === 0
                                      ? "font-semibold text-white/92"
                                      : "font-medium text-white/84"
                                  }`}
                                >
                                  {item.title}
                                </div>
                                <div className="mt-1 text-[12px] leading-5 text-white/46">
                                  {item.sub}
                                </div>
                              </div>

                              <div className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">
                                {String(index + 1).padStart(2, "0")}
                              </div>
                            </div>

                            <div className="relative mt-3 flex items-center gap-3">
                              <div className="h-[6px] w-[6px] rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.75)]" />
                              <div className="h-px flex-1 bg-gradient-to-r from-cyan-300/40 to-transparent" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div
                className="relative mt-4 hidden gap-3 xl:grid xl:grid-cols-3"
                data-lp-stagger-group
                data-lp-stagger-variant="up"
                data-lp-stagger-step="0.08"
              >
                <div
                  className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4"
                  data-lp-stagger-item
                >
                  <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                    Start
                  </div>
                  <div className="mt-2 text-[20px] font-black text-white">
                    Free
                  </div>
                </div>

                <div
                  className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4"
                  data-lp-stagger-item
                >
                  <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                    Flow
                  </div>
                  <div className="mt-2 text-[20px] font-black text-white">
                    Record
                  </div>
                </div>

                <div
                  className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4"
                  data-lp-stagger-item
                >
                  <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                    Goal
                  </div>
                  <div className="mt-2 text-[20px] font-black text-white">
                    Improve
                  </div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[32px] border border-cyan-300/28 bg-[linear-gradient(180deg,rgba(103,232,249,0.16),rgba(255,255,255,0.04))] p-[1px] shadow-[0_34px_90px_rgba(0,0,0,0.34)]">
              <div className="pointer-events-none absolute inset-0 rounded-[32px] [animation:lp-signup-cta-pulse_2.8s_ease-in-out_infinite]" />
              <div className="pointer-events-none absolute -inset-x-8 top-0 h-20 bg-[linear-gradient(180deg,rgba(186,230,253,0.18),transparent)] blur-2xl" />
              <div className="relative flex h-full items-center justify-center rounded-[31px] bg-[linear-gradient(180deg,rgba(24,40,60,0.96),rgba(16,28,46,0.92))] p-4 backdrop-blur-xl sm:p-5">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/48 to-transparent" />
                <div className="pointer-events-none absolute inset-x-[12%] top-0 h-28 rounded-full bg-cyan-300/14 blur-3xl" />
                <div className="pointer-events-none absolute inset-[1px] rounded-[30px] ring-1 ring-inset ring-cyan-200/10" />
                <div className="pointer-events-none absolute -right-10 top-[22%] h-36 w-36 rounded-full bg-cyan-300/12 blur-3xl" />
                <div className="pointer-events-none absolute -left-6 bottom-[16%] h-24 w-24 rounded-full bg-emerald-300/8 blur-3xl" />

                <div className="pointer-events-none absolute left-5 top-5 rounded-full border border-cyan-300/16 bg-cyan-300/[0.07] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/78">
                  Start Free
                </div>

                <div className="pointer-events-none absolute right-5 top-5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/66">
                  Account
                </div>
                <div className="pointer-events-none absolute bottom-5 left-5 rounded-full border border-emerald-300/24 bg-emerald-300/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100/82">
                  今すぐ無料登録
                </div>

                <div
                  className="pointer-events-none absolute bottom-5 right-5 rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100/82"
                >
                  最短30秒
                </div>

                <div className="relative w-full max-w-[360px] [filter:drop-shadow(0_14px_28px_rgba(34,211,238,0.12))]">
                  <SignupForm variant="web" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes lp-signup-cta-pulse {
          0%,
          100% {
            box-shadow: inset 0 0 0 1px rgba(103, 232, 249, 0.24),
              0 0 0 0 rgba(34, 211, 238, 0);
          }
          50% {
            box-shadow: inset 0 0 0 1px rgba(186, 230, 253, 0.42),
              0 0 0 10px rgba(34, 211, 238, 0.08);
          }
        }
      `}</style>

    </section>
  );
}