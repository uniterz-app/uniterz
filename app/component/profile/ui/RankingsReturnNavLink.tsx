// app/component/profile/ui/RankingsReturnNavLink.tsx
"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  PROFILE_FROM_PARAM,
  PROFILE_FROM_COMMUNITY_ID_PARAM,
  PROFILE_FROM_COMMUNITY_VALUE,
  PROFILE_FROM_GROUP_ID_PARAM,
  PROFILE_FROM_GROUP_VALUE,
  PROFILE_FROM_RANKINGS_VALUE,
  buildRankingsPathQuery,
  leaderboardsGroupReturnHref,
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
  const groupId =
    sp.get(PROFILE_FROM_GROUP_ID_PARAM) ??
    sp.get(PROFILE_FROM_COMMUNITY_ID_PARAM);
  const isGroupReturn =
    (from === PROFILE_FROM_GROUP_VALUE ||
      from === PROFILE_FROM_COMMUNITY_VALUE) &&
    !!groupId;
  if (from !== PROFILE_FROM_RANKINGS_VALUE && !isGroupReturn) {
    return null;
  }

  const prefix =
    pathname.startsWith("/mobile") || pathname.startsWith("/m/")
      ? "/mobile"
      : "/web";
  const tabQuery = buildRankingsPathQuery(sp);
  const href = isGroupReturn
    ? leaderboardsGroupReturnHref(prefix, groupId!)
    : `${prefix}/rankings${tabQuery ? `?${tabQuery}` : ""}`;
  const m = t(language);
  const label = isGroupReturn
    ? m.profile.backToGroupRankings
    : m.profile.backToRankings;

  return (
    <Link
      href={href}
      aria-label={label}
      className={[
        "mb-4 inline-flex items-center gap-2 rounded-lg border border-cyan-200/20",
        "bg-white/5 px-3 py-2 text-sm font-medium text-cyan-50/95",
        "shadow-[0_4px_16px_rgba(0,0,0,0.22)] backdrop-blur-md transition",
        "hover:border-cyan-200/35 hover:bg-white/8",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-[#061116]",
      ].join(" ")}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.4} aria-hidden />
      <span>{label}</span>
    </Link>
  );
}
