"use client";

import React, { useState } from "react";
import {
  Target,
  Coins,
  BarChart3,
  User,
  Trophy,
  ShieldCheck,
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

const faqs: FAQItem[] = [
  {
    id: "form",
    label: "予想投稿（V2）",
    question: "V2では何を投稿するのですか？",
    icon: <Target className="h-5 w-5 text-pink-400" />,
    accentClass: "from-pink-500/70 via-fuchsia-500/70 to-sky-500/70",
    answer: (
      <div className="space-y-2 text-sm leading-relaxed text-white/80">
        <p>
          Uniterz V2 では、オッズや賭け要素のない
          <span className="font-semibold text-pink-300">
            「予想・分析コミュニティ」
          </span>
          として、次の内容を投稿します。
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>勝敗予想</li>
          <li>スコア予想（任意）</li>
          <li>自信度（1〜100%）</li>
          <li>分析メモ</li>
        </ul>
        <p>
          投稿データは
          勝率・精度・信頼度などの指標として自動集計されます。
        </p>
      </div>
    ),
  },
  {
    id: "confidence",
    label: "自信度",
    question: "自信度（%）とは何ですか？",
    icon: <Coins className="h-5 w-5 text-amber-300" />,
    accentClass: "from-amber-400/70 via-orange-400/70 to-pink-500/70",
    answer: (
      <div className="space-y-2 text-sm leading-relaxed text-white/80">
        <p>
          自信度は、
          <span className="font-semibold text-amber-300">
            その予想が当たると思う確率
          </span>
          を 1〜100% で表した指標です。
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>90%：ほぼ勝つと思う</li>
          <li>70%：有利と判断</li>
          <li>50%：五分</li>
          <li>30%：不利と判断</li>
        </ul>
        <p>
          50% 未満の投稿は、
          一致度（Calibration）の集計対象外になります。
        </p>
      </div>
    ),
  },
  {
    id: "stats",
    label: "分析指標",
    question: "どんな成績指標がありますか？",
    icon: <BarChart3 className="h-5 w-5 text-sky-300" />,
    accentClass: "from-sky-400/70 via-cyan-400/70 to-emerald-400/70",
    answer: (
      <div className="space-y-2 text-sm leading-relaxed text-white/80">
        <ul className="list-disc pl-5 space-y-1">
          <li><b>勝率</b>：勝敗予想の的中率</li>
          <li><b>スコア精度</b>：スコア予想と結果のズレ</li>
          <li><b>Brierスコア</b>：確率予想の正確さ</li>
          <li><b>Upsetスコア</b>：番狂わせを読み切る力</li>
          <li><b>一致度（Calibration）</b>：自信度と結果のズレ</li>
        </ul>
        <p>
          各指標は、7日間・30日間・通算で集計されます。
        </p>
      </div>
    ),
  },
  {
    id: "profile",
    label: "プロフィール",
    question: "プロフィールの数値は何を表していますか？",
    icon: <User className="h-5 w-5 text-indigo-300" />,
    accentClass: "from-indigo-400/70 via-violet-500/70 to-fuchsia-500/70",
    answer: (
      <div className="space-y-2 text-sm leading-relaxed text-white/80">
        <ul className="list-disc pl-5 space-y-1">
          <li>勝率：結果を当てる力</li>
          <li>スコア精度：点差を読む力</li>
          <li>一致度：確率感覚の正確さ</li>
          <li>投稿数：分析の蓄積量</li>
        </ul>
        <p>
          「当て勘が強い」「スコアに強い」「確率に強い」など特性が見える設計です。
        </p>
      </div>
    ),
  },
  {
    id: "ranking",
    label: "ランキング",
    question: "ランキングはどのように表示されますか？",
    icon: <Trophy className="h-5 w-5 text-yellow-300" />,
    accentClass: "from-yellow-400/70 via-amber-400/70 to-emerald-400/70",
    answer: (
      <div className="space-y-2 text-sm leading-relaxed text-white/80">
        <p>
          ランキングは、
          <span className="font-semibold text-emerald-300">
            指標ごとに個別に表示
          </span>
          されます。
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>勝率ランキング</li>
          <li>スコア精度ランキング</li>
          <li>一致度ランキング</li>
          <li>Upsetスコアランキング</li>
        </ul>
        <p>
          指標ごとに「得意分野の見える化」を目的とした設計です。
        </p>
      </div>
    ),
  },
  {
    id: "safety",
    label: "安全性",
    question: "ギャンブルや投資と関係ありますか？",
    icon: <ShieldCheck className="h-5 w-5 text-emerald-300" />,
    accentClass: "from-emerald-400/70 via-teal-400/70 to-sky-400/70",
    answer: (
      <div className="space-y-2 text-sm leading-relaxed text-white/80">
        <p>
          Uniterz は、
          <span className="font-semibold text-emerald-300">
            金銭を扱うサービスではありません。
          </span>
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>賭け行為なし</li>
          <li>課金による有利不利なし</li>
          <li>分析・学習目的のみ</li>
        </ul>
        <p>
          投稿内容は個人の見解であり、
          投資・賭博の助言ではありません。
        </p>
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
    <div className="rounded-2xl bg-gradient-to-r from-[#111827] via-[#020617] to-[#020617] p-[1px] shadow-[0_0_24px_rgba(15,23,42,0.8)]">
      <div className="rounded-2xl bg-[#020617]">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${item.accentClass}`}
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
          <span className="text-sm font-bold text-sky-300">?</span>
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
  const isWeb = variant === "web";

  return (
    <div className="min-h-screen w-full bg-[#0a3b47]">
      <div
        className={
          isWeb
            ? "mx-auto max-w-4xl px-6 py-10 text-white"
            : "mx-auto max-w-[640px] px-4 py-8 text-white"
        }
      >
        <div className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-r from-[#111827] via-[#020617] to-[#020617] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-fuchsia-500 to-amber-400">
              <span className="text-lg font-extrabold text-white">?</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
                ヘルプ & ガイド（V2）
              </h1>
              <p className="mt-1 text-xs md:text-sm text-white/70">
                Uniterz は
                <span className="font-semibold text-emerald-300">
                  分析特化型のスポーツ分析プラットフォーム
                </span>
                です。成績指標・ランキング・使い方の基本はこちらで確認できます。
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
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
        </div>
      </div>
    </div>
  );
}
