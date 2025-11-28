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
    label: "予想フォーム",
    question: "予想フォームの使い方を教えてください",
    icon: <Target className="h-5 w-5 text-pink-400" />,
    accentClass: "from-pink-500/70 via-fuchsia-500/70 to-sky-500/70",
    answer: (
      <div className="space-y-2 text-sm leading-relaxed text-white/80">
        <p>
          Uniterzでは、試合ごとに
          <span className="font-semibold text-pink-300">
            「予想投稿」を作成して自分の考えを共有
          </span>
          します。
        </p>

        <p className="font-semibold text-sky-300">1. 試合を選ぶ</p>
        <p>
          試合一覧から対象の試合カードをタップして、
          <span className="font-semibold text-sky-300">「予想をする」画面</span>
          を開きます。
        </p>

        <p className="font-semibold text-sky-300">
          2. レッグ（予想パーツ）を組み立てる
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>メイン / セカンド / サード といった複数のレッグを追加できます。</li>
          <li>
            それぞれに
            <span className="font-semibold text-violet-300">
              「内容（どっちが勝つか・点差レンジなど）」と「オッズ」
            </span>
            を入力します。
          </li>
          <li>
            各レッグには
            <span className="font-semibold text-emerald-300">％配分</span>
            を設定し、
            <span className="font-semibold text-emerald-300">合計が 100%</span>
            になるようにします。
          </li>
        </ul>

        <p className="font-semibold text-sky-300">3. メモを書く（任意）</p>
        <p>
          試合の狙いどころや理由を、テキストで自由に書けます。
          <span className="font-semibold text-pink-300">
            ここが「予想分析コミュニティ」として一番の見せ場
          </span>
          です。
        </p>

        <p className="font-semibold text-sky-300">4. 結果の反映</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            試合が終わると、各レッグが
            <span className="font-semibold text-emerald-300">
              「的中 / ハズレ / 無効」
            </span>
            に自動判定されます。
          </li>
          <li>
            レッグごとの
            <span className="font-semibold text-violet-300">
              オッズと％配分をもとにユニット収支
            </span>
            が自動計算されます。
          </li>
          <li>
            その結果が、
            <span className="font-semibold text-amber-300">
              プロフィールの勝率・獲得ユニット・平均オッズやランキング
            </span>
            に反映されます。
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "units",
    label: "ユニット",
    question: "ユニットって何ですか？",
    icon: <Coins className="h-5 w-5 text-amber-300" />,
    accentClass: "from-amber-400/70 via-orange-400/70 to-pink-500/70",
    answer: (
      <div className="space-y-2 text-sm leading-relaxed text-white/80">
        <p>
          Uniterzでは、実際のお金ではなく
          <span className="font-semibold text-amber-300">
            「ユニット」という仮想的なポイント
          </span>
          で成績を管理します。
        </p>
        <p>
          1つの投稿の中では、
          <span className="font-semibold text-emerald-300">
            合計 1.0 ユニットぶん
          </span>
          を「メイン」「セカンド」「サード」などのレッグに
          <span className="font-semibold text-emerald-300">％配分</span>
          して使うイメージです。
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>例：メイン 70%・セカンド 30% → 合計 1.0 ユニット</li>
          <li>
            それぞれにオッズを入力すると、
            <span className="font-semibold text-violet-300">
              結果確定時に自動で収支（±ユニット）が計算
            </span>
            されます。
          </li>
        </ul>
        <p>
          「
          <span className="font-semibold text-amber-300">
            1ユニットをどれくらいの重さと考えるか
          </span>
          」は人それぞれです。自分の中で基準を決めて運用し、
          <span className="font-semibold text-sky-300">
            期間ごとの成績（勝率・獲得ユニット）を比較するための軸
          </span>
          として使います。
        </p>
      </div>
    ),
  },
  {
    id: "stats",
    label: "成績の計算",
    question: "勝率・獲得ユニット・平均オッズはどう計算されていますか？",
    icon: <BarChart3 className="h-5 w-5 text-sky-300" />,
    accentClass: "from-sky-400/70 via-cyan-400/70 to-emerald-400/70",
    answer: (
      <div className="space-y-2 text-sm leading-relaxed text-white/80">
        <p className="font-semibold text-sky-300">勝率</p>
        <p>
          <span className="font-semibold text-sky-300">的中した投稿の本数</span>
          を
          <span className="font-semibold text-sky-300">
            判定対象になった投稿の本数
          </span>
          で割った値です。無効（void）の投稿は分母から除外されます。
        </p>

        <p className="font-semibold text-emerald-300">獲得ユニット</p>
        <p>
          各投稿ごとに、
          <span className="font-semibold text-emerald-300">
            「的中レッグのオッズ × そのレッグの％配分」
          </span>
          を合計し、そこから
          <span className="font-semibold text-amber-300">元の 1 ユニット</span>
          を引いた値がその投稿の収支となります。無効になった配分ぶんは、
          <span className="font-semibold text-emerald-300">
            損も得もない扱い
          </span>
          です。
        </p>

        <p className="font-semibold text-violet-300">平均オッズ</p>
        <p>
          「的中した投稿のうち、
          <span className="font-semibold text-violet-300">
            的中したレッグの想定オッズ
          </span>
          」を平均したものです。どれくらいのオッズ帯を狙っているかの参考指標になります。
        </p>

        <p>
          こうして
          <span className="font-semibold text-sky-300">
            日別の記録をためておき、7日間 / 30日間 / 通算
          </span>
          などの集計を行い、
          <span className="font-semibold text-amber-300">
            プロフィールやランキング
          </span>
          に反映しています。
        </p>
      </div>
    ),
  },
  {
    id: "profile",
    label: "プロフィール",
    question: "プロフィール画面の数字や項目について教えてください",
    icon: <User className="h-5 w-5 text-indigo-300" />,
    accentClass: "from-indigo-400/70 via-violet-500/70 to-fuchsia-500/70",
    answer: (
      <div className="space-y-2 text-sm leading-relaxed text-white/80">
        <p>
          プロフィールでは、
          <span className="font-semibold text-emerald-300">
            7日間 / 30日間 / 通算
          </span>
          などの期間ごとに、自分の成績を確認できます。
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <span className="font-semibold text-sky-300">勝率</span>：
            的中した投稿の割合
          </li>
          <li>
            <span className="font-semibold text-emerald-300">獲得ユニット</span>
            ：期間中のユニット収支の合計
          </li>
          <li>
            <span className="font-semibold text-violet-300">平均オッズ</span>：
            的中したレッグのオッズの平均
          </li>
          <li>
            <span className="font-semibold text-amber-300">投稿数</span>：
            判定対象になった投稿の本数
          </li>
        </ul>
        <p>
          そのほか、
          <span className="font-semibold text-pink-300">
            フォロー / フォロワー数
          </span>
          や、
          <span className="font-semibold text-sky-300">
            自己紹介・アイコン
          </span>
          などもここで確認できます。自分のスタイルや得意分野がわかるように、
          プロフィールを整えておくのがおすすめです。
        </p>
      </div>
    ),
  },
  {
    id: "ranking",
    label: "ランキング",
    question: "ランキングはどのように作られていますか？",
    icon: <Trophy className="h-5 w-5 text-yellow-300" />,
    accentClass: "from-yellow-400/70 via-amber-400/70 to-emerald-400/70",
    answer: (
      <div className="space-y-2 text-sm leading-relaxed text-white/80">
        <p>
          ランキングは、
          <span className="font-semibold text-emerald-300">
            各ユーザーの投稿データ
          </span>
          をもとに自動集計されています。
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            集計期間タブで
            <span className="font-semibold text-sky-300">
              （例）7日間 / 30日間 / 通算
            </span>
            を切り替えられます。
          </li>
          <li>
            指標は主に
            <span className="font-semibold text-emerald-300">
              「獲得ユニット」
            </span>
            と
            <span className="font-semibold text-sky-300">「勝率」</span>
            です。
          </li>
          <li>
            一定数以上の投稿がないユーザーは、
            <span className="font-semibold text-amber-300">
              ランキング対象外
            </span>
            になる場合があります（極端な少数サンプルを避けるため）。
          </li>
        </ul>
        <p>
          試合が確定するたびに投稿の判定が行われ、さらに
          <span className="font-semibold text-emerald-300">
            深夜の自動再集計
          </span>
          でも定期的にデータが更新されます。成績が安定してきたら、
          ランキングで自分の位置をチェックしてみてください。
        </p>
      </div>
    ),
  },
  {
    id: "safety",
    label: "規約と安全性",
    question: "Uniterzを安全に利用するために気をつけることは？",
    icon: <ShieldCheck className="h-5 w-5 text-emerald-300" />,
    accentClass: "from-emerald-400/70 via-teal-400/70 to-sky-400/70",
    answer: (
      <div className="space-y-2 text-sm leading-relaxed text-white/80">
        <p>
          Uniterzは、
          <span className="font-semibold text-emerald-300">
            スポーツの予想と分析を楽しむコミュニティ
          </span>
          です。実際のお金のやり取りはアプリ上では行いません。
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            アプリ内の
            <span className="font-semibold text-amber-300">
              「ユニット」はあくまで仮想ポイント
            </span>
            であり、現金やその他の価値と直接結びつくものではありません。
          </li>
          <li>
            他ユーザーとのやり取りで、
            <span className="font-semibold text-pink-300">
              個人情報やお金に関する話題
            </span>
            を持ち出すことは推奨していません。
          </li>
          <li>
            誹謗中傷や攻撃的な表現ではなく、
            <span className="font-semibold text-sky-300">
              スポーツマンシップに沿ったコミュニケーション
            </span>
            を心がけてください。
          </li>
        </ul>
        <p>
          詳細な
          <span className="font-semibold text-emerald-300">
            利用規約・プライバシーポリシー
          </span>
          は、専用ページから確認できるよう順次整備していきます。ご利用の前に必ず内容を確認し、
          お住まいの地域のルールも含めてご自身の判断でご利用ください。
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
            {/* 左側のカラーアイコン（枠ありOKのやつ） */}
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${item.accentClass} shadow-[0_0_16px_rgba(15,23,42,0.8)]`}
            >
              {item.icon}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-medium tracking-wide text-white/50">
                {item.label}
              </span>
              {/* mobile は少し小さめ、web で大きく */}
              <span className="text-sm md:text-lg font-semibold text-white">
                {item.question}
              </span>
            </div>
          </div>

          {/* 右側の「？」：色付きのみ、丸い枠なし */}
          <div className="flex items-center justify-center">
            <span className="text-sm font-bold text-sky-300">?</span>
          </div>
        </button>

        {isOpen && (
          <div className="border-t border-white/10 px-5 py-4">{item.answer}</div>
        )}
      </div>
    </div>
  );
}

export default function HelpPage({ variant }: { variant: Variant }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const isWeb = variant === "web";

  return (
    // web / mobile 共通でダーク背景になるように固定
    <div className="min-h-screen w-full bg-[#0a3b47]">
      <div
        className={
          isWeb
            ? "mx-auto max-w-4xl px-6 py-10 text-white"
            : "mx-auto max-w-[640px] px-4 py-8 text-white"
        }
      >
        {/* ヘッダー */}
        <div className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-r from-[#111827] via-[#020617] to-[#020617] px-6 py-5 shadow-[0_0_36px_rgba(56,189,248,0.35)]">
          <div className="flex items-center gap-3">
            {/* 外枠のリングなしで、グラデ背景＋「？」だけ */}
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-fuchsia-500 to-amber-400 shadow-[0_0_18px_rgba(129,140,248,0.9)]">
              <span className="text-lg font-extrabold text-white">?</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
                ヘルプ &amp; ガイド
              </h1>
              <p className="mt-1 text-xs md:text-sm text-white/70">
                予想フォームの使い方や{" "}
                <span className="font-semibold text-emerald-300">ユニット</span>
                、{" "}
                <span className="font-semibold text-sky-300">
                  ランキングの仕組み
                </span>
                、プロフィールの見かたや安全な利用方法など、Uniterz を使ううえで
                よくある質問をまとめています。
              </p>
            </div>
          </div>
        </div>

        {/* アコーディオン */}
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
      {/* ===== 戻る（×）ボタン：右下固定 ===== */}
<button
  onClick={() => window.history.back()}
  className="
    fixed bottom-6 right-6 z-50
    w-14 h-14 rounded-full
    bg-white/10 backdrop-blur 
    border border-white/20 
    flex items-center justify-center
    shadow-[0_0_18px_rgba(0,0,0,0.35)]
    active:scale-95 transition-transform
  "
  aria-label="閉じる"
>
  <span className="text-2xl font-bold text-white">×</span>
</button>
    </div>
  );
}
