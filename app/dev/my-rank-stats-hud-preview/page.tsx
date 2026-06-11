"use client";

/**
 * /dev/my-rank-stats-hud-preview
 * MyRankCard 右側 2×2 スタッツ — サイバー HUD 案（本番未接続）
 *
 * 参考: 左アクセントバー + 10 分割セグメント + フッターメタデータ
 */

import { useState } from "react";
import { nameBebas, nameOxanium, summaryMetricNumClass } from "@/lib/fonts";
import { dateKeyJST } from "@/lib/rankings/rankSnapshotDate";

type HudMetricKey =
  | "totalScore"
  | "winRate"
  | "marginPrecision"
  | "upsetScore";

type HudMetric = {
  key: HudMetricKey;
  code: string;
  value: string;
  dayDelta?: string | null;
  /** 0–100 → 10 セグメント */
  pct: number;
};

type HudPalette = {
  label: string;
  value: string;
  accent: string;
  accentDim: string;
  glow: string;
};

const MOCK_METRICS: HudMetric[] = [
  {
    key: "totalScore",
    code: "TOT_SCORE",
    value: "1,284",
    dayDelta: "+12",
    pct: 82,
  },
  {
    key: "winRate",
    code: "WIN_RATIO",
    value: "68%",
    dayDelta: "+2",
    pct: 68,
  },
  {
    key: "marginPrecision",
    code: "SCO_PREC",
    value: "312.0",
    dayDelta: "+4.9",
    pct: 74,
  },
  {
    key: "upsetScore",
    code: "UPSET_VAL",
    value: "96.5",
    dayDelta: "-1.2",
    pct: 61,
  },
];

const PALETTE_REFERENCE: Record<HudMetricKey, HudPalette> = {
  totalScore: {
    label: "#8a9aa8",
    value: "#f4f8fb",
    accent: "#b8ff3c",
    accentDim: "rgba(184,255,60,0.35)",
    glow: "rgba(184,255,60,0.55)",
  },
  winRate: {
    label: "#8a9aa8",
    value: "#f4f8fb",
    accent: "#b8ff3c",
    accentDim: "rgba(184,255,60,0.35)",
    glow: "rgba(184,255,60,0.55)",
  },
  marginPrecision: {
    label: "#8a9aa8",
    value: "#f4f8fb",
    accent: "#b8ff3c",
    accentDim: "rgba(184,255,60,0.35)",
    glow: "rgba(184,255,60,0.55)",
  },
  upsetScore: {
    label: "#8a9aa8",
    value: "#f472ff",
    accent: "#ff3df0",
    accentDim: "rgba(255,61,240,0.35)",
    glow: "rgba(255,61,240,0.6)",
  },
};

const PALETTE_UNITERZ: Record<HudMetricKey, HudPalette> = {
  totalScore: {
    label: "rgba(34,211,238,0.55)",
    value: "#ecfeff",
    accent: "#22d3ee",
    accentDim: "rgba(34,211,238,0.28)",
    glow: "rgba(34,211,238,0.55)",
  },
  winRate: {
    label: "rgba(74,222,128,0.55)",
    value: "#ecfdf5",
    accent: "#4ade80",
    accentDim: "rgba(74,222,128,0.28)",
    glow: "rgba(74,222,128,0.5)",
  },
  marginPrecision: {
    label: "rgba(196,181,253,0.55)",
    value: "#f5f3ff",
    accent: "#a78bfa",
    accentDim: "rgba(167,139,250,0.28)",
    glow: "rgba(167,139,250,0.5)",
  },
  upsetScore: {
    label: "rgba(251,146,60,0.55)",
    value: "#fff7ed",
    accent: "#fb923c",
    accentDim: "rgba(251,146,60,0.28)",
    glow: "rgba(251,146,60,0.55)",
  },
};

const SEGMENTS = 10;

function filledSegments(pct: number): number {
  return Math.round((Math.min(100, Math.max(0, pct)) / 100) * SEGMENTS);
}

