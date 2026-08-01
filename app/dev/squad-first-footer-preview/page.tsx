"use client";

/**
 * /dev/squad-first-footer-preview
 * 1位カード（確定デザイン）の入場・演出アニメ比較。
 * 各案にリプレイボタンあり。採用案が決まったら SquadBattlePage に反映して削除して良い。
 */

import { useMemo, useState, type ReactNode } from "react";
import cn from "clsx";
import { Crown, RotateCcw } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { nameOxanium, nameBebas } from "@/lib/fonts";
import CyberNumber from "@/app/component/ui/CyberNumber";
import { CyberSlantedSegBar } from "@/app/component/rankings/CyberSlantedSegBar";
import { RankFirstBorderEdgeScan } from "@/app/component/rankings/RankFirstBorderEdgeScan";
import { cyberRankPalette } from "@/lib/rankings/cyberRankVisual";
import {
  getSquadBattleMock,
  type Squad,
  type SquadMember,
} from "@/lib/squads/squadBattleMock";
import {
  SQUAD_FIRST_AVATAR_FADE_S,
  SQUAD_FIRST_FOOTER_FADE_S,
  SQUAD_FIRST_SCAN_DURATION_S,
  SQUAD_FIRST_SCAN_OPACITY,
  squadFirstAvatarDelayS,
  squadFirstFooterDelayS,
} from "@/lib/squads/squadFirstPlaceMotion";

const GOLD = cyberRankPalette(1).accent;
const GOLD_GLOW = cyberRankPalette(1).accentGlow;

function Avatar({ member, px = 28 }: { member: SquadMember; px?: number }) {
  const initial = (member.displayName || "?").slice(0, 1).toUpperCase();
  return (
    <span
      className={cn(
        nameOxanium.className,
        "flex shrink-0 items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-500/10 font-bold text-cyan-100"
      )}
      style={{ width: px, height: px, fontSize: Math.round(px * 0.36) }}
    >
      {initial}
    </span>
  );
}

type StatData = {
  ace: SquadMember;
  lead: number;
  weeks: number;
  dayDelta: number;
};

const LABEL = cn(
  nameOxanium.className,
  "text-[8px] font-bold uppercase tracking-[0.14em] text-amber-200/50"
);

/** 確定デザインのフッター本体（アニメは外側で掛ける） */
function FirstFooterContent({ ace, lead, weeks }: StatData) {
  const cell =
    "flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5 px-1 text-center";
  const divider = (
    <span aria-hidden className="h-8 w-px shrink-0 self-center bg-amber-300/20" />
  );
  return (
    <div className="flex items-stretch border-t border-amber-300/25 px-2 py-1.5">
      <div className={cell}>
        <p className={LABEL}>ACE</p>
        <div className="flex items-center gap-1">
          <Avatar member={ace} px={20} />
          <CyberNumber value={ace.points} size="sm" suffix="pts" color={GOLD} />
        </div>
      </div>
      {divider}
      <div className={cell}>
        <p className={LABEL}>LEAD</p>
        <CyberNumber value={lead} size="sm" suffix="pts" color={GOLD} />
      </div>
      {divider}
      <div className={cell}>
        <p className={LABEL}>DEFENDING</p>
        <CyberNumber value={weeks} size="sm" suffix="day" color={GOLD} />
      </div>
    </div>
  );
}

