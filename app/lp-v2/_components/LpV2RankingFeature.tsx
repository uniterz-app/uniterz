import Image from "next/image";
import LPMediaSlotVideo from "@/app/lp/_components/LPMediaSlotVideo";
import { LpFlowPodiumShell } from "@/app/lp/_components/LpFlowPodiumShell";
import { mediaSlots } from "@/app/lp/_components/lp-data";

type LpV2RankingFeatureProps = {
  mobile?: boolean;
};

const rankingSlot = mediaSlots[0]!;

/** 遊び方の下：ランキング画面素材（lp-data mediaSlots）と横並びの説明エリア */
export default function LpV2RankingFeature({
  mobile = false,
}: LpV2RankingFeatureProps) {
  return (
    <section
      className={
        mobile
          ? "relative z-10 mx-auto w-full px-3 pb-10"
          : "relative z-10 mx-auto w-full max-w-[1360px] px-6 pb-20 lg:px-10"
      }
    >
      <h2
        className={
          mobile
            ? "mb-5 text-center text-[30px] font-bold leading-tight tracking-[-0.01em] text-cyan-100"
            : "mb-8 text-[34px] font-bold leading-tight tracking-[-0.01em] text-cyan-100 sm:text-[40px]"
        }
      >
        ランキング機能
      </h2>

      <div
        className={
          mobile
            ? "grid grid-cols-1 gap-6"
            : "grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16"
        }
      >
        <div
          className={`flex justify-center overflow-visible py-6 sm:py-8 lg:py-10 ${
            mobile ? "" : "lg:sticky lg:top-24"
          }`}
        >
          <article
            className="relative mx-auto w-full max-w-[180px] origin-center rotate-[-15deg] overflow-hidden rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-px shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:max-w-[200px] lg:max-w-[190px] xl:max-w-[220px]"
          >
            <div className="relative rounded-[17px] bg-[linear-gradient(180deg,rgba(8,18,30,0.9),rgba(6,16,26,0.84))] p-2 sm:p-2.5">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-200/36 to-transparent" />
              <div className="pointer-events-none absolute inset-px rounded-[16px] ring-1 ring-inset ring-white/6" />

              <div className="flex items-center justify-between gap-1.5">
                <div className="text-[8px] font-semibold uppercase tracking-[0.12em] text-cyan-300/72 sm:text-[9px] sm:tracking-[0.16em]">
                  {rankingSlot.badge}
                </div>
                <div className="rounded-full border border-cyan-300/20 bg-cyan-300/8 px-1.5 py-0.5 text-[8px] font-semibold text-cyan-100/80 sm:text-[9px]">
                  {rankingSlot.type === "video" ? "VIDEO" : "IMAGE"}
                </div>
              </div>

              <div className="mt-1.5 text-[11px] font-black leading-tight tracking-tight text-white sm:mt-2 sm:text-xs">
                {rankingSlot.title}
              </div>

              <div className="mt-1.5 overflow-hidden rounded-lg border border-white/10 bg-black/30 sm:mt-2 sm:rounded-xl">
                {rankingSlot.enabled && rankingSlot.src ? (
                  rankingSlot.type === "video" ? (
                    <LPMediaSlotVideo
                      src={rankingSlot.src}
                      poster={rankingSlot.poster}
                      alt={rankingSlot.alt}
                    />
                  ) : (
                    <div className="relative aspect-video w-full">
                      <Image
                        src={rankingSlot.src}
                        alt={rankingSlot.alt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  )
                ) : (
                  <div className="flex min-h-32 w-full items-center justify-center bg-[linear-gradient(180deg,rgba(8,18,30,0.5),rgba(6,16,26,0.45))] px-2 text-center text-[10px] leading-snug text-white/45 sm:min-h-36 sm:text-xs sm:leading-5">
                    ランキング画面の素材をここに表示
                    <br />
                    lp-data.ts の mediaSlots でパスを設定
                  </div>
                )}
              </div>
            </div>
          </article>
        </div>

        <div
          className={
            mobile
              ? "flex flex-col gap-4 text-center"
              : "flex min-h-0 flex-col justify-center gap-0 pt-1 lg:-translate-x-12 lg:pt-4 xl:-translate-x-20 2xl:-translate-x-24"
          }
        >
          <h3
            className={
              mobile
                ? "text-center text-[22px] font-black leading-[1.08] tracking-[-0.02em] text-cyan-100"
                : "text-left text-[38px] font-black leading-[1.03] tracking-[-0.03em] text-cyan-100 sm:text-[48px] lg:text-[56px]"
            }
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            <span className="block whitespace-nowrap">
              <span className="bg-linear-to-r from-sky-200 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                総合得点
              </span>
              で、
            </span>
            <span className="block whitespace-nowrap">
              世界のユーザーと
              <span className="bg-linear-to-r from-cyan-200 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                競う
              </span>
              。
            </span>
          </h3>

          <div className={mobile ? "mt-1 w-full" : "mt-4 w-full max-w-[720px]"}>
            <LpFlowPodiumShell palette="green" className="min-h-0 w-full">
              <div
                className={
                  mobile
                    ? "px-3 py-5 sm:px-4 sm:py-6"
                    : "px-4 py-6 sm:px-6 sm:py-7"
                }
              >
                <div
                  className={
                    mobile
                      ? "flex flex-col gap-6"
                      : "grid items-center gap-8 lg:grid-cols-2 lg:gap-10"
                  }
                >
                  <div
                    className={
                      mobile
                        ? "border-b border-emerald-400/20 pb-6 text-center"
                        : "border-b border-emerald-400/20 pb-6 text-center lg:border-b-0 lg:border-r lg:border-emerald-400/20 lg:pb-0 lg:pr-8 lg:text-left"
                    }
                  >
                    <p className="text-[17px] font-bold leading-snug tabular-nums tracking-tight sm:text-[19px] lg:text-[21px]">
                      <span className="bg-linear-to-r from-emerald-50 via-teal-100 to-emerald-100 bg-clip-text text-transparent">
                        総合得点
                      </span>
                      <span className="mx-1 text-emerald-300/40 sm:mx-1.5 lg:mx-2">＝</span>
                      <span className="text-white/90">基本点</span>
                      <span className="mx-0.5 text-emerald-300/40 sm:mx-1 lg:mx-1">＋</span>
                      <span className="text-white/90">ボーナス</span>
                    </p>
                  </div>

                  <div
                    className={
                      mobile
                        ? "mx-auto w-full max-w-[360px] text-center"
                        : "text-left"
                    }
                  >
                    <p className="text-[13px] font-semibold text-emerald-100/92 sm:text-sm">
                      基本点 10点
                    </p>
                    <ul className="mt-3 divide-y divide-white/10 border-y border-white/10">
                      <li className="flex justify-between gap-4 py-2.5 text-left text-[13px] tabular-nums sm:py-3 sm:text-sm">
                        <span className="text-white/72">勝利チームを予想し</span>
                        <span className="shrink-0 font-medium text-emerald-100/95">4点</span>
                      </li>
                      <li className="flex justify-between gap-4 py-2.5 text-left text-[13px] tabular-nums sm:py-3 sm:text-sm">
                        <span className="text-white/72">得失点差の近さ</span>
                        <span className="shrink-0 font-medium text-emerald-100/95">最大4点</span>
                      </li>
                      <li className="flex justify-between gap-4 py-2.5 text-left text-[13px] tabular-nums sm:py-3 sm:text-sm">
                        <span className="text-white/72">合計得点</span>
                        <span className="shrink-0 font-medium text-emerald-100/95">最大2点</span>
                      </li>
                    </ul>
                    <p className="mt-3 text-right text-[13px] font-semibold tabular-nums text-emerald-50 sm:text-sm">
                      計 10点
                    </p>
                  </div>
                </div>
              </div>
            </LpFlowPodiumShell>

            <div
              className={
                mobile
                  ? "mx-auto mt-3 w-full max-w-[300px] space-y-2.5 text-center"
                  : "mx-auto mt-4 w-full max-w-[720px] space-y-2.5 text-left"
              }
            >
              <div>
                <p className="text-[11px] font-semibold text-emerald-200/88 sm:text-xs">
                  アップセット
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/65 sm:text-xs">
                  アンダードッグの勝利を的中させた場合、基本点に上乗せで
                  <span className="tabular-nums text-emerald-100/85"> +2点</span>。
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-emerald-200/88 sm:text-xs">
                  連勝ボーナス
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/65 sm:text-xs">
                  <span className="tabular-nums">3〜4連勝で+1点</span>、
                  <span className="tabular-nums">5〜6連勝で+2点</span>、
                  <span className="tabular-nums">7連勝以上で+3点</span>
                  （2連勝以下は0点）。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
