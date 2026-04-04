"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GiCrossedSwords } from "react-icons/gi";
import { FaTrophy } from "react-icons/fa";
import { FiUser } from "react-icons/fi";
import { Brain } from "lucide-react";
import { useEffect, useLayoutEffect, useState, CSSProperties } from "react";
import { createPortal } from "react-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { PiChartBarFill } from "react-icons/pi";

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
    icon: PiChartBarFill,
  },
  { key: "mypage", href: "/mypage", label: "マイページ", icon: FiUser },
];

const BarStyle = {
  wrap: {
    position: "fixed",
    left: "50%",
    bottom: "calc(12px + env(safe-area-inset-bottom))",
    transform: "translateX(-50%)",
    zIndex: 999999,
    width: "min(960px, 92vw)",
    pointerEvents: "none",
  } as CSSProperties,

  // ページ背景（#0c0d12 付近）・カード（#1a1e2b 付近）に寄せ、シアン強調は抑える
  barMobile: {
    position: "relative",
    overflow: "hidden",
    background:
      "linear-gradient(180deg, rgba(32,36,48,0.78) 0%, rgba(14,16,22,0.86) 100%)",
    borderRadius: 30,
    padding: "9px 20px",
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 12,
    border: "1px solid rgba(255,255,255,0.09)",
    boxShadow:
      "0 12px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
    backdropFilter: "saturate(105%) blur(10px)",
    WebkitBackdropFilter: "saturate(105%) blur(10px)",
    pointerEvents: "auto",
    isolation: "isolate",
  } as CSSProperties,

  barWeb: {
    position: "relative",
    overflow: "hidden",
    background:
      "linear-gradient(180deg, rgba(32,36,48,0.74) 0%, rgba(14,16,22,0.84) 100%)",
    borderRadius: 28,
    padding: "10px 16px",
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 8,
    border: "1px solid rgba(255,255,255,0.085)",
    boxShadow:
      "0 12px 32px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.055)",
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
      "linear-gradient(180deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.018) 30%, rgba(255,255,255,0.00) 48%)",
  } as CSSProperties,

  glowRing: {
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    pointerEvents: "none",
    boxShadow:
      "inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 0 14px rgba(0,0,0,0.25)",
  } as CSSProperties,

  edgeGlow: {
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    pointerEvents: "none",
    background:
      "radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 24%, rgba(255,255,255,0.00) 58%)",
    filter: "blur(10px)",
    opacity: 0.65,
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
    padding: "8px 0",
    borderRadius: 16,
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
    borderRadius: 16,
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
    width: 38,
    height: 38,
    borderRadius: "50%",
    overflow: "visible",
    lineHeight: 0,
  } as CSSProperties,
};

export default function NavBar() {
  const pathname = usePathname() ?? "";

  const isMobile =
    pathname.startsWith("/mobile") || pathname.startsWith("/m/");
  const prefix: "/web" | "/mobile" = isMobile ? "/mobile" : "/web";

  const shouldHide =
    pathname === "/" ||
    pathname === "/web" ||
    pathname === "/mobile" ||
    pathname.startsWith("/lp") ||
    pathname === "/web/login" ||
    pathname === "/web/signup" ||
    pathname === "/mobile/login" ||
    pathname === "/mobile/signup";

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
        const snap = await getDoc(doc(db, "users", user.uid));
        const h = snap.data()?.handle || snap.data()?.slug;
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
            clip-path: inset(18% 40% 18% 40% round 999px);
            transform: translateY(48px) scale(0.88) rotateX(10deg);
            filter: blur(12px) saturate(0.85);
            box-shadow:
              0 32px 70px rgba(0, 0, 0, 0.6),
              0 0 0 rgba(34, 211, 238, 0),
              inset 0 1px 0 rgba(255, 255, 255, 0.03);
          }
          28% {
            opacity: 1;
            clip-path: inset(4% 8% 4% 8% round 28px);
            filter: blur(3px) saturate(1.05);
            transform: translateY(-8px) scale(1.04) rotateX(2deg);
            box-shadow:
              0 24px 56px rgba(0, 0, 0, 0.45),
              0 0 56px rgba(34, 211, 238, 0.38),
              0 0 100px rgba(56, 189, 248, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
          }
          48% {
            clip-path: inset(0 0 0 0 round 28px);
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
            clip-path: inset(0 0 0 0 round 28px);
            filter: blur(0) saturate(1);
            transform: translateY(0) scale(1) rotateX(0deg);
            box-shadow:
              0 12px 32px rgba(0, 0, 0, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.06);
          }
        }
        @keyframes utzNavDockSweep {
          0% {
            transform: translateX(-130%) skewX(-20deg);
            opacity: 0;
          }
          8% {
            opacity: 1;
          }
          100% {
            transform: translateX(240%) skewX(-20deg);
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
            ...(playDockIntro
              ? {
                  animation:
                    "utzNavDockIn 0.84s cubic-bezier(0.15, 1, 0.28, 1) both",
                  transformStyle: "preserve-3d" as const,
                }
              : {}),
          }}
        >
          {playDockIntro ? (
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                pointerEvents: "none",
                zIndex: 1,
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
                  animation:
                    "utzNavDockSweep 0.72s cubic-bezier(0.33, 0.82, 0.2, 0.98) 0.22s both",
                }}
              />
            </div>
          ) : null}
          <div style={BarStyle.edgeGlow} />
          <div style={BarStyle.bottomGlow} />
          <div style={BarStyle.glassSheen} />
          <div style={BarStyle.glowRing} />

          {items.map((item, index) => {
            const href =
              item.key === "mypage" ? myHref : `${prefix}${item.href}`;
            const active = pathname === href || pathname.startsWith(href + "/");
            const Icon = item.icon;

            const iconStyle: CSSProperties = active
              ? {
                  animation:
                    "popActive 0.28s cubic-bezier(0.34, 1.45, 0.64, 1) both",
                  transform: "scale(1.08)",
                  position: "relative",
                  zIndex: 2,
                  opacity: 1,
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
                    ...(playDockIntro
                      ? {
                          animation: `utzNavIconIn 0.62s cubic-bezier(0.2, 0.92, 0.24, 1.08) ${iconEnterDelay}s both`,
                        }
                      : {}),
                  }}
                >
                  <Icon
                    size={isMobile ? 26 : 24}
                    color={active ? "#ffffff" : "rgba(255,255,255,0.38)"}
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