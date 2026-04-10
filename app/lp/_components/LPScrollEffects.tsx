"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let isRegistered = false;

function registerPluginOnce() {
  if (isRegistered) return;
  gsap.registerPlugin(ScrollTrigger);
  isRegistered = true;
}

type LPScrollEffectsProps = {
  /** true のとき GSAP を一切起動しない（モバイルLPの安定化用） */
  disabled?: boolean;
};

export default function LPScrollEffects({ disabled = false }: LPScrollEffectsProps) {
  useEffect(() => {
    if (disabled) return;
    if (typeof window === "undefined") return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    if (reduceMotion) return;

    registerPluginOnce();

    let ctx: ReturnType<typeof gsap.context> | null = null;
    const raf = window.requestAnimationFrame(() => {
      ctx = gsap.context(() => {
      const staggerGroups = gsap.utils.toArray<HTMLElement>(
        "[data-lp-stagger-group]"
      );
      const groupedItems = new Set<HTMLElement>();

      staggerGroups.forEach((group) => {
        const items = Array.from(
          group.querySelectorAll<HTMLElement>("[data-lp-stagger-item]")
        );
        if (!items.length) return;

        items.forEach((item) => groupedItems.add(item));

        const variant = group.dataset.lpStaggerVariant ?? "up";
        const isFlow = variant === "flow";
        const step = Number(group.dataset.lpStaggerStep ?? "0.08");
        const duration = isFlow
          ? isMobile
            ? 0.58
            : 0.74
          : isMobile
            ? 0.48
            : 0.58;
        const fromState: gsap.TweenVars = {
          opacity: 0,
          y: isMobile ? 14 : 20,
          x: 0,
          scale: 0.99,
        };

        if (variant === "left") {
          fromState.x = isMobile ? -12 : -18;
          fromState.y = 0;
        }

        if (variant === "right") {
          fromState.x = isMobile ? 12 : 18;
          fromState.y = 0;
        }

        if (variant === "zoom") {
          fromState.scale = 0.95;
          fromState.y = isMobile ? 8 : 12;
        }

        // Connected Flow：左から順に光＋スケールアップ
        if (isFlow) {
          fromState.x = 0;
          fromState.y = isMobile ? 18 : 24;
          fromState.scale = 0.86;
          fromState.boxShadow = "0 0 0 rgba(34,211,238,0)";
        }

        const staggerMs = Number.isFinite(step)
          ? Math.max(step, isFlow ? 0.11 : 0.05)
          : isFlow
            ? 0.13
            : 0.08;

        items.forEach((item) => {
          item.style.willChange = isFlow
            ? "transform, opacity, box-shadow"
            : "transform, opacity";
        });

        const toVars: gsap.TweenVars = {
          opacity: 1,
          y: 0,
          x: 0,
          scale: 1,
          duration,
          ease: isFlow ? "back.out(1.45)" : "power2.out",
          stagger: staggerMs,
          scrollTrigger: {
            trigger: group,
            start: isMobile ? "top 88%" : "top 82%",
            toggleActions: "play none none none",
            once: true,
          },
          onComplete: () => {
            items.forEach((item) => {
              item.style.willChange = "auto";
            });
          },
        };

        if (isFlow) {
          toVars.boxShadow =
            "0 0 28px rgba(103,232,249,0.45), 0 0 72px rgba(34,211,238,0.18)";
        }

        gsap.fromTo(items, fromState, toVars);
      });

      const targets = gsap
        .utils.toArray<HTMLElement>("[data-lp-animate]")
        .filter((target) => !groupedItems.has(target));

      targets.forEach((target, index) => {
        const variant = target.dataset.lpAnimate ?? "up";
        const duration = isMobile ? 0.44 : 0.56;
        const fromState: gsap.TweenVars = {
          opacity: 0,
          y: isMobile ? 18 : 28,
          x: 0,
          scale: 0.985,
          rotateX: 0,
        };

        if (variant === "left") {
          fromState.x = isMobile ? -16 : -28;
          fromState.y = 0;
        }

        if (variant === "right") {
          fromState.x = isMobile ? 16 : 28;
          fromState.y = 0;
        }

        if (variant === "zoom") {
          fromState.scale = 0.95;
          fromState.y = isMobile ? 10 : 16;
          fromState.rotateX = isMobile ? 0 : 6;
        }

        target.style.willChange = "transform, opacity";

        gsap.fromTo(
          target,
          fromState,
          {
            opacity: 1,
            y: 0,
            x: 0,
            scale: 1,
            rotateX: 0,
            duration,
            delay: Math.min(index * 0.05, 0.2),
            ease: "power2.out",
            scrollTrigger: {
              trigger: target,
              start: isMobile ? "top 86%" : "top 80%",
              toggleActions: "play none none none",
              once: true,
            },
            onComplete: () => {
              target.style.willChange = "auto";
            },
          }
        );
      });
      });
      ScrollTrigger.refresh();
    });

    return () => {
      window.cancelAnimationFrame(raf);
      ctx?.revert();
    };
  }, [disabled]);

  return null;
}
