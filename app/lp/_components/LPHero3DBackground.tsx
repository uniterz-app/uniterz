"use client";

export default function LPHero3DBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#05070d]" />
      <div className="absolute inset-x-0 top-0 h-[62vh] bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,0.28),transparent_62%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_48%,rgba(34,211,238,0.2),transparent_22%),radial-gradient(circle_at_64%_56%,rgba(167,139,250,0.14),transparent_26%),radial-gradient(circle_at_32%_36%,rgba(59,130,246,0.12),transparent_28%)]" />
      <div className="lp-depth-far absolute inset-0" />
      <div className="lp-depth-mid absolute inset-0" />
      <div className="lp-depth-near absolute inset-0" />
      <div className="lp-hud-beam lp-hud-beam-a absolute inset-y-0 left-[-18%] w-[36%]" />
      <div className="lp-hud-beam lp-hud-beam-b absolute inset-y-0 right-[-20%] w-[40%]" />
      <div className="lp-hud-grid absolute inset-0" />
      <div className="lp-hud-scan absolute inset-0" />
      <div className="lp-hud-glitch lp-hud-glitch-a absolute inset-0" />
      <div className="lp-hud-glitch lp-hud-glitch-b absolute inset-0" />
      <div className="lp-hud-pulse absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 h-[52vh] bg-[linear-gradient(180deg,rgba(5,7,13,0)_0%,rgba(5,7,13,0.66)_34%,rgba(5,7,13,0.9)_100%)]" />
      <div className="absolute inset-0 bg-[#05070d]/42" />

      <style>{`
        .lp-hud-grid {
          opacity: 0.2;
          background-image:
            linear-gradient(rgba(34, 211, 238, 0.26) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.18) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .lp-depth-far {
          opacity: 0.16;
          transform: perspective(1600px) translateZ(-180px) scale(1.14);
          background-image:
            radial-gradient(circle at 50% 50%, rgba(103, 232, 249, 0.08) 0%, rgba(0, 0, 0, 0) 62%),
            linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.08) 1px, transparent 1px);
          background-size: 100% 100%, 92px 92px, 92px 92px;
          animation: lp-depth-far-float 24s ease-in-out infinite alternate;
        }

        .lp-depth-mid {
          opacity: 0.18;
          transform: perspective(900px) rotateX(62deg) translateY(28%);
          transform-origin: center 78%;
          background-image:
            linear-gradient(rgba(34, 211, 238, 0.16) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.11) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0.18) 0%,
            rgba(0, 0, 0, 0.9) 46%,
            rgba(0, 0, 0, 0) 100%
          );
          animation: lp-depth-mid-slide 11s linear infinite;
        }

        .lp-depth-near {
          opacity: 0.14;
          background-image:
            radial-gradient(circle at 50% 48%, rgba(34, 211, 238, 0.26), rgba(34, 211, 238, 0) 44%),
            radial-gradient(circle at 50% 48%, rgba(167, 139, 250, 0.18), rgba(167, 139, 250, 0) 52%);
          filter: blur(12px);
          animation: lp-depth-near-breathe 8.5s ease-in-out infinite;
        }

        .lp-hud-scan {
          opacity: 0.12;
          background-image: linear-gradient(
            180deg,
            rgba(167, 139, 250, 0.22) 1px,
            transparent 1px
          );
          background-size: 100% 4px;
          animation: lp-hud-scan-drift 9s linear infinite;
        }

        .lp-hud-beam {
          opacity: 0.16;
          mix-blend-mode: screen;
          filter: blur(22px);
          background: linear-gradient(
            90deg,
            rgba(34, 211, 238, 0) 0%,
            rgba(34, 211, 238, 0.45) 46%,
            rgba(34, 211, 238, 0) 100%
          );
        }

        .lp-hud-beam-a {
          transform: skewX(-16deg);
          animation: lp-hud-beam-sweep-a 16s ease-in-out infinite;
        }

        .lp-hud-beam-b {
          transform: skewX(16deg);
          animation: lp-hud-beam-sweep-b 18s ease-in-out infinite;
        }

        .lp-hud-pulse {
          opacity: 0.16;
          mix-blend-mode: screen;
          background: radial-gradient(
            circle at 50% 45%,
            rgba(34, 211, 238, 0.3) 0%,
            rgba(34, 211, 238, 0) 52%
          );
          animation: lp-hud-pulse 7.8s ease-in-out infinite;
        }

        .lp-hud-glitch {
          opacity: 0;
          mix-blend-mode: screen;
          background-image:
            linear-gradient(
              90deg,
              rgba(34, 211, 238, 0) 0%,
              rgba(34, 211, 238, 0.22) 40%,
              rgba(34, 211, 238, 0) 100%
            ),
            linear-gradient(
              90deg,
              rgba(167, 139, 250, 0) 0%,
              rgba(167, 139, 250, 0.18) 60%,
              rgba(167, 139, 250, 0) 100%
            );
        }

        .lp-hud-glitch-a {
          animation: lp-hud-glitch-pulse-a 7.5s steps(1, end) infinite;
        }

        .lp-hud-glitch-b {
          animation: lp-hud-glitch-pulse-b 10.5s steps(1, end) infinite;
        }

        @keyframes lp-hud-scan-drift {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(5px);
          }
        }

        @keyframes lp-depth-far-float {
          0% {
            transform: perspective(1600px) translate3d(0, 0, 0) scale(1.14);
          }
          100% {
            transform: perspective(1600px) translate3d(0, -18px, 0) scale(1.18);
          }
        }

        @keyframes lp-depth-mid-slide {
          0% {
            transform: perspective(900px) rotateX(62deg) translate3d(0, 28%, 0);
          }
          100% {
            transform: perspective(900px) rotateX(62deg) translate3d(-40px, 30%, 0);
          }
        }

        @keyframes lp-depth-near-breathe {
          0%, 100% {
            opacity: 0.1;
            transform: scale(1);
          }
          50% {
            opacity: 0.22;
            transform: scale(1.07);
          }
        }

        @keyframes lp-hud-beam-sweep-a {
          0%, 100% {
            transform: translateX(0) skewX(-16deg);
            opacity: 0.1;
          }
          50% {
            transform: translateX(26%) skewX(-16deg);
            opacity: 0.22;
          }
        }

        @keyframes lp-hud-beam-sweep-b {
          0%, 100% {
            transform: translateX(0) skewX(16deg);
            opacity: 0.08;
          }
          50% {
            transform: translateX(-22%) skewX(16deg);
            opacity: 0.2;
          }
        }

        @keyframes lp-hud-pulse {
          0%, 100% {
            opacity: 0.1;
            transform: scale(1);
          }
          50% {
            opacity: 0.2;
            transform: scale(1.03);
          }
        }

        @keyframes lp-hud-glitch-pulse-a {
          0%, 87%, 100% {
            opacity: 0;
            transform: translateX(0);
          }
          88% {
            opacity: 0.18;
            transform: translateX(-8px);
          }
          89% {
            opacity: 0.1;
            transform: translateX(6px);
          }
          90% {
            opacity: 0;
            transform: translateX(0);
          }
        }

        @keyframes lp-hud-glitch-pulse-b {
          0%, 92%, 100% {
            opacity: 0;
            transform: translateX(0);
          }
          93% {
            opacity: 0.14;
            transform: translateX(7px);
          }
          94% {
            opacity: 0.08;
            transform: translateX(-5px);
          }
          95% {
            opacity: 0;
            transform: translateX(0);
          }
        }

        @media (max-width: 768px) {
          .lp-depth-far {
            opacity: 0.08;
          }
          .lp-depth-mid {
            opacity: 0.08;
            background-size: 84px 84px;
          }
          .lp-depth-near {
            opacity: 0.06;
          }
          .lp-hud-grid {
            opacity: 0.12;
            background-size: 74px 74px;
          }
          .lp-hud-scan {
            opacity: 0.06;
          }
          .lp-hud-beam,
          .lp-hud-pulse {
            opacity: 0.08;
          }
          .lp-hud-glitch {
            opacity: 0 !important;
            animation: none !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .lp-depth-far,
          .lp-depth-mid,
          .lp-depth-near,
          .lp-hud-scan,
          .lp-hud-glitch,
          .lp-hud-beam,
          .lp-hud-pulse {
            animation: none !important;
            transform: none !important;
          }
          .lp-hud-glitch {
            opacity: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
