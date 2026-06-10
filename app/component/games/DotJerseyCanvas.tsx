"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { JERSEY_PATH_D } from "@/app/component/games/icons/Jersey";

const VIEWBOX_W = 87.76;
const VIEWBOX_H = 114.88;

/** 末端が一気に埋まる＝デジタルスキャン風 */
function easeOutExpo(t: number): number {
  const u = Math.max(0, Math.min(1, t));
  return u >= 1 ? 1 : 1 - Math.pow(2, -12 * u);
}

/** 描画・クリップ・縁取りで共用（SSR では Path2D が無いことがあるため遅延生成） */
let jerseyPath2dCached: Path2D | null | undefined;
function getJerseyPath2d(): Path2D | null {
  if (jerseyPath2dCached !== undefined) return jerseyPath2dCached;
  if (typeof Path2D === "undefined") {
    jerseyPath2dCached = null;
    return null;
  }
  jerseyPath2dCached = new Path2D(JERSEY_PATH_D);
  return jerseyPath2dCached;
}

/** マスク用オフスクリーンの解像度（大きいほど境界が滑らか） */
const MASK_W = 220;
const MASK_H = 288;

type MaskCache = {
  w: number;
  h: number;
  data: Uint8ClampedArray;
};

function buildJerseyAlphaMask(): MaskCache | null {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = MASK_W;
  c.height = MASK_H;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  const path = getJerseyPath2d();
  if (!path) return null;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, MASK_W, MASK_H);
  ctx.fillStyle = "#fff";
  ctx.scale(MASK_W / VIEWBOX_W, MASK_H / VIEWBOX_H);
  ctx.fill(path);
  const { data } = ctx.getImageData(0, 0, MASK_W, MASK_H);
  return { w: MASK_W, h: MASK_H, data };
}

function isInsideJersey(
  mask: MaskCache,
  vbx: number,
  vby: number,
): boolean {
  const xi = Math.floor((vbx / VIEWBOX_W) * mask.w);
  const yi = Math.floor((vby / VIEWBOX_H) * mask.h);
  if (xi < 0 || xi >= mask.w || yi < 0 || yi >= mask.h) return false;
  return mask.data[(yi * mask.w + xi) * 4 + 3] > 28;
}

/** 擬似ライト：中央〜肩周りがやや明るく見えるようドット径を変える */
function halftoneShade01(vbx: number, vby: number): number {
  const nx = vbx / VIEWBOX_W - 0.5;
  const ny = vby / VIEWBOX_H - 0.42;
  const d = Math.hypot(nx * 1.15, ny);
  // 下限を上げて影ドットが潰れすぎないように（全体的にやや明るく）
  let t = 0.58 + 0.42 * Math.max(0, Math.min(1, 1 - d * 1.55));
  t += 0.07 * Math.sin(vbx * 0.35) * Math.cos(vby * 0.22);
  return Math.max(0.34, Math.min(1, t));
}

type Rgb = { r: number; g: number; b: number };

const DEFAULT_ACCENT_RGB: Rgb = { r: 34, g: 211, b: 238 };

/** #rgb / #rrggbb を RGB に（不正時はシアン系） */
function parseHexToRgb(accent: string): Rgb {
  const hex = accent.trim().replace(/^#/, "");
  let r = DEFAULT_ACCENT_RGB.r;
  let g = DEFAULT_ACCENT_RGB.g;
  let b = DEFAULT_ACCENT_RGB.b;
  if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return { ...DEFAULT_ACCENT_RGB };
  } else if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return { ...DEFAULT_ACCENT_RGB };
  }
  return { r, g, b };
}

function rgbToCss({ r, g, b }: Rgb): string {
  return `rgb(${r},${g},${b})`;
}

function lerpRgb(a: Rgb, b: Rgb, t: number): Rgb {
  const u = Math.max(0, Math.min(1, t));
  return {
    r: Math.round(a.r + (b.r - a.r) * u),
    g: Math.round(a.g + (b.g - a.g) * u),
    b: Math.round(a.b + (b.b - a.b) * u),
  };
}

/** 表示用にごく弱く白へ持ち上げ（沈み過ぎ防止） */
function liftRgbForDisplay(c: Rgb, amount: number): Rgb {
  const a = Math.max(0, Math.min(0.28, amount));
  return {
    r: Math.min(255, Math.round(c.r + (255 - c.r) * a)),
    g: Math.min(255, Math.round(c.g + (255 - c.g) * a)),
    b: Math.min(255, Math.round(c.b + (255 - c.b) * a)),
  };
}

