"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GiCrossedSwords } from "react-icons/gi";
import { FaTrophy } from "react-icons/fa";
import { FiTrendingUp, FiUser } from "react-icons/fi";
import { Brain } from "lucide-react";
import { useEffect, useState, CSSProperties } from "react";
import { createPortal } from "react-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type Item = {
  href: string;
  key: "games" | "home" | "trend" | "ranking" | "mypage";
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
  { key: "trend", href: "/trend", label: "トレンド", icon: FiTrendingUp },
  { key: "ranking", href: "/rankings", label: "ランキング", icon: FaTrophy },
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
    padding: "14px 20px",
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow:
      "0 10px 28px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(80,220,255,0.06), 0 0 18px rgba(80,220,255,0.07)",
    backdropFilter: "saturate(135%) blur(8px)",
    WebkitBackdropFilter: "saturate(135%) blur(8px)",
    pointerEvents: "auto",
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
      "0 10px 28px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 1px rgba(80,220,255,0.05), 0 0 14px rgba(80,220,255,0.05)",
    backdropFilter: "saturate(135%) blur(7px)",
    WebkitBackdropFilter: "saturate(135%) blur(7px)",
    pointerEvents: "auto",
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
      "inset 0 0 0 1px rgba(120,240,255,0.10), inset 0 0 12px rgba(80,220,255,0.05), 0 0 12px rgba(70,210,255,0.06)",
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
};

export default function NavBar() {
  const pathname = usePathname() ?? "";
  const isMobile =
    pathname.startsWith("/mobile") || pathname.startsWith("/m/");
  const prefix: "/web" | "/mobile" = isMobile ? "/mobile" : "/web";

  const [mounted, setMounted] = useState(false);
  const [myHref, setMyHref] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (
    pathname === "/web/login" ||
    pathname === "/web/signup" ||
    pathname === "/mobile/login" ||
    pathname === "/mobile/signup"
  ) {
    return null;
  }

  useEffect(() => {
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
  }, [prefix]);

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
          <div style={BarStyle.glassSheen} />
          <div style={BarStyle.glowRing} />

          {items.map((item) => {
            const href = item.key === "mypage" ? myHref : `${prefix}${item.href}`;
            const active = pathname === href || pathname.startsWith(href + "/");
            const Icon = item.icon;

            const iconStyle: CSSProperties = active
              ? {
                  animation: "popActive 0.24s ease",
                  transform: "scale(1.08)",
                  filter: "drop-shadow(0 0 3px rgba(255,255,255,0.7))",
                }
              : { transform: "scale(0.92)" };

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
                <Icon
                  size={isMobile ? 26 : 24}
                  color={active ? "#ffffff" : "rgba(255,255,255,0.45)"}
                  style={iconStyle}
                />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );

  return createPortal(navEl, document.body);
}