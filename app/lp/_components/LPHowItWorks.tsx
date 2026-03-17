import { steps } from "./lp-data";

export default function LPHowItWorks() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-10">
      <div className="rounded-[36px] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-2xl sm:p-10">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/82">
            How It Works
          </div>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            使い方はシンプル
          </h2>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.no}
              className="rounded-[28px] border border-white/10 bg-[#071122]/80 p-6 transition duration-200 hover:-translate-y-1"
            >
              <div className="text-sm font-black tracking-[0.24em] text-cyan-300/78">
                {step.no}
              </div>
              <div className="mt-4 text-xl font-bold tracking-tight">
                {step.title}
              </div>
              <p className="mt-3 text-sm leading-7 text-white/66">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}