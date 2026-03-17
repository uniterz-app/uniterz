import LPHero from "./_components/LPHero";
import LPFeatures from "./_components/LPFeatures";
import LPMetrics from "./_components/LPMetrics";
import LPHowItWorks from "./_components/LPHowItWorks";
import LPPlans from "./_components/LPPlans";
import LPSignupSection from "./_components/LPSignupSection";

export default function UniterzLPPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#03070f] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(44,244,255,0.18),transparent_30%),radial-gradient(circle_at_80%_12%,rgba(77,255,163,0.12),transparent_24%),radial-gradient(circle_at_50%_85%,rgba(56,189,248,0.10),transparent_32%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:40px_40px]" />

      <LPHero />
      <LPFeatures />
      <LPMetrics />
      <LPHowItWorks />
      <LPPlans />
      <LPSignupSection />
    </main>
  );
}