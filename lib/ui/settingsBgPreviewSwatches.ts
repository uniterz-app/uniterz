/**
 * 設定画面（SETTINGS）背景プレビュー用スウォッチ。
 * 単色は比較用に現行のみ残し、候補はすべてレイヤー／グラデ。
 * 本番未反映 — 気に入ったものを ProfileHomeScreen / CyberSubpageShell へ適用する。
 */

import type { CSSProperties } from "react";

export type SettingsBgPreviewSwatch = {
  id: string;
  /** 短いラベル */
  label: string;
  /** CSS background（複数レイヤー可） */
  background: string;
  /** グリッド等の backgroundSize（任意） */
  backgroundSize?: string;
  /** レイヤーごとの backgroundRepeat（任意） */
  backgroundRepeat?: string;
  note: string;
  /** 現行本番（単色・比較用） */
  current?: boolean;
};

/**
 * `background` ショートハンドと `backgroundSize` を混ぜない（React 警告回避）。
 * 末尾の単色レイヤーは backgroundColor に分離する。
 */
export function settingsBgPreviewStyle(
  swatch: SettingsBgPreviewSwatch
): CSSProperties {
  const raw = swatch.background.trim();
  const solidTail = raw.match(
    /^(.*),\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))\s*$/
  );

  if (solidTail) {
    return {
      backgroundImage: solidTail[1],
      backgroundColor: solidTail[2],
      backgroundSize: swatch.backgroundSize ?? "auto",
      backgroundRepeat: swatch.backgroundRepeat ?? "no-repeat",
    };
  }

  if (/^#|^rgba?\(/i.test(raw)) {
    return {
      backgroundColor: raw,
      backgroundImage: "none",
      backgroundSize: "auto",
      backgroundRepeat: "no-repeat",
    };
  }

  return {
    backgroundImage: raw,
    backgroundColor: "transparent",
    backgroundSize: swatch.backgroundSize ?? "auto",
    backgroundRepeat: swatch.backgroundRepeat ?? "no-repeat",
  };
}

export const SETTINGS_BG_PREVIEW_SWATCHES: readonly SettingsBgPreviewSwatch[] = [
  {
    id: "flat-legacy",
    label: "旧単色",
    background: "#050b14",
    note: "採用前の単色（比較用）",
  },
  {
    id: "cyan-wash",
    label: "Wash",
    background: [
      "radial-gradient(ellipse 95% 58% at 50% -12%, rgba(0,245,255,0.16), transparent 58%)",
      "#050b14",
    ].join(", "),
    note: "上部シアンの薄い光。Shell 装飾に近い定番",
  },
  {
    id: "aurora",
    label: "Aurora",
    background: [
      "radial-gradient(ellipse 70% 42% at 18% 8%, rgba(34,211,238,0.18), transparent 55%)",
      "radial-gradient(ellipse 55% 40% at 88% 12%, rgba(167,139,250,0.14), transparent 58%)",
      "radial-gradient(ellipse 60% 45% at 50% 100%, rgba(14,165,233,0.08), transparent 55%)",
      "#040910",
    ].join(", "),
    note: "シアン×バイオレットのオーロラ",
  },
  {
    id: "horizon",
    label: "Horizon",
    background: [
      "linear-gradient(180deg, rgba(14,30,52,0.95) 0%, rgba(5,11,20,0.98) 38%, #03060c 100%)",
      "radial-gradient(ellipse 100% 40% at 50% 0%, rgba(0,245,255,0.1), transparent 60%)",
    ].join(", "),
    note: "上→下のスチールブルー。奥行きが出る",
  },
  {
    id: "grid-glow",
    label: "Grid",
    background: [
      "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,245,255,0.12), transparent 65%)",
      "linear-gradient(rgba(0,245,255,0.045) 1px, transparent 1px)",
      "linear-gradient(90deg, rgba(0,245,255,0.045) 1px, transparent 1px)",
      "#050b14",
    ].join(", "),
    backgroundSize: "auto, 28px 28px, 28px 28px, auto",
    backgroundRepeat: "no-repeat, repeat, repeat, no-repeat",
    note: "サイバーグリッド + 上部グロー（本番 Shell と同系統）",
  },
  {
    id: "halftone-soft",
    label: "Dots",
    background: [
      "radial-gradient(ellipse 90% 50% at 50% 0%, rgba(0,180,255,0.12), transparent 60%)",
      "radial-gradient(rgba(0,245,255,0.07) 0.7px, transparent 0.7px)",
      "linear-gradient(180deg, #071422 0%, #050b14 100%)",
    ].join(", "),
    backgroundSize: "auto, 14px 14px, auto",
    backgroundRepeat: "no-repeat, repeat, no-repeat",
    note: "ハーフトーン風ドット + 青グラデ",
  },
  {
    id: "dual-pool",
    label: "Pools",
    background: [
      "radial-gradient(ellipse 48% 38% at 12% 78%, rgba(0,245,255,0.1), transparent 62%)",
      "radial-gradient(ellipse 52% 40% at 92% 88%, rgba(167,139,250,0.12), transparent 65%)",
      "radial-gradient(ellipse 62% 32% at 50% -10%, rgba(34,211,238,0.08), transparent 60%)",
      "#050b14",
    ].join(", "),
    note: "本番採用。四隅に色だまり。カードが浮いて見える",
    current: true,
  },
  {
    id: "mist",
    label: "Mist",
    background: [
      "radial-gradient(ellipse 120% 70% at 50% 40%, rgba(15,40,70,0.55), transparent 70%)",
      "linear-gradient(165deg, #071018 0%, #050b14 45%, #0a1424 100%)",
    ].join(", "),
    note: "中央に薄い霧。柔らかい印象",
  },
  {
    id: "ember",
    label: "Ember",
    background: [
      "radial-gradient(ellipse 75% 40% at 50% -6%, rgba(251,191,36,0.09), transparent 52%)",
      "radial-gradient(ellipse 40% 30% at 85% 90%, rgba(249,115,22,0.07), transparent 60%)",
      "#060910",
    ].join(", "),
    note: "ごく薄い暖色。シアン UI との対比",
  },
  {
    id: "deep-sea",
    label: "Sea",
    background: [
      "radial-gradient(ellipse 90% 55% at 50% 0%, rgba(6,182,212,0.14), transparent 55%)",
      "linear-gradient(180deg, #061520 0%, #030a12 50%, #020508 100%)",
      "radial-gradient(ellipse 50% 35% at 20% 85%, rgba(14,116,144,0.12), transparent 60%)",
    ].join(", "),
    note: "深海ブルー。縦グラデ + 底の光",
  },
  {
    id: "neon-rim",
    label: "Rim",
    background: [
      "radial-gradient(ellipse 100% 55% at 50% -15%, rgba(0,245,255,0.2), transparent 50%)",
      "radial-gradient(ellipse 40% 25% at 0% 50%, rgba(34,211,238,0.06), transparent 55%)",
      "radial-gradient(ellipse 40% 25% at 100% 50%, rgba(168,85,247,0.07), transparent 55%)",
      "#04080f",
    ].join(", "),
    note: "上下左右からリムライト。ドラマチック",
  },
] as const;

/** 既定＝本番採用の Pools */
export const SETTINGS_BG_PREVIEW_DEFAULT_ID = "dual-pool";
