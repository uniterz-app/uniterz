// app/component/pro/MyStatsSection.tsx
import { Sparkles } from "lucide-react";
import MyStatsGraphCard from "./MyStatsGraphCard";
import OddsBubbleCard from "./OddsBubbleCard";
import { FeatureCard } from "./ProShared";

export default function MyStatsSection() {
  return (
    <section id="my-stats-pro">
      <h2 className="mb-2 text-lg font-semibold sm:text-xl">
        My Stats Pro — 自分の傾向を可視化
      </h2>
      <p className="mb-5 text-sm text-white/75">
        あなた自身の予想データをもとに、勝ちパターン・負けパターンを立体的に見える化します。
      </p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-stretch">
        <MyStatsGraphCard />

        <div className="space-y-4">
          <OddsBubbleCard />

          {/* AIまとめカード */}
          <FeatureCard
            icon={<Sparkles className="h-5 w-5 text-fuchsia-300" />}
            title="AIによる「あなたの傾向まとめ」"
            body={<AiSummaryPreview />}
            badge="AI分析"
          />
        </div>
      </div>
    </section>
  );
}

/* === AIメッセージの見本レイアウト === */

function AiSummaryPreview() {
  return (
    <div className="space-y-2">
      {/* 説明テキスト */}
      <p className="text-[11px] leading-relaxed text-white/80 sm:text-xs">
        直近の成績やオッズ傾向から、AIが「得意パターン」「注意すべきパターン」を
        1〜2行のメッセージでフィードバックします。
      </p>

      {/* AIメッセージ風ボックス（見本） */}
      <div className="rounded-2xl border border-fuchsia-400/40 bg-gradient-to-br from-[#160821] via-[#050516] to-[#020308] px-3 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
        <div className="mb-1.5 flex items-center gap-1.5 text-[10px] text-fuchsia-100/80">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-fuchsia-500/30 text-[8px] font-semibold">
            AI
          </span>
          <span>サンプルメッセージ</span>
        </div>

        <p className="mb-1 text-[11px] leading-relaxed text-white">
          ✅ 直近30試合では、
          <span className="font-semibold text-fuchsia-200">オッズ 2.0〜4.0</span>
          帯での的中率が高く、Unit も安定して増えています。
        </p>
        <p className="text-[11px] leading-relaxed text-white/90">
          ⚠️ 一方で、
          <span className="font-semibold text-amber-200">オッズ 7.0 以上</span>
          の勝負が続くとドローダウンが大きくなる傾向があります。高オッズは
          「ここぞ」という試合に絞るとさらにパフォーマンス改善が見込めます。
        </p>
      </div>
    </div>
  );
}
