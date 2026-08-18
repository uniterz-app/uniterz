"use client";

/**
 * /mobile/uniterz-logo-flat · /dev/uniterz-logo-flat
 * アーチ・ワードマークを水平ベースラインに戻した版。
 */
import { nameOxanium, nameRajdhani } from "@/lib/fonts";
import UniterzLogo from "@/app/component/units/UniterzLogo";
import UniterzLogoFlat from "@/app/component/units/UniterzLogoFlat";
import { UNITERZ_LOGO_FLAT_ASSET } from "@/lib/units/uniterzLogoFlat";

function labelClass(on = false) {
  return [
    nameOxanium.className,
    "text-[10px] font-bold uppercase tracking-[0.18em]",
    on ? "text-white/55" : "text-white/35",
  ].join(" ");
}

export default function UniterzLogoFlatPreviewPage() {
  return (
    <main className="min-h-screen bg-[#03070b] px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-[480px]">
        <p className={labelClass(true)}>Wordmark flat</p>
        <h1
          className={[
            nameRajdhani.className,
            "mt-1 text-2xl font-bold text-white",
          ].join(" ")}
        >
          UNITERZ（アーチなし）
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/45">
          確定版アーチロゴを、文字ごとに天面の傾きだけ戻して水平に並べた版。辺は原稿の直線のまま。
        </p>

        <section className="mt-5 border border-cyan-300/25 bg-black px-3 py-10">
          <p
            className={[
              nameOxanium.className,
              "mb-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/70",
            ].join(" ")}
          >
            Flat
          </p>
          <UniterzLogoFlat width="100%" className="text-white" />
        </section>

        <section className="mt-4 border border-white/10 bg-black px-3 py-10">
          <p className={`${labelClass()} mb-4 text-center`}>Arched</p>
          <UniterzLogo width="100%" />
        </section>

        <section className="mt-4 grid grid-cols-2 gap-2">
          <div className="border border-white/10 bg-black px-3 py-5">
            <p className={labelClass()}>Arched</p>
            <div className="mt-4">
              <UniterzLogo width="100%" />
            </div>
          </div>
          <div className="border border-cyan-300/25 bg-black px-3 py-5">
            <p
              className={[
                nameOxanium.className,
                "text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/80",
              ].join(" ")}
            >
              Flat
            </p>
            <div className="mt-4">
              <UniterzLogoFlat width="100%" className="text-white" />
            </div>
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
          <div className="mt-4">
            <UniterzLogoFlat width="100%" className="text-black" />
          </div>
        </section>

        <p className="mt-6 text-[11px] leading-relaxed text-white/30">
          SVG:{" "}
          <span className="text-white/55">
            {UNITERZ_LOGO_FLAT_ASSET.webSvgPath}
          </span>
          <br />
          PNG:{" "}
          <span className="text-white/55">
            {UNITERZ_LOGO_FLAT_ASSET.webPngPath}
          </span>
          {" / "}
          <span className="text-white/55">
            {UNITERZ_LOGO_FLAT_ASSET.webPngBlackPath}
          </span>
        </p>
      </div>
    </main>
  );
}
