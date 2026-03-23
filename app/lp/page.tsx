import LPHeader from "./_components/LPHeader";
import LPHero from "./_components/LPHero";
import LPFeatures from "./_components/LPFeatures";
import LPMetrics from "./_components/LPMetrics";
import LPPlans from "./_components/LPPlans";
import LPSignupSection from "./_components/LPSignupSection";

export default function UniterzLPPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#03070f] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(4,244,255,0.18),transparent_38%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:72px_72px]" />

      <LPHeader />
      <LPHero />
      <LPFeatures />
      <LPMetrics />
      <LPPlans />
      <LPSignupSection />
    </main>
  );
}