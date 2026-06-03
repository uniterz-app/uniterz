"use client";

import CountryFlag from "@/app/component/games/CountryFlag";
import {
  formatWcConfederation,
  formatWcRoundReached,
  getWcTeamProfile,
  type WcRoundReached,
  type WcTeamProfile,
} from "@/lib/wc/teams";
import { teamIdToCountryName } from "@/lib/wc/wcCountry";
import {
  formatLeagueCountryName,
  getClubLeagueIso2,
} from "@/lib/wc/clubLeagueCountry";
import {
  getWcKeyPlayers,
  isWcCaptainUnconfirmed,
  type WcKeyPlayer,
} from "@/lib/wc/rosters";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

type Props = {
  homeTeamId: string;
  awayTeamId: string;
  homeName: string;
  awayName: string;
  language: Language;
  isMobile: boolean;
};

export default function WcTeamProfilePanel({
  homeTeamId,
  awayTeamId,
  homeName,
  awayName,
  language,
  isMobile,
}: Props) {
  return (
    <div
      className={[
        "grid",
        isMobile ? "grid-cols-1 gap-3" : "grid-cols-2 gap-6",
      ].join(" ")}
    >
      <TeamCard
        teamId={homeTeamId}
        fallbackName={homeName}
        language={language}
        isMobile={isMobile}
      />
      <TeamCard
        teamId={awayTeamId}
        fallbackName={awayName}
        language={language}
        isMobile={isMobile}
      />
    </div>
  );
}

