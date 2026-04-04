import Image from "next/image";
import LPMediaSlotVideo from "./LPMediaSlotVideo";
import { mediaSlots } from "./lp-data";

export default function LPMediaSlots() {
  return (
    <section
      id="media-slots"
      data-lp-animate="up"
      className="lp-section-shell"
    >
      <div className="lp-section-rail">
        <div className="mx-auto h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
        <div className="mx-auto h-24 w-[70%] max-w-4xl bg-cyan-300/7 blur-3xl" />
      </div>

      <div className="relative">
        <div className="inline-flex items-center gap-3">
          <div className="h-px w-10 bg-gradient-to-r from-cyan-300/70 to-transparent" />
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/82 sm:tracking-[0.28em]">
            Ranking Proof
          </div>
        </div>

        <h2 className="lp-section-title">ランキング実績の見せ場</h2>
        <p className="lp-section-desc">
          世界ランキングの画面をここで見せる。素材差し替えは `lp-data.ts` のパス更新だけで完了する。
        </p>

        <div
          className="mt-8 flex flex-col gap-5 md:mx-auto md:mt-8 md:max-w-3xl"
          data-lp-stagger-group
          data-lp-stagger-variant="up"
          data-lp-stagger-step="0.11"
        >
          {mediaSlots.map((slot) => (
            <article
              key={slot.id}
              className="relative w-full overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-[1px]"
              data-lp-stagger-item
            >
              <div className="relative rounded-[25px] bg-[linear-gradient(180deg,rgba(8,18,30,0.9),rgba(6,16,26,0.84))] p-3.5 sm:p-4">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/36 to-transparent" />
                <div className="pointer-events-none absolute inset-[1px] rounded-[24px] ring-1 ring-inset ring-white/6" />

                <div className="flex items-center justify-between gap-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300/72 sm:tracking-[0.22em]">
                    {slot.badge}
                  </div>
                  <div className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-2.5 py-1 text-[10px] font-semibold text-cyan-100/80">
                    {slot.type === "video" ? "VIDEO" : "IMAGE"}
                  </div>
                </div>

                <div className="mt-3 text-base font-black tracking-tight text-white min-[390px]:text-lg">
                  {slot.title}
                </div>

                <div className="mt-4">
                  {slot.enabled && slot.src ? (
                    slot.type === "video" ? (
                      <LPMediaSlotVideo
                        src={slot.src}
                        poster={slot.poster}
                        alt={slot.alt}
                      />
                    ) : (
                      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                        <Image
                          src={slot.src}
                          alt={slot.alt}
                          fill
                          sizes="(max-width: 768px) 100vw, 896px"
                          className="object-cover"
                        />
                      </div>
                    )
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(8,18,30,0.5),rgba(6,16,26,0.45))] px-4 text-center text-sm leading-6 text-white/45">
                      ランキング実績素材をここに表示
                      <br />
                      lp-data.ts でパスを設定
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
