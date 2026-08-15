"use client";

/**
 * /mobile/splash-logo-preview · /dev/splash-logo-preview
 * スプラッシュ演出は一旦オフ。
 */
import { nameOxanium } from "@/lib/fonts";

export default function SplashLogoPreviewPage() {
  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-[#090c15] px-6 text-white">
      <p
        className={[
          nameOxanium.className,
          "text-center text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/70",
        ].join(" ")}
      >
        Splash Preview
      </p>
      <p
        className={[
          nameOxanium.className,
          "mt-2 text-center text-sm font-bold text-white/70",
        ].join(" ")}
      >
        スプラッシュ演出はオフです
      </p>
    </main>
  );
}
