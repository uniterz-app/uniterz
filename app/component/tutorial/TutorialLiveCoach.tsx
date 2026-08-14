"use client";

/**
 * 本番画面の上に載せるコーチマーク（画面自体は差し替えない）。
 * data-tutorial-target をくり抜きハイライト + 中央コールアウト。
 * 対象があるときは中央モーダルから誘導線で指す（ナビ誘導など）。
 * 開始時に背景ぼかしをアニメーションで入れる。
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import cn from "clsx";
import { nameOxanium, nameRajdhani, jp } from "@/lib/fonts";
import {
  TUTORIAL_BG_FADE_S,
  TUTORIAL_CALLOUT_DURATION_S,
  TUTORIAL_COACH_CALLOUT_DELAY_S,
  TUTORIAL_COACH_CALLOUT_S,
  TUTORIAL_COACH_SCRIM_S,
  TUTORIAL_CYAN,
  TUTORIAL_FEATURE_ACCENT,
  TUTORIAL_FEATURE_ACCENT_DEEP,
  TUTORIAL_FEATURE_ACCENT_SOFT,
  TUTORIAL_FLOAT_PERIOD_S,
  TUTORIAL_FLOAT_Y_PX,
  TUTORIAL_PULSE_PERIOD_S,
  TUTORIAL_SCRIM_OPACITY,
  TUTORIAL_WELCOME_AUTO_FLY_DELAY_S,
  TUTORIAL_WELCOME_GATHER_EASE,
  TUTORIAL_WELCOME_PART_S,
} from "@/lib/tutorial/tutorialMotion";
import { scrollTutorialTargetIntoViewAsync } from "@/lib/tutorial/scrollTutorialTargetIntoView";
import type { TutorialVisualId } from "@/lib/tutorial/tutorialCopy";
import TutorialSlideVisual from "@/app/component/tutorial/TutorialSlideVisual";
import TutorialRichBody from "@/app/component/tutorial/TutorialRichBody";

const CYBER_CHAMFER_CLIP =
  "polygon(5px 0%, 100% 0%, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0% 100%, 0% 5px)";

const EASE = [0.22, 1, 0.36, 1] as const;
const PAD = 6;
/** 試合カードはパルスバッジ分も穴に含める */
const PAD_MATCH_CARD = 14;
const PAD_SIDES = 10;
/** UNIT 残高のカプセル枠 */
const PAD_UNIT_COIN = 8;

const SCRIM_STYLE: CSSProperties = {
  /** blur はフェード中にカクつくので単色のみ */
  background: `rgba(2, 6, 12, ${Math.min(0.52, TUTORIAL_SCRIM_OPACITY + 0.14)})`,
};

type Rect = { top: number; left: number; width: number; height: number };

type Props = {
  open: boolean;
  title: string;
  body: string;
  skipLabel: string;
  nextLabel?: string;
  /** ハイライト対象。null なら暗幕のみ */
  target?: string | null;
  onSkip: () => void;
  onNext?: () => void;
  /** 機能確認用: 前のステップへ戻る */
  onBack?: () => void;
  backLabel?: string;
  /** welcome の二択など、次へと並べる副ボタン */
  altNextLabel?: string;
  onAltNext?: () => void;
  /** welcome「画面を案内」/「新機能だけ」: カメラ前進の開始 */
  onWelcomeFlyStart?: (dest: "full" | "features") => void;
  /** welcome を試合ページと同じ 3D カメラに載せる。
   * true のとき Portal / 独自暗幕 / 独自 fly をしない。
   */
  embedInCamera?: boolean;
  /** プロフィール引き渡し時など、マウント後に自動でカメラ前進 */
  autoWelcomeFly?: "full" | "features";
  /** 次へボタンを出さず、ユーザー操作待ちのとき */
  waitHint?: string | null;
  /** false で穴の枠線を出さない（PulseHint と二重になるとき） */
  showHoleRing?: boolean;
  /**
   * 詳細確認用: 背後を操作でき、ぼかしを弱くする（スクロールして中身を見る）
   */
  allowInteractBehind?: boolean;
  /** 穴（ハイライト対象）をタップしたとき */
  onTargetPress?: () => void;
  /** 図解（文字だけのモーダルを避ける） */
  visual?: TutorialVisualId | null;
  /** 主要フェーズ進捗（例: 3 / 11） */
  progressLabel?: string | null;
  skipConfirmTitle?: string | null;
  skipConfirmBody?: string | null;
  skipConfirmStay?: string | null;
  skipConfirmLeave?: string | null;
  accentTone?: "cyan" | "feature";
  children?: ReactNode;
};

