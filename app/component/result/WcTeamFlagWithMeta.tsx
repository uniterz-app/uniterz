"use client";

import CountryFlag from "@/app/component/games/CountryFlag";
import { matchScoreClass } from "@/lib/fonts";
import { resolveWcTeamFlagMeta } from "@/lib/wc/wcTeamFlagMeta";

type Props = {
  teamId: string | null | undefined;
  compact?: boolean;
  flagClassName?: string;
  /** ノックアウトステージ — Pot の代わりに 1F / 2D などを表示 */
  knockout?: boolean;
};

export default function WcTeamFlagWithMeta({
  teamId,
  compact = false,
  flagClassName,
  knockout = false,
}: Props) {
  const meta = resolveWcTeamFlagMeta(teamId, { knockout });

  return (
    <div className="flex flex-col items-center">
      {meta ? (
        <span
          className={[
            matchScoreClass,
            meta.kind === "pot"
              ? meta.potColor.webClassName
              : "text-cyan-100/88",
            "mb-0.5",
            compact ? "text-[10px]" : "text-[11px] md:text-[15px]",
          ].join(" ")}
        >
          {meta.label}
        </span>
      ) : null}
      <CountryFlag teamId={teamId} className={flagClassName} />
    </div>
  );
}
