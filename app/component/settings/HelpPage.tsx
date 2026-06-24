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
  RankingsCyberPanel,
  RankingsCyberSectionLabel,
} from "@/app/component/rankings/RankingsCyberPanel";
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
  id: "winRate" | "totalPoints" | "scorePrecision" | "upsetPoints";
  title: string;
  content: React.ReactNode;
};

function HelpNote({
  children,
  tone = "cyan",
}: {
  children: React.ReactNode;
  tone?: "cyan" | "amber";
}) {
  return (
    <div
      className={[
        "rounded-lg border px-3 py-2.5 text-[13px] leading-relaxed",
        tone === "amber"
          ? "border-amber-400/25 bg-amber-500/8 text-amber-50/88"
          : "border-cyan-400/20 bg-cyan-500/6 text-cyan-50/88",
      ].join(" ")}
    >
      {children}
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
          <RankingsCyberPanel key={item.id} subtle className="overflow-hidden">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 text-left"
              onClick={() => setOpenId(open ? null : item.id)}
              aria-expanded={open}
            >
              <span
                className={[
                  communityCrtMono.className,
                  "text-[11px] font-medium tracking-[0.14em] text-cyan-200/85 uppercase",
                ].join(" ")}
              >
                {item.title}
              </span>
              <ChevronDown
                className={[
                  "h-4 w-4 shrink-0 text-cyan-300/70 transition-transform duration-200",
                  open ? "rotate-180" : "",
                ].join(" ")}
                aria-hidden
              />
            </button>
            {open ? (
              <div
                className={[
                  "mt-3 border-t border-white/10 pt-3 text-sm leading-relaxed text-white/78",
                  jp.className,
                ].join(" ")}
              >
                {item.content}
              </div>
            ) : null}
          </RankingsCyberPanel>
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
            <span className="font-semibold text-emerald-300">勝者的中</span>
            で
            <span className="font-semibold text-cyan-300"> +4点</span>。
          </p>
          <p>
            <span className="font-semibold text-emerald-300">HOME得点一致</span>
            <span className="font-semibold text-cyan-300"> +2点</span>、
            <span className="font-semibold text-emerald-300">AWAY得点一致</span>
            <span className="font-semibold text-cyan-300"> +2点</span>、
            <span className="font-semibold text-emerald-300">得失点差一致</span>
            <span className="font-semibold text-cyan-300"> +2点</span>
            （各完全一致のみ）。
          </p>
          <p>
            基本点は
            <span className="font-semibold text-cyan-300">0 / 4 / 6 / 8 / 10点</span>
            など（勝者のみ4点、引き分け＋得失点差で6点、完全一致10点）。
          </p>
          <p className="pt-1 font-semibold text-white/92">NBA</p>
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
    <div className="space-y-3 text-sm leading-relaxed text-white/80">
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
        <div className="space-y-2">
          <p className="font-semibold text-white/92">Football (WC, etc.)</p>
          <p>
            <span className="font-semibold text-emerald-300">Correct winner</span>
            <span className="font-semibold text-cyan-300"> +4 points</span>.
          </p>
          <p>
            <span className="font-semibold text-emerald-300">HOME goals match</span>
            <span className="font-semibold text-cyan-300"> +2</span>,{" "}
            <span className="font-semibold text-emerald-300">AWAY goals match</span>
            <span className="font-semibold text-cyan-300"> +2</span>,{" "}
            <span className="font-semibold text-emerald-300">goal difference match</span>
            <span className="font-semibold text-cyan-300"> +2</span>
            (exact match for each).
          </p>
          <p>
            Base points:
            <span className="font-semibold text-cyan-300"> 0 / 4 / 6 / 8 / 10</span>
            (winner only 4, draw + matching goal diff 6, exact score 10).
          </p>
          <p className="pt-1 font-semibold text-white/92">NBA</p>
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
    icon: <Gamepad2 className="h-4 w-4 text-cyan-300" strokeWidth={2.2} />,
    answer: (
      <div className="space-y-3 text-sm leading-relaxed text-white/78">
        <p>
          Uniterz は、スポーツ予想をベースに楽しむ
          <span className="font-semibold text-cyan-200">ファンタジーゲーム</span>
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
    icon: <BarChart3 className="h-4 w-4 text-cyan-300" strokeWidth={2.2} />,
    answer: (
      <div className="space-y-3 text-sm leading-relaxed text-white/78">
        <ul className="list-disc space-y-1 pl-5 text-white/72">
          <li>
            <b className="text-white/88">勝率</b>：勝敗予想の的中率
          </li>
          <li>
            <b className="text-white/88">スコア精度</b>：スコア予想と結果のズレ
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
    icon: <Sigma className="h-4 w-4 text-cyan-300" strokeWidth={2.2} />,
    answer: <ScoringLogicAnswerJa />,
  },
  {
    id: "ranking",
    label: "RANKINGS",
    question: "ランキングはどのように表示されますか？",
    icon: <Trophy className="h-4 w-4 text-amber-300" strokeWidth={2.2} />,
    answer: (
      <div className="space-y-3 text-sm leading-relaxed text-white/78">
        <p>
          ランキングは
          <span className="font-semibold text-cyan-200">指標ごとに個別</span>
          に表示されます。
        </p>
        <ul className="list-disc space-y-1 pl-5 text-white/72">
          <li>勝率ランキング</li>
          <li>スコア精度ランキング</li>
          <li>総合得点ランキング</li>
          <li>アップセット得点ランキング</li>
          <li>連勝ランキング</li>
        </ul>
        <p>
          グローバルランキングは
          <span className="font-semibold text-amber-200/95">日本時間 16:00</span>
          に更新される累積スナップショットです。グループランキングとプロフィールの成績は、試合確定後に随時反映されます。
        </p>
        <HelpNote tone="amber">
          <p className="mb-1 font-semibold text-amber-100/95">同率のときの並び順</p>
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
    icon: <Gamepad2 className="h-4 w-4 text-cyan-300" strokeWidth={2.2} />,
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
    icon: <BarChart3 className="h-4 w-4 text-cyan-300" strokeWidth={2.2} />,
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
    icon: <Sigma className="h-4 w-4 text-cyan-300" strokeWidth={2.2} />,
    answer: <ScoringLogicAnswerEn />,
  },
  {
    id: "ranking",
    label: "RANKINGS",
    question: "How are rankings displayed?",
    icon: <Trophy className="h-4 w-4 text-amber-300" strokeWidth={2.2} />,
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
          <span className="font-semibold text-amber-200/95">16:00 JST</span>.
          Group rankings and profile stats update after each settled match.
        </p>
        <HelpNote tone="amber">
          <p className="mb-1 font-semibold text-amber-100/95">Tie-break order</p>
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
    <RankingsCyberPanel subtle interactive className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 text-left"
        aria-expanded={isOpen}
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-cyan-400/25 bg-cyan-500/8 shadow-[0_0_14px_rgba(34,211,238,0.12)]">
            {item.icon}
          </div>
          <div className="min-w-0">
            <span
              className={[
                communityCrtMono.className,
                "block text-[10px] font-medium tracking-[0.18em] text-cyan-200/60 uppercase",
              ].join(" ")}
            >
              {item.label}
            </span>
            <span
              className={[
                nameOxanium.className,
                "mt-1 block text-[15px] leading-snug font-semibold text-white/95 sm:text-base",
              ].join(" ")}
            >
              {item.question}
            </span>
          </div>
        </div>
        <ChevronDown
          className={[
            "mt-1 h-4 w-4 shrink-0 text-cyan-300/75 transition-transform duration-200",
            isOpen ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden
        />
      </button>
      {isOpen ? (
        <div
          className={[
            "mt-4 border-t border-white/10 pt-4",
            jp.className,
          ].join(" ")}
        >
          {item.answer}
        </div>
      ) : null}
    </RankingsCyberPanel>
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
      title={m.settings.helpAndGuide}
      description={m.settings.helpDescription}
      updatedAt="2026-06-24"
    >
      <RankingsCyberPanel subtle className="mb-5">
        <RankingsCyberSectionLabel subtle>
          {isJa ? "GUIDE" : "GUIDE"}
        </RankingsCyberSectionLabel>
        <p className={`text-sm leading-relaxed text-white/72 ${jp.className}`}>
          {isJa
            ? "Uniterz の遊び方・採点・ランキングについてまとめています。気になる項目をタップして詳細を確認してください。"
            : "How to play, scoring, and rankings — tap a section below to read more."}
        </p>
      </RankingsCyberPanel>

      <RankingsCyberSectionLabel subtle className="mb-3">
        {isJa ? "TOPICS" : "TOPICS"}
      </RankingsCyberSectionLabel>

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
