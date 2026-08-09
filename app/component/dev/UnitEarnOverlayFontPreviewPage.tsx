"use client";

/**
 * /mobile/unit-earn-font-preview · /dev/unit-earn-font-preview
 * Unit 獲得オーバーレイのフォント案プレビュー。
 */
import { useState } from "react";
import {
  Audiowide,
  Chakra_Petch,
  Electrolize,
  Exo_2,
  Orbitron,
  Quantico,
  Russo_One,
  Share_Tech_Mono,
} from "next/font/google";
import {
  alfa,
  jp,
  matchScoreClass,
  nameBebas,
  nameMichroma,
  nameMplus,
  nameOxanium,
  nameRajdhani,
  nameSpace,
  nameZen,
} from "@/lib/fonts";
import {
  UNIT_EARN_OVERLAY_FONT_SAMPLE,
  UNIT_EARN_OVERLAY_FONT_VARIANTS,
  type UnitEarnOverlayFontId,
} from "@/lib/units/unitEarnOverlayFontPreview";
import { formatUnitEarnRankOrdinal } from "@/lib/units/formatUnitEarnRank";

/** 角張り系 — プレビュー専用ロード */
const previewOrbitron = Orbitron({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});
const previewAudiowide = Audiowide({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});
const previewChakra = Chakra_Petch({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});
const previewExo2 = Exo_2({
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});
const previewQuantico = Quantico({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});
const previewElectrolize = Electrolize({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});
const previewShareTech = Share_Tech_Mono({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});
const previewRusso = Russo_One({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

type FontPair = {
  title: string;
  sub: string;
  rank: string;
  amount: string;
  claim: string;
  amountTracking?: string;
  rankTracking?: string;
  claimTracking?: string;
};

function fontPair(id: UnitEarnOverlayFontId): FontPair {
  const notoTitle = jp.className;
  const notoSub = jp.className;
  const zenTitle = nameZen.className;
  const mplusTitle = nameMplus.className;

  switch (id) {
    case "noto-michroma":
      return {
        title: notoTitle,
        sub: notoSub,
        rank: nameMichroma.className,
        amount: nameMichroma.className,
        claim: nameMichroma.className,
        amountTracking: "tracking-[0.02em]",
        claimTracking: "tracking-[0.16em]",
      };
    case "noto-orbitron":
      return {
        title: notoTitle,
        sub: notoSub,
        rank: previewOrbitron.className,
        amount: previewOrbitron.className,
        claim: previewOrbitron.className,
        amountTracking: "tracking-[0.04em]",
        rankTracking: "tracking-[0.06em]",
        claimTracking: "tracking-[0.2em]",
      };
    case "noto-audiowide":
      return {
        title: notoTitle,
        sub: notoSub,
        rank: previewAudiowide.className,
        amount: previewAudiowide.className,
        claim: previewAudiowide.className,
        amountTracking: "tracking-[0.02em]",
        claimTracking: "tracking-[0.14em]",
      };
    case "noto-chakra":
      return {
        title: notoTitle,
        sub: notoSub,
        rank: previewChakra.className,
        amount: previewChakra.className,
        claim: previewChakra.className,
      };
    case "noto-exo2":
      return {
        title: notoTitle,
        sub: notoSub,
        rank: previewExo2.className,
        amount: previewExo2.className,
        claim: previewExo2.className,
      };
    case "noto-quantico":
      return {
        title: notoTitle,
        sub: notoSub,
        rank: previewQuantico.className,
        amount: previewQuantico.className,
        claim: previewQuantico.className,
        amountTracking: "tracking-[0.03em]",
        claimTracking: "tracking-[0.16em]",
      };
    case "noto-electrolize":
      return {
        title: notoTitle,
        sub: notoSub,
        rank: previewElectrolize.className,
        amount: previewElectrolize.className,
        claim: previewElectrolize.className,
        amountTracking: "tracking-[0.06em]",
        rankTracking: "tracking-[0.08em]",
        claimTracking: "tracking-[0.2em]",
      };
    case "noto-sharetech":
      return {
        title: notoTitle,
        sub: notoSub,
        rank: previewShareTech.className,
        amount: previewShareTech.className,
        claim: previewShareTech.className,
        amountTracking: "tracking-[0.02em]",
        claimTracking: "tracking-[0.12em]",
      };
    case "noto-russo":
      return {
        title: notoTitle,
        sub: notoSub,
        rank: previewRusso.className,
        amount: previewRusso.className,
        claim: previewRusso.className,
      };
    case "zen-orbitron":
      return {
        title: zenTitle,
        sub: zenTitle,
        rank: previewOrbitron.className,
        amount: previewOrbitron.className,
        claim: previewOrbitron.className,
        amountTracking: "tracking-[0.04em]",
        rankTracking: "tracking-[0.06em]",
        claimTracking: "tracking-[0.2em]",
      };
    case "current":
      return {
        title: notoTitle,
        sub: notoSub,
        rank: nameOxanium.className,
        amount: nameOxanium.className,
        claim: nameOxanium.className,
      };
    case "noto-rajdhani":
      return {
        title: notoTitle,
        sub: notoSub,
        rank: nameRajdhani.className,
        amount: nameRajdhani.className,
        claim: nameRajdhani.className,
      };
    case "noto-bebas":
      return {
        title: notoTitle,
        sub: notoSub,
        rank: nameBebas.className,
        amount: nameBebas.className,
        claim: nameBebas.className,
        amountTracking: "tracking-[0.04em]",
        rankTracking: "tracking-[0.06em]",
        claimTracking: "tracking-[0.22em]",
      };
    case "noto-alfa":
      return {
        title: notoTitle,
        sub: notoSub,
        rank: alfa.className,
        amount: alfa.className,
        claim: alfa.className,
      };
    case "noto-montserrat":
      return {
        title: notoTitle,
        sub: notoSub,
        rank: matchScoreClass,
        amount: matchScoreClass,
        claim: matchScoreClass,
      };
    case "noto-space":
      return {
        title: notoTitle,
        sub: notoSub,
        rank: nameSpace.className,
        amount: nameSpace.className,
        claim: nameSpace.className,
      };
    case "zen-oxanium":
      return {
        title: zenTitle,
        sub: zenTitle,
        rank: nameOxanium.className,
        amount: nameOxanium.className,
        claim: nameOxanium.className,
      };
    case "zen-bebas":
      return {
        title: zenTitle,
        sub: zenTitle,
        rank: nameBebas.className,
        amount: nameBebas.className,
        claim: nameBebas.className,
        amountTracking: "tracking-[0.04em]",
        rankTracking: "tracking-[0.06em]",
        claimTracking: "tracking-[0.22em]",
      };
    case "zen-alfa":
      return {
        title: zenTitle,
        sub: zenTitle,
        rank: alfa.className,
        amount: alfa.className,
        claim: alfa.className,
      };
    case "mplus-oxanium":
      return {
        title: mplusTitle,
        sub: mplusTitle,
        rank: nameOxanium.className,
        amount: nameOxanium.className,
        claim: nameOxanium.className,
      };
    case "mplus-rajdhani":
      return {
        title: mplusTitle,
        sub: mplusTitle,
        rank: nameRajdhani.className,
        amount: nameRajdhani.className,
        claim: nameRajdhani.className,
      };
  }
}

function Coin({ size = 40 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="grid place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background:
          "conic-gradient(from 210deg, #f9d576, #b8860b 40%, #f6c344 70%, #8a6410)",
        boxShadow: "inset 0 0 3px rgba(0,0,0,0.45)",
      }}
    >
      <span
        className="grid place-items-center rounded-full font-extrabold text-[#241902]"
        style={{
          width: size * 0.72,
          height: size * 0.72,
          fontSize: size * 0.32,
          background:
            "radial-gradient(circle at 35% 30%, #ffedb0, #d9a125 70%)",
        }}
      >
        U
      </span>
    </span>
  );
}

