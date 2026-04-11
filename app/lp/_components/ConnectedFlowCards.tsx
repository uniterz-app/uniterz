"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { LPConnectedFlowNode } from "./lp-data";

/** 1 ステップあたりの表示時間（ms） */
const STEP_MS = 2200;

export default function ConnectedFlowCards({
  nodes,
  /** false のときカードの自動切替・横スクロール追従を止める（モバイル LP 用） */
  autoAdvance = true,
}: {
  nodes: readonly LPConnectedFlowNode[];
  autoAdvance?: boolean;
}) {
  const [active, setActive] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  /** 初回マウントの scrollIntoView でページ縦スクロールがずれるのを防ぐ */
  const skipScrollIntoViewOnce = useRef(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!autoAdvance || reduceMotion) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % nodes.length);
    }, STEP_MS);
    return () => clearInterval(id);
  }, [autoAdvance, nodes.length, reduceMotion]);

  // モバイル横スクロール時、アクティブカードが見える位置へ（LP 初回表示では実行しない）
  useEffect(() => {
    if (!autoAdvance || reduceMotion) return;
    if (typeof window === "undefined" || window.innerWidth >= 1024) return;
    if (skipScrollIntoViewOnce.current) {
      skipScrollIntoViewOnce.current = false;
      return;
    }
    const el = itemRefs.current[active];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active, autoAdvance, reduceMotion]);

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-none snap-x snap-mandatory max-lg:min-h-[248px] lg:mx-0 lg:aspect-video lg:w-full lg:min-h-0 lg:gap-2 lg:overflow-visible lg:px-0 lg:pb-0 lg:snap-none xl:gap-2.5">
        {nodes.map((node, index) => {
          const isActive = autoAdvance && active === index;
          const cardSurface = !autoAdvance
            ? "z-0 scale-100 border-white/12 opacity-100 shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
            : isActive
              ? "z-1 scale-[1.03] border-cyan-300/50 shadow-[0_0_28px_rgba(103,232,249,0.42),0_0_72px_rgba(34,211,238,0.14)] opacity-100"
              : "z-0 scale-100 border-white/10 opacity-[0.88] shadow-[0_18px_40px_rgba(0,0,0,0.18)]";
          return (
            <div
              key={node.id}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              className="relative min-w-[min(260px,85vw)] shrink-0 snap-center rounded-[22px] max-lg:max-w-[min(280px,85vw)] lg:min-w-0 lg:flex-1 lg:shrink lg:snap-none"
            >
              <div
                className={[
                  "relative flex h-full min-h-[240px] flex-col overflow-hidden rounded-[22px] border bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-4 py-5 transition-[transform,box-shadow,border-color,opacity] duration-500 ease-out max-lg:min-h-[248px] lg:min-h-0 lg:px-2.5 lg:py-3 xl:px-3 xl:py-3.5",
                  cardSurface,
                ].join(" ")}
              >
                <div className="mx-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-[12px] font-bold tracking-[0.18em] text-cyan-200 lg:h-8 lg:w-8 lg:text-[10px] xl:h-9 xl:w-9 xl:text-[11px]">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300/74 sm:tracking-[0.22em] lg:mt-2 lg:text-[8px] lg:tracking-[0.12em] xl:text-[9px]">
                  {node.label}
                </div>

                <div className="mt-2 min-h-0 text-center text-base font-bold leading-tight text-white lg:text-[11px] xl:text-xs xl:leading-snug">
                  <span className="line-clamp-3">{node.title}</span>
                </div>

                <div className="mt-2 min-h-0 flex-1 text-center text-[13px] leading-snug text-white/56 lg:text-[9px] lg:leading-tight xl:text-[10px] xl:leading-snug">
                  <span className="line-clamp-4 lg:line-clamp-5 xl:line-clamp-6">
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
            </div>
          );
        })}
      </div>

      <div className="relative mt-5 lg:mt-4" aria-hidden>
        <div className="h-px w-full bg-linear-to-r from-cyan-300/50 via-cyan-300/20 to-transparent" />
      </div>
    </>
  );
}
