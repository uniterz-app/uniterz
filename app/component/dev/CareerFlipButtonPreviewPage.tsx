"use client";

/**
 * /mobile/career-flip-button-preview · /dev/career-flip-button-preview
 * フリップ導線の「配置・構造」案。現状ボタンは残し、根本レイアウトを比較する。
 */
import { useState } from "react";
import Link from "next/link";
import { nameOxanium, nameRajdhani } from "@/lib/fonts";

type VariantId =
  | "current"
  | "avatarMast"
  | "cardEar"
  | "spine"
  | "crown"
  | "orbit"
  | "curl";

type Variant = {
  id: VariantId;
  name: string;
  blurb: string;
};

const VARIANTS: readonly Variant[] = [
  {
    id: "current",
    name: "A · Current",
    blurb: "カード下の小さなボタン。基準。",
  },
  {
    id: "avatarMast",
    name: "B · Avatar Mast",
    blurb: "アバター上にタブがせり出す。顔まわりの操作点。",
  },
  {
    id: "cardEar",
    name: "C · Card Ear",
    blurb: "カード上辺から耳（タブ）が出る。ファイルの見出し感。",
  },
  {
    id: "spine",
    name: "D · Spine",
    blurb: "左端に縦タブ。本の背表紙をひっくり返すイメージ。",
  },
  {
    id: "crown",
    name: "E · Crown Notch",
    blurb: "上辺中央の切り欠き。カード自体がフリップ可能な物体。",
  },
  {
    id: "orbit",
    name: "F · Orbit Badge",
    blurb: "アバター右上に被さるバッジ。プロフィール装飾の延長。",
  },
  {
    id: "curl",
    name: "G · Page Curl",
    blurb: "右下のページめくり。紙を裏返す比喩。",
  },
] as const;

function MockAvatar() {
  return (
    <div className="h-14 w-14 shrink-0 border border-cyan-300/50 bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]" />
  );
}

function MockStats() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-1.5 opacity-45">
      {["勝率", "総合得点", "UPSET", "最多得点者"].map((label) => (
        <div
          key={label}
          className="border border-white/10 bg-black/30 px-2 py-2"
        >
          <p
            className={[
              nameRajdhani.className,
              "text-[8px] uppercase tracking-[0.12em] text-white/40",
            ].join(" ")}
          >
            {label}
          </p>
          <p className={[nameOxanium.className, "text-xs text-white/50"].join(" ")}>
            —
          </p>
        </div>
      ))}
    </div>
  );
}

function MockHeader() {
  return (
    <div className="flex items-start gap-3">
      <MockAvatar />
      <div className="min-w-0 pt-0.5">
        <p
          className={[
            nameOxanium.className,
            "text-sm font-bold tracking-wide text-white/90",
          ].join(" ")}
        >
          MPJ
        </p>
        <p
          className={[
            nameRajdhani.className,
            "mt-0.5 text-[9px] uppercase tracking-[0.14em] text-white/35",
          ].join(" ")}
        >
          Win now
        </p>
      </div>
      <div className="ml-auto pt-1">
        <span
          className={[
            nameOxanium.className,
            "text-[11px] tabular-nums text-amber-200/80",
          ].join(" ")}
        >
          1,000
        </span>
      </div>
    </div>
  );
}

function FlipHit({
  flipped,
  onToggle,
  className,
  children,
}: {
  flipped: boolean;
  onToggle: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={flipped}
      className={className}
    >
      {children}
    </button>
  );
}

