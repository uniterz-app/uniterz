"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GiCrossedSwords } from "react-icons/gi";
import { FaTrophy } from "react-icons/fa";
import { FiUser } from "react-icons/fi";
import { Brain } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useState, CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { PiChartBarFill } from "react-icons/pi";
import { getUserDocDataCached } from "@/lib/user/userDocCache";
import { isProfileSetupRoute } from "@/lib/profileSetupRoute";

type Item = {
  href: string;
  key: "games" | "home" | "leaderboards" | "ranking" | "mypage";
  label: string;
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    style?: CSSProperties;
  }>;
};

/** 角ばったチャンファー枠：外周を1本のHUD線として描画（CSS枠と二重にしない） */
function NavHudFrame({ intro = false }: { intro?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const filterId = `navHudGlow-${uid}`;
  const gradId = `navHudFill-${uid}`;

  return (
    <svg
      aria-hidden
      viewBox="0 0 1000 120"
      preserveAspectRatio="none"
      className={intro ? "nav-hud-frame--intro" : undefined}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 2,
        overflow: "visible",
      }}
    >
      <defs>
        <filter id={filterId} x="-15%" y="-20%" width="130%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.1" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ff7f4" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#14d9e7" stopOpacity="0.88" />
        </linearGradient>
      </defs>

      {/* 外周：八角チャンファー（単一の連続線・pathLength でストローク描画） */}
      <path
        className="nav-hud-outer"
        pathLength={1}
        d="M 18 0 L 982 0 L 1000 18 L 1000 102 L 982 120 L 18 120 L 0 102 L 0 18 Z"
        fill="none"
        stroke="#31eef6"
        strokeWidth="2.2"
        vectorEffect="nonScalingStroke"
        filter={`url(#${filterId})`}
      />
      {/* 内側の細線（同形状・面取り内側） */}
      <path
        className="nav-hud-inner"
        pathLength={1}
        d="M 28 10 L 972 10 L 986 24 L 986 96 L 972 110 L 28 110 L 14 96 L 14 24 Z"
        fill="none"
        stroke="rgba(49, 238, 246, 0.45)"
        strokeWidth="1"
        vectorEffect="nonScalingStroke"
      />

      {/* 上中央タブ */}
      <path
        className="nav-hud-decor"
        d="M 458 0 L 542 0 L 528 13 L 472 13 Z"
        fill="rgba(79, 247, 244, 0.2)"
        stroke="#49f4f0"
        strokeWidth="0.9"
        vectorEffect="nonScalingStroke"
      />

      {/* 左右ブラケット（角ばった短冊） */}
      <polygon
        className="nav-hud-decor"
        points="8,44 20,44 20,76 8,76"
        fill={`url(#${gradId})`}
        opacity={0.88}
      />
      <polygon
        className="nav-hud-decor"
        points="980,44 992,44 992,76 980,76"
        fill={`url(#${gradId})`}
        opacity={0.88}
      />

      {/* 下中央アクセント */}
      <path
        className="nav-hud-decor"
        d="M 400 100 L 600 100 L 612 118 L 388 118 Z"
        fill={`url(#${gradId})`}
        opacity={0.88}
      />
    </svg>
  );
}

const items: Item[] = [
  { key: "games", href: "/games", label: "試合", icon: GiCrossedSwords },
  { key: "home", href: "/result", label: "リザルト", icon: Brain },
  { key: "ranking", href: "/rankings", label: "ランキング", icon: FaTrophy },
  {
    key: "leaderboards",
    href: "/leaderboards",
    label: "リーダーボード",
    icon: PiChartBarFill,
  },
  { key: "mypage", href: "/mypage", label: "マイページ", icon: FiUser },
];

/** ドック本体の面取りシルエット（角張り） */
const NAV_DOCK_CLIP =
  "polygon(14px 0%, calc(100% - 14px) 0%, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0% calc(100% - 14px), 0% 14px)";

