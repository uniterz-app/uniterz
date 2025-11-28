// app/component/pro/MarketProSection.tsx
"use client";

import { Users, Coins, Gauge } from "lucide-react";
import { FeatureCard } from "./ProShared";

export default function MarketProSection() {
  return (
    <section id="market-pro">
      <h2 className="mb-2 text-lg font-semibold sm:text-xl">
        Market Pro — 上位ユーザーの“流れ”を読む
      </h2>
      <p className="mb-5 text-sm text-white/75">
        市場全体ではなく、成績上位ユーザーの動きを抽出。どこに本気で乗っているのかを可視化します。
      </p>

      <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
        <FeatureCard
          icon={<Users className="h-5 w-5 text-emerald-300" />}
          title="上位ユーザーの分布を可視化"
          body={
            <>
              試合ごとに、成績上位ユーザーだけに絞った予想分布グラフを表示。
              <br />
              「勝っている人はどっちに賭けているか？」が一目でわかります。
            </>
          }
          badge="Top Players"
        />
        <FeatureCard
          icon={<Coins className="h-5 w-5 text-yellow-300" />}
          title="上位勢の Unit の集まり方を見る"
          body={
            <>
              どの側にどれだけの Unit が集まっているかを可視化。
              <br />
              票数ではなく「本気の重さ」で市場の本命ラインを確認できます。
            </>
          }
          badge="本気度"
        />
        <FeatureCard
          icon={<Gauge className="h-5 w-5 text-cyan-300" />}
          title="Market Index（市場の割れ具合を指数化）"
          body={
            <>
              上位ユーザーと全体の意見の差を 0–100 で指数化。
              <br />
              0 に近い＝ほぼ一致、100 に近い＝完全に別方向を向いている試合です。
            </>
          }
          badge="偏り指数"
        />
      </div>
    </section>
  );
}
