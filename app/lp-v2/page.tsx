"use client";

import Link from "next/link";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import ConnectedFlowCards from "@/app/lp/_components/ConnectedFlowCards";
import { flowNodes } from "@/app/lp/_components/lp-data";
import LpV2PhotoBackground from "./_components/LpV2PhotoBackground";
import LPV2TopActions from "./_components/LPV2TopActions";
import EasyPostShowcase from "./_components/EasyPostShowcase";
import LpV2RankingFeature from "./_components/LpV2RankingFeature";
import LpV2Footer from "./_components/LpV2Footer";

export default function LPV2Page() {
  const topLine = "Score-Based Sports Prediction Game";
  const ctaFontStyle = bracketMarketTeamTypography(false);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080a0d] text-white">
      <LpV2PhotoBackground />
      <LPV2TopActions />
      <div className="relative z-10 mx-auto flex w-full max-w-[1360px] flex-col items-center px-6 pt-20 lg:px-10">
        <div className="text-[18px] sm:text-[22px] tracking-[0.18em] text-cyan-200/72 uppercase">
          {topLine}
        </div>
        <div
          className="mt-2 text-[64px] sm:text-[82px] tracking-[0.12em] text-cyan-100/90"
          style={{ fontFamily: '"Bebas Neue", sans-serif' }}
        >
          UNITERZ
        </div>
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-[1360px] grid-cols-1 items-center gap-8 px-6 pt-4 pb-10 lg:grid-cols-2 lg:gap-12 lg:px-10">
        <div className="order-1 lg:-mt-[250px]">
          <h1
            className="text-[42px] font-black leading-[1.03] tracking-[-0.03em] text-cyan-100 sm:text-[56px] lg:text-[68px]"
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
          <p className="mt-5 max-w-[640px] text-[15px] leading-8 text-white/72 sm:text-[18px]">
            UNITERZでは、試合予想をスコア化し、その結果に基づくデータやランキングを通じて、他のユーザーと競えます。
          </p>
          <Link
            href="/web/signup"
            className="mt-6 inline-flex h-15 items-center justify-center rounded-2xl px-10 text-white transition hover:scale-[1.02]"
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
                fontSize: "1.24rem",
                fontWeight: 700,
              }}
            >
              CREATE ACCOUNT
            </span>
          </Link>
        </div>
        <div className="order-2 lg:-mt-[70px]">
          <EasyPostShowcase />
        </div>
      </div>

      <section className="relative z-10 mx-auto -mt-30 w-full max-w-[1360px] px-6 pb-20 lg:-mt-40 lg:px-10">
        <h2
          className="mb-8 text-[34px] font-bold leading-tight tracking-[-0.01em] text-cyan-100 sm:text-[40px]"
        >
          遊び方
        </h2>

        <ConnectedFlowCards nodes={flowNodes} animated={false} />
      </section>

      <LpV2RankingFeature />

      <LpV2Footer />
    </main>
  );
}

