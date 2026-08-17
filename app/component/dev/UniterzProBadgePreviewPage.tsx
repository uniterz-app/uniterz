"use client";

/**
 * /mobile/uniterz-pro-badge · /dev/uniterz-pro-badge
 * UNITERZ ロゴ家系の PRO バッジ。課金ユーザーの名前横に付く。
 */
import { nameOxanium, nameRajdhani } from "@/lib/fonts";
import UniterzLogo from "@/app/component/units/UniterzLogo";
import UniterzProBadge from "@/app/component/units/UniterzProBadge";
import UniterzRMark from "@/app/component/units/UniterzRMark";
import UniterzUMark from "@/app/component/units/UniterzUMark";
import { ProCyberBadge } from "@/app/component/common/ProCyberBadge";

function labelClass(on = false) {
  return [
    nameOxanium.className,
    "text-[10px] font-bold uppercase tracking-[0.18em]",
    on ? "text-white/55" : "text-white/35",
  ].join(" ");
}

export default function UniterzProBadgePreviewPage() {
  return (
    <main className="min-h-screen bg-[#03070b] px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-[480px]">
        <p className={labelClass(true)}>PRO badge</p>
        <h1
          className={[
            nameRajdhani.className,
            "mt-1 text-2xl font-bold text-white",
          ].join(" ")}
        >
          UNITERZ PRO
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/45">
          選んだ生成画像。金は今のバッジ色。プロフィール・ランキングの本番バッジに差し替え済み。
        </p>

        <section className="mt-5 border border-white/10 bg-black px-3 py-10">
          <p className={`${labelClass()} mb-4 text-center`}>Gold（今のバッジ色）</p>
          <div className="flex justify-center">
            <UniterzProBadge height={88} tone="gold" />
          </div>
        </section>

        <section className="mt-4 border border-white/10 bg-black px-3 py-10">
          <p className={`${labelClass()} mb-4 text-center`}>White（前の案）</p>
          <div className="flex justify-center">
            <UniterzProBadge height={88} className="text-white" />
          </div>
        </section>

        <section className="mt-4 border border-white/10 bg-black px-3 py-6">
          <p className={`${labelClass()} mb-3 text-center`}>選んだ生成画像</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/dev/uniterz-pro-badge-tag-ref.png"
            alt="選んだ PRO タグ案"
            className="mx-auto h-auto w-full max-w-[280px] object-contain"
          />
        </section>

        <section className="mt-4 border border-white/10 bg-black px-4 py-6">
          <p className={labelClass()}>Wordmark family</p>
          <div className="mt-4">
            <UniterzLogo width="100%" />
          </div>
          <div className="mt-5 flex items-end justify-center gap-6">
            <UniterzUMark size={48} className="text-white" />
            <UniterzRMark size={48} className="text-white" />
            <UniterzProBadge height={24} tone="gold" />
          </div>
        </section>

        <section className="mt-4 border border-white/10 bg-black px-4 py-6">
          <p className={labelClass()}>Sizes</p>
          <div className="mt-5 flex items-end justify-center gap-6">
            <UniterzProBadge height={48} tone="gold" />
            <UniterzProBadge height={28} tone="gold" />
            <UniterzProBadge height={18} tone="gold" />
            <UniterzProBadge height={14} tone="gold" />
          </div>
        </section>

        <section className="mt-4 border border-white/10 bg-black px-4 py-6">
          <p className={labelClass()}>On a name（案）</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className={[
                nameOxanium.className,
                "text-[22px] font-bold italic tracking-tight text-white",
              ].join(" ")}
            >
              KAMIYA
            </span>
            <UniterzProBadge height={22} tone="gold" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className={[
                nameOxanium.className,
                "text-[14px] font-bold italic tracking-tight text-white/90",
              ].join(" ")}
            >
              ranking row
            </span>
            <UniterzProBadge height={16} tone="gold" />
          </div>
          <p className={`${labelClass()} mt-5`}>Now（本番）</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={[
                nameOxanium.className,
                "text-[22px] font-bold italic tracking-tight text-white",
              ].join(" ")}
            >
              KAMIYA
            </span>
            <ProCyberBadge premium ariaLabel="PRO" />
          </div>
        </section>

        <section className="mt-4 border border-white/10 bg-[#e8e8e8] px-4 py-6">
          <p
            className={[
              nameOxanium.className,
              "text-[10px] font-bold uppercase tracking-[0.18em] text-black/40",
            ].join(" ")}
          >
            On light
          </p>
          <div className="mt-4 flex justify-center">
            <UniterzProBadge height={56} tone="gold" />
          </div>
        </section>

        <p className="mt-6 text-[11px] leading-relaxed text-white/30">
          本番の ProCyberBadge はこれを出す。
          <br />
          Photoshop 用:{" "}
          <span className="text-white/55">public/brand/uniterz-pro-badge.png</span>
          （透明） /{" "}
          <span className="text-white/55">
            public/brand/uniterz-pro-badge-black.png
          </span>
          （黒地）
        </p>
      </div>
    </main>
  );
}
