// app/component/pro/ProMainCard.tsx
"use client";

import { FeatureLine } from "./ProShared";

export default function ProMainCard() {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/15 bg-[#050816]/95 px-4 pb-6 pt-4 shadow-[0_22px_80px_rgba(0,0,0,0.65)] sm:px-5 sm:pb-7 sm:pt-5">
      {/* HEADER グラデ */}
      <div className="relative -mx-4 -mt-4 mb-6 h-16 overflow-hidden rounded-t-[32px] border-b border-white/5 sm:-mx-5 sm:h-[68px]">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#141827_0%,#151b2a_20%,#0a2340_55%,#022749_100%)]" />
          <div className="absolute left-[18%] top-[-12%] h-[230%] w-[50%] bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.96),rgba(251,191,36,0))] blur-[20px] opacity-95" />
          <div className="absolute right-[-8%] top-[-15%] h-[220%] w-[34%] bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.95),rgba(6,182,212,0))] blur-[20px] opacity-95" />
          <div className="absolute inset-0 bg-[radial-gradient(130%_210%_at_50%_0%,rgba(0,0,0,0)_42%,rgba(0,0,0,0.45)_100%)] mix-blend-multiply" />
        </div>
        <div className="relative flex h-full items-center justify-between px-5">
          <span className="text-sm font-semibold text-white">Pro Plan</span>
          <span className="text-xs font-medium text-white/90">Uniterz Pro</span>
        </div>
      </div>

      {/* 本文 */}
      <div className="space-y-5">
        <div>
          <div className="flex items-baseline gap-2 text-white">
            <span className="text-[32px] font-bold leading-none">¥500</span>
            <span className="text-sm text-white/80">/ 月</span>
          </div>
          <p className="mt-2 text-xs text-white/70">
            7日間無料トライアル・いつでも 1 クリックで解約 OK
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 px-6 py-3 text-sm font-semibold shadow-[0_14px_40px_rgba(56,189,248,0.45)] transition active:scale-[0.98] hover:brightness-110"
          >
            Pro をはじめる
          </button>
        </div>

        <div className="space-y-2">
          <h2 className="text-[18px] font-semibold sm:text-[20px]">
            自己分析 × 市場分析
          </h2>
          <p className="text-[13px] leading-relaxed text-white/80 sm:text-sm">
            My Stats Pro で「自分のクセ」を、Market Pro で「みんなの流れ」を。
            予想の“勘”を、数字とデータでアップグレードする月額プランです。
          </p>
        </div>

        <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-white/90 sm:text-[15px]">
          <FeatureLine>ユニット推移をグラフで表示</FeatureLine>
          <FeatureLine>オッズ帯ごとの勝率を自動集計</FeatureLine>
          <FeatureLine>AI による「あなたの傾向まとめ」</FeatureLine>
          <FeatureLine>上位ユーザーの分布を可視化</FeatureLine>
          <FeatureLine>上位勢の Unit の集まりがわかる</FeatureLine>
          <FeatureLine>Market Index で市場の割れ具合を表示</FeatureLine>
        </ul>
      </div>
    </div>
  );
}
