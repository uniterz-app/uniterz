"use client";

/**
 * SQUAD BATTLE UI 刷新案プレビュー（dev 専用・モック）。
 * 方向性の異なる5パターンを同一コンテンツで見比べる。
 * 採用が決まったらこのファイルの案を本実装へ移植する。
 */

import { useRef, type ReactNode } from "react";
import Image from "next/image";
import cn from "clsx";
import { nameOxanium, nameRajdhani, nameBebas, jp } from "@/lib/fonts";

/* ============================================================
 * 共通モックデータ（全パターンで同一 — 比較を公平にする）
 * ========================================================== */

const ICON_SRC = "/squad-battle/icon.png";

type MockMember = { name: string; points: string; me?: boolean };

const MY_SQUAD = {
  name: "NEON CIRCUIT",
  rank: 5,
  avg: "1,163",
  delta: "+36",
  members: [
    { name: "Kamiya", points: "1,284", me: true },
    { name: "NeonFox", points: "1,210" },
    { name: "Orbit", points: "1,186" },
    { name: "Pulse", points: "1,095" },
    { name: "Rift", points: "1,028" },
  ] as MockMember[],
};

const BOARD = [
  { rank: 1, name: "CYAN WOLVES", avg: "1,472", delta: "+48", move: 1 },
  { rank: 2, name: "GRID RUNNERS", avg: "1,362", delta: "+22", move: -1 },
  { rank: 3, name: "VOID SQUAD", avg: "1,313", delta: "+15", move: 0 },
];

const PHASES = [
  { key: "entry", label: "ENTRY", active: false, done: true },
  { key: "battle", label: "BATTLE", active: true, done: false },
  { key: "reward", label: "REWARD", active: false, done: false },
];

function moveGlyph(move: number): string {
  if (move > 0) return "▲";
  if (move < 0) return "▼";
  return "―";
}

/* ============================================================
 * パターン定義（切替ナビ用）
 * ========================================================== */

const PATTERNS = [
  {
    id: "gold-legion",
    no: "A",
    title: "GOLD LEGION",
    subtitle: "現行の金を磨き込む — 黒鉄と金箔、王者の凱旋",
  },
  {
    id: "cyan-command",
    no: "B",
    title: "CYAN COMMAND",
    subtitle: "本体アプリと完全統一 — 作戦司令室の精密 HUD",
  },
  {
    id: "gold-command",
    no: "F",
    title: "GOLD COMMAND",
    subtitle: "★ B の形 × A の色 — 精密データ HUD を金で",
  },
  {
    id: "cyan-legion",
    no: "G",
    title: "CYAN LEGION",
    subtitle: "★ A の形 × B の色 — 紋章カードをシアンで",
  },
  {
    id: "crimson-protocol",
    no: "C",
    title: "CRIMSON PROTOCOL",
    subtitle: "深紅×黒の開戦前夜 — 攻撃的なウォールーム",
  },
  {
    id: "neon-clash",
    no: "D",
    title: "NEON CLASH",
    subtitle: "紫マゼンタのナイトアリーナ — イベント感最大",
  },
  {
    id: "steel-circuit",
    no: "E",
    title: "STEEL CIRCUIT",
    subtitle: "無彩色スチール+金1点 — 公式リーグの計測室",
  },
] as const;

/* ============================================================
 * 共有パレット — 「形」と「色」を分離してハイブリッド案を作る
 * ========================================================== */

type HudPalette = {
  bg: string;
  /** 紋章カード用グラデ面（A の形） */
  panelGrad: string;
  /** データパネル用フラット面（B の形) */
  panelFlat: string;
  /** パネル上辺のハイライト */
  sheen: string;
  line: string;
  lineSoft: string;
  ink: string;
  mut: string;
  mutFaint: string;
  acc: string;
  accDeep: string;
  /** アクセント塗りの上に載せる文字色 */
  accOn: string;
  /** グロー用 RGB（"r,g,b"） */
  glowRgb: string;
  up: string;
  down: string;
};

const GOLD: HudPalette = {
  bg: "#0A0805",
  panelGrad: "linear-gradient(164deg, rgba(38,28,10,0.92) 0%, rgba(12,9,4,0.99) 55%)",
  panelFlat: "rgba(24,18,7,0.92)",
  sheen: "rgba(255,236,179,0.14)",
  line: "rgba(251,191,36,0.42)",
  lineSoft: "rgba(251,191,36,0.18)",
  ink: "#FFF7E0",
  mut: "#C9B27E",
  mutFaint: "rgba(201,178,126,0.5)",
  acc: "#FBBF24",
  accDeep: "#B45309",
  accOn: "#1A1002",
  glowRgb: "251,191,36",
  up: "#FDE68A",
  down: "#B45309",
};

const CYAN: HudPalette = {
  bg: "#081116",
  panelGrad: "linear-gradient(164deg, rgba(8,38,46,0.92) 0%, rgba(3,10,13,0.99) 55%)",
  panelFlat: "rgba(7,17,24,0.92)",
  sheen: "rgba(210,250,255,0.12)",
  line: "rgba(0,245,255,0.35)",
  lineSoft: "rgba(0,245,255,0.14)",
  ink: "#E9FDFF",
  mut: "#7FB5C2",
  mutFaint: "rgba(127,181,194,0.5)",
  acc: "#00F5FF",
  accDeep: "#0E7490",
  accOn: "#05262B",
  glowRgb: "0,245,255",
  up: "#A5F3FC",
  down: "#5E8896",
};

/* ============================================================
 * A の形: LEGION — 紋章カード
 *    チャンファー・メダリオン・連結セグメント・スキャンライン
 * ========================================================== */

const GOLD_CHAMFER =
  "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)";

