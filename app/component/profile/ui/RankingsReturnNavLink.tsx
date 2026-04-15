// app/component/profile/ui/RankingsReturnNavLink.tsx
"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  PROFILE_FROM_PARAM,
  PROFILE_FROM_RANKINGS_VALUE,
  buildRankingsPathQuery,
} from "@/lib/navigation/rankingsProfileFrom";
import type { Language } from "@/lib/i18n/language";

type Props = {
  language: Language;
};

/** ランキング経由で開いたプロフィールにだけ表示する「ランキングへ戻る」 */
export default function RankingsReturnNavLink({ language }: Props) {
  const pathname = usePathname() ?? "";
  const sp = useSearchParams();
  if (sp.get(PROFILE_FROM_PARAM) !== PROFILE_FROM_RANKINGS_VALUE) return null;

  const prefix =
    pathname.startsWith("/mobile") || pathname.startsWith("/m/")
      ? "/mobile"
      : "/web";
  const tabQuery = buildRankingsPathQuery(sp);
  const href = `${prefix}/rankings${tabQuery ? `?${tabQuery}` : ""}`;
  const isEn = language === "en";

  return (
    <div className="mb-3">
      <Link
        href={href}
        className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/30 bg-black/45 px-3 py-1.5 text-sm font-semibold text-cyan-50/95 shadow-[0_0_16px_rgba(34,211,238,0.12)] transition hover:border-cyan-300/50 hover:bg-black/60"
      >
        <ChevronLeft className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
        {isEn ? "Back to rankings" : "ランキングに戻る"}
      </Link>
    </div>
  );
}
