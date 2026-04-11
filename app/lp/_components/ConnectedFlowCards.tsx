"use client";

import Image from "next/image";
import { type ComponentType } from "react";
import { Brain, PenLine, RefreshCw } from "lucide-react";
import { GiCrossedSwords } from "react-icons/gi";
import { FaMedal, FaTrophy } from "react-icons/fa";
import { FiUser } from "react-icons/fi";
import { PiChartBarFill } from "react-icons/pi";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import type { LPConnectedFlowNode, LPFlowNavIconKey } from "./lp-data";
import { LpFlowPodiumShell } from "./LpFlowPodiumShell";

const FLOW_NAV_ICONS: Record<
  LPFlowNavIconKey,
  ComponentType<{ className?: string; size?: number }>
> = {
  games: GiCrossedSwords,
  home: Brain,
  ranking: FaTrophy,
  leaderboards: PiChartBarFill,
  mypage: FiUser,
  pen: PenLine,
  resultSync: RefreshCw,
  medal: FaMedal,
};

export default function ConnectedFlowCards({
  nodes,
  animated: _animated = true,
}: {
  nodes: readonly LPConnectedFlowNode[];
  animated?: boolean;
}) {
  void _animated;
  return (
    <>
      <div className="flex min-w-0 items-stretch gap-2 overflow-x-auto overflow-y-visible py-6 pb-8 -mx-4 px-4 scrollbar-none snap-x snap-mandatory sm:gap-2.5 lg:mx-0 lg:w-full lg:gap-3 lg:overflow-x-visible lg:overflow-y-visible lg:px-0 lg:py-10 lg:pb-12 lg:snap-none xl:gap-3.5">
        {nodes.map((node, index) => {
          const isStaggerUp = index % 2 === 0;
          const NavIcon =
            "navIconKey" in node && node.navIconKey
              ? FLOW_NAV_ICONS[node.navIconKey]
              : null;
          const staggerClass = isStaggerUp
            ? "-translate-y-5 sm:-translate-y-6 lg:-translate-y-12 xl:-translate-y-14"
            : "translate-y-5 sm:translate-y-6 lg:translate-y-12 xl:translate-y-14";
          return (
            <div
              key={node.id}
              className={[
                "relative flex min-h-0 min-w-[min(240px,82vw)] shrink-0 snap-center flex-col max-lg:max-w-[min(260px,82vw)] transition-transform duration-500 ease-out will-change-transform lg:min-w-0 lg:flex-1 lg:basis-0 lg:shrink lg:snap-none",
                staggerClass,
              ].join(" ")}
            >
              <div
                className={[
                  "mb-1.5 text-center leading-none text-[26px] sm:text-[28px] lg:mb-1.5 lg:text-[44px] xl:text-[52px]",
                  resultStatsMetricNumClass,
                  "bg-linear-to-b from-cyan-100 via-sky-200 to-cyan-500 bg-clip-text text-transparent",
                  "drop-shadow-[0_0_14px_rgba(56,189,248,0.28)]",
                ].join(" ")}
              >
                {String(index + 1).padStart(2, "0")}
              </div>
              <LpFlowPodiumShell>
                <div className="flex min-h-0 flex-1 flex-col px-3.5 py-3.5 sm:px-4 sm:py-4 lg:px-5 lg:py-5 xl:px-6 xl:py-5">
                  <div className="mx-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-cyan-200 sm:h-11 sm:w-11 lg:h-12 lg:w-12 xl:h-14 xl:w-14">
                    {NavIcon ? (
                      <NavIcon
                        className="size-[20px] shrink-0 text-cyan-200 sm:size-[22px] lg:size-[26px] xl:size-[30px]"
                        aria-hidden
                      />
                    ) : (
                      <span className="text-xs font-bold tracking-[0.18em] text-cyan-200 sm:text-[13px] lg:text-sm xl:text-base">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 min-h-0 text-center text-[16px] font-bold leading-snug text-white sm:mt-3 sm:text-[17px] lg:mt-3.5 lg:text-[18px] xl:mt-4 xl:text-[20px] xl:leading-snug">
                    <span className="line-clamp-2 whitespace-pre-line">
                      {node.title}
                    </span>
                  </div>

                  <div className="mt-2 min-h-0 flex-1 text-center text-[14px] leading-snug text-white/60 sm:text-[14px] sm:leading-snug lg:mt-2.5 lg:text-[15px] lg:leading-snug xl:text-[16px] xl:leading-snug">
                    <span className="line-clamp-3 whitespace-pre-line lg:line-clamp-4">
                      {node.text}
                    </span>
                  </div>

                  {node.media.enabled ? (
                    <div className="mt-auto overflow-hidden rounded-lg border border-white/10 bg-white/3 p-0.5 pt-2 lg:rounded-md lg:pt-1.5">
                      {node.media.type === "video" ? (
                        <video
                          src={node.media.src}
                          poster={node.media.poster}
                          aria-label={node.media.alt}
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          className="h-20 w-full rounded-md object-cover lg:h-12 xl:h-14"
                        />
                      ) : (
                        <div className="relative h-20 w-full overflow-hidden rounded-md lg:h-12 xl:h-14">
                          <Image
                            src={node.media.src}
                            alt={node.media.alt}
                            fill
                            sizes="160px"
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </LpFlowPodiumShell>
            </div>
          );
        })}
      </div>
    </>
  );
}
