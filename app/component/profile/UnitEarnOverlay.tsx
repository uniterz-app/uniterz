"use client";

/**
 * Unit 獲得演出 — 枠なしオーバーレイ
 * 1) 金額カウントアップ + 理由 / 順位
 * 2) 「獲得する」タップ
 * 3) 獲得額だけプロフィール金庫へ飛行加算
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { animate, useReducedMotion } from "framer-motion";
import { jp, nameOxanium } from "@/lib/fonts";
import {
  UNIT_EARN_ABSORB_MS,
  UNIT_EARN_COUNT_MS,
  UNIT_EARN_EASE,
  UNIT_EARN_EXIT_S,
  UNIT_EARN_FLY_S,
  UNIT_EARN_APERTURE_CLAIM_DELAY_S,
  UNIT_EARN_APERTURE_COUNT_DELAY_MS,
  UNIT_EARN_APERTURE_DETAIL_DELAY_S,
  UNIT_EARN_APERTURE_ITEM_S,
  UNIT_EARN_APERTURE_PRIZE_DELAY_S,
  UNIT_EARN_APERTURE_RANK_DELAY_S,
  UNIT_EARN_APERTURE_RING_S,
  UNIT_EARN_SCRIM_S,
  UNIT_EARN_VAULT_COUNT_MS,
  UNIT_VAULT_DATA_ATTR,
  easeUnitEarnCount,
  easeUnitEarnFly,
  unitEarnCountDisplayValue,
  unitEarnFlyPoint,
} from "@/lib/units/unitEarnMotion";
import { formatUnitEarnRankOrdinal } from "@/lib/units/formatUnitEarnRank";

type Props = {
  open: boolean;
  amount: number;
  label?: string | null;
  title?: string | null;
  subtitle?: string | null;
  rank?: number | null;
  language?: "ja" | "en";
  onAbsorb: () => void;
  onDone: () => void;
  inline?: boolean;
};

type Phase = "enter" | "ready" | "flying";

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
  title = null,
  subtitle = null,
  rank = null,
  language = "ja",
  onAbsorb,
  onDone,
  inline = false,
}: Props) {
  const isJa = language === "ja";
  const reduceMotion = useReducedMotion() === true;
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<Phase>("enter");

  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const flyRef = useRef<HTMLDivElement | null>(null);
  const valueRef = useRef<HTMLSpanElement | null>(null);
  const fadeRefs = useRef<HTMLElement[]>([]);
  const absorbedRef = useRef(false);
  const flyingRef = useRef(false);
  const cancelledRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const controlsRef = useRef<Array<{ stop: () => void }>>([]);
  const countRafRef = useRef(0);
  const onAbsorbRef = useRef(onAbsorb);
  const onDoneRef = useRef(onDone);
  const safeAmount = Math.max(0, Math.floor(amount));
  const safeRank =
    typeof rank === "number" && Number.isFinite(rank)
      ? Math.max(1, Math.floor(rank))
      : null;

  onAbsorbRef.current = onAbsorb;
  onDoneRef.current = onDone;

  const clearTimers = useCallback(() => {
    for (const t of timersRef.current) window.clearTimeout(t);
    timersRef.current = [];
    window.cancelAnimationFrame(countRafRef.current);
    for (const c of controlsRef.current) c.stop();
    controlsRef.current = [];
  }, []);

  const pushTimer = useCallback((id: number) => {
    timersRef.current.push(id);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      setPhase("enter");
      absorbedRef.current = false;
      flyingRef.current = false;
      cancelledRef.current = true;
      clearTimers();
      document.documentElement.classList.remove("unit-earn-playing");
      return;
    }

    cancelledRef.current = false;
    setVisible(true);
    setPhase("enter");
    absorbedRef.current = false;
    flyingRef.current = false;
    document.documentElement.classList.add("unit-earn-playing");
    clearTimers();

    const writeAmount = (n: number) => {
      if (!valueRef.current) return;
      const v = Math.max(0, Math.floor(n));
      valueRef.current.textContent = String(v).replace(
        /\B(?=(\d{3})+(?!\d))/g,
        ","
      );
    };

    let startId = 0;
    startId = window.requestAnimationFrame(() => {
      startId = window.requestAnimationFrame(() => {
        if (cancelledRef.current) return;
        writeAmount(reduceMotion ? safeAmount : 0);

        const root = rootRef.current;
        const stage = stageRef.current;
        if (!root || !stage) {
          writeAmount(safeAmount);
          setPhase("ready");
          return;
        }

        void flyRef.current?.getBoundingClientRect();
        document
          .querySelector<HTMLElement>(`[${UNIT_VAULT_DATA_ATTR}="1"]`)
          ?.getBoundingClientRect();

        controlsRef.current.push(
          animate(
            root,
            { opacity: [0, 1] },
            { duration: UNIT_EARN_SCRIM_S, ease: UNIT_EARN_EASE }
          )
        );

        const detail = stage.querySelector<HTMLElement>(
          "[data-unit-earn-detail]"
        );
        const prize = stage.querySelector<HTMLElement>(
          "[data-unit-earn-prize]"
        );
        const footer = stage.querySelector<HTMLElement>(
          "[data-unit-earn-footer]"
        );
        const rankEl = stage.querySelector<HTMLElement>(
          "[data-unit-earn-rank]"
        );
        const ring = root.querySelector<HTMLElement>("[data-unit-earn-ring]");

        if (reduceMotion) {
          stage.style.opacity = "1";
          if (detail) detail.style.opacity = "1";
          if (prize) prize.style.opacity = "1";
          if (footer) footer.style.opacity = "1";
          if (rankEl) rankEl.style.opacity = "1";
          if (ring) ring.style.opacity = "0";
          writeAmount(safeAmount);
          setPhase("ready");
          return;
        }

        // 本番入場: Aperture（細いリング → 情報ロック）
        stage.style.opacity = "1";
        if (ring) {
          ring.style.opacity = "0";
          ring.style.transform = "scale(0.35)";
          controlsRef.current.push(
            animate(
              ring,
              {
                opacity: [0, 0.55, 0],
                scale: [0.35, 1.35, 1.7],
              },
              {
                duration: UNIT_EARN_APERTURE_RING_S,
                ease: UNIT_EARN_EASE,
              }
            )
          );
        }
        if (detail) {
          controlsRef.current.push(
            animate(
              detail,
              { opacity: [0, 1], y: [8, 0] },
              {
                duration: UNIT_EARN_APERTURE_ITEM_S,
                delay: UNIT_EARN_APERTURE_DETAIL_DELAY_S,
                ease: UNIT_EARN_EASE,
              }
            )
          );
        }
        if (rankEl) {
          controlsRef.current.push(
            animate(
              rankEl,
              { opacity: [0, 1], y: [6, 0] },
              {
                duration: UNIT_EARN_APERTURE_ITEM_S,
                delay: UNIT_EARN_APERTURE_RANK_DELAY_S,
                ease: UNIT_EARN_EASE,
              }
            )
          );
        }
        if (prize) {
          controlsRef.current.push(
            animate(
              prize,
              { opacity: [0, 1], y: [8, 0], scale: [0.97, 1] },
              {
                duration: 0.42,
                delay: UNIT_EARN_APERTURE_PRIZE_DELAY_S,
                ease: UNIT_EARN_EASE,
              }
            )
          );
        }
        if (footer) {
          controlsRef.current.push(
            animate(
              footer,
              { opacity: [0, 1], y: [6, 0] },
              {
                duration: 0.34,
                delay: UNIT_EARN_APERTURE_CLAIM_DELAY_S,
                ease: UNIT_EARN_EASE,
              }
            )
          );
        }
        const countDelayMs = UNIT_EARN_APERTURE_COUNT_DELAY_MS;
        pushTimer(
          window.setTimeout(() => {
            if (cancelledRef.current) return;
            const countStart = performance.now();
            let lastShown = -1;
            const valueEl = valueRef.current?.parentElement;
            const tickCount = (now: number) => {
              if (cancelledRef.current) return;
              const t = Math.min(1, (now - countStart) / UNIT_EARN_COUNT_MS);
              const eased = easeUnitEarnCount(t);
              const n = unitEarnCountDisplayValue(0, safeAmount, eased);
              if (n !== lastShown) {
                lastShown = n;
                writeAmount(n);
              }
              if (valueEl) {
                const breathe = 1 + (1 - eased) * 0.05;
                valueEl.style.transform = `scale(${breathe})`;
                valueEl.style.transformOrigin = "left center";
              }
              if (t < 1) {
                countRafRef.current = window.requestAnimationFrame(tickCount);
              } else {
                writeAmount(safeAmount);
                if (valueEl) valueEl.style.transform = "scale(1)";
                setPhase("ready");
              }
            };
            countRafRef.current = window.requestAnimationFrame(tickCount);
          }, countDelayMs)
        );
      });
    });

    return () => {
      cancelledRef.current = true;
      window.cancelAnimationFrame(startId);
      clearTimers();
      document.documentElement.classList.remove("unit-earn-playing");
    };
  }, [clearTimers, open, pushTimer, reduceMotion, safeAmount]);

  const finish = useCallback(() => {
    if (cancelledRef.current) return;
    const root = rootRef.current;
    if (root) {
      const c = animate(
        root,
        { opacity: 0 },
        { duration: UNIT_EARN_EXIT_S, ease: UNIT_EARN_EASE }
      );
      controlsRef.current.push(c);
      void c.then(() => {
        if (!cancelledRef.current) onDoneRef.current();
      });
    } else {
      onDoneRef.current();
    }
  }, []);

  const runAbsorb = useCallback(() => {
    if (absorbedRef.current) return;
    absorbedRef.current = true;
    onAbsorbRef.current();
  }, []);

  const handleClaim = useCallback(() => {
    if (phase !== "ready" || flyingRef.current || cancelledRef.current) return;
    flyingRef.current = true;
    setPhase("flying");

    const writeAmount = (n: number) => {
      if (!valueRef.current) return;
      const v = Math.max(0, Math.floor(n));
      valueRef.current.textContent = String(v).replace(
        /\B(?=(\d{3})+(?!\d))/g,
        ","
      );
    };
    writeAmount(safeAmount);

    const root = rootRef.current;
    const fly = flyRef.current;
    if (!root || !fly) {
      runAbsorb();
      pushTimer(window.setTimeout(finish, 400));
      return;
    }

    if (reduceMotion) {
      runAbsorb();
      pushTimer(
        window.setTimeout(() => {
          finish();
        }, 280)
      );
      return;
    }

    const vault = document.querySelector<HTMLElement>(
      `[${UNIT_VAULT_DATA_ATTR}="1"]`
    );
    const delta = vault
      ? measureFlyDelta(fly, vault)
      : { x: 0, y: -140, scale: 0.35 };

    for (const c of controlsRef.current) c.stop();
    controlsRef.current = [];
    fly.style.willChange = "transform, opacity";

    for (const el of fadeRefs.current) {
      if (!el) continue;
      el.style.opacity = "0";
      el.style.transition = `opacity ${UNIT_EARN_FLY_S * 0.28}s ease`;
      el.style.pointerEvents = "none";
    }

    const scrim = root.querySelector<HTMLElement>("[data-unit-earn-scrim]");
    if (scrim) {
      scrim.style.transition = `opacity ${UNIT_EARN_FLY_S * 0.55}s ease`;
      scrim.style.opacity = "0.28";
    }

    const flyMs = UNIT_EARN_FLY_S * 1000;
    const flyStart = performance.now();
    let flyRaf = 0;
    const tickFly = (now: number) => {
      if (cancelledRef.current) return;
      const linear = Math.min(1, (now - flyStart) / flyMs);
      const eased = easeUnitEarnFly(linear);
      const p = unitEarnFlyPoint(eased, delta.x, delta.y);
      const scale = 1 + (delta.scale - 1) * eased;
      const opacity = 1 - (1 - 0.92) * eased;
      fly.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) scale(${scale})`;
      fly.style.opacity = String(opacity);
      if (linear < 1) {
        flyRaf = window.requestAnimationFrame(tickFly);
      } else {
        pushTimer(
          window.setTimeout(() => {
            runAbsorb();
            pushTimer(
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
    pushTimer(
      window.setTimeout(() => {
        window.cancelAnimationFrame(flyRaf);
      }, flyMs + 80)
    );
  }, [finish, phase, pushTimer, reduceMotion, runAbsorb, safeAmount]);

  if (!mounted || !open || !visible) return null;

  const reasonTitle =
    title?.trim() ||
    label?.trim() ||
    (isJa ? "Unit 報酬" : "Unit reward");
  const reasonSub = subtitle?.trim() || null;
  const claimLabel = isJa ? "獲得する" : "Claim";
  const rankText =
    safeRank != null ? formatUnitEarnRankOrdinal(safeRank) : null;
  const ariaLabel =
    rankText != null ? `${reasonTitle} ${rankText}` : reasonTitle;

  const bindFade = (index: number) => (el: HTMLElement | null) => {
    if (el) fadeRefs.current[index] = el;
  };

  const panel = (
    <div
      ref={rootRef}
      className={
        inline
          ? "relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-[#03080d] px-6"
          : "fixed inset-0 z-[125] flex items-center justify-center px-6"
      }
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      style={{ willChange: "opacity" }}
    >
      {!inline ? (
        <div
          data-unit-earn-scrim
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.82)_100%)]"
          aria-hidden
        />
      ) : null}

      <div className="unit-earn-overlay__ring-wrap" aria-hidden>
        <div
          data-unit-earn-ring
          className="unit-earn-overlay__ring"
          style={{ opacity: 0 }}
        />
      </div>

      <div
        ref={stageRef}
        className="relative z-[1] w-full max-w-[280px] unit-earn-overlay__payload unit-earn-overlay__stage"
        style={{ willChange: "transform, opacity" }}
      >
        {/* 上から: 題名 → UNIT → 獲得（Aperture 入場） */}
        <div
          ref={bindFade(0)}
          data-unit-earn-detail
          className="unit-earn-overlay__detail"
          style={{ opacity: 0 }}
        >
          <p
            className={[jp.className, "unit-earn-overlay__context"].join(" ")}
          >
            {reasonTitle}
          </p>
          {reasonSub ? (
            <p className={[jp.className, "unit-earn-overlay__meta"].join(" ")}>
              {reasonSub}
            </p>
          ) : null}
          {rankText ? (
            <p
              data-unit-earn-rank
              className={[
                nameOxanium.className,
                "unit-earn-overlay__rank",
              ].join(" ")}
              style={{ opacity: 0 }}
            >
              {rankText}
            </p>
          ) : null}
        </div>

        <div
          ref={flyRef}
          data-unit-earn-prize
          className="unit-earn-overlay__prize"
          style={{ willChange: "transform, opacity", opacity: 0 }}
        >
          <div className="unit-earn-overlay__amount">
            <span
              className="unit-earn-overlay__coin profile-edit-kinetik-unit-vault__disc"
              aria-hidden
            >
              <span className="profile-edit-kinetik-unit-vault__sheen" />
              <span className="profile-edit-kinetik-unit-vault__disc-inner">
                U
              </span>
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
        </div>

        <div
          ref={bindFade(1)}
          data-unit-earn-footer
          className="unit-earn-overlay__footer"
          style={{ opacity: 0 }}
        >
          <button
            type="button"
            onClick={handleClaim}
            disabled={phase !== "ready"}
            aria-disabled={phase !== "ready"}
            className={[
              nameOxanium.className,
              "unit-earn-overlay__claim",
              phase === "ready"
                ? "unit-earn-overlay__claim--ready"
                : "unit-earn-overlay__claim--dim",
            ].join(" ")}
          >
            {claimLabel}
          </button>
        </div>
      </div>
    </div>
  );

  if (inline) return panel;
  return createPortal(panel, document.body);
}
