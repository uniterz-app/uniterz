"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useScrambleDecode } from "@/lib/hooks/useScrambleDecode";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import ConnectedFlowCards from "@/app/lp/_components/ConnectedFlowCards";
import { flowNodes } from "@/app/lp/_components/lp-data";
import LpV2PhotoBackground from "@/app/lp-v2/_components/LpV2PhotoBackground";
import LPV2TopActions from "@/app/lp-v2/_components/LPV2TopActions";
import EasyPostShowcase from "@/app/lp-v2/_components/EasyPostShowcase";
import LpV2RankingFeature from "@/app/lp-v2/_components/LpV2RankingFeature";
import LpV2Footer from "@/app/lp-v2/_components/LpV2Footer";

export default function MobileLPV2Page() {
  const [mounted, setMounted] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [startTopScramble, setStartTopScramble] = useState(false);
  const [showContent, setShowContent] = useState(false);
  useEffect(() => setMounted(true), []);
  const topLine = useScrambleDecode(
    "Score-Based Sports Prediction Game",
    mounted && startTopScramble
  );
  const ctaFontStyle = bracketMarketTeamTypography(true);

  useEffect(() => {
    const runIntro = () => {
      setShowTitle(false);
      setStartTopScramble(false);
      setShowContent(false);
      requestAnimationFrame(() => {
        setShowTitle(true);
        setTimeout(() => setStartTopScramble(true), 220);
        setTimeout(() => setShowContent(true), 320);
      });
    };
    runIntro();
    window.addEventListener("pageshow", runIntro);
    return () => window.removeEventListener("pageshow", runIntro);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080a0d] text-white">
      <LpV2PhotoBackground />
      <LPV2TopActions mobile />
      <div className="relative z-10 mx-auto flex w-full flex-col items-center px-4 pt-24">
        <div
          className={`mt-2 text-[12px] tracking-[0.17em] text-cyan-200/72 uppercase text-center transition-all duration-500 ${
            startTopScramble ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
          }`}
        >
          {topLine}
        </div>
        <div
          className={`mt-1 text-[44px] tracking-widest text-cyan-100/90 transition-all duration-500 ease-out ${
            showTitle
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-3 scale-[0.985] opacity-0"
          }`}
          style={{ fontFamily: '"Bebas Neue", sans-serif' }}
        >
          UNITERZ
        </div>
      </div>

      <div className="relative z-10 mx-auto grid w-full grid-cols-1 items-start gap-4 px-3 pt-10 pb-6">
        <div
          className={`-mt-[36px] transition-all duration-700 ${
            showContent ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
          }`}
        >
          <h1
            className="text-center text-[24px] font-black leading-[1.08] tracking-[-0.02em] text-cyan-100"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            <span className="block whitespace-nowrap">
              <span className="bg-linear-to-r from-sky-200 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                予想
              </span>
              と
              <span className="bg-linear-to-r from-cyan-200 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                分析
              </span>
              で、
            </span>
            <span className="block whitespace-nowrap">
              観戦に新しい
              <span className="bg-linear-to-r from-rose-300 via-red-400 to-orange-400 bg-clip-text text-transparent">
                熱狂
              </span>
              を。
            </span>
          </h1>
          <p className="mx-auto mt-1 max-w-[92%] text-center text-[12px] leading-6 text-white/72">
            UNITERZでは、試合予想をスコア化し、その結果に基づくデータやランキングを通じて、他のユーザーと競えます。
          </p>
          <div className="mt-4 flex justify-center">
            <Link
              href="/mobile/signup"
              className="inline-flex h-10 items-center justify-center rounded-xl px-5 text-white transition hover:scale-[1.02]"
              style={{
                background:
                  "linear-gradient(90deg, #4C1D95 0%, #9D174D 50%, #0E7490 100%)",
                boxShadow:
                  "0 10px 30px rgba(76,29,149,0.22), 0 12px 34px rgba(14,116,144,0.2)",
              }}
            >
              <span
                style={{
                  ...ctaFontStyle,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  fontSize: "0.96rem",
                  fontWeight: 700,
                }}
              >
                CREATE ACCOUNT
              </span>
            </Link>
          </div>
        </div>
        <div
          className={`transition-all duration-700 ${
            showContent ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
          }`}
        >
          <EasyPostShowcase mobile />
        </div>
      </div>

      <section className="relative z-10 mx-auto w-full px-3 pb-10">
        <h2
          className="mb-5 text-center text-[30px] font-bold leading-tight tracking-[-0.01em] text-cyan-100"
        >
          遊び方
        </h2>
        <ConnectedFlowCards nodes={flowNodes} autoAdvance={false} />
      </section>

      <LpV2RankingFeature mobile />

      <LpV2Footer mobile />
    </main>
  );
}

