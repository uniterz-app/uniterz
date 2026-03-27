"use client";

import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let isRegistered = false;

function registerPluginOnce() {
  if (isRegistered) return;
  gsap.registerPlugin(ScrollTrigger);
  isRegistered = true;
}

export default function LPScrollEffects() {
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    if (reduceMotion) return;

    registerPluginOnce();

    const ctx = gsap.context(() => {
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
        const duration = isMobile ? 0.42 : 0.52;
        const step = Number(group.dataset.lpStaggerStep ?? "0.08");
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

        items.forEach((item) => {
          item.style.willChange = "transform, opacity";
        });

        gsap.fromTo(
          items,
          fromState,
          {
            opacity: 1,
            y: 0,
            x: 0,
            scale: 1,
            duration,
            ease: "power2.out",
            stagger: Number.isFinite(step) ? Math.max(step, 0.03) : 0.08,
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
          }
        );
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
            delay: Math.min(index * 0.03, 0.12),
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

    return () => {
      ctx.revert();
    };
  }, []);

  return null;
}