function FirstCardTop({
  squad,
  dayDelta,
  animateBar,
  barKey,
}: {
  squad: Squad;
  dayDelta: number;
  animateBar?: boolean;
  barKey?: number;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-3">
      <div className="flex w-9 shrink-0 flex-col items-center gap-0.5">
        <p
          className={cn(
            nameBebas.className,
            "py-0.5 text-center text-[24px] leading-[1.15] tracking-wide"
          )}
          style={{ color: GOLD, textShadow: `0 0 10px ${GOLD_GLOW}` }}
        >
          01
        </p>
        <p className={cn(nameOxanium.className, "text-[9px] font-bold text-cyan-300")}>
          ▲1
        </p>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start gap-2.5">
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                nameOxanium.className,
                "flex items-center gap-1.5 truncate text-[13px] font-bold uppercase tracking-wide text-[#FFFBEB]"
              )}
            >
              <Crown
                size={13}
                strokeWidth={2.4}
                className="shrink-0 text-[#FFD65A]"
                style={{ filter: "drop-shadow(0 0 6px rgba(255,214,90,0.7))" }}
                aria-hidden
              />
              <span className="min-w-0 truncate">{squad.name}</span>
            </p>
            <div className="mt-1 flex gap-1">
              {squad.members.map((m) => (
                <Avatar key={m.uid} member={m} />
              ))}
            </div>
          </div>
          <div className="relative shrink-0 self-center overflow-visible pt-1">
            <CyberNumber
              value={squad.avgPoints}
              size="md"
              suffix="pts"
              color={GOLD}
            />
            {dayDelta !== 0 ? (
              <span
                className={cn(
                  nameOxanium.className,
                  "pointer-events-none absolute -top-3 right-0 text-[10px] font-extrabold tabular-nums text-[#FFD65A]"
                )}
                style={{ textShadow: "0 0 8px rgba(255,214,90,0.45)" }}
              >
                {dayDelta > 0 ? `+${dayDelta}` : String(dayDelta)}
              </span>
            ) : null}
          </div>
        </div>
        <CyberSlantedSegBar
          key={barKey}
          pct={100}
          segments={14}
          compact
          forceStatic={!animateBar}
          maxWidthClass="max-w-full"
          accent={{
            border: GOLD,
            glow: "rgba(255,214,90,0.65)",
            bg: "rgba(255,214,90,0.85)",
          }}
        />
      </div>
    </div>
  );
}

function FirstCardShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative overflow-hidden shadow-[0_0_32px_rgba(255,214,90,0.38)]"
      style={{
        border: "2px solid rgba(255,214,90,0.65)",
        background:
          "linear-gradient(168deg, rgba(32,28,12,0.98), rgba(12,10,4,1))",
        boxShadow:
          "0 0 28px rgba(255,214,90,0.35), 0 0 52px rgba(255,214,90,0.14), inset 0 0 0 2px rgba(255,214,90,0.2)",
      }}
    >
      <RankFirstBorderEdgeScan />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function ReplayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        nameOxanium.className,
        "inline-flex items-center gap-1.5 rounded border border-cyan-400/35 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:border-cyan-300/55 hover:bg-cyan-400/16"
      )}
    >
      <RotateCcw size={12} strokeWidth={2.4} />
      Replay
    </button>
  );
}

function AnimBlock({
  title,
  note,
  replayKey,
  onReplay,
  children,
}: {
  title: string;
  note: string;
  replayKey: number;
  onReplay: () => void;
  children: (key: number, motionOk: boolean) => ReactNode;
}) {
  const motionOk = useReducedMotion() !== true;
  return (
    <section>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className={cn(nameOxanium.className, "text-sm font-bold text-cyan-100")}>
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-white/45">{note}</p>
        </div>
        <ReplayButton onClick={onReplay} />
      </div>
      <AnimatePresence mode="wait">
        <div key={replayKey}>{children(replayKey, motionOk)}</div>
      </AnimatePresence>
    </section>
  );
}

