"use client";

import { ResultCardPresentation } from "@/app/component/result/ResultCard";
import WcMatchGoalScorersColumn from "@/app/component/result/WcMatchGoalScorersUnderScore";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import type { PostMatchGoalScorer } from "@/lib/wc/matchGoalScorers";

const MOCK_SCORERS: PostMatchGoalScorer[] = [
  { side: "home", minute: 23, label: "S.Fayziyev 23'" },
  { side: "away", minute: 45, label: "L.Díaz 45'" },
  { side: "home", minute: 58, label: "E.Bogdanov 58'" },
  { side: "away", minute: 67, label: "J.Cuadrado 67'" },
];

function mockPost(overrides?: Partial<PredictionPostV2>): PredictionPostV2 {
  return {
    id: "preview-wc-post",
    gameId: "wc-2026-K-uzb-col",
    league: "wc",
    status: "final",
    createdAtText: "2026-06-18",
    createdAtMillis: Date.now(),
    settledAtMillis: Date.now(),
    startAtMillis: Date.now(),
    home: {
      name: "Uzbekistan",
      teamId: "wc-uzb",
    },
    away: {
      name: "Colombia",
      teamId: "wc-col",
    },
    result: { home: 2, away: 2 },
    matchGoalScorers: MOCK_SCORERS,
    prediction: {
      winner: "draw",
      score: { home: 1, away: 2 },
      goalScorer: { playerId: "col-diaz", teamId: "wc-col" },
    },
    stats: {
      isWin: false,
      scorePrecision: 6.2,
      hadUpsetGame: false,
      upsetPoints: 0,
      pointsV3: 8.2,
      goalScorerBonus: 2,
      pointsV3Detail: {
        winnerCorrect: false,
        winPoints: 0,
        diffPoints: 2,
        totalPoints: 4,
        upsetBonus: 0,
        streakBonus: 0,
        goalScorerBonus: 2,
        diffError: 1,
        totalError: 1,
      },
    },
    ...overrides,
  };
}

export default function WcMatchScorersPreviewPage() {
  const postHit = mockPost();
  const postMiss = mockPost({
    id: "preview-wc-post-miss",
    prediction: {
      winner: "away",
      score: { home: 0, away: 2 },
      goalScorer: { playerId: "col-munoz", teamId: "wc-col" },
    },
    stats: {
      ...mockPost().stats!,
      goalScorerBonus: 0,
      pointsV3: 6.2,
      pointsV3Detail: {
        ...mockPost().stats!.pointsV3Detail!,
        goalScorerBonus: 0,
      },
    },
  });

  return (
    <div className="min-h-screen bg-[#030712] px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl space-y-10">
        <div>
          <h1 className="text-xl font-bold">WC 得点者表示プレビュー</h1>
          <p className="mt-2 text-sm text-white/55">
            チーム名の下・各列中央揃え・分数が早い順（上から）
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-cyan-300/90">
            コンポーネント単体
          </h2>
          <div className="rounded-2xl border border-white/10 bg-[#050814]/80 p-6">
            <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-x-8">
              <div className="flex flex-col items-center">
                <p className="text-center text-sm font-bold">Uzbekistan</p>
                <WcMatchGoalScorersColumn
                  scorers={MOCK_SCORERS}
                  side="home"
                />
              </div>
              <div className="pt-1 text-center">
                <p className="text-2xl font-black text-white/85">1 - 2</p>
                <p className="text-sm font-bold text-amber-200">2 - 2</p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-center text-sm font-bold">Colombia</p>
                <WcMatchGoalScorersColumn
                  scorers={MOCK_SCORERS}
                  side="away"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-cyan-300/90">
            リザルトカード（Web / 得点者ボーナス当たり）
          </h2>
          <div className="max-w-xl">
            <ResultCardPresentation
              post={postHit}
              isMobile={false}
              language="ja"
              platform="web"
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-cyan-300/90">
            リザルトカード（Mobile）
          </h2>
          <div className="max-w-sm">
            <ResultCardPresentation
              post={postHit}
              isMobile
              language="ja"
              platform="mobile"
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-cyan-300/90">
            得点者予想外れ
          </h2>
          <div className="max-w-xl">
            <ResultCardPresentation
              post={postMiss}
              isMobile={false}
              language="ja"
              platform="web"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
