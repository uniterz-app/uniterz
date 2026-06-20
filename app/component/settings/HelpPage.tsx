"use client";

import React, { useState } from "react";
import LegalPageLayout from "@/app/component/settings/LegalPageLayout";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
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

type ScoringSectionItem = {
  id: "winRate" | "totalPoints" | "scorePrecision" | "upsetPoints";
  title: string;
  content: React.ReactNode;
};

function ScoringLogicSections({
  items,
  defaultOpenId,
}: {
  items: ScoringSectionItem[];
  defaultOpenId: ScoringSectionItem["id"];
}) {
  const [openId, setOpenId] = useState<ScoringSectionItem["id"] | null>(
    defaultOpenId
  );

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <div
            key={item.id}
            className="overflow-hidden rounded-xl border border-white/10 bg-white/3"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left"
              onClick={() => setOpenId(open ? null : item.id)}
            >
              <span className="text-sm font-semibold text-white/90">
                {item.title}
              </span>
              <span className="text-xs text-cyan-200/80">{open ? "−" : "+"}</span>
            </button>
            {open ? (
              <div className="border-t border-white/10 px-3 py-2 text-sm leading-relaxed text-white/80">
                {item.content}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function ScoringLogicAnswerJa() {
  const items: ScoringSectionItem[] = [
    {
      id: "winRate",
      title: "勝率",
      content: <p>勝敗予想の的中率です（勝ち数 ÷ 投稿数）。</p>,
    },
    {
      id: "totalPoints",
      title: "総合得点",
      content: (
        <div className="space-y-1">
          <p className="font-semibold text-white/90">サッカー（WC など）</p>
          <p>
            <span className="font-semibold text-emerald-300">勝者的中</span>で
            <span className="font-semibold text-cyan-300"> +4点</span>。
          </p>
          <p>
            <span className="font-semibold text-emerald-300">HOME得点一致</span>
            <span className="font-semibold text-cyan-300"> +3点</span>、
            <span className="font-semibold text-emerald-300">AWAY得点一致</span>
            <span className="font-semibold text-cyan-300"> +3点</span>
            （完全一致のみ）。
          </p>
          <p>
            基本点は
            <span className="font-semibold text-cyan-300">0 / 4 / 7 / 10点</span>
            （勝者のみ4点、片方一致7点、完全一致10点）。
          </p>
          <p className="pt-1 font-semibold text-white/90">NBA</p>
          <p>
            <span className="font-semibold text-emerald-300">勝者的中</span>で
            <span className="font-semibold text-cyan-300"> +4点</span>。
            <span className="font-semibold text-emerald-300">得失点差の近さ（Max4点）</span>
            、
            <span className="font-semibold text-emerald-300">合計得点の近さ（Max2点）</span>
            で加点（すべて一致で基本点10点）。
          </p>
          <p className="pt-1">
            <span className="font-semibold text-emerald-300">連勝ボーナス</span>
            ：3〜4連勝 +1点、5〜6連勝 +2点、7連勝以上 +3点（2連勝以下は0点）。
          </p>
          <p>
            <span className="font-semibold text-emerald-300">アップセットボーナス</span>
            ：あなたの予想が少数派で的中し、かつ試合がアップセットだった場合
            <span className="font-semibold text-cyan-300"> +2点</span>。
          </p>
          <p>
            ※ 勝者予想を外した場合、
            <span className="font-semibold text-red-300">総合得点は0点</span>
            です。
          </p>
        </div>
      ),
    },
    {
      id: "scorePrecision",
      title: "スコア精度",
      content: (
        <div className="space-y-1">
          <p>
            <span className="font-semibold text-emerald-300">1試合 0〜10点</span>
            ：
            <span className="font-semibold text-cyan-300">HOME得点差（最大3）</span>
            ＋
            <span className="font-semibold text-cyan-300">AWAY得点差（最大3）</span>
            ＋
            <span className="font-semibold text-cyan-300">得失点差（最大4）</span>。
          </p>
          <p>
            <span className="font-semibold text-emerald-300">誤差0で満点</span>
            、誤差1〜11で段階的に減点、誤差12以上は
            <span className="font-semibold text-red-300">0点</span>
            です。
          </p>
        </div>
      ),
    },
    {
      id: "upsetPoints",
      title: "アップセット得点",
      content: (
        <div className="space-y-1">
          <p>
            <span className="font-semibold text-emerald-300">アップセット（番狂わせ）が起きた試合</span>
            で、あなたが
            <span className="font-semibold text-emerald-300">少数派の予想</span>
            を当てたときに加点される指標です（1試合0〜10点）。
          </p>
          <p>
            あなたの予想側が
            <span className="font-semibold text-cyan-300">45%以下</span>
            の少数派になるとアップセット得点の対象になり、
            <span className="font-semibold text-cyan-300">10%以下</span>
            のような強い少数派に近づくほど
            <span className="font-semibold text-emerald-300">10点に近い高得点</span>
            になります。
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-2 text-sm leading-relaxed text-white/80">
      <p>
        採点ロジックは下記4項目に分かれています。項目をタップすると詳細が開きます。
      </p>
      <ScoringLogicSections items={items} defaultOpenId="totalPoints" />
    </div>
  );
}

function ScoringLogicAnswerEn() {
  const items: ScoringSectionItem[] = [
    {
      id: "winRate",
      title: "Win Rate",
      content: <p>Your winner-prediction accuracy (wins ÷ submissions).</p>,
    },
    {
      id: "totalPoints",
      title: "Total Points",
      content: (
        <div className="space-y-1">
          <p className="font-semibold text-white/90">Football (WC, etc.)</p>
          <p>
            <span className="font-semibold text-emerald-300">Correct winner</span>
            <span className="font-semibold text-cyan-300"> +4 points</span>.
          </p>
          <p>
            <span className="font-semibold text-emerald-300">HOME goals match</span>
            <span className="font-semibold text-cyan-300"> +3</span>,{" "}
            <span className="font-semibold text-emerald-300">AWAY goals match</span>
            <span className="font-semibold text-cyan-300"> +3</span>
            (exact match only).
          </p>
          <p>
            Base points:
            <span className="font-semibold text-cyan-300"> 0 / 4 / 7 / 10</span>
            (winner only 4, one side 7, exact score 10).
          </p>
          <p className="pt-1 font-semibold text-white/90">NBA</p>
          <p>
            <span className="font-semibold text-emerald-300">Correct winner</span>
            <span className="font-semibold text-cyan-300"> +4 points</span>.{" "}
            <span className="font-semibold text-emerald-300">Margin closeness (max 4)</span> and{" "}
            <span className="font-semibold text-emerald-300">total-score closeness (max 2)</span>{" "}
            add points (all match → 10 base points).
          </p>
          <p className="pt-1">
            <span className="font-semibold text-emerald-300">Win-streak bonus</span>
            : +1 (3–4 streak), +2 (5–6), +3 (7+), else 0.
          </p>
          <p>
            <span className="font-semibold text-emerald-300">Upset bonus</span>
            : when your minority pick is correct and the match is an upset,
            <span className="font-semibold text-cyan-300"> +2 points</span>.
          </p>
          <p>
            Miss the winner and
            <span className="font-semibold text-red-300"> total points become 0</span>.
          </p>
        </div>
      ),
    },
    {
      id: "scorePrecision",
      title: "Score Precision",
      content: (
        <div className="space-y-1">
          <p>
            <span className="font-semibold text-emerald-300">0–10 per match</span>:{" "}
            <span className="font-semibold text-cyan-300">HOME score difference (max 3)</span>{" "}
            +{" "}
            <span className="font-semibold text-cyan-300">AWAY score difference (max 3)</span>{" "}
            +{" "}
            <span className="font-semibold text-cyan-300">point-difference gap (max 4)</span>.
          </p>
          <p>
            <span className="font-semibold text-emerald-300">0 error = full points</span>, 1–11
            are reduced step by step, and 12+ becomes
            <span className="font-semibold text-red-300"> 0</span>.
          </p>
        </div>
      ),
    },
    {
      id: "upsetPoints",
      title: "Upset Points",
      content: (
        <div className="space-y-1">
          <p>
            A separate 0–10 metric awarded when an
            <span className="font-semibold text-emerald-300"> upset actually happens</span>
            and your
            <span className="font-semibold text-emerald-300"> minority pick is correct</span>.
          </p>
          <p>
            Your pick starts qualifying when your side is at
            <span className="font-semibold text-cyan-300"> 45% or lower</span>.
            As it gets closer to a strong minority such as
            <span className="font-semibold text-cyan-300"> 10% or lower</span>,
            the upset score gets closer to
            <span className="font-semibold text-emerald-300"> 10 points</span>.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-2 text-sm leading-relaxed text-white/80">
      <p>Scoring logic is split into four sections. Tap each section to expand details.</p>
      <ScoringLogicSections items={items} defaultOpenId="totalPoints" />
    </div>
  );
}

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
    answer: <ScoringLogicAnswerJa />,
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
    answer: <ScoringLogicAnswerEn />,
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
  const m = t(language);
  const faqs = language === "ja" ? faqsJa : faqsEn;

  return (
    <LegalPageLayout
      variant={variant}
      title={m.settings.helpAndGuide}
      description={m.settings.helpDescription}
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
