"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GiCrossedSwords } from "react-icons/gi";
import { FaTrophy } from "react-icons/fa";
import { FiUser } from "react-icons/fi";
import { Brain } from "lucide-react";
import { useEffect, useState, CSSProperties } from "react";
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

  barMobile: {
    position: "relative",
    overflow: "hidden",
    background: "rgba(8, 30, 38, 0.55)",
    borderRadius: 30,
    padding: "9px 20px",
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow:
      "0 10px 28px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(80,220,255,0.04)",
    backdropFilter: "saturate(135%) blur(8px)",
    WebkitBackdropFilter: "saturate(135%) blur(8px)",
    pointerEvents: "auto",
    isolation: "isolate",
  } as CSSProperties,

  barWeb: {
    position: "relative",
    overflow: "hidden",
    background: "rgba(8, 30, 38, 0.52)",
    borderRadius: 28,
    padding: "10px 16px",
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 8,
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow:
      "0 10px 28px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 1px rgba(80,220,255,0.035)",
    backdropFilter: "saturate(135%) blur(7px)",
    WebkitBackdropFilter: "saturate(135%) blur(7px)",
    pointerEvents: "auto",
    isolation: "isolate",
  } as CSSProperties,

  glassSheen: {
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    pointerEvents: "none",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.025) 28%, rgba(255,255,255,0.00) 45%)",
  } as CSSProperties,

  glowRing: {
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    pointerEvents: "none",
    boxShadow:
      "inset 0 0 0 1px rgba(120,240,255,0.08), inset 0 0 10px rgba(80,220,255,0.03)",
  } as CSSProperties,

  edgeGlow: {
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    pointerEvents: "none",
    background:
      "radial-gradient(120% 80% at 50% 0%, rgba(120,240,255,0.10) 0%, rgba(120,240,255,0.04) 22%, rgba(120,240,255,0.00) 58%)",
    filter: "blur(10px)",
    opacity: 0.7,
  } as CSSProperties,

  bottomGlow: {
    position: "absolute",
    left: "8%",
    right: "8%",
    bottom: -10,
    height: 24,
    borderRadius: 999,
    pointerEvents: "none",
    background: "rgba(70,210,255,0.10)",
    filter: "blur(18px)",
    opacity: 0.5,
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
    pathname === "/web/login" ||
    pathname === "/web/signup" ||
    pathname === "/mobile/login" ||
    pathname === "/mobile/signup";

  const [mounted, setMounted] = useState(false);
  const [myHref, setMyHref] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

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

  if (shouldHide) return null;
  if (!mounted || !initialized || !myHref) return null;

  const navEl = (
    <>
      <style>{`
        @keyframes popActive {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.18); }
          100% { transform: scale(1.08); }
        }
      `}</style>

      <nav style={BarStyle.wrap} aria-label="Bottom navigation">
        <div style={isMobile ? BarStyle.barMobile : BarStyle.barWeb}>
          <div style={BarStyle.edgeGlow} />
          <div style={BarStyle.bottomGlow} />
          <div style={BarStyle.glassSheen} />
          <div style={BarStyle.glowRing} />

          {items.map((item) => {
            const href =
              item.key === "mypage" ? myHref : `${prefix}${item.href}`;
            const active = pathname === href || pathname.startsWith(href + "/");
            const Icon = item.icon;

            const iconStyle: CSSProperties = active
              ? {
                  animation: "popActive 0.24s ease",
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

            return (
              <Link
                key={item.key}
                href={href}
                style={{
                  ...(isMobile ? BarStyle.linkMobile : BarStyle.linkWeb),
                  position: "relative",
                  zIndex: 2,
                }}
                aria-label={item.label}
                title={item.label}
              >
                <span style={BarStyle.iconWrap}>
                  <Icon
                    size={isMobile ? 26 : 24}
                    color={active ? "#ffffff" : "rgba(255,255,255,0.45)"}
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