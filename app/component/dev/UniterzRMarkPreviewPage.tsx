"use client";

/**
 * /mobile/uniterz-r-mark · /dev/uniterz-r-mark
 * 確定版 UNITERZ の R を、アーチなしで直立させたマーク。
 */
import { nameOxanium, nameRajdhani } from "@/lib/fonts";
import UniterzLogo from "@/app/component/units/UniterzLogo";
import UniterzRMark from "@/app/component/units/UniterzRMark";
import { UNITERZ_LOGO_FILL_LETTERS } from "@/lib/units/uniterzLogoFillLetters";

const ORIGINAL_R = UNITERZ_LOGO_FILL_LETTERS.find((l) => l.id === "R")!;

function labelClass(on = false) {
  return [
    nameOxanium.className,
    "text-[10px] font-bold uppercase tracking-[0.18em]",
    on ? "text-white/55" : "text-white/35",
  ].join(" ");
}

export default function UniterzRMarkPreviewPage() {
  return (
    <main className="min-h-screen bg-[#03070b] px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-[480px]">
        <p className={labelClass(true)}>R mark</p>
        <h1
          className={[
            nameRajdhani.className,
            "mt-1 text-2xl font-bold text-white",
          ].join(" ")}
        >
          UNITERZ R（アーチなし）
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/45">
          ワードマークの R を切り出し、U 側から続く上凸アーチ（天面の傾き）を戻した直立マーク。
        </p>

        <section className="mt-5 border border-white/10 bg-black px-3 py-10">
          <div className="flex justify-center">
            <UniterzRMark size={280} className="text-white" />
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-2">
          <div className="border border-white/10 bg-black px-3 py-5">
            <p className={labelClass()}>Arched crop</p>
            <div className="mt-4 flex h-[140px] items-center justify-center">
              <svg
                viewBox="840 8 250 278"
                width={120}
                height={134}
                aria-hidden
              >
                {ORIGINAL_R.paths.map((d) => (
                  <path key={d} d={d} fill="#fff" />
                ))}
              </svg>
            </div>
          </div>
          <div className="border border-cyan-300/25 bg-black px-3 py-5">
            <p
              className={[
                nameOxanium.className,
                "text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/80",
              ].join(" ")}
            >
              Upright
            </p>
            <div className="mt-4 flex h-[140px] items-center justify-center">
              <UniterzRMark size={132} className="text-white" />
            </div>
          </div>
        </section>

        <section className="mt-4 border border-white/10 bg-black px-4 py-6">
          <p className={labelClass()}>Sizes</p>
          <div className="mt-5 flex items-end justify-center gap-6">
            <UniterzRMark size={96} className="text-white" />
            <UniterzRMark size={48} className="text-white" />
            <UniterzRMark size={28} className="text-white" />
            <UniterzRMark size={16} className="text-white" />
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
            <UniterzRMark size={160} className="text-black" />
          </div>
        </section>

        <section className="mt-4 border border-white/10 bg-black px-4 py-6">
          <p className={labelClass()}>Wordmark family</p>
          <div className="mt-4">
            <UniterzLogo width="100%" />
          </div>
        </section>

        <p className="mt-6 text-[11px] leading-relaxed text-white/30">
          Photoshop 用:{" "}
          <span className="text-white/55">public/brand/uniterz-r-mark.png</span>
          （透明 2048） /{" "}
          <span className="text-white/55">
            public/brand/uniterz-r-mark-black.png
          </span>
          （黒地） /{" "}
          <span className="text-white/55">public/brand/uniterz-r-mark.svg</span>
        </p>
      </div>
    </main>
  );
}
