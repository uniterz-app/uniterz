"use client";

/**
 * チュートリアル用の簡易図解イラスト（試合カード・タブ等のモック）
 */

import cn from "clsx";
import { nameOxanium, nameRajdhani } from "@/lib/fonts";
import { TUTORIAL_CYAN } from "@/lib/tutorial/tutorialMotion";
import type { TutorialVisualId } from "@/lib/tutorial/tutorialCopy";

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
  return (
    <div
      className="w-full border border-emerald-400/30 bg-[#060a10]/95 px-3 py-3"
      style={{
        clipPath: CYBER_CHAMFER_CLIP,
        WebkitClipPath: CYBER_CHAMFER_CLIP,
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className={cn(
            nameOxanium.className,
            "text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-300/80"
          )}
        >
          FINAL
        </span>
        <span
          className={cn(
            nameOxanium.className,
            "rounded px-1.5 py-0.5 text-[9px] font-bold"
          )}
          style={{ background: "#34d399", color: "#052e1a" }}
        >
          HIT +12pt
        </span>
      </div>
      <div className="flex items-center justify-between text-sm font-bold">
        <span className="text-white/85">LAL</span>
        <span className="tabular-nums text-white">110 — 104</span>
        <span className="text-white/85">BOS</span>
      </div>
      <div className="mt-1.5 text-center text-[10px] text-white/45">
        あなたの予想 108–102 · 勝敗的中
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
  const steps = [
    { n: "01", label: "予想", en: "PREDICT" },
    { n: "02", label: "的中", en: "HIT" },
    { n: "03", label: "ランク", en: "RANK" },
  ] as const;
  return (
    <div
      className="relative flex w-full flex-col items-center gap-2.5 overflow-hidden border border-cyan-400/25 bg-[rgba(3,10,18,0.55)] px-3 pb-3 pt-3.5"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(0,245,255,0.14) 0%, transparent 42%, rgba(0,245,255,0.06) 100%)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-cyan-300"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-cyan-300"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-cyan-300"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-cyan-300"
      />
      <span
        className={cn(
          nameOxanium.className,
          "absolute left-3.5 top-2 text-[8px] font-black tracking-[0.28em] text-cyan-300/55"
        )}
      >
        BRIEFING
      </span>

      <div className="relative mt-1.5 flex flex-col items-center gap-1.5">
        <div
          aria-hidden
          className="absolute -top-1.5 h-[88px] w-[88px] rounded-full bg-cyan-400/10"
          style={{ boxShadow: `0 0 28px ${TUTORIAL_CYAN}88` }}
        />
        <div
          className="relative flex h-[76px] w-[76px] items-center justify-center rounded-[18px] border border-cyan-400/45 bg-cyan-400/[0.06]"
          style={{ boxShadow: `0 0 18px ${TUTORIAL_CYAN}66` }}
        >
          <div className="h-[66px] w-[66px] overflow-hidden rounded-[14px] border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element -- 静的ブランドマーク */}
            <img
              src="/logo/uniterz-u.svg"
              alt=""
              width={66}
              height={66}
              className="h-full w-full object-contain"
              draggable={false}
            />
          </div>
        </div>
        <div
          className={cn(
            nameOxanium.className,
            "text-[30px] font-black tracking-[0.2em]"
          )}
          style={{
            color: "#F2FEFF",
            textShadow: `0 0 18px ${TUTORIAL_CYAN}77`,
          }}
        >
          UNITERZ
        </div>
        <div
          className={cn(
            nameOxanium.className,
            "text-[9px] font-bold tracking-[0.22em] text-cyan-100/70"
          )}
        >
          SCORE PREDICTION PROTOCOL
        </div>
      </div>

      <div
        className="h-px w-[92%] bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
        style={{ boxShadow: `0 0 10px ${TUTORIAL_CYAN}66` }}
        aria-hidden
      />

      <div className="relative flex w-full justify-between px-1 pt-1">
        <div
          aria-hidden
          className="absolute left-[16%] right-[16%] top-2.5 h-px bg-cyan-400/35"
        />
        {steps.map((s) => (
          <div key={s.n} className="flex flex-1 flex-col items-center gap-0.5">
            <span
              className="mb-0.5 h-1.5 w-1.5 rounded-full bg-cyan-300"
              style={{ boxShadow: `0 0 8px ${TUTORIAL_CYAN}` }}
            />
            <span
              className={cn(
                nameOxanium.className,
                "text-[10px] font-black tracking-[0.14em]"
              )}
              style={{ color: TUTORIAL_CYAN }}
            >
              {s.n}
            </span>
            <span className={cn(jp.className, "text-[13px] font-bold text-white")}>
              {s.label}
            </span>
            <span
              className={cn(
                nameOxanium.className,
                "text-[8px] font-bold tracking-[0.16em] text-cyan-100/55"
              )}
            >
              {s.en}
            </span>
          </div>
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
    <div className={cn("mx-auto w-full max-w-[280px]", className)}>
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
