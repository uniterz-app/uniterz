"use client";

/**
 * Unit 獲得演出 — 画面中央でカウントアップ → プロフィール金庫へ飛行加算。
 * カウントは DOM 直書き、飛行は transform のみ（毎フレームの React 再描画を避ける）。
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { animate, useReducedMotion } from "framer-motion";
import { nameOxanium, nameRajdhani } from "@/lib/fonts";
import {
  UNIT_EARN_ABSORB_MS,
  UNIT_EARN_COUNT_MS,
  UNIT_EARN_EASE,
  UNIT_EARN_ENTER_S,
  UNIT_EARN_EXIT_S,
  UNIT_EARN_FLY_S,
  UNIT_EARN_HOLD_MS,
  UNIT_EARN_SCRIM_S,
  UNIT_EARN_VAULT_COUNT_MS,
  UNIT_VAULT_DATA_ATTR,
  easeUnitEarnCount,
  easeUnitEarnFly,
  unitEarnFlyPoint,
} from "@/lib/units/unitEarnMotion";

type Props = {
  open: boolean;
  amount: number;
  label?: string | null;
  language?: "ja" | "en";
  onAbsorb: () => void;
  onDone: () => void;
  inline?: boolean;
};

function measureFlyDelta(
  fromEl: HTMLElement,
  toEl: HTMLElement
): { x: number; y: number; scale: number } {
  const from = fromEl.getBoundingClientRect();
  const to = toEl.getBoundingClientRect();
  const fromCx = from.left + from.width / 2;
  const fromCy = from.top + from.height / 2;
  const toCx = to.left + to.width / 2;
  const toCy = to.top + to.height / 2;
  const scale = Math.min(
    0.42,
    Math.max(0.28, to.width / Math.max(from.width, 1))
  );
  return { x: toCx - fromCx, y: toCy - fromCy, scale };
}

export default function UnitEarnOverlay({
  open,
  amount,
  label = null,
  language = "ja",
  onAbsorb,
  onDone,
  inline = false,
}: Props) {
  const isJa = language === "ja";
  const reduceMotion = useReducedMotion() === true;
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const payloadRef = useRef<HTMLDivElement | null>(null);
  const valueRef = useRef<HTMLSpanElement | null>(null);
  const labelRefs = useRef<HTMLElement[]>([]);
  const absorbedRef = useRef(false);
  const onAbsorbRef = useRef(onAbsorb);
  const onDoneRef = useRef(onDone);
  const safeAmount = Math.max(0, Math.floor(amount));

  onAbsorbRef.current = onAbsorb;
  onDoneRef.current = onDone;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      absorbedRef.current = false;
      document.documentElement.classList.remove("unit-earn-playing");
      return;
    }

    setVisible(true);
    absorbedRef.current = false;
    document.documentElement.classList.add("unit-earn-playing");
    let cancelled = false;
    const timers: number[] = [];
    const controls: Array<{ stop: () => void }> = [];

    const writeAmount = (n: number) => {
      if (!valueRef.current) return;
      // toLocaleString より軽量（カウント中のメインスレッド負荷を抑える）
      const v = Math.max(0, Math.floor(n));
      valueRef.current.textContent = String(v).replace(
        /\B(?=(\d{3})+(?!\d))/g,
        ","
      );
    };

    const runAbsorb = () => {
      if (absorbedRef.current) return;
      absorbedRef.current = true;
      onAbsorbRef.current();
    };

    const finish = () => {
      if (cancelled) return;
      const root = rootRef.current;
      if (root) {
        const c = animate(
          root,
          { opacity: 0 },
          { duration: UNIT_EARN_EXIT_S, ease: UNIT_EARN_EASE }
        );
        controls.push(c);
        void c.then(() => {
          if (!cancelled) onDoneRef.current();
        });
      } else {
        onDoneRef.current();
      }
    };

    // 2 フレーム待ってから開始（他ページ復帰直後のレイアウトと重ねない）
    let startId = 0;
    let countRaf = 0;
    startId = window.requestAnimationFrame(() => {
      startId = window.requestAnimationFrame(() => {
        if (cancelled) return;
        writeAmount(reduceMotion ? safeAmount : 0);

        const root = rootRef.current;
        const payload = payloadRef.current;
        if (!root || !payload) {
          writeAmount(safeAmount);
          runAbsorb();
          timers.push(window.setTimeout(finish, 400));
          return;
        }

        // レイアウトを一度読んでウォームアップ（初回 fly 計測のヒッチ軽減）
        void payload.getBoundingClientRect();
        document
          .querySelector<HTMLElement>(`[${UNIT_VAULT_DATA_ATTR}="1"]`)
          ?.getBoundingClientRect();

        // 入場（transform / opacity のみ）
        controls.push(
          animate(
            root,
            { opacity: [0, 1] },
            { duration: UNIT_EARN_SCRIM_S, ease: UNIT_EARN_EASE }
          )
        );
        controls.push(
          animate(
            payload,
            { opacity: [0, 1], y: [16, 0], scale: [0.9, 1] },
            { duration: UNIT_EARN_ENTER_S, ease: UNIT_EARN_EASE }
          )
        );

        if (reduceMotion) {
          writeAmount(safeAmount);
          timers.push(
            window.setTimeout(() => {
              runAbsorb();
              finish();
            }, 360)
          );
          return;
        }

        // カウントは入場完了後に開始（入場と同時だと復帰直後に特に硬い）
        timers.push(
          window.setTimeout(() => {
            if (cancelled) return;
            const countStart = performance.now();
            let lastShown = -1;
            const valueEl = valueRef.current?.parentElement;
            const tickCount = (now: number) => {
              if (cancelled) return;
              const t = Math.min(1, (now - countStart) / UNIT_EARN_COUNT_MS);
              const eased = easeUnitEarnCount(t);
              const n = Math.floor(safeAmount * eased + 1e-6);
              if (n !== lastShown) {
                lastShown = n;
                writeAmount(n);
              }
              if (valueEl) {
                const breathe = 1 + (1 - eased) * 0.04;
                valueEl.style.transform = `scale(${breathe})`;
                valueEl.style.transformOrigin = "left center";
              }
              if (t < 1) {
                countRaf = window.requestAnimationFrame(tickCount);
              } else {
                writeAmount(safeAmount);
                if (valueEl) valueEl.style.transform = "scale(1)";
              }
            };
            countRaf = window.requestAnimationFrame(tickCount);
          }, Math.round(UNIT_EARN_ENTER_S * 1000) + 16)
        );

        const countDelayMs = Math.round(UNIT_EARN_ENTER_S * 1000) + 16;
        const flyAtMs = countDelayMs + UNIT_EARN_COUNT_MS + UNIT_EARN_HOLD_MS;

        // 飛行
        timers.push(
          window.setTimeout(() => {
            window.cancelAnimationFrame(countRaf);
            writeAmount(safeAmount);

            const vault = document.querySelector<HTMLElement>(
              `[${UNIT_VAULT_DATA_ATTR}="1"]`
            );
            const delta = vault
              ? measureFlyDelta(payload, vault)
              : { x: 0, y: -140, scale: 0.35 };

            // 入場の framer が transform を握ったままだと飛行と干渉して硬くなる
            for (const c of controls) c.stop();
            payload.style.willChange = "transform, opacity";

            for (const el of labelRefs.current) {
              if (!el) continue;
              el.style.opacity = "0";
              el.style.transition = `opacity ${UNIT_EARN_FLY_S * 0.3}s ease`;
            }

            const scrim = root.querySelector<HTMLElement>(
              "[data-unit-earn-scrim]"
            );
            if (scrim) {
              scrim.style.transition = `opacity ${UNIT_EARN_FLY_S * 0.55}s ease`;
              scrim.style.opacity = "0.28";
            }

            // 弧軌道 — rAF でベジェ補間
            const flyMs = UNIT_EARN_FLY_S * 1000;
            const flyStart = performance.now();
            let flyRaf = 0;
            const tickFly = (now: number) => {
              if (cancelled) return;
              const linear = Math.min(1, (now - flyStart) / flyMs);
              const eased = easeUnitEarnFly(linear);
              const p = unitEarnFlyPoint(eased, delta.x, delta.y);
              const scale = 1 + (delta.scale - 1) * eased;
              const opacity = 1 - (1 - 0.92) * eased;
              payload.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) scale(${scale})`;
              payload.style.opacity = String(opacity);
              if (linear < 1) {
                flyRaf = window.requestAnimationFrame(tickFly);
              } else {
                timers.push(
                  window.setTimeout(() => {
                    runAbsorb();
                    // 金庫の加算カウントが見えるまで待ってから退出
                    timers.push(
                      window.setTimeout(
                        finish,
                        Math.max(
                          UNIT_EARN_ABSORB_MS,
                          Math.round(UNIT_EARN_VAULT_COUNT_MS * 0.55)
                        )
                      )
                    );
                  }, 48)
                );
              }
            };
            flyRaf = window.requestAnimationFrame(tickFly);
            timers.push(
              window.setTimeout(() => {
                window.cancelAnimationFrame(flyRaf);
              }, flyMs + 80)
            );
          }, flyAtMs)
        );

        timers.push(
          window.setTimeout(() => {
            window.cancelAnimationFrame(countRaf);
          }, flyAtMs + 16)
        );
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(startId);
      for (const t of timers) window.clearTimeout(t);
      for (const c of controls) c.stop();
      document.documentElement.classList.remove("unit-earn-playing");
    };
  }, [open, reduceMotion, safeAmount]);

  if (!mounted || !open || !visible) return null;

  const title = isJa ? "UNIT 獲得" : "UNITS EARNED";
  const sub =
    label?.trim() ||
    (isJa ? "プロフィールの残高に加算されます" : "Added to your vault");

  const panel = (
    <div
      ref={rootRef}
      className={
        inline
          ? "relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-[#03080d] px-4"
          : "fixed inset-0 z-[125] flex items-center justify-center px-4"
      }
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{ willChange: "opacity" }}
    >
      {!inline ? (
        <div
          data-unit-earn-scrim
          className="absolute inset-0 bg-black/90"
          aria-hidden
        />
      ) : null}

      <div
        ref={payloadRef}
        className="relative z-[1] flex flex-col items-center unit-earn-overlay__payload"
        style={{ willChange: "transform, opacity" }}
      >
        <p
          ref={(el) => {
            if (el) labelRefs.current[0] = el;
          }}
          className={[
            nameOxanium.className,
            "text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#f6c344]/90",
          ].join(" ")}
        >
          {title}
        </p>

        <div className="mt-4 flex items-center gap-3">
          <span className="unit-earn-overlay__disc" aria-hidden>
            <span className="unit-earn-overlay__disc-inner">U</span>
          </span>
          <span
            className={[
              nameOxanium.className,
              "unit-earn-overlay__value tabular-nums",
            ].join(" ")}
          >
            <span className="unit-earn-overlay__plus">+</span>
            <span ref={valueRef}>0</span>
          </span>
        </div>

        <p
          ref={(el) => {
            if (el) labelRefs.current[1] = el;
          }}
          className={[
            nameRajdhani.className,
            "mt-3 text-center text-[14px] font-semibold text-white/55",
          ].join(" ")}
        >
          {sub}
        </p>
      </div>
    </div>
  );

  if (inline) return panel;
  return createPortal(panel, document.body);
}
