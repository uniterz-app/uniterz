import Image from "next/image";
import ConnectedFlowCards from "./ConnectedFlowCards";
import { flowNodes, predictionFlowDemo } from "./lp-data";
import PredictionFlowVideo from "./PredictionFlowVideo";

export default function LPFeatures() {
  return (
    <section
      id="features"
      data-lp-animate="left"
      className="lp-section-shell -mt-14 [--lp-section-gap-top:2.5rem] max-[430px]:-mt-10 sm:-mt-16 sm:[--lp-section-gap-top:3rem] lg:-mt-20 lg:[--lp-section-gap-top:3.5rem]"
    >
      <div className="relative">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-3">
            <div className="h-px w-10 bg-linear-to-r from-cyan-300/70 to-transparent" />
            <div className="text-[11px] font-semibold tracking-[0.12em] text-cyan-300/82 sm:tracking-[0.2em]">
              かんたんな流れ
            </div>
          </div>

          <h2 className="lp-section-title">
            試合を選んで、かんたんに投稿。
          </h2>

          <p className="lp-section-desc">
            日付から試合を選び、勝敗とスコアを入力するだけ。左の5ステップと右の動画で、投稿からランキング反映までの流れが一目で分かる。
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <div className="relative overflow-hidden rounded-[32px] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(8,18,30,0.84),rgba(6,16,26,0.76))] p-4 sm:p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,0.10),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(16,185,129,0.08),transparent_26%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(120,220,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(120,220,255,0.18)_1px,transparent_1px)] bg-size-[34px_34px] opacity-[0.08]" />
            <div className="pointer-events-none absolute inset-px rounded-[31px] ring-1 ring-inset ring-white/6" />

            <div className="relative">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300/72 sm:tracking-[0.24em]">
                Connected Flow
              </div>

              <div className="mt-4 lg:mt-5">
                <p className="mb-3 flex items-center gap-2 text-[11px] font-medium text-cyan-200/76 lg:hidden">
                  <span className="inline-block h-1 w-8 rounded-full bg-linear-to-r from-cyan-300/70 to-transparent" />
                  カードを横にスワイプ
                </p>
                <ConnectedFlowCards nodes={flowNodes} />
              </div>
            </div>
          </div>

          <div
            className="relative overflow-hidden rounded-[32px] border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-px"
            data-lp-stagger-group
            data-lp-stagger-variant="up"
            data-lp-stagger-step="0.13"
          >
            <div className="relative h-full rounded-[31px] bg-[linear-gradient(180deg,rgba(8,18,30,0.92),rgba(6,16,26,0.86))] p-4 sm:p-6">
              <div className="pointer-events-none absolute inset-px rounded-[30px] ring-1 ring-inset ring-white/6" />

              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300/75 sm:tracking-[0.24em]">
                  Ranking Flow Movie
                </div>
                <div className="rounded-full border border-cyan-300/20 bg-cyan-300/8 px-3 py-1 text-[10px] font-semibold text-cyan-100/80">
                  ランキング反映
                </div>
              </div>

              <div className="relative mt-4 overflow-hidden rounded-2xl border border-cyan-400/18 bg-black shadow-[0_0_48px_-8px_rgba(34,211,238,0.22)]">
                <div className="pointer-events-none absolute -inset-px rounded-2xl bg-linear-to-br from-cyan-400/20 via-transparent to-emerald-400/10 opacity-50 blur-sm" />
                <div className="relative overflow-hidden rounded-2xl">
                  {predictionFlowDemo.enabled && predictionFlowDemo.src ? (
                    predictionFlowDemo.type === "video" ? (
                      <PredictionFlowVideo
                        src={predictionFlowDemo.src}
                        poster={predictionFlowDemo.poster}
                        alt={predictionFlowDemo.alt}
                        cacheKey={predictionFlowDemo.cacheKey}
                      />
                    ) : (
                      <div className="relative aspect-video w-full overflow-hidden bg-neutral-950">
                        <Image
                          src={predictionFlowDemo.src}
                          alt={predictionFlowDemo.alt}
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="object-cover object-center"
                        />
                      </div>
                    )
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center bg-black/60 px-6 text-center text-[13px] leading-6 text-white/38">
                      フロー動画未設定
                      <br />
                      <span className="text-[11px] text-white/28">
                        lp-data.ts の predictionFlowDemo
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ステップは1行のミニマルタイムライン（全部並べすぎない） */}
              <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
                <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400/45">
                  Flow
                </span>
                <div className="flex min-w-0 flex-1 items-center gap-x-1.5 gap-y-1 pl-1 text-[10px] font-semibold tracking-tight text-white/55 sm:gap-x-2 sm:pl-2 sm:text-[11px]">
                  {predictionFlowDemo.steps.map((step, index) => (
                    <span key={step} className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                      {index > 0 ? (
                        <span className="text-cyan-300/25 select-none" aria-hidden>
                          ·
                        </span>
                      ) : null}
                      <span className="whitespace-nowrap text-cyan-100/72">{step}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}