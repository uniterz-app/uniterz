"use client";

/**
 * SQUAD BATTLE（グループ対抗戦）UI プレビュー。
 * モック専用 — 本番 API 未接続。
 */

import { useEffect, useMemo, useState, createContext, useContext, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import {
  Users,
  Plus,
  Ticket,
  X,
  Check,
  UserRound,
  Clock,
  ChevronDown,
  Crown,
  ChevronLeft,
  ChevronRight,
  Copy,
  RotateCcw,
  Pencil,
  Menu,
  History,
  Mail,
} from "lucide-react";
import { createPortal } from "react-dom";
import cn from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import CyberSubpageShell from "@/app/component/common/CyberSubpageShell";
import CyberMenuButton from "@/app/component/ui/CyberMenuButton";
import { GAMES_CYBER_EASE } from "@/app/component/games/cyberMotion";
import { GAMES_HEADER_CONTROL_H_LG } from "@/lib/ui/gamesHeaderBar";
import SquadBattleIntroOverlay, {
  clearSquadBattleIntroSeen,
  hasSeenSquadBattleIntro,
} from "@/app/component/squads/SquadBattleIntroOverlay";
import { nameOxanium, nameRajdhani, nameBebas, jp, cyberNumberDisplay } from "@/lib/fonts";
import {
  SQUAD_BATTLE_HELP_TEXT,
  SQUAD_BATTLE_MAX_MEMBERS,
  SQUAD_BATTLE_MIN_MEMBERS,
  SQUAD_BATTLE_MAX_PENDING_APPLICATIONS,
  SQUAD_BATTLE_MOCK_INVITE_CODE,
  SQUAD_BATTLE_NAME_MAX_LEN,
  SQUAD_BATTLE_OPEN_PAGE_SIZE,
  SQUAD_BATTLE_PREVIEW_STATES,
  SQUAD_BATTLE_SEASON_PHASES,
  countActiveMembers,
  getSquadBattleMock,
  squadMemberToProfile,
  squadRankDelta,
  type OpenSquadListing,
  type PastSquadHistoryMock,
  type Squad,
  type SquadApplicantProfile,
  type SquadBattlePreviewState,
  type SquadIncomingInviteMock,
  type SquadJoinRequest,
  type SquadMember,
} from "@/lib/squads/squadBattleMock";
import type { GroupBattlePastSquadItem } from "@/lib/groupBattles/types";
import {
  SQUAD_FIRST_AVATAR_FADE_S,
  SQUAD_FIRST_FADE_IN_EASE,
  SQUAD_FIRST_FADE_IN_S,
  SQUAD_FIRST_FOOTER_FADE_S,
  squadFirstAvatarDelayS,
  squadFirstFooterDelayS,
} from "@/lib/squads/squadFirstPlaceMotion";
import { CyberSlantedSegBar } from "@/app/component/rankings/CyberSlantedSegBar";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import { cyberRankPalette } from "@/lib/rankings/cyberRankVisual";
import { formatListMetricDayDelta } from "@/lib/rankings/listRowMetricMeta";
import CyberNumber from "@/app/component/ui/CyberNumber";
import { copyTextToClipboard } from "@/lib/clipboard/copyText";
import {
  RankingsCyberPanel,
} from "@/app/component/rankings/RankingsCyberPanel";
import { rankingsCardShellStyle, podiumMedalAccent } from "@/lib/rankings/rankingsCyberTheme";
import {
  SQUAD_GOLD,
  SQUAD_GOLD_CHAMFER,
  SQUAD_GOLD_MEDALLION,
} from "@/lib/squads/squadBattleGoldTheme";
import {
  SQUAD_BATTLE_BOARD_STATUS_HINT,
  SQUAD_BATTLE_MOCK_DEADLINE_LABEL,
  SQUAD_BATTLE_REWARD_RESULT_MOCK,
  SQUAD_BATTLE_UI_PHASE_OPTIONS,
  SQUAD_BATTLE_WEEK_OPTIONS,
  squadBattlePhaseBanner,
  squadMemberCountLabel,
  squadScoreGaps,
  type SquadBattleUiPhase,
  type SquadBattleWeekIndex,
} from "@/lib/squads/squadBattleUiCopy";

/** 行入場のスタッガー（秒） */
const LB_ROW_STAGGER_S = 0.04;

/** GOLD LEGION — 10px 角切り */
const CYBER_CHAMFER_CLIP = SQUAD_GOLD_CHAMFER;

const chamferStyle = {
  clipPath: CYBER_CHAMFER_CLIP,
  WebkitClipPath: CYBER_CHAMFER_CLIP,
} as const;

/** タブバッジが clipPath で切れないよう notch を外したシェル */
function squadCardShellStyleNoClip(
  tone: "default" | "subtle" = "subtle"
): CSSProperties {
  const { clipPath: _clip, WebkitClipPath: _webkitClip, ...rest } =
    rankingsCardShellStyle(tone);
  return rest;
}

/** カード上辺に乗るタブ — absolute だと親 overflow で切れるためフロー配置 */
function SquadCardTabBadge({ label }: { label: string }) {
  return (
    <div
      className="relative z-20 ml-3 inline-flex items-center gap-1.5 border border-amber-300/55 bg-[#0A0805] px-2 py-0.5"
      style={chamferStyle}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_6px_#FBBF24]"
      />
      <span
        className={cn(
          nameOxanium.className,
          "text-[9px] font-black uppercase tracking-[0.16em] text-amber-50"
        )}
      >
        {label}
      </span>
    </div>
  );
}

/** JOIN タブ CTA — GOLD LEGION パネル */
const JOIN_BATTLE_PANEL_STYLE = {
  ...chamferStyle,
  border: `1px solid ${SQUAD_GOLD.lineSoft}`,
  background: SQUAD_GOLD.panelGrad,
  boxShadow:
    `inset 0 0 0 1px rgba(20,16,6,0.9), inset 0 0 18px rgba(${SQUAD_GOLD.glowRgb},0.08), 0 8px 18px rgba(0,0,0,0.28)`,
} as const;

/** 角切り CTA ボタン */
function SquadChamferButton({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "muted" | "battle" | "battleOutline";
}) {
  const variantClass =
    variant === "primary" || variant === "battle"
      ? "text-[#1A1002] hover:brightness-110"
      : variant === "battleOutline"
        ? "bg-transparent text-amber-100 hover:bg-amber-400/10"
      : variant === "danger"
        ? "border border-rose-400/35 bg-rose-500/10 text-rose-200 hover:bg-rose-500/16"
        : variant === "muted"
          ? "border border-white/10 bg-white/[0.03] text-white/30"
          : "border border-white/15 bg-white/[0.04] text-white/80 hover:border-white/25 hover:bg-white/[0.07]";

  const filledGold =
    variant === "primary" || variant === "battle"
      ? {
          background: `linear-gradient(180deg, ${SQUAD_GOLD.acc}, ${SQUAD_GOLD.accDeep})`,
          boxShadow: `0 0 22px rgba(${SQUAD_GOLD.glowRgb},0.4)`,
          border: "none",
        }
      : variant === "battleOutline"
        ? {
            background: "transparent",
            boxShadow: `inset 0 0 0 1px ${SQUAD_GOLD.line}`,
          }
        : undefined;

  return (
    <button
      type="button"
      {...props}
      className={cn(
        nameOxanium.className,
        "transition active:brightness-95 disabled:cursor-not-allowed",
        variantClass,
        className
      )}
      style={{ ...chamferStyle, ...filledGold, ...props.style }}
    >
      {children}
    </button>
  );
}

/** GOLD LEGION — フェーズタイムライン（線は各ドット中心を結ぶ） */
function SquadGoldPhaseTrack({
  activeKey = "battle",
}: {
  activeKey?: "entry" | "battle" | "reward";
}) {
  const order = ["entry", "battle", "reward"] as const;
  const n = order.length;
  const activeIdx = Math.max(0, order.indexOf(activeKey));
  /** 線の進捗: 完了ノードまで塗り、現在ノードで止める */
  const progressPct =
    activeIdx <= 0 ? 0 : (activeIdx / (n - 1)) * 100;
  /** 等幅カラム時、端ドット中心 = 半カラム = 100% / (2n) */
  const edgeInsetPct = 100 / (2 * n);

  return (
    <div className="relative pt-0.5">
      {/* レール: 先頭〜末尾ドットの中心同士 */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[7px] h-0.5 overflow-hidden rounded-full"
        style={{
          left: `${edgeInsetPct}%`,
          right: `${edgeInsetPct}%`,
        }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: SQUAD_GOLD.lineSoft }}
        />
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            width: `${progressPct}%`,
            background: `linear-gradient(90deg, ${SQUAD_GOLD.accDeep}, ${SQUAD_GOLD.acc})`,
            boxShadow: `0 0 10px rgba(${SQUAD_GOLD.glowRgb},0.55)`,
          }}
        />
      </div>

      <div className="relative z-[1] flex">
        {SQUAD_BATTLE_SEASON_PHASES.map((p) => {
          const idx = order.indexOf(p.key);
          const active = p.key === activeKey;
          const done = idx < activeIdx;
          const lit = active || done;
          return (
            <div
              key={p.key}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <span
                className="h-4 w-4 shrink-0 rounded-full"
                style={{
                  background: lit ? SQUAD_GOLD.acc : "transparent",
                  border: lit
                    ? "none"
                    : `1.5px solid ${SQUAD_GOLD.lineSoft}`,
                  boxShadow: lit
                    ? `0 0 14px rgba(${SQUAD_GOLD.glowRgb},0.75)`
                    : "none",
                }}
              />
              <span
                className={cn(
                  nameOxanium.className,
                  "text-[9px] font-black uppercase tracking-[0.18em]"
                )}
                style={{
                  color: active
                    ? SQUAD_GOLD.acc
                    : done
                      ? SQUAD_GOLD.mut
                      : SQUAD_GOLD.mutFaint,
                }}
              >
                {p.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** フェーズ帯の下 — 締切・LOCKED・休止などの状況 */
function SquadPhaseStatusBanner({
  phase,
  hasSquad,
  activeMemberCount,
  deadlineLabel,
}: {
  phase: SquadBattleUiPhase;
  hasSquad: boolean;
  activeMemberCount: number;
  deadlineLabel?: string | null;
}) {
  const isWeb = useSquadBattleIsWeb();
  const banner = squadBattlePhaseBanner({
    phase,
    hasSquad,
    activeMemberCount,
    deadlineLabel,
  });
  const toneBorder =
    banner.tone === "warn"
      ? "border-rose-400/45 bg-rose-500/10"
      : banner.tone === "idle"
        ? "border-white/12 bg-white/[0.04]"
        : banner.tone === "reward"
          ? "border-amber-300/40 bg-amber-400/10"
          : "border-amber-400/30 bg-amber-500/[0.07]";
  const kickerColor =
    banner.tone === "warn"
      ? "text-rose-200/80"
      : banner.tone === "idle"
        ? "text-white/45"
        : "text-amber-200/70";

  return (
    <div
      className={cn("border px-3 py-2.5", toneBorder, isWeb ? "py-3" : null)}
      style={chamferStyle}
    >
      <p
        className={cn(
          nameOxanium.className,
          "text-[9px] font-black uppercase tracking-[0.2em]",
          kickerColor
        )}
      >
        {banner.kicker}
      </p>
      <p
        className={cn(
          nameOxanium.className,
          "mt-0.5 font-bold uppercase tracking-wide text-[#FFF7E0]",
          isWeb ? "text-[14px]" : "text-[13px]"
        )}
      >
        {banner.title}
      </p>
      <p className={cn(jp.className, "mt-1 text-[12px] leading-snug text-white/50")}>
        {banner.detail}
      </p>
    </div>
  );
}

/** REWARD フェーズ — 獲得 Unit の見せ場 */
function SquadRewardResultPanel({ hasSquad }: { hasSquad: boolean }) {
  const isWeb = useSquadBattleIsWeb();
  const r = SQUAD_BATTLE_REWARD_RESULT_MOCK;
  if (!hasSquad) {
    return (
      <div
        className="border border-amber-400/25 bg-amber-500/[0.06] px-4 py-5 text-center"
        style={chamferStyle}
      >
        <p
          className={cn(
            nameOxanium.className,
            "text-[11px] font-black uppercase tracking-[0.2em] text-amber-200/70"
          )}
        >
          REWARD
        </p>
        <p className={cn(jp.className, "mt-2 text-sm text-white/55")}>
          未参加のため配布対象外です。次回 ENTRY から参加できます。
        </p>
      </div>
    );
  }
  return (
    <div
      className="border border-amber-300/40 bg-gradient-to-b from-amber-400/12 to-transparent px-4 py-4"
      style={{
        ...chamferStyle,
        boxShadow: `0 0 28px rgba(${SQUAD_GOLD.glowRgb},0.18)`,
      }}
    >
      <p
        className={cn(
          nameOxanium.className,
          "text-[10px] font-black uppercase tracking-[0.22em] text-amber-200/75"
        )}
      >
        Your payout
      </p>
      <div className={cn("mt-3 grid grid-cols-2", isWeb ? "gap-3" : "gap-2")}>
        {[
          { label: "WEEKLY", rank: r.weeklyRank, units: r.weeklyUnits },
          { label: "MONTHLY", rank: r.monthlyRank, units: r.monthlyUnits },
        ].map((cell) => (
          <div
            key={cell.label}
            className="border border-amber-400/25 bg-black/35 px-3 py-3 text-center"
            style={chamferStyle}
          >
            <p
              className={cn(
                nameOxanium.className,
                "text-[9px] font-bold uppercase tracking-[0.16em] text-amber-200/50"
              )}
            >
              {cell.label}
            </p>
            <p
              className={cn(
                nameBebas.className,
                "mt-1 text-[28px] leading-none text-[#FBBF24]"
              )}
            >
              {cell.rank != null ? `#${cell.rank}` : "—"}
            </p>
            <p
              className={cn(
                nameOxanium.className,
                "mt-1.5 text-[12px] font-black tabular-nums text-[#FFF7E0]"
              )}
            >
              +{cell.units} Unit
            </p>
          </div>
        ))}
      </div>
      <p className={cn(jp.className, "mt-3 text-center text-[11px] text-white/40")}>
        {r.payoutNote}
      </p>
    </div>
  );
}

/** 休止期間の専用面 */
function SquadIdlePanel() {
  return (
    <div
      className="border border-white/12 bg-white/[0.03] px-4 py-8 text-center"
      style={chamferStyle}
    >
      <p
        className={cn(
          nameOxanium.className,
          "text-[11px] font-black uppercase tracking-[0.22em] text-white/40"
        )}
      >
        Off season
      </p>
      <p
        className={cn(
          nameBebas.className,
          "mt-2 text-[26px] tracking-[0.06em] text-white/70"
        )}
      >
        NEXT ENTRY SOON
      </p>
      <p className={cn(jp.className, "mx-auto mt-2 max-w-xs text-[13px] text-white/40")}>
        開催休止中です。募集開始の告知をお待ちください。
      </p>
    </div>
  );
}

function SquadEmptyHint({ children }: { children: ReactNode }) {
  return (
    <p
      className={cn(
        jp.className,
        "border border-dashed border-amber-400/20 bg-black/25 px-3 py-3 text-center text-[12px] text-white/40"
      )}
      style={chamferStyle}
    >
      {children}
    </p>
  );
}

/** 週間 W1〜W4 切替（CyberSlantedTab は使わない） */
function SquadWeekChips({
  weekIndex,
  onChange,
}: {
  weekIndex: SquadBattleWeekIndex;
  onChange: (w: SquadBattleWeekIndex) => void;
}) {
  const active = SQUAD_BATTLE_WEEK_OPTIONS.find((w) => w.index === weekIndex);
  return (
    <div className="mb-3">
      <div className="flex gap-1.5">
        {SQUAD_BATTLE_WEEK_OPTIONS.map((w) => {
          const on = w.index === weekIndex;
          return (
            <button
              key={w.index}
              type="button"
              onClick={() => onChange(w.index)}
              className={cn(
                nameOxanium.className,
                "min-w-0 flex-1 border py-1.5 text-[11px] font-black uppercase tracking-[0.14em] transition",
                on
                  ? "border-amber-300/55 bg-amber-400/20 text-amber-50"
                  : "border-amber-400/20 bg-black/25 text-white/45 hover:border-amber-400/35"
              )}
              style={chamferStyle}
            >
              {w.label}
            </button>
          );
        })}
      </div>
      {active ? (
        <p className={cn(jp.className, "mt-1.5 text-[11px] text-white/40")}>
          {active.periodLabel}
        </p>
      ) : null}
    </div>
  );
}

/** HUD 風セクション見出し */
function SquadSectionHeader({
  kicker,
  title,
  trailing,
  accent = "amber",
}: {
  kicker: string;
  title?: string;
  trailing?: ReactNode;
  accent?: "cyan" | "amber";
}) {
  const isWeb = useSquadBattleIsWeb();
  const dotClass = "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.85)]";
  const kickerClass = "text-amber-200/70";
  const borderClass = "border-amber-400/20";

  return (
    <div
      className={cn(
        "flex items-end justify-between gap-2 border-b",
        borderClass,
        isWeb ? "mb-3 pb-2.5" : "mb-2 pb-2"
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClass)}
          />
          <p
            className={cn(
              nameOxanium.className,
              "font-bold uppercase tracking-[0.2em]",
              kickerClass,
              isWeb ? "text-[11px]" : "text-[10px]"
            )}
          >
            {kicker}
          </p>
        </div>
        {title ? (
          <h3
            className={cn(
              nameOxanium.className,
              "mt-0.5 font-black uppercase tracking-wide text-white",
              isWeb ? "text-lg" : "text-base"
            )}
          >
            {title}
          </h3>
        ) : null}
      </div>
      {trailing}
    </div>
  );
}

/** Top3 カード枠 — 1位ゴールド / 2位シルバー / 3位ブロンズ */
function leaderboardCardFrameStyle(rank: number): {
  style: CSSProperties;
  glowClass?: string;
} | null {
  if (rank === 1) {
    return {
      glowClass: "shadow-[0_0_32px_rgba(255,214,90,0.38)]",
      style: {
        border: "2px solid rgba(255,214,90,0.65)",
        background:
          "linear-gradient(168deg, rgba(32,28,12,0.98), rgba(12,10,4,1))",
        boxShadow:
          "0 0 28px rgba(255,214,90,0.35), 0 0 52px rgba(255,214,90,0.14), inset 0 0 0 2px rgba(255,214,90,0.2)",
      },
    };
  }
  if (rank === 2 || rank === 3) {
    const m = podiumMedalAccent(rank);
    return {
      glowClass:
        rank === 2
          ? "shadow-[0_0_22px_rgba(230,235,245,0.14)]"
          : "shadow-[0_0_22px_rgba(213,154,90,0.16)]",
      style: {
        border: `2px solid ${m.bracket}`,
        background:
          rank === 2
            ? "linear-gradient(168deg, rgba(22,24,32,0.98), rgba(8,9,14,1))"
            : "linear-gradient(168deg, rgba(28,20,12,0.98), rgba(10,7,4,1))",
        boxShadow: `0 0 18px ${m.glow}, inset 0 0 0 2px ${m.ring}`,
      },
    };
  }
  return null;
}

/** リーダーボード1行 — GOLD LEGION 帯（チャンファー） */
function LeaderboardCardShell({
  children,
  rank,
}: {
  children: ReactNode;
  rank: number;
}) {
  const frame = leaderboardCardFrameStyle(rank);

  return (
    <div
      className={cn("relative overflow-hidden", frame?.glowClass)}
      style={{
        ...chamferStyle,
        ...(frame?.style ?? {
          background:
            rank === 1
              ? `linear-gradient(90deg, rgba(${SQUAD_GOLD.glowRgb},0.16), rgba(${SQUAD_GOLD.glowRgb},0.03))`
              : `rgba(${SQUAD_GOLD.glowRgb},0.04)`,
          boxShadow: `inset 0 0 0 1px ${
            rank === 1 ? SQUAD_GOLD.line : SQUAD_GOLD.lineSoft
          }`,
        }),
      }}
    >
      <div className="relative z-[10]">{children}</div>
    </div>
  );
}

/** GOLD LEGION — 一覧行の金配線フレーム */
function SquadGoldWireFrame({ variant = "compact" }: { variant?: "full" | "compact" }) {
  const wire =
    "linear-gradient(90deg, rgba(253,230,138,0.95), rgba(251,191,36,0.75), rgba(251,191,36,0.2))";
  const wireV =
    "linear-gradient(180deg, rgba(253,230,138,0.95), rgba(251,191,36,0.7), rgba(251,191,36,0.12))";
  const glow = `0 0 10px rgba(${SQUAD_GOLD.glowRgb},0.7), 0 0 22px rgba(${SQUAD_GOLD.glowRgb},0.22)`;

  return (
    <div className="pointer-events-none absolute inset-0 z-[25]">
      <div
        className="absolute left-0 right-0 top-0 h-[1.5px]"
        style={{ background: wire, boxShadow: glow }}
      />
      <div
        className="absolute bottom-0 left-0 top-0 w-[1.5px]"
        style={{ background: wireV, boxShadow: glow }}
      />
      {/* 左上ブラケット — 上辺・左辺と同じ原点から伸ばす（ズレ防止） */}
      <div
        className="absolute left-0 top-0 h-3.5 w-3.5 border-l-2 border-t-2"
        style={{
          borderColor: "rgba(253,230,138,0.92)",
          boxShadow: `0 0 10px rgba(${SQUAD_GOLD.glowRgb},0.55)`,
        }}
      />
      {variant === "full" ? (
        <div
          className="absolute bottom-2 right-2 h-3 w-3 border-b border-r"
          style={{
            borderColor: "rgba(251,191,36,0.45)",
            boxShadow: `0 0 8px rgba(${SQUAD_GOLD.glowRgb},0.25)`,
          }}
        />
      ) : null}
    </div>
  );
}

/** 一覧行用の控えめゴールド枠 */
function SquadListItemShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        border: `1px solid ${SQUAD_GOLD.lineSoft}`,
        background: SQUAD_GOLD.panelGrad,
        boxShadow: `inset 0 0 0 1px rgba(20,16,6,0.85), inset 0 1px 0 ${SQUAD_GOLD.sheen}`,
        clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)",
        WebkitClipPath:
          "polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)",
      }}
    >
      <SquadGoldWireFrame variant="compact" />
      <div className="relative z-[10]">{children}</div>
    </div>
  );
}

/** ページネーションバー（‹ 1 2 3 ›） */
function SquadPageBar({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  const isWeb = useSquadBattleIsWeb();
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i);
  const btnSize = isWeb ? "h-9 w-9" : "h-8 w-8";
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1.5",
        isWeb ? "mt-4" : "mt-3"
      )}
      role="navigation"
      aria-label="ページ"
    >
      <button
        type="button"
        disabled={page <= 0}
        onClick={() => onChange(page - 1)}
        aria-label="前のページ"
        className={cn(
          "inline-flex items-center justify-center rounded-sm border transition",
          btnSize,
          page <= 0
            ? "cursor-not-allowed border-white/10 text-white/20"
            : "border-amber-400/35 bg-amber-400/10 text-amber-100 hover:bg-amber-400/18"
        )}
      >
        <ChevronLeft size={isWeb ? 18 : 16} strokeWidth={2.4} />
      </button>
      {pages.map((p) => {
        const active = p === page;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-label={`${p + 1}ページ目`}
            aria-current={active ? "page" : undefined}
            className={cn(
              nameOxanium.className,
              "inline-flex min-w-8 items-center justify-center rounded-sm border px-2 font-bold tabular-nums transition",
              isWeb ? "h-9 text-[13px]" : "h-8 text-[12px]",
              active
                ? "border-amber-300/60 bg-amber-400/25 text-amber-50"
                : "border-white/12 bg-black/20 text-white/55 hover:border-white/25 hover:text-white/80"
            )}
          >
            {p + 1}
          </button>
        );
      })}
      <button
        type="button"
        disabled={page >= pageCount - 1}
        onClick={() => onChange(page + 1)}
        aria-label="次のページ"
        className={cn(
          "inline-flex items-center justify-center rounded-sm border transition",
          btnSize,
          page >= pageCount - 1
            ? "cursor-not-allowed border-white/10 text-white/20"
            : "border-amber-400/35 bg-amber-400/10 text-amber-100 hover:bg-amber-400/18"
        )}
      >
        <ChevronRight size={isWeb ? 18 : 16} strokeWidth={2.4} />
      </button>
    </div>
  );
}

