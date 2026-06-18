"use client";

import CountryFlag from "@/app/component/games/CountryFlag";
import { matchScoreClass } from "@/lib/fonts";
import { formatWcDrawPotLabel, getWcDrawPot } from "@/lib/wc/drawPots";

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

  return (
    <div className="flex flex-col items-center">
      {potLabel ? (
        <span
          className={[
            matchScoreClass,
            "mb-0.5 opacity-85",
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