function HudSegmentBar({
  filled,
  accent,
  glow,
  accentDim,
}: {
  filled: number;
  accent: string;
  glow: string;
  accentDim: string;
}) {
  return (
    <div className="flex gap-[3px]" role="presentation">
      {Array.from({ length: SEGMENTS }).map((_, i) => {
        const lit = i < filled;
        return (
          <div
            key={i}
            className="h-[6px] flex-1 rounded-[1px]"
            style={{
              background: lit ? accent : "rgba(255,255,255,0.07)",
              boxShadow: lit ? `0 0 6px ${glow}` : "none",
              border: lit ? `1px solid ${accentDim}` : "1px solid rgba(255,255,255,0.04)",
            }}
          />
        );
      })}
    </div>
  );
}

function HudStatCell({
  metric,
  palette,
  selected,
  onSelect,
}: {
  metric: HudMetric;
  palette: HudPalette;
  selected: boolean;
  onSelect?: () => void;
}) {
  const filled = filledSegments(metric.pct);
  const delta = metric.dayDelta;
  const deltaPositive = delta?.startsWith("+");
  const deltaNegative = delta?.startsWith("-");

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "group relative flex w-full flex-col gap-2 px-3 py-3 text-left transition-colors",
        selected ? "bg-white/[0.04]" : "bg-transparent hover:bg-white/[0.02]",
      ].join(" ")}
      style={{
        outline: selected ? `1px solid ${palette.accentDim}` : undefined,
        boxShadow: selected ? `inset 0 0 20px ${palette.accentDim}` : undefined,
      }}
    >
      <span
        aria-hidden
        className="absolute bottom-2 left-0 top-2 w-[2px] rounded-full"
        style={{
          background: palette.accent,
          boxShadow: `0 0 8px ${palette.glow}`,
        }}
      />

      <span
        className={["pl-2 font-semibold uppercase tracking-[0.14em]", nameOxanium.className].join(
          " "
        )}
        style={{ color: palette.label, fontSize: "8.5px" }}
      >
        {metric.code}
      </span>

      <div className="flex items-baseline gap-1.5 pl-2">
        <span
          className={[summaryMetricNumClass, "leading-none tabular-nums"].join(" ")}
          style={{ color: palette.value, fontSize: "1.35rem" }}
        >
          {metric.value}
        </span>
        {delta ? (
          <span
            className={["font-bold tabular-nums leading-none", nameOxanium.className].join(" ")}
            style={{
              fontSize: "10px",
              color: deltaNegative
                ? "rgba(255,255,255,0.42)"
                : deltaPositive
                  ? palette.accent
                  : "rgba(255,255,255,0.5)",
            }}
          >
            {delta}
          </span>
        ) : null}
      </div>

      <div className="pl-2">
        <HudSegmentBar
          filled={filled}
          accent={palette.accent}
          glow={palette.glow}
          accentDim={palette.accentDim}
        />
      </div>
    </button>
  );
}

function HudFooter({
  accent,
  dateKey,
  uid = "UID-8842-X",
}: {
  accent: string;
  dateKey: string;
  uid?: string;
}) {
  const cols = [
    { k: "LEAGUE_ID", v: "NBA_PLAYOFFS" },
    { k: "SNAPSHOT", v: dateKey },
    { k: "SYNC", v: "LIVE_V3" },
  ] as const;

  return (
    <div
      className="relative border-t border-white/10 px-3 py-2.5"
      style={{ background: "rgba(0,0,0,0.22)" }}
    >
      <div className="grid grid-cols-3 gap-2">
        {cols.map((c) => (
          <div key={c.k} className="min-w-0">
            <div
              className={["truncate font-semibold uppercase tracking-[0.12em]", nameOxanium.className].join(
                " "
              )}
              style={{ color: accent, fontSize: "7px" }}
            >
              {c.k}
            </div>
            <div
              className={["mt-0.5 truncate font-medium tabular-nums text-white/75", nameOxanium.className].join(
                " "
              )}
              style={{ fontSize: "8px" }}
            >
              {c.v}
            </div>
          </div>
        ))}
      </div>
      <span
        className={["absolute bottom-2 right-3 font-semibold tracking-wider", nameOxanium.className].join(
          " "
        )}
        style={{ color: accent, fontSize: "7px", opacity: 0.85 }}
      >
        {uid}
      </span>
    </div>
  );
}

