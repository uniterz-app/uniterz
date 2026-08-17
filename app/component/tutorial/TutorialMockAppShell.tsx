"use client";

/**
 * チュートリアル・スポットライト用の擬似アプリ画面。
 * data-tutorial-target でハイライト対象をマークする。
 */

import cn from "clsx";
import { nameOxanium, nameRajdhani } from "@/lib/fonts";
import { TUTORIAL_CYAN } from "@/lib/tutorial/tutorialMotion";
import { MockMatchCard } from "@/app/component/tutorial/TutorialSlideVisual";
import type { TutorialTargetId } from "@/lib/tutorial/tutorialCopy";

const CYBER_CHAMFER_CLIP =
  "polygon(5px 0%, 100% 0%, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0% 100%, 0% 5px)";

type Props = {
  /** 予想エリアを展開表示するか */
  showPredict?: boolean;
  /** パルス誘導を最初の試合カードに付ける */
  pulseFirstCard?: boolean;
  className?: string;
};

const TABS: { id: TutorialTargetId | "tab-games"; label: string }[] = [
  { id: "tab-games", label: "試合" },
  { id: "tab-result", label: "リザルト" },
  { id: "tab-rankings", label: "ランキング" },
  { id: "tab-leaderboards", label: "LB" },
  { id: "tab-profile", label: "マイ" },
];

export default function TutorialMockAppShell({
  showPredict = true,
  pulseFirstCard = false,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "relative flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#050810]",
        className
      )}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
        <span
          className={cn(
            nameOxanium.className,
            "text-[11px] font-bold uppercase tracking-[0.18em]"
          )}
          style={{ color: TUTORIAL_CYAN }}
        >
          Games
        </span>
        <span className="text-[10px] text-white/35">プレビュー用モック</span>
      </div>

      {/* 本文スクロール */}
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3 pb-20">
        <div
          data-tutorial-target="match-card"
          className={cn("relative rounded-lg", pulseFirstCard && "z-[1]")}
        >
          {/* バッジ文言は TutorialPulseHint 側。ここではカードのパルス演出のみ */}
          <MockMatchCard pulse={pulseFirstCard} />
        </div>

        {/* 2枚目のカード（非ターゲット） */}
        <div className="opacity-45">
          <MockMatchCard />
        </div>

        {showPredict ? (
          <div
            data-tutorial-target="predict-area"
            className="border border-cyan-400/25 bg-black/40 px-3 py-3"
            style={{
              clipPath: CYBER_CHAMFER_CLIP,
              WebkitClipPath: CYBER_CHAMFER_CLIP,
            }}
          >
            <div
              className={cn(
                nameOxanium.className,
                "mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-300/70"
              )}
            >
              Prediction
            </div>
            <div className="mb-2 flex gap-2">
              <div
                className="flex-1 py-2 text-center text-[11px] font-bold"
                style={{
                  background: TUTORIAL_CYAN,
                  color: "#050508",
                  clipPath: CYBER_CHAMFER_CLIP,
                  WebkitClipPath: CYBER_CHAMFER_CLIP,
                }}
              >
                HOME
              </div>
              <div
                className="flex-1 border border-white/15 py-2 text-center text-[11px] font-bold text-white/45"
                style={{
                  clipPath: CYBER_CHAMFER_CLIP,
                  WebkitClipPath: CYBER_CHAMFER_CLIP,
                }}
              >
                AWAY
              </div>
            </div>
            <p className={cn(nameRajdhani.className, "text-[12px] text-white/50")}>
              勝敗とスコアを選んで投稿
            </p>
          </div>
        ) : null}
      </div>

      {/* タブバー */}
      <div className="absolute inset-x-0 bottom-0 flex border-t border-white/10 bg-[#070b12]/95 px-1 pb-[max(6px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-md">
        {TABS.map((t) => {
          const active = t.id === "tab-games";
          const targetAttr =
            t.id === "tab-games"
              ? undefined
              : ({ "data-tutorial-target": t.id } as const);
          return (
            <div
              key={t.id}
              {...targetAttr}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-1.5",
                active ? "text-[#050508]" : "text-white/45"
              )}
            >
              <span
                className={cn(
                  nameOxanium.className,
                  "px-2 py-1 text-[9px] font-bold"
                )}
                style={
                  active
                    ? {
                        background: TUTORIAL_CYAN,
                        clipPath: CYBER_CHAMFER_CLIP,
                        WebkitClipPath: CYBER_CHAMFER_CLIP,
                      }
                    : undefined
                }
              >
                {t.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