function FontDemo({
  id,
  isJa,
}: {
  id: UnitEarnOverlayFontId;
  isJa: boolean;
}) {
  const pair = fontPair(id);
  const title = isJa
    ? UNIT_EARN_OVERLAY_FONT_SAMPLE.titleJa
    : UNIT_EARN_OVERLAY_FONT_SAMPLE.titleEn;
  const subtitle = isJa
    ? UNIT_EARN_OVERLAY_FONT_SAMPLE.subtitleJa
    : UNIT_EARN_OVERLAY_FONT_SAMPLE.subtitleEn;
  const claim = isJa
    ? UNIT_EARN_OVERLAY_FONT_SAMPLE.claimJa
    : UNIT_EARN_OVERLAY_FONT_SAMPLE.claimEn;
  const rankText = formatUnitEarnRankOrdinal(
    UNIT_EARN_OVERLAY_FONT_SAMPLE.rank
  );

  return (
    <div className="relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden bg-black/70 px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.75)_100%)]" />
      <div className="relative z-[1] flex w-full max-w-[260px] flex-col items-center text-center">
        <p
          className={[
            pair.title,
            "text-[16px] font-extrabold tracking-[0.08em] text-white/[0.94]",
          ].join(" ")}
        >
          {title}
        </p>
        <p
          className={[
            pair.sub,
            "mt-1.5 text-[13px] font-semibold text-[rgba(226,246,255,0.78)]",
          ].join(" ")}
        >
          {subtitle}
        </p>
        <p
          className={[
            pair.rank,
            pair.rankTracking ?? "",
            "mt-3 text-[32px] font-extrabold text-[#cffafe]",
          ].join(" ")}
        >
          {rankText}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Coin size={40} />
          <span
            className={[
              pair.amount,
              pair.amountTracking ?? "",
              "text-[48px] font-extrabold leading-none text-[#ffe9a8]",
            ].join(" ")}
          >
            <span className="text-[#f6c344]">+</span>
            {UNIT_EARN_OVERLAY_FONT_SAMPLE.amount}
          </span>
        </div>
        <div className="mt-7">
          <span
            className={[
              isJa ? pair.title : pair.claim,
              isJa ? "" : (pair.claimTracking ?? "tracking-[0.18em]"),
              isJa ? "tracking-[0.12em]" : "",
              "inline-flex min-w-[160px] items-center justify-center border border-cyan-300/90 bg-[#00f5ff] px-7 py-3 text-[12px] font-extrabold uppercase text-[#041018]",
            ].join(" ")}
          >
            {claim}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function UnitEarnOverlayFontPreviewPage() {
  const [isJa, setIsJa] = useState(true);

  return (
    <main className="min-h-screen bg-[#05080c] px-4 py-6 text-white">
      <div className="mx-auto max-w-md">
        <header className="mb-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300/70">
            DEV PREVIEW
          </p>
          <h1 className="mt-1 text-xl font-extrabold tracking-tight">
            Unit 獲得フォント案
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-white/55">
            上段 CURRENT のあとが角張り（ANGULAR）枠。順位・金額のラテン体を比較。
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setIsJa(true)}
              className={[
                "rounded px-3 py-1.5 text-[12px] font-bold",
                isJa ? "bg-cyan-400 text-black" : "bg-white/10 text-white/70",
              ].join(" ")}
            >
              JA
            </button>
            <button
              type="button"
              onClick={() => setIsJa(false)}
              className={[
                "rounded px-3 py-1.5 text-[12px] font-bold",
                !isJa ? "bg-cyan-400 text-black" : "bg-white/10 text-white/70",
              ].join(" ")}
            >
              EN
            </button>
          </div>
        </header>

        <div className="flex flex-col gap-6">
          {UNIT_EARN_OVERLAY_FONT_VARIANTS.map((v) => (
            <section
              key={v.id}
              className={[
                "overflow-hidden rounded border bg-[#0a1218]",
                v.current
                  ? "border-cyan-300/35 shadow-[0_0_20px_rgba(0,245,255,0.08)]"
                  : v.angular
                    ? "border-violet-300/30"
                    : "border-white/10",
              ].join(" ")}
            >
              <div className="px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[15px] font-extrabold tracking-wide">
                    {isJa ? v.nameJa : v.nameEn}
                  </h2>
                  {v.current ? (
                    <span className="rounded bg-cyan-400/15 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-cyan-100/85">
                      CURRENT
                    </span>
                  ) : null}
                  {v.angular ? (
                    <span className="rounded bg-violet-400/15 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-violet-100/85">
                      ANGULAR
                    </span>
                  ) : null}
                  {!v.native ? (
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white/55">
                      WEB
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-white/50">
                  {isJa ? v.noteJa : v.noteEn}
                </p>
                <p className="mt-1 text-[11px] text-white/35">
                  {v.titleStack} · {v.metricStack}
                </p>
              </div>
              <FontDemo id={v.id} isJa={isJa} />
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
