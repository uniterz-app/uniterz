"use client";

/**
 * /dev/my-rank-card-v2
 * プレイヤーカードのブラッシュアップ3案（本番未接続のデザイン比較ページ）
 *
 * 案A: HUD PLATE   — 切り欠きフレーム + セグメントバー（計器盤）
 * 案B: DATA SLAB   — ヘアライン分割グリッド + ティックバー（データ密度最優先）
 * 案C: BROADCAST   — 斜めリボン + メーターバー（中継オーバーレイ風）
 */

import { useState } from "react";
import { Flame, Share2, TrendingUp } from "lucide-react";
import { jp, nameBebas, nameOxanium, summaryMetricNumClass } from "@/lib/fonts";
import { FLAG_SRC } from "@/lib/rankings/country";

const CYAN = "#22d3ee";
const CYAN_DIM = "rgba(34,211,238,0.55)";
const HAIRLINE = "rgba(34,211,238,0.16)";
const GOLD = "#FFD65A";

const MOCK = {
  handle: "RIKU_09",
  rank: 14,
  delta: 3,
  topPercent: "4.2",
  streak: 5,
  posts: 41,
  countryCode: "JP",
  metrics: [
    { key: "pts", label: "PTS", value: "1,284", pct: 82 },
    { key: "win", label: "WIN%", value: "68", pct: 68 },
    { key: "prec", label: "PREC", value: "312.0", pct: 74 },
    { key: "upset", label: "UPSET", value: "96.5", pct: 61 },
    { key: "streak", label: "STREAK", value: "5W", pct: 50 },
  ],
} as const;

/* ============================================================
 * 共通パーツ
 * ============================================================ */
function ShareButton({ size = 38 }: { size?: number }) {
  return (
    <button
      type="button"
      aria-label="share"
      className="flex shrink-0 items-center justify-center text-cyan-300 active:opacity-60"
      style={{
        width: size,
        height: size,
        border: `1px solid rgba(34,211,238,0.35)`,
        background: "rgba(34,211,238,0.08)",
      }}
    >
      <Share2 style={{ width: size * 0.42, height: size * 0.42 }} />
    </button>
  );
}

function FlagBack({ opacity = 0.09 }: { opacity?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <img
        src={FLAG_SRC[MOCK.countryCode]}
        alt=""
        className="absolute right-[-8%] top-1/2 h-[130%] -translate-y-1/2 object-contain"
        style={{
          opacity,
          maskImage:
            "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.7) 55%, black 100%)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.7) 55%, black 100%)",
        }}
        draggable={false}
      />
    </div>
  );
}

/** 微細スキャンライン（質感） */
function ScanTexture() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 3px)",
      }}
    />
  );
}

/* ============================================================
 * 案A: HUD PLATE — 切り欠きフレーム + セグメントバー
 * ============================================================ */
function SegBar({ pct }: { pct: number }) {
  const SEGS = 12;
  const filled = Math.round((pct / 100) * SEGS);
  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: SEGS }).map((_, i) => (
        <div
          key={i}
          className="h-[5px] flex-1"
          style={{
            background:
              i < filled
                ? `linear-gradient(180deg, #8CF0FF, ${CYAN})`
                : "rgba(255,255,255,0.09)",
            boxShadow: i < filled ? "0 0 5px rgba(34,211,238,0.5)" : "none",
            transform: "skewX(-12deg)",
          }}
        />
      ))}
    </div>
  );
}

const NOTCH = 14;
const CLIP = `polygon(0 0, calc(100% - ${NOTCH}px) 0, 100% ${NOTCH}px, 100% 100%, ${NOTCH}px 100%, 0 calc(100% - ${NOTCH}px))`;