const BarStyle = {
  wrap: {
    position: "fixed",
    left: "50%",
    bottom: "calc(10px + env(safe-area-inset-bottom))",
    transform: "translateX(-50%)",
    zIndex: 999999,
    width: "min(960px, 94vw)",
    pointerEvents: "none",
  } as CSSProperties,

  // ページ背景（#0c0d12 付近）・カード（#1a1e2b 付近）に寄せ、シアン強調は抑える
  barMobile: {
    position: "relative",
    overflow: "hidden",
    background:
      "linear-gradient(180deg, rgba(18,24,36,0.52) 0%, rgba(10,14,24,0.58) 100%)",
    borderRadius: 22,
    clipPath: "none",
    padding: "8px 14px",
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 6,
    border: "1px solid rgba(148,163,184,0.14)",
    boxShadow:
      "0 14px 24px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.04)",
    backdropFilter: "saturate(106%) blur(10px)",
    WebkitBackdropFilter: "saturate(106%) blur(10px)",
    pointerEvents: "auto",
    isolation: "isolate",
  } as CSSProperties,

  barWeb: {
    position: "relative",
    overflow: "hidden",
    background:
      "linear-gradient(180deg, rgba(18,22,32,0.45) 0%, rgba(8,10,16,0.50) 100%)",
    borderRadius: 0,
    clipPath: NAV_DOCK_CLIP,
    padding: "10px 16px",
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 8,
    border: "none",
    boxShadow:
      "0 14px 36px rgba(0,0,0,0.52), 0 0 30px rgba(34,211,238,0.12)",
    backdropFilter: "saturate(105%) blur(9px)",
    WebkitBackdropFilter: "saturate(105%) blur(9px)",
    pointerEvents: "auto",
    isolation: "isolate",
  } as CSSProperties,

  glassSheen: {
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    pointerEvents: "none",
    background:
      "linear-gradient(180deg, rgba(79,247,244,0.03) 0%, rgba(255,255,255,0.01) 35%, rgba(255,255,255,0.00) 55%)",
  } as CSSProperties,

  bottomGlow: {
    position: "absolute",
    left: "8%",
    right: "8%",
    bottom: -10,
    height: 24,
    borderRadius: 999,
    pointerEvents: "none",
    background: "rgba(0,0,0,0.35)",
    filter: "blur(18px)",
    opacity: 0.45,
  } as CSSProperties,

  linkMobile: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 0",
    borderRadius: 12,
    textDecoration: "none",
    transition: "transform .15s ease-out, background-color .2s ease",
    background: "transparent",
    boxShadow: "none",
    outline: "none",
    WebkitTapHighlightColor: "transparent",
  } as CSSProperties,

  linkWeb: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 0",
    borderRadius: 6,
    textDecoration: "none",
    transition: "transform .15s ease-out, background-color .2s ease",
    background: "transparent",
    boxShadow: "none",
    outline: "none",
    WebkitTapHighlightColor: "transparent",
  } as CSSProperties,

  iconWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 34,
    borderRadius: 0,
    overflow: "visible",
    lineHeight: 0,
  } as CSSProperties,
};

