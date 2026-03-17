import { featureCards } from "./lp-data";

export default function LPFeatures() {
  return (
    <section
      id="features"
      className="relative mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-10"
    >
      <div className="max-w-2xl">
        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/82">
          What You Can Do
        </div>
        <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
          予想から分析まで、一つで完結する
        </h2>
        <p className="mt-4 text-base leading-7 text-white/68">
          予想するだけの場ではなく、結果が記録され、比較され、分析される構造を持つ。
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {featureCards.map((item) => (
          <div
            key={item.title}
            className="group rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:bg-white/[0.06]"
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/75">
              {item.eyebrow}
            </div>
            <h3 className="mt-3 text-xl font-bold tracking-tight">
              {item.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-white/66">
              {item.text}
            </p>

            <div className="mt-5 h-1 w-0 rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 transition-all duration-300 group-hover:w-20" />
          </div>
        ))}
      </div>
    </section>
  );
}