function CardA() {
  return (
    <div className="w-full max-w-[400px]" style={{ filter: "drop-shadow(0 14px 30px rgba(0,0,0,0.45))" }}>
      {/* 外周ボーダー: clip-path はborderを切るので二重構造で描く */}
      <div style={{ clipPath: CLIP, background: "rgba(34,211,238,0.55)", padding: 1 }}>
        <div
          className="relative"
          style={{
            clipPath: CLIP,
            background:
              "linear-gradient(165deg, rgba(28,42,64,0.97) 0%, rgba(10,16,30,0.99) 55%, rgba(5,9,18,1) 100%)",
          }}
        >
          <FlagBack />
          <ScanTexture />

          {/* ヘッダーストリップ */}
          <div
            className="relative flex items-center justify-between px-3 py-2"
            style={{
              background: "rgba(34,211,238,0.07)",
              borderBottom: `1px solid ${HAIRLINE}`,
            }}
          >
            <div className="flex min-w-0 items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center text-[13px] font-black text-white/90"
                style={{
                  border: "1px solid rgba(34,211,238,0.45)",
                  background: "rgba(34,211,238,0.12)",
                }}
              >
                R
              </div>
              <div className="min-w-0">
                <div className={`${jp.className} truncate text-[14px] font-black leading-none text-white`}>
                  {MOCK.handle}
                </div>
                <div className={`${nameOxanium.className} mt-[3px] text-[8px] font-bold uppercase tracking-[0.24em] text-cyan-300/65`}>
                  WORLD CUP · MAIN
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`${nameOxanium.className} px-1.5 py-[3px] text-[10px] font-extrabold tracking-wide`}
                style={{ border: `1px solid rgba(255,214,90,0.4)`, color: GOLD, background: "rgba(255,214,90,0.07)" }}
              >
                TOP {MOCK.topPercent}%
              </span>
              <ShareButton size={32} />
            </div>
          </div>

          {/* メイン: 順位 + チップ */}
          <div className="relative flex items-end justify-between px-3 pb-1 pt-1">
            <div className="flex items-end gap-2">
              <span
                className={`${nameBebas.className} text-[64px] leading-[0.82]`}
                style={{
                  backgroundImage: "linear-gradient(180deg, #F2FEFF 0%, #9BEAF6 38%, #22d3ee 70%, #0E7490 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  textShadow: "0 0 30px rgba(34,211,238,0.2)",
                }}
              >
                {MOCK.rank}
              </span>
              <div className="mb-1 flex flex-col gap-[3px]">
                <span className={`${nameOxanium.className} text-[8px] font-bold uppercase tracking-[0.24em] text-white/40`}>
                  RANK
                </span>
                <span className={`${nameOxanium.className} flex items-center gap-0.5 text-[13px] font-extrabold leading-none text-emerald-400`}>
                  <TrendingUp className="h-3.5 w-3.5" />+{MOCK.delta}
                </span>
              </div>
            </div>
            <div className="mb-1 flex items-center gap-2">
              <span className={`${nameOxanium.className} flex items-center gap-0.5 text-[13px] font-bold text-orange-400`}>
                <Flame className="h-3.5 w-3.5" />
                {MOCK.streak}W
              </span>
              <span className={`${nameOxanium.className} text-[10px] font-semibold text-white/35`}>
                POSTS {MOCK.posts}
              </span>
            </div>
          </div>

          {/* メトリクス: 5列 + セグメントバー */}
          <div
            className="relative grid grid-cols-5 px-3 pb-3 pt-2"
            style={{ borderTop: `1px solid ${HAIRLINE}` }}
          >
            {MOCK.metrics.map((mt, i) => (
              <div key={mt.key} className={i > 0 ? "pl-2" : ""} style={i > 0 ? { borderLeft: "1px solid rgba(255,255,255,0.07)" } : undefined}>
                <div className={`${nameOxanium.className} text-[7.5px] font-bold uppercase tracking-[0.16em] text-cyan-300/55`}>
                  {mt.label}
                </div>
                <div className={`${summaryMetricNumClass} mt-[3px] text-[15px] leading-none text-white`}>
                  {mt.value}
                </div>
                <div className="mt-1.5 pr-1">
                  <SegBar pct={mt.pct} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * 案B: DATA SLAB — ヘアライン分割グリッド + ティックバー
 * ============================================================ */
function TickBar({ pct }: { pct: number }) {
  return (
    <div className="relative h-[4px] w-full" style={{ background: "rgba(255,255,255,0.08)" }}>
      <div
        className="absolute inset-y-0 left-0"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, rgba(34,211,238,0.45), ${CYAN})`,
          boxShadow: "0 0 7px rgba(34,211,238,0.55)",
        }}
      />
      {/* 25% ごとの目盛 */}
      {[25, 50, 75].map((p) => (
        <div key={p} className="absolute inset-y-[-2px]" style={{ left: `${p}%`, width: 1, background: "rgba(8,14,26,0.9)" }} />
      ))}
      {/* ピークマーカー */}
      <div
        className="absolute top-[-3px] h-[10px] w-[2px]"
        style={{ left: `calc(${pct}% - 1px)`, background: "#BFF6FF", boxShadow: "0 0 6px rgba(140,240,255,0.9)" }}
      />
    </div>
  );
}

function CardB() {
  const cells = MOCK.metrics.slice(0, 4);
  return (
    <div
      className="relative w-full max-w-[400px] overflow-hidden"
      style={{
        border: "1px solid rgba(34,211,238,0.5)",
        boxShadow:
          "0 14px 32px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(8,14,26,0.9), inset 0 0 24px rgba(34,211,238,0.05)",
        background: "linear-gradient(170deg, rgba(22,34,54,0.98) 0%, rgba(7,12,24,1) 60%)",
      }}
    >
      <FlagBack opacity={0.07} />
      <ScanTexture />
      {/* 左上の斜めストライプ装飾 */}
      <div
        className="pointer-events-none absolute left-0 top-0 h-[44px] w-[44px]"
        style={{
          background: `repeating-linear-gradient(135deg, ${CYAN_DIM} 0 2px, transparent 2px 6px)`,
          maskImage: "linear-gradient(135deg, black 0%, transparent 62%)",
          WebkitMaskImage: "linear-gradient(135deg, black 0%, transparent 62%)",
          opacity: 0.5,
        }}
      />

      <div className="relative grid grid-cols-[122px_1fr]">
        {/* 左セル: 順位の塔 */}
        <div
          className="flex flex-col items-center justify-between px-2 pb-2 pt-2.5"
          style={{ borderRight: `1px solid ${HAIRLINE}`, background: "rgba(34,211,238,0.045)" }}
        >
          <span className={`${nameOxanium.className} self-stretch text-center text-[8px] font-bold uppercase tracking-[0.3em] text-cyan-300/60`}>
            YOUR RANK
          </span>
          <span
            className={`${nameBebas.className} text-[74px] leading-[0.84]`}
            style={{
              backgroundImage: "linear-gradient(180deg, #F2FEFF 0%, #9BEAF6 38%, #22d3ee 72%, #0E7490 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              textShadow: "0 0 34px rgba(34,211,238,0.22)",
            }}
          >
            {MOCK.rank}
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`${nameOxanium.className} flex items-center gap-0.5 text-[12px] font-extrabold text-emerald-400`}>
              <TrendingUp className="h-3 w-3" />+{MOCK.delta}
            </span>
            <span
              className={`${nameOxanium.className} px-1 py-[2px] text-[9px] font-extrabold`}
              style={{ border: "1px solid rgba(255,214,90,0.4)", color: GOLD }}
            >
              TOP {MOCK.topPercent}%
            </span>
          </div>
        </div>

        {/* 右: ヘッダー行 + 2x2 メトリクスセル */}
        <div className="flex flex-col">
          <div
            className="flex items-center justify-between gap-2 px-2.5 py-1.5"
            style={{ borderBottom: `1px solid ${HAIRLINE}` }}
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center text-[11px] font-black text-white/90"
                style={{ border: "1px solid rgba(34,211,238,0.45)", background: "rgba(34,211,238,0.12)" }}
              >
                R
              </div>
              <div className="min-w-0">
                <div className={`${jp.className} truncate text-[13px] font-black leading-none text-white`}>
                  {MOCK.handle}
                </div>
                <div className={`${nameOxanium.className} mt-[2px] flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.18em] text-cyan-300/60`}>
                  WC MAIN
                  <span className="flex items-center gap-0.5 normal-nums text-orange-400">
                    <Flame className="h-2.5 w-2.5" />
                    {MOCK.streak}W
                  </span>
                </div>
              </div>
            </div>
            <ShareButton size={30} />
          </div>

          <div className="grid flex-1 grid-cols-2">
            {cells.map((mt, i) => (
              <div
                key={mt.key}
                className="flex flex-col justify-center px-2.5 py-1.5"
                style={{
                  borderRight: i % 2 === 0 ? `1px solid ${HAIRLINE}` : undefined,
                  borderBottom: i < 2 ? `1px solid ${HAIRLINE}` : undefined,
                }}
              >
                <div className="flex items-baseline justify-between">
                  <span className={`${nameOxanium.className} text-[7.5px] font-bold uppercase tracking-[0.18em] text-cyan-300/55`}>
                    {mt.label}
                  </span>
                  <span className={`${summaryMetricNumClass} text-[16px] leading-none text-white`}>
                    {mt.value}
                  </span>
                </div>
                <div className="mt-1.5">
                  <TickBar pct={mt.pct} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 下部シリアル帯 */}
      <div
        className="relative flex items-center justify-between px-2.5 py-[5px]"
        style={{ borderTop: `1px solid ${HAIRLINE}`, background: "rgba(0,0,0,0.25)" }}
      >
        <span className={`${nameOxanium.className} text-[8px] font-semibold uppercase tracking-[0.26em] text-white/30`}>
          UNITERZ · SEASON 2026
        </span>
        <span className={`${nameOxanium.className} text-[8px] font-semibold uppercase tracking-[0.26em] text-white/30`}>
          POSTS {MOCK.posts} / ID 8821
        </span>
      </div>
    </div>
  );
}

/* ============================================================
 * 案C: BROADCAST — 斜めリボン + メーターバー
 * ============================================================ */
function MeterBar({ pct }: { pct: number }) {
  return (
    <div
      className="relative h-[6px] w-full overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.07)",
        clipPath: "polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%)",
      }}
    >
      <div
        className="absolute inset-y-0 left-0"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, #0E7490, ${CYAN} 70%, #BFF6FF)`,
          boxShadow: "0 0 9px rgba(34,211,238,0.6)",
        }}
      />
    </div>
  );
}