/* —— 案1: カード全体フェード上昇 —— */
function AnimFadeUp({
  squad,
  data,
  motionOk,
}: {
  squad: Squad;
  data: StatData;
  motionOk: boolean;
}) {
  return (
    <motion.div
      initial={motionOk ? { opacity: 0, y: 16 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <FirstCardShell>
        <FirstCardTop squad={squad} dayDelta={data.dayDelta} />
        <FirstFooterContent {...data} />
      </FirstCardShell>
    </motion.div>
  );
}

/* —— 案2: フッターだけスタッガー —— */
function AnimFooterStagger({
  squad,
  data,
  motionOk,
}: {
  squad: Squad;
  data: StatData;
  motionOk: boolean;
}) {
  const items = [
    {
      key: "ace",
      node: (
        <>
          <p className={LABEL}>ACE</p>
          <div className="flex items-center gap-1">
            <Avatar member={data.ace} px={20} />
            <CyberNumber
              value={data.ace.points}
              size="sm"
              suffix="pts"
              color={GOLD}
            />
          </div>
        </>
      ),
    },
    {
      key: "lead",
      node: (
        <>
          <p className={LABEL}>LEAD</p>
          <CyberNumber
            value={data.lead}
            size="sm"
            suffix="pts"
            color={GOLD}
          />
        </>
      ),
    },
    {
      key: "def",
      node: (
        <>
          <p className={LABEL}>DEFENDING</p>
          <CyberNumber
            value={data.weeks}
            size="sm"
            suffix="day"
            color={GOLD}
          />
        </>
      ),
    },
  ];
  return (
    <FirstCardShell>
      <FirstCardTop squad={squad} dayDelta={data.dayDelta} />
      <div className="flex items-stretch border-t border-amber-300/25 px-2 py-1.5">
        {items.map((it, i) => (
          <motion.div
            key={it.key}
            className="flex flex-1 flex-col items-center gap-0.5 text-center"
            initial={motionOk ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.32,
              delay: 0.08 + i * 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {it.node}
          </motion.div>
        ))}
      </div>
    </FirstCardShell>
  );
}

/* —— 案3: セグメント順点灯 —— */
function AnimSegFill({
  squad,
  data,
  replayKey,
}: {
  squad: Squad;
  data: StatData;
  replayKey: number;
}) {
  return (
    <FirstCardShell>
      <FirstCardTop
        squad={squad}
        dayDelta={data.dayDelta}
        animateBar
        barKey={replayKey}
      />
      <FirstFooterContent {...data} />
    </FirstCardShell>
  );
}

/* —— 案4: グローパルス（枠） —— */
function AnimGlowPulse({
  squad,
  data,
  motionOk,
}: {
  squad: Squad;
  data: StatData;
  motionOk: boolean;
}) {
  return (
    <motion.div
      animate={
        motionOk
          ? {
              boxShadow: [
                "0 0 18px rgba(255,214,90,0.25)",
                "0 0 40px rgba(255,214,90,0.55)",
                "0 0 18px rgba(255,214,90,0.25)",
              ],
            }
          : undefined
      }
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      className="rounded-sm"
    >
      <FirstCardShell>
        <FirstCardTop squad={squad} dayDelta={data.dayDelta} />
        <FirstFooterContent {...data} />
      </FirstCardShell>
    </motion.div>
  );
}

/* —— 案5: スコア点灯（数字フェード） —— */
function AnimScorePop({
  squad,
  data,
  motionOk,
}: {
  squad: Squad;
  data: StatData;
  motionOk: boolean;
}) {
  return (
    <FirstCardShell>
      <FirstCardTop squad={squad} dayDelta={data.dayDelta} />
      <div className="flex items-stretch border-t border-amber-300/25 px-2 py-1.5">
        {[
          <div key="a" className="flex flex-1 flex-col items-center gap-0.5">
            <p className={LABEL}>ACE</p>
            <motion.div
              className="flex items-center gap-1"
              initial={motionOk ? { opacity: 0, scale: 0.86 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.38, delay: 0.12, type: "spring", stiffness: 320, damping: 22 }}
            >
              <Avatar member={data.ace} px={20} />
              <CyberNumber
                value={data.ace.points}
                size="sm"
                suffix="pts"
                color={GOLD}
              />
            </motion.div>
          </div>,
          <div key="l" className="flex flex-1 flex-col items-center gap-0.5">
            <p className={LABEL}>LEAD</p>
            <motion.div
              initial={motionOk ? { opacity: 0, scale: 0.86 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.38, delay: 0.22, type: "spring", stiffness: 320, damping: 22 }}
            >
              <CyberNumber
                value={data.lead}
                size="sm"
                suffix="pts"
                color={GOLD}
              />
            </motion.div>
          </div>,
          <div key="d" className="flex flex-1 flex-col items-center gap-0.5">
            <p className={LABEL}>DEFENDING</p>
            <motion.div
              initial={motionOk ? { opacity: 0, scale: 0.86 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.38, delay: 0.32, type: "spring", stiffness: 320, damping: 22 }}
            >
              <CyberNumber
                value={data.weeks}
                size="sm"
                suffix="day"
                color={GOLD}
              />
            </motion.div>
          </div>,
        ]}
      </div>
    </FirstCardShell>
  );
}

/* —— 案6: スキャン通過 —— */
function AnimScanSweep({
  squad,
  data,
  motionOk,
}: {
  squad: Squad;
  data: StatData;
  motionOk: boolean;
}) {
  return (
    <div className="relative overflow-hidden">
      <FirstCardShell>
        <FirstCardTop squad={squad} dayDelta={data.dayDelta} />
        <div className="relative overflow-hidden">
          {motionOk ? (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 z-[2] w-1/3"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,214,90,0.28), transparent)",
              }}
              initial={{ x: "-120%" }}
              animate={{ x: "280%" }}
              transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1] }}
            />
          ) : null}
          <FirstFooterContent {...data} />
        </div>
      </FirstCardShell>
    </div>
  );
}

