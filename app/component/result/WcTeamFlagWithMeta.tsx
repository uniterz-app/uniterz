"use client";

import CountryFlag from "@/app/component/games/CountryFlag";
import { matchScoreClass } from "@/lib/fonts";
import { formatWcDrawPotLabel, getWcDrawPot, resolveWcDrawPotColor } from "@/lib/wc/drawPots";

type Props = {
  teamId: string | null | undefined;
  compact?: boolean;
  flagClassName?: string;
};

/** 国旗の上 — 抽選ポット（Pot 1 など）+ 国旗 */
export default function WcTeamFlagWithMeta({
  teamId,
  compact = false,
  flagClassName,
}: Props) {
  const pot = getWcDrawPot(teamId);
  const potLabel = pot != null ? formatWcDrawPotLabel(pot) : null;
  const potColor = pot != null ? resolveWcDrawPotColor(pot) : null;

  return (
    <div className="flex flex-col items-center">
      {potLabel && potColor ? (
        <span
          className={[
            matchScoreClass,
            potColor.webClassName,
            "mb-0.5",
            compact ? "text-[10px]" : "text-[11px] md:text-[15px]",
          ].join(" ")}
        >
          {potLabel}
        </span>
      ) : null}
      <CountryFlag teamId={teamId} className={flagClassName} />
    </div>
  );
}
