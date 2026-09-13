"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import LegalPageLayout from "@/app/component/settings/LegalPageLayout";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
import { resolveLocalizedLang } from "@/lib/i18n/localize";
import { helpPageCopy } from "@/lib/settings/helpPageCopy";
import {
  helpFaqsCopy,
  type HelpFaqEntryCopy,
  type HelpScoringSectionCopy,
  type HelpScoringSectionId,
  type HelpTextBlock,
} from "@/lib/settings/helpFaqsCopy";
import { nameOxanium, jp } from "@/lib/fonts";
import { communityCrtMono } from "@/app/component/communities/CommunityCrtTheme";
import {
  Gamepad2,
  BarChart3,
  Sigma,
  Trophy,
} from "lucide-react";

type Variant = "web" | "mobile";

type FAQItem = {
  id: string;
  label: string;
  question: string;
  icon: React.ReactNode;
  answer: React.ReactNode;
};

function HelpNote({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="border border-white/25 bg-black px-3 py-2.5 text-[13px] leading-relaxed text-white/85">
      {children}
    </div>
  );
}

function HelpSlab({
  children,
  className = "",
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={[
        "border border-white/20 bg-black",
        interactive ? "transition-colors hover:border-white/40" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

function HelpSectionLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "mb-3 flex items-center gap-2 border-b border-white/20 pb-2",
        className,
      ].join(" ")}
    >
      <span className="h-1.5 w-1.5 shrink-0 bg-white" aria-hidden />
      <h2
        className={[
          communityCrtMono.className,
          "text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70 sm:text-[11px]",
        ].join(" ")}
      >
        {children}
      </h2>
    </div>
  );
}

function HelpTextBlocks({ blocks }: { blocks: readonly HelpTextBlock[] }) {
  return (
    <div className="space-y-2">
      {blocks.map((block, index) =>
        block.kind === "heading" ? (
          <p
            key={`${block.kind}-${index}`}
            className="font-semibold text-white/92"
          >
            {block.text}
          </p>
        ) : (
          <p key={`${block.kind}-${index}`}>{block.text}</p>
        )
      )}
    </div>
  );
}

function ScoringLogicSections({
  sections,
  defaultOpenId,
}: {
  sections: readonly HelpScoringSectionCopy[];
  defaultOpenId: HelpScoringSectionId;
}) {
  const [openId, setOpenId] = useState<HelpScoringSectionId | null>(
    defaultOpenId
  );

  return (
    <div className="space-y-2">
      {sections.map((item) => {
        const open = openId === item.id;
        return (
          <HelpSlab key={item.id} className="overflow-hidden">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
              onClick={() => setOpenId(open ? null : item.id)}
              aria-expanded={open}
            >
              <span
                className={[
                  communityCrtMono.className,
                  "text-[11px] font-medium tracking-[0.14em] text-white/80 uppercase",
                ].join(" ")}
              >
                {item.title}
              </span>
              <ChevronDown
                className={[
                  "h-4 w-4 shrink-0 text-white/70 transition-transform duration-200",
                  open ? "rotate-180" : "",
                ].join(" ")}
                aria-hidden
              />
            </button>
            {open ? (
              <div
                className={[
                  "border-t border-white/15 px-3 py-3 text-sm leading-relaxed text-white/78",
                  jp.className,
                ].join(" ")}
              >
                <HelpTextBlocks blocks={item.blocks} />
              </div>
            ) : null}
          </HelpSlab>
        );
      })}
    </div>
  );
}

function faqIcon(id: HelpFaqEntryCopy["id"]) {
  const className = "h-4 w-4 text-white";
  switch (id) {
    case "form":
      return <Gamepad2 className={className} strokeWidth={2.2} />;
    case "stats":
      return <BarChart3 className={className} strokeWidth={2.2} />;
    case "scoring-logic":
      return <Sigma className={className} strokeWidth={2.2} />;
    case "ranking":
      return <Trophy className={className} strokeWidth={2.2} />;
  }
}

