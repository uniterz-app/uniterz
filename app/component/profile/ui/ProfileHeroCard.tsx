"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Flame, Menu } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";

import type { Language } from "@/lib/i18n/language";

type DisplayProfile = {
  displayName: string;
  handle: string;
  bio?: string | null;
  avatarUrl?: string | null;
};

type Props = {
  layout: "web" | "mobile";
  playEntrance: boolean;
  onEntranceComplete?: () => void;
  language: Language;
  displayProfile: DisplayProfile;
  showCurrentStreakBadge: boolean;
  currentStreak: number;
  canOpenSettings: boolean;
  onOpenSettings: () => void;
  children?: ReactNode;
};

const SHELL_DURATION = 0.22;
const INNER_DELAY = 0.02;
const NAME_DURATION = 0.28;
/** アバター motion の duration（連勝バッジの開始時刻と揃える） */
const AVATAR_DURATION = 0.36;
/** アバターが落ち着いてから連勝バッジを出すまで */
const STREAK_AFTER_AVATAR_GAP_MS = 90;
/** 名前表示後、ハンドルスクランブルまでの余韻 */
const HANDLE_SCRAMBLE_START_EXTRA_MS = 220;
/** 1文字ロック間隔（大きいほどゆっくり解読） */
const HANDLE_MS_PER_CHAR = 74;
/** スクランブル文字の入れ替え間隔 */
const SCRAMBLE_TICK_MS = 52;
const BIO_DURATION = 0.28;
const BADGES_DELAY = 0.05;

const SCRAMBLE_POOL =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function pickScrambleChar(forChar: string): string {
  if (forChar >= "0" && forChar <= "9") {
    return String(Math.floor(Math.random() * 10));
  }
  if (forChar >= "a" && forChar <= "z") {
    return String.fromCharCode(97 + Math.floor(Math.random() * 26));
  }
  if (forChar >= "A" && forChar <= "Z") {
    return String.fromCharCode(65 + Math.floor(Math.random() * 26));
  }
  return SCRAMBLE_POOL[Math.floor(Math.random() * SCRAMBLE_POOL.length)]!;
}

function buildScrambleString(text: string, lockedPrefix: number): string {
  let s = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (i < lockedPrefix) {
      s += c;
    } else if (/[a-zA-Z0-9]/.test(c)) {
      s += pickScrambleChar(c);
    } else {
      s += c;
    }
  }
  return s;
}

type CountMode = "full" | "zero" | "animate";

