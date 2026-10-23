"use client";

/** チャットの試合回答。試合一覧の線枠カードと同じ並び */
import HalftoneJerseyMark from "@/app/component/games/HalftoneJerseyMark";
import MatchListLineFrame from "@/app/component/games/MatchListLineFrame";
import { getGamesTexts } from "@/apps/native/src/features/games/gamesI18n";
import { nameBebas, nameOxanium } from "@/lib/fonts";
import type { NbaAskGameCard } from "@/lib/nba/ask/nbaAskBoard";
import { getTeamJerseyPrimaryColor, getTeamJerseySecondaryColor } from "@/lib/team-colors";

function ctaLabel(status: string, language: string): string {
  if (status === "final") return "FINAL";
  const copy = getGamesTexts(language);
  return status === "live" ? copy.live : copy.predict;
}

function Side({
  label,
  teamId,
  name,
  record,
}: {
  label: string;
  teamId: string;
  name: string;
  record: string;
}) {
  return (
    <div className="flex min-h-[4.5rem] flex-1 flex-col items-center">
      <div className="mt-0.5 flex flex-col items-center gap-0.5">
        <span className={`${nameBebas.className} text-[13px] uppercase leading-[15px] tracking-[0.06em] text-white/85`}>
          {label}
        </span>
        <HalftoneJerseyMark
          accent={getTeamJerseyPrimaryColor("nba", teamId)}
          accentEnd={getTeamJerseySecondaryColor("nba", teamId)}
          className="jersey-icon h-[3.375rem] w-[3.375rem]"
          glow="none"
          enableDotReveal={false}
          density="coarse"
        />
      </div>
      <div className="mt-0.5 flex flex-col items-center">
        <span
          className={`${nameOxanium.className} mt-1 text-center text-[13px] font-semibold uppercase leading-[15px] tracking-[0.05em] text-[#f4f7ff]`}
          style={{ transform: "skewX(-6deg)" }}
        >
          {name}
        </span>
        <span className={`${nameOxanium.className} text-[11px] font-bold leading-none tracking-[0.02em] text-slate-200/70`}>
          {record}
        </span>
      </div>
    </div>
  );
}

export default function AskGameCard({
  game,
  language,
  onPress,
}: {
  game: NbaAskGameCard;
  language: string;
  onPress?: () => void;
}) {
  const scored =
    game.scoreHome != null &&
    game.scoreAway != null &&
    (game.status === "final" || game.status === "live");
  const label = ctaLabel(game.status, language);
  return (
    <MatchListLineFrame
      pickup={game.pickup}
      leftLabel={game.pickup ? "PICK UP" : undefined}
      topLabel={game.round || undefined}
      bottomLabel={label}
      onClick={onPress ? () => onPress() : undefined}
    >
      <div className="flex items-stretch gap-1 px-2 pb-[18px] pt-5">
        <Side label="HOME" teamId={game.homeTeamId} name={game.homeName} record={game.homeRecord} />
        <div className="flex flex-[1.05] items-center justify-center pt-px">
          {scored ? (
            <span className={`${nameOxanium.className} text-[18px] font-black italic text-white`}>
              {game.scoreHome}
              <span className="mx-2 text-white/70">–</span>
              {game.scoreAway}
            </span>
          ) : (
            <span
              className={`${nameOxanium.className} text-center text-[24px] font-bold leading-[26px] tracking-[0.01em] text-[rgba(239,245,255,0.96)]`}
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.45)" }}
            >
              {game.start}
            </span>
          )}
        </div>
        <Side label="AWAY" teamId={game.awayTeamId} name={game.awayName} record={game.awayRecord} />
      </div>
    </MatchListLineFrame>
  );
}
