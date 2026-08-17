"use client";

/**
 * /mobile/career-placement-preview · /dev/career-placement-preview
 * CAREER 情報の載せ場所案（裏面フリップ以外）。
 */
import { useState } from "react";
import Link from "next/link";
import { nameOxanium, nameRajdhani } from "@/lib/fonts";

type VariantId =
  | "flipBack"
  | "stackBelow"
  | "overviewBlock"
  | "fullPage"
  | "bottomSheet"
  | "inlineExpand"
  | "twinTabs";

type Variant = {
  id: VariantId;
  name: string;
  blurb: string;
};

const VARIANTS: readonly Variant[] = [
  {
    id: "flipBack",
    name: "A · Flip Back",
    blurb: "いまの案。表の裏に履歴書。同じ枠・同じ高さ。",
  },
  {
    id: "stackBelow",
    name: "B · Stack Below",
    blurb: "プロフィールカードの下に CAREER カードを積む。スクロールで読む。",
  },
  {
    id: "overviewBlock",
    name: "C · Overview Block",
    blurb: "概要セクションの一塊として置く。他チャートと同列。",
  },
  {
    id: "fullPage",
    name: "D · Full Page",
    blurb: "耳タップで専用画面へ遷移。履歴書を広く見せる。",
  },
  {
    id: "bottomSheet",
    name: "E · Bottom Sheet",
    blurb: "下からドロワーで被せる。表は残したまま覗く。",
  },
  {
    id: "inlineExpand",
    name: "F · Inline Expand",
    blurb: "カード内で下に展開。フリップせず伸ばす。",
  },
  {
    id: "twinTabs",
    name: "G · Twin Tabs",
    blurb: "PROFILE / CAREER を同枠内タブ切替。3D なし。",
  },
] as const;

const ROWS = [
  ["PREDICTIONS", "0"],
  ["SINCE", "2025"],
  ["SEASON RANK", "—"],
  ["BEST MONTHLY", "—"],
  ["TOP 10", "—"],
  ["UNITS EARNED", "—"],
  ["WIN RATE", "0.0%"],
  ["BEST SPORT", "—"],
] as const;

