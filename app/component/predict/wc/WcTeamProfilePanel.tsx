"use client";

import { useEffect, useState, type ReactNode } from "react";
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
import WcFormationPanel from "@/app/component/predict/wc/WcFormationPanel";
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

type TeamSide = "home" | "away";

export default function WcTeamProfilePanel({
  homeTeamId,
  awayTeamId,
  homeName,
  awayName,
  language,
  isMobile,
}: Props) {
  const [side, setSide] = useState<TeamSide>("home");

  useEffect(() => {
    setSide("home");
  }, [homeTeamId, awayTeamId]);

  const homeDisplay =
    teamIdToCountryName(homeTeamId, language === "ja" ? "ja" : "en") ??
    homeName;
  const awayDisplay =
    teamIdToCountryName(awayTeamId, language === "ja" ? "ja" : "en") ??
    awayName;

  if (isMobile) {
    const activeTeamId = side === "home" ? homeTeamId : awayTeamId;
    const activeName = side === "home" ? homeName : awayName;

    return (
      <div>
        <div className="grid grid-cols-2 gap-1.5 border-b border-white/10 pb-2">
          {(
            [
              { side: "home" as const, teamId: homeTeamId, label: homeDisplay },
              { side: "away" as const, teamId: awayTeamId, label: awayDisplay },
            ] as const
          ).map((item) => {
            const active = side === item.side;
            return (
              <button
                key={item.side}
                type="button"
                onClick={() => setSide(item.side)}
                className={[
                  "flex min-w-0 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors",
                  active
                    ? "border-cyan-300/35 bg-cyan-300/12 text-white"
                    : "border-white/10 bg-white/[0.035] text-white/70",
                ].join(" ")}
              >
                <CountryFlag
                  teamId={item.teamId}
                  variant="inline"
                  className="aspect-[4/3] h-[1.1rem] w-[1.45rem] shrink-0"
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-3">
          <TeamCard
            teamId={activeTeamId}
            fallbackName={activeName}
            language={language}
            isMobile={isMobile}
          />
        </div>
      </div>
    );
  }

  return (
    <WebSyncedTeamGrid
      homeTeamId={homeTeamId}
      awayTeamId={awayTeamId}
      homeName={homeName}
      awayName={awayName}
      language={language}
    />
  );
}

/** Web: 行ごとに2チームを並べ、説明文の行数差でも下のブロック開始位置を揃える */
function WebSyncedTeamGrid({
  homeTeamId,
  awayTeamId,
  homeName,
  awayName,
  language,
}: {
  homeTeamId: string;
  awayTeamId: string;
  homeName: string;
  awayName: string;
  language: Language;
}) {
  const home = getTeamProfileSections(homeTeamId, homeName, language, false);
  const away = getTeamProfileSections(awayTeamId, awayName, language, false);

  const rows: Array<{ key: string; home: ReactNode; away: ReactNode }> = [
    { key: "header", home: home.header, away: away.header },
    { key: "stats", home: home.stats, away: away.stats },
    { key: "description", home: home.description, away: away.description },
    { key: "meta", home: home.meta, away: away.meta },
    { key: "formation", home: home.formation, away: away.formation },
    { key: "keyPlayers", home: home.keyPlayers, away: away.keyPlayers },
  ];

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute bottom-0 top-0 left-1/2 w-px -translate-x-1/2 bg-white/10"
        aria-hidden
      />
      <div className="grid grid-cols-2 items-stretch gap-x-6 gap-y-3">
        {rows.flatMap((row) => [
          <div key={`${row.key}-home`} className="flex min-h-0 min-w-0 flex-col">
            {row.home}
          </div>,
          <div key={`${row.key}-away`} className="flex min-h-0 min-w-0 flex-col">
            {row.away}
          </div>,
        ])}
      </div>
    </div>
  );
}

function getTeamProfileSections(
  teamId: string,
  fallbackName: string,
  language: Language,
  isMobile: boolean,
) {
  const m = t(language);
  const profile = getWcTeamProfile(teamId);
  const displayName =
    teamIdToCountryName(teamId, language === "ja" ? "ja" : "en") ??
    fallbackName ??
    "—";
  const keyPlayers = getWcKeyPlayers(teamId);
  const web = !isMobile;

  return {
    header: (
      <TeamProfileHeader
        teamId={teamId}
        displayName={displayName}
        nickname={
          profile?.nickname
            ? language === "ja"
              ? profile.nickname.ja
              : profile.nickname.en
            : null
        }
        web={web}
      />
    ),
    stats: (
      <TeamProfileStats
        profile={profile}
        language={language}
        m={m}
        web={web}
      />
    ),
    description: (
      <TeamProfileDescription
        profile={profile}
        language={language}
        web={web}
      />
    ),
    meta: (
      <TeamProfileMeta
        teamId={teamId}
        profile={profile}
        language={language}
        m={m}
        web={web}
      />
    ),
    formation: (
      <WcFormationPanel
        teamId={teamId}
        language={language}
        isMobile={isMobile}
        className="!mt-0"
      />
    ),
    keyPlayers: (
      <TeamProfileKeyPlayers
        keyPlayers={keyPlayers}
        language={language}
        m={m}
        web={web}
      />
    ),
  };
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
  const sections = getTeamProfileSections(teamId, fallbackName, language, isMobile);

  return (
    <div className="min-w-0 space-y-3">
      {sections.header}
      {sections.stats}
      {sections.description}
      {sections.meta}
      {sections.formation}
      {sections.keyPlayers}
    </div>
  );
}

function TeamProfileHeader({
  teamId,
  displayName,
  nickname,
  web,
}: {
  teamId: string;
  displayName: string;
  nickname: string | null;
  web: boolean;
}) {
  return (
    <div className={web ? "flex min-h-[3.5rem] items-center gap-4" : "flex items-center gap-3"}>
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
        <div
          className={[
            "truncate italic text-white/55",
            web ? "min-h-[1.25rem] text-sm" : "min-h-[1rem] text-[11px]",
            nickname ? "" : "invisible",
          ].join(" ")}
          aria-hidden={!nickname}
        >
          {nickname ?? "\u00a0"}
        </div>
      </div>
    </div>
  );
}

function TeamProfileStats({
  profile,
  language,
  m,
  web,
}: {
  profile: WcTeamProfile | null;
  language: Language;
  m: ReturnType<typeof t>;
  web: boolean;
}) {
  return (
    <div
      className={[
        "grid grid-cols-4 gap-1 rounded-xl border border-white/8 bg-white/[0.025]",
        web ? "gap-2 px-3.5 py-3" : "px-2 py-2",
      ].join(" ")}
    >
      <Stat
        label="FIFA"
        value={profile?.fifaRank != null ? `#${profile.fifaRank}` : "—"}
        delta={fifaDelta(profile)}
        web={web}
      />
      <Stat
        label={m.wc.wcAppShort}
        value={profile?.wcAppearances != null ? `${profile.wcAppearances}` : "—"}
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
  );
}

function TeamProfileDescription({
  profile,
  language,
  web,
}: {
  profile: WcTeamProfile | null;
  language: Language;
  web: boolean;
}) {
  const text = profile?.description
    ? language === "ja"
      ? profile.description.ja
      : profile.description.en
    : null;

  return (
    <p
      className={[
        "text-white/80",
        web ? "text-base leading-relaxed" : "text-[12.5px] leading-snug",
      ].join(" ")}
    >
      {text ?? "\u00a0"}
    </p>
  );
}

function TeamProfileMeta({
  teamId,
  profile,
  language,
  m,
  web,
}: {
  teamId: string;
  profile: WcTeamProfile | null;
  language: Language;
  m: ReturnType<typeof t>;
  web: boolean;
}) {
  const rows: ReactNode[] = [];
  if (profile?.confederation) {
    rows.push(
      <MetaRow
        key="confederation"
        label={m.wc.confederationFull}
        value={formatWcConfederation(
          profile.confederation,
          language === "ja" ? "ja" : "en",
        )}
        web={web}
      />,
    );
  }
  if (profile?.manager) {
    rows.push(
      <MetaRow key="manager" label={m.wc.managerLabel} value={profile.manager} web={web} />,
    );
  }
  if (isWcCaptainUnconfirmed(teamId)) {
    rows.push(
      <MetaRow
        key="captain"
        label={m.wc.captainLabel}
        value={m.wc.captainNotConfirmed}
        web={web}
      />,
    );
  }
  if (profile?.lastWcResult) {
    rows.push(
      <MetaRow
        key="lastWc"
        label={m.wc.lastWorldCup}
        value={`${profile.lastWcResult.year} · ${formatWcRoundReached(profile.lastWcResult.round, language === "ja" ? "ja" : "en")}`}
        web={web}
      />,
    );
  }

  return (
    <div
      className={[
        "text-white/65",
        web ? "space-y-2 text-sm" : "space-y-1 text-[11.5px]",
      ].join(" ")}
    >
      {rows.length > 0 ? rows : web ? <span className="invisible block">\u00a0</span> : null}
    </div>
  );
}

function TeamProfileKeyPlayers({
  keyPlayers,
  language,
  m,
  web,
}: {
  keyPlayers: WcKeyPlayer[];
  language: Language;
  m: ReturnType<typeof t>;
  web: boolean;
}) {
  if (keyPlayers.length === 0) {
    return web ? <div className="min-h-0" aria-hidden /> : null;
  }

  return (
    <div>
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
