"use client";

/**
 * /mobile/unit-earn-modal-preview · /dev/unit-earn-modal-preview
 * Unit 獲得モーダル — Cyan Panel 基準の派生案。
 */
import { useMemo, useState } from "react";
import { nameOxanium, nameRajdhani } from "@/lib/fonts";
import UniterzLogo from "@/app/component/units/UniterzLogo";

type VariantId = "base" | "wide" | "ghost" | "split" | "mark" | "bar";

type Sample = {
  rank: number;
  title: string;
  subtitle: string;
  amount: number;
};

const SAMPLE: Sample = {
  rank: 1,
  title: "月間ランキング",
  subtitle: "2026年1月 · NBA",
  amount: 200,
};

const VARIANTS: Array<{
  id: VariantId;
  name: string;
  note: string;
}> = [
  {
    id: "base",
    name: "基準 · Cyan Panel",
    note: "採用候補のベース。シアン枠 + 大順位 + 金金額。",
  },
  {
    id: "wide",
    name: "Wide CTA",
    note: "基準と同じ構成。ボタンだけ全幅にして押しやすく。",
  },
  {
    id: "ghost",
    name: "Ghost Edge",
    note: "塗りを薄く。枠と順位のシアンだけ残す。",
  },
  {
    id: "split",
    name: "Split Focus",
    note: "順位と金額を横並び。視線移動を短く。",
  },
  {
    id: "mark",
    name: "Rank Mark",
    note: "巨大な順位を透かしに。金額を前面へ。",
  },
  {
    id: "bar",
    name: "Top Bar",
    note: "四辺枠の代わりに上のアクセントバーだけ。",
  },
];

function Coin({ size = 40 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="grid place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background:
          "conic-gradient(from 210deg, #f9d576, #b8860b 40%, #f6c344 70%, #8a6410)",
        boxShadow: "inset 0 0 3px rgba(0,0,0,0.45)",
      }}
    >
      <span
        className="grid place-items-center rounded-full font-extrabold text-[#241902]"
        style={{
          width: size * 0.72,
          height: size * 0.72,
          fontSize: size * 0.32,
          background:
            "radial-gradient(circle at 35% 30%, #ffedb0, #d9a125 70%)",
        }}
      >
        U
      </span>
    </span>
  );
}