/* —— 案7: 上段→下段の2段入場 —— */
function AnimTwoStage({
  squad,
  data,
  motionOk,
}: {
  squad: Squad;
  data: StatData;
  motionOk: boolean;
}) {
  return (
    <FirstCardShell>
      <motion.div
        initial={motionOk ? { opacity: 0, y: 8 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      >
        <FirstCardTop squad={squad} dayDelta={data.dayDelta} />
      </motion.div>
      <motion.div
        initial={motionOk ? { opacity: 0, y: 12 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <FirstFooterContent {...data} />
      </motion.div>
    </FirstCardShell>
  );
}

/* —— 案8: アバター順ポップ + フッター —— */
function AnimAvatarCascade({
  squad,
  data,
  motionOk,
}: {
  squad: Squad;
  data: StatData;
  motionOk: boolean;
}) {
  return (
    <FirstCardShell>
      <div className="flex items-center gap-2.5 px-3 py-3">
        <div className="flex w-9 shrink-0 flex-col items-center gap-0.5">
          <p
            className={cn(nameBebas.className, "text-[24px] leading-none")}
            style={{ color: GOLD, textShadow: `0 0 10px ${GOLD_GLOW}` }}
          >
            01
          </p>
          <p className={cn(nameOxanium.className, "text-[9px] font-bold text-cyan-300")}>
            ▲1
          </p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-start gap-2.5">
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  nameOxanium.className,
                  "flex items-center gap-1.5 truncate text-[13px] font-bold uppercase text-[#FFFBEB]"
                )}
              >
                <Crown size={13} className="shrink-0 text-[#FFD65A]" aria-hidden />
                {squad.name}
              </p>
              <div className="mt-1 flex gap-1">
                {squad.members.map((m, i) => (
                  <motion.span
                    key={m.uid}
                    initial={motionOk ? { opacity: 0, scale: 0.5 } : false}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 0.05 + i * 0.06,
                      type: "spring",
                      stiffness: 380,
                      damping: 18,
                    }}
                  >
                    <Avatar member={m} />
                  </motion.span>
                ))}
              </div>
            </div>
            <div className="relative shrink-0 overflow-visible pt-1">
              <CyberNumber
                value={squad.avgPoints}
                size="md"
                suffix="pts"
                color={GOLD}
              />
              <span
                className={cn(
                  nameOxanium.className,
                  "pointer-events-none absolute -top-3 right-0 text-[10px] font-extrabold tabular-nums text-[#FFD65A]"
                )}
                style={{ textShadow: "0 0 8px rgba(255,214,90,0.45)" }}
              >
                +{data.dayDelta}
              </span>
            </div>
          </div>
          <CyberSlantedSegBar
            pct={100}
            segments={14}
            compact
            forceStatic
            maxWidthClass="max-w-full"
            accent={{
              border: GOLD,
              glow: "rgba(255,214,90,0.65)",
              bg: "rgba(255,214,90,0.85)",
            }}
          />
        </div>
      </div>
      <motion.div
        initial={motionOk ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        <FirstFooterContent {...data} />
      </motion.div>
    </FirstCardShell>
  );
}

/* —— 案6+8: スキャンが通った列から順に出現 —— */
function AnimScanAvatarCombo({
  squad,
  data,
  motionOk,
}: {
  squad: Squad;
  data: StatData;
  motionOk: boolean;
}) {
  /** ビームが左→右を一定速度で横断。各列はビーム先頭が届いた瞬間に出現 */
  const scanDuration = SQUAD_FIRST_SCAN_DURATION_S;

  const footerItems = [
    {
      key: "ace",
      node: (
        <>
          <p className={LABEL}>ACE</p>
          <div className="flex items-center gap-1">
            <Avatar member={data.ace} px={20} />
            <CyberNumber
              value={data.ace.points}
              size="sm"
              suffix="pts"
              color={GOLD}
            />
          </div>
        </>
      ),
    },
    {
      key: "lead",
      node: (
        <>
          <p className={LABEL}>LEAD</p>
          <CyberNumber value={data.lead} size="sm" suffix="pts" color={GOLD} />
        </>
      ),
    },
    {
      key: "def",
      node: (
        <>
          <p className={LABEL}>DEFENDING</p>
          <CyberNumber value={data.weeks} size="sm" suffix="day" color={GOLD} />
        </>
      ),
    },
  ];

  return (
    <FirstCardShell>
      <div className="flex items-center gap-2.5 px-3 py-3">
        <div className="flex w-9 shrink-0 flex-col items-center gap-0.5">
          <p
            className={cn(nameBebas.className, "text-[24px] leading-none")}
            style={{ color: GOLD, textShadow: `0 0 10px ${GOLD_GLOW}` }}
          >
            01
          </p>
          <p className={cn(nameOxanium.className, "text-[9px] font-bold text-cyan-300")}>
            ▲1
          </p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-start gap-2.5">
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  nameOxanium.className,
                  "flex items-center gap-1.5 truncate text-[13px] font-bold uppercase text-[#FFFBEB]"
                )}
              >
                <Crown size={13} className="shrink-0 text-[#FFD65A]" aria-hidden />
                {squad.name}
              </p>
              <div className="mt-1 flex gap-1">
                {squad.members.map((m, i) => (
                  <motion.span
                    key={m.uid}
                    initial={motionOk ? { opacity: 0 } : false}
                    animate={{ opacity: 1 }}
                    transition={{
                      delay: squadFirstAvatarDelayS(i),
                      duration: SQUAD_FIRST_AVATAR_FADE_S,
                      ease: "easeOut",
                    }}
                  >
                    <Avatar member={m} />
                  </motion.span>
                ))}
              </div>
            </div>
            <div className="relative shrink-0 overflow-visible pt-1">
              <CyberNumber
                value={squad.avgPoints}
                size="md"
                suffix="pts"
                color={GOLD}
              />
              <span
                className={cn(
                  nameOxanium.className,
                  "pointer-events-none absolute -top-3 right-0 text-[10px] font-extrabold tabular-nums text-[#FFD65A]"
                )}
                style={{ textShadow: "0 0 8px rgba(255,214,90,0.45)" }}
              >
                +{data.dayDelta}
              </span>
            </div>
          </div>
          <CyberSlantedSegBar
            pct={100}
            segments={14}
            compact
            forceStatic
            maxWidthClass="max-w-full"
            accent={{
              border: GOLD,
              glow: "rgba(255,214,90,0.65)",
              bg: "rgba(255,214,90,0.85)",
            }}
          />
        </div>
      </div>
      <div className="relative overflow-hidden border-t border-amber-300/25">
        {motionOk ? (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 z-[2] w-[26%]"
            style={{
              background: `linear-gradient(90deg, transparent, rgba(255,214,90,${SQUAD_FIRST_SCAN_OPACITY}), transparent)`,
            }}
            initial={{ left: "-26%" }}
            animate={{ left: "100%" }}
            transition={{
              duration: scanDuration,
              ease: "linear",
            }}
          />
        ) : null}
        <div className="relative z-[1] flex min-h-[3.25rem] items-stretch px-2 py-1.5">
          {footerItems.map((it, i) => (
            <motion.div
              key={it.key}
              className="flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5 px-1 text-center"
              initial={motionOk ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{
                duration: SQUAD_FIRST_FOOTER_FADE_S,
                delay: squadFirstFooterDelayS(i as 0 | 1 | 2),
                ease: "easeOut",
              }}
            >
              {it.node}
            </motion.div>
          ))}
        </div>
      </div>
    </FirstCardShell>
  );
}