function HudStatsPanel({
  variant,
  selectedKey,
  onSelectKey,
  showFooter = true,
}: {
  variant: "reference" | "uniterz";
  selectedKey: HudMetricKey;
  onSelectKey: (k: HudMetricKey) => void;
  showFooter?: boolean;
}) {
  const palettes = variant === "reference" ? PALETTE_REFERENCE : PALETTE_UNITERZ;
  const footerAccent =
    variant === "reference" ? PALETTE_REFERENCE.totalScore.accent : "#22d3ee";
  const dateKey = dateKeyJST();

  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-[10px] border border-white/12 bg-[#0a1018]/90">
      <div className="grid grid-cols-2 divide-x divide-y divide-white/10">
        {MOCK_METRICS.map((m) => (
          <HudStatCell
            key={m.key}
            metric={m}
            palette={palettes[m.key]}
            selected={selectedKey === m.key}
            onSelect={() => onSelectKey(m.key)}
          />
        ))}
      </div>
      {showFooter ? <HudFooter accent={footerAccent} dateKey={dateKey} /> : null}
    </div>
  );
}

function MockRankTower() {
  return (
    <div
      className="flex flex-col items-center justify-between px-2 py-3"
      style={{
        borderRight: "1px solid rgba(255,255,255,0.1)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
        minWidth: 96,
      }}
    >
      <span
        className={["text-center font-bold uppercase tracking-[0.2em] text-white/45", nameOxanium.className].join(
          " "
        )}
        style={{ fontSize: "9px" }}
      >
        YOUR RANK
      </span>
      <span
        className={[nameBebas.className, "leading-none"].join(" ")}
        style={{
          fontSize: "3.25rem",
          backgroundImage:
            "linear-gradient(180deg, #F2FEFF 0%, #9BEAF6 38%, #22d3ee 72%, #0E7490 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          textShadow: "0 0 30px rgba(34,211,238,0.25)",
        }}
      >
        14
      </span>
      <span
        className={["font-medium tabular-nums text-white/35", nameOxanium.className].join(" ")}
        style={{ fontSize: "9px" }}
      >
        / 12,480
      </span>
      <span
        className={["rounded px-1.5 py-0.5 font-bold", nameOxanium.className].join(" ")}
        style={{
          fontSize: "9px",
          color: "#FFD65A",
          background: "rgba(255,214,90,0.08)",
        }}
      >
        TOP 4.2%
      </span>
    </div>
  );
}

function MockCardShell({
  variant,
  label,
  subtitle,
}: {
  variant: "reference" | "uniterz";
  label: string;
  subtitle: string;
}) {
  const [selectedKey, setSelectedKey] = useState<HudMetricKey>("totalScore");

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-bold text-white/90">{label}</h2>
        <p className="mt-0.5 text-xs text-white/45">{subtitle}</p>
      </div>

      <div
        className="overflow-hidden rounded-[12px] border border-white/16 backdrop-blur-xl"
        style={{
          background:
            "linear-gradient(148deg, rgba(255,255,255,0.08) 0%, rgba(8,16,32,0.72) 100%)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
        }}
      >
        <div className="flex items-stretch border-b border-white/10 px-2.5 py-2">
          <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-cyan-400/30 to-cyan-900/40 ring-1 ring-white/20" />
          <div className="ml-2 min-w-0 flex-1">
            <div className="truncate text-sm font-black text-white">RIKU_09</div>
            <div
              className={["mt-0.5 text-[8px] font-bold uppercase tracking-[0.18em] text-cyan-300/55", nameOxanium.className].join(
                " "
              )}
            >
              NBA · POSTS 41
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[96px_1fr]">
          <MockRankTower />
          <HudStatsPanel
            variant={variant}
            selectedKey={selectedKey}
            onSelectKey={setSelectedKey}
          />
        </div>
      </div>
    </div>
  );
}

