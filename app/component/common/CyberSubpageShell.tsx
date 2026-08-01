"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import cn from "clsx";
import { nameOxanium, jp } from "@/lib/fonts";
import { RankingsPageTitleCyber } from "@/app/component/rankings/RankingsPageTitleCyber";
import { GAMES_CYBER_EASE } from "@/app/component/games/cyberMotion";

/** サイバー風のはてな（グロー付き ? のみ） */
function CyberHelpMark({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "relative flex h-7 w-7 items-center justify-center",
        active && "scale-105"
      )}
      aria-hidden
    >
      <span
        className={cn(
          nameOxanium.className,
          "text-[17px] font-black italic leading-none tracking-wide transition",
          active ? "text-cyan-50" : "text-cyan-200/90"
        )}
        style={{
          textShadow: active
            ? "0 0 8px rgba(0,245,255,0.95), 0 0 18px rgba(0,245,255,0.55), 0 0 28px rgba(34,211,238,0.35)"
            : "0 0 6px rgba(0,245,255,0.55), 0 0 14px rgba(0,245,255,0.28)",
        }}
      >
        ?
      </span>
    </span>
  );
}

/** はてな説明カード本体（オーバーレイ内） */
function CyberHelpPanel({
  text,
  onClose,
}: {
  text: string;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cyber-subpage-help-title"
      className="relative w-full max-w-md overflow-hidden rounded-sm border border-[rgba(0,245,255,0.32)] bg-[#050b14] shadow-[0_0_40px_rgba(0,245,255,0.14)]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 左レール */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-3 bottom-3 w-[2px] bg-[rgba(0,245,255,0.55)] shadow-[0_0_10px_rgba(0,245,255,0.45)]"
      />
      {/* 走査線 */}
      <span
        aria-hidden
        className="cyber-help-scan pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent"
      />

      <div className="relative z-[1] px-5 pb-5 pt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex flex-1 items-center justify-center gap-2 pl-8">
            <span
              aria-hidden
              className="h-px w-6 bg-gradient-to-r from-transparent to-cyan-400/50"
            />
            <p
              id="cyber-subpage-help-title"
              className={cn(
                nameOxanium.className,
                "text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300/85"
              )}
              style={{
                textShadow: "0 0 10px rgba(0,245,255,0.45)",
              }}
            >
              Info
            </p>
            <span
              aria-hidden
              className="h-px w-6 bg-gradient-to-l from-transparent to-cyan-400/50"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center border border-[rgba(0,245,255,0.28)] bg-[rgba(0,245,255,0.06)] text-cyan-100/90 transition hover:border-[rgba(0,245,255,0.5)] hover:bg-[rgba(0,245,255,0.12)]"
            style={{
              clipPath:
                "polygon(5px 0%, 100% 0%, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0% 100%, 0% 5px)",
            }}
            aria-label="閉じる"
          >
            <X size={14} strokeWidth={2.4} />
          </button>
        </div>
        <p
          className={cn(
            jp.className,
            "mx-auto text-center text-[13px] leading-[1.7] text-white/75"
          )}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

/** はてなオーバーレイ（全サブページ共通） */
function CyberHelpOverlay({
  open,
  text,
  onClose,
  reduceMotion,
}: {
  open: boolean;
  text: string;
  onClose: () => void;
  reduceMotion: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="cyber-help-overlay"
          className="fixed inset-0 z-[1000040] flex items-center justify-center p-4"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18, ease: GAMES_CYBER_EASE }}
        >
          <button
            type="button"
            aria-label="閉じる"
            className="absolute inset-0 bg-[#020609]/78"
            onClick={onClose}
          />
          <motion.div
            className="relative z-[1] w-full max-w-md"
            initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 8, scale: 0.98 }
            }
            transition={{
              duration: reduceMotion ? 0 : 0.22,
              ease: GAMES_CYBER_EASE,
            }}
          >
            <CyberHelpPanel text={text} onClose={onClose} />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

function titleHasCjk(title: string): boolean {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(title);
}

export type CyberSubpageHeaderProps = {
  eyebrow?: string;
  title: string;
  /** 短い説明（右上 ? からオーバーレイ表示） */
  subtitle?: string;
  /**
   * 右上はてなの左に置く追加アクション（例: プレビュー用バーガー）。
   * はてなと同じ 40px タップ領域を想定。
   */
  headerTrailing?: ReactNode;
  onBack: () => void;
  /** 戻るボタンの aria-label */
  backAriaLabel?: string;
  className?: string;
};

/**
 * 左戻る · 中央サイバー題名 · 右はてな（＋任意の trailing）。
 * 試合サブページ / プロフィールメニューで共通。
 */
