"use client";

import React, { useState } from "react";
import LegalPageLayout from "@/app/component/settings/LegalPageLayout";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import {
  Gamepad2,
  BarChart3,
  Sigma,
  Trophy,
} from "lucide-react";

type Variant = "web" | "mobile";

type FAQItem = {
  id: string;
  label: string;
  question: string;
  icon: React.ReactNode;
  accentClass: string;
  answer: React.ReactNode;
};

const faqsJa: FAQItem[] = [
  {
    id: "form",
    label: "ゲームの遊び方",
    question: "このアプリでは何を楽しめますか？",
    icon: <Gamepad2 className="h-5 w-5 text-cyan-200" />,
    accentClass: "from-cyan-500/70 via-blue-500/70 to-indigo-500/70",
    answer: (
      <div className="space-y-2 text-sm leading-relaxed text-white/80">
        <p>
          Uniterz は、スポーツ予想をベースに楽しむ
          <span className="font-semibold text-cyan-300">
            ファンタジーゲーム
          </span>
          です。次のようなプレイができます。
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>勝敗予想</li>
          <li>スコア予想（任意）</li>
          <li>試合ごとの投稿でポイント獲得</li>
          <li>ランキングで他ユーザーと競争</li>
        </ul>
        <p>日々の投稿結果はプロフィールやランキングに反映されます。</p>
      </div>
    ),
  },
  {
    id: "stats",
    label: "スコア計算",
    question: "どんな成績指標がありますか？",
    icon: <BarChart3 className="h-5 w-5 text-violet-200" />,
    accentClass: "from-violet-500/70 via-fuchsia-500/70 to-indigo-500/70",
    answer: (
      <div className="space-y-2 text-sm leading-relaxed text-white/80">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <b>勝率</b>：勝敗予想の的中率
          </li>
          <li>
            <b>スコア精度</b>：スコア予想と結果のズレ
          </li>
          <li>
            <b>Upsetスコア</b>：番狂わせを読み切る力
          </li>
          <li><b>総合得点</b>：各指標を合算したスコア</li>
        </ul>
        <p>各指標は、7日間・30日間・通算で集計されます。</p>
      </div>
    ),
  },
  {
    id: "scoring-logic",
    label: "採点ロジック",
    question: "得点はどう計算されていますか？",
    icon: <Sigma className="h-5 w-5 text-emerald-200" />,
    accentClass: "from-emerald-500/70 via-teal-500/70 to-cyan-500/70",
    answer: (
      <div className="space-y-2 text-sm leading-relaxed text-white/80">
        <p>
          試合ごとの投稿には、主に
          <span className="font-semibold text-emerald-300"> 勝率・スコア精度・総合得点 </span>
          が反映されます。
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <b>勝率</b>：勝敗予想の的中率（勝ち数 ÷ 投稿数）
          </li>
          <li>
            <b>スコア精度</b>（1試合 0〜10点）：HOME得点差(最大3) + AWAY得点差(最大3) + 点差精度(最大4)
          </li>
          <li>スコア精度は誤差0で満点、誤差1〜11で段階的に減点、誤差12以上は0点</li>
          <li>
            <b>総合得点 pointsV3</b>：勝者的中4点 + 点差の近さ(最大4点) + 合計得点の近さ(最大2点)
          </li>
          <li>総合得点は勝者を外すと0点。条件成立時のみアップセット/連勝ボーナスが加算されます</li>
        </ul>
        <p>
          サマリーカードの表示は期間内の合計値です。ハイライトは
          <span className="font-semibold text-emerald-300"> 過去3日で4投稿以上 </span>
          の場合に判定されます。
        </p>
      </div>
    ),
  },
  {
    id: "ranking",
    label: "ランキング",
    question: "ランキングはどのように表示されますか？",
    icon: <Trophy className="h-5 w-5 text-amber-200" />,
    accentClass: "from-amber-500/70 via-orange-500/70 to-red-500/70",
    answer: (
      <div className="space-y-2 text-sm leading-relaxed text-white/80">
        <p>
          ランキングは
          <span className="font-semibold text-amber-300">
            指標ごとに個別に表示
          </span>
          されます。
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>勝率ランキング</li>
          <li>スコア精度ランキング</li>
          <li>総合得点ランキング</li>
          <li>Upsetスコアランキング</li>
        </ul>
        <p>期間ごとの順位変化を見ながらプレイを継続できます。</p>
      </div>
    ),
  },
];

