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
      const targets = gsap.utils.toArray<HTMLElement>("[data-lp-animate]");

      targets.forEach((target, index) => {
        const variant = target.dataset.lpAnimate ?? "up";
        const duration = isMobile ? 0.5 : 0.65;
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
              start: "top 84%",
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
