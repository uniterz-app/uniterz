"use client";

/**
 * /mobile/uniterz-logo-preview · /dev/uniterz-logo-preview
 * UNITERZ ウェスタン調ロゴタイポ 3案比較（形のみ）。
 */
import { useMemo, useState } from "react";
import { nameOxanium, nameRajdhani } from "@/lib/fonts";
import UniterzWesternWordmark from "@/app/component/units/UniterzWesternWordmark";
import {
  UNITERZ_WESTERN_VARIANTS,
  type UniterzWesternVariantId,
  uniterzWesternRecommendedVariant,
} from "@/lib/units/uniterzWesternGlyphs";

export default function UniterzLogoTypePreviewPage() {
  const recommended = uniterzWesternRecommendedVariant();
  const [active, setActive] = useState<UniterzWesternVariantId>(recommended);
  const meta = useMemo(
    () => UNITERZ_WESTERN_VARIANTS.find((v) => v.id === active)!,
    [active]
  );

  return (
    <main className="min-h-screen bg-[#03070b] px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-[440px]">
        <p
          className={[
            nameOxanium.className,
            "text-[10px] font-extrabold uppercase tracking-[0.22em] text-cyan-300/70",
          ].join(" ")}
        >
          Logo type preview
        </p>
        <h1
          className={[
            nameRajdhani.className,
            "mt-1 text-2xl font-bold text-white",
          ].join(" ")}
        >
          UNITERZ ロゴ文字 3案
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/45">
          参考画像は「形」だけ参照。塗りは単色。アウトライン SVG で骨格を再現しています。
        </p>

        <div className="mt-5 grid grid-cols-1 gap-2">
          {UNITERZ_WESTERN_VARIANTS.map((v) => {
            const on = v.id === active;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setActive(v.id)}
                className={[
                  "border px-3 py-3 text-left transition-colors",
                  on
                    ? "border-cyan-300/50 bg-cyan-300/10"
                    : "border-white/10 bg-white/[0.02]",
                ].join(" ")}
              >
                <span
                  className={[
                    nameOxanium.className,
                    "flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em]",
                    on ? "text-cyan-100" : "text-white/60",
                  ].join(" ")}
                >
                  {v.name}
                  {v.recommended ? (
                    <span className="rounded-sm border border-cyan-300/40 px-1.5 py-0.5 text-[9px] tracking-[0.08em] text-cyan-200/80">
                      推奨 · 参考に最も近い
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block text-[12px] text-white/40">
                  {v.note}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 border border-white/10 bg-[#05080c] px-4 py-10">
          <div className="flex justify-center">
            <UniterzWesternWordmark
              variant={active}
              width={320}
              arched
              arch={14}
              fill="#e8f7ff"
            />
          </div>
          <p className="mt-8 text-center text-[10px] uppercase tracking-[0.16em] text-white/25">
            {meta.name}
          </p>
        </div>

        <div className="mt-4 border border-white/10 bg-[#05080c] px-4 py-6">
          <p
            className={[
              nameOxanium.className,
              "text-[10px] font-bold uppercase tracking-[0.18em] text-white/35",
            ].join(" ")}
          >
            Flat baseline
          </p>
          <div className="mt-4 flex justify-center">
            <UniterzWesternWordmark
              variant={active}
              width={300}
              arched={false}
              fill="#e8f7ff"
            />
          </div>
        </div>

        <p className="mt-6 text-[11px] leading-relaxed text-white/30">
          推奨は <span className="text-white/55">A · Spur Tusks</span>
          。牙セリフ・中央スパー・角張った腕を参考骨格に寄せています。案が決まったら獲得モーダルへ反映できます。
        </p>
      </div>
    </main>
  );
}
