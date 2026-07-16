"use client";

/**
 * /dev/season-standings-preview
 * NBA シーズン順位予想 UI（East/West 1–15・チーム1回制限・本番未接続）
 */

import { useState } from "react";
import Link from "next/link";
import NbaSeasonStandingsPredictPanel from "@/app/component/predict/season/NbaSeasonStandingsPredictPanel";
import {
  emptySeasonStandingsPrediction,
  isSeasonStandingsComplete,
  type NbaSeasonStandingsPrediction,
} from "@/lib/predict/nbaSeasonStandingsPredict";
import { jp, nameOxanium } from "@/lib/fonts";

const SEASON = "2026-27";

export default function SeasonStandingsPreviewPage() {
  const [pred, setPred] = useState<NbaSeasonStandingsPrediction>(() =>
    emptySeasonStandingsPrediction(SEASON)
  );
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="min-h-screen bg-[#050b14] px-3 py-6 text-white sm:px-4">
      <div className="mx-auto max-w-lg space-y-4">
        <header className="space-y-2">
          <p
            className={[
              nameOxanium.className,
              "text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/70",
            ].join(" ")}
          >
            Dev preview
          </p>
          <h1 className={[jp.className, "text-xl font-bold text-white"].join(" ")}>
            シーズン順位予想
          </h1>
          <p className="text-xs leading-relaxed text-white/50">
            East / West 各 1〜15 位。同じチームは同じカンファレンス内で二度使えない。
            本番はシーズン終了後に公式順位と照合してポイント付与。
          </p>
          <p className="text-[11px] text-white/40">
            URL:{" "}
            <code className="text-cyan-300/80">/dev/season-standings-preview</code>
            {" · "}
            <Link
              href="/mobile/season-awards-preview"
              className="text-amber-200/80 underline-offset-2 hover:underline"
            >
              アワード予想
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

        <NbaSeasonStandingsPredictPanel
          value={pred}
          onChange={(next) => {
            setPred(next);
            setSubmitted(false);
          }}
          onSubmit={() => {
            if (!isSeasonStandingsComplete(pred)) return;
            setSubmitted(true);
          }}
        />

        {submitted ? (
          <p
            className={[
              nameOxanium.className,
              "border border-[#2DFF6E]/35 bg-[#2DFF6E]/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#2DFF6E]/90",
            ].join(" ")}
          >
            Preview submit ok · Firestore 未接続
          </p>
        ) : null}
      </div>
    </main>
  );
}
