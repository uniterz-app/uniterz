// app/component/profile/ui/RankingsReturnNavLink.tsx
"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  PROFILE_FROM_PARAM,
  PROFILE_FROM_COMMUNITY_ID_PARAM,
  PROFILE_FROM_COMMUNITY_VALUE,
  PROFILE_FROM_RANKINGS_VALUE,
  buildRankingsPathQuery,
} from "@/lib/navigation/rankingsProfileFrom";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

type Props = {
  language: Language;
};

/** ランキング経由で開いたプロフィールにだけ表示する「ランキングへ戻る」 */
export default function RankingsReturnNavLink({ language }: Props) {
  const pathname = usePathname() ?? "";
  const sp = useSearchParams();
  const from = sp.get(PROFILE_FROM_PARAM);
  if (
    from !== PROFILE_FROM_RANKINGS_VALUE &&
    from !== PROFILE_FROM_COMMUNITY_VALUE
  ) {
    return null;
  }

  const prefix =
    pathname.startsWith("/mobile") || pathname.startsWith("/m/")
      ? "/mobile"
      : "/web";
  const tabQuery = buildRankingsPathQuery(sp);
  const communityId = sp.get(PROFILE_FROM_COMMUNITY_ID_PARAM);
  const href =
    from === PROFILE_FROM_COMMUNITY_VALUE && communityId
      ? `${prefix}/communities/${encodeURIComponent(communityId)}`
      : `${prefix}/rankings${tabQuery ? `?${tabQuery}` : ""}`;
  const m = t(language);
  const label =
    from === PROFILE_FROM_COMMUNITY_VALUE
      ? language === "en"
        ? "Back to community"
        : "コミュニティに戻る"
      : m.profile.backToRankings;

  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={[
        "fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full",
        "border border-cyan-200/25 bg-white/5.5 text-cyan-50/95",
        "shadow-[0_10px_30px_rgba(0,0,0,0.38),0_0_22px_rgba(34,211,238,0.16)]",
        "backdrop-blur-xl backdrop-saturate-150 transition",
        "hover:-translate-y-0.5 hover:border-cyan-200/45 hover:bg-white/8.5 hover:shadow-[0_14px_36px_rgba(0,0,0,0.42),0_0_28px_rgba(34,211,238,0.24)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061116]",
        "bottom-[calc(var(--bottom-nav-clearance,0px)+14px)] md:bottom-6 md:right-6",
      ].join(" ")}
    >
      <span
        aria-hidden
        className="absolute inset-[3px] rounded-full border border-white/10 bg-black/10"
      />
      <ArrowLeft
        className="relative h-6 w-6 drop-shadow-[0_0_8px_rgba(103,232,249,0.5)]"
        strokeWidth={2.4}
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </Link>
  );
}
