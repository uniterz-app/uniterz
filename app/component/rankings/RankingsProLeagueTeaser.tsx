"use client";

/**
 * Free が PRO LEAGUE を開いたとき — ダミー一覧にガウスぼかし + 説明モーダル。
 * 実ランキング API は使わない。
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RankingCard from "@/app/component/rankings/RankingCard";
import { buildProLeagueTeaserRows } from "@/lib/rankings/proLeagueTeaserMocks";
import { PRO_LEAGUE_ATMOSPHERE } from "@/lib/rankings/proLeagueAtmosphere";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

type Props = {
  language?: Language;
  subscribeHref?: string;
  /** モーダルを閉じたあと Pick Up に戻す */
  onBackToPickUp?: () => void;
};

export default function RankingsProLeagueTeaser({
  language = "ja",
  subscribeHref = "/mobile/pro/subscribe",
  onBackToPickUp,
}: Props) {
  const m = t(language).rankings;
  const rows = useMemo(() => buildProLeagueTeaserRows(), []);
  const [modalOpen, setModalOpen] = useState(true);

  useEffect(() => {
    setModalOpen(true);
  }, []);

  return (
    <div className="relative min-h-[min(70dvh,560px)]">
      <div
        aria-hidden
        className="pointer-events-none select-none px-2"
        style={{ filter: "blur(7px)", transform: "scale(1.01)" }}
      >
        <div className="cyber-rank-list-panel opacity-90">
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

      {/* ぼかしの上に薄いヴェール */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(12,7,22,0.25) 0%, rgba(8,5,15,0.55) 55%, rgba(5,3,8,0.75) 100%)",
        }}
      />

      {!modalOpen ? (
        <div className="absolute inset-x-0 bottom-6 z-20 flex flex-col items-center gap-2 px-4">
          <Link
            href={subscribeHref}
            className="inline-flex min-w-[200px] items-center justify-center rounded-sm px-4 py-2.5 text-[12px] font-bold tracking-wide"
            style={{
              backgroundColor: PRO_LEAGUE_ATMOSPHERE.gold,
              color: PRO_LEAGUE_ATMOSPHERE.ink,
            }}
          >
            {m.divisionOpenCta ?? "See Pro"}
          </Link>
          {onBackToPickUp ? (
            <button
              type="button"
              onClick={onBackToPickUp}
              className="text-[11px] font-semibold tracking-wide text-white/55 underline-offset-2 hover:text-white/80 hover:underline"
            >
              {m.divisionOpenBackToPickUp ?? "Back to Pick Up"}
            </button>
          ) : null}
        </div>
      ) : null}

      {modalOpen ? (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pro-league-teaser-title"
        >
          <button
            type="button"
            aria-label="close"
            className="absolute inset-0 bg-black/45"
            onClick={() => setModalOpen(false)}
          />
          <div
            className="relative w-full max-w-[320px] rounded-sm px-5 py-6 text-center"
            style={{
              border: `1px solid ${PRO_LEAGUE_ATMOSPHERE.panelBorder}`,
              background:
                "linear-gradient(180deg, rgba(192,132,252,0.18) 0%, rgba(8,5,15,0.94) 100%)",
              boxShadow: PRO_LEAGUE_ATMOSPHERE.panelGlow,
            }}
          >
            <p
              className="text-[10px] font-bold tracking-[0.2em]"
              style={{ color: PRO_LEAGUE_ATMOSPHERE.gold }}
            >
              PRO ONLY
            </p>
            <h2
              id="pro-league-teaser-title"
              className="mt-2 text-lg font-bold tracking-wide text-white"
            >
              {m.divisionOpenTitle ?? "PRO LEAGUE"}
            </h2>
            <p className="mt-2 text-[13px] leading-5 text-white/70">
              {m.divisionOpenLockBody}
            </p>
            <Link
              href={subscribeHref}
              className="mt-5 inline-flex w-full items-center justify-center rounded-sm px-4 py-2.5 text-[12px] font-bold tracking-wide"
              style={{
                backgroundColor: PRO_LEAGUE_ATMOSPHERE.gold,
                color: PRO_LEAGUE_ATMOSPHERE.ink,
              }}
            >
              {m.divisionOpenCta ?? "See Pro"}
            </Link>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="mt-3 w-full text-[11px] font-semibold text-white/50 hover:text-white/75"
            >
              {m.divisionOpenModalDismiss ?? (language === "ja" ? "とじる" : "Close")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