type Props = {
  variant: "web" | "mobile";
};

/** Web は余白・タイポを広げ、Mobile は密レイアウトのまま */
const SquadBattleIsWebCtx = createContext(false);
function useSquadBattleIsWeb() {
  return useContext(SquadBattleIsWebCtx);
}

/** 得点・順位数字: 1〜3位はパレット、4位以下は白 */
function scoreColorForRank(rank: number): string {
  if (rank <= 3) return cyberRankPalette(rank).accent;
  return "rgba(255,255,255,0.92)";
}

/** セグメント色も得点文字と同じ（1〜3位パレット / 4位以下は白） */
function segAccentForRank(rank: number) {
  const color = scoreColorForRank(rank);
  if (rank <= 3) {
    const p = cyberRankPalette(rank);
    return {
      border: p.accent,
      glow: p.accentGlow,
      bg: p.stroke,
    };
  }
  return {
    border: color,
    glow: "rgba(255,255,255,0.35)",
    bg: "rgba(255,255,255,0.55)",
  };
}

function pointsBarPct(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

/** 順位変動バッジ（▲上昇 / ▼下降 / −横ばい） */
function RankTrendBadge({ squad }: { squad: Pick<Squad, "rank" | "prevRank"> }) {
  const delta = squadRankDelta(squad);
  if (delta > 0) {
    return (
      <span
        className={cn(
          nameOxanium.className,
          "text-[12px] font-black tabular-nums tracking-wide text-amber-300"
        )}
        style={{ textShadow: "0 0 8px rgba(251,191,36,0.45)" }}
      >
        ▲{delta}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span
        className={cn(
          nameOxanium.className,
          "text-[12px] font-black tabular-nums tracking-wide text-rose-300"
        )}
      >
        ▼{Math.abs(delta)}
      </span>
    );
  }
  return (
    <span
      className={cn(
        nameOxanium.className,
        "text-[12px] font-bold text-white/35"
      )}
    >
      −
    </span>
  );
}

/** ランキング一覧の当日増減（黄色 +N）相当 */
function SquadAvgDayDelta({
  delta,
  className,
}: {
  delta?: number | null;
  className?: string;
}) {
  const text = formatListMetricDayDelta("totalScore", delta);
  if (!text) return null;
  return (
    <span
      className={cn(
        nameOxanium.className,
        "text-[13px] font-extrabold tabular-nums leading-none tracking-[0.06em]",
        className
      )}
      style={{
        color: "#FFD65A",
        textShadow: "0 0 8px rgba(255,214,90,0.45)",
      }}
    >
      {text}
    </span>
  );
}

/** 点数 + 当日増減 — 数字の右に +N / pts を縦積み */
function SquadPtsWithDayDelta({
  value,
  delta,
  size = "sm",
  tone = "accent",
  color,
}: {
  value: number;
  delta?: number | null;
  size?: "sm" | "md" | "lg";
  tone?: "default" | "accent" | "muted";
  color?: string;
}) {
  return (
    <span className="inline-flex items-center gap-0.5 overflow-visible">
      <SquadPointsText value={value} size={size} tone={tone} color={color} />
      <span className="flex flex-col items-start justify-center gap-[1px] leading-none">
        <SquadAvgDayDelta delta={delta} />
        <span
          className={cn(
            cyberNumberDisplay.className,
            "origin-left text-[9px] leading-none",
            "[transform:skewX(-10deg)_scaleX(0.96)]"
          )}
          style={{ color: SQUAD_GOLD.acc }}
        >
          pts
        </span>
      </span>
    </span>
  );
}


/** NEO GRID 得点表示 */
function SquadPointsText({
  value,
  size = "sm",
  tone = "default",
  prefixHash = false,
  suffix = "",
  color,
}: {
  value: number;
  size?: "sm" | "md" | "lg";
  tone?: "default" | "accent" | "muted";
  prefixHash?: boolean;
  suffix?: string;
  /** 順位パレット色など */
  color?: string;
}) {
  const glow =
    tone === "muted" ? 0.35 : tone === "accent" ? 0.85 : 0.72;
  return (
    <CyberNumber
      value={value}
      size={size}
      glowIntensity={glow}
      prefix={prefixHash ? "#" : ""}
      suffix={suffix}
      format={!prefixHash}
      color={color}
    />
  );
}

function MemberAvatar({
  member,
  size = "md",
}: {
  member: SquadMember;
  size?: "sm" | "md";
}) {
  const isWeb = useSquadBattleIsWeb();
  const dim =
    size === "sm"
      ? isWeb
        ? "h-8 w-8 text-[10px]"
        : "h-7 w-7 text-[9px]"
      : isWeb
        ? "h-10 w-10 text-[12px]"
        : "h-9 w-9 text-[11px]";
  if (member.empty) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center border border-dashed border-amber-400/30 bg-amber-400/[0.04] text-amber-200/40",
          dim
        )}
        style={{ clipPath: SQUAD_GOLD_MEDALLION, WebkitClipPath: SQUAD_GOLD_MEDALLION }}
        title="募集中"
      >
        <Plus size={size === "sm" ? (isWeb ? 11 : 10) : isWeb ? 13 : 12} strokeWidth={2.5} />
      </div>
    );
  }
  const initial = (member.displayName || member.handle || "?")
    .slice(0, 1)
    .toUpperCase();
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center border border-amber-400/40 bg-amber-500/12 font-bold text-amber-50",
        nameOxanium.className,
        dim
      )}
      style={{ clipPath: SQUAD_GOLD_MEDALLION, WebkitClipPath: SQUAD_GOLD_MEDALLION }}
      title={member.displayName}
    >
      {initial}
    </div>
  );
}

function ProfileAvatar({
  profile,
  size = "md",
}: {
  profile: Pick<SquadApplicantProfile, "displayName" | "handle">;
  size?: "md" | "lg";
}) {
  const dim = size === "lg" ? "h-16 w-16 text-xl" : "h-10 w-10 text-sm";
  const initial = (profile.displayName || profile.handle || "?")
    .slice(0, 1)
    .toUpperCase();
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center border border-amber-400/45 bg-amber-500/15 font-bold text-amber-50",
        nameOxanium.className,
        dim
      )}
      style={{ clipPath: SQUAD_GOLD_MEDALLION, WebkitClipPath: SQUAD_GOLD_MEDALLION }}
    >
      {initial}
    </div>
  );
}

