"use client";

import type { LucideIcon } from "lucide-react";
import cn from "clsx";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type Props = {
  onClick: () => void;
  icon: LucideIcon;
  iconSize?: number;
  children: ReactNode;
  /** 右端（未読バッジなど） */
  trailing?: ReactNode;
  /** サポート行などコンパクト */
  dense?: boolean;
  tone?: "default" | "danger";
  /** 試合カードラベルと同系のフォント（bracketMarketTeamTypography 等） */
  labelStyle?: CSSProperties;
  className?: string;
};

/**
 * Uiverse 風：ホバーでアイコン帯が横に広がり、ラベルがフェードアウト
 */
export default function SideMenuItemButton({
  onClick: onItemActivate,
  icon: Icon,
  iconSize = 18,
  children,
  trailing,
  dense = false,
  tone = "default",
  labelStyle,
  className,
}: Props) {
  const h = dense ? "min-h-10 h-10" : "min-h-12 h-12";
  const iconW = dense ? "w-9" : "w-11";
  const pl = dense ? "pl-11" : "pl-14";
  const textSize = dense ? "text-xs" : "text-sm";
  const sz = dense ? Math.max(14, iconSize - 2) : iconSize;

  /** タッチ時に hover と同じ見た目（離した後も transition 分だけ維持） */
  const [touchShow, setTouchShow] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** タッチで pointerup 済みのとき、遅れて来る click を無視（1 タップで確実に反応） */
  const touchActivatedRef = useRef(false);
  const TOUCH_HOLD_MS = 520;

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (e.pointerType !== "touch") return;
      clearHideTimer();
      setTouchShow(true);
    },
    [clearHideTimer]
  );

  const scheduleTouchHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setTouchShow(false);
      hideTimerRef.current = null;
    }, TOUCH_HOLD_MS);
  }, [clearHideTimer]);

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (e.pointerType !== "touch") return;
      touchActivatedRef.current = true;
      onItemActivate();
      scheduleTouchHide();
      window.setTimeout(() => {
        touchActivatedRef.current = false;
      }, 450);
    },
    [onItemActivate, scheduleTouchHide]
  );

  const onButtonClick = useCallback(() => {
    if (touchActivatedRef.current) return;
    onItemActivate();
  }, [onItemActivate]);

  const onPointerCancel = useCallback(() => {
    clearHideTimer();
    setTouchShow(false);
  }, [clearHideTimer]);

  return (
    <button
      type="button"
      data-show={touchShow ? "1" : undefined}
      onClick={onButtonClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className={cn(
        "group relative w-full touch-manipulation overflow-hidden rounded-xl border border-white/10",
        "bg-[#070d14]/95 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        "transition-all duration-500 ease-in-out",
        tone === "default" &&
          "hover:border-cyan-300/35 hover:shadow-[0_0_22px_rgba(34,211,238,0.1)] data-[show=1]:border-cyan-300/35 data-[show=1]:shadow-[0_0_22px_rgba(34,211,238,0.1)]",
        tone === "danger" &&
          "hover:border-rose-400/40 hover:shadow-[0_0_20px_rgba(251,113,133,0.14)] data-[show=1]:border-rose-400/40 data-[show=1]:shadow-[0_0_20px_rgba(251,113,133,0.14)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/35",
        "active:brightness-[0.97]",
        h,
        className
      )}
      style={labelStyle}
    >
      <span
        className={cn(
          "pointer-events-none absolute inset-y-1 left-1 flex items-center justify-center rounded-lg",
          "bg-white/[0.07] transition-all duration-500 ease-in-out",
          "group-hover:w-[calc(100%-8px)] group-data-[show=1]:w-[calc(100%-8px)]",
          iconW,
          tone === "default" &&
            "group-hover:bg-linear-to-r group-hover:from-cyan-400/22 group-hover:to-sky-500/12 group-data-[show=1]:bg-linear-to-r group-data-[show=1]:from-cyan-400/22 group-data-[show=1]:to-sky-500/12",
          tone === "danger" &&
            "group-hover:bg-linear-to-r group-hover:from-rose-500/28 group-hover:to-rose-600/12 group-data-[show=1]:bg-linear-to-r group-data-[show=1]:from-rose-500/28 group-data-[show=1]:to-rose-600/12"
        )}
      >
        <Icon
          size={sz}
          className={cn(
            "shrink-0 transition-transform duration-300 ease-out",
            "text-cyan-200/90 group-hover:text-cyan-50 group-data-[show=1]:text-cyan-50",
            tone === "danger" &&
              "text-rose-200/95 group-hover:text-rose-50 group-data-[show=1]:text-rose-50",
            "group-active:scale-[0.85]"
          )}
          strokeWidth={2}
        />
      </span>
      <span
        className={cn(
          "relative z-10 flex h-full min-w-0 flex-1 items-center justify-between gap-2",
          pl,
          "pr-3 md:pr-4",
          textSize,
          "font-bold"
        )}
      >
        {/* 未読バッジ等の trailing はフェードさせない（全体 opacity-0 で見えなくなっていた） */}
        <span className="min-w-0 flex-1 truncate text-left leading-tight transition-opacity duration-500 ease-in-out group-hover:opacity-0 group-data-[show=1]:opacity-0">
          {children}
        </span>
        {trailing ? (
          <span className="relative z-20 shrink-0">{trailing}</span>
        ) : null}
      </span>
    </button>
  );
}
