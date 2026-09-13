"use client";

import React from "react";
import LegalPageLayout from "@/app/component/settings/LegalPageLayout";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { communityGuidelinesCopy } from "@/lib/settings/communityGuidelinesCopy";

type Variant = "web" | "mobile";

export default function CommunityGuidelinesPage({
  variant,
}: {
  variant: Variant;
}) {
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const copy = communityGuidelinesCopy(language);
  const updatedAt = "2026-03-23";

  return (
    <LegalPageLayout
      variant={variant}
      title="GUIDELINES"
      description={copy.description}
      updatedAt={updatedAt}
    >
      <Section title={copy.s1Title} paragraphs={[...copy.s1Paragraphs]} />
      <Section title={copy.s2Title} bullets={[...copy.s2Bullets]} />
      <Section
        title={copy.s3Title}
        paragraphs={[...copy.s3Paragraphs]}
        bullets={[...copy.s3Bullets]}
      />
      <Section title={copy.s4Title} bullets={[...copy.s4Bullets]} />
      <Section
        title={copy.s5Title}
        paragraphs={[...copy.s5Paragraphs]}
        bullets={[...copy.s5Bullets]}
        paragraphsAfter={[...copy.s5After]}
      />
      <Section title={copy.s6Title} paragraphs={[...copy.s6Paragraphs]} />
    </LegalPageLayout>
  );
}

function Section({
  title,
  paragraphs,
  bullets,
  paragraphsAfter,
}: {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  paragraphsAfter?: string[];
}) {
  return (
    <section>
      <h2 className="mb-2 text-base font-bold text-white/90">{title}</h2>
      {paragraphs?.map((p, i) => (
        <p key={`${title}-p-${i}`} className={i > 0 ? "mt-2" : undefined}>
          {p}
        </p>
      ))}
      {bullets ? (
        <ul
          className={[
            "list-disc space-y-1 pl-5",
            paragraphs && paragraphs.length > 0 ? "mt-2" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {bullets.map((b, i) => (
            <li key={`${title}-b-${i}`}>{b}</li>
          ))}
        </ul>
      ) : null}
      {paragraphsAfter?.map((p, i) => (
        <p key={`${title}-pa-${i}`} className="mt-2">
          {p}
        </p>
      ))}
    </section>
  );
}
