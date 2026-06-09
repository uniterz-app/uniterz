"use client";

import Link from "next/link";
import { useEffect } from "react";

type LpV2FooterProps = {
  mobile?: boolean;
};

/** マルモニカ（ZeoSeven 配信・商用利用可） */
const MARUMONICA_FAMILY = '"x12y16pxMaruMonica", ui-monospace, monospace';
const MARUMONICA_CSS =
  "https://fontsapi.zeoseven.com/637/main/result.css";

const linkBase =
  "text-[14px] font-normal tracking-wide text-cyan-100/88 underline-offset-[5px] transition sm:text-[15px] " +
  "hover:text-cyan-200 hover:underline hover:decoration-cyan-400/80 " +
  "hover:drop-shadow-[0_0_10px_rgba(34,211,238,0.45)] " +
  "leading-snug";

export default function LpV2Footer({ mobile = false }: LpV2FooterProps) {
  useEffect(() => {
    const idCss = "lp-v2-marumonica-font-css";
    const idPre = "lp-v2-marumonica-font-preconnect";
    if (document.getElementById(idCss)) return;
    const pre = document.createElement("link");
    pre.id = idPre;
    pre.rel = "preconnect";
    pre.href = "https://fontsapi.zeoseven.com";
    document.head.appendChild(pre);
    const link = document.createElement("link");
    link.id = idCss;
    link.rel = "stylesheet";
    link.href = MARUMONICA_CSS;
    document.head.appendChild(link);
  }, []);

  const base = mobile ? "/mobile" : "/web";
  const links = [
    { href: `${base}/help`, label: "ヘルプ" },
    { href: `${base}/privacy`, label: "プライバシーポリシー" },
    { href: `${base}/terms`, label: "利用規約" },
    { href: `${base}/electronic-notice`, label: "電子公告" },
    { href: `${base}/contact`, label: "お問い合わせ" },
  ] as const;

  const year = new Date().getFullYear();

  return (
    <footer
      className={
        mobile
          ? "relative z-10 mt-8 w-full px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-10"
          : "relative z-10 mt-16 w-full px-6 pb-16 pt-12 lg:px-10"
      }
      style={{ fontFamily: MARUMONICA_FAMILY }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(4,14,28,0.55)_0%,rgba(2,8,18,0.92)_55%,rgba(1,4,12,0.98)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-400/70 to-transparent shadow-[0_0_16px_rgba(34,211,238,0.5)]"
        aria-hidden
      />

      <div
        className={`relative mx-auto max-w-[1360px] ${
          mobile
            ? "flex flex-col items-stretch gap-8"
            : "flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-12"
        }`}
      >
        {/* 公式アカウント等がないため余白（参照レイアウトの左ブロック相当） */}
        <div
          className={
            mobile
              ? "min-h-6 shrink-0 sm:min-h-8"
              : "hidden min-h-18 shrink-0 lg:block lg:min-w-48 xl:min-w-64"
          }
          aria-hidden
        />

        <nav
          className={
            mobile
              ? "flex flex-col items-center gap-2.5"
              : "flex flex-col items-end gap-2.5 lg:ml-auto lg:text-right"
          }
          aria-label="フッターリンク"
        >
          {links.map(({ href, label }) => (
            <Link key={href} href={href} className={linkBase}>
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <p
        className={`relative mx-auto mt-10 max-w-[1360px] text-center text-[12px] leading-relaxed text-cyan-200/40 sm:text-[13px] ${
          mobile ? "" : "lg:text-right"
        }`}
      >
        © {year} UNITERZ. All rights reserved.
      </p>
    </footer>
  );
}
