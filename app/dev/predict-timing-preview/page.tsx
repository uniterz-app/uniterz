"use client";

/**
 * /dev/predict-timing-preview
 *
 * 柱 3「タイミング」の UI 検討用。
 * 実際の予想オーバーレイ（試合カード + 市場棒 + Pro Info + タブ + スコア予想）の上に
 * Pro 情報がどう載るかを mock で確認する。API / 本番フォームは未接続。
 */

import { useMemo, useState } from "react";
import PredictTimingOverlayPreview from "@/app/component/predict/dev/PredictTimingOverlayPreview";
import { PREDICT_TIMING_PREVIEW_PRESETS } from "@/lib/predict/predictTimingPreviewMocks";
import { jp, nameOxanium } from "@/lib/fonts";

export default function PredictTimingPreviewPage() {
  const [presetId, setPresetId] = useState(PREDICT_TIMING_PREVIEW_PRESETS[0]!.id);
  const [language, setLanguage] = useState<"ja" | "en">("ja");
  const [isPro, setIsPro] = useState(true);
  const [showDevNotes, setShowDevNotes] = useState(false);

  const preset = useMemo(
    () =>
      PREDICT_TIMING_PREVIEW_PRESETS.find((p) => p.id === presetId) ??
      PREDICT_TIMING_PREVIEW_PRESETS[0]!,
    [presetId]
  );

  return (
    <div className="min-h-screen bg-app px-2 py-6 sm:px-3 sm:py-8">
      <div className="mx-auto w-full max-w-xl space-y-5">
        <header>
          <p
            className={[
              nameOxanium.className,
              "text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/60",
            ].join(" ")}
          >
            Dev preview
          </p>
          <h1 className={`${jp.className} mt-1 text-xl font-bold text-white`}>
            予想オーバーレイ × Pro Info（NBA）
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            {language === "ja" ? (
              <>
                NBA の試合一覧から開く
                <strong className="font-semibold text-white/75">予想オーバーレイ</strong>
                の上に、<strong className="font-semibold text-white/75">Pro Insight</strong>
                （MATCHUP / SCHEDULE / CONTEXT）を載せるイメージを確認します。
                データはすべて mock です。
              </>
            ) : (
              <>
                Preview how <strong className="font-semibold text-white/75">Pro Insight</strong>{" "}
                (MATCHUP / SCHEDULE / CONTEXT) sits on the NBA predict overlay. All mock data.
              </>
            )}
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          {PREDICT_TIMING_PREVIEW_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPresetId(p.id)}
              className={[
                "rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition",
                presetId === p.id
                  ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-100"
                  : "border-white/12 bg-white/5 text-white/60 hover:bg-white/8",
              ].join(" ")}
            >
              {p.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-white/45">{preset.description}</p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLanguage("ja")}
            className={`rounded-lg border px-3 py-1 text-xs ${language === "ja" ? "border-white/30 bg-white/15 text-white" : "border-white/10 text-white/50"}`}
          >
            日本語
          </button>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`rounded-lg border px-3 py-1 text-xs ${language === "en" ? "border-white/30 bg-white/15 text-white" : "border-white/10 text-white/50"}`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setIsPro(true)}
            className={`rounded-lg border px-3 py-1 text-xs ${isPro ? "border-amber-300/50 bg-amber-500/15 text-amber-100" : "border-white/10 text-white/50"}`}
          >
            Pro
          </button>
          <button
            type="button"
            onClick={() => setIsPro(false)}
            className={`rounded-lg border px-3 py-1 text-xs ${!isPro ? "border-white/30 bg-white/15 text-white" : "border-white/10 text-white/50"}`}
          >
            Free
          </button>
        </div>

        <PredictTimingOverlayPreview
          preset={preset}
          language={language}
          isPro={isPro}
        />

        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-xs leading-relaxed text-white/50">
          <p className="font-semibold text-white/70">
            {language === "ja" ? "このプレビューで見ていること" : "What this preview shows"}
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              {language === "ja"
                ? "上段: 試合カード + 偏りバー（全員 Free / 同帯 Pro）"
                : "Top: match card + bias bars (all Free / band Pro)"}
            </li>
            <li>
              {language === "ja"
                ? "Pro Insight: HOME/AWAY（MATCHUP · SCHEDULE · CONTEXT）"
                : "Pro Insight: HOME/AWAY (Matchup · Schedule · Context)"}
            </li>
            <li>
              {language === "ja"
                ? "SCHEDULE: B2B・3-in-4・移動・連戦・休養・前試合分など"
                : "SCHEDULE: B2B · 3-in-4 · travel · streaks · rest · prior minutes"}
            </li>
            <li>
              {language === "ja"
                ? "CONTEXT: 直近相手の強さ（格下続き / 格上未勝利 / SOS）"
                : "CONTEXT: recent opponent strength (soft stretch / vs Top / SOS)"}
            </li>
            <li>
              {language === "ja"
                ? "Team Stats: LAST 10 / SEASON（Free）+ SZN・#順位（Pro）"
                : "Team Stats: LAST 10 / SEASON (Free) + SZN · #rank (Pro)"}
            </li>
            <li>
              {language === "ja"
                ? "下段: スコア予想フォーム（Pro Info はフォーム外・上に集約）"
                : "Bottom: score form (Pro Info sits above, outside the form)"}
            </li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => setShowDevNotes((v) => !v)}
          className="text-[11px] text-white/35 underline-offset-2 hover:text-white/55 hover:underline"
        >
          {showDevNotes
            ? language === "ja"
              ? "開発メモを隠す"
              : "Hide dev notes"
            : language === "ja"
              ? "開発メモを表示"
              : "Show dev notes"}
        </button>

        {showDevNotes ? (
          <section className="rounded-xl border border-white/8 bg-black/30 p-3 text-[11px] text-white/40">
            <p>
              Phase A — mock only. Phase B: context_cache. Phase C: L2 API + L3.
              Phase D: PredictionFormV2 + ScheduleList overlay.
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
