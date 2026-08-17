import type { LegalLang } from "@/lib/legal/unitRedemptionLegalCopy";

export type { LegalLang };

export type LegalSection = {
  id: string;
  title: Record<LegalLang, string>;
  paragraphs?: Record<LegalLang, readonly string[]>;
  bullets?: Record<LegalLang, readonly string[]>;
  subsections?: readonly {
    title: Record<LegalLang, string>;
    paragraphs?: Record<LegalLang, readonly string[]>;
    bullets?: Record<LegalLang, readonly string[]>;
  }[];
};
