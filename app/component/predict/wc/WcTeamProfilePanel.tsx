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
import { getWcRoster, type WcRosterPlayer } from "@/lib/wc/rosters";

type Lang = "ja" | "en";

type Props = {
  homeTeamId: string;
  awayTeamId: string;
  homeName: string;
  awayName: string;
  language: Lang;
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
        side="home"
        language={language}
        isMobile={isMobile}
      />
      <TeamCard
        teamId={awayTeamId}
        fallbackName={awayName}
        side="away"
        language={language}
        isMobile={isMobile}
      />
    </div>
  );
}

function TeamCard({
  teamId,
  fallbackName,
  side,
  language,
  isMobile,
}: {
  teamId: string;
  fallbackName: string;
  side: "home" | "away";
  language: Lang;
  isMobile: boolean;
}) {
  const isEn = language === "en";
  const profile = getWcTeamProfile(teamId);
  const displayName =
    teamIdToCountryName(teamId, language) ?? fallbackName ?? "—";
  const roster = getWcRoster(teamId);

  const sideLabel = isEn
    ? side === "home"
      ? "HOME"
      : "AWAY"
    : side === "home"
      ? "ホーム"
      : "アウェイ";

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
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
            {sideLabel}
          </div>
          <div className="truncate text-base font-bold leading-tight text-white">
            {displayName}
          </div>
          {profile?.nickname ? (
            <div className="truncate text-[11px] italic text-white/55">
              {isEn ? profile.nickname.en : profile.nickname.ja}
            </div>
          ) : null}
        </div>
      </div>

      {/* 数値ストリップ */}
      <div className="mt-3 grid grid-cols-4 gap-1 rounded-xl border border-white/8 bg-white/[0.025] px-2 py-2">
        <Stat
          label={isEn ? "FIFA" : "FIFA"}
          value={
            profile?.fifaRank != null ? `#${profile.fifaRank}` : "—"
          }
          delta={fifaDelta(profile)}
        />
        <Stat
          label={isEn ? "WC App." : "出場"}
          value={
            profile?.wcAppearances != null
              ? `${profile.wcAppearances}`
              : "—"
          }
        />
        <Stat
          label={isEn ? "Titles" : "優勝"}
          value={profile?.wcTitles != null ? `${profile.wcTitles}` : "—"}
        />
        <Stat
          label={isEn ? "Last" : "前回"}
          value={
            profile?.lastWcResult
              ? lastResultShort(
                  profile.lastWcResult.round,
                  profile.lastWcResult.year,
                  isEn,
                )
              : "—"
          }
        />
      </div>

      {/* 概要 */}
      {profile?.description ? (
        <p className="mt-3 text-[12.5px] leading-snug text-white/80">
          {isEn ? profile.description.en : profile.description.ja}
        </p>
      ) : null}

      {/* メタ */}
      <div className="mt-3 space-y-1 text-[11.5px] text-white/65">
        {profile?.confederation ? (
          <MetaRow
            label={isEn ? "Confederation" : "大陸連盟"}
            value={formatWcConfederation(profile.confederation, language)}
          />
        ) : null}
        {profile?.manager ? (
          <MetaRow
            label={isEn ? "Manager" : "監督"}
            value={profile.manager}
          />
        ) : null}
        {profile?.lastWcResult ? (
          <MetaRow
            label={isEn ? "Last World Cup" : "直近大会"}
            value={`${profile.lastWcResult.year} · ${formatWcRoundReached(profile.lastWcResult.round, language)}`}
          />
        ) : null}
      </div>

      {/* キープレイヤー */}
      {roster.length > 0 ? (
        <div className="mt-3">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
            {isEn ? "Key Players" : "キープレイヤー"}
          </div>
          <ul className="space-y-1">
            {roster.slice(0, 6).map((p) => (
              <RosterRow key={`${p.no}-${p.name}`} player={p} isEn={isEn} />
            ))}
          </ul>
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

function RosterRow({
  player,
  isEn,
}: {
  player: WcRosterPlayer;
  isEn: boolean;
}) {
  return (
    <li className="flex items-center gap-2 text-[12px] text-white/85">
      <span className="inline-flex h-5 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-[10px] font-bold tabular-nums text-white/85">
        {player.no}
      </span>
      <span className="inline-flex h-5 shrink-0 items-center rounded-md bg-white/8 px-1.5 text-[9.5px] font-bold uppercase tracking-wider text-white/65">
        {player.pos}
      </span>
      <span className="truncate font-semibold text-white">
        {player.name}
        {player.captain ? (
          <span className="ml-1 inline-flex h-3.5 items-center rounded-sm bg-amber-300/85 px-1 text-[8px] font-extrabold text-black/85">
            {isEn ? "C" : "C"}
          </span>
        ) : null}
      </span>
      {player.club ? (
        <span className="ml-auto truncate text-[10.5px] text-white/55">
          {player.club}
        </span>
      ) : null}
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
  isEn: boolean,
): string {
  const map = isEn ? ROUND_SHORT_EN : ROUND_SHORT_JA;
  return `${map[round]} '${String(year).slice(-2)}`;
}