export default function SquadFirstFooterPreviewPage() {
  const { squad, data } = useMemo(() => {
    const mock = getSquadBattleMock("full");
    const first = mock.leaderboard.find((s) => s.rank === 1)!;
    const second = mock.leaderboard.find((s) => s.rank === 2);
    const active = first.members.filter((m) => !m.empty);
    const ace = active.reduce(
      (top, m) => (m.points > top.points ? m : top),
      active[0]
    );
    return {
      squad: first,
      data: {
        ace,
        lead: Math.max(
          0,
          Math.round(first.avgPoints - (second?.avgPoints ?? 0))
        ),
        weeks: first.weeksAtTop ?? 1,
        dayDelta: first.avgPointsDayDelta ?? 48,
      } satisfies StatData,
    };
  }, []);

  const [keys, setKeys] = useState({
    combo68: 0,
    fade: 0,
    stagger: 0,
    seg: 0,
    glow: 0,
    pop: 0,
    scan: 0,
    two: 0,
    avatar: 0,
  });

  function bump(id: keyof typeof keys) {
    setKeys((prev) => ({ ...prev, [id]: prev[id] + 1 }));
  }

  return (
    <main className="min-h-screen bg-[#050b14] px-4 py-8 text-white">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-8">
        <div>
          <p
            className={cn(
              nameOxanium.className,
              "text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/75"
            )}
          >
            DEV PREVIEW · LOCKED DESIGN + MOTION
          </p>
          <h1
            className={cn(
              nameOxanium.className,
              "mt-1 text-xl font-black uppercase tracking-wide"
            )}
          >
            1位カード — アニメ比較
          </h1>
          <p className="mt-1 text-xs text-white/45">
            デザインは確定形のまま。各案の Replay で何度でも再生できます。
          </p>
          <p className="mt-1 text-[11px] text-cyan-200/50">
            /dev/squad-first-footer-preview
          </p>
        </div>

        <AnimBlock
          title="案6+8 — スキャン通過と同時に出現"
          note="光が通った列から ACE → LEAD → DEFENDING（アバターも同時カスケード）"
          replayKey={keys.combo68}
          onReplay={() => bump("combo68")}
        >
          {(_, ok) => (
            <AnimScanAvatarCombo squad={squad} data={data} motionOk={ok} />
          )}
        </AnimBlock>

        <AnimBlock
          title="案1 — カード全体フェード上昇"
          note="カードごと下からフェードイン"
          replayKey={keys.fade}
          onReplay={() => bump("fade")}
        >
          {(_, ok) => <AnimFadeUp squad={squad} data={data} motionOk={ok} />}
        </AnimBlock>

        <AnimBlock
          title="案2 — フッター・スタッガー"
          note="ACE → LEAD → DEF を順に出現"
          replayKey={keys.stagger}
          onReplay={() => bump("stagger")}
        >
          {(_, ok) => (
            <AnimFooterStagger squad={squad} data={data} motionOk={ok} />
          )}
        </AnimBlock>

        <AnimBlock
          title="案3 — セグメント順点灯"
          note="バーが左から点灯（CyberSlantedSegBar 入場）"
          replayKey={keys.seg}
          onReplay={() => bump("seg")}
        >
          {(k) => <AnimSegFill squad={squad} data={data} replayKey={k} />}
        </AnimBlock>

        <AnimBlock
          title="案4 — 枠グローパルス"
          note="ゴールド枠の呼吸発光（ループ）"
          replayKey={keys.glow}
          onReplay={() => bump("glow")}
        >
          {(_, ok) => <AnimGlowPulse squad={squad} data={data} motionOk={ok} />}
        </AnimBlock>

        <AnimBlock
          title="案5 — スコア・ポップ"
          note="フッター数字がスプリングで弾む"
          replayKey={keys.pop}
          onReplay={() => bump("pop")}
        >
          {(_, ok) => <AnimScorePop squad={squad} data={data} motionOk={ok} />}
        </AnimBlock>

        <AnimBlock
          title="案6 — スキャン通過"
          note="フッター帯を光が横断"
          replayKey={keys.scan}
          onReplay={() => bump("scan")}
        >
          {(_, ok) => <AnimScanSweep squad={squad} data={data} motionOk={ok} />}
        </AnimBlock>

        <AnimBlock
          title="案7 — 2段入場"
          note="上段のあと、少し遅れてフッター"
          replayKey={keys.two}
          onReplay={() => bump("two")}
        >
          {(_, ok) => <AnimTwoStage squad={squad} data={data} motionOk={ok} />}
        </AnimBlock>

        <AnimBlock
          title="案8 — アバター・カスケード"
          note="メンバー円が順にポップ → フッター表示"
          replayKey={keys.avatar}
          onReplay={() => bump("avatar")}
        >
          {(_, ok) => (
            <AnimAvatarCascade squad={squad} data={data} motionOk={ok} />
          )}
        </AnimBlock>
      </div>
    </main>
  );
}