function GoldPanel({
  pal,
  children,
  className,
}: {
  pal: HudPalette;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("relative", className)}
      style={{
        clipPath: GOLD_CHAMFER,
        WebkitClipPath: GOLD_CHAMFER,
        background: pal.panelGrad,
        boxShadow: `inset 0 0 0 1px ${pal.line}, inset 0 1px 0 ${pal.sheen}`,
      }}
    >
      {children}
    </div>
  );
}

function GoldLegionMock({ pal }: { pal: HudPalette }) {
  return (
    <div
      className="flex flex-col gap-4 px-4 py-5"
      style={{ background: pal.bg, color: pal.ink }}
    >
      {/* ヘッダー: マーク + タイトル + フェーズ */}
      <div className="flex items-center gap-3">
        <div
          className="h-12 w-12 shrink-0 overflow-hidden"
          style={{ boxShadow: `0 0 18px rgba(${pal.glowRgb},0.35)` }}
        >
          <Image src={ICON_SRC} alt="" width={48} height={48} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className={cn(nameBebas.className, "text-[26px] leading-none tracking-[0.06em]")}
            style={{ color: pal.ink, textShadow: `0 0 22px rgba(${pal.glowRgb},0.4)` }}
          >
            SQUAD BATTLE
          </h3>
          <p className={cn(nameOxanium.className, "mt-1 text-[10px] font-bold uppercase tracking-[0.2em]")} style={{ color: pal.mut }}>
            Season IV — Day 12 / 28
          </p>
        </div>
      </div>

      {/* フェーズトラック: 連結セグメント */}
      <div className="flex items-stretch gap-1">
        {PHASES.map((p) => (
          <div
            key={p.key}
            className="relative flex-1 px-2 py-1.5 text-center"
            style={{
              clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
              background: p.active
                ? `linear-gradient(180deg, ${pal.acc} 0%, ${pal.accDeep} 100%)`
                : `rgba(${pal.glowRgb},0.07)`,
              boxShadow: p.active ? `0 0 18px rgba(${pal.glowRgb},0.5)` : `inset 0 0 0 1px ${pal.lineSoft}`,
            }}
          >
            <span
              className={cn(nameOxanium.className, "text-[10px] font-black tracking-[0.18em]")}
              style={{ color: p.active ? pal.accOn : p.done ? pal.mut : pal.mutFaint }}
            >
              {p.label}
            </span>
          </div>
        ))}
      </div>

      {/* MY SQUAD — 紋章的な大カード */}
      <GoldPanel pal={pal}>
        {/* スキャンライン */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ background: `repeating-linear-gradient(0deg, ${pal.acc} 0px, ${pal.acc} 1px, transparent 1px, transparent 4px)` }}
        />
        <div className="relative px-4 pb-4 pt-3.5">
          <div className="flex items-baseline justify-between">
            <span className={cn(nameOxanium.className, "text-[9px] font-black uppercase tracking-[0.24em]")} style={{ color: pal.mut }}>
              My Squad
            </span>
            <span className={cn(nameOxanium.className, "text-[10px] font-bold")} style={{ color: pal.mut }}>
              RANK <span className={cn(nameBebas.className, "text-[20px]")} style={{ color: pal.acc }}>#{MY_SQUAD.rank}</span>
            </span>
          </div>
          <div className="mt-1 flex items-end justify-between gap-3">
            <h4 className={cn(nameBebas.className, "text-[30px] leading-none tracking-[0.04em]")} style={{ color: pal.ink }}>
              {MY_SQUAD.name}
            </h4>
            <div className="text-right">
              <div className={cn(nameBebas.className, "text-[30px] leading-none")} style={{ color: pal.acc, textShadow: `0 0 16px rgba(${pal.glowRgb},0.5)` }}>
                {MY_SQUAD.avg}
              </div>
              <div className={cn(nameOxanium.className, "text-[9px] font-bold uppercase tracking-[0.14em]")} style={{ color: pal.mut }}>
                AVG PTS <span style={{ color: pal.up }}>{MY_SQUAD.delta}</span>
              </div>
            </div>
          </div>

          {/* メンバー: メダリオン列 */}
          <div className="mt-4 flex gap-2">
            {MY_SQUAD.members.map((m) => (
              <div key={m.name} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="flex h-11 w-11 items-center justify-center"
                  style={{
                    clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                    background: m.me
                      ? `linear-gradient(180deg, ${pal.acc}, ${pal.accDeep})`
                      : `linear-gradient(180deg, rgba(${pal.glowRgb},0.22), rgba(${pal.glowRgb},0.06))`,
                    boxShadow: m.me ? `0 0 14px rgba(${pal.glowRgb},0.55)` : "none",
                  }}
                >
                  <span className={cn(nameOxanium.className, "text-[13px] font-black")} style={{ color: m.me ? pal.accOn : pal.ink }}>
                    {m.name[0]}
                  </span>
                </div>
                <span className={cn(nameOxanium.className, "max-w-full truncate text-[8px] font-bold uppercase tracking-wide")} style={{ color: m.me ? pal.acc : pal.mut }}>
                  {m.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </GoldPanel>

      {/* リーダーボード: 表彰列 */}
      <div className="flex flex-col gap-1.5">
        <span className={cn(nameOxanium.className, "text-[9px] font-black uppercase tracking-[0.24em]")} style={{ color: pal.mut }}>
          Leaderboard — Week 2
        </span>
        {BOARD.map((row) => (
          <div
            key={row.rank}
            className="flex items-center gap-3 px-3 py-2.5"
            style={{
              clipPath: GOLD_CHAMFER,
              WebkitClipPath: GOLD_CHAMFER,
              background: row.rank === 1 ? `linear-gradient(90deg, rgba(${pal.glowRgb},0.16), rgba(${pal.glowRgb},0.03))` : `rgba(${pal.glowRgb},0.04)`,
              boxShadow: `inset 0 0 0 1px ${row.rank === 1 ? pal.line : pal.lineSoft}`,
            }}
          >
            <span className={cn(nameBebas.className, "w-7 text-center text-[22px] leading-none")} style={{ color: row.rank === 1 ? pal.acc : pal.mut }}>
              {row.rank}
            </span>
            <span className={cn(nameOxanium.className, "min-w-0 flex-1 truncate text-[13px] font-black uppercase tracking-[0.08em]")} style={{ color: pal.ink }}>
              {row.name}
            </span>
            <span className={cn(nameOxanium.className, "text-[10px] font-bold")} style={{ color: row.move > 0 ? pal.up : row.move < 0 ? pal.down : pal.mut }}>
              {moveGlyph(row.move)}
            </span>
            <span className={cn(nameBebas.className, "text-[19px] leading-none")} style={{ color: pal.ink }}>
              {row.avg}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex gap-2">
        <button
          type="button"
          className={cn(nameOxanium.className, "flex-1 py-3 text-[12px] font-black uppercase tracking-[0.18em] transition hover:brightness-110")}
          style={{
            clipPath: GOLD_CHAMFER,
            WebkitClipPath: GOLD_CHAMFER,
            background: `linear-gradient(180deg, ${pal.acc}, ${pal.accDeep})`,
            color: pal.accOn,
            boxShadow: `0 0 22px rgba(${pal.glowRgb},0.4)`,
          }}
        >
          Battle Board
        </button>
        <button
          type="button"
          className={cn(nameOxanium.className, "flex-1 py-3 text-[12px] font-black uppercase tracking-[0.18em] transition hover:bg-white/5")}
          style={{
            clipPath: GOLD_CHAMFER,
            WebkitClipPath: GOLD_CHAMFER,
            background: "transparent",
            color: pal.acc,
            boxShadow: `inset 0 0 0 1px ${pal.line}`,
          }}
        >
          Invite Code
        </button>
      </div>
    </div>
  );
}

/* ============================================================
 * B の形: COMMAND — 精密データ HUD
 *    1px 線・直角・ドットグリッド・ステッパー・表形式
 * ========================================================== */

function CyanCommandMock({ pal }: { pal: HudPalette }) {
  return (
    <div
      className="relative flex flex-col gap-4 px-4 py-5"
      style={{ background: pal.bg, color: pal.ink }}
    >
      {/* ドットグリッド背景 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `radial-gradient(rgba(${pal.glowRgb},0.12) 1px, transparent 1px)`,
          backgroundSize: "18px 18px",
        }}
      />

      {/* ヘッダー: 司令室ステータスバー */}
      <div className="relative flex items-center justify-between border-b pb-3" style={{ borderColor: pal.lineSoft }}>
        <div>
          <h3 className={cn(nameOxanium.className, "text-[19px] font-black uppercase tracking-[0.14em]")} style={{ color: pal.ink }}>
            Squad Battle
          </h3>
          <p className={cn(nameRajdhani.className, "text-[11px] font-semibold uppercase tracking-[0.18em]")} style={{ color: pal.mut }}>
            OP-04 // AVG SCORE PROTOCOL
          </p>
        </div>
        <div className="flex items-center gap-1.5 border px-2 py-1" style={{ borderColor: pal.line }}>
          <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: pal.acc, boxShadow: `0 0 6px ${pal.acc}` }} />
          <span className={cn(nameOxanium.className, "text-[9px] font-black uppercase tracking-[0.2em]")} style={{ color: pal.acc }}>
            Live
          </span>
        </div>
      </div>

      {/* フェーズ: 細線ステッパー */}
      <div className="relative flex items-center gap-0">
        {PHASES.map((p, i) => (
          <div key={p.key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1" style={{ minWidth: 52 }}>
              <span
                className="flex h-4 w-4 items-center justify-center border text-[8px]"
                style={{
                  borderColor: p.active || p.done ? pal.acc : pal.lineSoft,
                  background: p.active ? pal.acc : "transparent",
                  color: p.active ? pal.accOn : p.done ? pal.acc : pal.mut,
                  boxShadow: p.active ? `0 0 10px ${pal.acc}` : "none",
                }}
              >
                {p.done ? "✓" : i + 1}
              </span>
              <span className={cn(nameOxanium.className, "text-[9px] font-bold uppercase tracking-[0.16em]")} style={{ color: p.active ? pal.acc : pal.mut }}>
                {p.label}
              </span>
            </div>
            {i < PHASES.length - 1 ? (
              <div className="mx-1 h-px flex-1" style={{ background: p.done ? pal.line : pal.lineSoft }} />
            ) : null}
          </div>
        ))}
      </div>

      {/* MY SQUAD: データパネル（表形式・数字が主役） */}
      <div className="relative border" style={{ borderColor: pal.line, background: pal.panelFlat }}>
        <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: pal.lineSoft }}>
          <span className={cn(nameOxanium.className, "text-[10px] font-black uppercase tracking-[0.2em]")} style={{ color: pal.mut }}>
            My Squad
          </span>
          <span className={cn(nameOxanium.className, "text-[12px] font-black uppercase tracking-[0.08em]")} style={{ color: pal.ink }}>
            {MY_SQUAD.name}
          </span>
        </div>
        <div className="grid grid-cols-3 divide-x" style={{ borderColor: pal.lineSoft }}>
          {[
            { label: "RANK", value: `#${MY_SQUAD.rank}` },
            { label: "AVG PTS", value: MY_SQUAD.avg },
            { label: "TODAY", value: MY_SQUAD.delta },
          ].map((cell) => (
            <div key={cell.label} className="px-3 py-3 text-center" style={{ borderColor: pal.lineSoft }}>
              <div className={cn(nameBebas.className, "text-[26px] leading-none")} style={{ color: pal.acc, textShadow: `0 0 14px rgba(${pal.glowRgb},0.4)` }}>
                {cell.value}
              </div>
              <div className={cn(nameOxanium.className, "mt-1 text-[8px] font-bold uppercase tracking-[0.2em]")} style={{ color: pal.mut }}>
                {cell.label}
              </div>
            </div>
          ))}
        </div>
        {/* メンバー: ロースター行 */}
        <div className="border-t" style={{ borderColor: pal.lineSoft }}>
          {MY_SQUAD.members.map((m, i) => (
            <div key={m.name} className="flex items-center gap-2.5 px-3 py-1.5" style={{ background: m.me ? `rgba(${pal.glowRgb},0.07)` : "transparent" }}>
              <span className={cn(nameRajdhani.className, "w-4 text-[11px] font-bold")} style={{ color: pal.mut }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className={cn(nameOxanium.className, "min-w-0 flex-1 truncate text-[12px] font-bold")} style={{ color: m.me ? pal.acc : pal.ink }}>
                {m.name}
                {m.me ? <span className={cn(jp.className, "ml-1.5 text-[9px] font-semibold")} style={{ color: pal.mut }}>あなた</span> : null}
              </span>
              <span className={cn(nameRajdhani.className, "text-[13px] font-bold tabular-nums")} style={{ color: pal.ink }}>
                {m.points}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* リーダーボード: 精密テーブル */}
      <div className="relative flex flex-col gap-0 border-t pt-2" style={{ borderColor: pal.lineSoft }}>
        <span className={cn(nameOxanium.className, "mb-1.5 text-[10px] font-black uppercase tracking-[0.2em]")} style={{ color: pal.mut }}>
          Leaderboard
        </span>
        {BOARD.map((row) => (
          <div key={row.rank} className="flex items-center gap-3 border-b px-1 py-2" style={{ borderColor: pal.lineSoft }}>
            <span
              className={cn(nameOxanium.className, "flex h-6 w-6 items-center justify-center border text-[11px] font-black")}
              style={{
                borderColor: row.rank === 1 ? pal.acc : pal.lineSoft,
                color: row.rank === 1 ? pal.acc : pal.mut,
              }}
            >
              {row.rank}
            </span>
            <span className={cn(nameOxanium.className, "min-w-0 flex-1 truncate text-[12px] font-black uppercase tracking-[0.06em]")} style={{ color: pal.ink }}>
              {row.name}
            </span>
            <span className={cn(nameRajdhani.className, "text-[10px] font-bold")} style={{ color: row.move > 0 ? pal.up : row.move < 0 ? pal.down : pal.mut }}>
              {moveGlyph(row.move)}
            </span>
            <span className={cn(nameRajdhani.className, "text-[15px] font-bold tabular-nums")} style={{ color: pal.ink }}>
              {row.avg}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="relative flex gap-2">
        <button
          type="button"
          className={cn(nameOxanium.className, "flex-1 border py-2.5 text-[11px] font-black uppercase tracking-[0.2em] transition hover:brightness-110")}
          style={{ borderColor: pal.acc, background: `rgba(${pal.glowRgb},0.14)`, color: pal.acc }}
        >
          Battle Board
        </button>
        <button
          type="button"
          className={cn(nameOxanium.className, "flex-1 border py-2.5 text-[11px] font-black uppercase tracking-[0.2em] transition hover:bg-white/5")}
          style={{ borderColor: pal.lineSoft, background: "transparent", color: pal.mut }}
        >
          Invite Code
        </button>
      </div>
    </div>
  );
}

/* ============================================================
 * C. CRIMSON PROTOCOL — 深紅×黒のウォールーム
 *    斜めカット・ハザードストライプ・太い斜体
 * ========================================================== */

const CRIM = {
  bg: "#0C0507",
  panel: "linear-gradient(150deg, rgba(56,10,16,0.85) 0%, rgba(14,5,7,0.98) 60%)",
  line: "rgba(244,63,94,0.5)",
  lineSoft: "rgba(244,63,94,0.18)",
  ink: "#FFEDF0",
  mut: "#C98A96",
  acc: "#F43F5E",
};

const CRIM_SLANT = "polygon(14px 0%, 100% 0%, calc(100% - 14px) 100%, 0% 100%)";

function CrimsonProtocolMock() {
  return (
    <div className="flex flex-col gap-4 px-4 py-5" style={{ background: CRIM.bg, color: CRIM.ink }}>
      {/* ヘッダー: 斜体大見出し + ハザード帯 */}
      <div>
        <div className="flex items-center gap-2">
          <h3
            className={cn(nameBebas.className, "text-[30px] italic leading-none tracking-[0.03em]")}
            style={{ color: CRIM.ink, textShadow: "0 0 24px rgba(244,63,94,0.55)" }}
          >
            SQUAD BATTLE
          </h3>
          <span
            className={cn(nameOxanium.className, "px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em]")}
            style={{ background: CRIM.acc, color: "#20040A", clipPath: CRIM_SLANT }}
          >
            War Room
          </span>
        </div>
        {/* ハザードストライプ */}
        <div
          aria-hidden
          className="mt-2 h-1.5 w-full"
          style={{
            background: `repeating-linear-gradient(-45deg, ${CRIM.acc} 0px, ${CRIM.acc} 8px, transparent 8px, transparent 16px)`,
            opacity: 0.5,
          }}
        />
      </div>

      {/* フェーズ: 弾倉スロット */}
      <div className="flex gap-1.5">
        {PHASES.map((p) => (
          <div
            key={p.key}
            className="flex flex-1 flex-col items-center gap-1 py-2"
            style={{
              clipPath: CRIM_SLANT,
              background: p.active ? "linear-gradient(180deg, #F43F5E, #881337)" : "rgba(244,63,94,0.06)",
              boxShadow: p.active ? "0 0 22px rgba(244,63,94,0.5)" : `inset 0 0 0 1px ${CRIM.lineSoft}`,
            }}
          >
            <span className={cn(nameBebas.className, "text-[15px] italic leading-none tracking-[0.1em]")} style={{ color: p.active ? "#FFF1F2" : p.done ? CRIM.mut : "rgba(201,138,150,0.45)" }}>
              {p.label}
            </span>
          </div>
        ))}
      </div>

      {/* MY SQUAD: 出撃ボード */}
      <div className="relative" style={{ background: CRIM.panel, boxShadow: `inset 0 0 0 1px ${CRIM.line}` }}>
        {/* コーナーブラケット */}
        {[
          "left-0 top-0 border-l-2 border-t-2",
          "right-0 top-0 border-r-2 border-t-2",
          "bottom-0 left-0 border-b-2 border-l-2",
          "bottom-0 right-0 border-b-2 border-r-2",
        ].map((pos) => (
          <span key={pos} aria-hidden className={cn("absolute h-3 w-3", pos)} style={{ borderColor: CRIM.acc }} />
        ))}
        <div className="px-4 py-3.5">
          <div className="flex items-center justify-between">
            <span className={cn(nameOxanium.className, "text-[9px] font-black uppercase tracking-[0.26em]")} style={{ color: CRIM.acc }}>
              // My Squad
            </span>
            <span className={cn(nameBebas.className, "text-[20px] italic leading-none")} style={{ color: CRIM.ink }}>
              RANK {MY_SQUAD.rank}
            </span>
          </div>
          <h4 className={cn(nameBebas.className, "mt-1 text-[34px] italic leading-none tracking-[0.02em]")} style={{ color: CRIM.ink }}>
            {MY_SQUAD.name}
          </h4>

          {/* スコア: 大数字 + VS 感 */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1">
              <div className={cn(nameBebas.className, "text-[38px] italic leading-none")} style={{ color: CRIM.acc, textShadow: "0 0 20px rgba(244,63,94,0.6)" }}>
                {MY_SQUAD.avg}
              </div>
              <div className={cn(nameOxanium.className, "mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em]")} style={{ color: CRIM.mut }}>
                Avg Pts / Today {MY_SQUAD.delta}
              </div>
            </div>
            {/* メンバー: ドッグタグ縦積み */}
            <div className="flex flex-col gap-1">
              {MY_SQUAD.members.map((m) => (
                <div
                  key={m.name}
                  className="flex items-center gap-2 px-2 py-0.5"
                  style={{
                    clipPath: CRIM_SLANT,
                    background: m.me ? "rgba(244,63,94,0.25)" : "rgba(244,63,94,0.07)",
                  }}
                >
                  <span className={cn(nameOxanium.className, "w-16 truncate text-[9px] font-black uppercase")} style={{ color: m.me ? CRIM.ink : CRIM.mut }}>
                    {m.name}
                  </span>
                  <span className={cn(nameRajdhani.className, "text-[10px] font-bold tabular-nums")} style={{ color: CRIM.ink }}>
                    {m.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* リーダーボード: 敵squadリスト */}
      <div className="flex flex-col gap-1.5">
        <span className={cn(nameOxanium.className, "text-[9px] font-black uppercase tracking-[0.26em]")} style={{ color: CRIM.mut }}>
          // Enemy Squads
        </span>
        {BOARD.map((row) => (
          <div
            key={row.rank}
            className="flex items-center gap-3 px-3 py-2"
            style={{
              clipPath: CRIM_SLANT,
              background: row.rank === 1 ? "linear-gradient(90deg, rgba(244,63,94,0.22), rgba(244,63,94,0.04))" : "rgba(244,63,94,0.05)",
            }}
          >
            <span className={cn(nameBebas.className, "w-6 text-[22px] italic leading-none")} style={{ color: row.rank === 1 ? CRIM.acc : CRIM.mut }}>
              {row.rank}
            </span>
            <span className={cn(nameBebas.className, "min-w-0 flex-1 truncate text-[17px] italic tracking-[0.05em]")} style={{ color: CRIM.ink }}>
              {row.name}
            </span>
            <span className={cn(nameOxanium.className, "text-[10px] font-bold")} style={{ color: row.move > 0 ? "#FDA4AF" : row.move < 0 ? "#9F1239" : CRIM.mut }}>
              {moveGlyph(row.move)}
            </span>
            <span className={cn(nameBebas.className, "text-[19px] italic leading-none tabular-nums")} style={{ color: CRIM.ink }}>
              {row.avg}
            </span>
          </div>
        ))}
      </div>

      {/* CTA: 出撃ボタン */}
      <div className="flex gap-2">
        <button
          type="button"
          className={cn(nameBebas.className, "flex-1 py-2.5 text-[17px] italic tracking-[0.12em] transition hover:brightness-110")}
          style={{
            clipPath: CRIM_SLANT,
            background: "linear-gradient(180deg, #F43F5E, #9F1239)",
            color: "#FFF1F2",
            boxShadow: "0 0 24px rgba(244,63,94,0.45)",
          }}
        >
          ENGAGE
        </button>
        <button
          type="button"
          className={cn(nameBebas.className, "flex-1 py-2.5 text-[17px] italic tracking-[0.12em] transition hover:bg-rose-500/10")}
          style={{ clipPath: CRIM_SLANT, background: "transparent", color: CRIM.acc, boxShadow: `inset 0 0 0 1px ${CRIM.line}` }}
        >
          INVITE
        </button>
      </div>
    </div>
  );
}

/* ============================================================
 * D. NEON CLASH — 紫×マゼンタのナイトアリーナ
 *    デュオトーングラデ・丸みのあるネオン管・イベント感
 * ========================================================== */

const NEON = {
  bg: "#0B0614",
  panel: "linear-gradient(160deg, rgba(76,29,149,0.35) 0%, rgba(15,8,28,0.96) 55%, rgba(112,26,117,0.28) 100%)",
  line: "rgba(217,70,239,0.45)",
  lineSoft: "rgba(217,70,239,0.16)",
  ink: "#FBF3FF",
  mut: "#B899CF",
  acc: "#E879F9",
  acc2: "#818CF8",
};

function NeonClashMock() {
  return (
    <div className="relative flex flex-col gap-4 overflow-hidden px-4 py-5" style={{ background: NEON.bg, color: NEON.ink }}>
      {/* 背景オーロラ */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 left-1/2 h-48 w-[130%] -translate-x-1/2 rounded-[100%] opacity-30 blur-3xl"
        style={{ background: "linear-gradient(90deg, #7C3AED, #D946EF, #4F46E5)" }}
      />

      {/* ヘッダー: ネオンサイン */}
      <div className="relative text-center">
        <h3
          className={cn(nameBebas.className, "text-[32px] leading-none tracking-[0.1em]")}
          style={{ color: NEON.ink, textShadow: "0 0 12px rgba(232,121,249,0.9), 0 0 40px rgba(129,140,248,0.6)" }}
        >
          SQUAD BATTLE
        </h3>
        <p className={cn(nameOxanium.className, "mt-1 text-[10px] font-bold uppercase tracking-[0.3em]")} style={{ color: NEON.mut }}>
          Midnight Arena — Week 2
        </p>
      </div>

      {/* フェーズ: ネオン管タイムライン */}
      <div className="relative flex items-center justify-between px-2">
        <div aria-hidden className="absolute left-4 right-4 top-[7px] h-0.5 rounded-full" style={{ background: NEON.lineSoft }} />
        <div
          aria-hidden
          className="absolute left-4 top-[7px] h-0.5 w-1/2 rounded-full"
          style={{ background: `linear-gradient(90deg, ${NEON.acc2}, ${NEON.acc})`, boxShadow: `0 0 10px ${NEON.acc}` }}
        />
        {PHASES.map((p) => (
          <div key={p.key} className="relative flex flex-col items-center gap-1.5">
            <span
              className="h-4 w-4 rounded-full"
              style={{
                background: p.active ? NEON.acc : p.done ? NEON.acc2 : "rgba(217,70,239,0.12)",
                boxShadow: p.active ? `0 0 14px ${NEON.acc}` : p.done ? `0 0 8px ${NEON.acc2}` : "none",
                border: `1px solid ${p.active || p.done ? "transparent" : NEON.lineSoft}`,
              }}
            />
            <span className={cn(nameOxanium.className, "text-[9px] font-black uppercase tracking-[0.18em]")} style={{ color: p.active ? NEON.acc : NEON.mut }}>
              {p.label}
            </span>
          </div>
        ))}
      </div>

      {/* MY SQUAD: ステージカード（丸角 + ネオン枠） */}
      <div className="relative rounded-2xl p-4" style={{ background: NEON.panel, boxShadow: `inset 0 0 0 1px ${NEON.line}, 0 0 34px rgba(217,70,239,0.16)` }}>
        <div className="flex items-center justify-between">
          <span className={cn(nameOxanium.className, "text-[9px] font-black uppercase tracking-[0.24em]")} style={{ color: NEON.mut }}>
            My Squad
          </span>
          <span
            className={cn(nameOxanium.className, "rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.1em]")}
            style={{ background: "rgba(232,121,249,0.16)", color: NEON.acc, border: `1px solid ${NEON.line}` }}
          >
            Rank #{MY_SQUAD.rank}
          </span>
        </div>
        <div className="mt-2 flex items-end justify-between gap-3">
          <h4 className={cn(nameBebas.className, "text-[30px] leading-none tracking-[0.05em]")} style={{ color: NEON.ink, textShadow: "0 0 18px rgba(232,121,249,0.5)" }}>
            {MY_SQUAD.name}
          </h4>
          <div className="text-right">
            <div className={cn(nameBebas.className, "text-[32px] leading-none")} style={{ color: NEON.acc, textShadow: "0 0 18px rgba(232,121,249,0.7)" }}>
              {MY_SQUAD.avg}
            </div>
            <div className={cn(nameOxanium.className, "text-[9px] font-bold uppercase tracking-[0.16em]")} style={{ color: NEON.mut }}>
              avg pts <span style={{ color: NEON.acc2 }}>{MY_SQUAD.delta}</span>
            </div>
          </div>
        </div>

        {/* メンバー: ネオンリング・アバター列 */}
        <div className="mt-4 flex justify-between">
          {MY_SQUAD.members.map((m) => (
            <div key={m.name} className="flex flex-col items-center gap-1">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{
                  background: "rgba(15,8,28,0.9)",
                  border: `2px solid ${m.me ? NEON.acc : "rgba(217,70,239,0.3)"}`,
                  boxShadow: m.me ? `0 0 16px ${NEON.acc}` : "none",
                }}
              >
                <span className={cn(nameOxanium.className, "text-[13px] font-black")} style={{ color: m.me ? NEON.acc : NEON.ink }}>
                  {m.name[0]}
                </span>
              </div>
              <span className={cn(nameOxanium.className, "max-w-[52px] truncate text-[8px] font-bold uppercase")} style={{ color: m.me ? NEON.acc : NEON.mut }}>
                {m.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* リーダーボード: グロー順位 */}
      <div className="flex flex-col gap-1.5">
        <span className={cn(nameOxanium.className, "text-[9px] font-black uppercase tracking-[0.24em]")} style={{ color: NEON.mut }}>
          Leaderboard
        </span>
        {BOARD.map((row) => (
          <div
            key={row.rank}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{
              background: row.rank === 1 ? "linear-gradient(90deg, rgba(232,121,249,0.18), rgba(129,140,248,0.08))" : "rgba(217,70,239,0.05)",
              border: `1px solid ${row.rank === 1 ? NEON.line : NEON.lineSoft}`,
              boxShadow: row.rank === 1 ? "0 0 22px rgba(217,70,239,0.2)" : "none",
            }}
          >
            <span
              className={cn(nameBebas.className, "flex h-7 w-7 items-center justify-center rounded-full text-[16px] leading-none")}
              style={{
                background: row.rank === 1 ? `linear-gradient(135deg, ${NEON.acc}, ${NEON.acc2})` : "rgba(217,70,239,0.1)",
                color: row.rank === 1 ? "#1E0B2E" : NEON.mut,
              }}
            >
              {row.rank}
            </span>
            <span className={cn(nameOxanium.className, "min-w-0 flex-1 truncate text-[12px] font-black uppercase tracking-[0.06em]")} style={{ color: NEON.ink }}>
              {row.name}
            </span>
            <span className={cn(nameOxanium.className, "text-[10px] font-bold")} style={{ color: row.move > 0 ? NEON.acc : row.move < 0 ? "#6D5A85" : NEON.mut }}>
              {moveGlyph(row.move)}
            </span>
            <span className={cn(nameBebas.className, "text-[19px] leading-none tabular-nums")} style={{ color: NEON.ink }}>
              {row.avg}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex gap-2">
        <button
          type="button"
          className={cn(nameOxanium.className, "flex-1 rounded-full py-3 text-[12px] font-black uppercase tracking-[0.18em] transition hover:brightness-110")}
          style={{
            background: `linear-gradient(90deg, ${NEON.acc2}, ${NEON.acc})`,
            color: "#180827",
            boxShadow: "0 0 26px rgba(217,70,239,0.5)",
          }}
        >
          Battle Board
        </button>
        <button
          type="button"
          className={cn(nameOxanium.className, "flex-1 rounded-full py-3 text-[12px] font-black uppercase tracking-[0.18em] transition hover:bg-fuchsia-500/10")}
          style={{ border: `1px solid ${NEON.line}`, background: "transparent", color: NEON.acc }}
        >
          Invite Code
        </button>
      </div>
    </div>
  );
}

/* ============================================================
 * E. STEEL CIRCUIT — 無彩色スチール + 金1点
 *    計測室のミニマル。余白・タイポ階層・アクセントは首位と CTA のみ
 * ========================================================== */

const STEEL = {
  bg: "#101214",
  panel: "#16191C",
  line: "rgba(255,255,255,0.14)",
  lineSoft: "rgba(255,255,255,0.07)",
  ink: "#F4F6F8",
  mut: "#9AA4AD",
  acc: "#EAB308",
};

function SteelCircuitMock() {
  return (
    <div className="flex flex-col gap-5 px-5 py-6" style={{ background: STEEL.bg, color: STEEL.ink }}>
      {/* ヘッダー: タイポだけで語る */}
      <div className="flex items-end justify-between">
        <div>
          <h3 className={cn(nameOxanium.className, "text-[22px] font-black uppercase tracking-[0.04em]")} style={{ color: STEEL.ink }}>
            Squad Battle
          </h3>
          <p className={cn(jp.className, "mt-0.5 text-[11px] font-medium")} style={{ color: STEEL.mut }}>
            シーズン IV ・ 12日目 / 28日
          </p>
        </div>
        <div className="flex items-center gap-3">
          {PHASES.map((p) => (
            <span
              key={p.key}
              className={cn(nameOxanium.className, "border-b-2 pb-0.5 text-[10px] font-black uppercase tracking-[0.14em]")}
              style={{
                borderColor: p.active ? STEEL.acc : "transparent",
                color: p.active ? STEEL.ink : STEEL.mut,
              }}
            >
              {p.label}
            </span>
          ))}
        </div>
      </div>

      {/* MY SQUAD: 静かな計器盤 */}
      <div className="rounded-lg" style={{ background: STEEL.panel, boxShadow: `inset 0 0 0 1px ${STEEL.line}` }}>
        <div className="flex items-baseline justify-between px-4 pt-3.5">
          <h4 className={cn(nameOxanium.className, "text-[16px] font-black uppercase tracking-[0.05em]")} style={{ color: STEEL.ink }}>
            {MY_SQUAD.name}
          </h4>
          <span className={cn(jp.className, "text-[11px] font-semibold")} style={{ color: STEEL.mut }}>
            あなたのスクワッド
          </span>
        </div>
        <div className="flex items-end gap-6 px-4 pb-4 pt-2">
          <div>
            <div className={cn(nameBebas.className, "text-[44px] leading-none tabular-nums")} style={{ color: STEEL.ink }}>
              {MY_SQUAD.avg}
            </div>
            <div className={cn(nameOxanium.className, "mt-1 text-[9px] font-bold uppercase tracking-[0.2em]")} style={{ color: STEEL.mut }}>
              Avg Points
            </div>
          </div>
          <div className="pb-1.5">
            <div className={cn(nameBebas.className, "text-[24px] leading-none")} style={{ color: STEEL.ink }}>
              #{MY_SQUAD.rank}
            </div>
            <div className={cn(nameOxanium.className, "mt-1 text-[9px] font-bold uppercase tracking-[0.2em]")} style={{ color: STEEL.mut }}>
              Rank
            </div>
          </div>
          <div className="pb-1.5">
            <div className={cn(nameBebas.className, "text-[24px] leading-none")} style={{ color: STEEL.ink }}>
              {MY_SQUAD.delta}
            </div>
            <div className={cn(nameOxanium.className, "mt-1 text-[9px] font-bold uppercase tracking-[0.2em]")} style={{ color: STEEL.mut }}>
              Today
            </div>
          </div>
        </div>
        {/* メンバー: 静かな行 */}
        <div className="border-t px-4 py-2" style={{ borderColor: STEEL.lineSoft }}>
          {MY_SQUAD.members.map((m) => (
            <div key={m.name} className="flex items-center justify-between py-1">
              <span className={cn(nameOxanium.className, "text-[12px] font-bold")} style={{ color: STEEL.ink }}>
                {m.name}
                {m.me ? <span className={cn(jp.className, "ml-2 text-[10px] font-medium")} style={{ color: STEEL.acc }}>あなた</span> : null}
              </span>
              <span className={cn(nameRajdhani.className, "text-[13px] font-bold tabular-nums")} style={{ color: STEEL.mut }}>
                {m.points}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* リーダーボード: 首位だけ金 */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className={cn(nameOxanium.className, "text-[11px] font-black uppercase tracking-[0.1em]")} style={{ color: STEEL.ink }}>
            Leaderboard
          </span>
          <span className={cn(jp.className, "text-[10px]")} style={{ color: STEEL.mut }}>
            第2週
          </span>
        </div>
        <div className="overflow-hidden rounded-lg" style={{ boxShadow: `inset 0 0 0 1px ${STEEL.line}` }}>
          {BOARD.map((row, i) => (
            <div
              key={row.rank}
              className="flex items-center gap-3 px-3.5 py-2.5"
              style={{
                background: row.rank === 1 ? "rgba(234,179,8,0.07)" : STEEL.panel,
                borderTop: i > 0 ? `1px solid ${STEEL.lineSoft}` : "none",
              }}
            >
              <span
                className={cn(nameBebas.className, "w-6 text-center text-[20px] leading-none")}
                style={{ color: row.rank === 1 ? STEEL.acc : STEEL.mut }}
              >
                {row.rank}
              </span>
              <span className={cn(nameOxanium.className, "min-w-0 flex-1 truncate text-[12px] font-black uppercase tracking-[0.04em]")} style={{ color: STEEL.ink }}>
                {row.name}
              </span>
              <span className={cn(nameRajdhani.className, "text-[11px] font-bold")} style={{ color: STEEL.mut }}>
                {moveGlyph(row.move)}
              </span>
              <span className={cn(nameRajdhani.className, "text-[15px] font-bold tabular-nums")} style={{ color: STEEL.ink }}>
                {row.avg}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex gap-2.5">
        <button
          type="button"
          className={cn(nameOxanium.className, "flex-1 rounded-md py-3 text-[12px] font-black uppercase tracking-[0.14em] transition hover:brightness-110")}
          style={{ background: STEEL.acc, color: "#181203" }}
        >
          Battle Board
        </button>
        <button
          type="button"
          className={cn(nameOxanium.className, "flex-1 rounded-md py-3 text-[12px] font-black uppercase tracking-[0.14em] transition hover:bg-white/5")}
          style={{ boxShadow: `inset 0 0 0 1px ${STEEL.line}`, color: STEEL.ink, background: "transparent" }}
        >
          Invite Code
        </button>
      </div>
    </div>
  );
}

/* ============================================================
 * ページ本体
 * ========================================================== */

const MOCKS: Record<(typeof PATTERNS)[number]["id"], () => ReactNode> = {
  "gold-legion": () => <GoldLegionMock pal={GOLD} />,
  "cyan-command": () => <CyanCommandMock pal={CYAN} />,
  "gold-command": () => <CyanCommandMock pal={GOLD} />,
  "cyan-legion": () => <GoldLegionMock pal={CYAN} />,
  "crimson-protocol": CrimsonProtocolMock,
  "neon-clash": NeonClashMock,
  "steel-circuit": SteelCircuitMock,
};

export default function SquadBattleRedesignPreviewPage() {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#07090C] pb-24 text-white">
      {/* 切替ナビ */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07090C]/95 px-4 py-3 backdrop-blur">
        <h1 className={cn(nameOxanium.className, "text-[15px] font-black uppercase tracking-[0.08em]")}>
          Squad Battle — UI 刷新案
        </h1>
        <p className={cn(jp.className, "mt-0.5 text-[11px] text-white/55")}>
          A/B 純正 + F/G ハイブリッド（形×色の交差）ほか。タップで各案へ。
        </p>
        <nav className="mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
          {PATTERNS.map((p) => {
            const hybrid = p.id === "gold-command" || p.id === "cyan-legion";
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => scrollTo(p.id)}
                className={cn(
                  nameOxanium.className,
                  "shrink-0 rounded border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] transition",
                  hybrid
                    ? "border-amber-400/45 bg-amber-400/10 text-amber-100 hover:border-amber-300/60 hover:bg-amber-400/16"
                    : "border-white/15 bg-white/[0.04] text-white/80 hover:border-white/35 hover:bg-white/[0.08]"
                )}
              >
                {p.no}. {p.title}
              </button>
            );
          })}
        </nav>
      </header>

      {/* 各パターン */}
      <main className="mx-auto flex max-w-[430px] flex-col gap-10 px-3 pt-6">
        {PATTERNS.map((p) => {
          const Mock = MOCKS[p.id];
          return (
            <section
              key={p.id}
              ref={(el) => {
                sectionRefs.current[p.id] = el;
              }}
              className="scroll-mt-28"
            >
              <div className="mb-2.5 flex items-baseline gap-2 px-1">
                <span className={cn(nameBebas.className, "text-[26px] leading-none text-white/25")}>
                  {p.no}
                </span>
                <div>
                  <h2 className={cn(nameOxanium.className, "text-[14px] font-black uppercase tracking-[0.1em]")}>
                    {p.title}
                  </h2>
                  <p className={cn(jp.className, "text-[11px] text-white/55")}>{p.subtitle}</p>
                </div>
              </div>
              {/* 端末フレーム */}
              <div className="overflow-hidden rounded-2xl border border-white/12 shadow-[0_18px_50px_rgba(0,0,0,0.55)]">
                <Mock />
              </div>
            </section>
          );
        })}

        <p className={cn(jp.className, "px-2 text-center text-[11px] leading-relaxed text-white/45")}>
          気に入った案（または組み合わせ）を教えてください。
          選んだ方向で本実装（Web + Native）に展開します。
        </p>
      </main>
    </div>
  );
}
