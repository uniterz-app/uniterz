// app/component/common/SideMenuDrawer.tsx
"use client";

import React from "react";
import cn from "clsx";
import SettingsMenu from "@/app/component/settings/SettingsMenu";

type SideMenuDrawerProps = {
  /** 開いているかどうか */
  open: boolean;
  /** 閉じるときに呼ぶ */
  onClose: () => void;
  /** mobile / web で中身のサイズを少し変える */
  variant?: "mobile" | "web";
};

export default function SideMenuDrawer({
  open,
  onClose,
  variant = "mobile",
}: SideMenuDrawerProps) {
  const isMobile = variant === "mobile";
  return (
    <>
      <style>{`
        @keyframes sideMenuPanelIn {
          0% {
            opacity: 0;
            transform: translateX(-18px) scale(0.985);
            filter: blur(8px);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
            filter: blur(0);
          }
        }
        @keyframes sideMenuGridSweep {
          0% {
            opacity: 0;
            transform: translateX(-22px);
          }
          100% {
            opacity: 0.18;
            transform: translateX(0);
          }
        }
        @keyframes sideMenuOrbDrift {
          0% {
            transform: translate(-8%, -6%) scale(0.92);
            opacity: 0.2;
          }
          50% {
            transform: translate(10%, 8%) scale(1.06);
            opacity: 0.34;
          }
          100% {
            transform: translate(-8%, -6%) scale(0.92);
            opacity: 0.2;
          }
        }
        @keyframes sideMenuScanline {
          0% {
            transform: translateY(-120%);
            opacity: 0;
          }
          15% {
            opacity: 0.18;
          }
          100% {
            transform: translateY(240%);
            opacity: 0;
          }
        }
      `}</style>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] transition-opacity duration-250",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50",
          "transition-transform duration-300 ease-out",
          open ? (isMobile ? "-translate-x-4" : "-translate-x-2") : "-translate-x-full",
        )}
      >
        <div className="h-full pl-0 pr-2 pt-3 pb-0 sm:pr-3 sm:pt-4 sm:pb-0">
          <div
            className={cn(
              "relative h-full overflow-y-auto overflow-x-hidden border border-white/12 bg-[#071326]/68 shadow-[0_22px_56px_rgba(0,0,0,0.46),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl",
              isMobile ? "w-[52vw] min-w-[280px] max-w-[340px] -ml-2" : "w-[min(420px,38vw)]",
            )}
            style={{
              clipPath:
                "polygon(14px 0%, calc(100% - 14px) 0%, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0% calc(100% - 14px), 0% 14px)",
              borderRadius: 0,
              animation: open
                ? "sideMenuPanelIn 0.34s cubic-bezier(0.2, 0.9, 0.2, 1) both"
                : undefined,
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-[8px] border border-white/10 opacity-90"
              style={{
                clipPath:
                  "polygon(10px 0%, calc(100% - 10px) 0%, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0% calc(100% - 10px), 0% 10px)",
              }}
            />
            <div aria-hidden className="pointer-events-none absolute left-1 top-6 h-10 w-[2px] bg-sky-200/35" />
            <div aria-hidden className="pointer-events-none absolute left-1 bottom-6 h-10 w-[2px] bg-sky-200/35" />
            <div aria-hidden className="pointer-events-none absolute right-1 top-6 h-10 w-[2px] bg-sky-200/35" />
            <div aria-hidden className="pointer-events-none absolute right-1 bottom-6 h-10 w-[2px] bg-sky-200/35" />
            <div aria-hidden className="pointer-events-none absolute left-8 bottom-1 h-[2px] w-10 bg-sky-200/45" />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-3xl opacity-[0.18]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)",
                backgroundSize: "26px 26px, 26px 26px",
                animation: open
                  ? "sideMenuGridSweep 0.46s ease-out both"
                  : undefined,
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -left-10 top-16 h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl"
              style={{ animation: "sideMenuOrbDrift 7.2s ease-in-out infinite" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute right-[-72px] bottom-28 h-52 w-52 rounded-full bg-sky-300/16 blur-3xl"
              style={{ animation: "sideMenuOrbDrift 8.4s ease-in-out infinite reverse" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-b from-cyan-200/10 to-transparent"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-2 top-0 h-10"
              style={{
                background:
                  "linear-gradient(180deg, rgba(125,211,252,0.22) 0%, rgba(125,211,252,0.06) 55%, rgba(125,211,252,0) 100%)",
                animation: "sideMenuScanline 3.6s ease-in-out infinite",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-3 top-2 h-px bg-white/25"
            />
            <SettingsMenu onRequestCloseMenu={onClose} />
          </div>
        </div>
      </div>
    </>
  );
}
