"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GiCrossedSwords } from "react-icons/gi";
import { FaTrophy, FaBrain } from "react-icons/fa";
import { FiTrendingUp, FiUser } from "react-icons/fi";
import { useEffect, useState, CSSProperties } from "react";
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
  { key: "home", href: "/home", label: "ホーム", icon: FaBrain },
  { key: "trend", href: "/trend", label: "トレンド", icon: FiTrendingUp },
  { key: "ranking", href: "/rankings", label: "ランキング", icon: FaTrophy },
  { key: "mypage", href: "/mypage", label: "マイページ", icon: FiUser },
];

const BarStyle = {
  wrap: {
    position: "fixed",
    left: "50%",
    bottom: 16,
    transform: "translateX(-50%)",
    zIndex: 50,
    width: "min(960px, 92vw)",
    paddingBottom: "env(safe-area-inset-bottom)",
  } as CSSProperties,
  barMobile: {
    background: "#0a3b47",
    borderRadius: 30,
    padding: "14px 20px",
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 12,
    boxShadow:
      "0 10px 28px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,0.08)",
    backdropFilter: "saturate(140%) blur(6px)",
  } as CSSProperties,
  barWeb: {
    background: "#0a3b47",
    borderRadius: 28,
    padding: "10px 16px",
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 8,
    boxShadow:
      "0 10px 28px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,0.08)",
    backdropFilter: "saturate(140%) blur(6px)",
  } as CSSProperties,
  linkMobile: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 0",
    borderRadius: 16,
    textDecoration: "none",
    transition: "transform .15s ease-out",
  } as CSSProperties,
  linkWeb: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 0",
    borderRadius: 16,
    textDecoration: "none",
    transition: "transform .15s ease-out",
  } as CSSProperties,
};

export default function NavBar() {
  const pathname = usePathname();

  const shouldShow =
    pathname?.startsWith("/web") || pathname?.startsWith("/mobile");

  const isAuthPage =
    pathname === "/web/login" ||
    pathname === "/web/signup" ||
    pathname === "/mobile/login" ||
    pathname === "/mobile/signup";

  const isMobile = pathname?.startsWith("/mobile");
  const prefix: "/web" | "/mobile" = isMobile ? "/mobile" : "/web";

  const [myHref, setMyHref] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setMyHref(`${prefix}/u/guest`);
        setInitialized(true);
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));
      const h = snap.data()?.handle || snap.data()?.slug;

      setMyHref(
        h ? `${prefix}/u/${encodeURIComponent(h)}` : `${prefix}/mypage`
      );
      setInitialized(true);
    });

    return () => unsub();
  }, [prefix]);

  if (!shouldShow || isAuthPage || !initialized) return null;

  return (
    <>
      <style>{`
        @keyframes popActive {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.18); }
          100% { transform: scale(1.08); }
        }
      `}</style>

      <nav style={BarStyle.wrap}>
        <div style={isMobile ? BarStyle.barMobile : BarStyle.barWeb}>
          {items.map((item) => {
            const href =
              item.key === "mypage"
                ? myHref!
                : `${prefix}${item.href}`;

            const active =
              pathname === href || pathname.startsWith(href + "/");

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
                style={isMobile ? BarStyle.linkMobile : BarStyle.linkWeb}
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
}
