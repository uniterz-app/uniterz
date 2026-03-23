import Image from "next/image";
import SignupForm from "@/app/component/auth/SignupForm";
import { signupPoints } from "./lp-data";

export default function LPSignupSection() {
  return (
    <section
      id="signup"
      className="relative mx-auto max-w-7xl px-6 pb-32 pt-16 sm:px-8 sm:pt-18 lg:px-10 lg:pb-40 lg:pt-20"
    >
      <div className="pointer-events-none absolute inset-x-6 top-0 sm:inset-x-8 lg:inset-x-10">
        <div className="mx-auto h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
        <div className="mx-auto h-24 w-[72%] max-w-4xl bg-cyan-300/8 blur-3xl" />
      </div>

      <div className="relative overflow-hidden rounded-[40px] border border-cyan-300/16 bg-[linear-gradient(135deg,rgba(34,211,238,0.10),rgba(255,255,255,0.03),rgba(16,185,129,0.08))] px-7 py-12 backdrop-blur-2xl sm:px-10 sm:py-14">
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

          <h2 className="mx-auto mt-4 max-w-3xl text-center text-3xl font-black tracking-tight text-white sm:text-5xl">
            予想を、感覚ではなく実力に変える。
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-center text-base leading-7 text-white/68">
            投稿、集計、ランキング、分析まで。Uniterzで、自分の予想力を数字で残す。
          </p>

          <div className="mx-auto mt-4 w-fit rounded-full border border-cyan-300/14 bg-cyan-300/[0.05] px-4 py-2 text-xs font-medium tracking-[0.06em] text-cyan-100/78">
            無料で始めて、予想を記録する。
          </div>

          <div className="relative mt-10 grid items-stretch gap-8 lg:grid-cols-[1.04fr_460px]">
            <div className="pointer-events-none absolute left-[50%] top-1/2 z-20 hidden h-px w-[120px] -translate-y-1/2 bg-gradient-to-r from-cyan-300/0 via-cyan-300/40 to-cyan-300/0 lg:block" />
            <div className="pointer-events-none absolute left-[55%] top-1/2 z-20 hidden h-16 w-16 -translate-y-1/2 rounded-full bg-cyan-300/10 blur-2xl lg:block" />

            <div className="relative overflow-hidden rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(7,17,34,0.84),rgba(6,16,28,0.78))] p-6 sm:p-7">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/26 to-transparent" />
              <div className="pointer-events-none absolute inset-x-[10%] top-0 h-20 rounded-full bg-cyan-300/6 blur-3xl" />
              <div className="pointer-events-none absolute inset-[1px] rounded-[29px] ring-1 ring-inset ring-white/5" />

              <div className="relative flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/72">
                  Why Join
                </div>
                <div className="h-2 w-2 rounded-full bg-cyan-200/65 shadow-[0_0_12px_rgba(103,232,249,0.55)]" />
              </div>

              <div className="relative mt-5 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/72">
                  Connected Value
                </div>

                <div className="relative mt-4">
                  <div className="pointer-events-none absolute bottom-0 left-5 top-0 w-px bg-gradient-to-b from-cyan-300/55 via-cyan-300/22 to-transparent" />

                  <div className="space-y-4">
                    {signupPoints.map((item, index) => (
                      <div
                        key={item.title}
                        className="relative pl-8"
                        style={{
                          animation: "lp-signup-fade-up .65s ease-out both",
                          animationDelay: `${index * 0.06}s`,
                        }}
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
                          <div className="relative rounded-[19px] bg-[linear-gradient(180deg,rgba(10,22,40,0.88),rgba(8,18,34,0.82))] px-4 py-3">
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
                                <div className="mt-1 text-[13px] leading-6 text-white/46">
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

              <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
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
                    Flow
                  </div>
                  <div className="mt-2 text-[20px] font-black text-white">
                    Record
                  </div>
                </div>

                <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                    Goal
                  </div>
                  <div className="mt-2 text-[20px] font-black text-white">
                    Improve
                  </div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[32px] border border-cyan-300/22 bg-[linear-gradient(180deg,rgba(103,232,249,0.12),rgba(255,255,255,0.03))] p-[1px] shadow-[0_28px_80px_rgba(0,0,0,0.28)]">
              <div className="relative flex h-full items-center justify-center rounded-[31px] bg-[linear-gradient(180deg,rgba(24,40,60,0.96),rgba(16,28,46,0.92))] p-5 backdrop-blur-xl sm:p-6">
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

                <div className="relative w-full max-w-[360px]">
                  <SignupForm variant="web" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes lp-signup-fade-up {
          0% {
            opacity: 0;
            transform: translate3d(0, 14px, 0);
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