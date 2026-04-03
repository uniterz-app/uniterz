"use client";

import Link from "next/link";
import { jp } from "@/lib/fonts";

type Props = {
  variant: "web" | "mobile";
};

/**
 * 背景デモ専用。本番の body / bg-app には触れない。
 */
export default function HalftoneBgPreviewPage({ variant }: Props) {
  const home = variant === "web" ? "/web" : "/mobile";

  return (
    <div className={`bg-halftone-preview-demo text-white ${jp.className}`}>
      <div className="mx-auto max-w-lg space-y-6 px-4 py-10 pb-bottom-nav">
        <p className="text-[11px] font-medium uppercase tracking-wider text-cyan-300/55">
          Preview only · 本番未反映
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          青系ハーフトーン背景
        </h1>
        <p className="text-sm leading-relaxed text-white/65">
          縦方向のシアン〜ネイビーグラデに、静止のドット格子を CSS のみで重ねています。
          画像アセットは使っていません。
        </p>

        <div className="rounded-2xl border border-white/12 bg-white/5 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-[2px]">
          <p className="text-sm font-semibold text-white/90">
            UI の読みやすさサンプル
          </p>
          <p className="mt-2 text-xs text-white/55">
            実際の画面では、この上に Cyber 背景やカードが乗る想定でコントラストを確認してください。
          </p>
          <button
            type="button"
            className="mt-4 w-full rounded-xl border border-cyan-400/30 bg-cyan-500/15 py-2.5 text-sm font-semibold text-cyan-100"
          >
            ボタン見本
          </button>
        </div>

        <div className="rounded-xl border border-dashed border-white/15 bg-black/20 p-3 text-xs text-white/45">
          <p className="font-mono text-[10px] text-white/35">
            .bg-halftone-preview-demo
          </p>
          <p className="mt-1">
            気に入ったら globals.css の定義を bg-app や CyberPageBackground
            側に取り込む形で本番へ。
          </p>
        </div>

        <Link
          href={home}
          className="inline-block text-sm text-cyan-300/90 underline underline-offset-4"
        >
          {variant === "web" ? "Web ホームへ" : "モバイルホームへ"}
        </Link>
      </div>
    </div>
  );
}
