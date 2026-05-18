"use client";

import { useMemo } from "react";
import PlayoffFullBracketWeb from "@/app/component/predict/PlayoffFullBracketWeb";
import PlayoffFullBracketMobile from "@/app/component/predict/PlayoffFullBracketMobile";
import { buildPlayoffDisplayData } from "@/lib/playoff-bracket-display";
import type { BracketState } from "@/lib/playoff-bracket-firestore";

const SEASON = "2026";

/** ユーザー予想ブラケット（試合用に一部ずらしあり） */
const PREVIEW_BRACKET: BracketState = {
  R1_E1: { winner: "DET", games: 7 },
  R1_E2: { winner: "BOS", games: 5 },
  R1_E3: { winner: "NYK", games: 5 },
  R1_E4: { winner: "CLE", games: 6 },
  R1_W1: { winner: "OKC", games: 5 },
  R1_W2: { winner: "SAS", games: 6 },
  R1_W3: { winner: "HOU", games: 5 },
  R1_W4: { winner: "LAL", games: 6 },
  R2_E1: { winner: "DET", games: 6 },
  R2_E2: { winner: "NYK", games: 5 },
  CF_E: { winner: "DET", games: 5 },
  R2_W1: { winner: "OKC", games: 5 },
  R2_W2: { winner: "LAL", games: 6 },
  CF_W: { winner: "OKC", games: 5 },
  FINALS: { winner: "DET", games: 6 },
};

/**
 * 実際の結果（R1_E1 は勝者一致・試合数のみズレ = オレンジ）
 * R1_E2 は TOR が勝ち = BOS にチェックなし（勝者外れ）
 */
const PREVIEW_RESULTS: BracketState = {
  R1_E1: { winner: "DET", games: 5 },
  R1_E2: { winner: "TOR", games: 6 },
  R1_E3: { winner: "NYK", games: 5 },
  R1_E4: { winner: "CLE", games: 6 },
  R1_W1: { winner: "OKC", games: 5 },
  R1_W2: { winner: "SAS", games: 6 },
  R1_W3: { winner: "HOU", games: 5 },
  R1_W4: { winner: "LAL", games: 6 },
  R2_E1: { winner: "DET", games: 6 },
  R2_E2: { winner: "NYK", games: 5 },
  CF_E: { winner: "DET", games: 5 },
  R2_W1: { winner: "OKC", games: 5 },
  R2_W2: { winner: "LAL", games: 6 },
  CF_W: { winner: "OKC", games: 5 },
  FINALS: { winner: "DET", games: 6 },
};

export default function PlayoffBracketHitPreviewPage() {
  const displayMixed = useMemo(
    () => buildPlayoffDisplayData(PREVIEW_BRACKET, SEASON),
    []
  );

  const commonProps = {
    league: "nba" as const,
    season: SEASON,
    score: 72,
  };

  return (
    <main className="min-h-screen bg-[#050b14] px-4 py-8 text-white">
      <div className="mx-auto max-w-[1200px] space-y-10">
        <div>
          <h1 className="text-xl font-bold text-cyan-300">
            プレーオフ的中表示プレビュー（dev・パターンA）
          </h1>
          <p className="mt-2 text-xs text-white/50">
            モックの bracket / results。凡例は本番と同じコンポーネント。
          </p>
          <p className="mt-1 text-xs text-white/50">
            URL:{" "}
            <code className="text-white/70">/dev/playoff-bracket-hit-preview</code>
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white/90">
            Web（一部的中・一部外れ・試合数のみズレ）
          </h2>
          <p className="text-sm text-white/60">
            東 R1-1: 勝者 DET 一致 / 試合数だけ違う → オレンジ。東 R1-2: BOS
            予想で実際 TOR → 外れ。FINALS は結果が予想と同じならチャンピオンにシアン。
          </p>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20 py-4">
            <PlayoffFullBracketWeb
              {...commonProps}
              {...displayMixed}
              bracket={PREVIEW_BRACKET}
              results={PREVIEW_RESULTS}
              hitLegend={{ language: "ja" }}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white/90">
            Mobile（同じデータ・縮小レイアウト）
          </h2>
          <div className="mx-auto max-w-md overflow-x-auto rounded-2xl border border-white/10 bg-black/20 py-4">
            <PlayoffFullBracketMobile
              {...commonProps}
              {...displayMixed}
              bracket={PREVIEW_BRACKET}
              results={PREVIEW_RESULTS}
              hitLegend={{ language: "ja" }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
