"use client";

import { useEffect, useRef } from "react";

import {
  VELVET_BASE,
  VELVET_TILE_H,
  VELVET_TILE_W,
  sampleVelvetTuft,
} from "@/lib/badges/velvetPalette";

function makeTile(dpr: number): HTMLCanvasElement {
  const w = Math.max(1, Math.round(VELVET_TILE_W * dpr));
  const h = Math.max(1, Math.round(VELVET_TILE_H * dpr));
  const tile = document.createElement("canvas");
  tile.width = w;
  tile.height = h;
  const ctx = tile.getContext("2d");
  if (!ctx) return tile;
  const img = ctx.createImageData(w, h);
  const data = img.data;
  for (let y = 0; y < h; y++) {
    const py = y / dpr;
    for (let x = 0; x < w; x++) {
      const [r, g, b] = sampleVelvetTuft(x / dpr, py);
      const i = (y * w + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return tile;
}

/** 黒×金のダイヤキルト（手続きテクスチャ） */
export default function VelvetTuftField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const tile = makeTile(dpr);

    const paint = () => {
      const rect = parent.getBoundingClientRect();
      const cssW = Math.max(1, Math.round(rect.width));
      const cssH = Math.max(1, Math.round(rect.height));
      const dw = Math.round(cssW * dpr);
      const dh = Math.round(cssH * dpr);
      if (canvas.width !== dw) canvas.width = dw;
      if (canvas.height !== dh) canvas.height = dh;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = VELVET_BASE;
      ctx.fillRect(0, 0, dw, dh);
      const pattern = ctx.createPattern(tile, "repeat");
      if (!pattern) return;
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, dw, dh);
    };

    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  return (
    <canvas
      ref={ref}
      className="velvet-tuft-canvas"
      aria-hidden
    />
  );
}
