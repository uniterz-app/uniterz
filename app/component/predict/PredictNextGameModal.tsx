"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import HalftoneJerseyMark from "@/app/component/games/HalftoneJerseyMark";
import { jp } from "@/lib/fonts";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";
import {
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
} from "@/lib/team-colors";
import { TIMEZONE_ET, TIMEZONE_JST } from "@/lib/time/zonedTime";
import {
  isPlayoffStyleGameCard,
  type SeriesStanding,
} from "@/lib/games/playoffSeriesUi";
import { splitTeamNameByLeague } from "@/lib/team-name-split";

type SideRecord = {
  wins: number;
  losses: number;
  rank?: number;
} | null;

type Props = {
  open: boolean;
  isEn: boolean;
  league: League;
  homeName: string;
  awayName: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeColorHex?: string;
  awayColorHex?: string;
  /** キックオフ表示用（一覧の MatchCard と同じタイムゾーン規則） */
  startAtJst?: Date | null;
  seasonPhase?: "regular" | "play_in" | "playoffs" | null;
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
  isEn: boolean
): string | null {
  if (!r || !Number.isFinite(r.wins) || !Number.isFinite(r.losses))
    return null;
  const core = `(${r.wins}-${r.losses})`;
  if (r.rank == null || !Number.isFinite(r.rank)) return core;
  return isEn
    ? `${core} :${r.rank}${ordinalEn(r.rank)}`
    : `${core}（${r.rank}位）`;
}

/** 中継カード用：ニックネーム優先（例: New York Knicks → Knicks） */
function scoreboardTeamLabel(
  league: League,
  rawName: string,
  isEn: boolean
): string {
  const lg = normalizeLeague(league);
  if (lg !== "nba" && lg !== "bj" && lg !== "j1" && lg !== "pl") {
    const s = rawName.trim();
    return isEn ? s.toUpperCase() : s;
  }
  const [l1, l2] = splitTeamNameByLeague(lg, rawName);
  const nick = (l2 ?? "").replace(/\u00A0/g, "").trim();
  if (nick) return isEn ? nick.toUpperCase() : nick;
  const primary = (l1 ?? "").trim() || rawName.trim();
  return isEn ? primary.toUpperCase() : primary;
}

function broadcastDeckTitle(
  isEn: boolean,
  seasonPhase: Props["seasonPhase"],
  roundLabel?: string | null
) {
  const rl = roundLabel?.trim();
  if (rl && isPlayoffStyleGameCard(seasonPhase, rl)) {
    return isEn ? rl.toUpperCase() : rl;
  }
  if (rl) return isEn ? rl.toUpperCase() : rl;
  if (seasonPhase === "playoffs") return isEn ? "PLAYOFFS" : "プレーオフ";
  if (seasonPhase === "play_in") return isEn ? "PLAY-IN" : "プレーイン";
  return isEn ? "NEXT GAME" : "次の試合";
}

