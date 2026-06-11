"use client";

/**
 * /dev/ranking-list-cyber-preview
 * サイバー / レトロウェーブ風ランキングリスト（本番未接続）
 *
 * 参考1: 斜めタブ・左アクセント・イタリック順位・シアン名・右 POWER スコア
 * 参考2: 名前直下の 10 分割セグメントバー（SCRAP/CLASS 等のサブテキストなし）
 */

import { useState } from "react";
import { nameBebas, nameOxanium, nameRajdhani } from "@/lib/fonts";
import { RankingsAvatarCircle } from "@/app/component/rankings/RankingsAvatarCircle";

const CYAN = "#00F5FF";
const MAGENTA = "#FF2BD6";
const LIME = "#B8FF3C";
const BG = "#06080F";

type TabKey = "global" | "local" | "faction";

type MockRow = {
  rank: number;
  handle: string;
  score: number;
  /** 0–100 → 10 セグメント */
  barPct: number;
  photoURL?: string | null;
};

const MOCK_ROWS: MockRow[] = [
  { rank: 1, handle: "SYNTAX_ERROR", score: 99842, barPct: 92, photoURL: null },
  { rank: 2, handle: "VOID_WALKER", score: 84201, barPct: 74, photoURL: null },
  { rank: 3, handle: "GHOST_KHAN", score: 72104, barPct: 58, photoURL: null },
  { rank: 4, handle: "NEON_DRIFT", score: 65440, barPct: 52, photoURL: null },
  { rank: 5, handle: "BYTE_RUNNER", score: 48920, barPct: 41, photoURL: null },
  { rank: 6, handle: "NULL_PTR", score: 31552, barPct: 28, photoURL: null },
];

const TABS: { key: TabKey; label: string }[] = [
  { key: "global", label: "GLOBAL_NET" },
  { key: "local", label: "LOCAL_NODE" },
  { key: "faction", label: "FACTION_WAR" },
];

const SEGMENTS = 10;

function filledSegCount(pct: number): number {
  return Math.round((Math.min(100, Math.max(0, pct)) / 100) * SEGMENTS);
}

/** 参考2 — 離散ブロック型 10 分割バー */
function CyberSegBar({
  pct,
  rank,
  filledColor,
  dimColor = "rgba(255,255,255,0.08)",
}: {
  pct: number;
  rank: number;
  filledColor: string;
  dimColor?: string;
}) {
  const filled = filledSegCount(pct);
  const glow =
    rank === 1
      ? `0 0 6px rgba(184,255,60,0.55)`
      : rank <= 3
        ? `0 0 4px rgba(184,255,60,0.35)`
        : "none";

  return (
    <div className="flex w-full max-w-[168px] gap-[3px]" role="presentation">
      {Array.from({ length: SEGMENTS }).map((_, i) => {
        const lit = i < filled;
        return (
          <div
            key={i}
            className="h-[5px] flex-1 rounded-[1px]"
            style={{
              background: lit ? filledColor : dimColor,
              boxShadow: lit ? glow : "none",
              border: lit
                ? `1px solid ${rank === 1 ? "rgba(184,255,60,0.45)" : "rgba(184,255,60,0.22)"}`
                : "1px solid rgba(255,255,255,0.04)",
            }}
          />
        );
      })}
    </div>
  );
}

function SlantedTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative shrink-0 px-5 py-2 transition-colors",
        nameOxanium.className,
      ].join(" ")}
      style={{
        transform: "skewX(-14deg)",
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.14em",
        color: active ? "#050508" : CYAN,
        background: active ? CYAN : "transparent",
        border: active ? "none" : `1px solid ${CYAN}`,
        boxShadow: active ? `0 0 18px rgba(0,245,255,0.45)` : "none",
      }}
    >
      <span style={{ display: "inline-block", transform: "skewX(14deg)" }}>
        {label}
      </span>
    </button>
  );
}

