"use client";

import { Crown } from "lucide-react";
import {
  WC_TREE_CHAMPION_CARD_H,
  WC_TREE_CHAMPION_CARD_W,
} from "@/lib/wc/wc-bracket-tree-layout";
import { teamIdToCountryName, teamIdToWcCountry } from "@/lib/wc/wcCountry";

type Props = {
  teamId: string;
};

/** WC ブラケットツリー — 優勝国国旗 + 王冠（外枠なし） */
export default function WcChampionCard({ teamId }: Props) {
  const iso2 = teamIdToWcCountry(teamId)?.iso2.toLowerCase() ?? null;
  const flagAlt = teamIdToCountryName(teamId, "en") ?? "Champion flag";

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ width: WC_TREE_CHAMPION_CARD_W }}
    >
      <div
        className="absolute"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          bottom: "100%",
          marginBottom: 5,
        }}
      >
        <Crown
          size={21}
          strokeWidth={2.4}
          className="text-amber-300"
          style={{
            filter: "drop-shadow(0 0 6px rgba(251,191,36,0.65))",
          }}
          aria-hidden
        />
      </div>

      <div
        className="wc-champion-card__flag overflow-hidden rounded-[2px]"
        style={{
          width: WC_TREE_CHAMPION_CARD_W,
          height: WC_TREE_CHAMPION_CARD_H,
        }}
      >
        {iso2 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/flags/4x3/${iso2}.svg`}
            alt={flagAlt}
            draggable={false}
            loading="lazy"
            decoding="async"
            className="wc-champion-card__flag-img"
          />
        ) : null}
      </div>
    </div>
  );
}
