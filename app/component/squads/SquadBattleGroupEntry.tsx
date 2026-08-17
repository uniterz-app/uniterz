"use client";

/**
 * GROUP（コミュニティ）スロット一覧用の SQUAD BATTLE エントリー。
 * アンバー戦闘 HUD — 通常グループ枠と明確に差別化する。
 */

import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import cn from "clsx";
import { nameOxanium } from "@/lib/fonts";
import {
  CommunityCrtSectionLabel,
  communityCrtMono,
} from "@/app/component/communities/CommunityCrtTheme";
import {
  squadBattleEntryStatusChip,
  type SquadBattleUiPhase,
} from "@/lib/squads/squadBattleUiCopy";

const CHAMFER =
  "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)";
const PILL_CHAMFER =
  "polygon(3px 0%, 100% 0%, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0% 100%, 0% 3px)";

/** グループバトル公式マーク */
const SQUAD_BATTLE_ICON = "/squad-battle/icon.png";

type Props = {
  language: "ja" | "en" | string;
  /** mobile は密、web はやや広め */
  isWeb?: boolean;
  onOpen: () => void;
  className?: string;
  /** 開催フェーズ（未指定は BATTLE） */
  phase?: SquadBattleUiPhase;
  /** 自分の順位（バトル中チップ用） */
  myRank?: number | null;
  /** ENTRY 締切ラベル */
  deadlineLabel?: string | null;
};

export default function SquadBattleGroupEntry({
  language,
  isWeb = false,
  onOpen,
  className,
  phase = "battle",
  myRank = null,
  deadlineLabel = null,
}: Props) {
  const reduceMotion = useReducedMotion() === true;
  const isEn = language === "en";
  const statusChip = squadBattleEntryStatusChip({
    phase,
    myRank,
    deadlineLabel,
  });

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

        <div
          className={cn(
            "relative z-[1] flex w-full items-center gap-3",
            isWeb ? "px-4 py-3.5 pl-5" : "px-3.5 py-3 pl-4"
          )}
        >
          {/* アイコン — 枠は画像内に焼き込み済み */}
          <div
            className={cn(
              "relative shrink-0 overflow-hidden",
              isWeb ? "h-[52px] w-[52px]" : "h-11 w-11"
            )}
            style={{
              boxShadow: "0 0 18px rgba(251,191,36,0.35)",
            }}
          >
            <Image
              src={SQUAD_BATTLE_ICON}
              alt=""
              width={isWeb ? 52 : 44}
              height={isWeb ? 52 : 44}
              className="h-full w-full object-cover"
              priority={false}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
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
            <span
              className={cn(
                nameOxanium.className,
                "inline-flex w-fit items-center border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em]",
                statusChip.tone === "idle"
                  ? "border-white/20 bg-white/5 text-white/55"
                  : statusChip.tone === "entry"
                    ? "border-amber-300/45 bg-amber-400/15 text-amber-100"
                    : statusChip.tone === "reward"
                      ? "border-amber-200/50 bg-amber-300/20 text-amber-50"
                      : "border-amber-400/40 bg-amber-500/15 text-amber-50"
              )}
              style={{
                clipPath: PILL_CHAMFER,
                WebkitClipPath: PILL_CHAMFER,
              }}
            >
              {statusChip.label}
            </span>
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
