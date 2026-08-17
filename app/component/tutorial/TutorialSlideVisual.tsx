"use client";

/**
 * チュートリアル用の簡易図解イラスト（試合カード・タブ等のモック）
 */

import { useRef } from "react";
import cn from "clsx";
import { motion, useReducedMotion } from "framer-motion";
import { nameOxanium, nameRajdhani } from "@/lib/fonts";
import {
  TUTORIAL_CYAN,
  TUTORIAL_WELCOME_GATHER_EASE,
  TUTORIAL_WELCOME_PART_S,
  TUTORIAL_WELCOME_PATH_DELAY_S,
  TUTORIAL_WELCOME_PATH_LOOP_S,
} from "@/lib/tutorial/tutorialMotion";
import type { TutorialVisualId } from "@/lib/tutorial/tutorialCopy";
import TutorialWelcomeLogoLetters from "@/app/component/tutorial/TutorialWelcomeLogoLetters";
import { getLockedTutorialWelcomeIntroPlay } from "@/lib/tutorial/tutorialWelcomeSkipIntro";

type Props = {
  visual: TutorialVisualId;
  className?: string;
};

const CYBER_CHAMFER_CLIP =
  "polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)";

function MockMatchCard({ pulse = false }: { pulse?: boolean }) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden border px-3 py-2.5",
        pulse && "animate-pulse"
      )}
      style={{
        clipPath: CYBER_CHAMFER_CLIP,
        WebkitClipPath: CYBER_CHAMFER_CLIP,
        borderColor: `${TUTORIAL_CYAN}66`,
        background:
          "linear-gradient(135deg, rgba(0,245,255,0.12), rgba(4,10,18,0.9))",
        boxShadow: pulse
          ? `0 0 18px ${TUTORIAL_CYAN}55, inset 0 0 12px ${TUTORIAL_CYAN}22`
          : `0 0 12px ${TUTORIAL_CYAN}22`,
      }}
    >
      <div
        className={cn(
          nameOxanium.className,
          "mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-300/70"
        )}
      >
        TODAY · NBA
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 flex-col items-center gap-1">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-[#050508]"
            style={{
              background: "#DFFE00",
              boxShadow: "0 0 10px rgba(223,254,0,0.45)",
            }}
          >
            LAL
          </div>
          <span className={cn(nameRajdhani.className, "text-[11px] text-white/80")}>
            Lakers
          </span>
        </div>
        <div
          className={cn(
            nameOxanium.className,
            "text-[10px] font-bold tracking-widest text-white/40"
          )}
        >
          VS
        </div>
        <div className="flex flex-1 flex-col items-center gap-1">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-[#050508]"
            style={{
              background: "#BC9A5C",
              boxShadow: "0 0 10px rgba(188,154,92,0.45)",
            }}
          >
            BOS
          </div>
          <span className={cn(nameRajdhani.className, "text-[11px] text-white/80")}>
            Celtics
          </span>
        </div>
      </div>
      <div
        className={cn(
          nameOxanium.className,
          "mt-2 text-center text-[9px] font-bold uppercase tracking-[0.16em]"
        )}
        style={{ color: TUTORIAL_CYAN }}
      >
        TAP TO PREDICT
      </div>
    </div>
  );
}

function MockPredictForm() {
  return (
    <div
      className="w-full border border-cyan-400/30 bg-[#060a10]/95 px-3 py-3"
      style={{
        clipPath: CYBER_CHAMFER_CLIP,
        WebkitClipPath: CYBER_CHAMFER_CLIP,
      }}
    >
      <div
        className={cn(
          nameOxanium.className,
          "mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-300/70"
        )}
      >
        YOUR PICK
      </div>
      <div className="mb-2 flex gap-2">
        <div
          className="flex-1 py-2 text-center text-[11px] font-bold"
          style={{
            background: TUTORIAL_CYAN,
            color: "#050508",
            clipPath: CYBER_CHAMFER_CLIP,
            WebkitClipPath: CYBER_CHAMFER_CLIP,
          }}
        >
          HOME WIN
        </div>
        <div
          className="flex-1 border border-white/20 py-2 text-center text-[11px] font-bold text-white/50"
          style={{
            clipPath: CYBER_CHAMFER_CLIP,
            WebkitClipPath: CYBER_CHAMFER_CLIP,
          }}
        >
          AWAY WIN
        </div>
      </div>
      <div className="flex items-center justify-center gap-3">
        <div className="w-12 border border-cyan-400/40 py-1.5 text-center text-sm font-bold tabular-nums text-cyan-200">
          108
        </div>
        <span className="text-white/30">—</span>
        <div className="w-12 border border-white/20 py-1.5 text-center text-sm font-bold tabular-nums text-white/60">
          102
        </div>
      </div>
    </div>
  );
}