function RankNum({ rank }: { rank: number }) {
  const label = String(rank).padStart(2, "0");
  const isFirst = rank === 1;

  return (
    <span
      className={[nameBebas.className, "block tabular-nums leading-none"].join(" ")}
      style={{
        fontSize: rank <= 3 ? "2.65rem" : "2.35rem",
        transform: "skewX(-12deg)",
        display: "inline-block",
        color: isFirst ? "#FFFFFF" : "rgba(255,255,255,0.92)",
        WebkitTextStroke: isFirst
          ? `1.5px ${MAGENTA}`
          : "1px rgba(255,43,214,0.75)",
        paintOrder: "stroke fill",
        filter: isFirst
          ? `drop-shadow(0 0 2px ${MAGENTA}) drop-shadow(0 0 14px rgba(255,43,214,0.85)) drop-shadow(0 0 28px rgba(255,43,214,0.35))`
          : `drop-shadow(0 0 8px rgba(255,43,214,0.55)) drop-shadow(0 0 16px rgba(255,43,214,0.25))`,
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </span>
  );
}

function CyberRankingRow({ row }: { row: MockRow }) {
  const isFirst = row.rank === 1;
  const accentColor = isFirst ? CYAN : MAGENTA;
  const barFill = isFirst ? LIME : "rgba(184,255,60,0.72)";

  return (
    <article
      className="group relative flex min-h-[72px] items-stretch overflow-hidden"
      style={{
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 42%, rgba(0,0,0,0.12) 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* 左アクセントバー */}
      <span
        aria-hidden
        className="w-[3px] shrink-0"
        style={{
          background: accentColor,
          boxShadow: `0 0 12px ${isFirst ? "rgba(0,245,255,0.65)" : "rgba(255,43,214,0.55)"}`,
        }}
      />

      <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-4">
        {/* 順位 */}
        <div className="w-[52px] shrink-0 sm:w-[58px]">
          <RankNum rank={row.rank} />
        </div>

        {/* アバター（参考2寄り — スクエア枠） */}
        <div
          className="relative shrink-0 overflow-hidden rounded-sm"
          style={{
            width: 44,
            height: 44,
            border: isFirst
              ? `1px solid rgba(184,255,60,0.55)`
              : "1px solid rgba(255,255,255,0.12)",
            boxShadow: isFirst ? "0 0 12px rgba(184,255,60,0.2)" : "none",
          }}
        >
          <RankingsAvatarCircle
            photoURL={row.photoURL}
            displayName={row.handle}
            boxClassName="h-full w-full rounded-sm"
            gateReady
          />
          {isFirst ? (
            <span
              aria-hidden
              className={[
                "absolute right-0.5 top-0.5 text-[8px] font-bold leading-none",
                nameOxanium.className,
              ].join(" ")}
              style={{ color: LIME }}
            >
              +++
            </span>
          ) : null}
        </div>

        {/* 名前 + セグメントバー（サブテキストなし） */}
        <div className="min-w-0 flex-1">
          <div
            className={[
              "truncate font-bold uppercase tracking-[0.06em]",
              nameRajdhani.className,
            ].join(" ")}
            style={{
              color: CYAN,
              fontSize: "15px",
              textShadow: `0 0 12px rgba(0,245,255,0.35)`,
            }}
          >
            {row.handle}
          </div>
          <div className="mt-2">
            <CyberSegBar pct={row.barPct} rank={row.rank} filledColor={barFill} />
          </div>
        </div>

        {/* 右: スコア + POWER */}
        <div className="flex shrink-0 flex-col items-end justify-center pl-1">
          <span
            className={[nameRajdhani.className, "tabular-nums font-bold leading-none"].join(
              " "
            )}
            style={{
              color: "#F8FAFC",
              fontSize: "1.35rem",
              letterSpacing: "0.02em",
            }}
          >
            {row.score.toLocaleString("en-US")}
          </span>
          <span
            className={[
              "mt-1 font-bold uppercase tracking-[0.2em]",
              nameOxanium.className,
            ].join(" ")}
            style={{ color: MAGENTA, fontSize: "8px" }}
          >
            POWER
          </span>
        </div>
      </div>

      {/* 1位: 参考2のネオングリーン外枠を薄く */}
      {isFirst ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-none"
          style={{
            boxShadow: `inset 0 0 0 1px rgba(184,255,60,0.35)`,
          }}
        />
      ) : null}
    </article>
  );
}

export default function RankingListCyberPreviewPage() {
  const [tab, setTab] = useState<TabKey>("global");

  return (
    <div
      className="min-h-svh px-3 py-8 text-white sm:px-6"
      style={{ background: BG }}
    >
      <div className="mx-auto max-w-lg">
        <header className="mb-6 space-y-2">
          <p
            className={[
              "text-[10px] font-bold uppercase tracking-[0.28em]",
              nameOxanium.className,
            ].join(" ")}
            style={{ color: "rgba(0,245,255,0.65)" }}
          >
            Dev Preview · Cyber Ranking List
          </p>
          <h1 className="text-lg font-black tracking-tight">
            ランキングリスト — サイバー HUD 案
          </h1>
          <p className="text-xs leading-relaxed text-white/45">
            参考1の行レイアウト + 参考2のセグメントバー。名前下のサブテキストは省略。
            背景グリッドは意図的に省略。本番未接続。
          </p>
        </header>

        {/* 斜めタブ */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <SlantedTab
              key={t.key}
              label={t.label}
              active={tab === t.key}
              onClick={() => setTab(t.key)}
            />
          ))}
        </div>

        {/* リストパネル */}
        <div
          className="overflow-hidden rounded-sm"
          style={{
            border: "1px solid rgba(0,245,255,0.22)",
            boxShadow: "0 0 24px rgba(0,245,255,0.06)",
            background:
              "linear-gradient(180deg, rgba(12,16,28,0.95) 0%, rgba(6,8,15,0.98) 100%)",
          }}
        >
          <div
            className={[
              "flex items-center justify-between border-b px-4 py-2",
              nameOxanium.className,
            ].join(" ")}
            style={{
              borderColor: "rgba(255,255,255,0.08)",
              fontSize: "9px",
              letterSpacing: "0.22em",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            <span>RANK / OPERATOR</span>
            <span>POWER INDEX</span>
          </div>

          {MOCK_ROWS.map((row) => (
            <CyberRankingRow key={row.rank} row={row} />
          ))}
        </div>

        <footer className="mt-6 space-y-2 text-[11px] leading-relaxed text-white/35">
          <p>
            <strong className="text-white/55">参考1:</strong> 左アクセント（1位シアン /
            2位以降マゼンタ）、イタリック順位グロー、シアン名、右 POWER スコア
          </p>
          <p>
            <strong className="text-white/55">参考2:</strong> 名前直下の 10
            分割ブロックバー（1位はライム強調 + 外枠）
          </p>
        </footer>
      </div>
    </div>
  );
}
