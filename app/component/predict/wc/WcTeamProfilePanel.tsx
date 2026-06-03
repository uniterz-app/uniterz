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
        "grid gap-3",
        isMobile ? "grid-cols-1" : "grid-cols-2 gap-4",
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

  return (
    <div
      className={[
        "rounded-2xl border border-white/10 bg-white/[0.04] p-3",
        isMobile ? "" : "p-4",
      ].join(" ")}
    >
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <CountryFlag teamId={teamId} className="w-[3.5rem] h-[2.4rem]" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-bold leading-tight text-white">
            {displayName}
          </div>
          {profile?.nickname ? (
            <div className="truncate text-[11px] italic text-white/55">
              {language === "ja" ? profile.nickname.ja : profile.nickname.en}
            </div>
          ) : null}
        </div>
      </div>

      {/* 数値ストリップ */}
      <div className="mt-3 grid grid-cols-4 gap-1 rounded-xl border border-white/8 bg-white/[0.025] px-2 py-2">
        <Stat
          label="FIFA"
          value={
            profile?.fifaRank != null ? `#${profile.fifaRank}` : "—"
          }
          delta={fifaDelta(profile)}
        />
        <Stat
          label={m.wc.wcAppShort}
          value={
            profile?.wcAppearances != null
              ? `${profile.wcAppearances}`
              : "—"
          }
        />
        <Stat
          label={m.wc.titlesShort}
          value={profile?.wcTitles != null ? `${profile.wcTitles}` : "—"}
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
        />
      </div>

      {/* 概要 */}
      {profile?.description ? (
        <p className="mt-3 text-[12.5px] leading-snug text-white/80">
          {language === "ja" ? profile.description.ja : profile.description.en}
        </p>
      ) : null}

      {/* メタ */}
      <div className="mt-3 space-y-1 text-[11.5px] text-white/65">
        {profile?.confederation ? (
          <MetaRow
            label={m.wc.confederationFull}
            value={formatWcConfederation(profile.confederation, language === "ja" ? "ja" : "en")}
          />
        ) : null}
        {profile?.manager ? (
          <MetaRow
            label={m.wc.managerLabel}
            value={profile.manager}
          />
        ) : null}
        {isWcCaptainUnconfirmed(teamId) ? (
          <MetaRow
            label={m.wc.captainLabel}
            value={m.wc.captainNotConfirmed}
          />
        ) : null}
        {profile?.lastWcResult ? (
          <MetaRow
            label={m.wc.lastWorldCup}
            value={`${profile.lastWcResult.year} · ${formatWcRoundReached(profile.lastWcResult.round, language === "ja" ? "ja" : "en")}`}
          />
        ) : null}
      </div>

      {/* キープレイヤー */}
      {keyPlayers.length > 0 ? (
        <div className="mt-3">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
            {m.wc.keyPlayers}
          </div>
          <div className="overflow-hidden rounded-lg border border-white/8">
            <div className="grid grid-cols-[2.25rem_1fr] gap-x-2 border-b border-white/8 bg-white/[0.04] px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/45">
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
}: {
  label: string;
  value: string;
  delta?: { dir: "up" | "down" | "flat"; n?: number } | null;
}) {
  return (
    <div className="text-center">
      <div className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-white/55">
        {label}
      </div>
      <div className="mt-0.5 inline-flex items-center justify-center gap-1">
        <span className="text-[14px] font-bold tabular-nums text-white">
          {value}
        </span>
        {delta && delta.dir !== "flat" ? (
          <span
            className={[
              "text-[10px] font-bold leading-none",
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

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="shrink-0 text-white/45">{label}</span>
      <span className="truncate text-right text-white/85">{value}</span>
    </div>
  );
}

function KeyPlayerRow({
  player,
  language,
}: {
  player: WcKeyPlayer;
  language: Language;
}) {
  const m = t(language);
  const leagueIso2 = getClubLeagueIso2(player.club, player.leagueIso2);
  const leagueLabel = leagueIso2
    ? formatLeagueCountryName(leagueIso2, language)
    : null;

  return (
    <li className="grid grid-cols-[2.25rem_1fr] items-center gap-x-2 px-2 py-2 text-[12px] text-white/85">
      <span className="inline-flex h-5 shrink-0 items-center justify-center rounded-md bg-white/8 text-[9.5px] font-bold uppercase tracking-wider text-white/70">
        {player.pos}
      </span>
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="flex min-w-0 shrink items-center gap-1">
          <span className="truncate font-semibold text-white">{player.name}</span>
          {player.captain ? (
            <span
              className="shrink-0 rounded-sm bg-amber-300/90 px-1 py-px text-[8px] font-extrabold uppercase text-black/85"
              title={m.wc.keyPlayerCaptain}
            >
              {m.wc.keyPlayerCaptainShort}
            </span>
          ) : null}
        </span>
        {player.club ? (
          <>
            <span className="shrink-0 text-[10px] text-white/35" aria-hidden>
              ·
            </span>
            <span
              className="flex min-w-0 items-center gap-1 text-[10.5px] text-white/55"
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
                  className="aspect-[4/3] w-[0.9rem] shrink-0"
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
