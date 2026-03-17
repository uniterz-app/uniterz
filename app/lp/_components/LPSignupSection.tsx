import Image from "next/image";
import SignupForm from "@/app/component/auth/SignupForm";

export default function LPSignupSection() {
  return (
    <section
      id="signup"
      className="relative mx-auto max-w-7xl px-6 pb-32 pt-12 sm:px-8 lg:px-10 lg:pb-40"
    >
      <div className="rounded-[40px] border border-cyan-300/16 bg-gradient-to-br from-cyan-400/[0.08] via-white/[0.03] to-emerald-300/[0.08] px-7 py-12 backdrop-blur-2xl sm:px-10 sm:py-14">
        <div className="mx-auto max-w-6xl">
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

          <h2 className="mx-auto mt-4 max-w-3xl text-center text-3xl font-black tracking-tight sm:text-5xl">
            予想を、感覚ではなく実力に変える。
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-center text-base leading-7 text-white/68">
            投稿、集計、ランキング、分析まで。Uniterzで、自分の予想力を数字で残す。
          </p>

          <div className="mt-10 grid items-stretch gap-8 lg:grid-cols-[1fr_420px]">
            <div className="rounded-[28px] border border-white/10 bg-[#071122]/80 p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/78">
                Why Join
              </div>

              <div className="mt-5 space-y-4">
                {[
                  "試合予想を投稿できる",
                  "結果が自動で集計される",
                  "ランキングで現在地が見える",
                  "5指標で予想の質を分析できる",
                  "プレーオフブラケットにも参加できる",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/74"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
              <div className="w-full max-w-[360px]">
                <SignupForm variant="web" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}