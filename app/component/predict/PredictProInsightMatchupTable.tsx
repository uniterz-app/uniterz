"use client";

/**
 * Pro Insight MATCHUP — 攻め × 相手の守りの順位差が大きい順の表（Native `PredictProInsightMatchupTableNative` 相当）。
 * 左 = HOME / 右 = AWAY（試合カード・パネル見出しと同じ並び）。有利な側の順位をチーム色にする。
 */
import type {
  ProInsightMatchupStatSide,
  ProInsightMatchupStatTable,
} from "@/lib/predict/proInsightNarrativeTypes";
import { L, type LocalizedLang } from "@/lib/i18n/localize";
import {
  matchupRankText,
  matchupTableCaption,
} from "@/lib/predict/proInsightMatchupTableCopy";
import { nameOxanium, jp } from "@/lib/fonts";

type Props = {
  table: ProInsightMatchupStatTable;
  lang: LocalizedLang;
  awayNick: string;
  homeNick: string;
  awayColor: string;
  homeColor: string;
};

function Cell({
  side,
  edge,
  color,
  align,
  lang,
}: {
  side: ProInsightMatchupStatSide;
  edge: boolean;
  color: string;
  align: "start" | "end";
  lang: LocalizedLang;
}) {
  return (
    <div
      className={[
        "flex min-w-0 flex-col",
        align === "start" ? "items-start text-left" : "items-end text-right",
      ].join(" ")}
    >
      <span
        className={[nameOxanium.className, "text-[15px] font-extrabold leading-[18px]"].join(" ")}
        style={{ color: edge ? color : "rgba(255,255,255,0.4)" }}
      >
        {matchupRankText(side.rank, lang)}
      </span>
      <span
        className={[nameOxanium.className, "truncate text-[11px] leading-[14px] text-white/50"].join(" ")}
      >
        {L(lang, side.metric)} {side.value}
      </span>
    </div>
  );
}

export default function PredictProInsightMatchupTable({
  table,
  lang,
  awayNick,
  homeNick,
  awayColor,
  homeColor,
}: Props) {
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pb-1">
        <span
          className={[nameOxanium.className, "truncate text-[10px] font-extrabold uppercase tracking-[0.12em]"].join(" ")}
          style={{ color: homeColor }}
        >
          {homeNick}
        </span>
        <span />
        <span
          className={[nameOxanium.className, "truncate text-right text-[10px] font-extrabold uppercase tracking-[0.12em]"].join(" ")}
          style={{ color: awayColor }}
        >
          {awayNick}
        </span>
      </div>
      {table.rows.map((row) => (
        <div
          key={row.kind}
          className="flex flex-col gap-1 border-t border-white/[0.06] py-2"
        >
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <Cell
              side={row.home}
              edge={row.edgeTeamId === row.home.teamId}
              color={homeColor}
              align="start"
              lang={lang}
            />
            <span
              className={[jp.className, "max-w-[120px] text-center text-[12px] font-semibold leading-4 text-white/80"].join(" ")}
            >
              {L(lang, row.label)}
            </span>
            <Cell
              side={row.away}
              edge={row.edgeTeamId === row.away.teamId}
              color={awayColor}
              align="end"
              lang={lang}
            />
          </div>
          {(row.notes ?? []).map((n, i) => (
            <p
              key={i}
              className={[jp.className, "text-[11px] font-semibold leading-[15px]"].join(" ")}
              style={{ color: "rgba(251,113,133,0.85)" }}
            >
              · {L(lang, n)}
            </p>
          ))}
        </div>
      ))}
      <p
        className={[jp.className, "border-t border-white/[0.06] pt-1.5 text-[10px] font-semibold leading-[14px] text-white/40"].join(" ")}
      >
        {matchupTableCaption(table, lang)}
      </p>
    </div>
  );
}