function CurrentStatsMock() {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-bold text-white/90">現状（参考）</h2>
        <p className="mt-0.5 text-xs text-white/45">いまの MyRankCard 右側イメージ</p>
      </div>
      <div
        className="overflow-hidden rounded-[12px] border border-white/16 p-3"
        style={{ background: "rgba(8,16,32,0.75)" }}
      >
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-white/10">
          {MOCK_METRICS.map((m) => (
            <div key={m.key} className="bg-[#0c1420] px-2.5 py-2">
              <div className="text-[7.5px] font-bold uppercase tracking-[0.18em] text-cyan-300/55">
                {m.key === "totalScore"
                  ? "PTS"
                  : m.key === "winRate"
                    ? "WIN%"
                    : m.key === "marginPrecision"
                      ? "PREC"
                      : "UPSET"}
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-[15px] font-bold text-white">{m.value}</span>
                {m.dayDelta ? (
                  <span className="text-[9px] font-extrabold text-[#FFD65A]">{m.dayDelta}</span>
                ) : null}
              </div>
              <div className="mt-1.5 flex h-[5px] gap-[2px]">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-[1px]"
                    style={{
                      background:
                        i < Math.round((m.pct / 100) * 12)
                          ? "linear-gradient(180deg, #8CF0FF, #0891b2)"
                          : "rgba(255,255,255,0.09)",
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MyRankStatsHudPreviewPage() {
  const [panelVariant, setPanelVariant] = useState<"reference" | "uniterz">(
    "reference"
  );
  const [selectedKey, setSelectedKey] = useState<HudMetricKey>("totalScore");

  return (
    <div
      className="min-h-svh px-4 py-8 text-white"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34,211,238,0.08) 0%, transparent 55%), #060b12",
      }}
    >
      <div className="mx-auto max-w-lg space-y-8">
        <header className="space-y-2">
          <p
            className={["text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-400/70", nameOxanium.className].join(
              " "
            )}
          >
            Dev Preview · MyRank Stats HUD
          </p>
          <h1 className="text-xl font-black leading-tight text-white">
            右側スタッツ — サイバー HUD 案
          </h1>
          <p className="text-sm leading-relaxed text-white/50">
            参考画像寄せの 2×2 パネル。左の縦アクセント・10
            分割バー・フッターメタデータ。数値横に前日比（+8.7 等）を小さく表示。
            本番 MyRankCard には未接続。
          </p>
        </header>

        <section className="space-y-3">
          <div className="flex gap-2">
            {(
              [
                { id: "reference" as const, label: "案A — 参考寄せ" },
                { id: "uniterz" as const, label: "案B — Uniterz 色" },
              ] as const
            ).map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setPanelVariant(v.id)}
                className={[
                  "rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors",
                  panelVariant === v.id
                    ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-200"
                    : "border-white/15 bg-white/5 text-white/55 hover:text-white/80",
                ].join(" ")}
              >
                {v.label}
              </button>
            ))}
          </div>

          <HudStatsPanel
            variant={panelVariant}
            selectedKey={selectedKey}
            onSelectKey={setSelectedKey}
          />
          <p className="text-[11px] text-white/40">
            タップで選択中メトリクスを切替（本番ではランキングタブと連動想定）
          </p>
        </section>

        <section className="space-y-4 border-t border-white/10 pt-6">
          <h2 className="text-sm font-bold text-white/80">カード全体での配置イメージ</h2>
          <MockCardShell
            variant="reference"
            label="案A — 参考寄せ × 順位タワー"
            subtitle="ライム + マゼンタ（UPSET のみ）。参考画像に最も近い。"
          />
          <MockCardShell
            variant="uniterz"
            label="案B — Uniterz ブランド色"
            subtitle="シアン / 緑 / 紫 / オレンジ。既存ランキングの指標色と整合。"
          />
        </section>

        <section className="border-t border-white/10 pt-6">
          <CurrentStatsMock />
        </section>

        <footer className="border-t border-white/10 pt-4 text-[11px] leading-relaxed text-white/35">
          <p>
            実装時は <code className="text-cyan-300/70">MyRankCard</code>{" "}
            の右カラムだけ差し替え可能。順位タワー・ヘッダーは現状維持のまま統合できます。
          </p>
        </footer>
      </div>
    </div>
  );
}
