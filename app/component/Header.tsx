"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import {
  resolveHeaderWordmark,
  type HeaderWordmark,
} from "@/lib/ui/headerWordmark";

type Props = {
  /** 未指定時は pathname から自動判定 */
  title?: HeaderWordmark;
};

export default function Header({ title }: Props) {
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();
  const wordmark = title ?? resolveHeaderWordmark(pathname);
  const wordmarkLetters = wordmark.split("");

  return (
    <header className="relative z-10 overflow-hidden px-6 py-2 md:px-10 md:py-4 text-white">
      {/* 背景は透過させ、上端だけうっすら暗くして文字の可読性を確保 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.10) 60%, rgba(0,0,0,0) 100%)",
        }}
        aria-hidden
      />

      {/* container */}
      <div className="relative mx-auto flex w-full max-w-[520px] flex-col items-center gap-0.5 md:max-w-[900px] lg:max-w-[1200px]">
        {/* UNITERZ：サイドアクセント + レター入場 */}
        <div className="flex w-full items-center justify-center gap-3 md:gap-4">
          {/* 左アクセント（線 + ダイヤ） */}
          <motion.div
            className="hidden h-px max-w-[110px] flex-1 origin-right bg-gradient-to-l from-cyan-200/45 to-transparent sm:block"
            initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}
            aria-hidden
          />
          <motion.div
            className="hidden h-1.5 w-1.5 rotate-45 border border-cyan-200/55 sm:block"
            initial={reduceMotion ? false : { opacity: 0, scale: 0 }}
            animate={{ opacity: 0.7, scale: 1 }}
            transition={{ delay: 0.55, duration: 0.4, ease: "easeOut" }}
            style={{ boxShadow: "0 0 6px rgba(103,232,249,0.45)" }}
            aria-hidden
          />

          {/* ワードマーク */}
          <div
            key={wordmark}
            className="relative text-[22px] tracking-[0.35em] md:text-[28px]"
            style={{ fontFamily: "Bebas Neue" }}
            aria-label={wordmark}
          >
            <div
              className="text-orange-100/85"
              style={{ textShadow: "0 0 22px rgba(103,232,249,0.16)" }}
              aria-hidden
            >
              {wordmarkLetters.map((ch, i) => (
                <motion.span
                  key={`${wordmark}-${i}`}
                  className="inline-block"
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.08 + i * 0.055,
                    duration: 0.5,
                    ease: [0.22, 0.61, 0.36, 1],
                  }}
                >
                  {ch}
                </motion.span>
              ))}
            </div>
            {/* 時折ハイライトが走るシマー層 */}
            {!reduceMotion && (
              <div
                className="header-wordmark-shimmer pointer-events-none absolute inset-0"
                aria-hidden
              >
                {wordmark}
              </div>
            )}
          </div>

          {/* 右アクセント（ダイヤ + 線） */}
          <motion.div
            className="hidden h-1.5 w-1.5 rotate-45 border border-cyan-200/55 sm:block"
            initial={reduceMotion ? false : { opacity: 0, scale: 0 }}
            animate={{ opacity: 0.7, scale: 1 }}
            transition={{ delay: 0.55, duration: 0.4, ease: "easeOut" }}
            style={{ boxShadow: "0 0 6px rgba(103,232,249,0.45)" }}
            aria-hidden
          />
          <motion.div
            className="hidden h-px max-w-[110px] flex-1 origin-left bg-gradient-to-r from-cyan-200/45 to-transparent sm:block"
            initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}
            aria-hidden
          />
        </div>

        {/* cyber line + light sweep（常時ループはここだけ） */}
        <div className="relative w-full">
          <motion.div
            className="relative z-1 h-[2px] w-full overflow-hidden rounded-full"
            initial={reduceMotion ? false : { scaleX: 0.1, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-cyan-300 to-transparent opacity-95" />
            {!reduceMotion ? (
              <div
                className="animate-header-cyber-sweep pointer-events-none absolute inset-y-0 left-0 w-[42%] max-w-[220px] opacity-90 will-change-transform"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 35%, rgba(224,255,255,0.95) 50%, rgba(255,255,255,0.35) 65%, transparent 100%)",
                }}
                aria-hidden
              />
            ) : null}
          </motion.div>
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[2px] bg-linear-to-r from-transparent via-cyan-300 to-transparent opacity-65 blur-sm"
            aria-hidden
          />
        </div>
      </div>
    </header>
  );
}