function CardC() {
  return (
    <div
      className="relative w-full max-w-[400px] overflow-hidden"
      style={{
        border: "1px solid rgba(34,211,238,0.42)",
        background: "linear-gradient(160deg, rgba(20,32,52,0.98) 0%, rgba(6,10,22,1) 58%)",
        boxShadow: "0 14px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.14)",
      }}
    >
      <FlagBack />
      <ScanTexture />

      {/* 斜めリボン: RANK */}
      <div className="relative flex items-stretch">
        <div
          className="relative flex items-center gap-2 py-1.5 pl-3 pr-6"
          style={{
            background: `linear-gradient(110deg, rgba(34,211,238,0.22), rgba(34,211,238,0.06))`,
            clipPath: "polygon(0 0, 100% 0, calc(100% - 16px) 100%, 0 100%)",
            borderBottom: `1px solid rgba(34,211,238,0.35)`,
          }}
        >
          <span className={`${nameBebas.className} text-[40px] leading-[0.85]`} style={{ color: "#EFFEFF", textShadow: "0 0 22px rgba(34,211,238,0.5)" }}>
            #{MOCK.rank}
          </span>
          <div className="flex flex-col">
            <span className={`${nameOxanium.className} text-[8px] font-bold uppercase tracking-[0.22em] text-cyan-200/75`}>
              YOUR RANK
            </span>
            <span className={`${nameOxanium.className} flex items-center gap-1 text-[12px] font-extrabold leading-none text-emerald-400`}>
              <TrendingUp className="h-3 w-3" />+{MOCK.delta}
              <span className="font-bold text-white/30">·</span>
              <span style={{ color: GOLD }}>TOP {MOCK.topPercent}%</span>
            </span>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2 pr-2.5">
          <div className="min-w-0 text-right">
            <div className={`${jp.className} truncate text-[13px] font-black leading-none text-white`}>{MOCK.handle}</div>
            <div className={`${nameOxanium.className} mt-[3px] flex items-center justify-end gap-1 text-[8px] font-bold uppercase tracking-[0.2em] text-cyan-300/60`}>
              WC MAIN
              <span className="flex items-center gap-0.5 text-orange-400">
                <Flame className="h-2.5 w-2.5" />
                {MOCK.streak}W
              </span>
            </div>
          </div>
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center text-[12px] font-black text-white/90"
            style={{ border: "1px solid rgba(34,211,238,0.45)", background: "rgba(34,211,238,0.12)" }}
          >
            R
          </div>
          <ShareButton size={32} />
        </div>
      </div>

      {/* メトリクス: 横帯（縦罫線区切り、数字大） */}
      <div className="relative grid grid-cols-5 px-2.5 pb-2.5 pt-2">
        {MOCK.metrics.map((mt, i) => (
          <div key={mt.key} className="flex flex-col gap-1 px-1.5" style={i > 0 ? { borderLeft: "1px solid rgba(255,255,255,0.08)" } : undefined}>
            <span className={`${nameOxanium.className} text-[7.5px] font-bold uppercase tracking-[0.14em] text-white/40`}>
              {mt.label}
            </span>
            <span className={`${summaryMetricNumClass} text-[15px] leading-none text-white`}>{mt.value}</span>
            <MeterBar pct={mt.pct} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * ページ
 * ============================================================ */
function Section({
  tag,
  title,
  points,
  children,
}: {
  tag: string;
  title: string;
  points: string[];
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-white/10 px-4 py-7">
      <div className="mx-auto max-w-[480px]">
        <div className="flex items-baseline gap-2.5">
          <span className={`${nameBebas.className} text-[26px] leading-none text-cyan-400/80`}>{tag}</span>
          <h2 className={`${jp.className} text-[16px] font-black text-white/95`}>{title}</h2>
        </div>
        <ul className={`${jp.className} mt-1.5 space-y-0.5 text-[11.5px] leading-relaxed text-white/50`}>
          {points.map((p) => (
            <li key={p}>・{p}</li>
          ))}
        </ul>
        <div className="mt-4 flex justify-center">{children}</div>
      </div>
    </section>
  );
}

export default function MyRankCardV2Preview() {
  const [dark, setDark] = useState(true);
  return (
    <main
      className="min-h-screen pb-24 text-white"
      style={{
        background: dark
          ? "radial-gradient(120% 80% at 50% 0%, #0c1626 0%, #070b14 55%, #05080f 100%)"
          : "#101b2e",
      }}
    >
      <header className="px-4 pb-1 pt-9 text-center">
        <div className={`${nameOxanium.className} text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400/70`}>
          Player Card — Brush-up v2
        </div>
        <h1 className={`${jp.className} mt-2 text-[20px] font-black`}>プレイヤーカード改良 3案</h1>
        <p className={`${jp.className} mt-1 text-[12px] text-white/45`}>
          共通: 余白圧縮 / 硬いエッジ / 5メトリクス（PTS・WIN%・PREC・UPSET・STREAK）
        </p>
        <label className={`${jp.className} mt-2 inline-flex items-center gap-1.5 text-[11px] text-white/40`}>
          <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} className="h-3.5 w-3.5 accent-cyan-400" />
          実際の背景色
        </label>
      </header>

      <Section
        tag="A"
        title="HUD PLATE — 切り欠き + セグメントバー"
        points={[
          "対角の切り欠き（clip-path）で「装甲板」感。縁は1pxシアンの二重構造",
          "バーは12分割セグメント（skew付き）— ゲームのHUDで最も「読める」形式",
          "ヘッダーをストリップ化して情報を上に圧縮、無駄余白なし",
        ]}
      >
        <CardA />
      </Section>

      <Section
        tag="B"
        title="DATA SLAB — 分割グリッド + ティックバー"
        points={[
          "カード全体をヘアラインで区画割り — 計器パネルのような硬さと密度",
          "順位は左の「塔」に隔離して最大サイズ、メトリクスは2×2セル",
          "バーに25%目盛 + ピークマーカー。下部にシリアル帯（シェア映え要素）",
        ]}
      >
        <CardB />
      </Section>

      <Section
        tag="C"
        title="BROADCAST — 斜めリボン + メーター"
        points={[
          "順位を斜めカットのリボンに載せる中継オーバーレイ風 — 最もコンパクト（高さ最小）",
          "メトリクス5列を1行に、数字を大きく・ラベルは極小に",
          "バーは平行四辺形カットのメーター。スピード感重視",
        ]}
      >
        <CardC />
      </Section>
    </main>
  );
}
