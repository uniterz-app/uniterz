"use client";

import Image from "next/image";
import { alfa, jp } from "@/lib/fonts";
import type { BracketLeaderboardRow } from "@/lib/leaderboards/useBracketLeaderboard";
import { nbaTeamIdFromBracketCode } from "@/lib/nba-bracket-code";
import { getTeamJerseyPrimaryColor } from "@/lib/team-colors";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";
import {
  ProCyberBadge,
  proBadgeStaticMotion,
} from "@/app/component/common/ProCyberBadge";
import type { Language } from "@/lib/i18n/language";

type Props = {
  row: BracketLeaderboardRow;
  totalCount?: number;
  language?: Language;
  onClick?: () => void;
};

function textOnJerseyPrimary(hex: string): "#ffffff" | "#0f172a" {
  const h = hex.replace(/^#/, "");
  if (h.length !== 6) return "#ffffff";
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  if ([r, g, b].some((n) => Number.isNaN(n))) return "#ffffff";
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.72 ? "#0f172a" : "#ffffff";
}

function ChampionPickBadge({
  code,
  language,
}: {
  code: string;
  language: Language;
}) {
  const teamId = nbaTeamIdFromBracketCode(code);
  const bg =
    teamId != null
      ? (getTeamJerseyPrimaryColor("nba", teamId) ?? "#1d4ed8")
      : "#334155";
  const label = code.trim().toUpperCase().slice(0, 3);
  const fg = textOnJerseyPrimary(bg);

  return (
    <span
      className={[
        "inline-flex h-[15px] shrink-0 items-center justify-center rounded-[4px] px-1 text-[9px] font-black leading-none tracking-[0.05em] sm:h-[18px] sm:rounded-[5px] sm:px-1.5 sm:text-[10px] sm:tracking-[0.06em]",
        alfa.className,
      ].join(" ")}
      style={{
        backgroundColor: bg,
        color: fg,
        boxShadow:
          fg === "#ffffff"
            ? "inset 0 1px 0 rgba(255,255,255,0.2)"
            : "inset 0 1px 0 rgba(255,255,255,0.35)",
      }}
      title={
        language === "en"
          ? `Predicted champion: ${label}`
          : `優勝予想: ${label}`
      }
    >
      {label}
    </span>
  );
}

export default function BracketUserCard({
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
          <div className="flex min-w-0 max-w-full items-center gap-1 overflow-hidden">
            <div
              className={[
                "min-w-0 truncate font-black text-[14px] leading-tight text-white",
                jp.className,
              ].join(" ")}
            >
              {displayName}
            </div>
            {row.championPick ? (
              <ChampionPickBadge code={row.championPick} language={language} />
            ) : null}
            {isPro ? (
              <ProCyberBadge
                {...proBadgeStaticMotion}
                compact
                ariaLabel={
                  language === "en" ? "Pro member" : "Pro 会員"
                }
              />
            ) : null}
          </div>
          {handle && (
            <div className="truncate text-[11px] leading-tight text-white/50">
              @{handle}
            </div>
          )}
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
            "font-black tabular-nums leading-none text-white",
            alfa.className,
          ].join(" ")}
          style={{ fontSize: 17 }}
        >
          {row.totalScore} pts
        </div>
      </div>
    </div>
  );

  const shellStyle = {
    background:
      "linear-gradient(160deg, rgba(255,255,255,0.085) 0%, rgba(255,255,255,0.035) 44%, rgba(8,13,24,0.55) 100%)",
    borderColor: "rgba(255,255,255,0.16)",
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
