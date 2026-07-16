"use client";

import { useMemo, useState } from "react";
import HalftoneJerseyMark from "@/app/component/games/HalftoneJerseyMark";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import type { NbaConferenceId } from "@/lib/nba/nbaConferenceTeams";
import { NBA_STANDINGS_RANKS } from "@/lib/nba/nbaConferenceTeams";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { nameOxanium } from "@/lib/fonts";
import {
  assignTeamToRank,
  availableTeamIds,
  clearRank,
  filledRankCount,
  firstEmptyRank,
  isConferenceComplete,
  type NbaConferenceStandingsPicks,
  type NbaSeasonStandingsPrediction,
  type NbaStandingsRank,
  SEASON_STANDINGS_SCORE_PREVIEW,
} from "@/lib/predict/nbaSeasonStandingsPredict";
import { TEAM_SHORT } from "@/lib/team-short";
import {
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
  softenTeamUiColor,
} from "@/lib/team-colors";

type Props = {
  value: NbaSeasonStandingsPrediction;
  onChange: (next: NbaSeasonStandingsPrediction) => void;
  onSubmit?: () => void;
  submitDisabled?: boolean;
  className?: string;
};

type StandingsBand = "straight" | "playin" | "out";

function bandForRank(rank: NbaStandingsRank): StandingsBand {
  if (rank <= 6) return "straight";
  if (rank <= 10) return "playin";
  return "out";
}

function fullName(teamId: string): string {
  const full = NBA_TEAM_NAME_BY_ID[teamId];
  if (full) return full.toUpperCase();
  return (TEAM_SHORT[teamId] ?? teamId).toUpperCase();
}

function abbr(teamId: string): string {
  return (TEAM_SHORT[teamId] ?? "—").toUpperCase();
}

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return `rgba(0,245,255,${alpha})`;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function ZoneDivider({
  label,
  tone,
}: {
  label: string;
  tone: StandingsBand;
}) {
  const line =
    tone === "straight"
      ? "border-cyan-300/20"
      : tone === "playin"
        ? "border-amber-300/18"
        : "border-white/10";
  const text =
    tone === "straight"
      ? "text-cyan-200/45"
      : tone === "playin"
        ? "text-amber-200/40"
        : "text-white/28";

  return (
    <div className="flex items-center gap-2 py-1.5" role="separator">
      <div className={`h-px flex-1 border-t ${line}`} />
      <span
        className={[
          nameOxanium.className,
          "shrink-0 text-[8px] font-bold uppercase tracking-[0.16em]",
          text,
        ].join(" ")}
      >
        {label}
      </span>
      <div className={`h-px flex-1 border-t ${line}`} />
    </div>
  );
}

function RankRow({
  rank,
  teamId,
  selected,
  onSelect,
}: {
  rank: NbaStandingsRank;
  teamId: string | null | undefined;
  selected: boolean;
  onSelect: () => void;
}) {
  const primary = teamId
    ? softenTeamUiColor(getTeamJerseyPrimaryColor("nba", teamId))
    : "#00F5FF";
  const filled = Boolean(teamId);
  const band = bandForRank(rank);

  const rankTone =
    band === "straight"
      ? "text-cyan-200/70"
      : band === "playin"
        ? "text-amber-200/55"
        : "text-white/35";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        "flex w-full items-center gap-2.5 border px-2.5 py-2 text-left transition",
        selected
          ? "border-cyan-300/55 bg-cyan-300/[0.08]"
          : filled
            ? "border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.04]"
            : "border-dashed border-white/12 bg-transparent hover:border-white/22",
      ].join(" ")}
      style={
        filled && !selected
          ? {
              borderColor: hexToRgba(primary, 0.35),
              boxShadow: `inset 0 1px 0 ${hexToRgba(primary, 0.14)}`,
            }
          : undefined
      }
    >
      <span
        className={[
          nameOxanium.className,
          "w-6 shrink-0 text-[12px] font-black tabular-nums tracking-wide",
          rankTone,
        ].join(" ")}
      >
        {rank}
      </span>
      {filled && teamId ? (
        <>
          <HalftoneJerseyMark
            accent={getTeamJerseyPrimaryColor("nba", teamId)}
            accentEnd={getTeamJerseySecondaryColor("nba", teamId)}
            className="h-7 w-7 shrink-0"
            glow="none"
          />
          <span className="min-w-0 flex-1 truncate">
            <span
              className={[
                nameOxanium.className,
                "block text-[12px] font-extrabold uppercase tracking-[0.05em] text-white",
              ].join(" ")}
            >
              {fullName(teamId)}
            </span>
            {selected ? (
              <span className="text-[9px] font-bold text-white/32">
                tap again to clear
              </span>
            ) : null}
          </span>
        </>
      ) : (
        <span
          className={[
            nameOxanium.className,
            "text-[10px] font-bold uppercase tracking-[0.14em] text-white/28",
          ].join(" ")}
        >
          {selected ? "pick a team below" : "tap to assign"}
        </span>
      )}
    </button>
  );
}

