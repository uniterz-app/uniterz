"use client";

/**
 * /dev/community-retro-preview
 * マイコミュニティ — レトロサイバー4案の並列プレビュー（本番未接続）
 *
 * A: CRT 端末（荧光シアン + 琥珀）
 * B: ピクセル HUD（低解像度・アーケード）
 * C: VHS / グリッチ（劣化・NO SIGNAL）
 * D: 筐体パネル（メカ・物理キー）
 */

import { useState } from "react";
import { ChevronRight, Clipboard } from "lucide-react";
import { IBM_Plex_Mono, VT323 } from "next/font/google";
import { jp, nameOxanium } from "@/lib/fonts";

const ibmMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const vt323 = VT323({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const MOCK = {
  createLabel: "グループを作成",
  joinTitle: "招待コードで参加",
  listTitle: "マイコミュニティ",
  invitePlaceholder: "ABCD1234",
  group: {
    name: "NBA予想サークル",
    description: "プレーオフ期間の仲間内バトル",
    competition: "NBA · 総得点 · これから",
    memberCount: 12,
    role: "OWNER" as const,
  },
};

type VariantKey = "a" | "b" | "c" | "d";

const VARIANTS: Array<{
  key: VariantKey;
  title: string;
  subtitle: string;
}> = [
  {
    key: "a",
    title: "案A — CRT 端末",
    subtitle: "80–90年代荧光モニター · シアン + 琥珀",
  },
  {
    key: "b",
    title: "案B — ピクセル HUD",
    subtitle: "アーケードスコア表 · 8px グリッド",
  },
  {
    key: "c",
    title: "案C — VHS / グリッチ",
    subtitle: "走査劣化 · RGB ずれ · NO SIGNAL",
  },
  {
    key: "d",
    title: "案D — 筐体パネル",
    subtitle: "ラックマウント機器 · リベット · 物理キー",
  },
];

function PreviewFrame({
  title,
  subtitle,
  selected,
  onSelect,
  children,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "group w-full text-left transition-all duration-200",
        selected
          ? "ring-2 ring-cyan-400/70 ring-offset-2 ring-offset-[#050810]"
          : "opacity-90 hover:opacity-100",
      ].join(" ")}
    >
      <div className="mb-2 px-0.5">
        <p className="text-sm font-bold text-cyan-100">{title}</p>
        <p className="text-[11px] text-white/45">{subtitle}</p>
      </div>
      <div className="overflow-hidden rounded-sm border border-white/10 bg-[#030508]">
        {children}
      </div>
    </button>
  );
}

