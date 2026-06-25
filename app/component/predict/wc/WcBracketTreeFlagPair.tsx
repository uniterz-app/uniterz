"use client";

import CountryFlag from "@/app/component/games/CountryFlag";
import {
  WC_TREE_FLAG_GAP,
  WC_TREE_FLAG_H,
  WC_TREE_FLAG_W,
  WC_TREE_SLOT_H,
  WC_TREE_SLOT_W,
} from "@/lib/wc/wc-bracket-tree-layout";

type Slot = { teamId: string | null; label: string };

type Props = {
  home: Slot;
  away: Slot;
  pickedWinner: string | null;
};

function FlagDot({
  teamId,
  selected = false,
}: {
  teamId: string;
  selected?: boolean;
}) {
  return (
    <CountryFlag
      teamId={teamId}
      className={[
        "aspect-4/3 shrink-0 w-8",
        selected ? "ring-2 ring-cyan-400/90 rounded-[2px]" : "",
      ].join(" ")}
      variant="inline"
    />
  );
}

export { WC_TREE_SLOT_W as WC_TREE_FLAG_PAIR_W, WC_TREE_SLOT_H as WC_TREE_FLAG_PAIR_H };

export default function WcBracketTreeFlagPair({
  home,
  away,
  pickedWinner,
}: Props) {
  const empty = !home.teamId && !away.teamId;

  if (empty) {
    return (
      <div
        className="border border-dashed border-cyan-400/15"
        style={{ width: WC_TREE_SLOT_W, height: WC_TREE_SLOT_H }}
        aria-hidden
      />
    );
  }

  if (pickedWinner) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: WC_TREE_SLOT_W, height: WC_TREE_SLOT_H }}
      >
        <FlagDot teamId={pickedWinner} selected />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center"
      style={{
        width: WC_TREE_SLOT_W,
        height: WC_TREE_SLOT_H,
        gap: WC_TREE_FLAG_GAP,
      }}
    >
      {home.teamId ? (
        <FlagDot teamId={home.teamId} />
      ) : (
        <span
          className="block shrink-0"
          style={{ width: WC_TREE_FLAG_W, height: WC_TREE_FLAG_H }}
          aria-hidden
        />
      )}
      {away.teamId ? (
        <FlagDot teamId={away.teamId} />
      ) : (
        <span
          className="block shrink-0"
          style={{ width: WC_TREE_FLAG_W, height: WC_TREE_FLAG_H }}
          aria-hidden
        />
      )}
    </div>
  );
}