export default function NavBar() {
  const pathname = usePathname() ?? "";
  const reduceMotion = useReducedMotion();

  const isMobile =
    pathname.startsWith("/mobile") || pathname.startsWith("/m/");
  const prefix: "/web" | "/mobile" = isMobile ? "/mobile" : "/web";

  const shouldHide =
    pathname === "/" ||
    pathname === "/web" ||
    pathname === "/mobile" ||
    pathname.startsWith("/lp") ||
    pathname.startsWith("/mobile/lp") ||
    pathname === "/web/login" ||
    pathname === "/web/signup" ||
    pathname === "/mobile/login" ||
    pathname === "/mobile/signup" ||
    isProfileSetupRoute(pathname);

  const [mounted, setMounted] = useState(false);
  const [myHref, setMyHref] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  /** pending → 表示可能になった直後に run（フルロードでマウントするたび再生）／idle へ */
  const [introPhase, setIntroPhase] = useState<"pending" | "run" | "idle">(
    "pending"
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (shouldHide) return;

    setInitialized(false);
    setMyHref(null);

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setMyHref(`${prefix}/u/guest`);
        setInitialized(true);
        return;
      }

      try {
        const data = await getUserDocDataCached(user.uid);
        const h = data?.handle || data?.slug;
        setMyHref(
          h ? `${prefix}/u/${encodeURIComponent(h)}` : `${prefix}/mypage`
        );
      } catch {
        setMyHref(`${prefix}/mypage`);
      } finally {
        setInitialized(true);
      }
    });

    return () => unsub();
  }, [prefix, shouldHide]);

  useLayoutEffect(() => {
    if (shouldHide || !mounted || !initialized || !myHref) return;
    if (introPhase !== "pending") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIntroPhase("idle");
      return;
    }
    setIntroPhase("run");
  }, [shouldHide, mounted, initialized, myHref, introPhase]);

  useEffect(() => {
    if (introPhase !== "run") return;
    const t = window.setTimeout(() => {
      setIntroPhase("idle");
    }, 1280);
    return () => window.clearTimeout(t);
  }, [introPhase]);

  if (shouldHide) return null;
  if (!mounted || !initialized || !myHref) return null;

  const playDockIntro = introPhase === "run";

  const navEl = (
    <>
      <style>{`
        @keyframes navHudStrokeDraw {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes navHudDecorIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 0.88;
          }
        }
        @keyframes navHudSvgPulse {
          0%,
          100% {
            filter: drop-shadow(0 0 0 rgba(49, 238, 246, 0));
          }
          45% {
            filter: drop-shadow(0 0 12px rgba(49, 238, 246, 0.55));
          }
          70% {
            filter: drop-shadow(0 0 5px rgba(49, 238, 246, 0.28));
          }
        }
        .nav-hud-frame--intro {
          animation: navHudSvgPulse 1.05s ease-out 0.72s 1 both;
        }
        .nav-hud-frame--intro .nav-hud-outer {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: navHudStrokeDraw 0.88s cubic-bezier(0.15, 1, 0.28, 1) forwards;
        }
        .nav-hud-frame--intro .nav-hud-inner {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: navHudStrokeDraw 0.88s cubic-bezier(0.15, 1, 0.28, 1) 0.1s forwards;
        }
        .nav-hud-frame--intro .nav-hud-decor {
          opacity: 0;
          animation: navHudDecorIn 0.38s ease-out 0.52s forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .nav-hud-frame--intro {
            animation: none !important;
          }
          .nav-hud-frame--intro .nav-hud-outer,
          .nav-hud-frame--intro .nav-hud-inner {
            animation: none !important;
            stroke-dashoffset: 0 !important;
          }
          .nav-hud-frame--intro .nav-hud-decor {
            animation: none !important;
            opacity: 0.88 !important;
          }
        }
        @keyframes popActive {
          0% {
            transform: scale(0.88);
            filter: drop-shadow(0 0 0 rgba(103, 232, 249, 0));
          }
          40% {
            transform: scale(1.2);
            filter: drop-shadow(0 0 14px rgba(103, 232, 249, 0.5));
          }
          100% {
            transform: scale(1.08);
            filter: drop-shadow(0 0 6px rgba(103, 232, 249, 0.22));
          }
        }
        @keyframes utzNavDockIn {
          0% {
            opacity: 0;
            transform: translateY(48px) scale(0.88) rotateX(10deg);
            filter: blur(12px) saturate(0.85);
            box-shadow:
              0 32px 70px rgba(0, 0, 0, 0.6),
              0 0 0 rgba(34, 211, 238, 0),
              inset 0 1px 0 rgba(255, 255, 255, 0.03);
          }
          28% {
            opacity: 1;
            filter: blur(3px) saturate(1.05);
            transform: translateY(-8px) scale(1.04) rotateX(2deg);
            box-shadow:
              0 24px 56px rgba(0, 0, 0, 0.45),
              0 0 56px rgba(34, 211, 238, 0.38),
              0 0 100px rgba(56, 189, 248, 0.15),
              0 0 0 1px rgba(34, 211, 238, 0.22),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
          }
          48% {
            filter: blur(0) saturate(1.02);
            transform: translateY(4px) scale(0.985) rotateX(0deg);
            box-shadow:
              0 16px 40px rgba(0, 0, 0, 0.5),
              0 0 32px rgba(34, 211, 238, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.07);
          }
          72% {
            transform: translateY(-2px) scale(1.008) rotateX(0deg);
            box-shadow:
              0 13px 36px rgba(0, 0, 0, 0.5),
              0 0 22px rgba(34, 211, 238, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.065);
          }
          100% {
            opacity: 1;
            filter: blur(0) saturate(1);
            transform: translateY(0) scale(1) rotateX(0deg);
            box-shadow:
              0 12px 32px rgba(0, 0, 0, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.06);
          }
        }
        @keyframes utzNavDockSweep {
          0% {
            transform: translateX(-130%) skewX(-28deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translateX(240%) skewX(-28deg);
            opacity: 0;
          }
        }
        @keyframes utzNavIconIn {
          0% {
            opacity: 0;
            transform: translateY(28px) scale(0.5) rotate(-8deg);
            filter: blur(5px) drop-shadow(0 0 0 rgba(103, 232, 249, 0));
          }
          38% {
            opacity: 1;
            transform: translateY(-10px) scale(1.14) rotate(2deg);
            filter: blur(0) drop-shadow(0 0 12px rgba(103, 232, 249, 0.55));
          }
          58% {
            transform: translateY(5px) scale(0.94) rotate(-1deg);
            filter: drop-shadow(0 0 6px rgba(103, 232, 249, 0.28));
          }
          78% {
            transform: translateY(-2px) scale(1.04) rotate(0.5deg);
            filter: drop-shadow(0 0 8px rgba(103, 232, 249, 0.2));
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
            filter: blur(0) drop-shadow(0 0 0 rgba(103, 232, 249, 0));
          }
        }
      `}</style>

      <nav
        style={{
          ...BarStyle.wrap,
          ...(playDockIntro ? { perspective: "720px" } : {}),
        }}
        aria-label="Bottom navigation"
      >
        <div
          style={{
            ...(isMobile ? BarStyle.barMobile : BarStyle.barWeb),
            ...(playDockIntro && !isMobile
              ? {
                  animation:
                    "utzNavDockIn 0.84s cubic-bezier(0.15, 1, 0.28, 1) both",
                  transformStyle: "preserve-3d" as const,
                }
              : {}),
          }}
        >
          {!isMobile && <NavHudFrame intro={playDockIntro && !reduceMotion} />}
          {playDockIntro && !isMobile ? (
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 0,
                pointerEvents: "none",
                zIndex: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-8%",
                  left: "-70%",
                  width: "58%",
                  height: "116%",
                  background:
                    "linear-gradient(100deg, transparent 0%, rgba(165, 240, 255, 0.12) 38%, rgba(255, 255, 255, 0.55) 50%, rgba(165, 240, 255, 0.14) 62%, transparent 100%)",
                  mixBlendMode: "plus-lighter",
                  zIndex: 3,
                  animation:
                    "utzNavDockSweep 0.72s cubic-bezier(0.33, 0.82, 0.2, 0.98) 0.22s both",
                }}
              />
            </div>
          ) : null}
          <div
            style={{
              ...BarStyle.bottomGlow,
              zIndex: 1,
              ...(isMobile
                ? { left: "14%", right: "14%", bottom: -13, height: 22, opacity: 0.3 }
                : {}),
            }}
          />
          <div style={{ ...BarStyle.glassSheen, zIndex: 1 }} />

          {items.map((item, index) => {
            const href =
              item.key === "mypage" ? myHref : `${prefix}${item.href}`;
            const active = pathname === href || pathname.startsWith(href + "/");
            const Icon = item.icon;

            const iconStyle: CSSProperties = active
              ? {
                  animation: isMobile
                    ? "none"
                    : "popActive 0.28s cubic-bezier(0.34, 1.45, 0.64, 1) both",
                  transform: isMobile ? "scale(1.04)" : "scale(1.08)",
                  position: "relative",
                  zIndex: 2,
                  opacity: 1,
                  ...(isMobile
                    ? {
                        filter: "drop-shadow(0 0 6px rgba(186,230,253,0.42))",
                      }
                    : {}),
                }
              : {
                  transform: "scale(0.92)",
                  position: "relative",
                  zIndex: 2,
                  opacity: 0.9,
                };

            const iconEnterDelay = 0.18 + index * 0.065;

            return (
              <Link
                key={item.key}
                href={href}
                className={isMobile ? "touch-manipulation" : undefined}
                style={{
                  ...(isMobile ? BarStyle.linkMobile : BarStyle.linkWeb),
                  position: "relative",
                  zIndex: 3,
                }}
                aria-label={item.label}
                title={item.label}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    ...BarStyle.iconWrap,
                    ...(playDockIntro && !isMobile
                      ? {
                          animation: `utzNavIconIn 0.62s cubic-bezier(0.2, 0.92, 0.24, 1.08) ${iconEnterDelay}s both`,
                        }
                      : {}),
                    ...(isMobile && active
                      ? {
                          background: "transparent",
                          border: "none",
                          animation: "none",
                        }
                      : {}),
                  }}
                >
                  <Icon
                    size={isMobile ? 23 : 24}
                    color={active ? "#ffffff" : "rgba(226,232,240,0.42)"}
                    style={iconStyle}
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );

  return createPortal(navEl, document.body);
}