function MockResult() {
  /** 本番新カード面と同じ情報構造（HIT・最終/予想・市場・Upset/Score） */
  return (
    <div
      className="w-full overflow-hidden border-[3px] bg-[#07090f] px-3 pb-3 pt-2.5"
      style={{
        borderColor: "rgba(254,243,199,0.92)",
        boxShadow: "0 0 18px rgba(251,191,36,0.55)",
      }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span
          className={cn(
            nameOxanium.className,
            "text-[9px] font-bold uppercase tracking-[0.16em] text-white/45"
          )}
        >
          REGULAR SEASON
        </span>
        <span
          className={cn(
            nameOxanium.className,
            "px-2 py-0.5 text-[10px] font-black tracking-wide"
          )}
          style={{ background: "#FBBF24", color: "#1a1200" }}
        >
          HIT
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex w-[72px] flex-col items-center gap-1">
          <span
            className={cn(
              nameOxanium.className,
              "text-[8px] tracking-wider text-white/35"
            )}
          >
            HOME
          </span>
          <div
            className="h-8 w-7"
            style={{
              background:
                "linear-gradient(160deg,#007A33 0%,#BA9653 55%,#FFFFFF 100%)",
              clipPath:
                "polygon(20% 0%,80% 0%,100% 18%,100% 100%,0% 100%,0% 18%)",
            }}
          />
          <span
            className={cn(
              nameOxanium.className,
              "text-[11px] font-black text-white"
            )}
            style={{ transform: "skewX(-10deg)" }}
          >
            CELTICS
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center">
          <span
            className={cn(
              nameOxanium.className,
              "text-[9px] font-bold tracking-[0.18em] text-white/40"
            )}
          >
            FINAL
          </span>
          <div
            className={cn(
              nameOxanium.className,
              "text-[26px] font-black leading-none tabular-nums text-white"
            )}
          >
            108<span className="text-white/35"> — </span>112
          </div>
          <span className="mt-1 text-[9px] text-white/40">あなたの予想</span>
          <div
            className={cn(
              nameOxanium.className,
              "text-[15px] font-bold tabular-nums text-white/70"
            )}
          >
            106<span className="text-white/30"> — </span>110
          </div>
        </div>

        <div className="flex w-[72px] flex-col items-center gap-1">
          <span
            className={cn(
              nameOxanium.className,
              "text-[8px] tracking-wider text-white/35"
            )}
          >
            AWAY
          </span>
          <div
            className="h-8 w-7"
            style={{
              background:
                "linear-gradient(160deg,#552583 0%,#FDB927 55%,#FFFFFF 100%)",
              clipPath:
                "polygon(20% 0%,80% 0%,100% 18%,100% 100%,0% 100%,0% 18%)",
            }}
          />
          <span
            className={cn(
              nameOxanium.className,
              "text-[11px] font-black text-white"
            )}
            style={{ transform: "skewX(-10deg)" }}
          >
            LAKERS
          </span>
        </div>
      </div>

      <div className="mt-2.5 flex h-2 overflow-hidden bg-white/10">
        <div className="h-full bg-[#007A33]/80" style={{ width: "36%" }} />
        <div className="h-full bg-[#FDB927]/90" style={{ width: "64%" }} />
      </div>
      <div
        className={cn(
          nameOxanium.className,
          "mt-0.5 flex justify-between text-[8px] tracking-wider text-white/40"
        )}
      >
        <span>36%</span>
        <span>市場</span>
        <span>64%</span>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <div className="border border-white/10 bg-white/[0.03] px-2 py-1.5">
          <div
            className={cn(
              nameOxanium.className,
              "text-[8px] tracking-wider text-white/40"
            )}
          >
            UPSET
          </div>
          <div
            className={cn(
              nameOxanium.className,
              "text-[16px] font-black tabular-nums text-white/55"
            )}
          >
            --
          </div>
        </div>
        <div className="border border-white/10 bg-white/[0.03] px-2 py-1.5">
          <div className="flex items-center justify-between">
            <span
              className={cn(
                nameOxanium.className,
                "text-[8px] tracking-wider text-white/40"
              )}
            >
              SCORE
            </span>
            <span
              className={cn(
                nameOxanium.className,
                "text-[8px] font-bold text-amber-300/90"
              )}
            >
              TOP 10%
            </span>
          </div>
          <div
            className={cn(
              nameOxanium.className,
              "text-[16px] font-black tabular-nums"
            )}
            style={{ color: TUTORIAL_CYAN }}
          >
            6.0
          </div>
        </div>
      </div>
    </div>
  );
}

function MockRankings() {
  const rows = [
    { rank: 1, name: "ace_shot", pts: "2,480", me: false },
    { rank: 2, name: "you", pts: "2,310", me: true },
    { rank: 3, name: "court_king", pts: "2,105", me: false },
  ];
  return (
    <div
      className="w-full border border-cyan-400/25 bg-[#060a10]/95 px-2.5 py-2"
      style={{
        clipPath: CYBER_CHAMFER_CLIP,
        WebkitClipPath: CYBER_CHAMFER_CLIP,
      }}
    >
      <div
        className={cn(
          nameOxanium.className,
          "mb-1.5 flex items-end gap-2 px-1"
        )}
      >
        <span
          className="text-[28px] font-black leading-none tabular-nums"
          style={{ color: TUTORIAL_CYAN, textShadow: `0 0 14px ${TUTORIAL_CYAN}66` }}
        >
          #2
        </span>
        <span className="pb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">
          YOUR RANK
        </span>
      </div>
      {rows.map((r) => (
        <div
          key={r.rank}
          className={cn(
            "mb-1 flex items-center gap-2 rounded px-2 py-1.5 last:mb-0",
            r.me && "bg-cyan-400/15 ring-1 ring-cyan-400/40"
          )}
        >
          <span
            className={cn(
              nameOxanium.className,
              "w-5 text-[11px] font-bold tabular-nums"
            )}
            style={{ color: r.me ? TUTORIAL_CYAN : "rgba(255,255,255,0.45)" }}
          >
            {r.rank}
          </span>
          <span
            className={cn(
              nameRajdhani.className,
              "flex-1 text-[12px]",
              r.me ? "font-bold text-cyan-100" : "text-white/70"
            )}
          >
            {r.name}
          </span>
          <span className="text-[11px] tabular-nums text-white/55">{r.pts}</span>
        </div>
      ))}
    </div>
  );
}

function MockGroups() {
  return (
    <div
      className="w-full overflow-hidden border border-cyan-400/25 bg-[#060a10]/95"
      style={{
        clipPath: CYBER_CHAMFER_CLIP,
        WebkitClipPath: CYBER_CHAMFER_CLIP,
      }}
    >
      <div
        className="px-3 py-2"
        style={{
          background:
            "linear-gradient(90deg, rgba(212,160,60,0.35), rgba(8,10,16,0.2) 70%)",
          borderBottom: "1px solid rgba(212,160,60,0.35)",
        }}
      >
        <div
          className={cn(
            nameOxanium.className,
            "text-[10px] font-black tracking-[0.2em] text-amber-200/95"
          )}
        >
          SQUAD BATTLE
        </div>
      </div>
      <div className="px-3 py-2.5">
        <div
          className={cn(
            nameOxanium.className,
            "mb-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-300/65"
          )}
        >
          GROUP
        </div>
        <div className={cn(nameRajdhani.className, "text-[14px] font-bold text-white")}>
          Night Owls
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={cn(
              nameOxanium.className,
              "rounded px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
            )}
            style={{
              background: `${TUTORIAL_CYAN}22`,
              color: TUTORIAL_CYAN,
              boxShadow: `0 0 0 1px ${TUTORIAL_CYAN}55`,
            }}
          >
            #2
          </span>
          <span className="text-[11px] text-white/55">8 members · private board</span>
        </div>
      </div>
    </div>
  );
}

function MockProfile() {
  const stats = [
    { label: "HIT%", value: "62" },
    { label: "STREAK", value: "3" },
    { label: "PTS", value: "2.3k" },
  ];
  return (
    <div
      className="w-full border border-cyan-400/25 bg-[#060a10]/95 px-3 py-3"
      style={{
        clipPath: CYBER_CHAMFER_CLIP,
        WebkitClipPath: CYBER_CHAMFER_CLIP,
      }}
    >
      <div className="mb-3 flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full text-[12px] font-black text-[#050508]"
          style={{
            background: TUTORIAL_CYAN,
            boxShadow: `0 0 16px ${TUTORIAL_CYAN}55`,
          }}
        >
          YOU
        </div>
        <div>
          <div className={cn(nameRajdhani.className, "text-[14px] font-bold text-white")}>
            your_name
          </div>
          <div
            className={cn(
              nameOxanium.className,
              "text-[9px] font-bold uppercase tracking-[0.14em] text-white/40"
            )}
          >
            MY PAGE
          </div>
        </div>
      </div>
      <div className="flex gap-1.5">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex-1 border border-white/10 bg-white/[0.03] px-1.5 py-1.5 text-center"
            style={{
              clipPath: CYBER_CHAMFER_CLIP,
              WebkitClipPath: CYBER_CHAMFER_CLIP,
            }}
          >
            <div
              className={cn(nameOxanium.className, "text-[13px] font-bold tabular-nums")}
              style={{ color: TUTORIAL_CYAN }}
            >
              {s.value}
            </div>
            <div className="text-[8px] font-bold uppercase tracking-wider text-white/40">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockTabs({ highlight }: { highlight?: string }) {
  const tabs = [
    { id: "games", label: "試合" },
    { id: "result", label: "リザルト" },
    { id: "rankings", label: "ランキング" },
    { id: "boards", label: "LB" },
    { id: "profile", label: "マイ" },
  ];
  return (
    <div className="flex w-full gap-1 rounded-xl border border-white/10 bg-black/50 p-1.5">
      {tabs.map((t) => {
        const on = highlight ? t.id === highlight : t.id === "games";
        return (
          <div
            key={t.id}
            className={cn(
              "flex-1 py-2 text-center text-[9px] font-bold",
              on ? "text-[#050508]" : "text-white/45"
            )}
            style={
              on
                ? {
                    background: TUTORIAL_CYAN,
                    clipPath: CYBER_CHAMFER_CLIP,
                    WebkitClipPath: CYBER_CHAMFER_CLIP,
                    boxShadow: `0 0 10px ${TUTORIAL_CYAN}66`,
                  }
                : undefined
            }
          >
            {t.label}
          </div>
        );
      })}
    </div>
  );
}

function MockWelcome() {
  const reduceMotion = useReducedMotion() === true;
  const playIntroRef = useRef(getLockedTutorialWelcomeIntroPlay());
  const skipIntro = !playIntroRef.current;
  const snapIn = reduceMotion || skipIntro;
  const steps = [
    { n: "01", label: "予想", en: "PREDICT" },
    { n: "02", label: "的中", en: "HIT" },
    { n: "03", label: "ランク", en: "RANK" },
  ] as const;
  return (
    <div className="relative flex w-full flex-col items-center gap-6 overflow-visible bg-transparent px-0.5 pb-0.5 pt-1.5">
      <div className="relative mt-1 flex w-full flex-col items-center gap-2.5">
        <div
          className="flex w-full max-w-[300px] items-center justify-center py-1"
          aria-hidden
        >
          <TutorialWelcomeLogoLetters />
        </div>
        <motion.div
          className={cn(
            nameOxanium.className,
            "text-[9px] font-black tracking-[0.28em] text-cyan-300/75 drop-shadow-[0_8px_12px_rgba(0,0,0,0.7)]"
          )}
          initial={snapIn ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: TUTORIAL_WELCOME_PART_S,
            delay: snapIn ? 0 : 0.42,
            ease: TUTORIAL_WELCOME_GATHER_EASE,
          }}
        >
          SCORE PREDICTION PROTOCOL
        </motion.div>
      </div>

      <div className="relative flex w-full justify-between pt-2">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-[38px] right-[38px] top-2 z-0 h-3.5 overflow-visible"
          initial={snapIn ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: TUTORIAL_WELCOME_PART_S,
            delay: snapIn ? 0 : 0.52,
            ease: TUTORIAL_WELCOME_GATHER_EASE,
          }}
        >
          <svg
            className="tutorial-welcome-path-svg"
            viewBox="0 0 100 8"
            preserveAspectRatio="none"
            aria-hidden
          >
            <line
              className="tutorial-welcome-path-track"
              x1="0"
              y1="4"
              x2="100"
              y2="4"
            />
            {reduceMotion ? null : (
              <>
                <line
                  className="tutorial-welcome-path-bloom"
                  x1="0"
                  y1="4"
                  x2="100"
                  y2="4"
                  pathLength="100"
                  style={{
                    animationDuration: `${TUTORIAL_WELCOME_PATH_LOOP_S}s`,
                    animationDelay: `${TUTORIAL_WELCOME_PATH_DELAY_S}s`,
                  }}
                />
                <line
                  className="tutorial-welcome-path-charge"
                  x1="0"
                  y1="4"
                  x2="100"
                  y2="4"
                  pathLength="100"
                  style={{
                    animationDuration: `${TUTORIAL_WELCOME_PATH_LOOP_S}s`,
                    animationDelay: `${TUTORIAL_WELCOME_PATH_DELAY_S}s`,
                  }}
                />
              </>
            )}
          </svg>
        </motion.div>
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            className="relative z-[1] flex w-[76px] shrink-0 flex-col items-center"
            initial={
              snapIn ? false : { opacity: 0, y: 22, x: (i - 1) * 28 }
            }
            animate={{ opacity: 1, y: 0, x: 0 }}
            transition={{
              duration: TUTORIAL_WELCOME_PART_S,
              delay: snapIn ? 0 : 0.5 + i * 0.08,
              ease: TUTORIAL_WELCOME_GATHER_EASE,
            }}
          >
            <div
              className={cn(
                "tutorial-welcome-path-lit flex flex-col items-center gap-1",
                `tutorial-welcome-path-lit--${i + 1}`
              )}
              style={{
                animationDuration: `${TUTORIAL_WELCOME_PATH_LOOP_S}s`,
                animationDelay: `${TUTORIAL_WELCOME_PATH_DELAY_S}s`,
              }}
            >
              <span className="tutorial-welcome-path-node" aria-hidden>
                <span className="tutorial-welcome-path-node-ring" />
                <span className="tutorial-welcome-path-node-core" />
              </span>
              <span
                className={cn(
                  nameOxanium.className,
                  "tutorial-welcome-path-num text-[10px] font-black tracking-[0.18em] text-cyan-300"
                )}
              >
                {s.n}
              </span>
              <span className="text-[13px] font-bold leading-none text-white">
                {s.label}
              </span>
              <span
                className={cn(
                  nameOxanium.className,
                  "text-[8px] font-bold tracking-[0.2em] text-cyan-100/70"
                )}
              >
                {s.en}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function MockHorizon() {
  const items = [
    { num: "1", label: "スクワッドバトル", sub: "仲間とチーム対戦" },
    { num: "2", label: "UNIT", sub: "通貨・報酬" },
    { num: "3", label: "キャリア", sub: "成績の軌跡" },
    { num: "4", label: "STATS", sub: "試合スタッツ" },
  ];
  return (
    <div
      className="overflow-hidden border border-cyan-400/25 bg-[rgba(6,10,16,0.95)]"
      style={{ clipPath: CYBER_CHAMFER_CLIP, WebkitClipPath: CYBER_CHAMFER_CLIP }}
    >
      <div
        className={cn(
          nameOxanium.className,
          "px-3 pt-2.5 pb-1.5 text-[11px] font-black tracking-[0.12em]"
        )}
        style={{ color: TUTORIAL_CYAN }}
      >
        このあと説明する機能
      </div>
      {items.map((it) => (
        <div
          key={it.num}
          className="flex items-center gap-2.5 border-t border-white/10 px-3 py-2"
        >
          <span
            className={cn(
              nameOxanium.className,
              "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-cyan-400/45 bg-cyan-400/10 text-[11px] font-extrabold text-cyan-300"
            )}
          >
            {it.num}
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={cn(
                nameOxanium.className,
                "block text-[13px] font-bold text-white"
              )}
            >
              {it.label}
            </span>
            <span
              className={cn(
                nameOxanium.className,
                "block text-[10px] text-white/45"
              )}
            >
              {it.sub}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function MockHorizonStats() {
  return (
    <div className="flex flex-col items-center gap-2 py-1">
      <div
        className="relative h-[88px] w-full overflow-hidden border border-white/10 bg-[rgba(4,8,12,0.9)]"
        style={{ clipPath: CYBER_CHAMFER_CLIP, WebkitClipPath: CYBER_CHAMFER_CLIP }}
      >
        <div
          className={cn(
            nameOxanium.className,
            "flex h-full items-center pl-3.5 text-[11px] font-extrabold tracking-[0.2em] text-white/35"
          )}
        >
          GAMES
        </div>
        <div
          className="absolute right-0 top-[22%] flex w-[18px] flex-col items-center gap-0.5 border border-r-0 border-amber-300/70 bg-[rgba(8,12,6,0.95)] py-2"
        >
          {"STATS".split("").map((ch, i) => (
            <span
              key={`${ch}-${i}`}
              className={cn(
                nameOxanium.className,
                "text-[7px] font-extrabold leading-[8px] text-amber-300"
              )}
            >
              {ch}
            </span>
          ))}
        </div>
      </div>
      <p className={cn(nameOxanium.className, "text-[10px] tracking-wide text-white/55")}>
        右端の黄色いタブ
      </p>
    </div>
  );
}

function MockHorizonUnit() {
  return (
    <div
      className="overflow-hidden border border-cyan-400/25 bg-[rgba(6,10,16,0.95)]"
      style={{ clipPath: CYBER_CHAMFER_CLIP, WebkitClipPath: CYBER_CHAMFER_CLIP }}
    >
      <div className="border-b border-cyan-400/35 bg-cyan-400/15 px-3 py-2">
        <span
          className={cn(
            nameOxanium.className,
            "text-[11px] font-black tracking-[0.2em] text-cyan-100"
          )}
        >
          UNIT EARN
        </span>
      </div>
      <div className="px-3 py-2.5">
        <div className={cn(nameOxanium.className, "text-[9px] tracking-wider text-cyan-300/65")}>
          MINI GAME
        </div>
        <div className={cn(nameOxanium.className, "text-[14px] font-bold text-white")}>
          Play → Earn UNIT
        </div>
        <div className="mt-1 text-[11px] text-white/55">
          プロフィールからいつでも挑戦できる
        </div>
      </div>
    </div>
  );
}

function MockHorizonCareer() {
  return (
    <div
      className="overflow-hidden border border-cyan-400/25 bg-[rgba(6,10,16,0.95)] p-3"
      style={{ clipPath: CYBER_CHAMFER_CLIP, WebkitClipPath: CYBER_CHAMFER_CLIP }}
    >
      <div className="mb-3 flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ background: "rgba(251,191,36,0.95)" }}
        >
          <span className={cn(nameOxanium.className, "text-[11px] font-black text-[#050508]")}>
            REC
          </span>
        </div>
        <div>
          <div className={cn(nameOxanium.className, "text-[14px] font-bold text-white")}>
            Career
          </div>
          <div className={cn(nameOxanium.className, "text-[9px] tracking-wider text-white/40")}>
            TRACK RECORD
          </div>
        </div>
      </div>
      <div className="flex gap-1.5">
        {[
          { label: "HITS", value: "42" },
          { label: "STREAK", value: "5" },
          { label: "SEASON", value: "A" },
        ].map((s) => (
          <div
            key={s.label}
            className="flex flex-1 flex-col items-center border border-white/10 bg-white/[0.03] py-1.5"
          >
            <span className={cn(nameOxanium.className, "text-[13px]")} style={{ color: TUTORIAL_CYAN }}>
              {s.value}
            </span>
            <span className={cn(nameOxanium.className, "mt-0.5 text-[8px] tracking-wider text-white/40")}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TutorialSlideVisual({ visual, className }: Props) {
  const tabHighlight =
    visual === "tabs-rankings"
      ? "rankings"
      : visual === "tabs-boards"
        ? "boards"
        : visual === "tabs-profile"
          ? "profile"
          : visual === "tabs"
            ? "boards"
            : undefined;

  return (
    <div
      className={cn(
        "mx-auto w-full",
        visual === "welcome" ? "max-w-none" : "max-w-[280px]",
        className
      )}
    >
      {visual === "welcome" ? <MockWelcome /> : null}
      {visual === "matchCard" ? <MockMatchCard /> : null}
      {visual === "predictForm" ? <MockPredictForm /> : null}
      {visual === "result" ? <MockResult /> : null}
      {visual === "rankings" ? <MockRankings /> : null}
      {visual === "groups" ? <MockGroups /> : null}
      {visual === "profile" ? <MockProfile /> : null}
      {visual === "horizon" ? <MockHorizon /> : null}
      {visual === "horizon-unit" ? <MockHorizonUnit /> : null}
      {visual === "horizon-career" ? <MockHorizonCareer /> : null}
      {visual === "horizon-stats" ? <MockHorizonStats /> : null}
      {tabHighlight ? <MockTabs highlight={tabHighlight} /> : null}
    </div>
  );
}

export { MockMatchCard, MockTabs, MockRankings, MockGroups, MockProfile };