/** 未使用チームだけが出るスロット列 */
function TeamSlotTray({
  teamIds,
  onPick,
}: {
  teamIds: string[];
  onPick: (teamId: string) => void;
}) {
  if (teamIds.length === 0) {
    return (
      <p className="px-1 py-2 text-[11px] text-white/35">
        全チーム配置済み
      </p>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-5">
      {teamIds.map((teamId) => {
        const primary = softenTeamUiColor(
          getTeamJerseyPrimaryColor("nba", teamId)
        );
        return (
          <button
            key={teamId}
            type="button"
            onClick={() => onPick(teamId)}
            className="flex flex-col items-center gap-1 border px-1 py-1.5 transition hover:brightness-110 active:scale-[0.97]"
            style={{
              borderColor: hexToRgba(primary, 0.4),
              background: hexToRgba(primary, 0.07),
              transform: "skewX(-6deg)",
            }}
          >
            <span style={{ transform: "skewX(6deg)" }}>
              <HalftoneJerseyMark
                accent={getTeamJerseyPrimaryColor("nba", teamId)}
                accentEnd={getTeamJerseySecondaryColor("nba", teamId)}
                className="h-8 w-8 shrink-0"
                glow="none"
              />
            </span>
            <span
              className={[
                nameOxanium.className,
                "text-[9px] font-extrabold uppercase tracking-[0.04em] text-white/85",
              ].join(" ")}
              style={{ transform: "skewX(6deg)" }}
            >
              {abbr(teamId)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ConferenceBoard({
  conference,
  picks,
  onPicksChange,
}: {
  conference: NbaConferenceId;
  picks: NbaConferenceStandingsPicks;
  onPicksChange: (next: NbaConferenceStandingsPicks) => void;
}) {
  const [selectedRank, setSelectedRank] = useState<NbaStandingsRank | null>(
    null
  );

  const available = useMemo(() => {
    const ids = availableTeamIds(conference, picks);
    return [...ids].sort((a, b) => {
      const na = NBA_TEAM_NAME_BY_ID[a] ?? TEAM_SHORT[a] ?? a;
      const nb = NBA_TEAM_NAME_BY_ID[b] ?? TEAM_SHORT[b] ?? b;
      return na.localeCompare(nb, "en", { sensitivity: "base" });
    });
  }, [conference, picks]);
  const filled = filledRankCount(picks);
  const complete = isConferenceComplete(picks);

  const place = (teamId: string) => {
    if (selectedRank == null) return;
    const result = assignTeamToRank(conference, picks, selectedRank, teamId);
    if (!result.ok) return;
    onPicksChange(result.picks);
    const nextEmpty = firstEmptyRank(result.picks);
    setSelectedRank(nextEmpty);
  };

  const onRankTap = (rank: NbaStandingsRank) => {
    if (selectedRank === rank) {
      if (picks[rank]) {
        onPicksChange(clearRank(picks, rank));
        setSelectedRank(rank);
        return;
      }
      setSelectedRank(null);
      return;
    }
    setSelectedRank(rank);
  };

  const ranks = Array.from(
    { length: NBA_STANDINGS_RANKS },
    (_, i) => (i + 1) as NbaStandingsRank
  );

  const renderRankBlock = (list: NbaStandingsRank[]) =>
    list.map((rank) => (
      <div key={rank} className="space-y-1.5">
        <RankRow
          rank={rank}
          teamId={picks[rank]}
          selected={selectedRank === rank}
          onSelect={() => onRankTap(rank)}
        />
        {selectedRank === rank ? (
          <div className="border border-cyan-300/20 bg-[rgba(4,10,16,0.92)] px-2 py-2">
            <p
              className={[
                nameOxanium.className,
                "mb-1.5 text-[8px] font-extrabold uppercase tracking-[0.14em] text-cyan-200/50",
              ].join(" ")}
            >
              Team slots · #{rank}
              <span className="text-white/30">
                {" "}
                · {available.length} left
              </span>
            </p>
            <TeamSlotTray teamIds={available} onPick={place} />
          </div>
        ) : null}
      </div>
    ));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <p
          className={[
            nameOxanium.className,
            "text-[10px] font-bold uppercase tracking-[0.16em] text-white/45",
          ].join(" ")}
        >
          {conference === "east" ? "Eastern" : "Western"} · 1–15
        </p>
        <p
          className={[
            nameOxanium.className,
            "text-[10px] font-extrabold tabular-nums tracking-wide",
            complete ? "text-[#2DFF6E]/85" : "text-cyan-200/70",
          ].join(" ")}
        >
          {filled}/{NBA_STANDINGS_RANKS}
        </p>
      </div>

      <ZoneDivider label="Straight in · 1–6" tone="straight" />
      <div className="flex flex-col gap-1">{renderRankBlock(ranks.slice(0, 6))}</div>

      <ZoneDivider label="Play-in · 7–10" tone="playin" />
      <div className="flex flex-col gap-1">{renderRankBlock(ranks.slice(6, 10))}</div>

      <ZoneDivider label="Out · 11–15" tone="out" />
      <div className="flex flex-col gap-1">{renderRankBlock(ranks.slice(10))}</div>

      <p className="pt-1 text-[10px] leading-relaxed text-white/30">
        順位をタップ → 下にチームスロット。配置済みはスロットから消えます。同じ順位をもう一度タップでクリア。
      </p>
    </div>
  );
}

/** シーズン順位予想ボード（プレビュー / 将来の本番フォーム共通） */
export default function NbaSeasonStandingsPredictPanel({
  value,
  onChange,
  onSubmit,
  submitDisabled,
  className,
}: Props) {
  const [conference, setConference] = useState<NbaConferenceId>("east");
  const eastDone = isConferenceComplete(value.east);
  const westDone = isConferenceComplete(value.west);
  const allDone = eastDone && westDone;

  return (
    <div
      className={[
        "rounded-[2px] border border-cyan-300/20 bg-[rgba(6,10,16,0.96)] p-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="mb-3 space-y-1">
        <h2
          className={[
            nameOxanium.className,
            "text-[13px] font-extrabold uppercase tracking-[0.14em] text-cyan-200",
          ].join(" ")}
        >
          Season standings · {value.season}
        </h2>
        <p className="text-[11px] leading-relaxed text-white/45">
          1–6 ストレートイン / 7–10 プレーイン / 11–15 圏外。シーズン終了後に採点。
          仮: 完全一致 +{SEASON_STANDINGS_SCORE_PREVIEW.exact} · ±1 +
          {SEASON_STANDINGS_SCORE_PREVIEW.within1} · ±2 +
          {SEASON_STANDINGS_SCORE_PREVIEW.within2}。
        </p>
      </header>

      <div className="mb-3">
        <CyberSlantedTabBar fill aria-label="Conference">
          <CyberSlantedTab
            role="tab"
            label={eastDone ? "EAST ✓" : "EAST"}
            active={conference === "east"}
            onClick={() => setConference("east")}
            compact
            fontWeight={900}
          />
          <CyberSlantedTab
            role="tab"
            label={westDone ? "WEST ✓" : "WEST"}
            active={conference === "west"}
            onClick={() => setConference("west")}
            compact
            fontWeight={900}
          />
        </CyberSlantedTabBar>
      </div>

      {conference === "east" ? (
        <ConferenceBoard
          conference="east"
          picks={value.east}
          onPicksChange={(east) => onChange({ ...value, east })}
        />
      ) : (
        <ConferenceBoard
          conference="west"
          picks={value.west}
          onPicksChange={(west) => onChange({ ...value, west })}
        />
      )}

      <div className="mt-4 flex flex-col gap-2 border-t border-white/8 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={[
            nameOxanium.className,
            "text-[10px] font-bold uppercase tracking-[0.12em]",
            allDone ? "text-[#2DFF6E]/85" : "text-white/40",
          ].join(" ")}
        >
          {allDone
            ? "Ready to submit · East + West complete"
            : `Progress · E ${filledRankCount(value.east)}/15 · W ${filledRankCount(value.west)}/15`}
        </p>
        <button
          type="button"
          disabled={submitDisabled || !allDone}
          onClick={onSubmit}
          className={[
            nameOxanium.className,
            "px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em] transition",
            allDone && !submitDisabled
              ? "border border-cyan-300/50 bg-cyan-300/20 text-cyan-50 hover:bg-cyan-300/28"
              : "cursor-not-allowed border border-white/10 bg-white/[0.04] text-white/30",
          ].join(" ")}
        >
          Submit prediction
        </button>
      </div>
    </div>
  );
}