function readRawRect(target: string, pad = PAD): Rect | null {
  const el = document.querySelector(
    `[data-tutorial-target="${target}"]`
  ) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return null;
  return {
    top: r.top - pad,
    left: r.left - pad,
    width: r.width + pad * 2,
    height: r.height + pad * 2,
  };
}

function clampRectToViewport(r: Rect): Rect {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let { top, left, width, height } = r;
  if (left < 0) {
    width += left;
    left = 0;
  }
  if (top < 0) {
    height += top;
    top = 0;
  }
  if (left + width > vw) width = Math.max(0, vw - left);
  if (top + height > vh) height = Math.max(0, vh - top);
  return { top, left, width, height };
}

function unionRects(rects: Rect[]): Rect {
  const left = Math.min(...rects.map((r) => r.left));
  const top = Math.min(...rects.map((r) => r.top));
  const right = Math.max(...rects.map((r) => r.left + r.width));
  const bottom = Math.max(...rects.map((r) => r.top + r.height));
  return { left, top, width: right - left, height: bottom - top };
}

/**
 * リザルト詳細はスコア帯だけだと狭いので、
 * 同一カード内のチーム／指標まで穴を広げて見せる。
 */
function readRect(target: string): Rect | null {
  const primary =
    target === "match-card"
      ? readRawRect(target, PAD_MATCH_CARD)
      : target === "profile-unit-coin"
        ? readRawRect(target, PAD_UNIT_COIN)
        : readRawRect(target);
  if (!primary) return null;

  if (target === "result-detail-score") {
    const sides = readRawRect("predict-sides", PAD_SIDES);
    return clampRectToViewport(
      sides ? unionRects([primary, sides]) : primary
    );
  }
  if (target === "result-detail-stats") {
    const parts = [
      primary,
      readRawRect("result-detail-score"),
      readRawRect("predict-sides", PAD_SIDES),
    ].filter((r): r is Rect => r != null);
    return clampRectToViewport(unionRects(parts));
  }
  return clampRectToViewport(primary);
}

/** 誘導線・フォーカス枠用の狭い対象 */
function readFocusRect(target: string): Rect | null {
  const r = readRawRect(target);
  return r ? clampRectToViewport(r) : null;
}

/** 被らないときの中央コールアウト */
const CENTER_CALLOUT_STYLE: CSSProperties = {
  position: "fixed",
  left: "50%",
  top: "50%",
  width: "min(360px, calc(100vw - 32px))",
  maxWidth: 360,
  zIndex: 1000061,
  transform: "translate(-50%, -50%)",
};

/** welcome はタブバー上の領域で中央揃え（画面全体の 50% だと沈む） */
const WELCOME_CALLOUT_STYLE: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  top: 0,
  bottom:
    "max(var(--bottom-nav-clearance), calc(26px + 72px + env(safe-area-inset-bottom, 0px)))",
  zIndex: 1000061,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "28px 12px 16px",
  boxSizing: "border-box",
};

const CALLOUT_GAP = 14;
const CALLOUT_EST_H = 280;
const CALLOUT_EDGE = 16 + TUTORIAL_FLOAT_Y_PX;

