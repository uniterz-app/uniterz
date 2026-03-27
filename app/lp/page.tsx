import LPHeader from "./_components/LPHeader";
import LPHero from "./_components/LPHero";
import LPFeatures from "./_components/LPFeatures";
import LPMetrics from "./_components/LPMetrics";
import LPPlans from "./_components/LPPlans";
import LPSignupSection from "./_components/LPSignupSection";
import LPHero3DBackground from "./_components/LPHero3DBackground";
import LPScrollEffects from "./_components/LPScrollEffects";

export default function UniterzLPPage() {
  return (
    <main className="lp-root relative min-h-screen overflow-x-hidden bg-transparent text-white [animation:lp-page-enter_.75s_cubic-bezier(.22,.61,.36,1)_both]">
      <LPScrollEffects />
      <LPHero3DBackground />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(4,244,255,0.1),transparent_38%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:84px_84px]" />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_16%_8%,rgba(56,189,248,0.14),transparent_24%),radial-gradient(circle_at_84%_10%,rgba(34,211,238,0.12),transparent_24%)] opacity-0 [animation:lp-impact-glow_1.25s_ease-out_.04s_forwards]" />
      <div className="pointer-events-none fixed inset-y-0 left-[-34%] z-[1] w-[42%] bg-[linear-gradient(90deg,transparent,rgba(148,241,255,0.06),transparent)] blur-2xl [animation:lp-impact-sweep_1.05s_cubic-bezier(.2,.7,.3,1)_both]" />

      <LPHeader />
      <LPHero />
      <LPFeatures />
      <LPMetrics />
      <LPPlans />
      <LPSignupSection />

      <style>{`
        @keyframes lp-page-enter {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes lp-impact-sweep {
          0% { transform: translateX(0); opacity: 0; }
          18% { opacity: 0.95; }
          100% { transform: translateX(370%); opacity: 0; }
        }
        @keyframes lp-impact-glow {
          0% { opacity: 0; }
          26% { opacity: 1; }
          100% { opacity: 0.55; }
        }

        .lp-root {
          --lp-panel-bg: linear-gradient(180deg, rgba(8,18,30,0.88), rgba(6,16,26,0.82));
          --lp-panel-border: rgba(255,255,255,0.10);
          --lp-panel-ring: rgba(255,255,255,0.06);
          --lp-accent-line: rgba(34,211,238,0.38);
          --lp-text-soft: rgba(255,255,255,0.68);
          --lp-section-gap-top: 5rem;
          --lp-section-gap-bottom: 6rem;
          --lp-radius-lg: 2rem;
          --lp-radius-md: 1.5rem;
        }

        .lp-section-shell {
          position: relative;
          margin-left: auto;
          margin-right: auto;
          max-width: 80rem;
          padding-left: 1.5rem;
          padding-right: 1.5rem;
          padding-top: var(--lp-section-gap-top);
          padding-bottom: var(--lp-section-gap-bottom);
        }

        .lp-section-rail {
          pointer-events: none;
          position: absolute;
          left: 1.5rem;
          right: 1.5rem;
          top: 0;
        }

        .lp-section-title {
          margin-top: 1rem;
          font-size: clamp(1.875rem, 4vw, 2.625rem);
          line-height: 1.06;
          letter-spacing: -0.03em;
          font-weight: 900;
          color: #fff;
        }

        .lp-section-desc {
          margin-top: 1rem;
          max-width: 42rem;
          color: var(--lp-text-soft);
          line-height: 1.85;
        }

        @media (min-width: 640px) {
          .lp-section-shell {
            padding-left: 2rem;
            padding-right: 2rem;
          }
          .lp-section-rail {
            left: 2rem;
            right: 2rem;
          }
        }

        @media (min-width: 1024px) {
          .lp-section-shell {
            padding-left: 2.5rem;
            padding-right: 2.5rem;
          }
          .lp-section-rail {
            left: 2.5rem;
            right: 2.5rem;
          }
        }
      `}</style>
    </main>
  );
}