function MemberRow({
  member,
  onOpenProfile,
  elevated = false,
}: {
  member: SquadMember;
  onOpenProfile?: (profile: SquadApplicantProfile) => void;
  /** MY SQUAD 内 — 独立ミニカード */
  elevated?: boolean;
}) {
  const isWeb = useSquadBattleIsWeb();
  const rowPad = isWeb ? "gap-3.5 px-4 py-3" : "gap-3 px-3 py-2.5";
  const nameClass = isWeb ? "text-[15px]" : "text-sm";

  if (member.empty) {
    return (
      <div
        className={cn(
          "flex items-center",
          rowPad,
          elevated
            ? "border-2 border-dashed border-white/15 bg-white/[0.02]"
            : "rounded-sm border border-dashed border-white/12 bg-white/[0.02]"
        )}
        style={elevated ? chamferStyle : undefined}
      >
        <MemberAvatar member={member} />
        <div className="min-w-0 flex-1">
          <p className={cn(jp.className, nameClass, "text-white/40")}>
            空き枠 · 募集中
          </p>
          <p
            className={cn(
              nameOxanium.className,
              "font-bold uppercase tracking-[0.16em] text-white/25",
              isWeb ? "text-[11px]" : "text-[10px]"
            )}
          >
            OPEN SLOT
          </p>
        </div>
      </div>
    );
  }
  const posts = squadMemberToProfile(member).totalPosts;
  const body = (
    <>
      <MemberAvatar member={member} />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            jp.className,
            "truncate font-semibold text-white/90",
            nameClass
          )}
        >
          {member.displayName}
        </p>
      </div>
      <div className="flex shrink-0 items-baseline gap-2.5">
        <SquadPointsText
          value={posts}
          size={isWeb ? "md" : "sm"}
          suffix="posts"
          color="#CBD5E1"
        />
        <SquadPointsText
          value={member.points}
          size={isWeb ? "md" : "sm"}
          suffix="pts"
        />
      </div>
    </>
  );
  if (onOpenProfile) {
    return (
      <button
        type="button"
        onClick={() => onOpenProfile(squadMemberToProfile(member))}
        className={cn(
          "flex w-full items-center text-left transition",
          rowPad,
          elevated
            ? "border-2 border-amber-400/22 bg-[#0a0e14]/90 hover:border-amber-400/40 hover:bg-amber-500/[0.06]"
            : "rounded-sm border border-white/10 bg-[#0a0e14]/80 hover:border-amber-400/30 hover:bg-amber-500/[0.06]"
        )}
        style={elevated ? chamferStyle : undefined}
      >
        {body}
      </button>
    );
  }
  return (
    <div
      className={cn(
        "flex items-center",
        rowPad,
        elevated
          ? "border-2 border-amber-400/22 bg-[#0a0e14]/90"
          : "rounded-sm border border-white/10 bg-[#0a0e14]/80"
      )}
      style={elevated ? chamferStyle : undefined}
    >
      {body}
    </div>
  );
}

/** MY SQUAD カード枠 — 順位色 + GOLD LEGION アクセント */
function MySquadCardShell({
  rank,
  children,
}: {
  rank: number;
  children: ReactNode;
}) {
  const frame = leaderboardCardFrameStyle(rank);

  return (
    <div className="relative overflow-visible">
      <SquadCardTabBadge label="My squad" />
      <div
        className={cn(
          "relative -mt-2.5 overflow-hidden",
          frame?.glowClass ?? "shadow-[0_0_28px_rgba(251,191,36,0.22)]"
        )}
        style={{
          ...squadCardShellStyleNoClip("subtle"),
          borderWidth: 2,
          ...(frame?.style ?? {
            border: `2px solid ${SQUAD_GOLD.line}`,
            background: SQUAD_GOLD.panelGrad,
            boxShadow:
              `0 0 24px rgba(${SQUAD_GOLD.glowRgb},0.28), inset 0 0 0 2px rgba(${SQUAD_GOLD.glowRgb},0.12), inset 0 1px 0 ${SQUAD_GOLD.sheen}`,
          }),
        }}
      >
        {/* GOLD LEGION スキャンライン */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            background:
              "repeating-linear-gradient(0deg, #FBBF24 0px, #FBBF24 1px, transparent 1px, transparent 4px)",
          }}
        />
        <div className="relative z-10 pt-1.5">{children}</div>
      </div>
    </div>
  );
}

function MySquadCard({
  squad,
  maxAvg,
  onOpenMemberProfile,
  onCopyInviteCode,
  onRenameSquad,
}: {
  squad: Squad;
  maxAvg: number;
  onOpenMemberProfile?: (profile: SquadApplicantProfile) => void;
  onCopyInviteCode?: (code: string) => void;
  onRenameSquad?: (name: string) => void;
}) {
  const isWeb = useSquadBattleIsWeb();
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(squad.name);

  useEffect(() => {
    if (!editingName) setDraftName(squad.name);
  }, [squad.name, editingName]);

  const trimmedDraft = draftName.trim();
  const canSaveRename =
    trimmedDraft.length > 0 &&
    trimmedDraft.length <= SQUAD_BATTLE_NAME_MAX_LEN &&
    trimmedDraft !== squad.name;

  function commitRename() {
    if (!canSaveRename || !onRenameSquad) return;
    onRenameSquad(trimmedDraft);
    setEditingName(false);
  }

  function cancelRename() {
    setDraftName(squad.name);
    setEditingName(false);
  }

  const active = countActiveMembers(squad);
  const recruiting = active < SQUAD_BATTLE_MAX_MEMBERS;
  const inviteCode = recruiting ? squad.inviteCode ?? null : null;
  const segAccent =
    squad.rank <= 3
      ? segAccentForRank(squad.rank)
      : {
          border: SQUAD_GOLD.acc,
          glow: `rgba(${SQUAD_GOLD.glowRgb},0.65)`,
          bg: `rgba(${SQUAD_GOLD.glowRgb},0.85)`,
        };
  const hudLabel = cn(
    nameOxanium.className,
    "font-bold uppercase tracking-[0.14em] text-amber-200/45",
    isWeb ? "text-[9px]" : "text-[8px]"
  );
  const hudCell = cn(
    "flex flex-col items-center justify-between border border-amber-400/25 bg-black/35 text-center",
    isWeb ? "min-h-[76px] px-2.5 py-3" : "min-h-[64px] px-2 py-2.5"
  );
  const hudValue = cn(
    "flex w-full items-center justify-center overflow-visible",
    isWeb ? "h-9" : "h-8"
  );
  const hudValueColor = scoreColorForRank(squad.rank);
  const hudValueGlow =
    squad.rank <= 3
      ? `0 0 10px ${cyberRankPalette(squad.rank).accentGlow}`
      : `0 0 8px rgba(${SQUAD_GOLD.glowRgb},0.35)`;

  return (
    <MySquadCardShell rank={squad.rank}>
      <div className={cn(isWeb ? "px-5 pb-4 pt-4" : "px-4 pb-3 pt-3")}>
        {editingName ? (
          <div className={cn("mx-auto w-full", isWeb ? "max-w-md" : "max-w-[320px]")}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span
                className={cn(
                  nameOxanium.className,
                  "text-[9px] font-bold uppercase tracking-[0.16em] text-amber-300/55"
                )}
              >
                Rename squad
              </span>
              <span
                className={cn(
                  nameOxanium.className,
                  "text-[9px] tabular-nums text-white/30"
                )}
              >
                {draftName.length}/{SQUAD_BATTLE_NAME_MAX_LEN}
              </span>
            </div>
            <input
              type="text"
              value={draftName}
              maxLength={SQUAD_BATTLE_NAME_MAX_LEN}
              autoFocus
              aria-label="スクワッド名"
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") cancelRename();
              }}
              className={cn(
                nameOxanium.className,
                "w-full border border-amber-400/45 bg-black/55 px-3 py-2.5 text-center font-black uppercase tracking-[0.12em] text-white outline-none placeholder:text-white/20 focus:border-amber-300/70 focus:shadow-[0_0_20px_rgba(251,191,36,0.2)]",
                isWeb ? "text-[18px]" : "text-[16px]"
              )}
              style={chamferStyle}
            />
            <div className="mt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={cancelRename}
                className={cn(
                  nameOxanium.className,
                  "border border-white/15 bg-black/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50 transition hover:text-white/75"
                )}
                style={chamferStyle}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canSaveRename}
                onClick={commitRename}
                className={cn(
                  nameOxanium.className,
                  "inline-flex items-center gap-1 border border-amber-400/50 bg-amber-400/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-amber-50 transition disabled:opacity-35"
                )}
                style={chamferStyle}
              >
                <Check size={12} strokeWidth={2.6} />
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="relative flex items-center justify-center gap-2 px-8">
            <h2
              className={cn(
                nameOxanium.className,
                "min-w-0 truncate text-center font-black uppercase tracking-wide text-white",
                isWeb ? "text-[28px]" : "text-[22px]"
              )}
            >
              {squad.name}
            </h2>
            {onRenameSquad ? (
              <button
                type="button"
                onClick={() => {
                  setDraftName(squad.name);
                  setEditingName(true);
                }}
                aria-label="スクワッド名を変更"
                className={cn(
                  "absolute right-0 top-1/2 flex -translate-y-1/2 items-center justify-center border border-amber-400/35 bg-amber-400/10 text-amber-100/85 transition hover:border-amber-300/55 hover:bg-amber-400/18",
                  isWeb ? "h-9 w-9" : "h-8 w-8"
                )}
                style={chamferStyle}
              >
                <Pencil size={isWeb ? 14 : 13} strokeWidth={2.2} />
              </button>
            ) : null}
          </div>
        )}

        <div
          className={cn(
            "mt-3 grid",
            isWeb ? "gap-2.5" : "gap-2",
            inviteCode ? "grid-cols-3" : "grid-cols-2"
          )}
        >
          <div className={hudCell} style={chamferStyle}>
            <p className={hudLabel}>Rank</p>
            <div className={cn(hudValue, "relative")}>
              <p
                className={cn(
                  nameBebas.className,
                  "leading-none tracking-wide",
                  isWeb ? "text-[28px]" : "text-[24px]"
                )}
                style={{ color: hudValueColor, textShadow: hudValueGlow }}
              >
                {String(squad.rank).padStart(2, "0")}
              </p>
              <span className="absolute left-[calc(50%+1.05em)] top-1/2 -translate-y-1/2">
                <RankTrendBadge squad={squad} />
              </span>
            </div>
          </div>

          <div className={hudCell} style={chamferStyle}>
            <p className={hudLabel}>Avg</p>
            <div className={cn(hudValue, "relative overflow-visible")}>
              <SquadPtsWithDayDelta
                value={squad.avgPoints}
                delta={squad.avgPointsDayDelta}
                size={isWeb ? "md" : "sm"}
                tone="accent"
              />
            </div>
          </div>

          {inviteCode ? (
            <button
              type="button"
              onClick={() => {
                if (onCopyInviteCode) {
                  onCopyInviteCode(inviteCode);
                  return;
                }
                void copyTextToClipboard(inviteCode);
              }}
              className={cn(
                hudCell,
                "cursor-pointer transition hover:border-amber-300/45 hover:bg-amber-400/5 active:scale-[0.98]"
              )}
              style={chamferStyle}
              aria-label={`招待コード ${inviteCode} をコピー`}
              title="タップでコピー"
            >
              <p className={hudLabel}>Code</p>
              <div className={cn(hudValue, "gap-1")}>
                <span
                  className={cn(
                    nameOxanium.className,
                    "max-w-[calc(100%-14px)] truncate font-black tracking-[0.12em]",
                    isWeb ? "text-[14px]" : "text-[13px]"
                  )}
                  style={{ color: hudValueColor, textShadow: hudValueGlow }}
                >
                  {inviteCode}
                </span>
                <Copy
                  size={isWeb ? 12 : 11}
                  strokeWidth={2.4}
                  className="shrink-0 text-white/45"
                  aria-hidden
                />
              </div>
            </button>
          ) : null}
        </div>

        <div className={cn(isWeb ? "mt-3" : "mt-2.5")}>
          <CyberSlantedSegBar
            pct={pointsBarPct(squad.avgPoints, maxAvg)}
            segments={10}
            compact
            forceStatic
            maxWidthClass="max-w-full"
            accent={segAccent}
          />
        </div>
      </div>

      <div className={cn(isWeb ? "px-5 pb-5" : "px-4 pb-4")}>
        <div className="mb-2 flex items-center gap-2 border-b border-amber-400/20 pb-2">
          <span
            aria-hidden
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.85)]"
          />
          <p
            className={cn(
              nameOxanium.className,
              "font-bold uppercase tracking-[0.2em] text-amber-300/65",
              isWeb ? "text-[11px]" : "text-[10px]"
            )}
          >
            Members
          </p>
        </div>
        <div className={cn("flex flex-col", isWeb ? "gap-2.5" : "gap-2")}>
          {squad.members.map((m) => (
            <MemberRow
              key={m.uid}
              member={m}
              elevated
              onOpenProfile={onOpenMemberProfile}
            />
          ))}
        </div>
      </div>
    </MySquadCardShell>
  );
}

/** グループ作成 — コールサイン登録 HUD（アンバー戦闘系） */
function CreateSquadNameSheet({
  onClose,
  onCreate,
  initialName = "",
  title = "CREATE SQUAD",
  ariaLabel = "グループ作成",
  submitLabel = "作成する",
}: {
  onClose: () => void;
  onCreate: (name: string) => void;
  initialName?: string;
  title?: string;
  ariaLabel?: string;
  submitLabel?: string;
}) {
  const [name, setName] = useState(initialName);
  const [agreed, setAgreed] = useState(false);
  const reduceMotion = useReducedMotion() === true;
  const isWeb = useSquadBattleIsWeb();
  const trimmed = name.trim();
  const canSubmit =
    trimmed.length > 0 &&
    trimmed.length <= SQUAD_BATTLE_NAME_MAX_LEN &&
    agreed;
  const preview = trimmed.length > 0 ? trimmed : "————";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center"
      role="dialog"
      aria-modal
      aria-label={ariaLabel}
      onClick={onClose}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[#050208]/78 backdrop-blur-[2px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(180,40,20,0.18),transparent_55%)]"
      />

      <motion.div
        className={cn(
          "relative w-full overflow-hidden",
          isWeb ? "max-w-lg" : "max-w-md"
        )}
        style={{
          ...chamferStyle,
          border: "1px solid rgba(251,191,36,0.4)",
          background:
            "linear-gradient(168deg, rgba(28,20,8,0.98) 0%, rgba(8,6,3,1) 58%)",
          boxShadow:
            "0 0 48px rgba(251,191,36,0.16), 0 0 80px rgba(180,40,20,0.12), inset 0 0 0 1px rgba(251,191,36,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
        initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* 角ブラケット */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l border-t border-amber-300/70"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-2 top-2 h-3 w-3 border-r border-t border-amber-300/70"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b border-l border-amber-300/70"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b border-r border-amber-300/70"
        />

        <div className={cn("relative z-[10]", isWeb ? "px-6 pb-6 pt-5" : "px-5 pb-5 pt-4")}>
          <div className={cn("flex items-start justify-between gap-3", isWeb ? "mb-6" : "mb-5")}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.85)]"
                />
                <p
                  className={cn(
                    nameOxanium.className,
                    "font-bold uppercase tracking-[0.28em] text-amber-200/70",
                    isWeb ? "text-[11px]" : "text-[10px]"
                  )}
                >
                  {title}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center border border-amber-400/30 bg-black/35 text-amber-100/85 transition hover:border-amber-300/50 hover:bg-amber-400/10"
              style={chamferStyle}
              aria-label="閉じる"
            >
              <X size={15} strokeWidth={2.4} />
            </button>
          </div>

          {/* ライブプレビュー — リーダーボード上の見え方 */}
          <div
            className={cn(
              "mb-5 flex flex-col items-center border border-amber-400/20 bg-black/40",
              isWeb ? "px-5 py-6" : "px-4 py-5"
            )}
          >
            <p
              className={cn(
                nameOxanium.className,
                "mb-2 text-[9px] font-bold uppercase tracking-[0.22em] text-amber-200/45"
              )}
            >
              Preview
            </p>
            <p
              className={cn(
                nameOxanium.className,
                "max-w-full truncate text-center font-black uppercase tracking-[0.1em]",
                isWeb ? "text-[26px]" : "text-[22px]",
                trimmed.length > 0 ? "text-[#FFF7E6]" : "text-white/22"
              )}
              style={
                trimmed.length > 0
                  ? {
                      textShadow:
                        "0 0 18px rgba(251,191,36,0.45), 0 0 36px rgba(180,40,20,0.25)",
                    }
                  : undefined
              }
            >
              {preview}
            </p>
            <p className={cn(jp.className, "mt-2 text-center text-[11px] text-white/40")}>
              対戦相手に表示される名前 · あとから変更可
            </p>
          </div>

          <label className="block">
            <span
              className={cn(
                nameOxanium.className,
                "mb-1.5 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.18em] text-amber-200/55"
              )}
            >
              <span>Squad name</span>
              <span className="tabular-nums text-white/30">
                {name.length}/{SQUAD_BATTLE_NAME_MAX_LEN}
              </span>
            </span>
            <input
              type="text"
              value={name}
              maxLength={SQUAD_BATTLE_NAME_MAX_LEN}
              autoFocus
              placeholder="NEON CIRCUIT"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSubmit) onCreate(trimmed);
              }}
              className={cn(
                nameOxanium.className,
                "w-full border border-amber-400/40 bg-black/55 px-3.5 py-3.5 text-[15px] font-black uppercase tracking-[0.12em] text-[#FFFBEB] outline-none placeholder:font-bold placeholder:tracking-[0.12em] placeholder:text-white/20 focus:border-amber-300/70 focus:shadow-[0_0_24px_rgba(251,191,36,0.22)]"
              )}
              style={chamferStyle}
            />
          </label>

          <label className="mt-4 flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-amber-400"
            />
            <span className={cn(jp.className, "text-[12px] leading-snug text-white/55")}>
              {SQUAD_BATTLE_MIN_MEMBERS}〜{SQUAD_BATTLE_MAX_MEMBERS}
              人で確定し、開始後の入れ替え不可・同点は同順位同
              Unit・不正は失格に同意します。あなたが代表者になります。
            </span>
          </label>

          <div className="mt-5 flex flex-col gap-2.5">
            <SquadChamferButton
              onClick={() => {
                if (!canSubmit) return;
                onCreate(trimmed);
              }}
              disabled={!canSubmit}
              variant="battle"
              className={cn(
                "flex w-full items-center justify-center gap-2 py-3.5 text-sm font-black uppercase tracking-[0.22em] disabled:opacity-35",
                canSubmit &&
                  "shadow-[0_0_28px_rgba(251,191,36,0.28)]"
              )}
            >
              <Plus size={15} strokeWidth={2.6} />
              {submitLabel}
            </SquadChamferButton>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                nameOxanium.className,
                "py-2 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-white/35 transition hover:text-white/55"
              )}
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function normalizeUiInviteCode(raw: string): string {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "");
}

