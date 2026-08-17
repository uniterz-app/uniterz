"use client";

/**
 * Free が PRO LEAGUE を開いたとき — Report ゲート同型（ぼかし下地 + 説明 + CTA）。
 * 実ランキング API は使わない。
 */

import { useMemo } from "react";
import Link from "next/link";
import {
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
import { buildProLeagueTeaserRows } from "@/lib/rankings/proLeagueTeaserMocks";
import {
  PRO_LEAGUE_GATE_CTA_HREF,
  proLeagueGateCopy,
  type ProLeagueGateBullet,
} from "@/lib/rankings/proLeagueGateCopy";
import { nameOxanium } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";

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
              "font-extrabold uppercase tracking-[0.06em]",
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
  const lang = language === "en" ? "en" : "ja";
  const copy = proLeagueGateCopy(lang);
  const rows = useMemo(() => buildProLeagueTeaserRows(), []);

  return (
    <div className="relative isolate min-h-[min(70dvh,560px)] overflow-hidden rounded-2xl border border-white/10">
      <div
        aria-hidden
        className="pointer-events-none select-none [mask-image:linear-gradient(180deg,#000_45%,transparent_100%)]"
      >
        <div
          className="max-h-[520px] overflow-hidden px-2 opacity-90"
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

      <div className="absolute inset-0 z-[1] flex items-start justify-center px-3 pb-10 pt-12 sm:pt-14">
        <div className="flex w-full max-w-[22rem] flex-col items-stretch gap-3 text-center">
          <div className="flex flex-col items-center gap-2">
            <p
              className={[
                nameOxanium.className,
                "text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200/85",
              ].join(" ")}
            >
              {copy.eyebrow}
            </p>
            <span className="inline-flex origin-top scale-[1.45]">
              <ProCyberBadge
                {...proBadgeStaticMotion}
                premium
                ariaLabel={lang === "ja" ? "Pro会員" : "Pro member"}
              />
            </span>
          </div>
          <h2 className="text-balance text-[17px] font-bold leading-snug text-white">
            <TitleWithBrandFonts title={copy.title} />
          </h2>
          <p className="text-pretty text-[13px] leading-relaxed text-white/72">
            {copy.body}
          </p>
          <div className="flex justify-center">
            <Link
              href={subscribeHref}
              className={[
                nameOxanium.className,
                "inline-flex min-h-10 min-w-[160px] items-center justify-center border border-white/35 bg-[#00F5FF] px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#050508] transition hover:brightness-110 active:scale-[0.98]",
              ].join(" ")}
            >
              {copy.cta}
            </Link>
          </div>
          <div className="w-full rounded-[2px] border border-orange-400/55 bg-orange-500/[0.07] px-3 py-2.5 text-left shadow-[0_0_18px_rgba(251,146,60,0.12)]">
            <ul className="list-none space-y-2">
              {copy.bullets.map((item) => {
                const Icon = BULLET_ICONS[item.icon];
                return (
                  <li key={item.title} className="flex items-start gap-2.5">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] border border-orange-400/45 bg-orange-500/15 text-orange-300"
                      aria-hidden
                    >
                      <Icon className="h-3 w-3" strokeWidth={2.4} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={[
                          nameOxanium.className,
                          "text-[11px] font-extrabold tracking-[0.04em] text-orange-100",
                        ].join(" ")}
                      >
                        {item.title}
                      </p>
                      <p className="mt-0.5 break-words text-[11px] leading-snug text-white/70">
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
              className="text-[11px] font-semibold tracking-wide text-white/55 underline-offset-2 hover:text-white/80 hover:underline"
            >
              {copy.backToPickUp}
            </button>
          ) : null}
        </div>
      </div>

      <div className="pointer-events-none invisible min-h-[320px]" aria-hidden />
    </div>
  );
}
