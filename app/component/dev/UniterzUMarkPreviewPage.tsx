"use client";

/**
 * /mobile/uniterz-u-mark · /dev/uniterz-u-mark
 * 確定版 UNITERZ の U を、アーチなしで直立させたマーク。
 */
import { nameOxanium, nameRajdhani } from "@/lib/fonts";
import UniterzLogo from "@/app/component/units/UniterzLogo";
import UniterzUMark from "@/app/component/units/UniterzUMark";
import { UNITERZ_LOGO_FILL_LETTERS } from "@/lib/units/uniterzLogoFillLetters";
import { UNITERZ_U_MARK_ASSET } from "@/lib/units/uniterzUMark";

const ORIGINAL_U = UNITERZ_LOGO_FILL_LETTERS.find((l) => l.id === "U")!;

function labelClass(on = false) {
  return [
    nameOxanium.className,
    "text-[10px] font-bold uppercase tracking-[0.18em]",
    on ? "text-white/55" : "text-white/35",
  ].join(" ");
}

export default function UniterzUMarkPreviewPage() {
  return (
    <main className="min-h-screen bg-[#03070b] px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-[480px]">
        <p className={labelClass(true)}>U mark</p>
        <h1
          className={[
            nameRajdhani.className,
            "mt-1 text-2xl font-bold text-white",
          ].join(" ")}
        >
          UNITERZ U（アーチなし）
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/45">
          ワードマーク左端の U を切り出し、上凸アーチを戻した直立マーク。左ステムの雷カットはそのまま。
        </p>

        <section className="mt-5 border border-white/10 bg-black px-3 py-10">
          <p
            className={[
              nameOxanium.className,
              "mb-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/70",
            ].join(" ")}
          >
            Cyber
          </p>
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${UNITERZ_U_MARK_ASSET.webCyberPngPath}?v=cyber-upright`}
              alt="UNITERZ U cyber"
              width={280}
              height={280}
              className="h-[280px] w-[280px] object-contain"
            />
          </div>
        </section>

        <section className="mt-4 border border-white/10 bg-black px-3 py-10">
          <p className={`${labelClass()} mb-4 text-center`}>Flat</p>
          <div className="flex justify-center">
            <UniterzUMark size={280} className="text-white" />
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-2">
          <div className="border border-white/10 bg-black px-3 py-5">
            <p className={labelClass()}>Arched crop</p>
            <div className="mt-4 flex h-[140px] items-center justify-center">
              <svg viewBox="-8 30 210 280" width={100} height={134} aria-hidden>
                {ORIGINAL_U.paths.map((d) => (
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
              <UniterzUMark size={132} className="text-white" />
            </div>
          </div>
        </section>

        <section className="mt-4 border border-white/10 bg-black px-4 py-6">
          <p className={labelClass()}>Sizes</p>
          <div className="mt-5 flex items-end justify-center gap-6">
            <UniterzUMark size={96} className="text-white" />
            <UniterzUMark size={48} className="text-white" />
            <UniterzUMark size={28} className="text-white" />
            <UniterzUMark size={16} className="text-white" />
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
            <UniterzUMark size={160} className="text-black" />
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
          <span className="text-white/55">
            public/brand/uniterz-u-mark-1920x1080.png
          </span>
          （今のキャンバスと同じ） /{" "}
          <span className="text-white/55">public/brand/uniterz-u-mark.svg</span>
          （スマートオブジェクト） /{" "}
          <span className="text-white/55">public/brand/uniterz-u-mark.png</span>
          （透明 2048）
          <br />
          サイバー版:{" "}
          <span className="text-white/55">
            public/brand/uniterz-u-mark-cyber-1920x1080.png
          </span>
          {" / "}
          <span className="text-white/55">
            public/brand/uniterz-u-mark-cyber.svg
          </span>
        </p>
      </div>
    </main>
  );
}