function ClaimBtn({
  label,
  full = false,
}: {
  label: string;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      className={[
        nameOxanium.className,
        "mt-6 inline-flex items-center justify-center px-5 py-2.5",
        "border border-cyan-300/70 bg-cyan-300 text-[#041018]",
        "text-[12px] font-extrabold uppercase tracking-[0.16em]",
        full ? "w-full min-w-0" : "min-w-[168px]",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function PanelShell({
  children,
  tone = "solid",
}: {
  children: React.ReactNode;
  tone?: "solid" | "ghost" | "bare";
}) {
  if (tone === "bare") {
    return (
      <div className="relative w-full overflow-hidden bg-[rgba(4,10,16,0.72)] px-5 pb-5 pt-6">
        {children}
      </div>
    );
  }
  return (
    <div
      className={[
        "relative w-full overflow-hidden px-5 pb-5 pt-6",
        tone === "ghost"
          ? "border border-cyan-300/35 bg-transparent"
          : "border border-cyan-300/25 bg-[rgba(4,10,16,0.92)]",
      ].join(" ")}
      style={{
        clipPath:
          "polygon(0 12px, 12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px))",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent"
      />
      {children}
    </div>
  );
}

/** SVG サイバーロゴ（共有パス） */
function BrandMark() {
  return (
    <div className="flex w-full justify-center px-1">
      <UniterzLogo width="100%" className="max-w-[300px]" />
    </div>
  );
}

/** 順位の「理由」は主役にしない — 上は薄く、下はメタだけ */
function ContextAbove({ sample }: { sample: Sample }) {
  return (
    <p
      className={[
        nameRajdhani.className,
        "mt-3 text-center text-[13px] font-semibold tracking-[0.04em] text-white/55",
      ].join(" ")}
    >
      {sample.title}
    </p>
  );
}

function MetaBelow({ sample }: { sample: Sample }) {
  return (
    <p className="mt-1.5 text-center text-[12px] text-white/35">
      {sample.subtitle}
    </p>
  );
}

function AmountRow({
  sample,
  size = "lg",
}: {
  sample: Sample;
  size?: "lg" | "md";
}) {
  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <Coin size={size === "lg" ? 36 : 30} />
      <span
        className={[
          nameOxanium.className,
          "font-extrabold italic tracking-tight text-[#ffe9a8]",
          size === "lg" ? "text-[40px]" : "text-[32px]",
        ].join(" ")}
      >
        +{sample.amount.toLocaleString("en-US")}
      </span>
    </div>
  );
}

/** 基準 */
function VariantBase({ sample }: { sample: Sample }) {
  return (
    <PanelShell>
      <BrandMark />
      <ContextAbove sample={sample} />
      <p
        className={[
          nameOxanium.className,
          "mt-2 text-center text-[48px] font-extrabold leading-none tracking-tight text-cyan-100",
        ].join(" ")}
      >
        #{sample.rank}
      </p>
      <MetaBelow sample={sample} />
      <AmountRow sample={sample} />
      <div className="flex justify-center">
        <ClaimBtn label="獲得する" />
      </div>
    </PanelShell>
  );
}

/** 全幅 CTA */
function VariantWide({ sample }: { sample: Sample }) {
  return (
    <PanelShell>
      <BrandMark />
      <ContextAbove sample={sample} />
      <p
        className={[
          nameOxanium.className,
          "mt-2 text-center text-[48px] font-extrabold leading-none tracking-tight text-cyan-100",
        ].join(" ")}
      >
        #{sample.rank}
      </p>
      <MetaBelow sample={sample} />
      <AmountRow sample={sample} />
      <ClaimBtn label="獲得する" full />
    </PanelShell>
  );
}

/** 薄い枠 */
function VariantGhost({ sample }: { sample: Sample }) {
  return (
    <PanelShell tone="ghost">
      <BrandMark />
      <ContextAbove sample={sample} />
      <p
        className={[
          nameOxanium.className,
          "mt-2 text-center text-[52px] font-extrabold leading-none tracking-tight text-cyan-200",
        ].join(" ")}
      >
        #{sample.rank}
      </p>
      <MetaBelow sample={sample} />
      <AmountRow sample={sample} />
      <div className="flex justify-center">
        <ClaimBtn label="獲得する" />
      </div>
    </PanelShell>
  );
}

/** 順位と金額を横並び */
function VariantSplit({ sample }: { sample: Sample }) {
  return (
    <PanelShell>
      <BrandMark />
      <div className="mt-5 flex items-center justify-between gap-3 px-1">
        <div className="min-w-0 flex-1 text-left">
          <p
            className={[
              nameOxanium.className,
              "text-[40px] font-extrabold leading-none tracking-tight text-cyan-100",
            ].join(" ")}
          >
            #{sample.rank}
          </p>
          <p
            className={[
              nameRajdhani.className,
              "mt-2 text-[15px] font-bold text-white",
            ].join(" ")}
          >
            {sample.title}
          </p>
          <p className="mt-0.5 text-[11px] text-white/40">{sample.subtitle}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Coin size={28} />
          <span
            className={[
              nameOxanium.className,
              "text-[34px] font-extrabold italic leading-none tracking-tight text-[#ffe9a8]",
            ].join(" ")}
          >
            +{sample.amount.toLocaleString("en-US")}
          </span>
        </div>
      </div>
      <div className="flex justify-center">
        <ClaimBtn label="獲得する" />
      </div>
    </PanelShell>
  );
}

/** 透かし順位 */
function VariantMark({ sample }: { sample: Sample }) {
  return (
    <PanelShell>
      <div className="relative overflow-hidden">
        <p
          aria-hidden
          className={[
            nameOxanium.className,
            "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[42%]",
            "text-[120px] font-extrabold leading-none tracking-tighter text-cyan-300/[0.08]",
          ].join(" ")}
        >
          #{sample.rank}
        </p>
        <BrandMark />
        <p
          className={[
            nameRajdhani.className,
            "relative mt-4 text-center text-[13px] font-semibold text-white/55",
          ].join(" ")}
        >
          {sample.title}
        </p>
        <p className="relative mt-1 text-center text-[12px] text-white/35">
          {sample.subtitle}
        </p>
        <p
          className={[
            nameOxanium.className,
            "relative mt-2 text-center text-[13px] font-bold uppercase tracking-[0.18em] text-cyan-200/70",
          ].join(" ")}
        >
          Rank #{sample.rank}
        </p>
        <div className="relative">
          <AmountRow sample={sample} />
        </div>
        <div className="relative flex justify-center">
          <ClaimBtn label="獲得する" />
        </div>
      </div>
    </PanelShell>
  );
}

/** 上バーのみ */
function VariantBar({ sample }: { sample: Sample }) {
  return (
    <PanelShell tone="bare">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
      />
      <BrandMark />
      <ContextAbove sample={sample} />
      <p
        className={[
          nameOxanium.className,
          "mt-2 text-center text-[48px] font-extrabold leading-none tracking-tight text-cyan-100",
        ].join(" ")}
      >
        #{sample.rank}
      </p>
      <MetaBelow sample={sample} />
      <AmountRow sample={sample} />
      <div className="flex justify-center">
        <ClaimBtn label="獲得する" />
      </div>
    </PanelShell>
  );
}

function Stage({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-sm border border-white/10 bg-[#05080c]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 45%, rgba(20,28,40,0.9), transparent 70%)",
        }}
      />
      <div className="relative min-h-[420px] px-4 pb-8 pt-10">
        <div className="mb-6 flex items-center justify-between opacity-30">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">
            Profile
          </span>
          <span className="flex items-center gap-1.5 text-[12px] text-[#f6c344]">
            <Coin size={14} />
            1,330
          </span>
        </div>
        <div className="relative z-[1] mx-auto flex max-w-[300px] justify-center">
          {children}
        </div>
        <p className="mt-8 text-center text-[10px] uppercase tracking-[0.16em] text-white/25">
          {label}
        </p>
      </div>
    </div>
  );
}

export default function UnitEarnModalDesignPreviewPage() {
  const [active, setActive] = useState<VariantId>("base");
  const meta = useMemo(
    () => VARIANTS.find((v) => v.id === active) ?? VARIANTS[0]!,
    [active]
  );

  return (
    <main className="min-h-screen bg-[#03070b] px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-[420px]">
        <p
          className={[
            nameOxanium.className,
            "text-[10px] font-extrabold uppercase tracking-[0.22em] text-cyan-300/70",
          ].join(" ")}
        >
          Design preview
        </p>
        <h1
          className={[
            nameRajdhani.className,
            "mt-1 text-2xl font-bold text-white",
          ].join(" ")}
        >
          Unit 獲得モーダル案
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/45">
          SVG サイバーロゴ + Cyan Panel 派生案。
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {VARIANTS.map((v) => {
            const on = v.id === active;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setActive(v.id)}
                className={[
                  nameOxanium.className,
                  "border px-3 py-2.5 text-left transition-colors",
                  on
                    ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100"
                    : "border-white/10 bg-white/[0.02] text-white/60",
                ].join(" ")}
              >
                <span className="block text-[11px] font-extrabold uppercase tracking-[0.12em]">
                  {v.name}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-[12px] text-white/40">{meta.note}</p>

        <div className="mt-4">
          <Stage label={meta.name}>
            {active === "base" ? (
              <VariantBase sample={SAMPLE} />
            ) : null}
            {active === "wide" ? (
              <VariantWide sample={SAMPLE} />
            ) : null}
            {active === "ghost" ? (
              <VariantGhost sample={SAMPLE} />
            ) : null}
            {active === "split" ? (
              <VariantSplit sample={SAMPLE} />
            ) : null}
            {active === "mark" ? (
              <VariantMark sample={SAMPLE} />
            ) : null}
            {active === "bar" ? (
              <VariantBar sample={SAMPLE} />
            ) : null}
          </Stage>
        </div>
      </div>
    </main>
  );
}
