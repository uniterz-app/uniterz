import { flowNodes } from "./lp-data";

const DISPLAY_CARDS = [
  {
    eyebrow: "STEP 01",
    title: "試合を選んで予想する",
    text: "日付ごとに試合を確認し、勝敗とスコアをそのまま入力できる。",
  },
  {
    eyebrow: "STEP 02",
    title: "予想が結果に変わる",
    text: "試合終了後、的中・得点・各種成績に自動で反映され、記録が積み上がる。",
  },
  {
    eyebrow: "STEP 03",
    title: "ランキングと分析で見返す",
    text: "順位、4指標、推移データから、自分の現在地と強み・弱みを確認できる。",
  },
] as const;

export default function LPFeatures() {
  return (
    <section
      id="features"
      data-lp-animate="left"
      className="lp-section-shell"
    >
      <div className="lp-section-rail">
        <div className="mx-auto h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-cyan-300/42 to-transparent" />
        <div className="mx-auto h-24 w-[72%] max-w-4xl bg-cyan-300/8 blur-3xl" />
      </div>

      <div className="relative grid gap-10 lg:grid-cols-[0.98fr_1.02fr] lg:items-start">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-3">
            <div className="h-px w-10 bg-gradient-to-r from-cyan-300/70 to-transparent" />
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300/82">
              How It Flows
            </div>
          </div>

          <h2 className="lp-section-title">
            予想して終わらず、記録と分析につながる。
          </h2>

          <p className="lp-section-desc">
            投稿した予想は、その場で終わらない。入力した内容が結果反映、ランキング、分析まで一連の流れでつながっていく。
          </p>

          <div className="relative mt-8 overflow-hidden rounded-[32px] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(8,18,30,0.84),rgba(6,16,26,0.76))] p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,0.10),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(16,185,129,0.08),transparent_26%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(120,220,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(120,220,255,0.18)_1px,transparent_1px)] [background-size:34px_34px]" />
            <div className="pointer-events-none absolute inset-[1px] rounded-[31px] ring-1 ring-inset ring-white/6" />

            <div className="relative">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/72">
                Connected Flow
              </div>

              <div className="relative mt-7">
                <div className="pointer-events-none absolute left-[9%] right-[9%] top-5 hidden h-px bg-gradient-to-r from-cyan-300/10 via-cyan-300/55 to-emerald-300/18 md:block" />

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {flowNodes.map((node, index) => (
                    <div
                      key={node.id}
                      className="relative"
                      style={{
                        animation: "lp-features-fade-up .65s ease-out both",
                        animationDelay: `${index * 0.08}s`,
                      }}
                    >
                      <div className="relative rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] px-3 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/28 bg-cyan-300/10 text-[11px] font-bold tracking-[0.18em] text-cyan-200">
                          {String(index + 1).padStart(2, "0")}
                        </div>

                        <div className="mt-4 text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300/72">
                          {node.label}
                        </div>

                        <div className="mt-2 text-center text-sm font-bold text-white">
                          {node.title}
                        </div>

                        <div className="mt-2 text-center text-[12px] leading-5 text-white/48">
                          {node.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <div className="h-[7px] w-[7px] rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.85)]" />
                <div className="h-px flex-1 bg-gradient-to-r from-cyan-300/55 to-transparent" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative grid gap-5">
          {DISPLAY_CARDS.map((item, index) => (
            <div
              key={item.title}
              className="group relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.025))] p-[1px] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/16 hover:shadow-[0_24px_60px_rgba(0,0,0,0.22)]"
              style={{
                animation: "lp-features-fade-up .7s ease-out both",
                animationDelay: `${index * 0.08}s`,
              }}
            >
              <div className="relative h-full rounded-[29px] bg-[linear-gradient(180deg,rgba(8,18,30,0.90),rgba(6,16,26,0.84))] p-6">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/42 to-transparent" />
                <div className="pointer-events-none absolute inset-x-[10%] top-0 h-24 rounded-full bg-cyan-300/8 blur-3xl" />
                <div className="pointer-events-none absolute inset-[1px] rounded-[28px] ring-1 ring-inset ring-white/6" />

                <div className="flex items-start justify-between gap-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/75">
                    {item.eyebrow}
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/18 bg-cyan-300/8 text-[11px] font-bold text-cyan-200">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                </div>

                <h3 className="mt-4 max-w-[16ch] text-[22px] font-black leading-[1.15] tracking-[-0.03em] text-white">
                  {item.title}
                </h3>

                <p className="mt-3 max-w-[36ch] text-sm leading-7 text-white/66">
                  {item.text}
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <div className="h-[7px] w-[7px] rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.85)]" />
                  <div className="h-px flex-1 bg-gradient-to-r from-cyan-300/55 to-transparent" />
                </div>

                <div className="mt-5 h-1 w-0 rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 transition-all duration-300 group-hover:w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes lp-features-fade-up {
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