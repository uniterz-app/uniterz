"use client";

/**
 * /mobile/splash-logo-preview · /dev/splash-logo-preview
 * スプラッシュ案の置き場。例は未配置 — ここに差し込む。
 */
import { nameOxanium } from "@/lib/fonts";

export default function SplashLogoPreviewPage() {
  return (
    <main className="relative min-h-[100dvh] bg-[#03070b] text-white">
      {/* スプラッシュ本体のマウント位置 */}
      <div className="absolute inset-0" aria-hidden />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-2.5 px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8">
        <p
          className={[
            nameOxanium.className,
            "text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/40",
          ].join(" ")}
        >
          Splash preview
        </p>
        <p className="max-w-[22rem] text-center text-[12px] leading-snug text-white/45">
          案の置き場。スプラッシュ例はまだありません。
        </p>
      </div>
    </main>
  );
}
