import type { Metadata } from "next";
import { officialSite } from "@/lib/lp/officialSiteContent";
import OfficialLpPage from "./_components/OfficialLpPage";
import "./official-lp.css";

export const metadata: Metadata = {
  title: "Uniterz — Sports Prediction App",
  description:
    "Uniterz は、NBAなどの試合結果を無料で予想し、成績をランキングで競うスポーツ予想アプリです。現金を賭けること、Unit の購入・換金はできません。",
};

export default function OfficialLandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: officialSite.company.name === "準備中" ? officialSite.productName : officialSite.company.name,
    url: "https://uniterz.app",
    email: officialSite.supportEmail,
    description:
      "スポーツ予想アプリケーション Uniterz の企画・開発・運営。現金を賭けるサービスではありません。",
    makesOffer: {
      "@type": "Offer",
      itemOffered: {
        "@type": "SoftwareApplication",
        name: officialSite.productName,
        applicationCategory: "SportsApplication",
        operatingSystem: "iOS",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <OfficialLpPage />
    </>
  );
}
