"use client";

/**
 * /dev/season-awards-preview
 * NBA シーズンアワード予想 — 人気ピック + 前方一致（名簿は mock・API 後差し替え）
 */

import { useState } from "react";
import Link from "next/link";
import NbaSeasonAwardsPredictPanel from "@/app/component/predict/season/NbaSeasonAwardsPredictPanel";
import {
  emptySeasonAwardsPrediction,
  type NbaSeasonAwardsPrediction,
} from "@/lib/predict/nbaSeasonAwardsPredict";
import { jp, nameOxanium } from "@/lib/fonts";

const SEASON = "2026-27";

export default function SeasonAwardsPreviewPage() {
  const [value, setValue] = useState<NbaSeasonAwardsPrediction>(() =>
    emptySeasonAwardsPrediction(SEASON)
  );

  return (
    <main className="min-h-screen bg-[#050b14] px-3 py-6 text-white sm:px-4">
      <div className="mx-auto max-w-lg space-y-4">
        <header className="space-y-2">
          <p
            className={[
              nameOxanium.className,
              "text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/70",
            ].join(" ")}
          >
            Dev preview
          </p>
          <h1 className={[jp.className, "text-xl font-bold text-white"].join(" ")}>
            シーズンアワード予想
          </h1>
          <p className="text-xs leading-relaxed text-white/50">
            最初は他ユーザーが選んでいる候補が約 5 人。名前を打つと前方一致で絞り込み。
            実名簿は API 契約後。
          </p>
          <p className="text-[11px] text-white/40">
            URL:{" "}
            <code className="text-amber-200/80">/dev/season-awards-preview</code>
            {" · "}
            <Link
              href="/mobile/season-standings-preview"
              className="text-cyan-300/80 underline-offset-2 hover:underline"
            >
              順位予想
            </Link>
            {" · "}
            <Link
              href="/mobile/season-picks-view-preview"
              className="text-white/55 underline-offset-2 hover:underline"
            >
              提出後ビュー
            </Link>
            {" · "}
            <Link
              href="/mobile/season-preview"
              className="text-cyan-300/55 underline-offset-2 hover:underline"
            >
              一覧
            </Link>
          </p>
        </header>

        <NbaSeasonAwardsPredictPanel value={value} onChange={setValue} />
      </div>
    </main>
  );
}