function CareerGrid({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={[
        "grid grid-cols-2",
        compact ? "gap-1.5" : "gap-2",
      ].join(" ")}
    >
      {ROWS.map(([label, value]) => (
        <div key={label}>
          <p
            className={[
              nameRajdhani.className,
              "text-[8px] uppercase tracking-[0.12em] text-white/35",
            ].join(" ")}
          >
            {label}
          </p>
          <p
            className={[
              nameOxanium.className,
              compact ? "text-xs text-white" : "text-sm text-white",
            ].join(" ")}
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

function FrontMini() {
  return (
    <div className="border border-white/15 bg-[#060c12]/90 p-3">
      <div className="flex items-start gap-2.5">
        <div className="h-12 w-12 shrink-0 border border-cyan-300/45 bg-slate-800" />
        <div className="min-w-0 flex-1">
          <p className={[nameOxanium.className, "text-lg text-white"].join(" ")}>
            MPJ
          </p>
          <p className="text-[11px] text-white/40">Win now</p>
        </div>
        <p className={[nameOxanium.className, "text-sm text-amber-300/90"].join(" ")}>
          1,000
        </p>
      </div>
      <p
        className={[
          nameOxanium.className,
          "mt-3 text-center text-[10px] tracking-[0.14em] text-white/40",
        ].join(" ")}
      >
        NBA // 26-27 SEASON
      </p>
      <div className="mt-2 grid grid-cols-2 gap-1.5 opacity-50">
        {["勝率", "総合得点", "UPSET", "最多得点者"].map((l) => (
          <div key={l} className="border border-white/10 px-2 py-1.5">
            <p
              className={[
                nameRajdhani.className,
                "text-[8px] uppercase tracking-[0.1em] text-white/40",
              ].join(" ")}
            >
              {l}
            </p>
            <p className={[nameOxanium.className, "text-xs text-white/50"].join(" ")}>
              —
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stage({ id }: { id: VariantId }) {
  if (id === "flipBack") {
    return (
      <div>
        <div className="flex justify-end pr-3">
          <div className="border border-b-0 border-[#00F5FF]/70 px-3.5 py-1">
            <span
              className={[
                nameRajdhani.className,
                "text-[10px] font-semibold tracking-[0.2em] text-[#00F5FF]",
              ].join(" ")}
            >
              PROFILE
            </span>
          </div>
        </div>
        <div className="-mt-px border border-[#00F5FF]/35 bg-[#03080d]/90 p-3">
          <p
            className={[
              nameOxanium.className,
              "mb-1 text-center text-[11px] tracking-[0.16em] text-white/85",
            ].join(" ")}
          >
            CAREER // SHEET
          </p>
          <p
            className={[
              nameOxanium.className,
              "mb-2 text-center text-[10px] tracking-[0.14em] text-white/40",
            ].join(" ")}
          >
            NBA // 26-27 SEASON
          </p>
          <CareerGrid />
        </div>
        <p
          className={[
            nameRajdhani.className,
            "mt-2 text-center text-[10px] tracking-[0.12em] text-white/35",
          ].join(" ")}
        >
          表を裏返した同じ枠の中
        </p>
      </div>
    );
  }

  if (id === "stackBelow") {
    return (
      <div>
        <FrontMini />
        <p
          className={[
            nameRajdhani.className,
            "py-2 text-center text-[10px] tracking-[0.12em] text-[#00F5FF]/70",
          ].join(" ")}
        >
          ↓ 同じ幅で続く
        </p>
        <div className="border border-[#00F5FF]/35 bg-[#03080d]/90 p-3">
          <p
            className={[
              nameOxanium.className,
              "mb-2 text-center text-[11px] tracking-[0.16em] text-white/85",
            ].join(" ")}
          >
            CAREER // SHEET
          </p>
          <CareerGrid />
        </div>
      </div>
    );
  }

  if (id === "overviewBlock") {
    return (
      <div>
        <FrontMini />
        <p
          className={[
            nameRajdhani.className,
            "mb-1.5 mt-3.5 text-[9px] tracking-[0.16em] text-white/35",
          ].join(" ")}
        >
          OVERVIEW
        </p>
        <div className="mb-2 border border-white/10 p-2.5 opacity-55">
          <p
            className={[
              nameRajdhani.className,
              "text-[10px] tracking-[0.1em] text-white/50",
            ].join(" ")}
          >
            FORM / STREAK
          </p>
          <div className="mt-2.5 h-7 bg-white/[0.06]" />
        </div>
        <div className="mb-2 border border-[#00F5FF]/35 bg-[#03080d]/90 p-3">
          <p
            className={[
              nameRajdhani.className,
              "mb-2 text-[9px] tracking-[0.16em] text-[#00F5FF]",
            ].join(" ")}
          >
            CAREER
          </p>
          <CareerGrid compact />
        </div>
        <div className="border border-white/10 p-2.5 opacity-55">
          <p
            className={[
              nameRajdhani.className,
              "text-[10px] tracking-[0.1em] text-white/50",
            ].join(" ")}
          >
            BADGES
          </p>
          <div className="mt-2.5 h-7 bg-white/[0.06]" />
        </div>
      </div>
    );
  }

  if (id === "fullPage") {
    return (
      <div>
        <div className="mb-2.5 flex items-center justify-between border-b border-white/12 pb-2">
          <span
            className={[
              nameRajdhani.className,
              "w-[4.5rem] text-[10px] tracking-[0.1em] text-[#00F5FF]",
            ].join(" ")}
          >
            ← PROFILE
          </span>
          <span
            className={[
              nameOxanium.className,
              "text-xs tracking-[0.2em] text-white",
            ].join(" ")}
          >
            CAREER
          </span>
          <span className="w-[4.5rem]" />
        </div>
        <div className="min-h-[280px] border border-[#00F5FF]/35 bg-[#03080d]/90 p-3">
          <p
            className={[
              nameOxanium.className,
              "mb-2 text-center text-[11px] tracking-[0.16em] text-white/85",
            ].join(" ")}
          >
            PREDICTOR DOSSIER
          </p>
          <CareerGrid />
        </div>
        <p
          className={[
            nameRajdhani.className,
            "mt-2 text-center text-[10px] tracking-[0.12em] text-white/35",
          ].join(" ")}
        >
          耳 → push。表カードは残らない
        </p>
      </div>
    );
  }

  if (id === "bottomSheet") {
    return (
      <div className="relative">
        <div className="opacity-35">
          <FrontMini />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-10 bottom-0 bg-black/45" />
        <div className="relative -mt-10 border border-b-0 border-[#00F5FF]/40 bg-[#0a1218] p-3.5 pb-5">
          <div className="mx-auto mb-2.5 h-0.5 w-9 bg-white/25" />
          <p
            className={[
              nameOxanium.className,
              "mb-2 text-center text-[11px] tracking-[0.16em] text-white/85",
            ].join(" ")}
          >
            CAREER // SHEET
          </p>
          <CareerGrid compact />
        </div>
      </div>
    );
  }

  if (id === "inlineExpand") {
    return (
      <div className="border border-white/15 bg-[#060c12]/90 p-3">
        <div className="flex items-start gap-2.5">
          <div className="h-12 w-12 shrink-0 border border-cyan-300/45 bg-slate-800" />
          <div className="min-w-0 flex-1">
            <p className={[nameOxanium.className, "text-lg text-white"].join(" ")}>
              MPJ
            </p>
            <p className="text-[11px] text-white/40">Win now</p>
          </div>
          <p className={[nameOxanium.className, "text-sm text-amber-300/90"].join(" ")}>
            1,000
          </p>
        </div>
        <p
          className={[
            nameOxanium.className,
            "mt-3 text-center text-[10px] tracking-[0.14em] text-white/40",
          ].join(" ")}
        >
          NBA // 26-27 SEASON
        </p>
        <div className="mt-2 grid grid-cols-2 gap-1.5 opacity-50">
          {["勝率", "総合得点", "UPSET", "最多得点者"].map((l) => (
            <div key={l} className="border border-white/10 px-2 py-1.5">
              <p
                className={[
                  nameRajdhani.className,
                  "text-[8px] uppercase tracking-[0.1em] text-white/40",
                ].join(" ")}
              >
                {l}
              </p>
              <p className={[nameOxanium.className, "text-xs text-white/50"].join(" ")}>
                —
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 border-t border-[#00F5FF]/35 pt-2 text-center">
          <span
            className={[
              nameRajdhani.className,
              "text-[10px] tracking-[0.2em] text-[#00F5FF]",
            ].join(" ")}
          >
            CAREER ▾
          </span>
        </div>
        <div className="mt-2">
          <CareerGrid compact />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="border border-white/15 bg-[#060c12]/90 p-3">
        <div className="mb-3 flex gap-2">
          <div className="flex-1 border border-[#00F5FF]/30 py-1.5 text-center">
            <span
              className={[
                nameRajdhani.className,
                "text-[10px] tracking-[0.16em] text-[#00F5FF]",
              ].join(" ")}
            >
              PROFILE
            </span>
          </div>
          <div className="flex-1 border border-[#00F5FF] bg-[#00F5FF] py-1.5 text-center">
            <span
              className={[
                nameRajdhani.className,
                "text-[10px] tracking-[0.16em] text-[#050508]",
              ].join(" ")}
            >
              CAREER
            </span>
          </div>
        </div>
        <p
          className={[
            nameOxanium.className,
            "mb-2 text-center text-[11px] tracking-[0.16em] text-white/85",
          ].join(" ")}
        >
          CAREER // SHEET
        </p>
        <CareerGrid />
      </div>
      <p
        className={[
          nameRajdhani.className,
          "mt-2 text-center text-[10px] tracking-[0.12em] text-white/35",
        ].join(" ")}
      >
        同じ枠・中身だけ差し替え
      </p>
    </div>
  );
}

export default function CareerPlacementPreviewPage() {
  const [id, setId] = useState<VariantId>("stackBelow");
  const active = VARIANTS.find((v) => v.id === id) ?? VARIANTS[1];

  return (
    <div className="min-h-dvh bg-[#05070a] text-white">
      <div className="mx-auto w-full max-w-[420px] px-4 pb-10 pt-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1
              className={[
                nameOxanium.className,
                "text-base tracking-wide text-white",
              ].join(" ")}
            >
              CAREER 載せ場所案
            </h1>
            <p className="mt-1 text-[11px] leading-snug text-white/45">
              裏面以外に載せる候補。本番はまだ Flip Back。
            </p>
          </div>
          <Link
            href="/mobile/profile"
            className={[
              nameRajdhani.className,
              "shrink-0 border border-white/20 px-2.5 py-1.5 text-[11px] tracking-[0.1em] text-white/75",
            ].join(" ")}
          >
            戻る
          </Link>
        </div>

        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {VARIANTS.map((v) => {
            const on = v.id === id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setId(v.id)}
                className={[
                  nameRajdhani.className,
                  "shrink-0 border px-2.5 py-1.5 text-[10px] tracking-[0.08em]",
                  on
                    ? "border-[#00F5FF] bg-[#00F5FF]/15 text-[#00F5FF]"
                    : "border-white/20 text-white/55",
                ].join(" ")}
              >
                {v.name}
              </button>
            );
          })}
        </div>

        <div className="mb-3 border border-white/10 bg-white/[0.03] p-2.5">
          <p
            className={[
              nameRajdhani.className,
              "mb-1 text-xs tracking-[0.1em] text-[#00F5FF]",
            ].join(" ")}
          >
            {active.name}
          </p>
          <p className="text-xs leading-relaxed text-white/65">{active.blurb}</p>
        </div>

        <div className="border border-white/10 bg-[#070b10] p-3">
          <Stage id={id} />
        </div>
      </div>
    </div>
  );
}