function useCountUpInt(
  target: number,
  mode: CountMode,
  durationMs: number
) {
  const [value, setValue] = useState(() => (mode === "full" ? target : 0));

  useEffect(() => {
    if (mode === "full") {
      setValue(target);
      return;
    }
    if (mode === "zero") {
      setValue(0);
      return;
    }

    setValue(0);
    if (target <= 0) return;

    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setValue(Math.round(t * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, mode, durationMs]);

  return value;
}

function useHandleScramble(
  text: string,
  active: boolean,
  idleShowFull: boolean,
  msPerChar: number,
  onCompleteRef: MutableRefObject<(() => void) | undefined>
) {
  const [out, setOut] = useState(() => (idleShowFull ? text : ""));
  const doneRef = useRef(false);
  /** スクランブル完了後に active が一瞬 false になっても本文を消さない（フリッカー防止） */
  const handleRevealRef = useRef(false);
  const prevIdleShowFullRef = useRef(idleShowFull);

  useEffect(() => {
    if (prevIdleShowFullRef.current && !idleShowFull) {
      handleRevealRef.current = false;
    }
    prevIdleShowFullRef.current = idleShowFull;
  }, [idleShowFull]);

  useEffect(() => {
    doneRef.current = false;
    if (!active) {
      if (idleShowFull) {
        setOut(text);
        return;
      }
      setOut((prev) =>
        handleRevealRef.current && prev === text ? prev : ""
      );
      return;
    }
    if (!text) {
      setOut("");
      queueMicrotask(() => onCompleteRef.current?.());
      return;
    }

    handleRevealRef.current = false;
    let locked = 0;
    setOut(buildScrambleString(text, 0));

    const scrId = window.setInterval(() => {
      setOut(buildScrambleString(text, locked));
    }, SCRAMBLE_TICK_MS);

    const lockId = window.setInterval(() => {
      locked += 1;
      setOut(buildScrambleString(text, locked));
      if (locked >= text.length) {
        clearInterval(scrId);
        clearInterval(lockId);
        setOut(text);
        handleRevealRef.current = true;
        if (!doneRef.current) {
          doneRef.current = true;
          onCompleteRef.current?.();
        }
      }
    }, msPerChar);

    return () => {
      clearInterval(scrId);
      clearInterval(lockId);
    };
  }, [text, active, idleShowFull, msPerChar, onCompleteRef]);

  return out;
}

export default function ProfileHeroCard({
  layout,
  playEntrance,
  onEntranceComplete,
  language,
  displayProfile,
  showCurrentStreakBadge,
  currentStreak,
  canOpenSettings,
  onOpenSettings,
  children,
}: Props) {
  const reduceMotion = useReducedMotion();
  const completeRef = useRef(onEntranceComplete);
  completeRef.current = onEntranceComplete;
  const firedComplete = useRef(false);
  const shellInnerStartedRef = useRef(false);

  const fireComplete = useCallback(() => {
    if (firedComplete.current) return;
    firedComplete.current = true;
    completeRef.current?.();
  }, []);

  useEffect(() => {
    firedComplete.current = false;
    shellInnerStartedRef.current = false;
  }, [playEntrance, displayProfile.displayName, displayProfile.handle]);

  // useReducedMotion は SSR 直後などで null になり得る → その間はアニメ許可
  const prefersReducedMotion = reduceMotion === true;
  const staticHero = !playEntrance || prefersReducedMotion;
  const heroEntranceAnim =
    playEntrance && !prefersReducedMotion && !staticHero;

  const [innerPhase, setInnerPhase] = useState(staticHero);

  useEffect(() => {
    if (staticHero) {
      setInnerPhase(true);
    } else {
      setInnerPhase(false);
    }
  }, [staticHero]);

  useEffect(() => {
    if (staticHero) {
      fireComplete();
    }
  }, [staticHero, fireComplete]);

  const handleShellComplete = () => {
    if (shellInnerStartedRef.current) return;
    shellInnerStartedRef.current = true;
    if (!staticHero) {
      setInnerPhase(true);
    }
  };

  const [handleScrambleActive, setHandleScrambleActive] = useState(false);
  const [bioVisible, setBioVisible] = useState(staticHero);
  const [badgesVisible, setBadgesVisible] = useState(staticHero);
  const [streakReveal, setStreakReveal] = useState(staticHero);
  /** 写真ありのときは decode 完了まで円ごと隠し、円と写真を同じフェードにする */
  const [avatarLoaded, setAvatarLoaded] = useState(
    () => !displayProfile.avatarUrl
  );

  useEffect(() => {
    if (staticHero) {
      setHandleScrambleActive(false);
      setBioVisible(true);
      setBadgesVisible(true);
      setStreakReveal(true);
      setAvatarLoaded(true);
      return;
    }
    setHandleScrambleActive(false);
    setBioVisible(false);
    setBadgesVisible(false);
    setStreakReveal(false);
    setAvatarLoaded(!displayProfile.avatarUrl);
  }, [staticHero, displayProfile.avatarUrl]);

  const innerMotionOn = innerPhase && playEntrance && !reduceMotion;

  const avatarFadeReady =
    staticHero ||
    !displayProfile.avatarUrl ||
    avatarLoaded;

  useEffect(() => {
    if (staticHero || !innerPhase) return;
    if (!displayProfile.avatarUrl) {
      setAvatarLoaded(true);
      return;
    }
    setAvatarLoaded(false);
  }, [innerPhase, staticHero, displayProfile.avatarUrl]);

  useEffect(() => {
    if (staticHero || !innerPhase) return;

    setHandleScrambleActive(false);
    setBioVisible(false);
    setBadgesVisible(false);

    const nameDoneMs =
      (INNER_DELAY + 0.02 + NAME_DURATION) * 1000 +
      HANDLE_SCRAMBLE_START_EXTRA_MS;
    const t = window.setTimeout(() => {
      setHandleScrambleActive(true);
    }, nameDoneMs);
    return () => window.clearTimeout(t);
  }, [innerPhase, staticHero]);

  useEffect(() => {
    if (staticHero || !innerPhase) return;
    if (heroEntranceAnim && !avatarFadeReady) {
      setStreakReveal(false);
      return;
    }

    setStreakReveal(false);
    const avatarDoneMs =
      INNER_DELAY * 1000 +
      AVATAR_DURATION * 1000 +
      STREAK_AFTER_AVATAR_GAP_MS;
    const t = window.setTimeout(() => setStreakReveal(true), avatarDoneMs);
    return () => window.clearTimeout(t);
  }, [innerPhase, staticHero, heroEntranceAnim, avatarFadeReady]);

  const onScrambleDoneRef = useRef<(() => void) | undefined>(undefined);
  onScrambleDoneRef.current = () => {
    setBioVisible(true);
  };

  const showHandle = useHandleScramble(
    displayProfile.handle,
    handleScrambleActive,
    Boolean(staticHero),
    HANDLE_MS_PER_CHAR,
    onScrambleDoneRef
  );

  const streakMode: CountMode =
    staticHero || !showCurrentStreakBadge
      ? "full"
      : streakReveal && innerMotionOn
        ? "animate"
        : "zero";

  const streakShown = useCountUpInt(currentStreak, streakMode, 340);

  useEffect(() => {
    if (staticHero) return;
    if (!bioVisible) return;
    const t = window.setTimeout(() => setBadgesVisible(true), 70);
    return () => window.clearTimeout(t);
  }, [bioVisible, staticHero]);

  useEffect(() => {
    if (staticHero) return;
    if (!bioVisible) return;
    const hasBio = Boolean(displayProfile.bio);
    const delayMs = hasBio ? BIO_DURATION * 1000 + 60 : 100;
    const t = window.setTimeout(() => fireComplete(), delayMs);
    return () => window.clearTimeout(t);
  }, [bioVisible, staticHero, displayProfile.bio, fireComplete]);

  const isWeb = layout === "web";

  const shellClass = isWeb
    ? "relative min-h-[128px] rounded-xl border border-white/10 bg-[#050814]/80 p-5 shadow-[0_8px_22px_rgba(0,0,0,0.38)]"
    : "relative isolate rounded-xl border border-white/10 bg-[#050814]/80 p-3 shadow-[0_8px_22px_rgba(0,0,0,0.38)]";

  /** innerPhase 以降に img を載せて読み込み、準備できてから円ごとフェード */
  const showAvatarMedia = staticHero || innerPhase;

  const avatarImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (staticHero || !innerPhase || !displayProfile.avatarUrl) return;
    const el = avatarImgRef.current;
    if (el?.complete) setAvatarLoaded(true);
  }, [innerPhase, staticHero, displayProfile.avatarUrl]);

  const avatarBlock = (
    <div className="relative shrink-0">
      <motion.div
        className={
          isWeb
            ? "h-20 w-20 overflow-hidden rounded-full bg-[#0f2d35] ring-2 ring-[#0f2d35]"
            : "h-14 w-14 overflow-hidden rounded-full bg-[#0f2d35] ring-2 ring-[#0f2d35]"
        }
        initial={
          heroEntranceAnim ? { opacity: 0, scale: 0.94 } : false
        }
        animate={
          !heroEntranceAnim
            ? { opacity: 1, scale: 1 }
            : innerMotionOn && avatarFadeReady
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0.94 }
        }
        transition={{
          delay: INNER_DELAY,
          duration: AVATAR_DURATION,
          ease: [0.16, 0.82, 0.32, 1],
        }}
      >
        {displayProfile.avatarUrl && showAvatarMedia ? (
          <img
            ref={avatarImgRef}
            key={displayProfile.avatarUrl}
            src={displayProfile.avatarUrl}
            className="h-full w-full object-cover"
            alt=""
            loading="eager"
            decoding="async"
            onLoad={() => setAvatarLoaded(true)}
          />
        ) : null}
      </motion.div>

      {showCurrentStreakBadge && (
        <motion.div
          className={
            isWeb
              ? "absolute left-1/2 -bottom-1.5 -translate-x-1/2"
              : "absolute left-1/2 -bottom-1 z-10 -translate-x-1/2"
          }
          initial={heroEntranceAnim ? { opacity: 0, y: 4 } : false}
          animate={
            !heroEntranceAnim
              ? { opacity: 1, y: 0 }
              : innerMotionOn && streakReveal
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 4 }
          }
          transition={{
            duration: 0.32,
            ease: [0.16, 0.82, 0.32, 1],
          }}
        >
          <div className="inline-flex whitespace-nowrap rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-yellow-300 shadow-[0_6px_14px_rgba(0,0,0,0.4)] backdrop-blur">
            <Flame className="h-3 w-3 text-orange-400" />
            <span className="ml-0.5 tabular-nums">{streakShown}</span>
            <span className="ml-0.5">
              {language === "en" ? "Win streak" : "連勝中"}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );

  const textBlock = (
    <div className="min-w-0">
      <motion.h1
        className={
          isWeb
            ? "text-2xl font-extrabold leading-tight"
            : "truncate text-[16px] font-extrabold leading-tight"
        }
        initial={
          playEntrance && !reduceMotion
            ? { opacity: 0, y: 5 }
            : false
        }
        animate={
          innerMotionOn
            ? { opacity: 1, y: 0 }
            : playEntrance && !reduceMotion
              ? { opacity: 0, y: 5 }
              : { opacity: 1, y: 0 }
        }
        transition={{
          delay: INNER_DELAY + 0.02,
          duration: NAME_DURATION,
          ease: [0.16, 0.82, 0.32, 1],
        }}
      >
        {displayProfile.displayName}
      </motion.h1>

      <p
        className={
          isWeb
            ? "mt-0.5 min-h-5 font-mono text-sm text-white/70"
            : "mt-0.5 min-h-4 truncate font-mono text-[12px] text-white/70"
        }
        aria-label={displayProfile.handle}
      >
        {showHandle}
      </p>

      {displayProfile.bio ? (
        <motion.p
          className={
            isWeb
              ? "mt-1.5 text-[13px] leading-snug text-white/85"
              : "mt-1 text-[12px] leading-snug text-white/85"
          }
          initial={{ opacity: 0, y: 3 }}
          animate={
            bioVisible || staticHero
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 3 }
          }
          transition={{
            duration: BIO_DURATION,
            ease: [0.16, 0.82, 0.32, 1],
          }}
        >
          {displayProfile.bio}
        </motion.p>
      ) : null}
    </div>
  );

  const settingsBtn = canOpenSettings && (
    <motion.button
      type="button"
      className={
        isWeb
          ? "h-9 w-9 shrink-0 rounded-lg border border-white/10 bg-white/5"
          : "absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10"
      }
      onClick={onOpenSettings}
      initial={
        playEntrance && !reduceMotion
          ? { opacity: 0, scale: 0.94 }
          : false
      }
      animate={
        innerMotionOn
          ? { opacity: 1, scale: 1 }
          : playEntrance && !reduceMotion
            ? { opacity: 0, scale: 0.94 }
            : { opacity: 1, scale: 1 }
      }
      transition={{
        delay: INNER_DELAY + 0.06,
        duration: 0.28,
        ease: [0.16, 0.82, 0.32, 1],
      }}
      aria-label="Menu"
    >
      <Menu className={isWeb ? "h-5 w-5" : "h-4 w-4"} />
    </motion.button>
  );

  const hasBadgeSlot = children != null && children !== false;
  const badgesHidden = hasBadgeSlot && !staticHero && !badgesVisible;
  /** 常にバッジ行の高さを確保して、表示時にカードが縦に伸びないようにする */
  const badgesSlotClass = isWeb ? "mt-2.5 min-h-[52px]" : "mt-1.5 min-h-[46px]";

  const badgesWrap = hasBadgeSlot ? (
    <div
      className={[
        badgesSlotClass,
        badgesHidden
          ? "pointer-events-none select-none invisible opacity-0"
          : "visible opacity-100",
      ].join(" ")}
      aria-hidden={badgesHidden}
    >
      <motion.div
        initial={
          staticHero ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }
        }
        animate={
          staticHero || badgesVisible
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: 6 }
        }
        transition={{
          delay: badgesVisible && !staticHero ? BADGES_DELAY : 0,
          duration: 0.3,
          ease: [0.16, 0.82, 0.32, 1],
        }}
      >
        {children}
      </motion.div>
    </div>
  ) : null;

  const body = isWeb ? (
    <div className="relative z-1">
      <div className="grid grid-cols-[80px_1fr_auto] items-start gap-3">
        {avatarBlock}
        {textBlock}
        {settingsBtn}
      </div>
      {badgesWrap}
    </div>
  ) : (
    <div className="relative z-1">
      {settingsBtn}
      <div className="flex items-start gap-3">
        {avatarBlock}
        {textBlock}
      </div>
      {badgesWrap}
    </div>
  );

  /**
   * ルートを motion / plain で切り替えないこと。
   * onEntranceComplete 後に playEntrance が false になり staticHero になり、
   * 差し替えで子（img・バッジ）が再マウントして「黒くなって再描画」していた。
   */
  return (
    <motion.div
      className={shellClass}
      initial={heroEntranceAnim ? { opacity: 0, y: 7 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={
        heroEntranceAnim
          ? {
              duration: SHELL_DURATION,
              ease: [0.22, 0.65, 0.36, 1],
            }
          : { duration: 0 }
      }
      onAnimationComplete={
        heroEntranceAnim ? handleShellComplete : undefined
      }
    >
      {body}
    </motion.div>
  );
}
