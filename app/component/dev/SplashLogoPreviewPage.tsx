"use client";

/**
 * /mobile/splash-logo-preview · /dev/splash-logo-preview
 * サイバーロゴスプラッシュ（枠光 → 塗り）の再生プレビュー。
 */
import { useCallback, useState } from "react";
import { nameOxanium } from "@/lib/fonts";
import CyberLogoSplashScreen from "@/app/component/splash/CyberLogoSplashScreen";
import { UNITERZ_LOGO_SPLASH_TIMING } from "@/lib/units/uniterzLogoSplash";

export default function SplashLogoPreviewPage() {
  const [playKey, setPlayKey] = useState(0);

  const replay = useCallback(() => {
    setPlayKey((k) => k + 1);
  }, []);

  return (
    <main className="relative min-h-[100dvh] bg-[#03070b] text-white">
      <div className="absolute inset-0">
        <CyberLogoSplashScreen key={playKey} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8">
        <p
          className={[
            nameOxanium.className,
            "pointer-events-none text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/40",
          ].join(" ")}
        >
          Cyber logo splash · {UNITERZ_LOGO_SPLASH_TIMING.totalMs}ms
        </p>
        <button
          type="button"
          onClick={replay}
          className={[
            nameOxanium.className,
            "pointer-events-auto border border-cyan-400/50 bg-black/70 px-6 py-2.5 text-[12px] font-bold uppercase tracking-[0.18em] text-cyan-300 backdrop-blur-sm transition hover:border-cyan-300 hover:text-cyan-100",
          ].join(" ")}
        >
          再生
        </button>
      </div>
    </main>
  );
}