function StructuralCard({
  id,
  flipped,
  onToggle,
}: {
  id: VariantId;
  flipped: boolean;
  onToggle: () => void;
}) {
  const label = flipped ? "PROFILE" : "CAREER";

  if (id === "current") {
    return (
      <div>
        <div className="relative overflow-hidden border border-white/10 bg-[#070d12] p-3">
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 70% 10%, rgba(34,211,238,0.12), transparent 50%)",
            }}
            aria-hidden
          />
          <div className="relative">
            <MockHeader />
            <p
              className={[
                nameOxanium.className,
                "mt-4 text-center text-[9px] tracking-[0.16em] text-white/40",
              ].join(" ")}
            >
              NBA // 26-27 SEASON
            </p>
            <MockStats />
          </div>
        </div>
        <div className="mt-2 flex justify-end">
          <FlipHit
            flipped={flipped}
            onToggle={onToggle}
            className={[
              nameRajdhani.className,
              "inline-flex items-center gap-1.5 rounded-sm border border-cyan-300/35 bg-cyan-400/10 px-2.5 py-1.5",
              "text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-50/95",
            ].join(" ")}
          >
            <span aria-hidden>↻</span>
            {label}
          </FlipHit>
        </div>
      </div>
    );
  }

  if (id === "avatarMast") {
    return (
      <div className="relative overflow-visible border border-white/10 bg-[#070d12] p-3 pt-5">
        <div className="relative">
          <div className="flex items-start gap-3">
            <div className="relative">
              <FlipHit
                flipped={flipped}
                onToggle={onToggle}
                className={[
                  nameRajdhani.className,
                  "absolute -top-4 left-1/2 z-[2] -translate-x-1/2",
                  "border border-cyan-300/60 bg-[#0a141c] px-2 py-0.5",
                  "text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-100",
                  "shadow-[0_0_0_1px_rgba(34,211,238,0.15)]",
                  "before:absolute before:inset-x-2 before:-bottom-1 before:h-1 before:bg-[#0a141c]",
                ].join(" ")}
              >
                {label}
              </FlipHit>
              <MockAvatar />
            </div>
            <div className="min-w-0 pt-0.5">
              <p
                className={[
                  nameOxanium.className,
                  "text-sm font-bold tracking-wide text-white/90",
                ].join(" ")}
              >
                MPJ
              </p>
              <p
                className={[
                  nameRajdhani.className,
                  "mt-0.5 text-[9px] uppercase tracking-[0.14em] text-white/35",
                ].join(" ")}
              >
                Win now
              </p>
            </div>
          </div>
          <p
            className={[
              nameOxanium.className,
              "mt-4 text-center text-[9px] tracking-[0.16em] text-white/40",
            ].join(" ")}
          >
            NBA // 26-27 SEASON
          </p>
          <MockStats />
        </div>
      </div>
    );
  }

  if (id === "cardEar") {
    return (
      <div className="relative pt-5">
        <FlipHit
          flipped={flipped}
          onToggle={onToggle}
          className={[
            nameRajdhani.className,
            "absolute right-4 top-0 z-[2]",
            "border border-b-0 border-cyan-300/50 bg-[#0a141c] px-3 py-1",
            "text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-50",
            "[clip-path:polygon(8%_0,92%_0,100%_100%,0_100%)]",
          ].join(" ")}
        >
          {label}
        </FlipHit>
        <div className="overflow-hidden border border-white/10 bg-[#070d12] p-3">
          <MockHeader />
          <p
            className={[
              nameOxanium.className,
              "mt-4 text-center text-[9px] tracking-[0.16em] text-white/40",
            ].join(" ")}
          >
            NBA // 26-27 SEASON
          </p>
          <MockStats />
        </div>
      </div>
    );
  }

  if (id === "spine") {
    return (
      <div className="relative pl-6">
        <FlipHit
          flipped={flipped}
          onToggle={onToggle}
          className={[
            nameRajdhani.className,
            "absolute bottom-6 left-0 top-6 z-[2] w-6",
            "flex items-center justify-center border border-r-0 border-cyan-300/45 bg-[#0a141c]",
            "text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-100",
          ].join(" ")}
        >
          <span
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              letterSpacing: "0.18em",
            }}
          >
            {label}
          </span>
        </FlipHit>
        <div className="overflow-hidden border border-white/10 bg-[#070d12] p-3">
          <MockHeader />
          <p
            className={[
              nameOxanium.className,
              "mt-4 text-center text-[9px] tracking-[0.16em] text-white/40",
            ].join(" ")}
          >
            NBA // 26-27 SEASON
          </p>
          <MockStats />
        </div>
      </div>
    );
  }

  if (id === "crown") {
    return (
      <div className="relative pt-4">
        <FlipHit
          flipped={flipped}
          onToggle={onToggle}
          className={[
            nameRajdhani.className,
            "absolute left-1/2 top-0 z-[2] -translate-x-1/2",
            "min-w-[7.5rem] border border-b-0 border-cyan-300/55 bg-[#0a141c] px-4 py-1.5",
            "text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-50",
            "[clip-path:polygon(12%_0,88%_0,100%_100%,0_100%)]",
          ].join(" ")}
        >
          {flipped ? "PROFILE // FACE" : "CAREER // SHEET"}
        </FlipHit>
        <div className="overflow-hidden border border-white/10 bg-[#070d12] p-3 pt-5">
          <MockHeader />
          <p
            className={[
              nameOxanium.className,
              "mt-4 text-center text-[9px] tracking-[0.16em] text-white/40",
            ].join(" ")}
          >
            NBA // 26-27 SEASON
          </p>
          <MockStats />
        </div>
      </div>
    );
  }

  if (id === "orbit") {
    return (
      <div className="relative overflow-hidden border border-white/10 bg-[#070d12] p-3">
        <div className="relative">
          <div className="flex items-start gap-3">
            <div className="relative">
              <MockAvatar />
              <FlipHit
                flipped={flipped}
                onToggle={onToggle}
                className={[
                  nameRajdhani.className,
                  "absolute -right-3 -top-2 z-[2]",
                  "h-7 min-w-7 items-center justify-center border border-cyan-300/60 bg-black/80 px-1.5",
                  "text-[8px] font-bold uppercase tracking-[0.08em] text-cyan-100",
                  "shadow-[0_0_12px_rgba(34,211,238,0.25)]",
                ].join(" ")}
              >
                {flipped ? "P" : "C"}
              </FlipHit>
            </div>
            <div className="min-w-0 pt-0.5">
              <p
                className={[
                  nameOxanium.className,
                  "text-sm font-bold tracking-wide text-white/90",
                ].join(" ")}
              >
                MPJ
              </p>
              <p
                className={[
                  nameRajdhani.className,
                  "mt-0.5 text-[9px] uppercase tracking-[0.14em] text-white/35",
                ].join(" ")}
              >
                Win now
              </p>
            </div>
          </div>
          <p
            className={[
              nameOxanium.className,
              "mt-4 text-center text-[9px] tracking-[0.16em] text-white/40",
            ].join(" ")}
          >
            NBA // 26-27 SEASON
          </p>
          <MockStats />
        </div>
      </div>
    );
  }

  /* curl */
  return (
    <div className="relative overflow-hidden border border-white/10 bg-[#070d12] p-3">
      <MockHeader />
      <p
        className={[
          nameOxanium.className,
          "mt-4 text-center text-[9px] tracking-[0.16em] text-white/40",
        ].join(" ")}
      >
        NBA // 26-27 SEASON
      </p>
      <MockStats />
      <FlipHit
        flipped={flipped}
        onToggle={onToggle}
        className={[
          nameRajdhani.className,
          "absolute bottom-0 right-0 z-[2]",
          "flex h-14 w-14 items-end justify-end p-2",
          "text-[9px] font-semibold uppercase tracking-[0.12em] text-cyan-100",
          "bg-[linear-gradient(225deg,transparent_48%,rgba(34,211,238,0.18)_48%,rgba(8,20,28,0.95)_52%)]",
        ].join(" ")}
      >
        <span className="translate-x-0.5 translate-y-0.5 rotate-[-18deg]">
          {flipped ? "◀" : "▶"}
        </span>
      </FlipHit>
    </div>
  );
}

