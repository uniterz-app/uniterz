"use client";

import Image from "next/image";
import Link from "next/link";

const NAV_ITEMS = [
  { label: "Features", href: "#features" },
  { label: "Metrics", href: "#metrics" },
  { label: "Plans", href: "#plans" },
  { label: "Contact", href: "#signup" },
] as const;

export default function LPHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-cyan-300/10 bg-[rgba(3,7,15,0.72)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-300/28 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]" />
      <div className="pointer-events-none absolute left-0 top-0 h-full w-[26%] bg-[radial-gradient(circle_at_left,rgba(34,211,238,0.10),transparent_70%)]" />

      <div className="relative mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-10">
        <Link
          href="/lp"
          className="group flex shrink-0 items-center gap-3 sm:gap-4"
        >
          <div className="relative h-8 w-8 shrink-0 sm:h-9 sm:w-9">
            <div className="absolute inset-0 rounded-full bg-cyan-300/10 blur-md transition duration-300 group-hover:bg-cyan-300/16" />
            <Image
              src="/logo/logo.png"
              alt="Uniterz logo"
              fill
              priority
              className="object-contain drop-shadow-[0_0_18px_rgba(34,211,238,0.28)] transition duration-300 group-hover:scale-[1.03]"
            />
          </div>

          <div className="flex flex-col leading-none">
            <span className="text-[21px] font-semibold tracking-[-0.03em] text-white">
              Uniterz
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.22em] text-cyan-200/48 sm:block">
              Sports Prediction Platform
            </span>
          </div>
        </Link>

        <div className="ml-auto flex items-center gap-6 lg:gap-8">
          <nav className="hidden items-center gap-7 lg:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="relative text-[14px] font-medium tracking-[-0.01em] text-white/64 transition duration-200 hover:text-white"
              >
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="hidden h-6 w-px bg-white/10 lg:block" />

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/web/login"
              className="hidden text-[14px] font-medium tracking-[-0.01em] text-white/68 transition duration-200 hover:text-white sm:inline-flex"
            >
              Log in
            </Link>

            <Link
              href="#signup"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/12 bg-white px-5 text-[14px] font-semibold tracking-[-0.01em] text-[#05070b] shadow-[0_8px_30px_rgba(255,255,255,0.14)] transition duration-200 hover:-translate-y-[1px] hover:bg-white/92"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}