export default function PredictNextGameModal({
  open,
  isEn,
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
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (open) setDontShowAgain(false);
  }, [open]);

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

  const deckTitle = broadcastDeckTitle(isEn, seasonPhase, roundLabel);
  const kickoff = formatKickoff(startAtJst, displayTz);
  const homeLine = formatRecordLine(homeRecord, isEn);
  const awayLine = formatRecordLine(awayRecord, isEn);
  const showSeriesRow =
    seriesStanding != null &&
    isPlayoffStyleGameCard(seasonPhase, roundLabel);

  const { homeTitle, awayTitle } = useMemo(
    () => ({
      homeTitle: scoreboardTeamLabel(league, homeName, isEn),
      awayTitle: scoreboardTeamLabel(league, awayName, isEn),
    }),
    [league, homeName, awayName, isEn]
  );

  if (!open) return null;

  const t = isEn
    ? {
        title: "Predict the next game too?",
        sub: "The next match in the same league on the same day.",
        skip: "Don’t show this again",
        yes: "Yes",
        no: "No (back to schedule)",
      }
    : {
        title: "次の試合も予想しますか？",
        sub: "同じリーグ・同じ日の直後の試合です。",
        skip: "今後この案内を表示しない",
        yes: "はい",
        no: "いいえ\n（試合一覧へ）",
      };

  const gridBgStyle: CSSProperties = {
    backgroundColor: "#080c12",
    backgroundImage: [
      "linear-gradient(to right, rgba(255,255,255,0.038) 1px, transparent 1px)",
      "linear-gradient(to bottom, rgba(255,255,255,0.038) 1px, transparent 1px)",
      "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(34,211,238,0.07), transparent 55%)",
    ].join(","),
    backgroundSize: "9px 9px, 9px 9px, auto",
  };

  return (
    <div
      className="fixed inset-0 z-100010 flex min-h-dvh items-center justify-center bg-black/72 p-3 backdrop-blur-[3px]"
      role="dialog"
      aria-modal
      aria-labelledby="predict-next-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onNo(dontShowAgain);
      }}
    >
      <div
        className={[
          "relative w-full max-w-[21rem] overflow-hidden rounded-2xl sm:max-w-[22rem]",
          "border border-white/[0.13]",
          "bg-[linear-gradient(168deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.025)_18%,rgba(6,11,18,0.96)_45%,rgba(3,7,12,0.99)_100%)]",
          "px-3 py-3 shadow-[0_28px_72px_rgba(0,0,0,0.72),0_0_0_1px_rgba(255,255,255,0.04)_inset,0_0_48px_-12px_rgba(34,211,238,0.14)]",
          /* モバイルのみ縦中央から上へ */
          "max-sm:-translate-y-8 sm:translate-y-0",
          jp.className,
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        {/* モーダル上端のシアンライン */}
        <div
          className="pointer-events-none absolute inset-x-4 top-0 h-px bg-linear-to-r from-transparent via-cyan-400/55 to-transparent sm:inset-x-5"
          aria-hidden
        />
        <div className="flex flex-col items-stretch">
          <h2
            id="predict-next-title"
            className="relative mb-2 text-center text-[12px] font-bold leading-tight text-white sm:mb-2.5 sm:text-[13px]"
          >
            {t.title}
          </h2>
          <div
            className="pointer-events-none mb-2 h-px w-full bg-linear-to-r from-transparent via-cyan-400/22 to-transparent"
            aria-hidden
          />

          {/* グラデ縁＋グリッド地の中継カード */}
          <div
            className="rounded-xl bg-linear-to-br from-cyan-400/45 via-white/[0.14] to-blue-600/35 p-px shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
            aria-describedby="predict-next-sub"
          >
            <div
              className="relative overflow-hidden rounded-[11px] ring-1 ring-black/50"
              style={gridBgStyle}
            >
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(95%_65%_at_50%_0%,rgba(255,255,255,0.09),transparent_52%)]"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(34,211,238,0.04)_0%,transparent_28%,transparent_72%,rgba(0,0,0,0.35)_100%)]"
                aria-hidden
              />
            <div className="relative px-1.5 pb-1.5 pt-1.5 sm:px-2 sm:pb-2 sm:pt-2">
              <p className="mb-1 text-center text-[8px] font-semibold uppercase tracking-[0.14em] text-white/85 sm:mb-1.5 sm:text-[9px]">
                {deckTitle}
              </p>

              <div className="grid grid-cols-[1fr_minmax(4.5rem,auto)_1fr] items-start gap-x-1 sm:grid-cols-[1fr_minmax(5.25rem,auto)_1fr] sm:gap-x-1.5">
                {/* ホーム列（HOME） */}
                <div className="flex min-w-0 flex-col items-center text-center">
                  <span className="mb-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-white/55 sm:text-[9px]">
                    HOME
                  </span>
                  <HalftoneJerseyMark
                    accent={homeJersey}
                    accentEnd={homeJerseyEnd}
                    className="h-[3.35rem] w-[3.35rem] sm:h-[3.85rem] sm:w-[3.85rem]"
                  />
                  <p
                    className={[
                      "mt-1 min-w-0 text-[11px] font-bold leading-tight text-white sm:text-xs",
                      isEn ? "font-semibold tracking-tight" : "",
                    ].join(" ")}
                  >
                    {homeTitle}
                  </p>
                  {homeLine ? (
                    <p className="mt-px text-[8px] tabular-nums leading-tight text-white/45 sm:text-[9px]">
                      {homeLine}
                    </p>
                  ) : null}
                </div>

                {/* 中央：キックオフ＋シリーズ（ユニの高さに合わせて下げる） */}
                <div className="flex min-w-0 flex-col items-center justify-start pt-4 text-center sm:pt-[1.15rem]">
                  <p
                    className={[
                      resultStatsMetricNumClass,
                      "text-[1.1rem] leading-none text-white sm:text-[1.2rem]",
                    ].join(" ")}
                  >
                    {kickoff}
                  </p>
                  {showSeriesRow && seriesStanding ? (
                    <p className="mt-1 text-[9px] font-semibold tabular-nums sm:text-[10px]">
                      <span className="text-white/55">( </span>
                      <span className="text-[#facc15]">
                        {seriesStanding.homeWins}
                      </span>
                      <span className="text-white/70"> — </span>
                      <span className="text-cyan-400">
                        {seriesStanding.awayWins}
                      </span>
                      <span className="text-white/55"> )</span>
                    </p>
                  ) : (
                    <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.16em] text-white/32">
                      vs
                    </p>
                  )}
                </div>

                {/* アウェイ列（AWAY） */}
                <div className="flex min-w-0 flex-col items-center text-center">
                  <span className="mb-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-white/55 sm:text-[9px]">
                    AWAY
                  </span>
                  <HalftoneJerseyMark
                    accent={awayJersey}
                    accentEnd={awayJerseyEnd}
                    className="h-[3.35rem] w-[3.35rem] sm:h-[3.85rem] sm:w-[3.85rem]"
                  />
                  <p
                    className={[
                      "mt-1 min-w-0 text-[11px] font-bold leading-tight text-white sm:text-xs",
                      isEn ? "font-semibold tracking-tight" : "",
                    ].join(" ")}
                  >
                    {awayTitle}
                  </p>
                  {awayLine ? (
                    <p className="mt-px text-[8px] tabular-nums leading-tight text-white/45 sm:text-[9px]">
                      {awayLine}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <p
              id="predict-next-sub"
              className="relative border-t border-white/[0.09] bg-black/25 px-2 py-1.5 text-center text-[9px] leading-snug text-white/52 sm:px-2.5 sm:text-[10px]"
            >
              {t.sub}
            </p>
            <label className="relative flex cursor-pointer items-start gap-1.5 border-t border-white/[0.09] bg-black/30 px-2 py-1.5 text-left text-[9px] leading-snug text-white/78 sm:px-2.5 sm:py-2 sm:text-[10px] sm:text-white/82">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="mt-px size-2.5 shrink-0 rounded border-white/35 bg-black/50 text-cyan-500 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset] focus:ring-cyan-400/40 sm:size-3"
              />
              <span>{t.skip}</span>
            </label>
            </div>
          </div>

          {/* カードと揃えたメタリック系の二択ボタン（コンパクト） */}
          <div className="mt-2.5 flex w-full flex-row gap-2 sm:mt-3">
            <button
              type="button"
              onClick={() => onNo(dontShowAgain)}
              className={[
                "relative flex min-h-10 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-xl px-1.5 py-1",
                "whitespace-pre-line text-center",
                "border border-white/[0.18]",
                "bg-[linear-gradient(168deg,rgba(255,255,255,0.11)_0%,rgba(255,255,255,0.045)_42%,rgba(255,255,255,0.02)_100%)]",
                "text-[11px] font-semibold leading-tight text-white/92 sm:text-xs",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_6px_16px_rgba(0,0,0,0.38)]",
                "transition-[transform,box-shadow,border-color,background-color,color] duration-200",
                "hover:border-white/28 hover:text-white",
                "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0_20px_rgba(255,255,255,0.06),0_8px_20px_rgba(0,0,0,0.42)]",
                "active:scale-[0.98]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-1 focus-visible:ring-offset-[#060a10]",
              ].join(" ")}
            >
              <span
                className="pointer-events-none absolute inset-x-2 top-0 h-px rounded-full bg-linear-to-r from-transparent via-white/40 to-transparent opacity-65"
                aria-hidden
              />
              {t.no}
            </button>
            <button
              type="button"
              onClick={() => onYes(dontShowAgain)}
              className={[
                "relative flex min-h-10 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-xl border px-1.5 py-1",
                "border-cyan-200/50",
                "bg-[linear-gradient(152deg,#ecfeff_0%,#67e8f9_22%,#22d3ee_48%,#0ea5e9_78%,#0369a1_100%)]",
                "text-[11px] font-bold leading-snug text-slate-950 sm:text-xs",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_0_22px_rgba(34,211,238,0.32),0_6px_16px_rgba(0,0,0,0.32)]",
                "transition-[transform,box-shadow,border-color,filter] duration-200",
                "hover:border-cyan-100/70 hover:brightness-[1.03]",
                "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.58),0_0_28px_rgba(34,211,238,0.45),0_8px_18px_rgba(0,0,0,0.36)]",
                "active:scale-[0.98]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-1 focus-visible:ring-offset-[#060a10]",
              ].join(" ")}
            >
              <span
                className="pointer-events-none absolute inset-x-4 top-0.5 h-[36%] rounded-full bg-linear-to-b from-white/45 to-transparent opacity-50"
                aria-hidden
              />
              {t.yes}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
