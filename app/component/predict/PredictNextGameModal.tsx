"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import HalftoneJerseyMark from "@/app/component/games/HalftoneJerseyMark";
import CountryFlag from "@/app/component/games/CountryFlag";
import MatchListLineFrame from "@/app/component/games/MatchListLineFrame";
import UniterzLogoFlat from "@/app/component/units/UniterzLogoFlat";
import { jp, nameOxanium } from "@/lib/fonts";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";
import {
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
} from "@/lib/team-colors";
import { TIMEZONE_ET, TIMEZONE_JST } from "@/lib/time/zonedTime";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import {
  isPlayoffStyleGameCard,
  type SeriesStanding,
} from "@/lib/games/playoffSeriesUi";
import { displayNbaRoundLabel } from "@/lib/games/displayNbaRoundLabel";
import { splitTeamNameByLeague } from "@/lib/team-name-split";
import { compactNbaCardNickname } from "@/lib/nba-team-names";

type SideRecord = {
  wins: number;
  losses: number;
  rank?: number;
} | null;

type Props = {
  open: boolean;
  language: Language;
  league: League;
  homeName: string;
  awayName: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeColorHex?: string;
  awayColorHex?: string;
  /** キックオフ表示用（一覧の MatchCard と同じタイムゾーン規則） */
  startAtJst?: Date | null;
  seasonPhase?: "preseason" | "regular" | "play_in" | "playoffs" | null;
  roundLabel?: string | null;
  seriesStanding?: SeriesStanding | null;
  homeRecord?: SideRecord;
  awayRecord?: SideRecord;
  onYes: (dontShowAgain: boolean) => void;
  onNo: (dontShowAgain: boolean) => void;
};

