"use client";

import { getWcMatchPreview } from "@/lib/wc/matchPreviews";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

type Props = {
  gameId: string;
  language: Language;
  isMobile: boolean;
};

export default function WcMatchPreviewPanel({
  gameId,
  language,
  isMobile,
}: Props) {
  const m = t(language);
  const paragraphs = getWcMatchPreview(gameId, language);

  if (!paragraphs?.length) {
    return (
      <div
        className={[
          "rounded-xl border border-dashed border-white/12 bg-white/[0.02] text-center text-white/55",
          isMobile ? "px-3 py-5 text-sm" : "px-4 py-6 text-sm",
        ].join(" ")}
      >
        {m.predict.matchPreviewNotAvailable}
      </div>
    );
  }

  return (
    <article
      className={[
        "w-full min-w-0",
        isMobile ? "space-y-3" : "space-y-3.5",
      ].join(" ")}
    >
      {paragraphs.map((paragraph, index) => (
        <p
          key={index}
          className={[
            isMobile ? "text-sm leading-[1.65]" : "text-pretty text-sm leading-relaxed",
            index === 0 ? "text-white/90" : "text-white/82",
          ].join(" ")}
        >
          {paragraph}
        </p>
      ))}
    </article>
  );
}
