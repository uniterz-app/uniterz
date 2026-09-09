"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import LegalPageLayout from "@/app/component/settings/LegalPageLayout";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
import { nameOxanium, jp } from "@/lib/fonts";
import { communityCrtMono } from "@/app/component/communities/CommunityCrtTheme";
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
  answer: React.ReactNode;
};

type ScoringSectionItem = {
  id: "winRate" | "totalPoints" | "upsetPoints";
  title: string;
  content: React.ReactNode;
};

function HelpNote({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="border border-white/25 bg-black px-3 py-2.5 text-[13px] leading-relaxed text-white/85">
      {children}
    </div>
  );
}

function HelpSlab({
  children,
  className = "",
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={[
        "border border-white/20 bg-black",
        interactive ? "transition-colors hover:border-white/40" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

function HelpSectionLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "mb-3 flex items-center gap-2 border-b border-white/20 pb-2",
        className,
      ].join(" ")}
    >
      <span className="h-1.5 w-1.5 shrink-0 bg-white" aria-hidden />
      <h2
        className={[
          communityCrtMono.className,
          "text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70 sm:text-[11px]",
        ].join(" ")}
      >
        {children}
      </h2>
    </div>
  );
}

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
          <HelpSlab key={item.id} className="overflow-hidden">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
              onClick={() => setOpenId(open ? null : item.id)}
              aria-expanded={open}
            >
              <span
                className={[
                  communityCrtMono.className,
                  "text-[11px] font-medium tracking-[0.14em] text-white/80 uppercase",
                ].join(" ")}
              >
                {item.title}
              </span>
              <ChevronDown
                className={[
                  "h-4 w-4 shrink-0 text-white/70 transition-transform duration-200",
                  open ? "rotate-180" : "",
                ].join(" ")}
                aria-hidden
              />
            </button>
            {open ? (
              <div
                className={[
                  "border-t border-white/15 px-3 py-3 text-sm leading-relaxed text-white/78",
                  jp.className,
                ].join(" ")}
              >
                {item.content}
              </div>
            ) : null}
          </HelpSlab>
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
        <div className="space-y-2">
          <p className="font-semibold text-white/92">サッカー（WC など）</p>
          <p>
            <span className="font-semibold text-white">勝者的中</span>
            で
            <span className="font-semibold text-white"> +4点</span>。
          </p>
          <p>
            <span className="font-semibold text-white">HOME得点一致</span>
            <span className="font-semibold text-white"> +2点</span>、
            <span className="font-semibold text-white">AWAY得点一致</span>
            <span className="font-semibold text-white"> +2点</span>、
            <span className="font-semibold text-white">得失点差一致</span>
            <span className="font-semibold text-white"> +2点</span>
            （各完全一致のみ）。
          </p>
          <p>
            基本点は
            <span className="font-semibold text-white">0 / 4 / 6 / 8 / 10点</span>
            など（勝者のみ4点、引き分け＋得失点差で6点、完全一致10点）。
          </p>
          <p className="pt-1 font-semibold text-white/92">NBA</p>
          <p>
            <span className="font-semibold text-white">勝者的中</span>で
            <span className="font-semibold text-white"> +4点</span>。
            <span className="font-semibold text-white">得失点差の近さ（Max4点）</span>
            、
            <span className="font-semibold text-white">合計得点の近さ（Max2点）</span>
            で加点（すべて一致で基本点10点）。
          </p>
          <p className="pt-1">
            <span className="font-semibold text-white">連勝ボーナス</span>
            ：3〜4連勝 +1点、5〜6連勝 +2点、7連勝以上 +3点（2連勝以下は0点）。
          </p>
          <p className="pt-1 font-semibold text-white/92">ワールドカップ（同時キックオフ）</p>
          <p>
            同じキックオフ時刻の試合は
            <span className="font-semibold text-white">1グループ</span>
            として連勝を判定します。グループ内で
            <span className="font-semibold text-white">投稿した試合がすべて的中</span>
            なら試合数ぶん連勝が伸び、
            <span className="font-semibold text-white">1つでも外れると連勝は0</span>
            になります（未投稿の試合は対象外）。
          </p>
          <p>
            <span className="font-semibold text-white">アップセットボーナス</span>
            ：あなたの予想が少数派で的中し、かつ試合がアップセットだった場合
            <span className="font-semibold text-white"> +2点</span>。
          </p>
          <p>
            ※ 勝者予想を外した場合、
            <span className="font-semibold text-white">総合得点は0点</span>
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
            <span className="font-semibold text-white">アップセット（番狂わせ）が起きた試合</span>
            で、あなたが
            <span className="font-semibold text-white">少数派の予想</span>
            を当てたときに加点される指標です（1試合0〜10点）。
          </p>
          <p>
            あなたの予想側が
            <span className="font-semibold text-white">45%以下</span>
            の少数派になるとアップセット得点の対象になり、
            <span className="font-semibold text-white">10%以下</span>
            のような強い少数派に近づくほど
            <span className="font-semibold text-white">10点に近い高得点</span>
            になります。
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3 text-sm leading-relaxed text-white/80">
      <p>
        採点ロジックは下記3項目に分かれています。項目をタップすると詳細が開きます。
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
        <div className="space-y-2">
          <p className="font-semibold text-white/92">Football (WC, etc.)</p>
          <p>
            <span className="font-semibold text-white">Correct winner</span>
            <span className="font-semibold text-white"> +4 points</span>.
          </p>
          <p>
            <span className="font-semibold text-white">HOME goals match</span>
            <span className="font-semibold text-white"> +2</span>,{" "}
            <span className="font-semibold text-white">AWAY goals match</span>
            <span className="font-semibold text-white"> +2</span>,{" "}
            <span className="font-semibold text-white">goal difference match</span>
            <span className="font-semibold text-white"> +2</span>
            (exact match for each).
          </p>
          <p>
            Base points:
            <span className="font-semibold text-white"> 0 / 4 / 6 / 8 / 10</span>
            (winner only 4, draw + matching goal diff 6, exact score 10).
          </p>
          <p className="pt-1 font-semibold text-white/92">NBA</p>
          <p>
            <span className="font-semibold text-white">Correct winner</span>
            <span className="font-semibold text-white"> +4 points</span>.{" "}
            <span className="font-semibold text-white">Margin closeness (max 4)</span> and{" "}
            <span className="font-semibold text-white">total-score closeness (max 2)</span>{" "}
            add points (all match → 10 base points).
          </p>
          <p className="pt-1">
            <span className="font-semibold text-white">Win-streak bonus</span>
            : +1 (3–4 streak), +2 (5–6), +3 (7+), else 0.
          </p>
          <p>
            <span className="font-semibold text-white">Upset bonus</span>
            : when your minority pick is correct and the match is an upset,
            <span className="font-semibold text-white"> +2 points</span>.
          </p>
          <p>
            Miss the winner and
            <span className="font-semibold text-white"> total points become 0</span>.
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
            <span className="font-semibold text-white"> upset actually happens</span>
            and your
            <span className="font-semibold text-white"> minority pick is correct</span>.
          </p>
          <p>
            Your pick starts qualifying when your side is at
            <span className="font-semibold text-white"> 45% or lower</span>.
            As it gets closer to a strong minority such as
            <span className="font-semibold text-white"> 10% or lower</span>,
            the upset score gets closer to
            <span className="font-semibold text-white"> 10 points</span>.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3 text-sm leading-relaxed text-white/80">
      <p>Scoring logic is split into four sections. Tap each section to expand details.</p>
      <ScoringLogicSections items={items} defaultOpenId="totalPoints" />
    </div>
  );
}