function TeamCard({
  teamId,
  fallbackName,
  language,
  isMobile,
}: {
  teamId: string;
  fallbackName: string;
  language: Language;
  isMobile: boolean;
}) {
  const m = t(language);
  const profile = getWcTeamProfile(teamId);
  const displayName =
    teamIdToCountryName(teamId, language === "ja" ? "ja" : "en") ?? fallbackName ?? "—";
  const keyPlayers = getWcKeyPlayers(teamId);
  const web = !isMobile;

  return (
    <div
      className={[
        "rounded-2xl border border-white/10 bg-white/[0.04]",
        isMobile ? "p-3" : "p-6",
      ].join(" ")}
    >
      {/* ヘッダー */}
      <div className={web ? "flex items-center gap-4" : "flex items-center gap-3"}>
        <CountryFlag
          teamId={teamId}
          className={web ? "h-[3.5rem] w-[5rem]" : "h-[2.4rem] w-[3.5rem]"}
        />
        <div className="min-w-0 flex-1">
          <div
            className={[
              "truncate font-bold leading-tight text-white",
              web ? "text-xl" : "text-base",
            ].join(" ")}
          >
            {displayName}
          </div>
          {profile?.nickname ? (
            <div
              className={[
                "truncate italic text-white/55",
                web ? "text-sm" : "text-[11px]",
              ].join(" ")}
            >
              {language === "ja" ? profile.nickname.ja : profile.nickname.en}
            </div>
          ) : null}
        </div>
      </div>

      {/* 数値ストリップ */}
      <div
        className={[
          "mt-3 grid grid-cols-4 gap-1 rounded-xl border border-white/8 bg-white/[0.025]",
          web ? "gap-2 px-3.5 py-3" : "px-2 py-2",
        ].join(" ")}
      >
        <Stat
          label="FIFA"
          value={
            profile?.fifaRank != null ? `#${profile.fifaRank}` : "—"
          }
          delta={fifaDelta(profile)}
          web={web}
        />
        <Stat
          label={m.wc.wcAppShort}
          value={
            profile?.wcAppearances != null
              ? `${profile.wcAppearances}`
              : "—"
          }
          web={web}
        />
        <Stat
          label={m.wc.titlesShort}
          value={profile?.wcTitles != null ? `${profile.wcTitles}` : "—"}
          web={web}
        />
        <Stat
          label={m.wc.lastShort}
          value={
            profile?.lastWcResult
              ? lastResultShort(
                  profile.lastWcResult.round,
                  profile.lastWcResult.year,
                  language,
                )
              : "—"
          }
          web={web}
        />
      </div>

      {/* 概要 */}
      {profile?.description ? (
        <p
          className={[
            "mt-3 text-white/80",
            web ? "text-base leading-relaxed" : "text-[12.5px] leading-snug",
          ].join(" ")}
        >
          {language === "ja" ? profile.description.ja : profile.description.en}
        </p>
      ) : null}

      {/* メタ */}
      <div
        className={[
          "mt-3 text-white/65",
          web ? "space-y-2 text-sm" : "space-y-1 text-[11.5px]",
        ].join(" ")}
      >
        {profile?.confederation ? (
          <MetaRow
            label={m.wc.confederationFull}
            value={formatWcConfederation(profile.confederation, language === "ja" ? "ja" : "en")}
            web={web}
          />
        ) : null}
        {profile?.manager ? (
          <MetaRow
            label={m.wc.managerLabel}
            value={profile.manager}
            web={web}
          />
        ) : null}
        {isWcCaptainUnconfirmed(teamId) ? (
          <MetaRow
            label={m.wc.captainLabel}
            value={m.wc.captainNotConfirmed}
            web={web}
          />
        ) : null}
        {profile?.lastWcResult ? (
          <MetaRow
            label={m.wc.lastWorldCup}
            value={`${profile.lastWcResult.year} · ${formatWcRoundReached(profile.lastWcResult.round, language === "ja" ? "ja" : "en")}`}
            web={web}
          />
        ) : null}
      </div>

      {/* キープレイヤー */}
      {keyPlayers.length > 0 ? (
        <div className="mt-3">
          <div
            className={[
              "mb-2 font-bold uppercase tracking-[0.16em] text-white/55",
              web ? "text-xs" : "text-[10px]",
            ].join(" ")}
          >
            {m.wc.keyPlayers}
          </div>
          <div
            className={[
              "overflow-hidden border border-white/8",
              web ? "rounded-xl" : "rounded-lg",
            ].join(" ")}
          >
            <div
              className={[
                "grid gap-x-2 border-b border-white/8 bg-white/[0.04] font-semibold uppercase tracking-[0.12em] text-white/45",
                web
                  ? "grid-cols-[3rem_1fr] px-3.5 py-2.5 text-[11px]"
                  : "grid-cols-[2.25rem_1fr] px-2 py-1.5 text-[9px]",
              ].join(" ")}
            >
              <span>{m.wc.keyPlayerPos}</span>
              <span>
                {m.wc.keyPlayerName}
                <span className="mx-1 font-normal text-white/30">·</span>
                {m.wc.keyPlayerClub}
              </span>
            </div>
            <ul className="divide-y divide-white/6">
              {keyPlayers.map((p) => (
                <KeyPlayerRow
                  key={`${p.pos}-${p.name}`}
                  player={p}
                  language={language}
                  web={web}
                />
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  delta,
  web = false,
}: {
  label: string;
  value: string;
  delta?: { dir: "up" | "down" | "flat"; n?: number } | null;
  web?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={[
          "font-semibold uppercase tracking-[0.12em] text-white/55",
          web ? "text-[11px]" : "text-[9.5px]",
        ].join(" ")}
      >
        {label}
      </div>
      <div
        className={[
          "inline-flex items-center justify-center gap-1",
          web ? "mt-1" : "mt-0.5",
        ].join(" ")}
      >
        <span
          className={[
            "font-bold tabular-nums text-white",
            web ? "text-lg" : "text-[14px]",
          ].join(" ")}
        >
          {value}
        </span>
        {delta && delta.dir !== "flat" ? (
          <span
            className={[
              "font-bold leading-none",
              web ? "text-xs" : "text-[10px]",
              delta.dir === "up" ? "text-emerald-400" : "text-rose-400",
            ].join(" ")}
            title={
              delta.n != null
                ? `${delta.dir === "up" ? "+" : "-"}${delta.n}`
                : undefined
            }
          >
            {delta.dir === "up" ? "▲" : "▼"}
            {delta.n ? delta.n : ""}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function MetaRow({
  label,
  value,
  web = false,
}: {
  label: string;
  value: string;
  web?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-baseline justify-between gap-2",
        web ? "text-sm" : "",
      ].join(" ")}
    >
      <span className="shrink-0 text-white/45">{label}</span>
      <span className="truncate text-right text-white/85">{value}</span>
    </div>
  );
}

function KeyPlayerRow({
  player,
  language,
  web = false,
}: {
  player: WcKeyPlayer;
  language: Language;
  web?: boolean;
}) {
  const m = t(language);
  const leagueIso2 = getClubLeagueIso2(player.club, player.leagueIso2);
  const leagueLabel = leagueIso2
    ? formatLeagueCountryName(leagueIso2, language)
    : null;

  return (
    <li
      className={[
        "grid items-center gap-x-2 text-white/85",
        web
          ? "grid-cols-[3rem_1fr] px-3.5 py-3 text-[15px]"
          : "grid-cols-[2.25rem_1fr] px-2 py-2 text-[12px]",
      ].join(" ")}
    >
      <span
        className={[
          "inline-flex shrink-0 items-center justify-center rounded-md bg-white/8 font-bold uppercase tracking-wider text-white/70",
          web ? "h-7 text-[11px]" : "h-5 text-[9.5px]",
        ].join(" ")}
      >
        {player.pos}
      </span>
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="flex min-w-0 shrink items-center gap-1">
          <span
            className={[
              "truncate font-semibold text-white",
              web ? "text-[15px]" : "",
            ].join(" ")}
          >
            {player.name}
          </span>
          {player.captain ? (
            <span
              className={[
                "shrink-0 rounded-sm bg-amber-300/90 px-1 py-px font-extrabold uppercase text-black/85",
                web ? "text-[10px]" : "text-[8px]",
              ].join(" ")}
              title={m.wc.keyPlayerCaptain}
            >
              {m.wc.keyPlayerCaptainShort}
            </span>
          ) : null}
        </span>
        {player.club ? (
          <>
            <span
              className={[
                "shrink-0 text-white/35",
                web ? "text-[11px]" : "text-[10px]",
              ].join(" ")}
              aria-hidden
            >
              ·
            </span>
            <span
              className={[
                "flex min-w-0 items-center gap-1 text-white/55",
                web ? "gap-1.5 text-sm" : "text-[10.5px]",
              ].join(" ")}
              title={
                leagueLabel
                  ? `${player.club} (${leagueLabel})`
                  : player.club
              }
            >
              {leagueIso2 ? (
                <CountryFlag
                  iso2={leagueIso2}
                  decorative
                  variant="inline"
                  className={
                    web
                      ? "aspect-[4/3] w-[1.2rem] shrink-0"
                      : "aspect-[4/3] w-[0.9rem] shrink-0"
                  }
                />
              ) : null}
              <span className="min-w-0 truncate">{player.club}</span>
            </span>
          </>
        ) : null}
      </div>
    </li>
  );
}

function fifaDelta(
  p: WcTeamProfile | null,
): { dir: "up" | "down" | "flat"; n?: number } | null {
  if (!p || p.fifaRank == null || p.fifaRankPrev == null) return null;
  const diff = p.fifaRankPrev - p.fifaRank;
  if (diff > 0) return { dir: "up", n: diff };
  if (diff < 0) return { dir: "down", n: -diff };
  return { dir: "flat" };
}

const ROUND_SHORT_JA: Record<WcRoundReached, string> = {
  Group: "GS",
  R16: "R16",
  QF: "QF",
  SF: "SF",
  "3rd": "3rd",
  Final: "2nd",
  W: "W",
};

const ROUND_SHORT_EN: Record<WcRoundReached, string> = {
  Group: "GS",
  R16: "R16",
  QF: "QF",
  SF: "SF",
  "3rd": "3rd",
  Final: "2nd",
  W: "Win",
};

function lastResultShort(
  round: WcRoundReached,
  year: number,
  language: Language,
): string {
  const map = language === "en" ? ROUND_SHORT_EN : ROUND_SHORT_JA;
  return `${map[round]} '${String(year).slice(-2)}`;
}
