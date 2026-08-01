"use client";

import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import { Bebas_Neue, Geist, Montserrat } from "next/font/google";
import { SLIDES } from "./slides-data";
import "./print.css";

/** アプリ mobile layout と同じスタック（柔らかいゴシック） */
const body = Geist({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const display = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const brand = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-brand",
  display: "swap",
});

const themeStyle = {
  "--ink": "#f2efe8",
  "--muted": "#9a958c",
  "--accent": "#e8a54b",
  "--bg": "#12100e",
  "--surface": "#1c1916",
  "--line": "#2e2924",
  fontFamily:
    'var(--font-body), "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
  background:
    "radial-gradient(1200px 600px at 10% -10%, #2a2218 0%, transparent 55%), radial-gradient(900px 500px at 100% 0%, #1a2420 0%, transparent 50%), var(--bg)",
  color: "var(--ink)",
} as CSSProperties;

export default function LegalCounselSlidesPage() {
  const [index, setIndex] = useState(0);
  const [printMode, setPrintMode] = useState(false);
  const total = SLIDES.length;
  const slide = SLIDES[index]!;

  const go = useCallback(
    (next: number) => {
      setIndex(Math.max(0, Math.min(total - 1, next)));
    },
    [total]
  );

  const savePdf = useCallback(async () => {
    setPrintMode(true);
    await document.fonts.ready;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    window.print();
  }, []);

  useEffect(() => {
    const onAfterPrint = () => setPrintMode(false);
    window.addEventListener("afterprint", onAfterPrint);
    return () => window.removeEventListener("afterprint", onAfterPrint);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === "ArrowRight" ||
        e.key === " " ||
        e.key === "PageDown" ||
        e.key === "Enter"
      ) {
        e.preventDefault();
        go(index + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        go(0);
      } else if (e.key === "End") {
        e.preventDefault();
        go(total - 1);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        if (!document.fullscreenElement) {
          void document.documentElement.requestFullscreen?.();
        } else {
          void document.exitFullscreen?.();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, total]);

  return (
    <div
      className={`legal-slides-root ${body.variable} ${display.variable} ${brand.variable} min-h-[100dvh] antialiased`}
      style={themeStyle}
    >
      {/* 画面用プレゼンター */}
      <div className="legal-slides-screen-only mx-auto flex min-h-[100dvh] max-w-5xl flex-col px-5 py-4 md:px-10 md:py-6">
        <header className="flex items-center justify-between gap-4 pb-3 text-xs text-[var(--muted)]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-[family-name:var(--font-brand)] tracking-[0.06em] text-sm shrink-0">
              Uniterz
            </span>
            {slide.section ? (
              <>
                <span className="opacity-40">/</span>
                <span className="truncate">{slide.section}</span>
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-2 shrink-0 tabular-nums">
            <span>
              {index + 1} / {total}
            </span>
            <button
              type="button"
              onClick={savePdf}
              disabled={printMode}
              className="rounded-md border border-[var(--line)] px-2 py-1 hover:border-[var(--accent)]/50 hover:text-[var(--ink)] transition-colors disabled:opacity-50"
            >
              {printMode ? "準備中…" : "PDF保存"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!document.fullscreenElement) {
                  void document.documentElement.requestFullscreen?.();
                } else {
                  void document.exitFullscreen?.();
                }
              }}
              className="rounded-md border border-[var(--line)] px-2 py-1 hover:border-[var(--accent)]/50 hover:text-[var(--ink)] transition-colors"
            >
              全画面
            </button>
          </div>
        </header>

        <main className="relative flex-1 min-h-0">
          <button
            type="button"
            aria-label="前へ"
            className="absolute inset-y-0 left-0 z-10 w-[12%] cursor-w-resize opacity-0"
            onClick={() => go(index - 1)}
          />
          <button
            type="button"
            aria-label="次へ"
            className="absolute inset-y-0 right-0 z-10 w-10 cursor-e-resize opacity-0"
            onClick={() => go(index + 1)}
          />
          <div key={slide.id} className="h-full">
            {slide.content}
          </div>
        </main>

        <footer className="pt-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm disabled:opacity-30 hover:border-[var(--accent)]/40 transition-colors"
          >
            前へ
          </button>
          <div className="flex flex-wrap justify-center gap-1.5 max-w-[50%]">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`スライド ${i + 1}`}
                onClick={() => go(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index
                    ? "w-6 bg-[var(--accent)]"
                    : "w-1.5 bg-[var(--line)] hover:bg-[var(--muted)]"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(index + 1)}
            disabled={index === total - 1}
            className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm disabled:opacity-30 hover:border-[var(--accent)]/40 transition-colors"
          >
            次へ
          </button>
        </footer>
      </div>

      {/* 印刷 / PDF用 — ボタン押下時だけ描画（初期読み込みを軽くする） */}
      {printMode ? (
        <div className="legal-slides-print-only">
          {SLIDES.map((s, i) => (
            <section key={s.id} className="legal-slides-print-slide">
              <div className="legal-slides-print-meta">
                <span className="font-[family-name:var(--font-brand)] tracking-[0.06em]">
                  Uniterz
                </span>
                <span>
                  {s.section ? `${s.section} · ` : ""}
                  {i + 1} / {total}
                </span>
              </div>
              <div className="legal-slides-print-body">{s.content}</div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
