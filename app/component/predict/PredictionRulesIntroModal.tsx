"use client";

import { useEffect, type ReactNode } from "react";
import { jp } from "@/lib/fonts";

type Props = {
  open: boolean;
  isEn: boolean;
  onStart: () => void;
  onCancel: () => void;
};

function Em({ children }: { children: ReactNode }) {
  return (
    <span className="font-semibold text-cyan-200/95 [text-shadow:0_0_24px_rgba(34,211,238,0.12)]">
      {children}
    </span>
  );
}

/** 配点の数値（+4 など）は黄色で統一 */
function Num({ children }: { children: ReactNode }) {
  return (
    <span className="font-semibold tabular-nums text-yellow-300">{children}</span>
  );
}

function Zero({ children }: { children: ReactNode }) {
  return (
    <span className="font-semibold tabular-nums text-rose-300/85">{children}</span>
  );
}

function JaRulesBody() {
  return (
    <ul className="space-y-2 text-[10px] leading-relaxed text-white/72 sm:text-[11px]">
      <li className="rounded-lg border border-white/[0.07] bg-linear-to-r from-rose-500/6 to-transparent px-2.5 py-2">
        <Em>勝者を外した</Em>試合は <Zero>0点</Zero> です（基本点もボーナスも付きません）。
      </li>
      <li className="space-y-1.5 rounded-lg border border-white/[0.07] bg-linear-to-r from-cyan-500/7 to-transparent px-2.5 py-2">
        <p>
          <Em>勝者を当てた</Em>ら、まず <Num>+4点</Num>。
        </p>
        <p>
          <Em>点差</Em>（実際の得失点差と、予想した得失点差のズレ）: ズレが小さいほど高く{" "}
          <Num>0〜4点</Num>。ぴったり一致なら <Num>+4点</Num>。
        </p>
        <p>
          <Em>両チームの合計得点</Em>（ホーム＋アウェイの合計）のズレ: <Num>最大+2点</Num>
          。合計が近いほど高く、ズレが大きいと <Num>+1</Num> や <Num>0</Num> になります。
        </p>
        <p>
          上記３つを足した <Em>基本点</Em>の上限は <Num>10点</Num> です。
        </p>
        <p className="border-t border-white/10 pt-1.5 text-white/68">
          <Em>ボーナス</Em>（基本点に上乗せ）: <Em>アップセット</Em> <Num>+2点</Num>。
          <Em>連勝</Em>は <Num>3〜4連勝で+1</Num>、<Num>5〜6で+2</Num>、
          <Num>7連勝以上で+3</Num>（<Num>2連勝以下</Num>は <Num>0</Num>）。
        </p>
      </li>
      <li className="rounded-lg border border-white/[0.07] bg-linear-to-r from-violet-500/6 to-transparent px-2.5 py-2">
        全試合の得点を足したものが<Em>総合スコア</Em>。ランキングはこの累計順です。
      </li>
    </ul>
  );
}

function EnRulesBody() {
  return (
    <ul className="space-y-2 text-[10px] leading-relaxed text-white/72 sm:text-[11px]">
      <li className="rounded-lg border border-white/[0.07] bg-linear-to-r from-rose-500/6 to-transparent px-2.5 py-2">
        If you miss the <Em>winner</Em>, that game scores <Zero>0</Zero> (no base, no bonuses).
      </li>
      <li className="space-y-1.5 rounded-lg border border-white/[0.07] bg-linear-to-r from-cyan-500/7 to-transparent px-2.5 py-2">
        <p>
          Get the <Em>winner</Em> right: <Num>+4</Num> first.
        </p>
        <p>
          <Em>Margin</Em> (error between predicted and actual point differential):{" "}
          <Num>0–4</Num> pts—smaller error scores higher; exact match = <Num>+4</Num>.
        </p>
        <p>
          <Em>Combined total goals</Em> (home+away) closeness: up to <Num>+2</Num>; farther off drops
          to <Num>+1</Num> or <Num>0</Num>.
        </p>
        <p>
          Those three parts sum to <Em>base points</Em>, capped at <Num>10</Num>.
        </p>
        <p className="border-t border-white/10 pt-1.5 text-white/68">
          <Em>Bonuses</Em> (on top of base): <Em>upset</Em> <Num>+2</Num>.{" "}
          <Em>Win streak</Em>: <Num>+1</Num> at 3–4, <Num>+2</Num> at 5–6, <Num>+3</Num> at 7+ (
          <Num>0</Num> under 3).
        </p>
      </li>
      <li className="rounded-lg border border-white/[0.07] bg-linear-to-r from-violet-500/6 to-transparent px-2.5 py-2">
        Sum of all game points = your <Em>total score</Em>. Rankings order that cumulative total.
      </li>
    </ul>
  );
}

export default function PredictionRulesIntroModal({
  open,
  isEn,
  onStart,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const t = isEn
    ? {
        foot: "Rankings update on a schedule—see the Rankings tab.",
        start: "Start predicting",
        cancel: "Close",
      }
    : {
        foot: "更新タイミングなどはランキング画面をご確認ください。",
        start: "予想を始める",
        cancel: "閉じる",
      };

  return (
    <div
      className="fixed inset-0 z-100020 overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal
      aria-labelledby="rules-intro-title"
    >
      {/* min-h-full + items-center でビューポート内の縦中央を安定させる（長文時は外側スクロール） */}
      <div
        className="flex min-h-full w-full items-center justify-center bg-black/75 p-3 sm:p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onCancel();
        }}
      >
        <div
          className={`my-4 flex max-h-[min(520px,88dvh)] w-full max-w-sm flex-col rounded-2xl border border-white/15 bg-[#0c1419] shadow-xl shadow-black/40 sm:max-w-md ${jp.className}`}
          onClick={(e) => e.stopPropagation()}
        >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
          <h2
            id="rules-intro-title"
            className="mb-3 text-center text-[12px] font-bold leading-snug text-white sm:text-[14px]"
          >
            {isEn ? (
              <>
                <span className="text-white">Total score — </span>
                <span className="bg-linear-to-r from-cyan-200 to-teal-300 bg-clip-text text-transparent">
                  how it’s calculated
                </span>
              </>
            ) : (
              <>
                <span className="text-white">総合スコア</span>
                <span className="text-white/40"> · </span>
                <span className="bg-linear-to-r from-cyan-200 to-teal-300 bg-clip-text text-transparent">
                  計算ロジック
                </span>
              </>
            )}
          </h2>

          <div className="mb-3 h-px w-full bg-linear-to-r from-transparent via-cyan-400/25 to-transparent" />

          {isEn ? <EnRulesBody /> : <JaRulesBody />}

          <p className="mt-3 border-l-2 border-cyan-400/30 pl-2.5 text-[10px] leading-relaxed text-white/45 sm:text-[11px]">
            {t.foot}
          </p>
        </div>

        <div className="shrink-0 border-t border-white/10 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onStart}
            className="mb-2 w-full rounded-lg border border-cyan-400/40 bg-cyan-400 py-2 text-[11px] font-bold text-black sm:text-xs"
          >
            {t.start}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-lg border border-white/15 py-2 text-[10px] font-medium text-white/75 sm:text-[11px]"
          >
            {t.cancel}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