/** Canvas fillStyle 用。単色ドット時 */
function blendAccentForDots(accent: string): string {
  return rgbToCss(liftRgbForDisplay(parseHexToRgb(accent), 0.1));
}

function normalizeHexKey(s: string): string {
  return s.trim().replace(/^#/, "").toLowerCase();
}

function useJerseyGradient(accent: string, accentEnd?: string): boolean {
  if (!accentEnd) return false;
  return normalizeHexKey(accent) !== normalizeHexKey(accentEnd);
}

export type DotJerseyCanvasProps = {
  className?: string;
  /** チーム主色（グラデーション開始側・単色時は全体） */
  accent?: string;
  /** チーム副色（指定かつ accent と異なるときドットを二色で補間） */
  accentEnd?: string;
  /** ドットの基調（未指定時は accent とシアン系を混ぜる） */
  dotColor?: string;
  /** true のときマウント後一度だけ、裾→肩へドットを現す（試合カード用） */
  enableDotReveal?: boolean;
  /** ドット開幕のディレイ（ms）。一覧のスタッガーと揃える */
  dotRevealDelayMs?: number;
};

/**
 * ユニフォーム SVG と同じシルエットを、Canvas 上でハーフトーン風のドットのみで描画する。
 */
export default function DotJerseyCanvas({
  className = "",
  accent = "#22d3ee",
  accentEnd,
  dotColor,
  enableDotReveal = false,
  dotRevealDelayMs = 0,
}: DotJerseyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskRef = useRef<MaskCache | null>(null);
  /** 0 = 未表示、1 = 完了。enableDotReveal でないときは常に 1 扱い */
  const revealProgressRef = useRef(enableDotReveal ? 0 : 1);
  /** レイアウト読み取りを毎フレーム行わないための CSS サイズキャッシュ */
  const sizeRef = useRef<{ w: number; h: number; dpr: number } | null>(null);
  /** 完成形（reveal=1）を描いたオフスクリーン。毎フレームはこれを合成するだけ */
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const geomRef = useRef<{ s: number; ox: number; oy: number } | null>(null);

  const gradientMode = useJerseyGradient(accent, accentEnd);

  const resolvedDotColor = useMemo(() => {
    if (gradientMode) return null;
    if (dotColor) return dotColor;
    return blendAccentForDots(accent);
  }, [accent, dotColor, gradientMode]);

  const gradientRgb = useMemo(() => {
    if (!gradientMode || !accentEnd) return null;
    return {
      start: parseHexToRgb(accent),
      end: parseHexToRgb(accentEnd),
    };
  }, [accent, accentEnd, gradientMode]);

  /** 完成形のドット＋クリップ＋縁取りをオフスクリーンへ一度だけ描く */
  const buildOffscreen = useCallback(
    (cssW: number, cssH: number, dpr: number): HTMLCanvasElement | null => {
      let mask = maskRef.current;
      if (!mask) {
        mask = buildJerseyAlphaMask();
        maskRef.current = mask;
      }
      if (!mask) return null;

      const off = document.createElement("canvas");
      off.width = Math.round(cssW * dpr);
      off.height = Math.round(cssH * dpr);
      const ctx = off.getContext("2d");
      if (!ctx) return null;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const pad = 6;
      const s = Math.min(
        (cssW - pad * 2) / VIEWBOX_W,
        (cssH - pad * 2) / VIEWBOX_H,
      );
      const ox = (cssW - VIEWBOX_W * s) / 2;
      const oy = (cssH - VIEWBOX_H * s) / 2;
      geomRef.current = { s, ox, oy };

      const step = Math.max(2.4, Math.min(3.6, cssW * 0.028));
      const rMin = step * 0.17;
      const rMax = step * 0.46;

      for (let gy = oy + step * 0.5; gy < oy + VIEWBOX_H * s; gy += step) {
        for (let gx = ox + step * 0.5; gx < ox + VIEWBOX_W * s; gx += step) {
          const vbx = (gx - ox) / s;
          const vby = (gy - oy) / s;
          if (!isInsideJersey(mask, vbx, vby)) continue;

          const shade = halftoneShade01(vbx, vby);
          const r = rMin + shade * (rMax - rMin);
          if (gradientRgb) {
            // 肩〜裾方向の二色グラデ（ハーフトーン陰影をわずかに混ぜて立体感を維持）
            const tBase =
              0.32 * (vbx / VIEWBOX_W) + 0.68 * (vby / VIEWBOX_H);
            const t = Math.max(
              0,
              Math.min(1, tBase * 0.88 + (shade - 0.5) * 0.14),
            );
            const c = liftRgbForDisplay(
              lerpRgb(gradientRgb.start, gradientRgb.end, t),
              0.09,
            );
            ctx.fillStyle = rgbToCss(c);
          } else {
            ctx.fillStyle = resolvedDotColor ?? blendAccentForDots(accent);
          }
          ctx.beginPath();
          ctx.arc(gx, gy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const jerseyPath = getJerseyPath2d();
      if (jerseyPath) {
        // ユニフォーム外形に合わせてアルファを切り、矩形キャンバスの角を消す
        ctx.save();
        ctx.globalCompositeOperation = "destination-in";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.translate(ox, oy);
        ctx.scale(s, s);
        ctx.fillStyle = "#fff";
        ctx.fill(jerseyPath);
        ctx.restore();

        // SVG ユニフォームと同様のシルエット縁（白・細線）
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.translate(ox, oy);
        ctx.scale(s, s);
        ctx.globalCompositeOperation = "source-over";
        /** 白＋シアンのハイライト縁 */
        ctx.strokeStyle = "rgba(200,248,255,0.58)";
        ctx.lineWidth = Math.max(1.1, 2.1 / (dpr * s));
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke(jerseyPath);
        ctx.restore();
      }

      return off;
    },
    [accent, resolvedDotColor, gradientRgb],
  );

  /**
   * 毎フレームの処理は「オフスクリーンの合成 + 縦グラデーションマスク」のみ。
   * （以前は毎フレーム全ドットを再計算・再描画していて入場時のカクつき要因だった）
   */
  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = sizeRef.current;
    if (!size || size.w < 2 || size.h < 2) return;
    const { w, h, dpr } = size;

    const pxW = Math.round(w * dpr);
    const pxH = Math.round(h * dpr);
    if (canvas.width !== pxW || canvas.height !== pxH) {
      canvas.width = pxW;
      canvas.height = pxH;
    }

    let off = offscreenRef.current;
    if (!off || off.width !== pxW || off.height !== pxH) {
      off = buildOffscreen(w, h, dpr);
      offscreenRef.current = off;
    }
    if (!off) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reveal = enableDotReveal ? revealProgressRef.current : 1;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, pxW, pxH);
    ctx.drawImage(off, 0, 0);

    if (reveal < 1) {
      const geom = geomRef.current;
      if (geom) {
        // dotRevealAlpha と同じ線形ランプを縦グラデで一括適用（裾→肩）
        const threshold = VIEWBOX_H * (1 - reveal);
        const band = VIEWBOX_H * 0.16;
        const y0 = (geom.oy + (threshold - band * 0.45) * geom.s) * dpr;
        const y1 = (geom.oy + (threshold + band * 0.55) * geom.s) * dpr;
        ctx.globalCompositeOperation = "destination-in";
        const g = ctx.createLinearGradient(0, y0, 0, y1);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(1, "rgba(255,255,255,1)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, pxW, pxH);
        ctx.globalCompositeOperation = "source-over";
      }
    }
  }, [buildOffscreen, enableDotReveal]);

  /** 試合カード用：マウント時一度だけ下→上のドット出現 */
  useEffect(() => {
    if (!enableDotReveal) {
      revealProgressRef.current = 1;
      paint();
      return;
    }
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      revealProgressRef.current = 1;
      paint();
      return;
    }

    revealProgressRef.current = 0;
    paint();

    /** 下からドットが埋まる時間 */
    const durationMs = 520;
    const t0 = performance.now() + Math.max(0, dotRevealDelayMs);
    const rafRef = { id: 0 };

    const tick = (now: number) => {
      // ディレイ待機中は描画せず次フレームを待つ（無駄な合成を避ける）
      if (now < t0) {
        rafRef.id = requestAnimationFrame(tick);
        return;
      }
      const u = Math.min(1, (now - t0) / durationMs);
      revealProgressRef.current = easeOutExpo(u);
      paint();
      if (u < 1) {
        rafRef.id = requestAnimationFrame(tick);
      } else {
        revealProgressRef.current = 1;
        paint();
      }
    };
    rafRef.id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.id);
  }, [enableDotReveal, dotRevealDelayMs, paint]);

  useEffect(() => {
    // 配色が変わったら完成形キャッシュを作り直す
    offscreenRef.current = null;
    paint();
  }, [paint]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const rect = entry?.contentRect;
      if (!rect) return;
      sizeRef.current = {
        w: rect.width,
        h: rect.height,
        dpr: Math.min(window.devicePixelRatio || 1, 2.5),
      };
      offscreenRef.current = null;
      paint();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [paint]);

  return (
    <canvas
      ref={canvasRef}
      className={["pointer-events-none absolute inset-0 size-full touch-none", className].join(
        " ",
      )}
      aria-hidden
    />
  );
}
