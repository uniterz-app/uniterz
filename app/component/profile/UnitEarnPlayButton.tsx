"use client";

/**
 * Unit 獲得演出の再生ボタン（プレビュー / デザイン確認用）。
 * プロフィール復帰直後はレイアウトが落ち着いてから play する。
 */
import { useRef, useState } from "react";
import { nameOxanium } from "@/lib/fonts";

type Props = {
  onPlay: () => void;
  disabled?: boolean;
  language?: "ja" | "en";
  /** 画面下部の固定配置 */
  floating?: boolean;
  className?: string;
};

function runAfterPaint(fn: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(fn);
  });
}

export default function UnitEarnPlayButton({
  onPlay,
  disabled = false,
  language = "ja",
  floating = false,
  className = "",
}: Props) {
  const isJa = language === "ja";
  const label = isJa ? "Unit獲得を再生" : "Play unit earn";
  const [pending, setPending] = useState(false);
  const lockedRef = useRef(false);

  function handleClick() {
    if (disabled || lockedRef.current) return;
    lockedRef.current = true;
    setPending(true);
    // 復帰直後の再レイアウト / 画像デコードと演出開始が重ならないようにする
    runAfterPaint(() => {
      try {
        onPlay();
      } finally {
        window.setTimeout(() => {
          lockedRef.current = false;
          setPending(false);
        }, 400);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || pending}
      aria-label={label}
      className={[
        nameOxanium.className,
        "unit-earn-play-btn inline-flex items-center justify-center gap-2",
        "border-2 border-[#f6c344] bg-[#f6c344] text-[#241902]",
        "px-4 py-2.5 text-[12px] font-extrabold uppercase tracking-[0.14em]",
        "shadow-[0_0_24px_rgba(246,195,68,0.35)]",
        "transition-[transform,box-shadow,opacity] duration-150",
        "hover:shadow-[0_0_32px_rgba(246,195,68,0.55)] active:scale-[0.98]",
        "disabled:pointer-events-none disabled:opacity-40",
        floating
          ? "fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-[40] w-[min(320px,calc(100%-2rem))] -translate-x-1/2"
          : "w-full",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className="grid h-5 w-5 place-items-center rounded-full bg-[#241902] text-[10px] font-black text-[#f6c344]"
        aria-hidden
      >
        U
      </span>
      {label}
    </button>
  );
}