const faqsJa: FAQItem[] = [
  {
    id: "form",
    label: "GAMEPLAY",
    question: "このアプリでは何を楽しめますか？",
    icon: <Gamepad2 className="h-4 w-4 text-white" strokeWidth={2.2} />,
    answer: (
      <div className="space-y-3 text-sm leading-relaxed text-white/78">
        <p>
          Uniterz は、スポーツ予想をベースに楽しむ
          <span className="font-semibold text-white">ファンタジーゲーム</span>
          です。次のようなプレイができます。
        </p>
        <ul className="list-disc space-y-1 pl-5 text-white/72">
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
    label: "METRICS",
    question: "どんな成績指標がありますか？",
    icon: <BarChart3 className="h-4 w-4 text-white" strokeWidth={2.2} />,
    answer: (
      <div className="space-y-3 text-sm leading-relaxed text-white/78">
        <ul className="list-disc space-y-1 pl-5 text-white/72">
          <li>
            <b className="text-white/88">勝率</b>：勝敗予想の的中率
          </li>
          <li>
            <b className="text-white/88">アップセット得点</b>：番狂わせを読み切る力
          </li>
          <li>
            <b className="text-white/88">総合得点</b>：各要素を合算したスコア
          </li>
        </ul>
        <p>プロフィールでは大会・期間ごとに通算成績を確認できます。</p>
      </div>
    ),
  },
  {
    id: "scoring-logic",
    label: "SCORING",
    question: "得点はどう計算されていますか？",
    icon: <Sigma className="h-4 w-4 text-white" strokeWidth={2.2} />,
    answer: <ScoringLogicAnswerJa />,
  },
  {
    id: "ranking",
    label: "RANKINGS",
    question: "ランキングはどのように表示されますか？",
    icon: <Trophy className="h-4 w-4 text-white" strokeWidth={2.2} />,
    answer: (
      <div className="space-y-3 text-sm leading-relaxed text-white/78">
        <p>
          ランキングは
          <span className="font-semibold text-white">指標ごとに個別</span>
          に表示されます。
        </p>
        <ul className="list-disc space-y-1 pl-5 text-white/72">
          <li>勝率ランキング</li>
          <li>総合得点ランキング</li>
          <li>アップセット得点ランキング</li>
          <li>最多得点者的中ランキング</li>
        </ul>
        <p>
          グローバルランキングは
          <span className="font-semibold text-white">日本時間 16:00</span>
          に更新される累積スナップショットです。グループランキングとプロフィールの成績は、試合確定後に随時反映されます。
        </p>
        <HelpNote>
          <p className="mb-1 font-semibold text-white">同率のときの並び順</p>
          <p>
            総合得点以外の指標で数値が同じユーザーは、
            <span className="font-semibold text-white/95">総合得点が高い順</span>
            に並びます。勝率ランキングでは、勝率が同じ場合は投稿数の多い順を先に比較します。
          </p>
        </HelpNote>
      </div>
    ),
  },
];

const faqsEn: FAQItem[] = [
  {
    id: "form",
    label: "GAMEPLAY",
    question: "What can I enjoy in this app?",
    icon: <Gamepad2 className="h-4 w-4 text-white" strokeWidth={2.2} />,
    answer: (
      <div className="space-y-3 text-sm leading-relaxed text-white/78">
        <p>
          Uniterz is a sports-prediction fantasy game. You enjoy it by making
          predictions for matches. You can:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-white/72">
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
    label: "METRICS",
    question: "What performance metrics are available?",
    icon: <BarChart3 className="h-4 w-4 text-white" strokeWidth={2.2} />,
    answer: (
      <div className="space-y-3 text-sm leading-relaxed text-white/78">
        <ul className="list-disc space-y-1 pl-5 text-white/72">
          <li>
            <b className="text-white/88">Win Rate</b>: your accuracy in predicting winners.
          </li>
          <li>
            <b className="text-white/88">Score Precision</b>: how close your predicted score is.
          </li>
          <li>
            <b className="text-white/88">Upset Points</b>: your ability to read upsets.
          </li>
          <li>
            <b className="text-white/88">Total Points</b>: the combined score from all elements.
          </li>
        </ul>
        <p>Your profile shows cumulative stats for each tournament and period.</p>
      </div>
    ),
  },
  {
    id: "scoring-logic",
    label: "SCORING",
    question: "How are points calculated?",
    icon: <Sigma className="h-4 w-4 text-white" strokeWidth={2.2} />,
    answer: <ScoringLogicAnswerEn />,
  },
  {
    id: "ranking",
    label: "RANKINGS",
    question: "How are rankings displayed?",
    icon: <Trophy className="h-4 w-4 text-white" strokeWidth={2.2} />,
    answer: (
      <div className="space-y-3 text-sm leading-relaxed text-white/78">
        <p>Rankings are displayed separately for each metric:</p>
        <ul className="list-disc space-y-1 pl-5 text-white/72">
          <li>Win Rate</li>
          <li>Score Precision</li>
          <li>Total Points</li>
          <li>Upset Points</li>
          <li>Win Streak</li>
        </ul>
        <p>
          Global rankings use a cumulative snapshot updated daily at{" "}
          <span className="font-semibold text-white">16:00 JST</span>.
          Group rankings and profile stats update after each settled match.
        </p>
        <HelpNote>
          <p className="mb-1 font-semibold text-white">Tie-break order</p>
          <p>
            For metrics other than Total Points, users with the same value are sorted by{" "}
            <span className="font-semibold text-white/95">higher Total Points first</span>.
            In the Win Rate ranking, users with the same win rate are compared by submission
            count before Total Points.
          </p>
        </HelpNote>
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
    <HelpSlab interactive className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
        aria-expanded={isOpen}
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-white/30 bg-black">
            {item.icon}
          </div>
          <div className="min-w-0">
            <span
              className={[
                communityCrtMono.className,
                "block text-[10px] font-medium tracking-[0.18em] text-white/45 uppercase",
              ].join(" ")}
            >
              {item.label}
            </span>
            <span
              className={[
                nameOxanium.className,
                "mt-1 block text-[15px] leading-snug font-semibold text-white sm:text-base",
              ].join(" ")}
            >
              {item.question}
            </span>
          </div>
        </div>
        <ChevronDown
          className={[
            "mt-1 h-4 w-4 shrink-0 text-white/70 transition-transform duration-200",
            isOpen ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden
        />
      </button>
      {isOpen ? (
        <div
          className={[
            "border-t border-white/15 px-4 py-4 sm:px-5",
            jp.className,
          ].join(" ")}
        >
          {item.answer}
        </div>
      ) : null}
    </HelpSlab>
  );
}

export default function HelpPage({ variant }: { variant: Variant }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const m = t(language);
  const faqs = language === "ja" ? faqsJa : faqsEn;
  const isJa = language === "ja";

  return (
    <LegalPageLayout
      variant={variant}
      title="HELP"
      description={m.settings.helpDescription}
      updatedAt="2026-06-24"
    >
      <HelpSlab className="mb-5 px-4 py-3.5 sm:px-5">
        <HelpSectionLabel className="mb-2">
          {isJa ? "GUIDE" : "GUIDE"}
        </HelpSectionLabel>
        <p className={`text-sm leading-relaxed text-white/72 ${jp.className}`}>
          {isJa
            ? "Uniterz の遊び方・採点・ランキングについてまとめています。気になる項目をタップして詳細を確認してください。"
            : "How to play, scoring, and rankings — tap a section below to read more."}
        </p>
      </HelpSlab>

      <HelpSectionLabel className="mb-3">
        {isJa ? "TOPICS" : "TOPICS"}
      </HelpSectionLabel>

      <section className="space-y-3">
        {faqs.map((item) => (
          <AccordionItem
            key={item.id}
            item={item}
            isOpen={openId === item.id}
            onToggle={() => setOpenId(openId === item.id ? null : item.id)}
          />
        ))}
      </section>
    </LegalPageLayout>
  );
}