const faqsEn: FAQItem[] = [
  {
    id: "form",
    label: "How to play",
    question: "What can I enjoy in this app?",
    icon: <Gamepad2 className="h-5 w-5 text-cyan-200" />,
    accentClass: "from-cyan-500/70 via-blue-500/70 to-indigo-500/70",
    answer: (
      <div className="space-y-2 text-sm leading-relaxed text-white/80">
        <p>
          Uniterz is a sports-prediction fantasy game. You enjoy it by making
          predictions for matches. You can:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Predict wins and losses.</li>
          <li>Predict scores (optional).</li>
          <li>Earn points from match-by-match submissions.</li>
          <li>Compete with other users in the rankings.</li>
        </ul>
        <p>Your daily submission results are reflected on your profile and rankings.</p>
      </div>
    ),
  },
  {
    id: "stats",
    label: "Scoring",
    question: "What performance metrics are available?",
    icon: <BarChart3 className="h-5 w-5 text-violet-200" />,
    accentClass: "from-violet-500/70 via-fuchsia-500/70 to-indigo-500/70",
    answer: (
      <div className="space-y-2 text-sm leading-relaxed text-white/80">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <b>Win Rate</b>: your accuracy in predicting winners.
          </li>
          <li>
            <b>Score Precision</b>: how close your predicted score is to
            the actual score.
          </li>
          <li>
            <b>Upset Score</b>: your ability to read upsets.
          </li>
          <li>
            <b>Total Points</b>: the combined score from all metrics.
          </li>
        </ul>
        <p>Each metric is aggregated for the last 7 days, last 30 days, and all-time.</p>
      </div>
    ),
  },
  {
    id: "scoring-logic",
    label: "Scoring logic",
    question: "How are points calculated?",
    icon: <Sigma className="h-5 w-5 text-emerald-200" />,
    accentClass: "from-emerald-500/70 via-teal-500/70 to-cyan-500/70",
    answer: (
      <div className="space-y-2 text-sm leading-relaxed text-white/80">
        <p>
          Match submissions mainly reflect:{" "}
          <span className="font-semibold text-emerald-300">
            Win Rate, Score Precision, and Total Points
          </span>
          .
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <b>Win Rate</b>: your win accuracy (wins ÷ submissions).
          </li>
          <li>
            <b>Score Precision</b> (0–10 per match): HOME point difference
            (max 3) + AWAY point difference (max 3) + margin precision (max 4).
          </li>
          <li>
            Score Precision is 10 points at 0 error, deducted stepwise for
            errors 1–11, and 0 points for errors 12+.
          </li>
          <li>
            <b>Total Points (pointsV3)</b>: 4 points for correct winner +
            up to 4 points for closeness of point difference + up to 2 points for closeness of total score.
          </li>
          <li>
            Total Points become 0 if you miss the winner. Upset / win-streak bonuses are added only when the conditions are met.
          </li>
        </ul>
        <p>
          Summary cards show the total values within the selected period.
          Highlights are applied when you have <span className="font-semibold text-emerald-300">4+ posts in the last 3 days</span>.
        </p>
      </div>
    ),
  },
  {
    id: "ranking",
    label: "Rankings",
    question: "How are rankings displayed?",
    icon: <Trophy className="h-5 w-5 text-amber-200" />,
    accentClass: "from-amber-500/70 via-orange-500/70 to-red-500/70",
    answer: (
      <div className="space-y-2 text-sm leading-relaxed text-white/80">
        <p>
          Rankings are displayed separately for each metric:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Win Rate rankings</li>
          <li>Score Precision rankings</li>
          <li>Total Points rankings</li>
          <li>Upset Score rankings</li>
        </ul>
        <p>You can keep playing while watching how your rank changes over time.</p>
      </div>
    ),
  },
];

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b1020]">
      <div className="rounded-2xl bg-[#0b1020]">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br ${item.accentClass}`}
            >
              {item.icon}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-medium tracking-wide text-white/50">
                {item.label}
              </span>
              <span className="text-sm md:text-lg font-semibold text-white">
                {item.question}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <span className="text-sm font-bold text-cyan-300">?</span>
          </div>
        </button>
        {isOpen && (
          <div className="border-t border-white/10 px-5 py-4">
            {item.answer}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HelpPage({ variant }: { variant: Variant }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const isEn = language === "en";
  const faqs = isEn ? faqsEn : faqsJa;

  return (
    <LegalPageLayout
      variant={variant}
      title={isEn ? "Help & Guide" : "ヘルプ & ガイド"}
      description={
        isEn
          ? "Uniterz is a fantasy sports game based on sports predictions. Check the basics of the game and how to read scores."
          : "Uniterz はスポーツ予想をベースにしたファンタジーゲームです。ゲームの基本ルールやスコアの見方を確認できます。"
      }
      updatedAt="2026-03-23"
    >
      <section className="space-y-4">
          {faqs.map((item) => (
            <AccordionItem
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onToggle={() =>
                setOpenId(openId === item.id ? null : item.id)
              }
            />
          ))}
      </section>
    </LegalPageLayout>
  );
}
