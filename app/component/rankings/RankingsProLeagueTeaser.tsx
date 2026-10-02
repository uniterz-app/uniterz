"use client";

/**
 * Free が PRO LEAGUE を開いたとき — Report ゲート同型（ぼかし下地 + 説明 + CTA）。
 * 実ランキング API は使わない。
 * 本文は通常フローで高さを確保（absolute オーバーレイだと下端が切れる）。
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  LayoutGrid,
  Sparkles,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import RankingCard from "@/app/component/rankings/RankingCard";
import {
  ProCyberBadge,
  proBadgeStaticMotion,
} from "@/app/component/common/ProCyberBadge";
import UniterzLogo from "@/app/component/units/UniterzLogo";
import { buildProLeagueTeaserRows } from "@/lib/rankings/proLeagueTeaserMocks";
import type { Language } from "@/lib/i18n/language";
import {
  PRO_LEAGUE_GATE_CTA_HREF,
  proLeagueGateCopy,
  type ProLeagueGateBullet,
} from "@/lib/rankings/proLeagueGateCopy";
import { nameOxanium } from "@/lib/fonts";

type Props = {
  language?: Language;
  subscribeHref?: string;
  onBackToPickUp?: () => void;
};

const BULLET_ICONS: Record<
  ProLeagueGateBullet["icon"],
  typeof Trophy
> = {
  swords: Swords,
  trophy: Trophy,
  badge: Award,
  grid: LayoutGrid,
  users: Users,
  sparkles: Sparkles,
};

function TitleWithBrandFonts({ title }: { title: string }) {
  return (
    <>
      {title.split(/(PRO LEAGUE|Pro)/).map((part, i) =>
        part === "PRO LEAGUE" || part === "Pro" ? (
          <span
            key={i}
            className={[
              nameOxanium.className,
              "inline-block origin-center font-extrabold uppercase tracking-[0.06em]",
              "[transform:skewX(-10deg)]",
            ].join(" ")}
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function RankingsProLeagueTeaser({
  language = "ja",
  subscribeHref = PRO_LEAGUE_GATE_CTA_HREF,
  onBackToPickUp,
}: Props) {
  const copy = proLeagueGateCopy(language);
  const rows = useMemo(() => buildProLeagueTeaserRows(), []);
  const [ctaPressed, setCtaPressed] = useState(false);

  return (
    <div className="relative isolate min-h-[min(70dvh,560px)] overflow-hidden rounded-none border border-white/10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none [mask-image:linear-gradient(180deg,#000_45%,transparent_100%)]"
      >
        <div
          className="h-full overflow-hidden px-2 opacity-90"
          style={{ filter: "blur(10px)", transform: "scale(1.02)" }}
        >
          <div className="cyber-rank-list-panel">
            {rows.map((r, i) => (
              <RankingCard
                key={r.uid}
                row={r}
                rank={i + 1}
                metric="totalScore"
                language={language}
                animateValue={false}
                size="compact"
              />
            ))}
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 backdrop-blur-[12px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(12,7,22,0.28) 0%, rgba(8,5,15,0.68) 48%, rgba(5,3,8,0.88) 100%)",
        }}
      />

      <div className="relative z-[1] flex flex-col items-center px-3 pb-7 pt-10">
        <div className="flex w-full max-w-[24rem] flex-col items-stretch gap-3.5 text-center">
          <div className="flex flex-col items-center gap-2.5">
            <div className="w-[168px] max-w-[72%]">
              <UniterzLogo width="100%" title="UNITERZ" />
            </div>
            <span className="inline-flex origin-top scale-[1.45]">
              <ProCyberBadge
                {...proBadgeStaticMotion}
                premium
                ariaLabel={copy.proMemberAria}
              />
            </span>
          </div>
          <h2 className="text-balance text-[19px] font-bold leading-snug text-white">
            <TitleWithBrandFonts title={copy.title} />
          </h2>
          <p className="text-pretty text-[15px] leading-relaxed text-white/72">
            {copy.body}
          </p>
          <div className="flex justify-center">
            <Link
              href={subscribeHref}
              onPointerDown={() => setCtaPressed(true)}
              onPointerUp={() => setCtaPressed(false)}
              onPointerLeave={() => setCtaPressed(false)}
              onPointerCancel={() => setCtaPressed(false)}
              className={[
                nameOxanium.className,
                "inline-flex min-h-11 min-w-[168px] items-center justify-center border px-[18px] py-2.5 text-[13px] font-extrabold uppercase tracking-[0.12em] transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-out",
                ctaPressed
                  ? "scale-[0.94] border-amber-200 bg-amber-300/20 text-amber-50 shadow-[0_0_22px_rgba(251,191,36,0.35)]"
                  : "scale-100 border-amber-300/75 bg-[#050508] text-amber-200 shadow-[0_0_18px_rgba(251,191,36,0.18)] hover:border-amber-200 hover:bg-amber-300/10 hover:text-amber-100",
              ].join(" ")}
            >
              {copy.cta}
            </Link>
          </div>
          <div className="w-full rounded-none border border-orange-400/55 bg-orange-500/[0.07] px-3.5 py-3 text-left shadow-[0_0_18px_rgba(251,146,60,0.12)]">
            <ul className="list-none space-y-2.5">
              {copy.bullets.map((item) => {
                const Icon = BULLET_ICONS[item.icon];
                return (
                  <li key={item.title} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-none border border-orange-400/45 bg-orange-500/15 text-orange-300"
                      aria-hidden
                    >
                      <Icon className="h-[15px] w-[15px]" strokeWidth={2.4} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={[
                          nameOxanium.className,
                          "text-[13px] font-extrabold tracking-[0.04em] text-orange-100",
                        ].join(" ")}
                      >
                        {item.title}
                      </p>
                      <p className="mt-0.5 break-words text-[13px] leading-snug text-white/70">
                        {item.detail}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          {onBackToPickUp ? (
            <button
              type="button"
              onClick={onBackToPickUp}
              className="text-[12px] font-semibold tracking-wide text-white/55 underline-offset-2 hover:text-white/80 hover:underline"
            >
              {copy.backToPickUp}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
