"use client";

/**
 * GROUP（コミュニティ）スロット一覧用の SQUAD BATTLE エントリー。
 * アンバー戦闘 HUD — 通常グループ枠と明確に差別化する。
 */

import { ChevronRight, Swords } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import cn from "clsx";
import { nameOxanium } from "@/lib/fonts";
import {
  CommunityCrtSectionLabel,
  communityCrtMono,
} from "@/app/component/communities/CommunityCrtTheme";

const CHAMFER =
  "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)";
const ICON_CHAMFER =
  "polygon(5px 0%, 100% 0%, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0% 100%, 0% 5px)";
const PILL_CHAMFER =
  "polygon(3px 0%, 100% 0%, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0% 100%, 0% 3px)";

type Props = {
  language: "ja" | "en" | string;
  /** mobile は密、web はやや広め */
  isWeb?: boolean;
  onOpen: () => void;
  className?: string;
};

export default function SquadBattleGroupEntry({
  language,
  isWeb = false,
  onOpen,
  className,
}: Props) {
  const reduceMotion = useReducedMotion() === true;
  const isEn = language === "en";

  return (
    <section className={cn(communityCrtMono.className, className)}>
      <CommunityCrtSectionLabel large accent="amber">
        {isEn ? ">> SQUAD BATTLE" : ">> スクワッドバトル"}
      </CommunityCrtSectionLabel>

      <motion.button
        type="button"
        onClick={onOpen}
        className={cn(
          "group relative flex w-full items-center overflow-hidden text-left transition",
          "active:brightness-95",
          isWeb ? "min-h-[104px]" : "min-h-[96px]"
        )}
        style={{
          clipPath: CHAMFER,
          WebkitClipPath: CHAMFER,
          background:
            "linear-gradient(118deg, rgba(62,42,10,0.98) 0%, rgba(14,10,4,0.99) 42%, rgba(36,16,8,0.96) 78%, rgba(18,10,6,0.99) 100%)",
          boxShadow:
            "0 0 0 1px rgba(251,191,36,0.55), 0 0 36px rgba(251,191,36,0.22), 0 12px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,236,179,0.16)",
        }}
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
        whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      >
        {/* 斜めハイライト面 */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(145deg, rgba(255,236,179,0.14) 0%, rgba(255,236,179,0.03) 22%, transparent 48%)",
          }}
        />

        {/* 微細グリッド */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(251,191,36,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.2) 1px, transparent 1px)",
            backgroundSize: "14px 14px",
            maskImage:
              "linear-gradient(90deg, rgba(0,0,0,0.55), transparent 70%)",
            WebkitMaskImage:
              "linear-gradient(90deg, rgba(0,0,0,0.55), transparent 70%)",
          }}
        />

        {/* 走査線 */}
        {!reduceMotion ? (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-200/70 to-transparent"
            initial={{ top: "8%", opacity: 0 }}
            animate={{ top: ["8%", "88%"], opacity: [0, 0.85, 0] }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ) : null}

        {/* 左の発光レール */}
        <span
          aria-hidden
          className="absolute bottom-3 left-0 top-3 w-[3px]"
          style={{
            background:
              "linear-gradient(180deg, transparent, #FBBF24 18%, #FDE68A 50%, #FBBF24 82%, transparent)",
            boxShadow: "0 0 14px rgba(251,191,36,0.85)",
          }}
        />

        <div
          className={cn(
            "relative z-[1] flex w-full items-center gap-3",
            isWeb ? "px-4 py-3.5 pl-5" : "px-3.5 py-3 pl-4"
          )}
        >
          {/* アイコン */}
          <div className="relative flex shrink-0 items-center justify-center">
            <span
              aria-hidden
              className="absolute -inset-1 rounded-sm opacity-70 blur-[6px]"
              style={{ background: "rgba(251,191,36,0.28)" }}
            />
            <div
              className={cn(
                "relative flex items-center justify-center border border-amber-300/55",
                isWeb ? "h-[52px] w-[52px]" : "h-11 w-11"
              )}
              style={{
                clipPath: ICON_CHAMFER,
                WebkitClipPath: ICON_CHAMFER,
                background:
                  "linear-gradient(160deg, rgba(251,191,36,0.28) 0%, rgba(20,12,4,0.95) 55%, rgba(80,40,8,0.55) 100%)",
                boxShadow:
                  "inset 0 0 0 1px rgba(253,230,138,0.2), 0 0 18px rgba(251,191,36,0.35)",
              }}
            >
              <Swords
                className="text-amber-100 drop-shadow-[0_0_8px_rgba(251,191,36,0.7)]"
                size={isWeb ? 24 : 20}
                strokeWidth={1.7}
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center">
            <p
              className={cn(
                nameOxanium.className,
                "font-black uppercase leading-none tracking-[0.16em] text-[#FFF8E7]",
                isWeb ? "text-[17px]" : "text-[15px]"
              )}
              style={{
                textShadow:
                  "0 0 18px rgba(251,191,36,0.55), 0 0 2px rgba(255,248,231,0.8)",
              }}
            >
              Squad Battle
            </p>
          </div>

          <span
            className={cn(
              nameOxanium.className,
              "inline-flex h-9 shrink-0 items-center justify-center gap-0.5 border border-amber-300/55 bg-amber-400/20 px-2.5 text-[10px] font-black uppercase leading-none tracking-[0.16em] text-amber-50 transition group-hover:bg-amber-400/30"
            )}
            style={{
              clipPath: PILL_CHAMFER,
              WebkitClipPath: PILL_CHAMFER,
              boxShadow: "0 0 16px rgba(251,191,36,0.25)",
            }}
          >
            Enter
            <ChevronRight size={13} strokeWidth={2.8} className="shrink-0" />
          </span>
        </div>
      </motion.button>
    </section>
  );
}
