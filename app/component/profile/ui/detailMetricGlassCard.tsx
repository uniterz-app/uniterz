"use client";

import type { CSSProperties } from "react";
import { nameRajdhani, summaryMetricNumClass } from "@/lib/fonts";

/** #RRGGBB → RGB（ガラスカードの発光・他コンポーネントの色計算用） */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

/** カード枠の発光用に2色の中間色 */
function avgHex(a: string, b: string): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  if (!A) return b;
  if (!B) return a;
  const r = (A.r + B.r) >> 1;
  const g = (A.g + B.g) >> 1;
  const bl = (A.b + B.b) >> 1;
  return `#${[r, g, bl].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/** 内訳ストリップ等：数値のネオン風スタイル（hex は #RRGGBB） */
export function cyberMetricValueStyle(
  hex: string,
  intensity: "full" | "soft" = "full"
): CSSProperties {
  const rgb = hexToRgb(hex);
  if (!rgb) return { color: hex };
  const { r, g, b } = rgb;
  if (intensity === "soft") {
    return {
      color: hex,
      opacity: 0.9,
      textShadow: [
        `0 0 6px rgba(${r},${g},${b},0.4)`,
        `0 0 14px rgba(${r},${g},${b},0.22)`,
        "0 1px 1px rgba(0,0,0,0.45)",
      ].join(", "),
    };
  }
  return {
    color: hex,
    textShadow: [
      `0 0 10px rgba(${r},${g},${b},0.58)`,
      `0 0 20px rgba(${r},${g},${b},0.38)`,
      `0 0 36px rgba(${r},${g},${b},0.22)`,
      "0 1px 2px rgba(0,0,0,0.55)",
    ].join(", "),
  };
}

/** 日別チャート内訳など：ガラス風カード＋ラベル横に数値 */
export function DetailMetricGlassCard({
  label,
  valueMain,
  unit,
  accentHex,
  fraction,
  /** sm 未満でラベル上・数値下（スコア精度など長いラベル向け） */
  valueBelowLabelNarrow = false,
  className,
}: {
  label: string;
  /** fraction 未指定時の表示値 */
  valueMain?: string;
  /** 件 / pts など（数値より一回り小さく） */
  unit?: string;
  /** 単一値時の色＋枠発光。fraction 指定時は unit の補助に使うことも可 */
  accentHex: string;
  /** 「分子/分母」で色分け（例: 的中=紫・投稿=橙） */
  fraction?: {
    numerator: string;
    denominator: string;
    numeratorHex: string;
    denominatorHex: string;
  };
  valueBelowLabelNarrow?: boolean;
  /** ルート div に追加（レイアウト親からの余白・角丸の上書き等） */
  className?: string;
}) {
  const glowHex = fraction
    ? avgHex(fraction.numeratorHex, fraction.denominatorHex)
    : accentHex;
  const rgb = hexToRgb(glowHex);
  const cardGlow =
    rgb != null
      ? ({
          boxShadow: [
            `inset 0 1px 0 rgba(255,255,255,0.09)`,
            `0 0 0 1px rgba(${rgb.r},${rgb.g},${rgb.b},0.12)`,
            `0 4px 18px rgba(0,0,0,0.38)`,
            `0 0 24px rgba(${rgb.r},${rgb.g},${rgb.b},0.08)`,
          ].join(", "),
        } satisfies CSSProperties)
      : undefined;

  const rootLayout = valueBelowLabelNarrow
    ? [
        "relative flex min-h-[50px] min-w-0 flex-col items-stretch justify-center gap-0.5 overflow-hidden rounded-xl px-2.5 py-2.5",
        "sm:min-h-[50px] sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:px-3 sm:py-3",
      ].join(" ")
    : [
        "relative flex min-h-[46px] min-w-0 items-center justify-between gap-1.5 overflow-hidden rounded-xl px-2.5 py-2.5",
        "sm:min-h-[50px] sm:gap-2 sm:px-3 sm:py-3",
      ].join(" ");

  return (
    <div
      className={[
        rootLayout,
        "border border-white/[0.12] bg-white/[0.055] backdrop-blur-md ring-1 ring-inset ring-white/[0.04]",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={cardGlow}
    >
      <div
        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent sm:inset-x-4"
        aria-hidden
      />
      <span
        className={[
          nameRajdhani.className,
          "min-w-0 shrink text-left text-[10px] font-semibold leading-tight tracking-wide text-slate-400 sm:text-[11px]",
        ].join(" ")}
      >
        {label}
      </span>
      <span
        className={[
          "inline-flex shrink-0 items-baseline justify-end gap-0.5 sm:gap-1",
          valueBelowLabelNarrow ? "self-end sm:self-auto" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {fraction ? (
          <span
            className={[
              summaryMetricNumClass,
              "inline-flex items-baseline gap-0.5 text-right leading-none",
              "text-[clamp(15px,4.2vw,19px)] sm:text-[19px]",
            ].join(" ")}
          >
            <span style={cyberMetricValueStyle(fraction.numeratorHex)}>
              {fraction.numerator}
            </span>
            <span
              className="translate-y-px text-white/40"
              style={{ textShadow: "0 1px 1px rgba(0,0,0,0.5)" }}
              aria-hidden
            >
              /
            </span>
            <span style={cyberMetricValueStyle(fraction.denominatorHex)}>
              {fraction.denominator}
            </span>
          </span>
        ) : (
          <span
            className={[
              summaryMetricNumClass,
              "text-right leading-none",
              "text-[clamp(15px,4.2vw,19px)] sm:text-[19px]",
            ].join(" ")}
            style={cyberMetricValueStyle(accentHex)}
          >
            {valueMain}
          </span>
        )}
        {unit != null && unit !== "" ? (
          <span
            className={[
              summaryMetricNumClass,
              "translate-y-px text-right leading-none",
              "text-[11px] sm:text-[12px]",
            ].join(" ")}
            style={cyberMetricValueStyle(
              fraction ? fraction.denominatorHex : accentHex,
              "soft"
            )}
          >
            {unit}
          </span>
        ) : null}
      </span>
    </div>
  );
}
