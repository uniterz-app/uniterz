"use client";

import Link from "next/link";
import DotJerseyCanvas from "@/app/component/games/DotJerseyCanvas";
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

        <section
          className="rounded-2xl border border-white/12 bg-black/25 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
          aria-label="Canvas でドット表現したユニフォームのサンプル"
        >
          <h2 className="text-sm font-semibold text-white/90">
            Canvas · ドット・ユニフォーム
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-white/50">
            NBA 用のユニフォーム SVG と同じ path をマスクにし、シルエット内だけに円を打ちます。径は擬似ライトで変化させています。
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative aspect-[87.76/114.88] w-full max-w-[16rem] overflow-hidden rounded-xl border border-white/10 bg-black/35 sm:max-w-[18rem]">
                <DotJerseyCanvas accent="#DFFE00" accentEnd="#552583" />
              </div>
              <span className="text-[10px] text-white/40">
                二色グラデ（黄→紫）
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative aspect-[87.76/114.88] w-full max-w-[16rem] overflow-hidden rounded-xl border border-white/10 bg-black/35 sm:max-w-[18rem]">
                <DotJerseyCanvas accent="#007A33" />
              </div>
              <span className="text-[10px] text-white/40">accent 例（緑）</span>
            </div>
          </div>
        </section>

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