function WelcomeFloat({
  children,
  delay = 0,
  z = 28,
  className,
  active = true,
  fromY = 28,
  fromX = 0,
  gather = true,
}: {
  children: ReactNode;
  delay?: number;
  z?: number;
  className?: string;
  active?: boolean;
  fromY?: number;
  fromX?: number;
  gather?: boolean;
}) {
  const reduceMotion = useReducedMotion() === true;
  if (!active) {
    return <div className={className}>{children}</div>;
  }
  return (
    <div
      className={className}
      style={{
        transform: `translateZ(${z}px)`,
        transformStyle: "preserve-3d",
      }}
    >
      <motion.div
        style={{
          filter: [
            `drop-shadow(0 ${10 + z * 0.14}px ${18 + z * 0.22}px rgba(0,0,0,0.62))`,
            `drop-shadow(0 2px 0 rgba(0,0,0,0.35))`,
          ].join(" "),
        }}
        initial={
          reduceMotion || !gather
            ? false
            : { opacity: 0, y: fromY, x: fromX, scale: 0.96 }
        }
        animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
        transition={{
          duration: TUTORIAL_WELCOME_PART_S,
          delay,
          ease: TUTORIAL_WELCOME_GATHER_EASE,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** 中央に置くと穴を塞ぐ対象（試合カード等）は近くに寄せる */
function buildNearTargetCalloutStyle(
  hole: Rect,
  calloutH = CALLOUT_EST_H
): CSSProperties {
  const width = "min(360px, calc(100vw - 32px))";
  const base: CSSProperties = {
    position: "fixed",
    left: "50%",
    width,
    maxWidth: 360,
    zIndex: 1000061,
    transform: "translateX(-50%)",
  };
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const h = Math.max(120, calloutH);
  const spaceBelow = vh - (hole.top + hole.height) - CALLOUT_EDGE;
  const spaceAbove = hole.top - CALLOUT_EDGE;
  const preferAbove =
    spaceBelow < h + CALLOUT_GAP && spaceAbove >= spaceBelow;
  if (preferAbove) {
    return {
      ...base,
      bottom: Math.min(
        Math.max(CALLOUT_EDGE, vh - hole.top + CALLOUT_GAP),
        Math.max(CALLOUT_EDGE, vh - h - CALLOUT_EDGE)
      ),
    };
  }
  return {
    ...base,
    top: Math.max(
      CALLOUT_EDGE,
      Math.min(hole.top + hole.height + CALLOUT_GAP, vh - h - CALLOUT_EDGE)
    ),
  };
}

export default function TutorialLiveCoach({
  open,
  title,
  body,
  skipLabel,
  nextLabel,
  target = null,
  onSkip,
  onNext,
  onBack,
  backLabel,
  altNextLabel,
  onAltNext,
  onWelcomeFlyStart,
  embedInCamera = false,
  autoWelcomeFly,
  waitHint = null,
  showHoleRing = true,
  allowInteractBehind = false,
  onTargetPress,
  visual = null,
  progressLabel = null,
  skipConfirmTitle = null,
  skipConfirmBody = null,
  skipConfirmStay = null,
  skipConfirmLeave = null,
  accentTone = "cyan",
  children,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [hole, setHole] = useState<Rect | null>(null);
  const [focusRect, setFocusRect] = useState<Rect | null>(null);
  const [calloutBox, setCalloutBox] = useState<Rect | null>(null);
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
  /** welcome「画面を案内」: カメラがモーダルを追い抜いている */
  const [welcomeFly, setWelcomeFly] = useState(false);
  const welcomeFlyRef = useRef(false);
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;
  const onAltNextRef = useRef(onAltNext);
  onAltNextRef.current = onAltNext;
  const onWelcomeFlyStartRef = useRef(onWelcomeFlyStart);
  onWelcomeFlyStartRef.current = onWelcomeFlyStart;
  const reduceMotion = useReducedMotion() === true;
  const isFeatureTone = accentTone === "feature";
  const accent = isFeatureTone ? TUTORIAL_FEATURE_ACCENT : TUTORIAL_CYAN;
  const accentSoft = isFeatureTone ? TUTORIAL_FEATURE_ACCENT_SOFT : "#5CFFF8";
  const accentDeep = isFeatureTone ? TUTORIAL_FEATURE_ACCENT_DEEP : "#00D4E8";
  const requestSkip = () => {
    if (skipConfirmTitle && skipConfirmBody) {
      setSkipConfirmOpen(true);
      return;
    }
    onSkip();
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setSkipConfirmOpen(false);
      setWelcomeFly(false);
      welcomeFlyRef.current = false;
    }
  }, [open, title, target]);

  const beginWelcomeGuide = useCallback(
    (dest: "full" | "features") => {
      if (welcomeFlyRef.current) return;
      const finish =
        dest === "features" ? onAltNextRef.current : onNextRef.current;
      if (!finish) return;
      if (reduceMotion || !onWelcomeFlyStartRef.current) {
        finish();
        return;
      }
      welcomeFlyRef.current = true;
      onWelcomeFlyStartRef.current(dest);
      setWelcomeFly(true);
    },
    [reduceMotion]
  );

  const didAutoFly = useRef(false);
  useEffect(() => {
    if (!autoWelcomeFly || !open || didAutoFly.current) return;
    const id = window.setTimeout(() => {
      didAutoFly.current = true;
      beginWelcomeGuide(autoWelcomeFly);
    }, TUTORIAL_WELCOME_AUTO_FLY_DELAY_S * 1000);
    return () => window.clearTimeout(id);
  }, [autoWelcomeFly, beginWelcomeGuide, open]);

  const measure = useCallback(() => {
    if (!target) {
      setHole(null);
      setFocusRect(null);
      return;
    }
    setHole(readRect(target));
    setFocusRect(
      target.startsWith("result-detail-") ? readFocusRect(target) : null
    );
  }, [target]);

  const calloutRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) {
      setCalloutBox(null);
      return;
    }
    const r = node.getBoundingClientRect();
    setCalloutBox({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    let cancelled = false;

    const syncCalloutBox = () => {
      const el = document.getElementById("tutorial-live-coach-callout");
      if (!el) return;
      const r = el.getBoundingClientRect();
      setCalloutBox({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
      });
    };

    const onResize = () => {
      if (cancelled) return;
      measure();
      syncCalloutBox();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);

    void (async () => {
      /** 固定ナビはスクロール不要。リザルト詳細はカード上端（sides）へ */
      if (target && !target.startsWith("nav-")) {
        const scrollId =
          (target === "result-detail-score" ||
            target === "result-detail-stats") &&
          document.querySelector('[data-tutorial-target="predict-sides"]')
            ? "predict-sides"
            : target;
        const scrollOpts =
          target === "result-card"
            ? {
                behavior: "auto" as const,
                align: "top" as const,
                topPad: 152,
              }
            : {
                behavior: reduceMotion
                  ? ("auto" as const)
                  : ("smooth" as const),
                idealRatio:
                  target === "result-detail-score" ||
                  target === "result-detail-stats"
                    ? 0.16
                    : 0.28,
              };
        await scrollTutorialTargetIntoViewAsync(scrollId, scrollOpts);
      }
      if (cancelled) return;
      measure();
      syncCalloutBox();
    })();

    const t1 = window.setTimeout(() => {
      if (!cancelled) {
        measure();
        syncCalloutBox();
      }
    }, target === "result-card" ? 640 : 520);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      window.clearTimeout(t1);
    };
  }, [open, measure, target, reduceMotion]);

  if (!mounted && !embedInCamera) return null;

  /** ターゲットなし／画面全体説明は全面ぼかし禁止 */
  const softBackdrop = allowInteractBehind;
  const isWelcomeBriefing = visual === "welcome" && !target;
  /**
   * - 画面全体説明: 下（背後を見せる）
   * - ナビ誘導・対象なし: 中央 + 誘導線
   * - CAREER タブ: 中央カードを残しつつ実 UI を穴で囲む
   * - 試合カード等: 穴の近く（中央だと被る）
   */
  const calloutStyle: CSSProperties = isWelcomeBriefing
    ? embedInCamera
      ? { ...WELCOME_CALLOUT_STYLE, position: "absolute" }
      : WELCOME_CALLOUT_STYLE
    : allowInteractBehind
    ? {
        position: "fixed",
        left: "50%",
        bottom: "max(16px, calc(env(safe-area-inset-bottom) + 72px))",
        width: "min(360px, calc(100vw - 32px))",
        maxWidth: 360,
        zIndex: 1000061,
        transform: "translateX(-50%)",
      }
    : !target ||
        target.startsWith("nav-") ||
        !hole ||
        target === "profile-career-tab"
      ? CENTER_CALLOUT_STYLE
      : buildNearTargetCalloutStyle(hole, calloutBox?.height ?? CALLOUT_EST_H);

  const showFocusNav =
    focusRect != null &&
    hole != null &&
    (Math.abs(focusRect.height - hole.height) > 16 ||
      Math.abs(focusRect.width - hole.width) > 16);

  const coachTree = (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="tutorial-live-coach"
          className={
            embedInCamera
              ? "pointer-events-none absolute inset-0 overflow-visible"
              : "pointer-events-none fixed inset-0 z-[1000060] overflow-visible"
          }
          style={{ isolation: "isolate" }}
        >
          {/* 背景: soft=下フェード／穴あり=スポット／welcome等=全面ディム */}
          {softBackdrop ? (
            <motion.div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-x-0 bottom-0",
                "h-[38%]"
              )}
              style={{
                background:
                  "linear-gradient(to top, rgba(2,6,12,0.42) 0%, rgba(2,6,12,0.14) 55%, transparent 100%)",
              }}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: TUTORIAL_COACH_SCRIM_S, ease: EASE }}
            />
          ) : hole ? (
            <motion.div
              className="pointer-events-none absolute inset-0"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: TUTORIAL_COACH_SCRIM_S, ease: EASE }}
            >
              <div
                className="pointer-events-auto absolute"
                style={{
                  ...SCRIM_STYLE,
                  top: 0,
                  left: 0,
                  right: 0,
                  height: Math.max(0, hole.top),
                }}
              />
              <div
                className="pointer-events-auto absolute"
                style={{
                  ...SCRIM_STYLE,
                  top: hole.top + hole.height,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
              <div
                className="pointer-events-auto absolute"
                style={{
                  ...SCRIM_STYLE,
                  top: hole.top,
                  left: 0,
                  width: Math.max(0, hole.left),
                  height: hole.height,
                }}
              />
              <div
                className="pointer-events-auto absolute"
                style={{
                  ...SCRIM_STYLE,
                  top: hole.top,
                  left: hole.left + hole.width,
                  right: 0,
                  height: hole.height,
                }}
              />
              <motion.div
                aria-hidden
                className={
                  target === "profile-unit-coin"
                    ? "pointer-events-none absolute rounded-full"
                    : "pointer-events-none absolute rounded-xl"
                }
                /** 位置は即時反映（スクロールと枠アニメがずれるのを防ぐ） */
                style={{
                  top: hole.top,
                  left: hole.left,
                  width: hole.width,
                  height: hole.height,
                  boxShadow: showHoleRing
                    ? showFocusNav
                      ? `0 0 0 1px ${accent}55, 0 0 14px ${accent}22`
                      : `0 0 0 2px ${accent}, 0 0 22px ${accent}66`
                    : undefined,
                }}
              />
              {showFocusNav && focusRect ? (
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute"
                  style={{
                    top: focusRect.top - 2,
                    left: focusRect.left - 2,
                    width: focusRect.width + 4,
                    height: focusRect.height + 4,
                  }}
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      clipPath: CYBER_CHAMFER_CLIP,
                      WebkitClipPath: CYBER_CHAMFER_CLIP,
                      boxShadow: `0 0 0 2px ${accent}`,
                    }}
                    animate={
                      reduceMotion
                        ? undefined
                        : {
                            boxShadow: [
                              `0 0 0 2px ${accent}, 0 0 12px ${accent}66`,
                              `0 0 0 3px ${accent}, 0 0 26px ${accent}aa`,
                              `0 0 0 2px ${accent}, 0 0 12px ${accent}66`,
                            ],
                          }
                    }
                    transition={{
                      duration: TUTORIAL_PULSE_PERIOD_S,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.span
                    className={cn(
                      nameOxanium.className,
                      "absolute -top-3 left-1/2 max-w-[min(220px,70vw)] -translate-x-1/2 truncate rounded px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"
                    )}
                    style={{
                      background: accent,
                      color: "#050508",
                      boxShadow: `0 0 14px ${accent}99`,
                    }}
                    animate={
                      reduceMotion ? undefined : { y: [0, -3, 0] }
                    }
                    transition={{
                      duration: TUTORIAL_PULSE_PERIOD_S,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    {title}
                  </motion.span>
                </motion.div>
              ) : null}
              {onTargetPress && hole ? (
                <button
                  type="button"
                  aria-label={waitHint ?? title}
                  className={
                    target === "profile-unit-coin"
                      ? "pointer-events-auto absolute cursor-pointer rounded-full bg-transparent"
                      : "pointer-events-auto absolute cursor-pointer rounded-xl bg-transparent"
                  }
                  style={{
                    top: hole.top,
                    left: hole.left,
                    width: hole.width,
                    height: hole.height,
                  }}
                  onClick={onTargetPress}
                />
              ) : null}
            </motion.div>
          ) : isWelcomeBriefing && embedInCamera ? null : (
            <motion.div
              aria-hidden
              className="pointer-events-auto absolute inset-0"
              style={
                isWelcomeBriefing
                  ? {
                      background: "rgba(2, 6, 12, 0.4)",
                      backdropFilter: "blur(10px) saturate(1.08)",
                      WebkitBackdropFilter: "blur(10px) saturate(1.08)",
                    }
                  : {
                      background: "rgba(2,6,12,0.72)",
                    }
              }
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: TUTORIAL_COACH_SCRIM_S, ease: EASE }}
            />
          )}

          {/* transform は外枠固定。motion は内側のみ（中央ズレ防止） */}
          <div
            id="tutorial-live-coach-callout"
            ref={calloutRef}
            className="pointer-events-auto"
            style={{
              ...calloutStyle,
              ...(isWelcomeBriefing
                ? { pointerEvents: welcomeFly ? "none" : "auto" }
                : null),
            }}
          >
            <motion.div
              className={isWelcomeBriefing ? "w-full max-w-[440px]" : undefined}
              initial={
                reduceMotion || isWelcomeBriefing ? false : { opacity: 0, y: 16 }
              }
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: TUTORIAL_COACH_CALLOUT_S,
                ease: EASE,
                delay: reduceMotion ? 0 : TUTORIAL_COACH_CALLOUT_DELAY_S,
              }}
            >
              <motion.div
                className={cn(
                  "relative isolate",
                  isWelcomeBriefing
                    ? "overflow-visible px-1 py-1"
                    : "overflow-hidden border border-cyan-400/50 p-4"
                )}
                style={
                  isWelcomeBriefing
                    ? {
                        background: "transparent",
                        transformStyle: "preserve-3d",
                      }
                    : {
                        clipPath: CYBER_CHAMFER_CLIP,
                        WebkitClipPath: CYBER_CHAMFER_CLIP,
                        background: "rgba(6, 14, 24, 0.94)",
                        boxShadow: `0 0 0 1px ${accent}33, 0 16px 48px rgba(0,0,0,0.45), 0 0 28px ${accent}20, inset 0 1px 0 rgba(255,255,255,0.14)`,
                      }
                }
                animate={
                  !reduceMotion && visual === "welcome" && !isWelcomeBriefing
                    ? {
                        y: [0, -TUTORIAL_FLOAT_Y_PX, 0],
                      }
                    : undefined
                }
                transition={
                  !reduceMotion && visual === "welcome" && !isWelcomeBriefing
                    ? {
                        duration: TUTORIAL_FLOAT_PERIOD_S,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                    : undefined
                }
              >
                <WelcomeFloat
                  active={isWelcomeBriefing}
                  delay={0.04}
                  fromY={-22}
                  z={22}
                  className={cn("mb-1", isWelcomeBriefing && "mb-5")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        nameOxanium.className,
                        "text-[9px] font-bold uppercase tracking-[0.2em]"
                      )}
                      style={{ color: accent }}
                    >
                      {skipConfirmOpen
                        ? "Confirm"
                        : progressLabel
                          ? isWelcomeBriefing
                            ? `Mission · ${progressLabel}`
                            : isFeatureTone
                              ? `New · ${progressLabel}`
                              : `Tutorial · ${progressLabel}`
                          : isFeatureTone
                            ? "New"
                            : "Tutorial"}
                    </span>
                    {!skipConfirmOpen ? (
                      <button
                        type="button"
                        onClick={requestSkip}
                        className={cn(
                          nameOxanium.className,
                          "text-[10px] font-bold uppercase tracking-wider text-white/45"
                        )}
                      >
                        {skipLabel}
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                </WelcomeFloat>
                {skipConfirmOpen ? (
                  <>
                    <WelcomeFloat
                      active={isWelcomeBriefing}
                      delay={0.12}
                      z={32}
                      className="mb-1"
                    >
                      <h2
                        className={cn(
                          jp.className,
                          "text-[17px] font-bold text-white"
                        )}
                        style={
                          isWelcomeBriefing
                            ? {
                                textShadow: "0 10px 24px rgba(0,0,0,0.75)",
                              }
                            : undefined
                        }
                      >
                        {skipConfirmTitle}
                      </h2>
                    </WelcomeFloat>
                    <WelcomeFloat
                      active={isWelcomeBriefing}
                      delay={0.22}
                      z={26}
                      className="mb-3"
                    >
                      <TutorialRichBody
                        text={skipConfirmBody ?? ""}
                        className={cn(
                          nameRajdhani.className,
                          "text-[14px] leading-relaxed text-white/80"
                        )}
                      />
                    </WelcomeFloat>
                    <WelcomeFloat active={isWelcomeBriefing} delay={0.36} z={40}>
                      <div className="mt-1 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSkipConfirmOpen(false)}
                          className={cn(
                            nameOxanium.className,
                            "shrink-0 border border-white/20 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/70"
                          )}
                          style={{
                            clipPath: CYBER_CHAMFER_CLIP,
                            WebkitClipPath: CYBER_CHAMFER_CLIP,
                            boxShadow: isWelcomeBriefing
                              ? "0 10px 22px rgba(0,0,0,0.5)"
                              : undefined,
                          }}
                        >
                          {skipConfirmStay}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSkipConfirmOpen(false);
                            onSkip();
                          }}
                          className={cn(
                            nameOxanium.className,
                            "min-w-0 flex-1 py-2.5 text-[12px] font-black uppercase tracking-[0.12em]"
                          )}
                          style={{
                            background: "rgba(248,113,113,0.92)",
                            color: "#050508",
                            clipPath: CYBER_CHAMFER_CLIP,
                            WebkitClipPath: CYBER_CHAMFER_CLIP,
                            boxShadow: isWelcomeBriefing
                              ? "0 8px 0 #b91c1c, 0 16px 28px rgba(0,0,0,0.55)"
                              : undefined,
                          }}
                        >
                          {skipConfirmLeave ?? skipLabel}
                        </button>
                      </div>
                    </WelcomeFloat>
                  </>
                ) : (
                  <>
                    {visual ? (
                      <WelcomeFloat
                        active={isWelcomeBriefing}
                        delay={0}
                        fromY={0}
                        gather={false}
                        z={48}
                        className={isWelcomeBriefing ? "mb-7" : "mb-3"}
                      >
                        <TutorialSlideVisual visual={visual} className="max-w-none" />
                      </WelcomeFloat>
                    ) : null}
                    {!isWelcomeBriefing ? (
                    <WelcomeFloat
                      active={isWelcomeBriefing}
                      delay={0.62}
                      fromY={26}
                      z={36}
                      className={isWelcomeBriefing ? "mb-2" : undefined}
                    >
                      <h2
                        className={cn(
                          jp.className,
                          isWelcomeBriefing
                            ? "text-center text-[22px] font-bold text-white text-balance"
                            : "mb-1 text-[17px] font-bold text-white"
                        )}
                        style={
                          isWelcomeBriefing
                            ? {
                                textShadow: "0 10px 24px rgba(0,0,0,0.75)",
                              }
                            : undefined
                        }
                      >
                        {title}
                      </h2>
                    </WelcomeFloat>
                    ) : null}
                    <WelcomeFloat
                      active={isWelcomeBriefing}
                      delay={isWelcomeBriefing ? 0.62 : 0.78}
                      fromY={22}
                      z={28}
                      className={isWelcomeBriefing ? "mb-7" : undefined}
                    >
                      <TutorialRichBody
                        text={body}
                        className={cn(
                          isWelcomeBriefing ? jp.className : nameRajdhani.className,
                          isWelcomeBriefing
                            ? "text-center text-[14px] leading-relaxed text-white/90 break-keep"
                            : "mb-3 text-[14px] leading-relaxed text-white/80"
                        )}
                      />
                    </WelcomeFloat>
                    {children}
                    {waitHint ? (
                      <p
                        className={cn(
                          nameRajdhani.className,
                          "text-center text-[12px] text-cyan-200/75"
                        )}
                      >
                        {waitHint}
                      </p>
                    ) : null}
                    {isWelcomeBriefing && onNext && nextLabel && !autoWelcomeFly ? (
                      <div className="flex flex-col gap-6">
                        <WelcomeFloat delay={0.94} fromY={36} z={48}>
                          <button
                            type="button"
                            onClick={() => beginWelcomeGuide("full")}
                            disabled={welcomeFly}
                            className={cn(
                              jp.className,
                              "tutorial-welcome-cta tutorial-welcome-cta--primary"
                            )}
                          >
                            {nextLabel}
                          </button>
                        </WelcomeFloat>
                        {onAltNext && altNextLabel ? (
                          <WelcomeFloat delay={1.08} fromY={40} z={40}>
                            <button
                              type="button"
                              onClick={() => beginWelcomeGuide("features")}
                              disabled={welcomeFly}
                              className={cn(
                                jp.className,
                                "tutorial-welcome-cta tutorial-welcome-cta--alt"
                              )}
                            >
                              {altNextLabel}
                            </button>
                          </WelcomeFloat>
                        ) : null}
                      </div>
                    ) : onBack || (onNext && nextLabel) ? (
                      <div className="mt-1 flex gap-2">
                        {onBack && backLabel ? (
                          <button
                            type="button"
                            onClick={onBack}
                            className={cn(
                              nameOxanium.className,
                              onNext && nextLabel
                                ? "shrink-0 border border-white/20 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/70"
                                : "w-full border border-white/20 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/70"
                            )}
                            style={{
                              clipPath: CYBER_CHAMFER_CLIP,
                              WebkitClipPath: CYBER_CHAMFER_CLIP,
                            }}
                          >
                            {backLabel}
                          </button>
                        ) : null}
                        {onNext && nextLabel ? (
                          <button
                            type="button"
                            onClick={onNext}
                            className={cn(
                              nameOxanium.className,
                              "min-w-0 flex-1 py-2.5 text-[12px] font-black uppercase tracking-[0.12em]",
                              isFeatureTone &&
                                "py-3.5 tracking-[0.18em] text-[13px]"
                            )}
                            style={{
                              background: isFeatureTone
                                ? `linear-gradient(90deg, ${accentSoft} 0%, ${accent} 50%, ${accentDeep} 100%)`
                                : accent,
                              color: "#050508",
                              clipPath: CYBER_CHAMFER_CLIP,
                              WebkitClipPath: CYBER_CHAMFER_CLIP,
                              boxShadow: isFeatureTone
                                ? `0 0 22px ${accent}66`
                                : undefined,
                            }}
                          >
                            {nextLabel}
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </>
                )}
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  if (embedInCamera) return coachTree;
  return createPortal(coachTree, document.body);
}