export default function CareerFlipButtonPreviewPage() {
  const [flippedById, setFlippedById] = useState<Record<VariantId, boolean>>(
    () =>
      Object.fromEntries(VARIANTS.map((v) => [v.id, false])) as Record<
        VariantId,
        boolean
      >
  );

  return (
    <div className="min-h-screen bg-[#05080c] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-[960px]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p
              className={[
                nameRajdhani.className,
                "text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-200/55",
              ].join(" ")}
            >
              DEV PREVIEW · STRUCTURE
            </p>
            <h1
              className={[
                nameOxanium.className,
                "mt-1 text-lg font-bold uppercase tracking-[0.12em] text-white/90",
              ].join(" ")}
            >
              Career Flip Placement
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">
              ボタン色の話ではなく、カード／プロフィールに対する「置き方」の案。
              出っ張り・背・耳・めくりなど根本レイアウトを比較。採用はまだ反映しません。
            </p>
          </div>
          <Link
            href="/mobile/profile"
            className={[
              nameRajdhani.className,
              "text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-200/70 hover:text-cyan-100",
            ].join(" ")}
          >
            ← Profile
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {VARIANTS.map((v) => (
            <section
              key={v.id}
              className="border border-white/10 bg-white/[0.02] p-3 sm:p-4"
            >
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h2
                  className={[
                    nameRajdhani.className,
                    "text-sm font-semibold uppercase tracking-[0.14em] text-white/85",
                  ].join(" ")}
                >
                  {v.name}
                </h2>
                <span
                  className={[
                    nameOxanium.className,
                    "text-[9px] uppercase tracking-[0.16em] text-white/35",
                  ].join(" ")}
                >
                  {flippedById[v.id] ? "BACK" : "FRONT"}
                </span>
              </div>
              <p className="mb-3 text-xs leading-relaxed text-white/45">
                {v.blurb}
              </p>
              <StructuralCard
                id={v.id}
                flipped={flippedById[v.id]}
                onToggle={() =>
                  setFlippedById((prev) => ({
                    ...prev,
                    [v.id]: !prev[v.id],
                  }))
                }
              />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
