"use client";

import Image from "next/image";
import { Pencil, Trophy } from "lucide-react";
import CountryFlag from "@/app/component/games/CountryFlag";
import { alfa, jp } from "@/lib/fonts";
import type { WcBracketLeaderboardRow } from "@/lib/leaderboards/useWcBracketLeaderboard";
import {
  ProCyberBadge,
  proBadgeStaticMotion,
} from "@/app/component/common/ProCyberBadge";
import type { Language } from "@/lib/i18n/language";

type Props = {
  row: WcBracketLeaderboardRow;
  language?: Language;
  onClick?: () => void;
  /** 自分の行 — ALIVE 右に編集アイコン */
  onEditClick?: () => void;
};

function ChampionFlag({ teamId, large = false }: { teamId: string; large?: boolean }) {
  return (
    <span
      className={[
        "inline-flex shrink-0 overflow-hidden rounded-[2px] ring-1 ring-white/20",
        large ? "h-7 w-10 sm:h-8 sm:w-[46px]" : "h-[18px] w-[26px] sm:h-5 sm:w-[30px]",
      ].join(" ")}
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

function statusLabel(row: WcBracketLeaderboardRow) {
  if (row.alive) return "ALIVE";
  if (row.firstMissMatchId) return `OUT ${row.firstMissMatchId}`;
  return "OUT";
}

export default function WcBracketUserCard({
  row,
  language = "ja",
  onClick,
  onEditClick,
}: Props) {
  const isPro = row.plan === "pro";
  const avatarUrl = row.photoURL ?? null;
  const displayName = row.displayName || "User";
  const initial = displayName.charAt(0).toUpperCase();
  const handle = row.handle ?? null;
  const championTeamId = row.championTeamId?.trim() || null;
  const shellClass = [
    "wc-bracket-user-card",
    "relative px-3 py-2.5",
    row.alive ? "" : "wc-bracket-user-card--out",
    onClick || onEditClick ? "wc-bracket-user-card--interactive" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const mainBody = (
    <>
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

      <div className="flex shrink-0 items-center gap-1.5 px-2">
        <Trophy
          className="h-4 w-4 shrink-0 text-amber-300/85"
          strokeWidth={2.2}
          aria-hidden
        />
        {championTeamId ? (
          <ChampionFlag teamId={championTeamId} large />
        ) : (
          <span
            className="inline-flex h-7 w-10 items-center justify-center rounded-[2px] border border-dashed border-white/15 bg-white/3 text-[9px] font-bold tracking-wider text-white/25 sm:h-8 sm:w-[46px]"
            aria-hidden
          >
            —
          </span>
        )}
      </div>
    </>
  );

  const statusBlock = (
    <div className="flex shrink-0 items-center gap-1.5 pl-1">
      <span
        className={[
          "font-black tabular-nums leading-none tracking-[0.08em]",
          row.alive ? "text-[#00F5FF]" : "text-white/45",
          alfa.className,
        ].join(" ")}
        style={{ fontSize: 14 }}
      >
        {statusLabel(row)}
      </span>
      {onEditClick ? (
        <button
          type="button"
          onClick={onEditClick}
          className="flex size-7 shrink-0 items-center justify-center border border-cyan-400/35 bg-cyan-400/8 text-cyan-200/90 transition hover:border-cyan-300/55 hover:bg-cyan-400/14 active:scale-95"
          aria-label={language === "ja" ? "ブラケットを編集" : "Edit bracket"}
        >
          <Pencil className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );

  const content = (
    <div className="relative z-10 flex items-center justify-between gap-1">
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="flex min-w-0 flex-1 items-center justify-between gap-1 text-left"
        >
          {mainBody}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center justify-between gap-1">
          {mainBody}
        </div>
      )}
      {statusBlock}
    </div>
  );

  return <div className={shellClass}>{content}</div>;
}