export function CyberSubpageHeader({
  eyebrow = "PROFILE",
  title,
  subtitle,
  headerTrailing,
  onBack,
  backAriaLabel = "戻る",
  className,
}: CyberSubpageHeaderProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const reduceMotion = useReducedMotion() === true;
  const titleVariant = titleHasCjk(title) ? "jp-chrome" : "horizon-chrome";
  const hasRightCluster = Boolean(subtitle || headerTrailing);

  return (
    <motion.div
      className={cn(
        "sticky top-0 z-30 border-b border-[rgba(0,245,255,0.14)] bg-[#050b14]/90 backdrop-blur-md supports-backdrop-filter:bg-[#050b14]/78",
        className
      )}
      initial={reduceMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: GAMES_CYBER_EASE }}
    >
      <div className="relative flex items-center gap-3 px-3 py-2.5">
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-2 bottom-2 w-[2px] bg-[rgba(0,245,255,0.55)] shadow-[0_0_10px_rgba(0,245,255,0.45)]"
        />
        <motion.button
          type="button"
          onClick={onBack}
          className="relative z-[2] flex h-10 w-10 shrink-0 items-center justify-center border border-[rgba(0,245,255,0.28)] bg-[rgba(0,245,255,0.06)] text-cyan-100 transition hover:border-[rgba(0,245,255,0.5)] hover:bg-[rgba(0,245,255,0.12)] active:scale-95"
          style={{
            clipPath:
              "polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)",
          }}
          aria-label={backAriaLabel}
          initial={reduceMotion ? false : { opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.28, ease: GAMES_CYBER_EASE, delay: 0.04 }}
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2.4} />
        </motion.button>
        <motion.div
          className={cn(
            "pointer-events-none absolute inset-0 flex flex-col items-center justify-center",
            headerTrailing && subtitle ? "px-24" : "px-14"
          )}
          initial={reduceMotion ? false : { opacity: 0, scaleX: 1.12 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.42, ease: GAMES_CYBER_EASE, delay: 0.05 }}
        >
          <p
            className={cn(
              nameOxanium.className,
              "text-[9px] font-bold uppercase tracking-[0.22em] text-cyan-300/70"
            )}
          >
            {eyebrow}
          </p>
          <h1 className="mt-0.5 truncate leading-none">
            <RankingsPageTitleCyber
              variant={titleVariant}
              title={title}
              size="sm"
            />
          </h1>
        </motion.div>
        {hasRightCluster ? (
          <motion.div
            className="relative z-[2] ml-auto flex shrink-0 items-center gap-1.5"
            initial={reduceMotion ? false : { opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.28, ease: GAMES_CYBER_EASE, delay: 0.08 }}
          >
            {headerTrailing}
            {subtitle ? (
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center transition active:scale-95"
                aria-label="説明"
                aria-expanded={helpOpen}
                aria-haspopup="dialog"
              >
                <CyberHelpMark active={helpOpen} />
              </button>
            ) : null}
          </motion.div>
        ) : (
          <div className="ml-auto h-10 w-10 shrink-0" aria-hidden />
        )}
      </div>

      {subtitle ? (
        <CyberHelpOverlay
          open={helpOpen}
          text={subtitle}
          onClose={() => setHelpOpen(false)}
          reduceMotion={reduceMotion}
        />
      ) : null}
    </motion.div>
  );
}

type ShellProps = CyberSubpageHeaderProps & {
  children: ReactNode;
  contentClassName?: string;
  /** 背景グリッド等を出さない（カード内埋め込み） */
  bare?: boolean;
};

/**
 * プロフィール / 試合サブページ共通のフルページシェル。
 */
export default function CyberSubpageShell({
  children,
  contentClassName,
  bare = false,
  ...headerProps
}: ShellProps) {
  const reduceMotion = useReducedMotion() === true;

  return (
    <main
      className={cn(
        "relative overflow-x-hidden text-white",
        bare
          ? "min-h-dvh bg-transparent pb-bottom-nav"
          : "min-h-screen bg-[#050b14] pb-bottom-nav"
      )}
    >
      {!bare ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0,245,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.04) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              maskImage:
                "radial-gradient(ellipse 80% 50% at 50% 0%, #000 20%, transparent 75%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,rgba(0,245,255,0.12),transparent_65%)]"
          />
        </>
      ) : null}

      <CyberSubpageHeader
        {...headerProps}
        className={
          bare
            ? "bg-[#050b14]/88 backdrop-blur-md supports-backdrop-filter:bg-[#050b14]/72"
            : undefined
        }
      />

      <motion.div
        className={cn(
          "relative z-[1] mx-auto w-full px-3 py-4 sm:px-4",
          contentClassName ?? "max-w-lg"
        )}
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: GAMES_CYBER_EASE, delay: 0.1 }}
      >
        {children}
      </motion.div>
    </main>
  );
}
