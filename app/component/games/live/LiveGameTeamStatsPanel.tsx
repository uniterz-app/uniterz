"use client";

import Link from "next/link";
import {
  formatLiveTeamStatValue,
  type LiveGameStatsReport,
} from "@/lib/games/liveGameStats";
import { nameOxanium } from "@/lib/fonts";
import { getNbaTeamNicknameById } from "@/lib/nba-team-names";
import { nbaTeamDetailPreviewHref } from "@/lib/predict/nbaTeamDetailHref";
import { matchupTeamUiAccent } from "@/lib/team-colors";

type Props = {
  report: LiveGameStatsReport;
  /** オーバーレイ内など、Link の代わりに親が遷移を担うとき */
  onOpenTeamDetail?: (teamId: string) => void;
};

const WIN_GREEN = "#5cf0b5";
const FRAME = "rgba(255,255,255,0.22)";
const ROW_LINE = "rgba(255,255,255,0.1)";

/** チームスタッツ比較行のみ（スコアヘッダーは LiveGameStatsPanel 側） */
export default function LiveGameTeamStatsPanel({
  report,
  onOpenTeamDetail,
}: Props) {
  const homeColor = matchupTeamUiAccent(
    "nba",
    report.home.teamId,
    report.home.teamId,
    report.away.teamId
  );
  const awayColor = matchupTeamUiAccent(
    "nba",
    report.away.teamId,
    report.home.teamId,
    report.away.teamId
  );
  const homeNick = getNbaTeamNicknameById(report.home.teamId);
  const awayNick = getNbaTeamNicknameById(report.away.teamId);

  const nameClass = [
    nameOxanium.className,
    "min-w-0 flex-1 truncate text-[15px] font-extrabold uppercase tracking-[0.06em]",
  ].join(" ");

  const homeName = (
    <span
      className={[nameClass, "text-right"].join(" ")}
      style={{ color: homeColor, transform: "skewX(-6deg)" }}
    >
      {homeNick} →
    </span>
  );
  const awayName = (
    <span
      className={[nameClass, "text-left"].join(" ")}
      style={{ color: awayColor, transform: "skewX(-6deg)" }}
    >
      {awayNick} →
    </span>
  );

  return (
    <div
      className="overflow-hidden border px-3 py-1"
      style={{ borderColor: FRAME, backgroundColor: "#000" }}
    >
      <div
        className="flex items-center py-2"
        style={{ borderBottom: `1px solid ${ROW_LINE}` }}
      >
        {onOpenTeamDetail ? (
          <button
            type="button"
            className="min-w-0 flex-1 rounded-[2px] px-1 py-0.5 text-right transition-colors active:bg-white/15 active:opacity-85"
            onClick={() => onOpenTeamDetail(report.home.teamId)}
          >
            {homeName}
          </button>
        ) : (
          <Link
            href={nbaTeamDetailPreviewHref(report.home.teamId)}
            className="min-w-0 flex-1 rounded-[2px] px-1 py-0.5 text-right transition-colors active:bg-white/15 active:opacity-85"
          >
            {homeName}
          </Link>
        )}
        <span className="w-20 shrink-0" aria-hidden />
        {onOpenTeamDetail ? (
          <button
            type="button"
            className="min-w-0 flex-1 rounded-[2px] px-1 py-0.5 text-left transition-colors active:bg-white/15 active:opacity-85"
            onClick={() => onOpenTeamDetail(report.away.teamId)}
          >
            {awayName}
          </button>
        ) : (
          <Link
            href={nbaTeamDetailPreviewHref(report.away.teamId)}
            className="min-w-0 flex-1 rounded-[2px] px-1 py-0.5 text-left transition-colors active:bg-white/15 active:opacity-85"
          >
            {awayName}
          </Link>
        )}
      </div>

      {report.teamStats.map((row, i) => {
        const leftWin = row.lowerIsBetter
          ? row.home < row.away
          : row.home > row.away;
        const rightWin = row.lowerIsBetter
          ? row.away < row.home
          : row.away > row.home;
        const last = i === report.teamStats.length - 1;

        return (
          <div
            key={row.key}
            className="flex items-center py-2"
            style={
              last ? undefined : { borderBottom: `1px solid ${ROW_LINE}` }
            }
          >
            <p
              className={[
                nameOxanium.className,
                "flex-1 text-right text-[19px] font-extrabold tabular-nums",
                leftWin ? "" : "text-white",
              ].join(" ")}
              style={
                leftWin
                  ? {
                      color: WIN_GREEN,
                      textShadow:
                        "0 0 6px rgba(92,240,181,0.42), 0 0 2px rgba(92,240,181,0.55)",
                      transform: "skewX(-6deg)",
                    }
                  : { transform: "skewX(-6deg)" }
              }
            >
              {formatLiveTeamStatValue(row.home, row.format)}
            </p>
            <p
              className={[
                nameOxanium.className,
                "w-20 shrink-0 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-white/45",
              ].join(" ")}
            >
              {row.label}
            </p>
            <p
              className={[
                nameOxanium.className,
                "flex-1 text-left text-[19px] font-extrabold tabular-nums",
                rightWin ? "" : "text-white",
              ].join(" ")}
              style={
                rightWin
                  ? {
                      color: WIN_GREEN,
                      textShadow:
                        "0 0 6px rgba(92,240,181,0.42), 0 0 2px rgba(92,240,181,0.55)",
                      transform: "skewX(-6deg)",
                    }
                  : { transform: "skewX(-6deg)" }
              }
            >
              {formatLiveTeamStatValue(row.away, row.format)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