/** 招待コードで参加 */
function JoinByInviteCodeSheet({
  onClose,
  onJoin,
  busy,
}: {
  onClose: () => void;
  onJoin: (code: string) => void;
  busy?: boolean;
}) {
  const [code, setCode] = useState("");
  const reduceMotion = useReducedMotion() === true;
  const isWeb = useSquadBattleIsWeb();
  const trimmed = normalizeUiInviteCode(code);
  const canSubmit = trimmed.length >= 4 && !busy;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center"
      role="dialog"
      aria-modal
      aria-label="招待コードで参加"
      onClick={onClose}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[#050208]/78 backdrop-blur-[2px]"
      />
      <motion.div
        className={cn(
          "relative w-full overflow-hidden",
          isWeb ? "max-w-lg" : "max-w-md"
        )}
        style={{
          ...chamferStyle,
          border: "1px solid rgba(251,191,36,0.4)",
          background:
            "linear-gradient(168deg, rgba(28,20,8,0.98) 0%, rgba(8,6,3,1) 58%)",
          boxShadow:
            "0 0 48px rgba(251,191,36,0.16), 0 0 80px rgba(180,40,20,0.12)",
        }}
        onClick={(e) => e.stopPropagation()}
        initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={cn("relative z-[10]", isWeb ? "px-6 pb-6 pt-5" : "px-5 pb-5 pt-4")}>
          <div className={cn("flex items-start justify-between gap-3", isWeb ? "mb-5" : "mb-4")}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.85)]"
                />
                <p
                  className={cn(
                    nameOxanium.className,
                    "font-bold uppercase tracking-[0.28em] text-amber-200/70",
                    isWeb ? "text-[11px]" : "text-[10px]"
                  )}
                >
                  Invite code
                </p>
              </div>
              <p className={cn(jp.className, "mt-2 text-sm text-white/55")}>
                代表者から共有されたコードを入力
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center border border-amber-400/30 bg-black/35 text-amber-100/85"
              style={chamferStyle}
              aria-label="閉じる"
            >
              <X size={15} strokeWidth={2.4} />
            </button>
          </div>

          <label className="block">
            <span
              className={cn(
                nameOxanium.className,
                "mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200/60"
              )}
            >
              Code
            </span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.slice(0, 24))}
              placeholder={SQUAD_BATTLE_MOCK_INVITE_CODE}
              autoFocus
              autoCapitalize="characters"
              spellCheck={false}
              className={cn(
                nameOxanium.className,
                "w-full border border-amber-400/40 bg-black/55 px-3.5 py-3.5 text-[15px] font-black uppercase tracking-[0.18em] text-[#FFFBEB] outline-none placeholder:text-white/20 focus:border-amber-300/70"
              )}
              style={chamferStyle}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSubmit) onJoin(trimmed);
              }}
            />
          </label>

          <div className="mt-5 flex flex-col gap-2.5">
            <SquadChamferButton
              onClick={() => {
                if (!canSubmit) return;
                onJoin(trimmed);
              }}
              disabled={!canSubmit}
              variant="battle"
              className="flex w-full items-center justify-center gap-2 py-3.5 text-sm font-black uppercase tracking-[0.22em] disabled:opacity-35"
            >
              <Ticket size={15} strokeWidth={2.4} />
              {busy ? "参加中…" : "参加する"}
            </SquadChamferButton>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                nameOxanium.className,
                "py-2 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-white/35"
              )}
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ApplicantProfileSheet({
  profile,
  metaLabel,
  onClose,
  onApprove,
  onReject,
}: {
  profile: SquadApplicantProfile;
  metaLabel?: string;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const isWeb = useSquadBattleIsWeb();
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/65 p-3 sm:items-center"
      role="dialog"
      aria-modal
      aria-label="申請者プロフィール"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full overflow-hidden border border-amber-400/30 bg-[#0A0805] shadow-[0_0_40px_rgba(251,191,36,0.15)]",
          isWeb ? "max-w-lg" : "max-w-md"
        )}
        style={{
          border: `1px solid ${SQUAD_GOLD.line}`,
          background: SQUAD_GOLD.panelGrad,
          boxShadow: `0 0 40px rgba(${SQUAD_GOLD.glowRgb},0.15), inset 0 1px 0 ${SQUAD_GOLD.sheen}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <SquadGoldWireFrame variant="full" />
        <div className="relative z-[10]">
        <div
          className={cn(
            "flex items-center justify-between border-b border-white/10",
            isWeb ? "px-5 py-3.5" : "px-4 py-3"
          )}
        >
          <p
            className={cn(
              nameOxanium.className,
              "font-bold uppercase tracking-[0.2em] text-amber-300/70",
              isWeb ? "text-[11px]" : "text-[10px]"
            )}
          >
            Applicant profile
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 p-1.5 text-white/70 hover:bg-white/5"
            aria-label="閉じる"
          >
            <X size={16} />
          </button>
        </div>

        <div className={cn(isWeb ? "px-5 py-6" : "px-4 py-5")}>
          <div className={cn("flex items-center", isWeb ? "gap-4" : "gap-3")}>
            <ProfileAvatar profile={profile} size="lg" />
            <div className="min-w-0">
              <p
                className={cn(
                  jp.className,
                  "truncate font-bold text-white",
                  isWeb ? "text-xl" : "text-lg"
                )}
              >
                {profile.displayName}
              </p>
              <p
                className={cn(
                  nameRajdhani.className,
                  "font-medium text-white/45",
                  isWeb ? "text-[15px]" : "text-sm"
                )}
              >
                @{profile.handle}
              </p>
              {metaLabel ? (
                <p
                  className={cn(
                    nameOxanium.className,
                    "mt-1 font-bold uppercase tracking-[0.14em] text-white/30",
                    isWeb ? "text-[11px]" : "text-[10px]"
                  )}
                >
                  {metaLabel}
                </p>
              ) : null}
            </div>
          </div>

          {profile.bio ? (
            <p
              className={cn(
                jp.className,
                "mt-4 border border-white/10 bg-white/[0.03] leading-relaxed text-white/60",
                isWeb ? "px-3.5 py-3 text-[15px]" : "px-3 py-2.5 text-sm"
              )}
              style={chamferStyle}
            >
              {profile.bio}
            </p>
          ) : null}

          <div className={cn("mt-4 grid grid-cols-2", isWeb ? "gap-2.5" : "gap-2")}>
            {(
              [
                { k: "POINTS", node: <SquadPointsText value={profile.points} size={isWeb ? "lg" : "md"} /> },
                {
                  k: "WIN RATE",
                  node: (
                    <CyberNumber
                      value={profile.winRate.toFixed(1)}
                      size={isWeb ? "lg" : "md"}
                      format={false}
                      suffix="%"
                    />
                  ),
                },
                {
                  k: "STREAK",
                  node: <SquadPointsText value={profile.activeWinStreak} size={isWeb ? "lg" : "md"} />,
                },
                {
                  k: "POSTS",
                  node: <SquadPointsText value={profile.totalPosts} size={isWeb ? "lg" : "md"} />,
                },
              ] as const
            ).map((stat) => (
              <div
                key={stat.k}
                className={cn(
                  "border border-white/10 bg-[#0a0e14]",
                  isWeb ? "px-3.5 py-3" : "px-3 py-2.5"
                )}
                style={chamferStyle}
              >
                <p
                  className={cn(
                    nameOxanium.className,
                    "text-[9px] font-bold uppercase tracking-[0.16em] text-white/30"
                  )}
                >
                  {stat.k}
                </p>
                <div className="mt-1">{stat.node}</div>
              </div>
            ))}
          </div>
        </div>

        {onApprove || onReject ? (
          <div
            className={cn(
              "flex gap-2 border-t border-white/10",
              isWeb ? "px-5 py-3.5" : "px-4 py-3"
            )}
          >
            {onReject ? (
              <SquadChamferButton
                onClick={onReject}
                variant="danger"
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 font-bold uppercase tracking-wider",
                  isWeb ? "py-3 text-sm" : "py-2.5 text-xs"
                )}
              >
                <X size={14} />
                拒否
              </SquadChamferButton>
            ) : null}
            {onApprove ? (
              <SquadChamferButton
                onClick={onApprove}
                variant="primary"
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 font-bold uppercase tracking-wider",
                  isWeb ? "py-3 text-sm" : "py-2.5 text-xs"
                )}
              >
                <Check size={14} />
                承認
              </SquadChamferButton>
            ) : null}
          </div>
        ) : null}
        </div>
      </div>
    </div>
  );
}

function OpenSquadRow({
  squad,
  applied,
  applyDisabled,
  onApply,
  onOpenMemberProfile,
}: {
  squad: OpenSquadListing;
  applied: boolean;
  /** 申請上限到達（未申請の行を押せなくする） */
  applyDisabled: boolean;
  onApply: () => void;
  onOpenMemberProfile: (profile: SquadApplicantProfile) => void;
}) {
  const isWeb = useSquadBattleIsWeb();
  const [expanded, setExpanded] = useState(false);
  const canApply = !applied && !applyDisabled;
  const palette = cyberRankPalette(squad.rank);
  const actionH = isWeb ? "h-9" : "h-8";

  return (
    <SquadListItemShell>
      {/*
        列固定で横揃え:
        順位 | 名前 | 人数 | pts | 操作
      */}
      <div
        className={cn(
          "grid items-center overflow-visible",
          isWeb
            ? "grid-cols-[2.75rem_minmax(0,1fr)_2.5rem_5.5rem_auto] gap-x-3 px-3.5 py-3"
            : "grid-cols-[2.25rem_minmax(0,1fr)_2rem_4.75rem_auto] gap-x-2 px-2.5 py-2.5"
        )}
      >
        <p
          className={cn(
            nameBebas.className,
            "self-center py-0.5 text-center leading-[1.15] tracking-wide",
            isWeb ? "text-[26px]" : "text-[22px]"
          )}
          style={{
            color: scoreColorForRank(squad.rank),
            textShadow:
              squad.rank <= 3 ? `0 0 10px ${palette.accentGlow}` : "none",
          }}
        >
          {String(squad.rank).padStart(2, "0")}
        </p>

        <p
          className={cn(
            nameOxanium.className,
            "min-w-0 truncate font-bold uppercase tracking-wide text-white",
            isWeb ? "text-[14px]" : "text-[12px]"
          )}
        >
          {squad.name}
        </p>

        <span
          className={cn(
            nameOxanium.className,
            "text-center font-bold tabular-nums text-white",
            isWeb ? "text-[13px]" : "text-[12px]"
          )}
        >
          {squad.memberCount}/{SQUAD_BATTLE_MAX_MEMBERS}
        </span>

        <div className="flex justify-end overflow-visible">
          <SquadPointsText
            value={squad.avgPoints}
            size={isWeb ? "md" : "sm"}
            tone="default"
            suffix="pts"
            color={scoreColorForRank(squad.rank)}
          />
        </div>

        <div className={cn("flex shrink-0 items-stretch justify-end gap-1.5", actionH)}>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? "メンバーを閉じる" : "メンバーを見る"}
            className={cn(
              "box-border flex w-8 shrink-0 items-center justify-center border border-amber-400/35 bg-amber-400/10 text-amber-100 transition hover:border-amber-400/55 hover:bg-amber-400/16",
              actionH,
              isWeb && "w-9"
            )}
            style={chamferStyle}
          >
            <ChevronDown
              size={isWeb ? 18 : 16}
              strokeWidth={2.4}
              className={cn(
                "transition-transform duration-200",
                expanded && "rotate-180"
              )}
            />
          </button>
          <SquadChamferButton
            disabled={!canApply && !applied}
            onClick={onApply}
            variant={
              applied ? "secondary" : applyDisabled ? "muted" : "primary"
            }
            className={cn(
              "box-border flex shrink-0 items-center justify-center px-1.5 text-center font-bold uppercase tracking-wider",
              actionH,
              isWeb ? "w-[4.25rem] text-[11px]" : "w-[3.4rem] text-[10px]",
              applied && "cursor-default border-amber-400/30 bg-amber-400/10 text-amber-100/80"
            )}
          >
            {applied ? "申請中" : "申請"}
          </SquadChamferButton>
        </div>
      </div>

      {expanded ? (
        <div className={cn("border-t border-white/8", isWeb ? "px-4 py-3" : "px-3 py-2.5")}>
          <div className={cn("flex flex-col", isWeb ? "gap-2" : "gap-1.5")}>
            {squad.members.map((m) => (
              <button
                key={m.uid}
                type="button"
                onClick={() => onOpenMemberProfile(m)}
                className={cn(
                  "flex items-center gap-3 border border-white/8 bg-black/20 text-left transition hover:border-amber-400/30 hover:bg-amber-500/[0.06]",
                  isWeb ? "px-3 py-2.5" : "px-2.5 py-2"
                )}
                style={chamferStyle}
              >
                <ProfileAvatar profile={m} />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      jp.className,
                      "truncate font-semibold text-white/90",
                      isWeb ? "text-[15px]" : "text-sm"
                    )}
                  >
                    {m.displayName}
                  </p>
                  <p
                    className={cn(
                      nameRajdhani.className,
                      "truncate text-white/40",
                      isWeb ? "text-[13px]" : "text-xs"
                    )}
                  >
                    @{m.handle}
                  </p>
                </div>
                <SquadPointsText value={m.points} size={isWeb ? "md" : "sm"} />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </SquadListItemShell>
  );
}

function PastSquadsPanel({
  pastSquads,
  selfUid,
  canReform,
  canInvite,
  busyId,
  onReform,
  onInvite,
  showEmpty = false,
}: {
  pastSquads: Array<PastSquadHistoryMock | GroupBattlePastSquadItem>;
  selfUid: string;
  /** 未所属時のみ一括再招集可 */
  canReform: boolean;
  /** 自スクワッド owner 時のみ個別招待可 */
  canInvite: boolean;
  busyId: string | null;
  onReform: (item: PastSquadHistoryMock | GroupBattlePastSquadItem) => void;
  onInvite: (
    item: PastSquadHistoryMock | GroupBattlePastSquadItem,
    memberUid: string
  ) => void;
  /** 0件でもセクションを残す */
  showEmpty?: boolean;
}) {
  const isWeb = useSquadBattleIsWeb();
  if (pastSquads.length === 0 && !showEmpty) return null;

  return (
    <section>
      <SquadSectionHeader
        kicker="Past squads"
        title="過去のスクワッド"
        trailing={
          <p className={cn(jp.className, "text-[11px] text-white/35")}>
            直近 {pastSquads.length} 大会
          </p>
        }
      />
      {pastSquads.length === 0 ? (
        <SquadEmptyHint>
          まだ過去のスクワッドがありません。大会終了後にここに表示されます。
        </SquadEmptyHint>
      ) : null}
      <div className={cn("flex flex-col", isWeb ? "gap-2.5" : "gap-2")}>
        {pastSquads.map((item) => {
          const key = `${item.battleId}:${item.squadId}`;
          const others = item.members.filter((m) => m.uid !== selfUid);
          return (
            <div
              key={key}
              className={cn(
                "border border-amber-400/25 bg-amber-500/[0.05]",
                isWeb ? "px-4 py-3.5" : "px-3 py-3"
              )}
              style={chamferStyle}
            >
              <div className="flex items-start gap-2.5">
                <History
                  size={isWeb ? 16 : 14}
                  className="mt-0.5 shrink-0 text-amber-300/80"
                  strokeWidth={2}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      nameOxanium.className,
                      "truncate text-[13px] font-bold uppercase tracking-wide text-amber-50"
                    )}
                  >
                    {item.squadName}
                  </p>
                  <p className={cn(jp.className, "mt-0.5 text-xs text-white/40")}>
                    {item.battleName}
                    {item.role === "owner" ? " · 代表" : " · メンバー"}
                  </p>
                  <p
                    className={cn(
                      jp.className,
                      "mt-1.5 truncate text-[12px] text-white/55"
                    )}
                  >
                    {item.members
                      .map((m) => m.displayName)
                      .join(" · ")}
                  </p>
                </div>
              </div>

              {canReform && item.role === "owner" ? (
                <SquadChamferButton
                  onClick={() => onReform(item)}
                  disabled={busyId === key}
                  variant="battle"
                  className={cn(
                    "mt-3 flex w-full items-center justify-center gap-2 px-3 font-bold uppercase tracking-wider disabled:opacity-40",
                    isWeb ? "py-2.5 text-[13px]" : "py-2 text-xs"
                  )}
                >
                  <Users size={14} strokeWidth={2.4} />
                  同じメンバーで募集
                </SquadChamferButton>
              ) : null}

              {canInvite ? (
                <div className={cn("mt-3 flex flex-col", isWeb ? "gap-1.5" : "gap-1")}>
                  {others.map((m) => (
                    <div
                      key={m.uid}
                      className="flex items-center gap-2 border border-white/10 bg-black/25 px-2.5 py-1.5"
                      style={chamferStyle}
                    >
                      <p
                        className={cn(
                          jp.className,
                          "min-w-0 flex-1 truncate text-[12px] text-white/75"
                        )}
                      >
                        {m.displayName}
                        {m.handle ? (
                          <span className="text-white/35"> @{m.handle}</span>
                        ) : null}
                      </p>
                      <button
                        type="button"
                        disabled={busyId === `${key}:${m.uid}`}
                        onClick={() => onInvite(item, m.uid)}
                        className={cn(
                          nameOxanium.className,
                          "shrink-0 border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-100 disabled:opacity-40"
                        )}
                        style={chamferStyle}
                      >
                        誘う
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {!canReform && !canInvite && item.role === "owner" ? (
                <p className={cn(jp.className, "mt-2 text-[11px] text-white/35")}>
                  未所属時に「同じメンバーで募集」できます
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function IncomingInvitesPanel({
  invites,
  onAccept,
  onDecline,
  showEmpty = false,
}: {
  invites: SquadIncomingInviteMock[];
  onAccept: (invite: SquadIncomingInviteMock) => void;
  onDecline: (invite: SquadIncomingInviteMock) => void;
  showEmpty?: boolean;
}) {
  const isWeb = useSquadBattleIsWeb();
  if (invites.length === 0 && !showEmpty) return null;

  return (
    <section>
      <SquadSectionHeader
        kicker="Invites"
        title="再招集の招待"
        accent="amber"
        trailing={
          <p className={cn(jp.className, "text-[11px] text-white/35")}>
            {invites.length} pending
          </p>
        }
      />
      {invites.length === 0 ? (
        <SquadEmptyHint>届いている再招集招待はありません。</SquadEmptyHint>
      ) : null}
      <div className={cn("flex flex-col", isWeb ? "gap-2" : "gap-1.5")}>
        {invites.map((inv) => (
          <div
            key={inv.id}
            className="flex flex-col gap-2 border border-amber-400/25 bg-amber-500/[0.06] px-3 py-2.5"
            style={chamferStyle}
          >
            <div className="flex items-center gap-2.5">
              <Mail size={14} className="shrink-0 text-amber-200/80" />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    nameOxanium.className,
                    "truncate text-[13px] font-bold uppercase tracking-wide text-amber-50"
                  )}
                >
                  {inv.squadName}
                </p>
                <p className={cn(jp.className, "text-xs text-white/40")}>
                  {inv.fromDisplayName} からの招待
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <SquadChamferButton
                onClick={() => onAccept(inv)}
                variant="battle"
                className="flex flex-1 items-center justify-center gap-1.5 py-2 text-[12px] font-bold uppercase tracking-wider"
              >
                <Check size={13} strokeWidth={2.6} />
                参加する
              </SquadChamferButton>
              <button
                type="button"
                onClick={() => onDecline(inv)}
                className={cn(
                  nameOxanium.className,
                  "flex flex-1 items-center justify-center border border-white/20 bg-black/30 py-2 text-[11px] font-bold uppercase tracking-wider text-white/55"
                )}
                style={chamferStyle}
              >
                今回はパス
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function NoneState({
  openSquads,
  outgoingRequests,
  appliedSquadIds,
  pendingCount,
  pastSquads,
  incomingInvites,
  reformBusyId,
  selfUid,
  onCreate,
  onJoinByCode,
  onApply,
  onWithdraw,
  onOpenMemberProfile,
  onReform,
  onAcceptInvite,
  onDeclineInvite,
}: {
  openSquads: OpenSquadListing[];
  outgoingRequests: SquadJoinRequest[];
  appliedSquadIds: Set<string>;
  pendingCount: number;
  pastSquads: Array<PastSquadHistoryMock | GroupBattlePastSquadItem>;
  incomingInvites: SquadIncomingInviteMock[];
  reformBusyId: string | null;
  selfUid: string;
  onCreate: () => void;
  onJoinByCode: () => void;
  onApply: (squadId: string, squadName: string) => void;
  onWithdraw: (req: SquadJoinRequest) => void;
  onOpenMemberProfile: (profile: SquadApplicantProfile) => void;
  onReform: (item: PastSquadHistoryMock | GroupBattlePastSquadItem) => void;
  onAcceptInvite: (invite: SquadIncomingInviteMock) => void;
  onDeclineInvite: (invite: SquadIncomingInviteMock) => void;
}) {
  const isWeb = useSquadBattleIsWeb();
  const atLimit = pendingCount >= SQUAD_BATTLE_MAX_PENDING_APPLICATIONS;
  const [page, setPage] = useState(0);
  const pageCount = Math.max(
    1,
    Math.ceil(openSquads.length / SQUAD_BATTLE_OPEN_PAGE_SIZE)
  );
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = openSquads.slice(
    safePage * SQUAD_BATTLE_OPEN_PAGE_SIZE,
    safePage * SQUAD_BATTLE_OPEN_PAGE_SIZE + SQUAD_BATTLE_OPEN_PAGE_SIZE
  );

  return (
    <div className={cn("flex flex-col", isWeb ? "gap-6" : "gap-5")}>
      <div className="relative overflow-hidden" style={JOIN_BATTLE_PANEL_STYLE}>
        <div
          className={cn(
            "relative z-[1] flex flex-col items-center",
            isWeb ? "px-6 py-6" : "px-5 py-5"
          )}
        >
          <div
            className={cn(
              "mb-3 overflow-hidden shadow-[0_0_16px_rgba(251,191,36,0.22)]",
              isWeb ? "h-16 w-16" : "h-14 w-14"
            )}
          >
            <Image
              src="/squad-battle/icon.png"
              alt=""
              width={isWeb ? 64 : 56}
              height={isWeb ? 64 : 56}
              className="h-full w-full object-cover"
            />
          </div>
          <h2
            className={cn(
              nameBebas.className,
              "text-center leading-none tracking-[0.08em] text-[#FFF7E0]",
              isWeb ? "text-[28px]" : "text-[24px]"
            )}
            style={{ textShadow: `0 0 18px rgba(${SQUAD_GOLD.glowRgb},0.45)` }}
          >
            JOIN THE BATTLE
          </h2>
          <div
            className={cn(
              "mt-4 flex w-full gap-2.5",
              isWeb ? "flex-row" : "flex-col"
            )}
          >
          <SquadChamferButton
            onClick={onCreate}
            variant="battle"
            className={cn(
              "flex flex-1 items-center justify-center gap-2 px-4 font-bold uppercase tracking-wider",
              isWeb ? "py-3.5 text-[15px]" : "py-3 text-sm"
            )}
          >
            <Plus size={isWeb ? 17 : 16} strokeWidth={2.5} />
            グループを作成
          </SquadChamferButton>
          <SquadChamferButton
            onClick={onJoinByCode}
            variant="battleOutline"
            className={cn(
              "flex flex-1 items-center justify-center gap-2 px-4 font-bold uppercase tracking-wider",
              isWeb ? "py-3.5 text-[15px]" : "py-3 text-sm"
            )}
          >
            <Ticket size={isWeb ? 17 : 16} strokeWidth={2} />
            招待コードで参加
          </SquadChamferButton>
          </div>
        </div>
      </div>

      <IncomingInvitesPanel
        invites={incomingInvites}
        onAccept={onAcceptInvite}
        onDecline={onDeclineInvite}
        showEmpty
      />

      <PastSquadsPanel
        pastSquads={pastSquads}
        selfUid={selfUid}
        canReform
        canInvite={false}
        busyId={reformBusyId}
        onReform={onReform}
        onInvite={() => {}}
        showEmpty
      />

      <section>
        <SquadSectionHeader
          kicker="My applications"
          accent="amber"
          trailing={
            <p
              className={cn(
                nameOxanium.className,
                "border px-2 py-1 text-[11px] font-bold tabular-nums",
                atLimit
                  ? "border-rose-400/40 bg-rose-500/10 text-rose-200/90"
                  : "border-amber-400/25 bg-amber-400/10 text-white/55"
              )}
              style={chamferStyle}
            >
              {pendingCount}/{SQUAD_BATTLE_MAX_PENDING_APPLICATIONS}
            </p>
          }
        />
        {atLimit ? (
          <p className={cn(jp.className, "mb-2 text-xs text-amber-200/70")}>
            申請は最大 {SQUAD_BATTLE_MAX_PENDING_APPLICATIONS}{" "}
            件までです。承認または取り下げ後に追加できます。
          </p>
        ) : null}
        {outgoingRequests.length === 0 ? (
          <SquadEmptyHint>送信中の参加申請はありません。</SquadEmptyHint>
        ) : (
          <div className="flex flex-col gap-2">
            {outgoingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 border border-amber-400/25 bg-amber-500/[0.06] px-3 py-2.5"
                style={chamferStyle}
              >
                <Clock size={14} className="shrink-0 text-amber-200/80" />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      nameOxanium.className,
                      "truncate text-[13px] font-bold uppercase tracking-wide text-amber-50"
                    )}
                  >
                    {req.squadName}
                  </p>
                  <p className={cn(jp.className, "text-xs text-white/40")}>
                    承認待ち · {req.createdAtLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onWithdraw(req)}
                  className={cn(
                    nameOxanium.className,
                    "shrink-0 border border-rose-400/35 bg-rose-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-100/90 transition hover:bg-rose-500/18"
                  )}
                  style={chamferStyle}
                >
                  取り下げ
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <SquadSectionHeader
          kicker="Open squads"
          title="空き枠あり"
          trailing={
            <div className="text-right">
              <p
                className={cn(
                  nameOxanium.className,
                  "inline-block border px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em] tabular-nums",
                  atLimit
                    ? "border-rose-400/40 bg-rose-500/10 text-rose-200/90"
                    : "border-amber-400/25 bg-amber-400/10 text-white/55"
                )}
                style={chamferStyle}
              >
                Applications {pendingCount}/{SQUAD_BATTLE_MAX_PENDING_APPLICATIONS}
              </p>
              <p className={cn(jp.className, "mt-0.5 text-[11px] text-white/35")}>
                {openSquads.length} groups
              </p>
            </div>
          }
        />
        {atLimit && outgoingRequests.length === 0 ? (
          <p className={cn(jp.className, "mb-2 text-xs text-amber-200/70")}>
            申請は最大 {SQUAD_BATTLE_MAX_PENDING_APPLICATIONS}{" "}
            件までです。承認または取り下げ後に追加できます。
          </p>
        ) : null}
        {pageItems.length === 0 ? (
          <SquadEmptyHint>
            いま空き枠のある公開スクワッドはありません。グループを作成するか、招待コードで参加してください。
          </SquadEmptyHint>
        ) : (
          <div className="flex flex-col gap-2">
            {pageItems.map((squad) => (
              <OpenSquadRow
                key={squad.id}
                squad={squad}
                applied={appliedSquadIds.has(squad.id)}
                applyDisabled={atLimit}
                onApply={() => onApply(squad.id, squad.name)}
                onOpenMemberProfile={onOpenMemberProfile}
              />
            ))}
          </div>
        )}
        <SquadPageBar
          page={safePage}
          pageCount={pageCount}
          onChange={setPage}
        />
      </section>
    </div>
  );
}

function IncomingRequestsPanel({
  requests,
  onOpenProfile,
  onApprove,
  onReject,
}: {
  requests: SquadJoinRequest[];
  onOpenProfile: (req: SquadJoinRequest) => void;
  onApprove: (req: SquadJoinRequest) => void;
  onReject: (req: SquadJoinRequest) => void;
}) {
  const isWeb = useSquadBattleIsWeb();
  if (requests.length === 0) return null;

  return (
    <section className={cn(isWeb ? "mt-6" : "mt-5")}>
      <SquadSectionHeader
        kicker="Join requests"
        title="参加申請"
        trailing={
          <p className={cn(jp.className, "text-[11px] text-white/35")}>
            {requests.length} pending
          </p>
        }
      />
      <div className={cn("flex flex-col", isWeb ? "gap-2.5" : "gap-2")}>
        {requests.map((req) => (
          <SquadListItemShell
            key={req.id}
            className={isWeb ? "p-4" : "p-3"}
          >
            <button
              type="button"
              onClick={() => onOpenProfile(req)}
              className="flex w-full items-center gap-3 text-left"
              aria-label={`${req.applicant.displayName}のプロフィール`}
            >
              <ProfileAvatar profile={req.applicant} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <p
                    className={cn(
                      jp.className,
                      "min-w-0 flex-1 truncate font-semibold text-white/90",
                      isWeb ? "text-[15px]" : "text-sm"
                    )}
                  >
                    {req.applicant.displayName}
                  </p>
                  <p
                    className={cn(
                      nameOxanium.className,
                      "shrink-0 font-bold uppercase tracking-[0.1em] text-white/35",
                      isWeb ? "text-[11px]" : "text-[10px]"
                    )}
                  >
                    {req.createdAtLabel}
                  </p>
                </div>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
                  <SquadPointsText
                    value={req.applicant.points}
                    size={isWeb ? "md" : "sm"}
                    color={SQUAD_GOLD.acc}
                  />
                  <span
                    className={cn(
                      nameOxanium.className,
                      "text-[10px] font-bold tracking-[0.08em]"
                    )}
                    style={{ color: SQUAD_GOLD.acc }}
                  >
                    pts
                  </span>
                  <span className="text-white/40" aria-hidden>
                    ·
                  </span>
                  <span
                    className={cn(
                      nameOxanium.className,
                      "text-[10px] font-bold tracking-[0.08em] text-amber-200/55"
                    )}
                  >
                    WR
                  </span>
                  <CyberNumber
                    value={req.applicant.winRate.toFixed(1)}
                    size={isWeb ? "md" : "sm"}
                    format={false}
                    color={SQUAD_GOLD.acc}
                  />
                  <span
                    className={cn(
                      nameOxanium.className,
                      "text-[10px] font-bold"
                    )}
                    style={{ color: SQUAD_GOLD.acc }}
                  >
                    %
                  </span>
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center justify-center border border-amber-400/25 bg-amber-400/10 text-amber-100",
                  isWeb ? "h-9 w-9" : "h-8 w-8"
                )}
                style={chamferStyle}
                aria-hidden
              >
                <UserRound size={isWeb ? 17 : 16} strokeWidth={2.2} />
              </span>
            </button>
            <div className={cn("flex gap-2", isWeb ? "mt-3" : "mt-2.5")}>
              <SquadChamferButton
                onClick={() => onReject(req)}
                variant="danger"
                className={cn(
                  "flex flex-1 items-center justify-center gap-1 font-bold uppercase tracking-wider",
                  isWeb ? "py-2.5 text-xs" : "py-2 text-[11px]"
                )}
              >
                <X size={isWeb ? 14 : 13} />
                拒否
              </SquadChamferButton>
              <SquadChamferButton
                onClick={() => onApprove(req)}
                variant="primary"
                className={cn(
                  "flex flex-1 items-center justify-center gap-1 font-bold uppercase tracking-wider",
                  isWeb ? "py-2.5 text-xs" : "py-2 text-[11px]"
                )}
              >
                <Check size={isWeb ? 14 : 13} />
                承認
              </SquadChamferButton>
            </div>
          </SquadListItemShell>
        ))}
      </div>
    </section>
  );
}

/** 上部固定 YOUR SQUAD — 左:順位 / 右:名前・メンバー・バー */
function PinnedYourSquadCard({
  squad,
  maxAvg,
}: {
  squad: Squad;
  maxAvg: number;
}) {
  const isWeb = useSquadBattleIsWeb();
  const segAccent = {
    border: "#FBBF24",
    glow: "rgba(251,191,36,0.65)",
    bg: "rgba(251,191,36,0.85)",
  };

  return (
    <div className="relative overflow-visible">
      <SquadCardTabBadge label="Your squad" />
      <div
        className="relative -mt-2.5 border border-amber-300/55 shadow-[0_0_24px_rgba(251,191,36,0.22)]"
        style={{
          ...squadCardShellStyleNoClip("subtle"),
          background: SQUAD_GOLD.panelGrad,
          boxShadow: `0 0 24px rgba(${SQUAD_GOLD.glowRgb},0.22), inset 0 1px 0 ${SQUAD_GOLD.sheen}`,
        }}
      >
        <div className="flex items-stretch pt-2">
          {/* 左: RANK */}
          <div
            className={cn(
              "flex shrink-0 flex-col items-center justify-center",
              isWeb ? "w-14 px-2 py-3.5" : "w-[3.25rem] px-1.5 py-3"
            )}
          >
            <p
              className={cn(
                nameOxanium.className,
                "font-bold uppercase tracking-[0.14em] text-amber-300/65",
                isWeb ? "text-[9px]" : "text-[8px]"
              )}
            >
              Rank
            </p>
            <p
              className={cn(
                nameBebas.className,
                "mt-0.5 text-center leading-[1.05] tracking-wide text-[#FBBF24]",
                isWeb ? "text-[32px]" : "text-[28px]"
              )}
              style={{ textShadow: "0 0 12px rgba(251,191,36,0.6)" }}
            >
              {String(squad.rank).padStart(2, "0")}
            </p>
            <div className="mt-0.5">
              <RankTrendBadge squad={squad} />
            </div>
          </div>

          {/* 右: 名前・メンバー・pts・バー */}
          <div
            className={cn(
              "flex min-w-0 flex-1 flex-col justify-center",
              isWeb ? "gap-2.5 py-3.5 pl-3 pr-4" : "gap-2 py-3 pl-2 pr-3.5"
            )}
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    nameOxanium.className,
                    "truncate font-bold uppercase tracking-wide text-white",
                    isWeb ? "text-[16px]" : "text-[14px]"
                  )}
                >
                  {squad.name}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex gap-1">
                    {squad.members.map((m) => (
                      <MemberAvatar key={m.uid} member={m} size="sm" />
                    ))}
                  </div>
                  <span
                    className={cn(
                      nameOxanium.className,
                      "text-[10px] font-bold tabular-nums text-amber-200/55"
                    )}
                  >
                    {squadMemberCountLabel(squad)}
                  </span>
                </div>
              </div>
              <div className="relative shrink-0 overflow-visible pt-0.5">
                <SquadPtsWithDayDelta
                  value={squad.avgPoints}
                  delta={squad.avgPointsDayDelta}
                  size={isWeb ? "md" : "sm"}
                  tone="accent"
                  color="#FBBF24"
                />
              </div>
            </div>
            <CyberSlantedSegBar
              pct={pointsBarPct(squad.avgPoints, maxAvg)}
              segments={10}
              compact
              forceStatic
              maxWidthClass="max-w-full"
              accent={segAccent}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** 1位カード下段 — ACE / LEAD / DEFENDING（左からフェードイン） */
function FirstPlaceStatsFooter({
  squad,
  runnerUpAvg,
  animate = true,
}: {
  squad: Squad;
  runnerUpAvg: number;
  animate?: boolean;
}) {
  const activeMembers = squad.members.filter((m) => !m.empty);
  if (activeMembers.length === 0) return null;
  const ace = activeMembers.reduce(
    (top, m) => (m.points > top.points ? m : top),
    activeMembers[0]
  );
  const lead = Math.max(0, Math.round(squad.avgPoints - runnerUpAvg));
  const weeksAtTop = squad.weeksAtTop ?? 1;
  const gold = scoreColorForRank(1);
  const reduceMotion = useReducedMotion();
  const motionOk = reduceMotion !== true && animate;

  const cellClass =
    "flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5 px-1 text-center";
  const isWeb = useSquadBattleIsWeb();
  const labelClass = cn(
    nameOxanium.className,
    "flex items-center font-bold uppercase tracking-[0.14em] text-amber-200/50",
    isWeb ? "h-5 text-[9px]" : "h-4 text-[8px]"
  );
  const valueClass = cn(
    "flex items-center justify-center overflow-visible",
    isWeb ? "h-8" : "h-7"
  );

  const items = [
    {
      key: "ace",
      node: (
        <>
          <div className={labelClass}>
            <span>ACE</span>
          </div>
          <div className={valueClass}>
            <div
              className="flex items-center justify-center gap-1"
              title={ace.displayName}
            >
              <div className="origin-center -translate-y-0.5 scale-[0.78]">
                <MemberAvatar member={ace} size="sm" />
              </div>
              <SquadPointsText
                value={ace.points}
                size="md"
                suffix="pts"
                color={gold}
              />
            </div>
          </div>
        </>
      ),
    },
    {
      key: "lead",
      node: (
        <>
          <div className={labelClass}>
            <span>LEAD</span>
          </div>
          <div className={valueClass}>
            <CyberNumber value={lead} size="md" suffix="pts" color={gold} />
          </div>
        </>
      ),
    },
    {
      key: "def",
      node: (
        <>
          <div className={labelClass}>
            <span>DEFENDING</span>
          </div>
          <div className={valueClass}>
            <CyberNumber
              value={weeksAtTop}
              size="md"
              suffix="wk"
              color={gold}
            />
          </div>
        </>
      ),
    },
  ] as const;

  return (
    <div className="relative overflow-hidden border-t border-amber-300/25">
      <div
        className={cn(
          "relative z-[1] flex items-stretch",
          isWeb ? "min-h-[3.75rem] px-3 py-2" : "min-h-[3.25rem] px-2 py-1.5"
        )}
      >
        {items.map((it, i) => (
          <motion.div
            key={it.key}
            className={cellClass}
            initial={motionOk ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{
              duration: SQUAD_FIRST_FOOTER_FADE_S,
              delay: motionOk
                ? squadFirstFooterDelayS(i as 0 | 1 | 2)
                : 0,
              ease: "easeOut",
            }}
          >
            {it.node}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/** 2位以下 — 直前グループとのスコア差 */
function LeaderboardGapFooter({
  gapToAbove,
}: {
  gapToAbove: number | null;
}) {
  if (gapToAbove == null) return null;
  const isWeb = useSquadBattleIsWeb();
  return (
    <div className="flex items-center justify-between border-t border-amber-400/15 px-3 py-1.5">
      <span
        className={cn(
          nameOxanium.className,
          "text-[9px] font-bold uppercase tracking-[0.14em] text-white/35"
        )}
      >
        GAP TO ABOVE
      </span>
      <span
        className={cn(
          nameOxanium.className,
          "font-black tabular-nums text-amber-100/70",
          isWeb ? "text-[12px]" : "text-[11px]"
        )}
      >
        −{gapToAbove} pts
      </span>
    </div>
  );
}

function LeaderboardRow({
  squad,
  maxAvg,
  runnerUpAvg = 0,
  board = [],
  index = 0,
  animate = true,
}: {
  squad: Squad;
  maxAvg: number;
  /** 2位の平均点（1位カードの LEAD 表示用） */
  runnerUpAvg?: number;
  /** 前後ギャップ計算用 */
  board?: Squad[];
  /** スタッガー用インデックス */
  index?: number;
  /** 入場アニメを有効にする */
  animate?: boolean;
}) {
  const first = squad.rank === 1;
  const palette = cyberRankPalette(squad.rank);
  const segAccent = segAccentForRank(squad.rank);
  const reduceMotion = useReducedMotion();
  const motionOff = reduceMotion === true || !animate;
  const isWeb = useSquadBattleIsWeb();
  const { gapToAbove } = squadScoreGaps(squad, board);

  const row = (
    <LeaderboardCardShell rank={squad.rank}>
      {/* 既存カード本体 */}
      <div
        className={cn(
          "flex items-center overflow-visible",
          isWeb ? "gap-3 px-4 py-3.5" : "gap-2.5 px-3 py-3"
        )}
      >
        <div
          className={cn(
            "flex shrink-0 translate-y-1.5 flex-col items-center gap-0.5 self-center",
            isWeb ? "w-12" : "w-10"
          )}
        >
          <p
            className={cn(
              nameBebas.className,
              "text-center leading-none tracking-wide",
              isWeb ? "text-[34px]" : "text-[30px]"
            )}
            style={{
              color: scoreColorForRank(squad.rank),
              textShadow:
                squad.rank <= 3 ? `0 0 10px ${palette.accentGlow}` : "none",
            }}
          >
            {String(squad.rank).padStart(2, "0")}
          </p>
          <RankTrendBadge squad={squad} />
        </div>
        <div className={cn("flex min-w-0 flex-1 flex-col", isWeb ? "gap-2.5" : "gap-2")}>
          <div className={cn("flex items-start", isWeb ? "gap-3" : "gap-2.5")}>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  nameOxanium.className,
                  "flex items-center gap-1.5 truncate font-bold uppercase tracking-wide",
                  isWeb ? "text-[15px]" : "text-[13px]",
                  first ? "text-[#FFFBEB]" : "text-white/90"
                )}
              >
                {first ? (
                  <Crown
                    size={isWeb ? 15 : 13}
                    strokeWidth={2.4}
                    className="shrink-0 text-[#FFD65A]"
                    style={{
                      filter: "drop-shadow(0 0 6px rgba(255,214,90,0.7))",
                    }}
                    aria-hidden
                  />
                ) : null}
                <span className="min-w-0 truncate">{squad.name}</span>
              </p>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex gap-1">
                  {squad.members.map((m, i) =>
                    first && !motionOff ? (
                      <motion.span
                        key={m.uid}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          delay: squadFirstAvatarDelayS(i),
                          duration: SQUAD_FIRST_AVATAR_FADE_S,
                          ease: "easeOut",
                        }}
                      >
                        <MemberAvatar member={m} size="sm" />
                      </motion.span>
                    ) : (
                      <MemberAvatar key={m.uid} member={m} size="sm" />
                    )
                  )}
                </div>
                <span
                  className={cn(
                    nameOxanium.className,
                    "text-[10px] font-bold tabular-nums text-white/40"
                  )}
                >
                  {squadMemberCountLabel(squad)}
                </span>
              </div>
            </div>
            <div className="relative shrink-0 self-center overflow-visible">
              <SquadPtsWithDayDelta
                value={squad.avgPoints}
                delta={squad.avgPointsDayDelta}
                size="md"
                tone={first ? "accent" : "default"}
                color={scoreColorForRank(squad.rank)}
              />
            </div>
          </div>
          <CyberSlantedSegBar
            pct={pointsBarPct(squad.avgPoints, maxAvg)}
            segments={14}
            compact
            forceStatic={motionOff || first}
            enterDelay={motionOff || first ? 0 : index * LB_ROW_STAGGER_S}
            maxWidthClass="max-w-full"
            accent={segAccent}
          />
        </div>
      </div>

      {/* 1位のみ — 下帯にチームスタッツ（ACE / LEAD / DEFENDING） */}
      {first ? (
        <FirstPlaceStatsFooter
          squad={squad}
          runnerUpAvg={runnerUpAvg}
          animate={!motionOff}
        />
      ) : (
        <LeaderboardGapFooter gapToAbove={gapToAbove} />
      )}
    </LeaderboardCardShell>
  );

  if (motionOff) return row;

  /** 1位 — フェードインのみ（溜めなし） */
  if (first) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: SQUAD_FIRST_FADE_IN_S,
          ease: SQUAD_FIRST_FADE_IN_EASE,
        }}
      >
        {row}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.28,
        delay: index * LB_ROW_STAGGER_S,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {row}
    </motion.div>
  );
}

function Toast({ message }: { message: string }) {
  const isWeb = useSquadBattleIsWeb();
  return (
    <div
      className={cn(
        "fixed left-1/2 z-[80] -translate-x-1/2 border border-amber-400/35 bg-[#0A0805]/95 px-4 py-2.5 shadow-[0_0_24px_rgba(251,191,36,0.2)]",
        nameOxanium.className,
        "font-bold uppercase tracking-[0.16em] text-amber-100",
        isWeb ? "bottom-10 text-xs" : "bottom-28 text-[11px]"
      )}
      style={chamferStyle}
      role="status"
    >
      {message}
    </div>
  );
}

/** プレビュー状態スイッチャー（ヘッダーバーガー → オーバーレイ） */
function SquadBattlePreviewToolsOverlay({
  open,
  previewState,
  uiPhase,
  boardStatus,
  onClose,
  onChangeState,
  onChangePhase,
  onChangeBoardStatus,
  onReplayIntro,
  reduceMotion,
  variant,
}: {
  open: boolean;
  previewState: SquadBattlePreviewState;
  uiPhase: SquadBattleUiPhase;
  boardStatus: "live" | "final";
  onClose: () => void;
  onChangeState: (next: SquadBattlePreviewState) => void;
  onChangePhase: (next: SquadBattleUiPhase) => void;
  onChangeBoardStatus: (next: "live" | "final") => void;
  onReplayIntro: () => void;
  reduceMotion: boolean;
  variant: "web" | "mobile";
}) {
  const [mounted, setMounted] = useState(false);
  const isWeb = variant === "web";

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
          key="squad-battle-preview-tools"
          className={cn(
            "fixed inset-0 z-[1000040] flex p-4",
            // Web: ヘッダー右上のバーガー直下に寄せる / Mobile: 中央モーダル
            isWeb
              ? "items-start justify-end pt-[4.75rem] pr-5 md:pr-8 lg:pr-10"
              : "items-center justify-center"
          )}
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
            role="dialog"
            aria-modal="true"
            aria-labelledby="squad-battle-preview-tools-title"
            className={cn(
              "relative z-[1] overflow-hidden rounded-xl border border-amber-400/25 bg-[#0a0c10] shadow-[0_0_40px_rgba(251,191,36,0.12)]",
              isWeb
                ? "w-full max-w-sm p-4 md:max-w-md md:p-5"
                : "w-full max-w-md p-3"
            )}
            onClick={(e) => e.stopPropagation()}
            initial={
              reduceMotion
                ? false
                : isWeb
                  ? { opacity: 0, y: -6, scale: 0.98 }
                  : { opacity: 0, y: 10, scale: 0.97 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : isWeb
                  ? { opacity: 0, y: -4, scale: 0.98 }
                  : { opacity: 0, y: 8, scale: 0.98 }
            }
            transition={{
              duration: reduceMotion ? 0 : 0.22,
              ease: GAMES_CYBER_EASE,
            }}
          >
            <div
              className={cn(
                "mb-2 flex items-center justify-between gap-3",
                isWeb && "mb-3"
              )}
            >
              <p
                id="squad-battle-preview-tools-title"
                className={cn(
                  nameOxanium.className,
                  "font-bold uppercase tracking-[0.2em] text-amber-200/70",
                  isWeb ? "text-[11px] tracking-[0.22em]" : "text-[10px]"
                )}
              >
                Preview state
              </p>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "flex shrink-0 items-center justify-center border border-amber-400/30 bg-amber-500/10 text-amber-100/90 transition hover:border-amber-300/50 hover:bg-amber-500/16",
                  isWeb ? "h-9 w-9" : "h-8 w-8"
                )}
                style={{
                  clipPath:
                    "polygon(5px 0%, 100% 0%, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0% 100%, 0% 5px)",
                }}
                aria-label="閉じる"
              >
                <X size={isWeb ? 15 : 14} strokeWidth={2.4} />
              </button>
            </div>
            <p
              className={cn(
                nameOxanium.className,
                "mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/35"
              )}
            >
              Membership
            </p>
            <div className={cn("mb-4 flex flex-wrap", isWeb ? "gap-2.5" : "gap-2")}>
              {SQUAD_BATTLE_PREVIEW_STATES.map((s) => {
                const active = previewState === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onChangeState(s.id)}
                    className={cn(
                      nameOxanium.className,
                      "rounded-lg border font-bold uppercase tracking-wider transition",
                      isWeb
                        ? "px-4 py-2 text-xs"
                        : "px-3 py-1.5 text-[11px]",
                      active
                        ? "border-amber-300/55 bg-amber-400/20 text-amber-50"
                        : "border-white/12 bg-black/20 text-white/55 hover:border-white/25"
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
            <p
              className={cn(
                nameOxanium.className,
                "mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/35"
              )}
            >
              Season phase
            </p>
            <div className={cn("mb-4 flex flex-wrap", isWeb ? "gap-2.5" : "gap-2")}>
              {SQUAD_BATTLE_UI_PHASE_OPTIONS.map((s) => {
                const active = uiPhase === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onChangePhase(s.id)}
                    className={cn(
                      nameOxanium.className,
                      "rounded-lg border font-bold uppercase tracking-wider transition",
                      isWeb
                        ? "px-4 py-2 text-xs"
                        : "px-3 py-1.5 text-[11px]",
                      active
                        ? "border-amber-300/55 bg-amber-400/20 text-amber-50"
                        : "border-white/12 bg-black/20 text-white/55 hover:border-white/25"
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
            <p
              className={cn(
                nameOxanium.className,
                "mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/35"
              )}
            >
              Board
            </p>
            <div className={cn("mb-4 flex flex-wrap", isWeb ? "gap-2.5" : "gap-2")}>
              {(["live", "final"] as const).map((s) => {
                const active = boardStatus === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onChangeBoardStatus(s)}
                    className={cn(
                      nameOxanium.className,
                      "rounded-lg border font-bold uppercase tracking-wider transition",
                      isWeb
                        ? "px-4 py-2 text-xs"
                        : "px-3 py-1.5 text-[11px]",
                      active
                        ? "border-amber-300/55 bg-amber-400/20 text-amber-50"
                        : "border-white/12 bg-black/20 text-white/55 hover:border-white/25"
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <div className={cn("flex flex-wrap", isWeb ? "gap-2.5" : "gap-2")}>
              <button
                type="button"
                onClick={() => {
                  onReplayIntro();
                  onClose();
                }}
                className={cn(
                  nameOxanium.className,
                  "inline-flex items-center gap-1.5 rounded-lg border border-rose-400/35 bg-rose-500/10 font-bold uppercase tracking-wider text-rose-100/90 transition hover:border-rose-300/50 hover:bg-rose-500/16",
                  isWeb
                    ? "px-4 py-2 text-xs"
                    : "px-3 py-1.5 text-[11px]"
                )}
              >
                <RotateCcw size={isWeb ? 13 : 12} strokeWidth={2.5} aria-hidden />
                イントロ再生
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

export default function SquadBattlePage({ variant }: Props) {
  const [previewState, setPreviewState] =
    useState<SquadBattlePreviewState>("full");
  const [previewToolsOpen, setPreviewToolsOpen] = useState(false);
  const [mainTab, setMainTab] = useState<"join" | "rank">("rank");
  const [toast, setToast] = useState<string | null>(null);
  const reduceMotion = useReducedMotion() === true;
  const [extraAppliedIds, setExtraAppliedIds] = useState<string[]>([]);
  const [dismissedRequestIds, setDismissedRequestIds] = useState<string[]>([]);
  const [profileRequest, setProfileRequest] = useState<SquadJoinRequest | null>(
    null
  );
  const [viewedProfile, setViewedProfile] = useState<{
    profile: SquadApplicantProfile;
    metaLabel?: string;
  } | null>(null);
  const [createSquadOpen, setCreateSquadOpen] = useState(false);
  const [joinByCodeOpen, setJoinByCodeOpen] = useState(false);
  const [joinByCodeBusy, setJoinByCodeBusy] = useState(false);
  /** 作成フローで決めた名前（プレビュー用オーバーライド） */
  const [createdSquadName, setCreatedSquadName] = useState<string | null>(null);
  /** 初回イントロ — SSR 不一致回避のため初期 false、effect で開く */
  const [introOpen, setIntroOpen] = useState(false);
  /** RANK サブ: 週間 / 月間 */
  const [rankPeriod, setRankPeriod] = useState<"weekly" | "monthly">("weekly");
  /** 週間の週インデックス（プレビュー） */
  const [weekIndex, setWeekIndex] = useState<SquadBattleWeekIndex>(2);
  /** 開催フェーズ（プレビュー切替） */
  const [uiPhase, setUiPhase] = useState<SquadBattleUiPhase>("battle");
  /** 本番スナップショット状態。モック時は live */
  const [boardStatus, setBoardStatus] = useState<"live" | "final">("live");
  /** 取り下げた申請 ID（プレビュー） */
  const [withdrawnRequestIds, setWithdrawnRequestIds] = useState<string[]>([]);
  /** API 接続時の battleId（未接続なら null → モック） */
  const [liveBattleId, setLiveBattleId] = useState<string | null>(null);
  const [livePastSquads, setLivePastSquads] = useState<
    GroupBattlePastSquadItem[] | null
  >(null);
  const [liveIncomingInvites, setLiveIncomingInvites] = useState<
    SquadIncomingInviteMock[] | null
  >(null);
  const [liveSelfUid, setLiveSelfUid] = useState<string | null>(null);
  const [liveMySquadId, setLiveMySquadId] = useState<string | null>(null);
  const [liveIsOwner, setLiveIsOwner] = useState(false);
  const [reformBusyId, setReformBusyId] = useState<string | null>(null);
  const [reformTarget, setReformTarget] = useState<
    PastSquadHistoryMock | GroupBattlePastSquadItem | null
  >(null);
  const [dismissedInviteIds, setDismissedInviteIds] = useState<string[]>([]);

  useEffect(() => {
    if (!hasSeenSquadBattleIntro()) {
      setIntroOpen(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { auth } = await import("@/lib/firebase");
        const user = auth.currentUser;
        const token = await user?.getIdToken();
        const {
          fetchCurrentGroupBattle,
          fetchGroupBattleRankings,
          fetchPastGroupBattleSquads,
          fetchGroupBattleIncomingInvites,
        } = await import("@/lib/groupBattles/clientApi");
        const current = await fetchCurrentGroupBattle({ idToken: token });
        if (cancelled || !current?.battle) return;
        setLiveBattleId(current.battle.id);
        if (user?.uid) setLiveSelfUid(user.uid);
        setLiveMySquadId(current.mySquad?.id ?? null);
        setLiveIsOwner(current.membership?.role === "owner");
        const label =
          rankPeriod === "weekly"
            ? current.battle.weeklyLabels?.[current.battle.weeklyLabels.length - 1]
            : current.battle.monthlyRange?.label;
        const rankings = await fetchGroupBattleRankings(
          current.battle.id,
          rankPeriod,
          label,
          { idToken: token }
        );
        if (!cancelled && rankings?.snapshot) {
          setBoardStatus(rankings.snapshot.status);
        }
        if (token) {
          const past = await fetchPastGroupBattleSquads({ idToken: token });
          if (!cancelled && past?.pastSquads) {
            setLivePastSquads(past.pastSquads);
          }
          const invites = await fetchGroupBattleIncomingInvites(
            current.battle.id,
            { idToken: token }
          );
          if (!cancelled && invites?.invites) {
            setLiveIncomingInvites(
              invites.invites.map((i) => ({
                id: i.id,
                squadId: i.squadId,
                squadName: i.squadName,
                fromDisplayName: i.fromDisplayName,
              }))
            );
          }
        }
      } catch {
        // モック継続
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rankPeriod]);

  const mock = useMemo(() => getSquadBattleMock(previewState), [previewState]);

  const mySquad = useMemo(() => {
    if (!mock.mySquad) return null;
    if (!createdSquadName) return mock.mySquad;
    return { ...mock.mySquad, name: createdSquadName };
  }, [mock.mySquad, createdSquadName]);

  const boardMaxAvg = useMemo(
    () => Math.max(1, ...mock.leaderboard.map((s) => s.avgPoints)),
    [mock.leaderboard]
  );

  const boardOthers = useMemo(
    () => mock.leaderboard.filter((s) => !s.isMine),
    [mock.leaderboard]
  );

  const boardRunnerUpAvg = useMemo(
    () => mock.leaderboard.find((s) => s.rank === 2)?.avgPoints ?? 0,
    [mock.leaderboard]
  );

  const appliedSquadIds = useMemo(() => {
    const ids = new Set(mock.myOutgoingRequests.map((r) => r.squadId));
    for (const id of extraAppliedIds) ids.add(id);
    return ids;
  }, [mock.myOutgoingRequests, extraAppliedIds]);

  const visibleIncoming = useMemo(
    () =>
      mock.incomingRequests.filter((r) => !dismissedRequestIds.includes(r.id)),
    [mock.incomingRequests, dismissedRequestIds]
  );

  const outgoingForDisplay = useMemo(() => {
    const base = [...mock.myOutgoingRequests];
    for (const id of extraAppliedIds) {
      if (base.some((r) => r.squadId === id)) continue;
      const squad = mock.openSquads.find((s) => s.id === id);
      if (!squad) continue;
      base.push({
        id: `local-${id}`,
        squadId: id,
        squadName: squad.name,
        status: "pending",
        createdAtLabel: "たった今",
        applicant: {
          uid: "me",
          handle: "kamiya",
          displayName: "Kamiya",
          points: 1284,
          winRate: 57.1,
          activeWinStreak: 3,
          totalPosts: 140,
          bio: "",
        },
      });
    }
    return base.filter((r) => !withdrawnRequestIds.includes(r.id));
  }, [
    mock.myOutgoingRequests,
    mock.openSquads,
    extraAppliedIds,
    withdrawnRequestIds,
  ]);

  const pendingCount = outgoingForDisplay.length;
  const myActiveCount = mySquad ? countActiveMembers(mySquad) : 0;
  const phaseTrackKey =
    uiPhase === "idle" ? "reward" : uiPhase;

  const pastSquadsForUi = livePastSquads ?? mock.pastSquads;
  const incomingInvitesForUi = useMemo(() => {
    const base = liveIncomingInvites ?? mock.incomingInvites;
    return base.filter((i) => !dismissedInviteIds.includes(i.id));
  }, [liveIncomingInvites, mock.incomingInvites, dismissedInviteIds]);
  const selfUidForUi = liveSelfUid ?? "me";

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  }

  async function withAuthToken() {
    const { auth } = await import("@/lib/firebase");
    return auth.currentUser?.getIdToken() ?? null;
  }

  async function handleReformConfirm(name: string) {
    const target = reformTarget;
    setReformTarget(null);
    if (!target) return;
    const busyKey = `${target.battleId}:${target.squadId}`;
    setReformBusyId(busyKey);

    if (liveBattleId) {
      try {
        const token = await withAuthToken();
        const { reformGroupBattleSquad } = await import(
          "@/lib/groupBattles/clientApi"
        );
        const res = await reformGroupBattleSquad(
          liveBattleId,
          {
            sourceBattleId: target.battleId,
            sourceSquadId: target.squadId,
            name,
          },
          { idToken: token }
        );
        if (!res.ok) {
          flash(`再招集失敗: ${res.error}`);
          setReformBusyId(null);
          return;
        }
        setCreatedSquadName(name);
        setPreviewState("recruiting");
        setLiveMySquadId(res.squadId);
        setLiveIsOwner(true);
        flash(
          `再招集: ${name}（招待 ${res.invited.length} / スキップ ${res.skipped.length}）`
        );
      } catch {
        flash("再招集に失敗しました");
      }
      setReformBusyId(null);
      return;
    }

    setCreatedSquadName(name);
    setPreviewState("recruiting");
    setExtraAppliedIds([]);
    setDismissedRequestIds([]);
    setProfileRequest(null);
    setViewedProfile(null);
    setMainTab("join");
    flash(`同じメンバーで募集: ${name}`);
    setReformBusyId(null);
  }

  async function handleInvitePastMember(
    item: PastSquadHistoryMock | GroupBattlePastSquadItem,
    memberUid: string
  ) {
    const busyKey = `${item.battleId}:${item.squadId}:${memberUid}`;
    setReformBusyId(busyKey);
    const squadId = liveMySquadId ?? mySquad?.id;
    if (liveBattleId && squadId) {
      try {
        const token = await withAuthToken();
        const { inviteToGroupBattleSquad } = await import(
          "@/lib/groupBattles/clientApi"
        );
        const res = await inviteToGroupBattleSquad(
          liveBattleId,
          squadId,
          {
            targetUid: memberUid,
            sourceBattleId: item.battleId,
            sourceSquadId: item.squadId,
          },
          { idToken: token }
        );
        flash(res.ok ? "招待を送りました" : `招待失敗: ${res.error}`);
      } catch {
        flash("招待に失敗しました");
      }
      setReformBusyId(null);
      return;
    }
    const member = item.members.find((m) => m.uid === memberUid);
    flash(`誘う: ${member?.displayName ?? memberUid}`);
    setReformBusyId(null);
  }

  async function handleAcceptInvite(invite: SquadIncomingInviteMock) {
    if (liveBattleId) {
      try {
        const token = await withAuthToken();
        const { acceptGroupBattleInvite } = await import(
          "@/lib/groupBattles/clientApi"
        );
        const res = await acceptGroupBattleInvite(liveBattleId, invite.id, {
          idToken: token,
        });
        if (!res.ok) {
          flash(`参加失敗: ${res.error}`);
          return;
        }
        setDismissedInviteIds((prev) => [...prev, invite.id]);
        setPreviewState("recruiting");
        setCreatedSquadName(invite.squadName);
        flash(`参加: ${invite.squadName}`);
        return;
      } catch {
        flash("参加に失敗しました");
        return;
      }
    }
    setDismissedInviteIds((prev) => [...prev, invite.id]);
    setPreviewState("recruiting");
    setCreatedSquadName(invite.squadName);
    flash(`参加: ${invite.squadName}`);
  }

  async function handleDeclineInvite(invite: SquadIncomingInviteMock) {
    if (liveBattleId) {
      try {
        const token = await withAuthToken();
        const { declineGroupBattleInvite } = await import(
          "@/lib/groupBattles/clientApi"
        );
        const res = await declineGroupBattleInvite(liveBattleId, invite.id, {
          idToken: token,
        });
        if (!res.ok) {
          flash(`パス失敗: ${res.error}`);
          return;
        }
      } catch {
        flash("パスに失敗しました");
        return;
      }
    }
    setDismissedInviteIds((prev) => [...prev, invite.id]);
    flash(`パス: ${invite.squadName}`);
  }

  function handlePreviewStateChange(next: SquadBattlePreviewState) {
    setPreviewState(next);
    setExtraAppliedIds([]);
    setDismissedRequestIds([]);
    setProfileRequest(null);
    setViewedProfile(null);
    setCreateSquadOpen(false);
    setJoinByCodeOpen(false);
    setCreatedSquadName(null);
    setReformTarget(null);
    setDismissedInviteIds([]);
    // 未参加は参加タブ、所属中は順位タブを初期表示
    setMainTab(next === "none" ? "join" : "rank");
  }

  async function handleJoinByCode(code: string) {
    const normalized = normalizeUiInviteCode(code);
    if (normalized.length < 4) return;
    setJoinByCodeBusy(true);

    if (liveBattleId) {
      try {
        const token = await withAuthToken();
        const { joinGroupBattleByInviteCode } = await import(
          "@/lib/groupBattles/clientApi"
        );
        const res = await joinGroupBattleByInviteCode(
          liveBattleId,
          code,
          { idToken: token }
        );
        if (!res.ok) {
          flash(
            res.error === "invalid_invite"
              ? "コードが無効です"
              : `参加失敗: ${res.error}`
          );
          setJoinByCodeBusy(false);
          return;
        }
        setJoinByCodeOpen(false);
        setPreviewState("recruiting");
        setLiveMySquadId(res.squadId);
        setLiveIsOwner(false);
        flash("スクワッドに参加しました");
      } catch {
        flash("参加に失敗しました");
      }
      setJoinByCodeBusy(false);
      return;
    }

    const mockNorm = normalizeUiInviteCode(SQUAD_BATTLE_MOCK_INVITE_CODE);
    if (normalized !== mockNorm) {
      flash("コードが無効です（プレビューは NC-7K2M）");
      setJoinByCodeBusy(false);
      return;
    }
    setJoinByCodeOpen(false);
    setPreviewState("recruiting");
    setExtraAppliedIds([]);
    setDismissedRequestIds([]);
    setMainTab("join");
    flash("招待コードで参加しました");
    setJoinByCodeBusy(false);
  }

  function handleCreateSquad(name: string) {
    setCreateSquadOpen(false);
    setCreatedSquadName(name);
    setPreviewState("recruiting");
    setExtraAppliedIds([]);
    setDismissedRequestIds([]);
    setProfileRequest(null);
    setViewedProfile(null);
    setMainTab("join");
    flash(`グループを作成: ${name}`);
  }

  function handleRenameSquad(name: string) {
    setCreatedSquadName(name);
    flash(`名前を変更: ${name}`);
  }

  function openMemberProfile(profile: SquadApplicantProfile, metaLabel?: string) {
    setProfileRequest(null);
    setViewedProfile({ profile, metaLabel });
  }

  return (
    <SquadBattleIsWebCtx.Provider value={variant === "web"}>
    <>
      <CyberSubpageShell
        eyebrow="RANKINGS"
        title="SQUAD BATTLE"
        subtitle={SQUAD_BATTLE_HELP_TEXT}
        headerTrailing={
          variant === "web" ? (
            <div className="flex items-center pr-0.5 md:pr-1">
              <CyberMenuButton
                size="lg"
                className={GAMES_HEADER_CONTROL_H_LG}
                onClick={() => setPreviewToolsOpen(true)}
                aria-label="プレビュー状態"
                aria-expanded={previewToolsOpen}
                aria-haspopup="dialog"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPreviewToolsOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center text-amber-100/90 transition active:scale-95"
              aria-label="プレビュー状態"
              aria-expanded={previewToolsOpen}
              aria-haspopup="dialog"
            >
              <Menu
                size={20}
                strokeWidth={2.2}
                className="drop-shadow-[0_0_6px_rgba(251,191,36,0.45)]"
                aria-hidden
              />
            </button>
          )
        }
        onBack={() => {
          if (typeof window !== "undefined") window.history.back();
        }}
        contentClassName={
          variant === "web"
            ? "max-w-3xl px-6 py-6 pb-32 md:px-8"
            : "max-w-lg px-3 py-5 pb-28"
        }
      >
        {/* 参加 / 順位 — Rankings と同じ CyberSlantedTab */}
        <div className={variant === "web" ? "mb-7" : "mb-5"}>
          <CyberSlantedTabBar fill aria-label="Squad Battle">
            <CyberSlantedTab
              role="tab"
              label="JOIN"
              active={mainTab === "join"}
              onClick={() => setMainTab("join")}
              compact
              fontWeight={900}
            />
            <CyberSlantedTab
              role="tab"
              label="RANK"
              active={mainTab === "rank"}
              onClick={() => setMainTab("rank")}
              compact
              fontWeight={900}
            />
          </CyberSlantedTabBar>
        </div>

        {mainTab === "join" ? (
          <div className={cn("flex flex-col", variant === "web" ? "gap-5" : "gap-4")}>
          <SquadGoldPhaseTrack activeKey={phaseTrackKey} />
          <SquadPhaseStatusBanner
            phase={uiPhase}
            hasSquad={mySquad != null}
            activeMemberCount={myActiveCount}
            deadlineLabel={
              uiPhase === "entry" ? SQUAD_BATTLE_MOCK_DEADLINE_LABEL : null
            }
          />
          {uiPhase === "idle" ? (
            <SquadIdlePanel />
          ) : uiPhase === "reward" ? (
            <SquadRewardResultPanel hasSquad={mySquad != null} />
          ) : mySquad == null ? (
            uiPhase === "battle" ? (
              <div className={cn("flex flex-col", variant === "web" ? "gap-4" : "gap-3")}>
                <SquadEmptyHint>
                  バトル中のため新規参加・作成はできません。順位表は RANK
                  タブで観戦できます。
                </SquadEmptyHint>
                <button
                  type="button"
                  onClick={() => setMainTab("rank")}
                  className={cn(
                    nameOxanium.className,
                    "border border-amber-400/35 bg-amber-400/10 py-3 text-[12px] font-black uppercase tracking-[0.18em] text-amber-50"
                  )}
                  style={chamferStyle}
                >
                  RANK を見る
                </button>
              </div>
            ) : (
            <NoneState
              openSquads={mock.openSquads}
              outgoingRequests={outgoingForDisplay}
              appliedSquadIds={appliedSquadIds}
              pendingCount={pendingCount}
              pastSquads={pastSquadsForUi}
              incomingInvites={incomingInvitesForUi}
              reformBusyId={reformBusyId}
              selfUid={selfUidForUi}
              onCreate={() => setCreateSquadOpen(true)}
              onJoinByCode={() => setJoinByCodeOpen(true)}
              onApply={(squadId, squadName) => {
                if (appliedSquadIds.has(squadId)) return;
                if (pendingCount >= SQUAD_BATTLE_MAX_PENDING_APPLICATIONS) {
                  flash(
                    `申請は最大${SQUAD_BATTLE_MAX_PENDING_APPLICATIONS}件まで`
                  );
                  return;
                }
                setExtraAppliedIds((prev) =>
                  prev.includes(squadId) ? prev : [...prev, squadId]
                );
                flash(`申請を送信: ${squadName}`);
              }}
              onWithdraw={(req) => {
                setWithdrawnRequestIds((prev) =>
                  prev.includes(req.id) ? prev : [...prev, req.id]
                );
                setExtraAppliedIds((prev) =>
                  prev.filter((id) => id !== req.squadId)
                );
                flash(`申請を取り下げ: ${req.squadName}`);
              }}
              onOpenMemberProfile={(profile) =>
                openMemberProfile(profile, "募集中スクワッドのメンバー")
              }
              onReform={(item) => setReformTarget(item)}
              onAcceptInvite={(invite) => {
                void handleAcceptInvite(invite);
              }}
              onDeclineInvite={(invite) => {
                void handleDeclineInvite(invite);
              }}
            />
            )
          ) : (
            <>
              <MySquadCard
                squad={mySquad}
                maxAvg={boardMaxAvg}
                onOpenMemberProfile={(profile) =>
                  openMemberProfile(profile, "スクワッドメンバー")
                }
                onCopyInviteCode={(code) => {
                  void copyTextToClipboard(code).then((ok) => {
                    flash(ok ? `コピーしました: ${code}` : `コピー失敗: ${code}`);
                  });
                }}
                onRenameSquad={
                  uiPhase === "entry" ? handleRenameSquad : undefined
                }
              />
              {uiPhase === "battle" || previewState === "full" ? (
                <p
                  className={cn(
                    jp.className,
                    "border border-amber-400/25 bg-amber-500/[0.06] px-3 py-2 text-[12px] text-amber-100/70"
                  )}
                  style={chamferStyle}
                >
                  メンバー LOCKED · 入れ替え・追加申請の受付は終了しています。
                </p>
              ) : null}
              {(liveIsOwner || previewState === "recruiting") &&
              uiPhase === "entry" &&
              pastSquadsForUi.length > 0 ? (
                <div className={variant === "web" ? "mt-6" : "mt-5"}>
                  <PastSquadsPanel
                    pastSquads={pastSquadsForUi}
                    selfUid={selfUidForUi}
                    canReform={false}
                    canInvite={liveIsOwner || previewState === "recruiting"}
                    busyId={reformBusyId}
                    onReform={() => {}}
                    onInvite={(item, uid) => {
                      void handleInvitePastMember(item, uid);
                    }}
                  />
                </div>
              ) : null}
              {uiPhase === "entry" ? (
              <IncomingRequestsPanel
                requests={visibleIncoming}
                onOpenProfile={(req) => {
                  setViewedProfile(null);
                  setProfileRequest(req);
                }}
                onApprove={(req) => {
                  setDismissedRequestIds((prev) => [...prev, req.id]);
                  setProfileRequest(null);
                  flash(`承認: ${req.applicant.displayName}`);
                }}
                onReject={(req) => {
                  setDismissedRequestIds((prev) => [...prev, req.id]);
                  setProfileRequest(null);
                  flash(`拒否: ${req.applicant.displayName}`);
                }}
              />
              ) : null}
            </>
          )}
          </div>
        ) : (
          <section>
            <div
              className={cn(
                "flex items-center gap-3",
                variant === "web" ? "mb-4" : "mb-3"
              )}
            >
              <div className="min-w-0 flex-1">
                <CyberSlantedTabBar fill aria-label="週間・月間">
                  <CyberSlantedTab
                    role="tab"
                    label="WEEK"
                    active={rankPeriod === "weekly"}
                    onClick={() => setRankPeriod("weekly")}
                    compact
                    fontWeight={900}
                  />
                  <CyberSlantedTab
                    role="tab"
                    label="MONTH"
                    active={rankPeriod === "monthly"}
                    onClick={() => setRankPeriod("monthly")}
                    compact
                    fontWeight={900}
                  />
                </CyberSlantedTabBar>
              </div>
              <span
                className={cn(
                  nameOxanium.className,
                  "shrink-0 rounded-sm border px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em]",
                  boardStatus === "final"
                    ? "border-amber-300/50 bg-amber-400/15 text-amber-200"
                    : "border-amber-400/45 bg-amber-400/10 text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.25)]"
                )}
                title={
                  liveBattleId
                    ? `大会 ${liveBattleId}`
                    : "プレビュー（モック）"
                }
              >
                {boardStatus === "final" ? "FINAL" : "LIVE"}
              </span>
            </div>

            {rankPeriod === "weekly" ? (
              <SquadWeekChips weekIndex={weekIndex} onChange={setWeekIndex} />
            ) : (
              <p className={cn(jp.className, "mb-3 text-[11px] text-white/40")}>
                月間 · 開催期間全体の平均スコア
              </p>
            )}

            <p className={cn(jp.className, "mb-3 text-[11px] leading-snug text-white/40")}>
              {SQUAD_BATTLE_BOARD_STATUS_HINT[boardStatus]}
              {" · "}
              同点は同順位・同 Unit
            </p>

            {uiPhase === "idle" ? (
              <SquadIdlePanel />
            ) : null}

            {uiPhase === "reward" ? (
              <div className="mb-4">
                <SquadRewardResultPanel hasSquad={mySquad != null} />
              </div>
            ) : null}

            {mySquad ? (
              <div
                className={cn(
                  "sticky top-0 z-20 bg-[#0A0805] shadow-[0_16px_28px_rgba(5,11,20,0.92)]",
                  variant === "web" ? "mb-5 pb-4 pt-1" : "mb-4 pb-3 pt-1"
                )}
              >
                <PinnedYourSquadCard
                  squad={mySquad}
                  maxAvg={boardMaxAvg}
                />
              </div>
            ) : (
              <div className="mb-4">
                <SquadEmptyHint>
                  未参加のためピン留めはありません。RANK
                  は観戦のみです。参加は JOIN（ENTRY 期間）から。
                </SquadEmptyHint>
              </div>
            )}

            {uiPhase !== "idle" ? (
            <div
              key={`${mainTab}-${rankPeriod}-${weekIndex}`}
              className={cn(
                "flex flex-col",
                variant === "web" ? "gap-2.5" : "gap-2"
              )}
            >
                {boardOthers.length === 0 ? (
                  <SquadEmptyHint>リーダーボードに表示するグループがありません。</SquadEmptyHint>
                ) : (
                  boardOthers.map((squad, i) => (
                  <LeaderboardRow
                    key={squad.id}
                    squad={squad}
                    maxAvg={boardMaxAvg}
                    runnerUpAvg={boardRunnerUpAvg}
                    board={mock.leaderboard}
                    index={i}
                  />
                  ))
                )}
            </div>
            ) : null}
          </section>
        )}
      </CyberSubpageShell>

      {createSquadOpen ? (
        <CreateSquadNameSheet
          onClose={() => setCreateSquadOpen(false)}
          onCreate={handleCreateSquad}
        />
      ) : null}

      {joinByCodeOpen ? (
        <JoinByInviteCodeSheet
          busy={joinByCodeBusy}
          onClose={() => {
            if (joinByCodeBusy) return;
            setJoinByCodeOpen(false);
          }}
          onJoin={(code) => {
            void handleJoinByCode(code);
          }}
        />
      ) : null}

      {reformTarget ? (
        <CreateSquadNameSheet
          initialName={reformTarget.squadName}
          title="REFORM SQUAD"
          ariaLabel="同じメンバーで募集"
          submitLabel="招待を送る"
          onClose={() => setReformTarget(null)}
          onCreate={(name) => {
            void handleReformConfirm(name);
          }}
        />
      ) : null}

      {profileRequest ? (
        <ApplicantProfileSheet
          profile={profileRequest.applicant}
          metaLabel={`申請 · ${profileRequest.createdAtLabel}`}
          onClose={() => setProfileRequest(null)}
          onApprove={() => {
            setDismissedRequestIds((prev) => [...prev, profileRequest.id]);
            setProfileRequest(null);
            flash(`承認: ${profileRequest.applicant.displayName}`);
          }}
          onReject={() => {
            setDismissedRequestIds((prev) => [...prev, profileRequest.id]);
            setProfileRequest(null);
            flash(`拒否: ${profileRequest.applicant.displayName}`);
          }}
        />
      ) : null}

      {viewedProfile ? (
        <ApplicantProfileSheet
          profile={viewedProfile.profile}
          metaLabel={viewedProfile.metaLabel}
          onClose={() => setViewedProfile(null)}
        />
      ) : null}

      {toast ? <Toast message={toast} /> : null}

      <SquadBattlePreviewToolsOverlay
        open={previewToolsOpen}
        previewState={previewState}
        uiPhase={uiPhase}
        boardStatus={boardStatus}
        onClose={() => setPreviewToolsOpen(false)}
        onChangeState={handlePreviewStateChange}
        onChangePhase={setUiPhase}
        onChangeBoardStatus={setBoardStatus}
        onReplayIntro={() => {
          clearSquadBattleIntroSeen();
          setIntroOpen(true);
        }}
        reduceMotion={reduceMotion}
        variant={variant}
      />

      <SquadBattleIntroOverlay
        open={introOpen}
        onClose={() => setIntroOpen(false)}
      />
    </>
    </SquadBattleIsWebCtx.Provider>
  );
}
