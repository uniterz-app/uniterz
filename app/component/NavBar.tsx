"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GiCrossedSwords } from "react-icons/gi";
import { FaTrophy, FaUsers } from "react-icons/fa";
import { FiUser } from "react-icons/fi";
import { Brain } from "lucide-react";
import { useEffect, useLayoutEffect, useState, CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserDocDataCached } from "@/lib/user/userDocCache";
import { isProfileSetupRoute } from "@/lib/profileSetupRoute";
import { useNavTabNotificationBadges } from "@/lib/hooks/useNavTabNotificationBadges";
import NavBarNotificationDot from "@/app/component/NavBarNotificationDot";
import { prefetchCumulativeRankingsList } from "@/lib/rankings/useCumulativeRankingsBulk";

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

const items: Item[] = [
  { key: "games", href: "/games", label: "試合", icon: GiCrossedSwords },
  { key: "home", href: "/result", label: "リザルト", icon: Brain },
  { key: "ranking", href: "/rankings", label: "ランキング", icon: FaTrophy },
  {
    key: "leaderboards",
    href: "/leaderboards",
    label: "リーダーボード",
    icon: FaUsers,
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
    borderRadius: 0,
    clipPath: NAV_DOCK_CLIP,
    WebkitClipPath: NAV_DOCK_CLIP,
    padding: "8px 14px",
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 6,
    border: "none",
    boxShadow:
      "0 14px 24px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.04)",
    backdropFilter: "saturate(106%) blur(4px)",
    WebkitBackdropFilter: "saturate(106%) blur(4px)",
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
      "0 14px 36px rgba(0,0,0,0.52)",
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

  const { showRankingBadge, showResultBadge } = useNavTabNotificationBadges({
    enabled: mounted && !shouldHide,
    pathname,
    prefix,
  });

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
            box-shadow:
              0 32px 70px rgba(0, 0, 0, 0.6),
              0 0 0 rgba(34, 211, 238, 0),
              inset 0 1px 0 rgba(255, 255, 255, 0.03);
          }
          28% {
            opacity: 1;
            transform: translateY(-8px) scale(1.04) rotateX(2deg);
            box-shadow:
              0 24px 56px rgba(0, 0, 0, 0.45),
              0 0 56px rgba(34, 211, 238, 0.38),
              0 0 100px rgba(56, 189, 248, 0.15),
              0 0 0 1px rgba(34, 211, 238, 0.22),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
          }
          48% {
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
            filter: drop-shadow(0 0 0 rgba(103, 232, 249, 0));
          }
          38% {
            opacity: 1;
            transform: translateY(-10px) scale(1.14) rotate(2deg);
            filter: drop-shadow(0 0 12px rgba(103, 232, 249, 0.55));
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
            filter: drop-shadow(0 0 0 rgba(103, 232, 249, 0));
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
          {!isMobile ? (
            <div style={{ ...BarStyle.bottomGlow, zIndex: 1 }} />
          ) : null}
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
                    : "popActive 0.28s cubic-bezier(0.22, 1, 0.36, 1) both",
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
                onPointerEnter={
                  item.key === "ranking"
                    ? () => prefetchCumulativeRankingsList()
                    : undefined
                }
                onTouchStart={
                  item.key === "ranking"
                    ? () => prefetchCumulativeRankingsList()
                    : undefined
                }
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
                  {item.key === "ranking" && showRankingBadge ? (
                    <NavBarNotificationDot />
                  ) : null}
                  {item.key === "home" && showResultBadge ? (
                    <NavBarNotificationDot />
                  ) : null}
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