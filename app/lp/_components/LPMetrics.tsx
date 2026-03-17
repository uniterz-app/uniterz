import { metrics } from "./lp-data";

export default function LPMetrics() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-10">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/82">
            Original Metrics
          </div>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            実力を5つの指標で分解する
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/68">
            Uniterzの中心は、単純な的中率ではない。難しさ、自信度、再現性まで含めて予想の質を可視化する。
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((item) => (
            <div
              key={item.title}
              className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition duration-200 hover:border-cyan-300/20 hover:bg-white/[0.06]"
            >
              <div className="text-lg font-bold tracking-tight text-white">
                {item.title}
              </div>
              <p className="mt-3 text-sm leading-7 text-white/66">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}