function renderFaqAnswer(entry: HelpFaqEntryCopy): React.ReactNode {
  switch (entry.id) {
    case "form":
      return (
        <div className="space-y-3 text-sm leading-relaxed text-white/78">
          <p>{entry.intro}</p>
          <ul className="list-disc space-y-1 pl-5 text-white/72">
            {entry.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
          <p>{entry.outro}</p>
        </div>
      );
    case "stats":
      return (
        <div className="space-y-3 text-sm leading-relaxed text-white/78">
          <ul className="list-disc space-y-1 pl-5 text-white/72">
            {entry.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
          <p>{entry.outro}</p>
        </div>
      );
    case "scoring-logic":
      return (
        <div className="space-y-3 text-sm leading-relaxed text-white/80">
          <p>{entry.intro}</p>
          <ScoringLogicSections
            sections={entry.sections}
            defaultOpenId="totalPoints"
          />
        </div>
      );
    case "ranking":
      return (
        <div className="space-y-3 text-sm leading-relaxed text-white/78">
          <p>{entry.intro}</p>
          <ul className="list-disc space-y-1 pl-5 text-white/72">
            {entry.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
          <p>{entry.outro}</p>
          <HelpNote>
            <p className="mb-1 font-semibold text-white">{entry.noteTitle}</p>
            <p>{entry.noteBody}</p>
          </HelpNote>
        </div>
      );
  }
}

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <HelpSlab interactive className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
        aria-expanded={isOpen}
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-white/30 bg-black">
            {item.icon}
          </div>
          <div className="min-w-0">
            <span
              className={[
                communityCrtMono.className,
                "block text-[10px] font-medium tracking-[0.18em] text-white/45 uppercase",
              ].join(" ")}
            >
              {item.label}
            </span>
            <span
              className={[
                nameOxanium.className,
                "mt-1 block text-[15px] leading-snug font-semibold text-white sm:text-base",
              ].join(" ")}
            >
              {item.question}
            </span>
          </div>
        </div>
        <ChevronDown
          className={[
            "mt-1 h-4 w-4 shrink-0 text-white/70 transition-transform duration-200",
            isOpen ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden
        />
      </button>
      {isOpen ? (
        <div
          className={[
            "border-t border-white/15 px-4 py-4 sm:px-5",
            jp.className,
          ].join(" ")}
        >
          {item.answer}
        </div>
      ) : null}
    </HelpSlab>
  );
}

export default function HelpPage({ variant }: { variant: Variant }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const m = t(language);
  const lang = resolveLocalizedLang(language);
  const copy = helpPageCopy(lang);
  const faqs: FAQItem[] = helpFaqsCopy(lang).map((entry) => ({
    id: entry.id,
    label: entry.label,
    question: entry.question,
    icon: faqIcon(entry.id),
    answer: renderFaqAnswer(entry),
  }));

  return (
    <LegalPageLayout
      variant={variant}
      title="HELP"
      description={m.settings.helpDescription}
      updatedAt="2026-06-24"
    >
      <HelpSlab className="mb-5 px-4 py-3.5 sm:px-5">
        <HelpSectionLabel className="mb-2">
          {copy.guideLabel}
        </HelpSectionLabel>
        <p className={`text-sm leading-relaxed text-white/72 ${jp.className}`}>
          {copy.guideIntro}
        </p>
      </HelpSlab>

      <HelpSectionLabel className="mb-3">
        {copy.topicsLabel}
      </HelpSectionLabel>

      <section className="space-y-3">
        {faqs.map((item) => (
          <AccordionItem
            key={item.id}
            item={item}
            isOpen={openId === item.id}
            onToggle={() => setOpenId(openId === item.id ? null : item.id)}
          />
        ))}
      </section>
    </LegalPageLayout>
  );
}
