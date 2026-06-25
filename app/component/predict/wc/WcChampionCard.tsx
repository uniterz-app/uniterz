"use client";

import { Crown } from "lucide-react";
import CountryFlag from "@/app/component/games/CountryFlag";
import {
  WC_TREE_CHAMPION_CARD_H,
  WC_TREE_CHAMPION_CARD_W,
} from "@/lib/wc/wc-bracket-tree-layout";

type Props = {
  teamId: string;
};

/** WC ブラケットツリー — 優勝国国旗を包むチャンピオンカード */
export default function WcChampionCard({ teamId }: Props) {
  return (
    <div
      className="relative flex flex-col items-center"
      style={{ width: WC_TREE_CHAMPION_CARD_W }}
    >
      <div
        className="absolute flex flex-col items-center gap-0.5"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          bottom: "100%",
          marginBottom: 5,
        }}
      >
        <Crown
          size={17}
          strokeWidth={2.4}
          className="text-amber-300"
          style={{
            filter: "drop-shadow(0 0 6px rgba(251,191,36,0.65))",
          }}
          aria-hidden
        />
        <div
          className="font-black tracking-[0.1em] text-amber-300"
          style={{
            fontSize: 15,
            lineHeight: 1,
            textShadow:
              "0 0 4px rgba(251,191,36,0.85), 0 0 12px rgba(251,191,36,0.45)",
          }}
        >
          CHAMPION
        </div>
      </div>

      <div
        className="wc-champion-card relative flex items-center justify-center overflow-hidden"
        style={{
          width: WC_TREE_CHAMPION_CARD_W,
          height: WC_TREE_CHAMPION_CARD_H,
        }}
      >
        <div className="wc-champion-card__inner relative overflow-hidden">
          <CountryFlag
            teamId={teamId}
            variant="inline"
            className="block! h-full! w-full! ring-0!"
          />
        </div>
      </div>
    </div>
  );
}
