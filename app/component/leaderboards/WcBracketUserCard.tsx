"use client";

import Image from "next/image";
import CountryFlag from "@/app/component/games/CountryFlag";
import { alfa, jp } from "@/lib/fonts";
import type { WcBracketLeaderboardRow } from "@/lib/leaderboards/useWcBracketLeaderboard";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";
import {
  ProCyberBadge,
  proBadgeStaticMotion,
} from "@/app/component/common/ProCyberBadge";
import type { Language } from "@/lib/i18n/language";

type Props = {
  row: WcBracketLeaderboardRow;
  totalCount?: number;
  language?: Language;
  onClick?: () => void;
};

function ChampionFlag({ teamId }: { teamId: string }) {
  return (
    <span
      className="inline-flex h-[18px] w-[26px] shrink-0 overflow-hidden rounded-[2px] ring-1 ring-white/20 sm:h-5 sm:w-[30px]"
      title={teamId}
    >
      <CountryFlag
        teamId={teamId}
        variant="inline"
        className="block! h-full! w-full! ring-0!"
      />
    </span>
  );
}

function survivalLabel(row: WcBracketLeaderboardRow, language: Language) {
  if (row.alive) {
    return language === "ja" ? "生存中" : "ALIVE";
  }
  if (row.firstMissMatchId) {
    return language === "ja"
      ? `${row.firstMissMatchId} で脱落`
      : `OUT ${row.firstMissMatchId}`;
  }
  return language === "ja" ? "脱落" : "OUT";
}

export default function WcBracketUserCard({
  row,
  totalCount = 0,
  language = "ja",
  onClick,
}: Props) {
  const isPro = row.plan === "pro";
  const avatarUrl = row.photoURL ?? null;
  const displayName = row.displayName || "User";
  const initial = displayName.charAt(0).toUpperCase();
  const handle = row.handle ?? null;
  const championTeamId = row.championTeamId?.trim() || null;
  const baseCardClass =
    "relative overflow-hidden rounded-none border px-3 py-2";

  const content = (
    <div className="relative z-10 flex items-center justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <div className="relative h-9 w-9 shrink-0">
          {isPro ? (
            <>
              <span
                className="pointer-events-none absolute -inset-[3px] z-0 rounded-full border border-cyan-400/25 shadow-[0_0_12px_rgba(34,211,238,0.18)]"
                aria-hidden
              />
              <span
                className="pointer-events-none absolute -inset-px z-1 rounded-full border border-white/10"
                aria-hidden
              />
            </>
          ) : null}
          <div className="relative z-2 h-9 w-9 overflow-hidden rounded-full border border-white/20 bg-black">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                fill
                sizes="36px"
                className="object-cover"
              />
            ) : (
              <div
                className={[
                  "grid h-full w-full place-items-center font-black text-[15px] text-white/50",
                  alfa.className,
                ].join(" ")}
              >
                {initial}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex min-w-0 max-w-full items-center gap-1.5 overflow-hidden">
            <div
              className={[
                "min-w-0 truncate font-black text-[14px] leading-tight text-white",
                jp.className,
              ].join(" ")}
            >
              {displayName}
            </div>
            {championTeamId ? <ChampionFlag teamId={championTeamId} /> : null}
            {isPro ? (
              <ProCyberBadge
                {...proBadgeStaticMotion}
                compact
                ariaLabel={language === "en" ? "Pro member" : "Pro 会員"}
              />
            ) : null}
          </div>
          {handle ? (
            <div className="truncate text-[11px] leading-tight text-white/50">
              @{handle}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-1">
        <div className="text-[8px] tracking-wider text-white/40">RANK</div>
        <div
          className={["font-black leading-none text-white", alfa.className].join(
            " "
          )}
          style={{ fontSize: 20 }}
        >
          #{row.rank}
          {totalCount > 0 ? (
            <span className="ml-1 align-baseline text-[10px] text-white/55">
              /{totalCount}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col items-end pl-1">
        <div
          className={[
            "font-black tabular-nums leading-none",
            row.alive ? "text-cyan-300" : "text-white/75",
            alfa.className,
          ].join(" ")}
          style={{ fontSize: 14 }}
        >
          {survivalLabel(row, language)}
        </div>
        <div className="text-[10px] text-white/45">
          {language === "ja"
            ? `R${row.survivedRounds}`
            : `Round ${row.survivedRounds}`}
        </div>
      </div>
    </div>
  );

  const shellStyle = {
    background:
      "linear-gradient(160deg, rgba(255,255,255,0.085) 0%, rgba(255,255,255,0.035) 44%, rgba(8,13,24,0.55) 100%)",
    borderColor: row.alive ? "rgba(34,211,238,0.28)" : "rgba(255,255,255,0.16)",
    boxShadow:
      "0 8px 22px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(255,255,255,0.05)",
  };

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={[
          baseCardClass,
          "w-full text-left transition hover:bg-white/5 active:scale-[0.99]",
        ].join(" ")}
        style={shellStyle}
      >
        <ShellGridOverlay roundedClassName="rounded-none" />
        {content}
      </button>
    );
  }

  return (
    <div className={baseCardClass} style={shellStyle}>
      <ShellGridOverlay roundedClassName="rounded-none" />
      {content}
    </div>
  );
}