function ordinalEn(n: number) {
  if (n % 100 >= 11 && n % 100 <= 13) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function formatKickoff(d: Date | null, timeZone: string) {
  if (!d) return "--:--";
  return d.toLocaleTimeString("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatRecordLine(
  r: SideRecord | undefined,
  language: Language
): string | null {
  if (!r || !Number.isFinite(r.wins) || !Number.isFinite(r.losses))
    return null;
  const core = `(${r.wins}-${r.losses})`;
  if (r.rank == null || !Number.isFinite(r.rank)) return core;
  return language === "en"
    ? `${core} :${r.rank}${ordinalEn(r.rank)}`
    : `${core}（${r.rank}位）`;
}

/** 中継カード用：ニックネーム優先（例: New York Knicks → Knicks） */
function scoreboardTeamLabel(
  league: League,
  rawName: string,
  language: Language
): string {
  const lg = normalizeLeague(league);
  const isEn = language === "en";
  if (lg !== "nba" && lg !== "bj" && lg !== "j1" && lg !== "pl") {
    const s = rawName.trim();
    return isEn ? s.toUpperCase() : s;
  }
  const [l1, l2] = splitTeamNameByLeague(lg, rawName);
  const rawNick = (l2 ?? "").replace(/\u00A0/g, "").trim();
  const nick = lg === "nba" && rawNick ? compactNbaCardNickname(rawNick) : rawNick;
  if (nick) return isEn ? nick.toUpperCase() : nick;
  const primary = (l1 ?? "").trim() || rawName.trim();
  return isEn ? primary.toUpperCase() : primary;
}

function broadcastDeckTitle(
  language: Language,
  seasonPhase: Props["seasonPhase"],
  roundLabel?: string | null
) {
  const isEn = language === "en";
  const msg = t(language);
  const rl = roundLabel?.trim();
  if (rl && isPlayoffStyleGameCard(seasonPhase, rl)) {
    return displayNbaRoundLabel(rl, isEn);
  }
  if (rl) {
    return displayNbaRoundLabel(rl, isEn);
  }
  if (seasonPhase === "playoffs") return msg.predict.playoffsLabel;
  if (seasonPhase === "play_in") return msg.predict.playInLabel;
  if (seasonPhase === "preseason") return "PRESEASON";
  return msg.predict.nextGame;
}

/** 一覧の線枠カードと同じ HOME / AWAY 列 */
function TeamColumn({
  sideLabel,
  isWc,
  teamId,
  jersey,
  jerseyEnd,
  title,
  recordLine,
}: {
  sideLabel: "HOME" | "AWAY";
  isWc: boolean;
  teamId?: string;
  jersey: string;
  jerseyEnd?: string;
  title: string;
  recordLine: string | null;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <span
        className={`${nameOxanium.className} text-[13px] font-bold uppercase leading-[15px] tracking-[0.07em] text-white/85`}
      >
        {sideLabel}
      </span>
      <div className="mt-0.5 flex h-[3.15rem] w-[3.15rem] items-center justify-center">
        {isWc ? (
          <CountryFlag
            teamId={teamId ?? null}
            className="h-[2.25rem] w-[3.3rem] rounded-none"
          />
        ) : (
          <HalftoneJerseyMark
            accent={jersey}
            accentEnd={jerseyEnd}
            className="h-[3.15rem] w-[3.15rem]"
          />
        )}
      </div>
      <p
        className={`${nameOxanium.className} mt-1 max-w-full truncate text-[13px] font-semibold uppercase leading-[15px] tracking-[0.05em] text-white`}
        style={{ transform: "skewX(-6deg)" }}
      >
        {title}
      </p>
      {recordLine ? (
        <p
          className={`${resultStatsMetricNumClass} max-w-full truncate text-[11px] leading-[13px] tabular-nums text-slate-200/70`}
        >
          {recordLine}
        </p>
      ) : null}
    </div>
  );
}

export default function PredictNextGameModal({
  open,
  language,
  league,
  homeName,
  awayName,
  homeTeamId,
  awayTeamId,
  homeColorHex,
  awayColorHex,
  startAtJst = null,
  seasonPhase = null,
  roundLabel = null,
  seriesStanding = null,
  homeRecord = null,
  awayRecord = null,
  onYes,
  onNo,
}: Props) {
  const m = t(language);
  const isEn = language === "en";
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [choice, setChoice] = useState<"yes" | "no">("yes");
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setDontShowAgain(false);
      setChoice("yes");
    }
    return () => {
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    };
  }, [open]);

  /** 選択の点灯を見せてから閉じる */
  const commitChoice = (next: "yes" | "no") => {
    if (commitTimerRef.current) return;
    setChoice(next);
    commitTimerRef.current = setTimeout(() => {
      commitTimerRef.current = null;
      if (next === "yes") onYes(dontShowAgain);
      else onNo(dontShowAgain);
    }, 160);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onNo(dontShowAgain);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onNo, dontShowAgain]);

  const lg = normalizeLeague(league);
  const displayTz = isEn ? TIMEZONE_ET : TIMEZONE_JST;

  const { homeJersey, awayJersey, homeJerseyEnd, awayJerseyEnd } =
    useMemo(() => {
      const fallbackHome = homeColorHex?.trim() || "#0ea5e9";
      const fallbackAway = awayColorHex?.trim() || "#f43f5e";
      const hj = homeTeamId
        ? getTeamJerseyPrimaryColor(lg, homeTeamId)
        : fallbackHome;
      const aj = awayTeamId
        ? getTeamJerseyPrimaryColor(lg, awayTeamId)
        : fallbackAway;
      const hje = homeTeamId
        ? getTeamJerseySecondaryColor(lg, homeTeamId)
        : undefined;
      const aje = awayTeamId
        ? getTeamJerseySecondaryColor(lg, awayTeamId)
        : undefined;
      return {
        homeJersey: hj,
        awayJersey: aj,
        homeJerseyEnd: hje,
        awayJerseyEnd: aje,
      };
    }, [lg, homeTeamId, awayTeamId, homeColorHex, awayColorHex]);

  const deckTitle = broadcastDeckTitle(language, seasonPhase, roundLabel);
  const kickoff = formatKickoff(startAtJst, displayTz);
  const homeLine = formatRecordLine(homeRecord, language);
  const awayLine = formatRecordLine(awayRecord, language);
  const showSeriesRow =
    seriesStanding != null &&
    isPlayoffStyleGameCard(seasonPhase, roundLabel);

  const { homeTitle, awayTitle } = useMemo(
    () => ({
      homeTitle: scoreboardTeamLabel(league, homeName, language),
      awayTitle: scoreboardTeamLabel(league, awayName, language),
    }),
    [league, homeName, awayName, language]
  );

  if (!open) return null;

  const txt = {
    title: m.predict.predictNextTitle,
    sub: m.predict.predictNextSub,
    skip: m.predict.predictNextSkip,
    yes: m.common.yes,
    no: m.predict.predictNextNo,
  };

  return (
    <div
      className="fixed inset-0 z-100010 flex min-h-dvh items-center justify-center bg-black/62 px-5 backdrop-blur-sm"
      role="dialog"
      aria-modal
      aria-labelledby="predict-next-title"
      aria-describedby="predict-next-sub"
      onClick={(e) => {
        if (e.target === e.currentTarget) onNo(dontShowAgain);
      }}
    >
      <div
        className={[
          "relative w-full max-w-[360px] rounded-none border-x border-b border-cyan-200/35 px-[18px] pb-[18px] pt-7",
          "bg-[rgba(5,8,14,0.7)]",
          "backdrop-blur-xl shadow-[0_20px_48px_rgba(0,0,0,0.55)]",
          jp.className,
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 上辺の枠線はロゴの左右で切る */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex h-px" aria-hidden>
          <span className="flex-1 bg-cyan-200/35" />
          <span className="w-[128px]" />
          <span className="flex-1 bg-cyan-200/35" />
        </div>
        <div
          className="pointer-events-none absolute left-1/2 top-0 z-10 w-[108px] -translate-x-1/2 -translate-y-1/2 text-white"
          aria-hidden
        >
          <UniterzLogoFlat width="100%" fill="currentColor" title="UNITERZ" />
        </div>

        <h2
          id="predict-next-title"
          className={`${nameOxanium.className} text-center text-[14px] font-bold tracking-[0.03em] text-slate-50`}
        >
          {txt.title}
        </h2>
        <p
          id="predict-next-sub"
          className="mt-1.5 text-center text-[12px] leading-[17px] text-slate-400"
        >
          {txt.sub}
        </p>

        {/* 一覧と同じ線枠カード（上辺にラウンド名） */}
        <MatchListLineFrame topLabel={deckTitle || undefined} className="mt-2">
          <div className="grid grid-cols-[1fr_minmax(5.5rem,1.05fr)_1fr] items-start gap-x-1 px-1 pb-3.5 pt-[18px]">
            <TeamColumn
              sideLabel="HOME"
              isWc={lg === "wc"}
              teamId={homeTeamId}
              jersey={homeJersey}
              jerseyEnd={homeJerseyEnd}
              title={homeTitle}
              recordLine={homeLine}
            />

            <div className="flex min-h-full min-w-0 flex-col items-center justify-center self-center text-center">
              <p
                className={[
                  resultStatsMetricNumClass,
                  "text-[24px] leading-[26px] tabular-nums text-slate-50 [text-shadow:0_1px_4px_rgba(0,0,0,0.45)]",
                ].join(" ")}
              >
                {kickoff}
              </p>
              {showSeriesRow && seriesStanding ? (
                <p className="mt-1 text-[12px] font-extrabold tabular-nums">
                  <span className="text-[#facc15]">
                    {seriesStanding.homeWins}
                  </span>
                  <span className="text-white/70"> — </span>
                  <span className="text-cyan-400">
                    {seriesStanding.awayWins}
                  </span>
                </p>
              ) : null}
            </div>

            <TeamColumn
              sideLabel="AWAY"
              isWc={lg === "wc"}
              teamId={awayTeamId}
              jersey={awayJersey}
              jerseyEnd={awayJerseyEnd}
              title={awayTitle}
              recordLine={awayLine}
            />
          </div>
        </MatchListLineFrame>

        <label className="mt-3.5 flex cursor-pointer items-center gap-2 border border-white/10 bg-white/[0.04] px-3 py-2.5 text-left text-[12px] leading-4 text-slate-200/90">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="size-4 shrink-0 cursor-pointer appearance-none rounded-none border border-cyan-200/55 bg-black/40 checked:border-[#00f5ff] checked:bg-[#00f5ff] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50"
          />
          <span>{txt.skip}</span>
        </label>

        {/* 真っ直ぐな選択セグメント（選択＝シアン塗り＋黒スキャン線） */}
        <div className="mt-[18px] flex gap-2.5">
          {(
            [
              { key: "no", label: txt.no.replace(/\n/g, "") },
              { key: "yes", label: txt.yes },
            ] as const
          ).map((item) => {
            const active = choice === item.key;
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={active}
                onClick={() => commitChoice(item.key)}
                className={[
                  "relative flex h-[42px] min-w-0 flex-1 items-center justify-center truncate rounded-none border border-[#00F5FF] px-1.5 text-[13px] font-bold tracking-[0.03em] transition-colors",
                  active
                    ? "bg-[#00F5FF] text-[#050508] shadow-[0_0_10px_rgba(0,245,255,0.55)]"
                    : "text-[#00F5FF] hover:bg-cyan-300/[0.08]",
                ].join(" ")}
                style={
                  active
                    ? {
                        backgroundImage:
                          "repeating-linear-gradient(to bottom, transparent 0 2px, rgba(5,5,8,0.22) 2px 3px)",
                      }
                    : undefined
                }
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