/* ── 案A: CRT 端末 ── */
function VariantA() {
  return (
    <div
      className={`relative min-h-[420px] p-3 ${ibmMono.className}`}
      style={{
        background:
          "radial-gradient(120% 90% at 50% 0%, rgba(34,211,238,0.06) 0%, transparent 55%), #020408",
      }}
    >
      {/* CRT vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background:
            "radial-gradient(ellipse 85% 75% at 50% 48%, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.35]"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)",
        }}
      />

      <p
        className="relative z-30 mb-3 text-[11px] tracking-[0.22em]"
        style={{ color: "rgba(251,191,36,0.85)", textShadow: "0 0 8px rgba(251,191,36,0.4)" }}
      >
        {">>> SYS://COMMUNITY/INDEX"}
      </p>

      <div
        className="relative z-30 mb-3 border px-3 py-2.5 text-center text-sm font-medium tracking-[0.14em]"
        style={{
          borderColor: "rgba(34,211,238,0.45)",
          color: "rgba(186,230,253,0.95)",
          background: "rgba(8,18,28,0.92)",
          boxShadow: "inset 0 0 20px rgba(34,211,238,0.08), 0 0 16px rgba(34,211,238,0.12)",
          textShadow: "0 0 12px rgba(34,211,238,0.35)",
        }}
      >
        {MOCK.createLabel}
      </div>

      <div
        className="relative z-30 mb-3 border p-3"
        style={{
          borderColor: "rgba(251,191,36,0.35)",
          background: "rgba(6,12,8,0.95)",
          boxShadow: "inset 0 0 24px rgba(251,191,36,0.04)",
        }}
      >
        <p
          className="mb-2 text-[10px] tracking-[0.2em]"
          style={{ color: "rgba(251,191,36,0.75)" }}
        >
          INVITE_CODE:
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={MOCK.invitePlaceholder}
            className="min-w-0 flex-1 border bg-black/60 px-2 py-1.5 text-xs tracking-[0.18em] text-amber-100/90 outline-none"
            style={{ borderColor: "rgba(251,191,36,0.3)" }}
          />
          <span
            className="inline-flex items-center border px-2 text-[10px]"
            style={{ borderColor: "rgba(34,211,238,0.35)", color: "rgba(34,211,238,0.9)" }}
          >
            <Clipboard className="mr-1 h-3 w-3" />
            PASTE
          </span>
        </div>
      </div>

      <p
        className="relative z-30 mb-2 text-[10px] tracking-[0.24em]"
        style={{ color: "rgba(34,211,238,0.65)" }}
      >
        {">> MY COMMUNITY"}
      </p>

      <GroupCardA />
    </div>
  );
}

function GroupCardA() {
  return (
    <div
      className="relative z-30 flex items-center gap-2 border p-2.5"
      style={{
        borderColor: "rgba(34,211,238,0.38)",
        background: "linear-gradient(170deg, rgba(12,22,34,0.98), rgba(4,8,14,1))",
        boxShadow: "inset 0 0 16px rgba(34,211,238,0.05)",
      }}
    >
      <div className="flex w-14 shrink-0 flex-col items-center gap-1">
        <span
          className="w-full border py-0.5 text-center text-[8px] tracking-widest"
          style={{
            borderColor: "rgba(251,191,36,0.45)",
            color: "rgba(251,191,36,0.9)",
            background: "rgba(251,191,36,0.08)",
          }}
        >
          {MOCK.group.role}
        </span>
        <div
          className="flex size-14 items-center justify-center border text-lg"
          style={{ borderColor: "rgba(34,211,238,0.25)", color: "rgba(34,211,238,0.25)" }}
        >
          ▣
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-cyan-50">{MOCK.group.name}</p>
        <p className="line-clamp-1 text-[10px] text-white/50">{MOCK.group.description}</p>
        <p className="mt-1 text-[9px] tracking-wide text-amber-200/55">{MOCK.group.competition}</p>
        <p className="text-[10px] text-cyan-200/70">{MOCK.group.memberCount} MEMBERS</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-cyan-400/40" />
    </div>
  );
}

/* ── 案B: ピクセル HUD ── */
function VariantB() {
  return (
    <div
      className={`relative min-h-[420px] p-3 ${jp.className}`}
      style={{
        background: "#0a0a12",
        backgroundImage: `
          linear-gradient(rgba(34,211,238,0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(34,211,238,0.08) 1px, transparent 1px)
        `,
        backgroundSize: "8px 8px",
      }}
    >
      <p className={`mb-3 text-2xl leading-none text-cyan-300 ${vt323.className}`}>
        MY COMMUNITY
      </p>

      <div
        className="mb-3 border-2 border-cyan-400 bg-cyan-950/40 py-2 text-center text-xl text-cyan-200"
        style={{ imageRendering: "pixelated", boxShadow: "4px 4px 0 rgba(34,211,238,0.35)" }}
      >
        <span className={vt323.className}>{MOCK.createLabel}</span>
      </div>

      <div className="mb-3 border-2 border-white/20 bg-black/80 p-2">
        <p className={`mb-1 text-lg text-cyan-400/80 ${vt323.className}`}>
          {MOCK.joinTitle}
        </p>
        <div className="flex gap-1">
          <div
            className={`flex-1 border border-cyan-500/50 bg-black px-2 py-1 text-lg text-cyan-100 ${vt323.className}`}
          >
            {MOCK.invitePlaceholder}
          </div>
          <div
            className={`border border-cyan-500/50 px-2 py-1 text-lg text-cyan-300 ${vt323.className}`}
          >
            GO
          </div>
        </div>
      </div>

      <GroupCardB />
    </div>
  );
}

function GroupCardB() {
  return (
    <div
      className="flex items-center gap-2 border-2 border-cyan-400/70 bg-[#0c1020] p-2"
      style={{ boxShadow: "3px 3px 0 rgba(34,211,238,0.25)" }}
    >
      <div className="flex w-16 shrink-0 flex-col items-center gap-1">
        <span
          className={`w-full border border-yellow-400/80 bg-yellow-900/30 py-0.5 text-center text-sm text-yellow-200 ${vt323.className}`}
        >
          OWNER
        </span>
        <div
          className="flex size-14 items-center justify-center border-2 border-cyan-500/40 bg-black text-2xl"
          style={{ imageRendering: "pixelated" }}
        >
          <span className={vt323.className}>■</span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-xl text-white ${vt323.className}`}>{MOCK.group.name}</p>
        <p className={`line-clamp-1 text-sm text-white/55 ${vt323.className}`}>
          {MOCK.group.competition}
        </p>
        <p className={`text-lg text-cyan-300 ${vt323.className}`}>
          {String(MOCK.group.memberCount).padStart(2, "0")} / 100
        </p>
      </div>
      <span className={`text-2xl text-cyan-400 ${vt323.className}`}>{">"}</span>
    </div>
  );
}

/* ── 案C: VHS / グリッチ ── */
function VariantC() {
  const [glitch, setGlitch] = useState(false);

  return (
    <div
      className={`community-vhs-preview relative min-h-[420px] overflow-hidden p-3 ${jp.className}`}
      onMouseEnter={() => setGlitch(true)}
      onMouseLeave={() => setGlitch(false)}
    >
      <div className="absolute inset-0 bg-[#080810]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-[38%] h-6 bg-white/5"
        style={{ transform: glitch ? "translateX(4px)" : undefined }}
      />

      <div
        className={[
          "relative z-10 transition-transform duration-75",
          glitch ? "community-vhs-glitch" : "",
        ].join(" ")}
      >
        <p className={`mb-1 text-[10px] tracking-[0.3em] text-fuchsia-300/70 ${nameOxanium.className}`}>
          REC ● 00:04:12
        </p>
        <p className="mb-3 font-mono text-[11px] text-cyan-200/60">BOOT: GROUP_SUBSYS_OK</p>

        <div className="mb-3 border border-cyan-400/40 bg-black/70 px-3 py-2 text-center text-sm text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
          {MOCK.createLabel}
        </div>

        <div className="mb-3 border border-white/15 bg-black/60 p-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
            {MOCK.joinTitle}
          </p>
          <div className="flex gap-2 font-mono text-xs">
            <span className="flex-1 border border-cyan-500/30 bg-black/80 px-2 py-1.5 text-cyan-100">
              {MOCK.invitePlaceholder}
            </span>
            <span className="border border-fuchsia-500/40 px-2 py-1.5 text-fuchsia-200">
              SCAN
            </span>
          </div>
        </div>

        <GroupCardC glitch={glitch} />
      </div>

      <style jsx>{`
        .community-vhs-glitch {
          animation: vhsShift 0.12s steps(2) 2;
        }
        @keyframes vhsShift {
          0% {
            transform: translate(0, 0);
            filter: none;
          }
          25% {
            transform: translate(-2px, 0);
            filter: hue-rotate(20deg);
          }
          50% {
            transform: translate(2px, 1px);
            filter: saturate(1.4);
          }
          75% {
            transform: translate(-1px, -1px);
          }
          100% {
            transform: translate(0, 0);
          }
        }
      `}</style>
    </div>
  );
}

function GroupCardC({ glitch }: { glitch: boolean }) {
  return (
    <div
      className={[
        "relative flex items-center gap-2 overflow-hidden border border-cyan-400/35 p-2.5",
        glitch ? "shadow-[2px_0_0_rgba(255,0,80,0.35),-2px_0_0_rgba(0,255,255,0.35)]" : "",
      ].join(" ")}
      style={{
        background: "linear-gradient(170deg, rgba(18,14,28,0.98), rgba(6,6,12,1))",
      }}
    >
      <div className="flex w-14 shrink-0 flex-col items-center gap-1">
        <span className="w-full bg-fuchsia-500/20 py-0.5 text-center font-mono text-[8px] tracking-widest text-fuchsia-200">
          OWNER
        </span>
        <div className="flex size-14 items-center justify-center border border-white/10 bg-black/80 text-white/20">
          NO IMG
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-bold text-white"
          style={{ textShadow: glitch ? "2px 0 #ff0066, -2px 0 #00ffff" : undefined }}
        >
          {MOCK.group.name}
        </p>
        <p className="text-[10px] text-white/45">{MOCK.group.competition}</p>
        <p className="font-mono text-[10px] text-cyan-300/80">
          RANK_SYNC · {MOCK.group.memberCount} nodes
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-white/30" />
    </div>
  );
}

/* ── 案D: 筐体パネル ── */
function VariantD() {
  return (
    <div
      className={`relative min-h-[420px] p-3 ${jp.className}`}
      style={{
        background:
          "linear-gradient(180deg, #121820 0%, #0a0e14 100%)",
      }}
    >
      {/* リベット */}
      {[
        "left-1 top-1",
        "right-1 top-1",
        "left-1 bottom-1",
        "right-1 bottom-1",
      ].map((pos) => (
        <span
          key={pos}
          className={`absolute ${pos} z-20 size-2 rounded-full border border-white/20 bg-linear-to-br from-zinc-500 to-zinc-800 shadow-inner`}
        />
      ))}

      <div className="relative z-10 mb-3 border border-zinc-600/60 bg-zinc-900/90 p-2">
        <div className="mb-2 flex items-center gap-2 border-b border-orange-900/40 pb-2">
          <span className="size-2 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.8)]" />
          <span className="font-mono text-[9px] tracking-[0.18em] text-orange-200/70">
            UNIT-04 / COMMUNITY BUS
          </span>
        </div>
        <button
          type="button"
          className="w-full border-b-4 border-zinc-950 bg-linear-to-b from-zinc-600 to-zinc-800 py-2.5 text-sm font-bold tracking-wide text-zinc-100 active:translate-y-0.5 active:border-b-2"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)" }}
        >
          {MOCK.createLabel}
        </button>
      </div>

      <div className="relative z-10 mb-3 border border-zinc-700/50 bg-zinc-950/80 p-3">
        <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
          Input · Invite
        </p>
        <div className="flex gap-2">
          <div className="flex flex-1 items-center border border-zinc-700 bg-black px-2 py-1.5 font-mono text-xs text-cyan-100/90">
            {MOCK.invitePlaceholder}
          </div>
          <div className="border border-zinc-600 bg-zinc-800 px-3 py-1.5 font-mono text-[10px] text-zinc-300">
            EXEC
          </div>
        </div>
        {/* 目盛り */}
        <div className="mt-2 flex justify-between font-mono text-[7px] text-zinc-600">
          {["0", "25", "50", "75", "100"].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>

      <GroupCardD />
    </div>
  );
}

function GroupCardD() {
  return (
    <div className="relative z-10 flex gap-2 border border-zinc-700/60 bg-zinc-900/95 p-2">
      <div className="w-1 shrink-0 bg-linear-to-b from-orange-600/80 via-orange-500/20 to-transparent" />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="flex w-14 shrink-0 flex-col items-center gap-1">
          <span className="w-full border border-orange-700/50 bg-orange-950/40 py-0.5 text-center font-mono text-[7px] text-orange-200">
            OWNR
          </span>
          <div className="size-14 border border-zinc-700 bg-zinc-950" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-100">{MOCK.group.name}</p>
          <p className="font-mono text-[9px] text-zinc-500">{MOCK.group.competition}</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden bg-zinc-800">
              <div className="h-full w-[48%] bg-orange-500/70" />
            </div>
            <span className="font-mono text-[9px] text-zinc-400">{MOCK.group.memberCount}/100</span>
          </div>
        </div>
        <span className="font-mono text-xs text-zinc-600">{">>"}</span>
      </div>
    </div>
  );
}

function VariantRenderer({ keyName }: { keyName: VariantKey }) {
  switch (keyName) {
    case "a":
      return <VariantA />;
    case "b":
      return <VariantB />;
    case "c":
      return <VariantC />;
    case "d":
      return <VariantD />;
    default:
      return null;
  }
}

export default function CommunityRetroPreviewPage() {
  const [selected, setSelected] = useState<VariantKey>("a");
  const [layout, setLayout] = useState<"grid" | "focus">("grid");

  return (
    <div className={`min-h-screen bg-[#050810] text-white ${jp.className}`}>
      <div className="mx-auto max-w-6xl px-4 py-8 pb-20">
        <header className="mb-8 border-b border-white/10 pb-6">
          <p className="font-mono text-[10px] tracking-[0.28em] text-cyan-400/60">
            DEV PREVIEW · NOT IN PRODUCTION
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white">
            マイコミュニティ — レトロサイバー4案
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
            同じ内容（作成ボタン · 招待コード · グループカード）を4トーンで並べています。
            カードをクリックで選択。案Cはホバーでグリッチが走ります。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setLayout("grid")}
              className={[
                "rounded-none border px-3 py-1.5 text-xs font-mono",
                layout === "grid"
                  ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-100"
                  : "border-white/15 text-white/50",
              ].join(" ")}
            >
              4列比較
            </button>
            <button
              type="button"
              onClick={() => setLayout("focus")}
              className={[
                "rounded-none border px-3 py-1.5 text-xs font-mono",
                layout === "focus"
                  ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-100"
                  : "border-white/15 text-white/50",
              ].join(" ")}
            >
              選択案を拡大
            </button>
          </div>
          {layout === "focus" ? (
            <p className="mt-3 font-mono text-sm text-amber-200/80">
              選択中: {VARIANTS.find((v) => v.key === selected)?.title}
            </p>
          ) : null}
        </header>

        {layout === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {VARIANTS.map((v) => (
              <PreviewFrame
                key={v.key}
                title={v.title}
                subtitle={v.subtitle}
                selected={selected === v.key}
                onSelect={() => setSelected(v.key)}
              >
                <VariantRenderer keyName={v.key} />
              </PreviewFrame>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-md">
            <PreviewFrame
              title={VARIANTS.find((v) => v.key === selected)!.title}
              subtitle={VARIANTS.find((v) => v.key === selected)!.subtitle}
              selected
              onSelect={() => {}}
            >
              <VariantRenderer keyName={selected} />
            </PreviewFrame>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {VARIANTS.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setSelected(v.key)}
                  className={[
                    "border px-3 py-1 font-mono text-[11px] uppercase tracking-wider",
                    selected === v.key
                      ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-100"
                      : "border-white/10 text-white/40 hover:text-white/70",
                  ].join(" ")}
                >
                  {v.key.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mt-10 text-center text-xs text-white/35">
          /dev/community-retro-preview — 本番 UI には未反映
        </p>
      </div>
    </div>
  );
}
